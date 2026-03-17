<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use App\Models\Sim;
use App\Models\Transaction;
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

        $baseQuery = Transaction::query()
            ->join('transaction_categories', 'transactions.transaction_category_id', '=', 'transaction_categories.id');

        if ($request->filled('search')) {
            $term = '%'.$request->search.'%';
            $driver = DB::connection()->getDriverName();
            $castType = $driver === 'sqlite' ? 'TEXT' : 'CHAR';
            $baseQuery->where(function ($q) use ($term, $castType) {
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
            $baseQuery->whereDate('transactions.date', '>=', $from);
        }
        if ($to) {
            $baseQuery->whereDate('transactions.date', '<=', $to);
        }
        if (! $from && ! $to && $month && preg_match('/^(\d{4})-(\d{2})$/', (string) $month, $m)) {
            $baseQuery->whereYear('transactions.date', (int) $m[1])->whereMonth('transactions.date', (int) $m[2]);
        }
        if ($simId !== null) {
            $baseQuery->where('transactions.sim_id', $simId);
        }

        $summaryRows = (clone $baseQuery)
            ->selectRaw('transaction_categories.type as category_type')
            ->selectRaw('SUM(transactions.amount) as total_amount')
            ->selectRaw('SUM(COALESCE(transactions.commission, 0)) as total_commission')
            ->selectRaw('SUM(COALESCE(transactions.fee, 0)) as total_fee')
            ->selectRaw('COUNT(transactions.id) as transaction_count')
            ->groupBy('transaction_categories.type')
            ->get();

        $typeLabels = [
            'credit' => 'ক্রেডিট',
            'debit' => 'ডেবিট',
        ];

        $summaryByType = $summaryRows->map(fn ($row) => [
            'type' => $row->category_type,
            'type_label' => $typeLabels[$row->category_type] ?? $row->category_type,
            'total_amount' => (string) number_format((float) $row->total_amount, 2),
            'total_commission' => (string) number_format((float) $row->total_commission, 2),
            'total_fee' => (string) number_format((float) $row->total_fee, 2),
            'transaction_count' => (int) $row->transaction_count,
        ])->values()->all();

        $grandTotal = [
            'total_amount' => (string) number_format((float) (clone $baseQuery)->sum('transactions.amount'), 2),
            'total_commission' => (string) number_format((float) (clone $baseQuery)->sum(DB::raw('COALESCE(transactions.commission, 0)')), 2),
            'total_fee' => (string) number_format((float) (clone $baseQuery)->sum(DB::raw('COALESCE(transactions.fee, 0)')), 2),
            'transaction_count' => (int) (clone $baseQuery)->count(),
        ];

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
            'summaryByType' => $summaryByType,
            'grandTotal' => $grandTotal,
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
