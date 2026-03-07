<?php

namespace App\Http\Controllers;

use App\Models\Sim;
use App\Models\SimBalanceHistory;
use App\Models\Transaction;
use App\Models\TransactionCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class TransactionController extends Controller
{
    /**
     * Display a listing of transactions with server-side search and pagination (20 per page).
     */
    public function index(Request $request): Response
    {
        $query = Transaction::query()
            ->with(['transactionCategory', 'sim'])
            ->orderBy('date', 'desc')
            ->orderBy('created_at', 'desc');

        if ($request->filled('search')) {
            $term = '%'.$request->search.'%';
            $driver = DB::connection()->getDriverName();
            $castType = $driver === 'sqlite' ? 'TEXT' : 'CHAR';

            $query->where(function ($q) use ($term, $castType) {
                $q->where('transactions.customer_number', 'like', $term)
                    ->orWhere('transactions.note', 'like', $term)
                    ->orWhereHas('sim', function ($q2) use ($term) {
                        $q2->where('name', 'like', $term)
                            ->orWhere('sim_number', 'like', $term);
                    })
                    ->orWhereHas('transactionCategory', function ($q2) use ($term) {
                        $q2->where('name', 'like', $term);
                    })
                    ->orWhereRaw("CAST(transactions.amount AS {$castType}) LIKE ?", [$term])
                    ->orWhereRaw("CAST(COALESCE(transactions.commission, 0) AS {$castType}) LIKE ?", [$term])
                    ->orWhereRaw("CAST(COALESCE(transactions.fee, 0) AS {$castType}) LIKE ?", [$term]);
            });
        }

        if ($request->filled('month')) {
            $month = $request->month;
            if (preg_match('/^(\d{4})-(\d{2})$/', $month, $m)) {
                $query->whereYear('date', (int) $m[1])
                    ->whereMonth('date', (int) $m[2]);
            }
        }

        $paginator = $query->paginate(20)->withQueryString();

        $paginator->through(fn (Transaction $t) => [
            'id' => $t->id,
            'category_name' => $t->transactionCategory->name,
            'type' => $t->transactionCategory->type,
            'type_label' => TransactionCategory::TYPES[$t->transactionCategory->type] ?? $t->transactionCategory->type,
            'sim_id' => $t->sim_id,
            'sim_number' => $t->sim?->sim_number,
            'sim_name' => $t->sim?->name,
            'customer_number' => $t->customer_number,
            'amount' => $t->amount,
            'commission' => $t->commission,
            'fee' => $t->fee,
            'date' => $t->date->format('d/m/Y'),
            'note' => $t->note,
            'status' => $t->status,
            'status_label' => Transaction::STATUSES[$t->status] ?? $t->status,
            'created_at' => $t->created_at->format('d/m/Y H:i'),
        ]);

        return Inertia::render('transactions/index', [
            'transactions' => $paginator,
            'filters' => [
                'search' => $request->search,
                'month' => $request->month,
            ],
        ]);
    }

    /**
     * Return search suggestions for transactions (customer number only).
     */
    public function searchSuggestions(Request $request): \Illuminate\Http\JsonResponse
    {
        $q = $request->input('q', '');
        $q = trim($q);
        if (strlen($q) < 1) {
            return response()->json(['suggestions' => []]);
        }

        $term = '%'.$q.'%';
        $suggestions = Transaction::query()
            ->whereNotNull('customer_number')
            ->where('customer_number', '!=', '')
            ->where('customer_number', 'like', $term)
            ->distinct()
            ->limit(15)
            ->pluck('customer_number')
            ->all();

        return response()->json(['suggestions' => array_values($suggestions)]);
    }

    /**
     * Show the form for creating a new transaction.
     */
    public function create(): Response
    {
        $categories = TransactionCategory::query()
            ->orderBy('name')
            ->get()
            ->map(fn (TransactionCategory $c) => [
                'id' => $c->id,
                'name' => $c->name,
                'type' => $c->type,
                'type_label' => TransactionCategory::TYPES[$c->type] ?? $c->type,
            ]);

        $sims = Sim::query()
            ->where('status', 'active')
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(fn (Sim $s) => [
                'id' => $s->id,
                'sim_number' => $s->sim_number,
                'sim_name' => $s->name,
                'operator_label' => Sim::OPERATORS[$s->operator] ?? $s->operator,
            ]);

        return Inertia::render('transactions/create', [
            'categories' => $categories,
            'sims' => $sims,
        ]);
    }

    /**
     * Store a newly created transaction.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'transaction_category_id' => ['required', 'exists:transaction_categories,id'],
            'sim_id' => ['nullable', 'exists:sims,id'],
            'customer_number' => ['nullable', 'string', 'max:100'],
            'amount' => ['required', 'numeric', 'min:0'],
            'date' => ['required', 'date'],
            'note' => ['nullable', 'string', 'max:1000'],
            'commission' => ['nullable', 'numeric', 'min:0'],
            'commission_sim_id' => ['nullable', 'exists:sims,id'],
            'fee' => ['nullable', 'numeric', 'min:0'],
            'status' => ['nullable', 'string', 'in:pending,success'],
        ]);
        $validated['status'] = $validated['status'] ?? Transaction::STATUS_SUCCESS;

        $category = TransactionCategory::find($validated['transaction_category_id']);
        $feeAmount = isset($validated['fee']) ? (float) $validated['fee'] : 0;
        if ($category->type === 'debit') {
            if (empty($validated['sim_id'])) {
                return redirect()->back()->withErrors([
                    'sim_id' => 'ডেবিট লেনদেনের জন্য সিম নির্বাচন বাধ্যতামূলক।',
                ])->withInput();
            }
        }

        DB::transaction(function () use ($validated, $category) {
            $t = Transaction::create($validated);
            $this->applyBalanceChangesForTransaction($t, $validated['date'], $validated['note'] ?? '');
        });

        return redirect()->route('transactions.index')->with('status', 'লেনদেন সফলভাবে যোগ করা হয়েছে।');
    }

    /**
     * Store multiple transactions at once.
     */
    public function storeBulk(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'transactions' => ['required', 'array', 'min:1'],
            'transactions.*.transaction_category_id' => ['required', 'exists:transaction_categories,id'],
            'transactions.*.sim_id' => ['nullable', 'exists:sims,id'],
            'transactions.*.customer_number' => ['nullable', 'string', 'max:100'],
            'transactions.*.amount' => ['required', 'numeric', 'min:0'],
            'transactions.*.date' => ['required', 'date'],
            'transactions.*.note' => ['nullable', 'string', 'max:1000'],
            'transactions.*.commission' => ['nullable', 'numeric', 'min:0'],
            'transactions.*.commission_sim_id' => ['nullable', 'exists:sims,id'],
            'transactions.*.fee' => ['nullable', 'numeric', 'min:0'],
            'transactions.*.status' => ['nullable', 'string', 'in:pending,success'],
        ]);

        $feeAmounts = [];
        foreach ($validated['transactions'] as $index => $row) {
            $category = TransactionCategory::find($row['transaction_category_id']);
            $feeAmounts[$index] = isset($row['fee']) ? (float) $row['fee'] : 0;
            if ($category->type === 'debit') {
                if (empty($row['sim_id'])) {
                    return redirect()->back()->withErrors([
                        'transactions' => 'সারি '.($index + 1).': ডেবিট লেনদেনের জন্য সিম নির্বাচন বাধ্যতামূলক।',
                    ])->withInput();
                }
            }
        }

        DB::transaction(function () use ($validated) {
            foreach ($validated['transactions'] as $row) {
                $row['status'] = $row['status'] ?? Transaction::STATUS_SUCCESS;
                $category = TransactionCategory::find($row['transaction_category_id']);
                $t = Transaction::create($row);

                if ($category->type === 'debit' && ! empty($row['sim_id'])) {
                    $sim = Sim::find($row['sim_id']);
                    $balanceAfter = $sim->balance - (float) $row['amount'];
                    $sim->update(['balance' => $balanceAfter]);
                    SimBalanceHistory::create([
                        'sim_id' => $sim->id,
                        'type' => 'deduct',
                        'amount' => (float) $row['amount'],
                        'balance_after' => $balanceAfter,
                        'date' => $row['date'],
                        'note' => 'লেনদেন #'.$t->id.(! empty($row['note']) ? ' — '.$row['note'] : ''),
                    ]);
                }

                if ($category->type === 'credit' && ! empty($row['sim_id'])) {
                    $sim = Sim::find($row['sim_id']);
                    $sim->refresh();
                    $balanceAfter = $sim->balance + (float) $row['amount'];
                    $sim->update(['balance' => $balanceAfter]);
                    SimBalanceHistory::create([
                        'sim_id' => $sim->id,
                        'type' => 'add',
                        'amount' => (float) $row['amount'],
                        'balance_after' => $balanceAfter,
                        'date' => $row['date'],
                        'note' => 'লেনদেন #'.$t->id.(! empty($row['note']) ? ' — '.$row['note'] : ''),
                    ]);
                }

                $commissionAmount = isset($row['commission']) ? (float) $row['commission'] : 0;
                $commissionSimId = $row['commission_sim_id'] ?? null;
                if ($commissionAmount > 0) {
                    if (empty($commissionSimId) && ! empty($row['sim_id'])) {
                        $commissionSimId = $row['sim_id'];
                    }
                    if (! empty($commissionSimId)) {
                        $commissionSim = Sim::find($commissionSimId);
                        if ($commissionSim) {
                            $commissionSim->refresh();
                            $balanceAfter = $commissionSim->balance + $commissionAmount;
                            $commissionSim->update(['balance' => $balanceAfter]);
                            SimBalanceHistory::create([
                                'sim_id' => $commissionSim->id,
                                'type' => 'add',
                                'amount' => $commissionAmount,
                                'balance_after' => $balanceAfter,
                                'date' => $row['date'],
                                'note' => 'কমিশন — লেনদেন #'.$t->id,
                            ]);
                            $t->update(['commission_sim_id' => $commissionSim->id]);
                        }
                    }
                }

                $feeAmount = isset($row['fee']) ? (float) $row['fee'] : 0;
                if ($feeAmount > 0 && ! empty($row['sim_id'])) {
                    $feeSim = Sim::find($row['sim_id']);
                    $feeSim->refresh();
                    $balanceAfter = $feeSim->balance - $feeAmount;
                    $feeSim->update(['balance' => $balanceAfter]);
                    SimBalanceHistory::create([
                        'sim_id' => $feeSim->id,
                        'type' => 'deduct',
                        'amount' => $feeAmount,
                        'balance_after' => $balanceAfter,
                        'date' => $row['date'],
                        'note' => 'ফি — লেনদেন #'.$t->id,
                    ]);
                }
            }
        });

        $count = count($validated['transactions']);
        $message = $count === 1
            ? 'লেনদেন সফলভাবে যোগ করা হয়েছে।'
            : "{$count}টি লেনদেন সফলভাবে যোগ করা হয়েছে।";

        return redirect()->route('transactions.index')->with('status', $message);
    }

    /**
     * Show the form for editing the specified transaction.
     */
    public function edit(Transaction $transaction): Response
    {
        $transaction->load(['transactionCategory', 'sim']);

        $categories = TransactionCategory::query()
            ->orderBy('name')
            ->get()
            ->map(fn (TransactionCategory $c) => [
                'id' => $c->id,
                'name' => $c->name,
                'type' => $c->type,
                'type_label' => TransactionCategory::TYPES[$c->type] ?? $c->type,
            ]);

        $sims = Sim::query()
            ->where('status', 'active')
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(fn (Sim $s) => [
                'id' => $s->id,
                'sim_number' => $s->sim_number,
                'sim_name' => $s->name,
                'operator_label' => Sim::OPERATORS[$s->operator] ?? $s->operator,
            ]);

        return Inertia::render('transactions/edit', [
            'transaction' => [
                'id' => $transaction->id,
                'transaction_category_id' => $transaction->transaction_category_id,
                'sim_id' => $transaction->sim_id,
                'customer_number' => $transaction->customer_number,
                'amount' => $transaction->amount,
                'date' => $transaction->date->format('Y-m-d'),
                'note' => $transaction->note,
                'commission' => $transaction->commission,
                'fee' => $transaction->fee,
                'status' => $transaction->status,
            ],
            'categories' => $categories,
            'sims' => $sims,
        ]);
    }

    /**
     * Update the specified transaction (with SIM balance reconciliation).
     */
    public function update(Request $request, Transaction $transaction): RedirectResponse
    {
        $validated = $request->validate([
            'transaction_category_id' => ['required', 'exists:transaction_categories,id'],
            'sim_id' => ['nullable', 'exists:sims,id'],
            'customer_number' => ['nullable', 'string', 'max:100'],
            'amount' => ['required', 'numeric', 'min:0'],
            'date' => ['required', 'date'],
            'note' => ['nullable', 'string', 'max:1000'],
            'commission' => ['nullable', 'numeric', 'min:0'],
            'commission_sim_id' => ['nullable', 'exists:sims,id'],
            'fee' => ['nullable', 'numeric', 'min:0'],
            'status' => ['nullable', 'string', 'in:pending,success'],
        ]);
        if (! array_key_exists('status', $validated) || $validated['status'] === null) {
            $validated['status'] = $transaction->status;
        }

        $transaction->load('transactionCategory');
        $oldCategory = $transaction->transactionCategory;
        $oldAmount = (float) $transaction->amount;
        $oldSimId = $transaction->sim_id;
        $oldCommission = (float) ($transaction->commission ?? 0);
        $oldCommissionSimId = $transaction->commission_sim_id;
        $oldFee = (float) ($transaction->fee ?? 0);
        $newFeeAmount = isset($validated['fee']) ? (float) $validated['fee'] : 0;

        $newCategory = TransactionCategory::find($validated['transaction_category_id']);
        if ($newCategory->type === 'debit') {
            if (empty($validated['sim_id'])) {
                return redirect()->back()->withErrors([
                    'sim_id' => 'ডেবিট লেনদেনের জন্য সিম নির্বাচন বাধ্যতামূলক।',
                ])->withInput();
            }
        }

        DB::transaction(function () use ($transaction, $validated, $oldCategory, $oldAmount, $oldSimId, $oldCommission, $oldCommissionSimId, $oldFee, $newFeeAmount) {
            if ($oldCategory->type === 'debit' && ! empty($oldSimId)) {
                $oldSim = Sim::find($oldSimId);
                if ($oldSim) {
                    $oldSim->refresh();
                    $balanceAfter = $oldSim->balance + $oldAmount;
                    $oldSim->update(['balance' => $balanceAfter]);
                    SimBalanceHistory::create([
                        'sim_id' => $oldSim->id,
                        'type' => 'add',
                        'amount' => $oldAmount,
                        'balance_after' => $balanceAfter,
                        'date' => $transaction->date->format('Y-m-d'),
                        'note' => 'লেনদেন #'.$transaction->id.' সম্পাদনা — পূর্বের বিয়োগ ফেরত',
                    ]);
                }
            }

            if ($oldCategory->type === 'credit' && ! empty($oldSimId)) {
                $oldSim = Sim::find($oldSimId);
                if ($oldSim) {
                    $oldSim->refresh();
                    $balanceAfter = $oldSim->balance - $oldAmount;
                    $oldSim->update(['balance' => $balanceAfter]);
                    SimBalanceHistory::create([
                        'sim_id' => $oldSim->id,
                        'type' => 'deduct',
                        'amount' => $oldAmount,
                        'balance_after' => $balanceAfter,
                        'date' => $transaction->date->format('Y-m-d'),
                        'note' => 'লেনদেন #'.$transaction->id.' সম্পাদনা — পূর্বের ক্রেডিট ফেরত',
                    ]);
                }
            }

            if ($oldCommission > 0 && ! empty($oldCommissionSimId)) {
                $oldCommissionSim = Sim::find($oldCommissionSimId);
                if ($oldCommissionSim) {
                    $oldCommissionSim->refresh();
                    $balanceAfter = $oldCommissionSim->balance - $oldCommission;
                    $oldCommissionSim->update(['balance' => $balanceAfter]);
                    SimBalanceHistory::create([
                        'sim_id' => $oldCommissionSim->id,
                        'type' => 'deduct',
                        'amount' => $oldCommission,
                        'balance_after' => $balanceAfter,
                        'date' => $transaction->date->format('Y-m-d'),
                        'note' => 'লেনদেন #'.$transaction->id.' সম্পাদনা — পূর্বের কমিশন ফেরত',
                    ]);
                }
            }

            if ($oldFee > 0 && ! empty($oldSimId)) {
                $oldSim = Sim::find($oldSimId);
                if ($oldSim) {
                    $oldSim->refresh();
                    $balanceAfter = $oldSim->balance + $oldFee;
                    $oldSim->update(['balance' => $balanceAfter]);
                    SimBalanceHistory::create([
                        'sim_id' => $oldSim->id,
                        'type' => 'add',
                        'amount' => $oldFee,
                        'balance_after' => $balanceAfter,
                        'date' => $transaction->date->format('Y-m-d'),
                        'note' => 'লেনদেন #'.$transaction->id.' সম্পাদনা — পূর্বের ফি ফেরত',
                    ]);
                }
            }

            $transaction->update($validated);
            $newCategory = TransactionCategory::find($validated['transaction_category_id']);

            if ($newCategory->type === 'debit' && ! empty($validated['sim_id'])) {
                $sim = Sim::find($validated['sim_id']);
                $sim->refresh();
                $balanceAfter = $sim->balance - (float) $validated['amount'];
                $sim->update(['balance' => $balanceAfter]);
                SimBalanceHistory::create([
                    'sim_id' => $sim->id,
                    'type' => 'deduct',
                    'amount' => (float) $validated['amount'],
                    'balance_after' => $balanceAfter,
                    'date' => $validated['date'],
                    'note' => 'লেনদেন #'.$transaction->id.(! empty($validated['note']) ? ' — '.$validated['note'] : ''),
                ]);
            }

            if ($newCategory->type === 'credit' && ! empty($validated['sim_id'])) {
                $sim = Sim::find($validated['sim_id']);
                $sim->refresh();
                $balanceAfter = $sim->balance + (float) $validated['amount'];
                $sim->update(['balance' => $balanceAfter]);
                SimBalanceHistory::create([
                    'sim_id' => $sim->id,
                    'type' => 'add',
                    'amount' => (float) $validated['amount'],
                    'balance_after' => $balanceAfter,
                    'date' => $validated['date'],
                    'note' => 'লেনদেন #'.$transaction->id.(! empty($validated['note']) ? ' — '.$validated['note'] : ''),
                ]);
            }

            $commissionAmount = isset($validated['commission']) ? (float) $validated['commission'] : 0;
            $commissionSimId = $validated['commission_sim_id'] ?? null;
            if ($commissionAmount > 0) {
                if (empty($commissionSimId) && ! empty($validated['sim_id'])) {
                    $commissionSimId = $validated['sim_id'];
                }
                if (! empty($commissionSimId)) {
                    $commissionSim = Sim::find($commissionSimId);
                    if ($commissionSim) {
                        $commissionSim->refresh();
                        $balanceAfter = $commissionSim->balance + $commissionAmount;
                        $commissionSim->update(['balance' => $balanceAfter]);
                        SimBalanceHistory::create([
                            'sim_id' => $commissionSim->id,
                            'type' => 'add',
                            'amount' => $commissionAmount,
                            'balance_after' => $balanceAfter,
                            'date' => $validated['date'],
                            'note' => 'কমিশন — লেনদেন #'.$transaction->id,
                        ]);
                        $transaction->update(['commission_sim_id' => $commissionSim->id]);
                    }
                }
            }

            if ($newFeeAmount > 0 && ! empty($validated['sim_id'])) {
                $feeSim = Sim::find($validated['sim_id']);
                $feeSim->refresh();
                $balanceAfter = $feeSim->balance - $newFeeAmount;
                $feeSim->update(['balance' => $balanceAfter]);
                SimBalanceHistory::create([
                    'sim_id' => $feeSim->id,
                    'type' => 'deduct',
                    'amount' => $newFeeAmount,
                    'balance_after' => $balanceAfter,
                    'date' => $validated['date'],
                    'note' => 'ফি — লেনদেন #'.$transaction->id,
                ]);
            }
        });

        return redirect()->route('transactions.index')->with('status', 'লেনদেন সফলভাবে আপডেট করা হয়েছে।');
    }

    /**
     * Update transaction status (toggle between pending and success) from the list.
     */
    public function updateStatus(Request $request, Transaction $transaction): RedirectResponse
    {
        $validated = $request->validate(['status' => ['required', 'string', 'in:pending,success']]);
        $newStatus = $validated['status'];

        if ($transaction->status === $newStatus) {
            return redirect()->route('transactions.index')->with('status', 'স্ট্যাটাস একই আছে।');
        }

        DB::transaction(function () use ($transaction, $newStatus) {
            $transaction->update(['status' => $newStatus]);
        });

        $message = $newStatus === Transaction::STATUS_SUCCESS
            ? 'লেনদেন সফল হিসেবে আপডেট হয়েছে।'
            : 'লেনদেন পেন্ডিং হিসেবে আপডেট হয়েছে।';

        return redirect()->route('transactions.index')->with('status', $message);
    }

    /**
     * Apply SIM balance changes for a transaction (debit/credit, commission, fee).
     */
    private function applyBalanceChangesForTransaction(Transaction $t, string $date, string $note): void
    {
        $t->load('transactionCategory');
        $category = $t->transactionCategory;
        $amount = (float) $t->amount;
        $simId = $t->sim_id;
        $noteStr = 'লেনদেন #'.$t->id.($note ? ' — '.$note : '');

        if ($category->type === 'debit' && ! empty($simId)) {
            $sim = Sim::find($simId);
            if ($sim) {
                $sim->refresh();
                $balanceAfter = $sim->balance - $amount;
                $sim->update(['balance' => $balanceAfter]);
                SimBalanceHistory::create([
                    'sim_id' => $sim->id,
                    'type' => 'deduct',
                    'amount' => $amount,
                    'balance_after' => $balanceAfter,
                    'date' => $date,
                    'note' => $noteStr,
                ]);
            }
        }

        if ($category->type === 'credit' && ! empty($simId)) {
            $sim = Sim::find($simId);
            if ($sim) {
                $sim->refresh();
                $balanceAfter = $sim->balance + $amount;
                $sim->update(['balance' => $balanceAfter]);
                SimBalanceHistory::create([
                    'sim_id' => $sim->id,
                    'type' => 'add',
                    'amount' => $amount,
                    'balance_after' => $balanceAfter,
                    'date' => $date,
                    'note' => $noteStr,
                ]);
            }
        }

        $commissionAmount = (float) ($t->commission ?? 0);
        $commissionSimId = $t->commission_sim_id;
        if ($commissionAmount > 0) {
            if (empty($commissionSimId) && ! empty($simId)) {
                $commissionSimId = $simId;
            }
            if (! empty($commissionSimId)) {
                $commissionSim = Sim::find($commissionSimId);
                if ($commissionSim) {
                    $commissionSim->refresh();
                    $balanceAfter = $commissionSim->balance + $commissionAmount;
                    $commissionSim->update(['balance' => $balanceAfter]);
                    SimBalanceHistory::create([
                        'sim_id' => $commissionSim->id,
                        'type' => 'add',
                        'amount' => $commissionAmount,
                        'balance_after' => $balanceAfter,
                        'date' => $date,
                        'note' => 'কমিশন — লেনদেন #'.$t->id,
                    ]);
                    $t->update(['commission_sim_id' => $commissionSim->id]);
                }
            }
        }

        $feeAmount = (float) ($t->fee ?? 0);
        if ($feeAmount > 0 && ! empty($simId)) {
            $feeSim = Sim::find($simId);
            if ($feeSim) {
                $feeSim->refresh();
                $balanceAfter = $feeSim->balance - $feeAmount;
                $feeSim->update(['balance' => $balanceAfter]);
                SimBalanceHistory::create([
                    'sim_id' => $feeSim->id,
                    'type' => 'deduct',
                    'amount' => $feeAmount,
                    'balance_after' => $balanceAfter,
                    'date' => $date,
                    'note' => 'ফি — লেনদেন #'.$t->id,
                ]);
            }
        }
    }

    /**
     * Reverse SIM balance changes for a transaction (used when setting to pending or deleting).
     */
    private function reverseBalanceChangesForTransaction(Transaction $transaction): void
    {
        $transaction->load('transactionCategory');
        $category = $transaction->transactionCategory;
        $amount = (float) $transaction->amount;
        $simId = $transaction->sim_id;
        $commission = (float) ($transaction->commission ?? 0);
        $commissionSimId = $transaction->commission_sim_id;
        $fee = (float) ($transaction->fee ?? 0);
        $date = $transaction->date->format('Y-m-d');

        if ($category->type === 'debit' && ! empty($simId)) {
            $sim = Sim::find($simId);
            if ($sim) {
                $sim->refresh();
                $balanceAfter = $sim->balance + $amount;
                $sim->update(['balance' => $balanceAfter]);
                SimBalanceHistory::create([
                    'sim_id' => $sim->id,
                    'type' => 'add',
                    'amount' => $amount,
                    'balance_after' => $balanceAfter,
                    'date' => $date,
                    'note' => 'লেনদেন #'.$transaction->id.' — বিয়োগ ফেরত',
                ]);
            }
        }

        if ($category->type === 'credit' && ! empty($simId)) {
            $sim = Sim::find($simId);
            if ($sim) {
                $sim->refresh();
                $balanceAfter = $sim->balance - $amount;
                $sim->update(['balance' => $balanceAfter]);
                SimBalanceHistory::create([
                    'sim_id' => $sim->id,
                    'type' => 'deduct',
                    'amount' => $amount,
                    'balance_after' => $balanceAfter,
                    'date' => $date,
                    'note' => 'লেনদেন #'.$transaction->id.' — ক্রেডিট ফেরত',
                ]);
            }
        }

        if ($commission > 0 && ! empty($commissionSimId)) {
            $commissionSim = Sim::find($commissionSimId);
            if ($commissionSim) {
                $commissionSim->refresh();
                $balanceAfter = $commissionSim->balance - $commission;
                $commissionSim->update(['balance' => $balanceAfter]);
                SimBalanceHistory::create([
                    'sim_id' => $commissionSim->id,
                    'type' => 'deduct',
                    'amount' => $commission,
                    'balance_after' => $balanceAfter,
                    'date' => $date,
                    'note' => 'লেনদেন #'.$transaction->id.' — কমিশন ফেরত',
                ]);
            }
        }

        if ($fee > 0 && ! empty($simId)) {
            $feeSim = Sim::find($simId);
            if ($feeSim) {
                $feeSim->refresh();
                $balanceAfter = $feeSim->balance + $fee;
                $feeSim->update(['balance' => $balanceAfter]);
                SimBalanceHistory::create([
                    'sim_id' => $feeSim->id,
                    'type' => 'add',
                    'amount' => $fee,
                    'balance_after' => $balanceAfter,
                    'date' => $date,
                    'note' => 'লেনদেন #'.$transaction->id.' — ফি ফেরত',
                ]);
            }
        }
    }

    /**
     * Remove the specified transaction and reverse all SIM balance changes.
     */
    public function destroy(Transaction $transaction): RedirectResponse
    {
        DB::transaction(function () use ($transaction) {
            $this->reverseBalanceChangesForTransaction($transaction);
            $transaction->delete();
        });

        return redirect()->route('transactions.index')->with('status', 'লেনদেন সফলভাবে মুছে ফেলা হয়েছে।');
    }
}
