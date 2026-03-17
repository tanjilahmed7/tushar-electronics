<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use App\Models\Sim;
use App\Models\Transaction;
use App\Models\TransactionCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class TransactionReportController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $search = $request->input('search');
        $month = $request->input('month');
        $from = $request->input('from');
        $to = $request->input('to');
        $simId = $request->input('sim_id');
        if ($simId !== null && $simId !== '') {
            $simId = (int) $simId;
        } else {
            $simId = null;
        }

        $from = $from && preg_match('/^\d{4}-\d{2}-\d{2}$/', (string) $from) ? (string) $from : null;
        $to = $to && preg_match('/^\d{4}-\d{2}-\d{2}$/', (string) $to) ? (string) $to : null;

        if (! $from && ! $to && (! $month || ! preg_match('/^(\d{4})-(\d{2})$/', (string) $month))) {
            $today = now()->format('Y-m-d');
            $from = $today;
            $to = $today;
        }

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

        if ($from) {
            $query->whereDate('date', '>=', $from);
        }
        if ($to) {
            $query->whereDate('date', '<=', $to);
        }
        if (! $from && ! $to && $month && preg_match('/^(\d{4})-(\d{2})$/', (string) $month, $m)) {
            $query->whereYear('date', (int) $m[1])->whereMonth('date', (int) $m[2]);
        }
        if ($simId !== null) {
            $query->where('transactions.sim_id', $simId);
        }

        $paginator = $query->paginate(20)->withQueryString();

        $paginator->through(fn (Transaction $t) => [
            'id' => $t->id,
            'category_name' => $t->transactionCategory->name,
            'type' => $t->transactionCategory->type,
            'type_label' => TransactionCategory::TYPES[$t->transactionCategory->type] ?? $t->transactionCategory->type ?? $t->transactionCategory->type,
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

        $simOptions = Sim::query()
            ->where('status', 'active')
            ->orderBy('sim_number')
            ->get()
            ->map(fn (Sim $s) => [
                'id' => $s->id,
                'label' => $s->name ? "{$s->name} ({$s->sim_number})" : $s->sim_number,
            ])
            ->values()
            ->all();

        return Inertia::render('reports/transactions', [
            'transactions' => $paginator,
            'sims' => $simOptions,
            'filters' => [
                'search' => $search,
                'month' => $month,
                'from' => $from,
                'to' => $to,
                'sim_id' => $simId !== null ? (string) $simId : null,
            ],
        ]);
    }
}
