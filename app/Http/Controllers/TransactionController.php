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
            $query->where('customer_number', 'like', $term);
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
            'date' => $t->date->format('d/m/Y'),
            'note' => $t->note,
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

        $sims = Sim::query()->orderBy('sim_number')->get()->map(fn (Sim $s) => [
            'id' => $s->id,
            'sim_number' => $s->sim_number,
            'operator_label' => Sim::OPERATORS[$s->operator] ?? $s->operator,
            'balance' => $s->balance,
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
        ]);

        $category = TransactionCategory::find($validated['transaction_category_id']);
        if ($category->type === 'debit' && ! empty($validated['sim_id'])) {
            $sim = Sim::find($validated['sim_id']);
            if ($sim->balance < (float) $validated['amount']) {
                return redirect()->back()->withErrors([
                    'amount' => 'নির্বাচিত সিমে পর্যাপ্ত ব্যালেন্স নেই। বর্তমান ব্যালেন্স: '.$sim->balance,
                ])->withInput();
            }
        }

        DB::transaction(function () use ($validated, $category) {
            $t = Transaction::create($validated);

            if ($category->type === 'debit' && ! empty($validated['sim_id'])) {
                $sim = Sim::find($validated['sim_id']);
                $balanceAfter = $sim->balance - (float) $validated['amount'];
                $sim->update(['balance' => $balanceAfter]);
                SimBalanceHistory::create([
                    'sim_id' => $sim->id,
                    'type' => 'deduct',
                    'amount' => (float) $validated['amount'],
                    'balance_after' => $balanceAfter,
                    'date' => $validated['date'],
                    'note' => 'লেনদেন #'.$t->id.($validated['note'] ? ' — '.$validated['note'] : ''),
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
                            'note' => 'কমিশন — লেনদেন #'.$t->id,
                        ]);
                        $t->update(['commission_sim_id' => $commissionSim->id]);
                    }
                }
            }
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
        ]);

        foreach ($validated['transactions'] as $index => $row) {
            $category = TransactionCategory::find($row['transaction_category_id']);
            if ($category->type === 'debit' && ! empty($row['sim_id'])) {
                $sim = Sim::find($row['sim_id']);
                if ($sim->balance < (float) $row['amount']) {
                    return redirect()->back()->withErrors([
                        'transactions' => 'সারি '.($index + 1).': সিম '.$sim->sim_number.' এ পর্যাপ্ত ব্যালেন্স নেই (ব্যালেন্স: '.$sim->balance.')।',
                    ])->withInput();
                }
            }
        }

        DB::transaction(function () use ($validated) {
            foreach ($validated['transactions'] as $row) {
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

        $sims = Sim::query()->orderBy('sim_number')->get()->map(fn (Sim $s) => [
            'id' => $s->id,
            'sim_number' => $s->sim_number,
            'operator_label' => Sim::OPERATORS[$s->operator] ?? $s->operator,
            'balance' => $s->balance,
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
        ]);

        $transaction->load('transactionCategory');
        $oldCategory = $transaction->transactionCategory;
        $oldAmount = (float) $transaction->amount;
        $oldSimId = $transaction->sim_id;
        $oldCommission = (float) ($transaction->commission ?? 0);
        $oldCommissionSimId = $transaction->commission_sim_id;

        $newCategory = TransactionCategory::find($validated['transaction_category_id']);
        if ($newCategory->type === 'debit' && ! empty($validated['sim_id'])) {
            $sim = Sim::find($validated['sim_id']);
            if ($sim->balance < (float) $validated['amount']) {
                return redirect()->back()->withErrors([
                    'amount' => 'নির্বাচিত সিমে পর্যাপ্ত ব্যালেন্স নেই। বর্তমান ব্যালেন্স: '.$sim->balance,
                ])->withInput();
            }
        }

        DB::transaction(function () use ($transaction, $validated, $oldCategory, $oldAmount, $oldSimId, $oldCommission, $oldCommissionSimId) {
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
        });

        return redirect()->route('transactions.index')->with('status', 'লেনদেন সফলভাবে আপডেট করা হয়েছে।');
    }

    /**
     * Remove the specified transaction.
     */
    public function destroy(Transaction $transaction): RedirectResponse
    {
        $transaction->delete();

        return redirect()->route('transactions.index')->with('status', 'লেনদেন সফলভাবে মুছে ফেলা হয়েছে।');
    }
}
