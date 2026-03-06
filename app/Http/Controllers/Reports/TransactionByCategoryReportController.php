<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use App\Models\Sim;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TransactionByCategoryReportController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $from = $request->input('from');
        $to = $request->input('to');
        $simId = $request->input('sim_id');
        if ($simId !== null && $simId !== '') {
            $simId = (int) $simId;
        } else {
            $simId = null;
        }

        $query = Transaction::query()
            ->join('transaction_categories', 'transactions.transaction_category_id', '=', 'transaction_categories.id')
            ->selectRaw('transaction_categories.id as category_id, transaction_categories.name as category_name, transaction_categories.type as category_type')
            ->selectRaw('SUM(CASE WHEN transaction_categories.type = ? THEN transactions.amount ELSE 0 END) as total_credit', ['credit'])
            ->selectRaw('SUM(CASE WHEN transaction_categories.type = ? THEN transactions.amount ELSE 0 END) as total_debit', ['debit'])
            ->selectRaw('COUNT(transactions.id) as transaction_count')
            ->groupBy('transaction_categories.id', 'transaction_categories.name', 'transaction_categories.type');

        if ($from && preg_match('/^\d{4}-\d{2}-\d{2}$/', $from)) {
            $query->whereDate('transactions.date', '>=', $from);
        }
        if ($to && preg_match('/^\d{4}-\d{2}-\d{2}$/', $to)) {
            $query->whereDate('transactions.date', '<=', $to);
        }
        if ($simId !== null) {
            $query->where('transactions.sim_id', $simId);
        }

        $rows = $query->orderBy('transaction_categories.name')->get();

        $data = $rows->map(fn ($row) => [
            'category_id' => $row->category_id,
            'category_name' => $row->category_name,
            'category_type' => $row->category_type,
            'total_credit' => (string) number_format((float) $row->total_credit, 2),
            'total_debit' => (string) number_format((float) $row->total_debit, 2),
            'transaction_count' => (int) $row->transaction_count,
        ])->all();

        $sims = Sim::query()->orderBy('sim_number')->get()->map(fn (Sim $s) => [
            'id' => $s->id,
            'label' => $s->name ? "{$s->name} ({$s->sim_number})" : $s->sim_number,
        ])->values()->all();

        return Inertia::render('reports/transaction-by-category', [
            'rows' => $data,
            'sims' => $sims,
            'filters' => [
                'from' => $from,
                'to' => $to,
                'sim_id' => $simId !== null ? (string) $simId : null,
            ],
        ]);
    }
}
