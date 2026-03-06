<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class CustomerSummaryReportController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $month = $request->input('month');
        $from = $request->input('from');
        $to = $request->input('to');

        $query = Transaction::query()
            ->join('transaction_categories', 'transactions.transaction_category_id', '=', 'transaction_categories.id')
            ->whereNotNull('customer_number')
            ->where('customer_number', '!=', '')
            ->selectRaw('customer_number')
            ->selectRaw('SUM(CASE WHEN transaction_categories.type = ? THEN transactions.amount ELSE 0 END) as total_credit', ['credit'])
            ->selectRaw('SUM(CASE WHEN transaction_categories.type = ? THEN transactions.amount ELSE 0 END) as total_debit', ['debit'])
            ->selectRaw('COUNT(transactions.id) as transaction_count')
            ->groupBy('customer_number');

        if ($month && preg_match('/^(\d{4})-(\d{2})$/', $month, $m)) {
            $query->whereYear('transactions.date', (int) $m[1])->whereMonth('transactions.date', (int) $m[2]);
        }
        if ($from && preg_match('/^\d{4}-\d{2}-\d{2}$/', $from)) {
            $query->whereDate('transactions.date', '>=', $from);
        }
        if ($to && preg_match('/^\d{4}-\d{2}-\d{2}$/', $to)) {
            $query->whereDate('transactions.date', '<=', $to);
        }

        $rows = $query->orderByDesc(DB::raw('COUNT(transactions.id)'))->get();

        $data = $rows->map(fn ($row) => [
            'customer_number' => $row->customer_number,
            'total_credit' => (string) number_format((float) $row->total_credit, 2),
            'total_debit' => (string) number_format((float) $row->total_debit, 2),
            'transaction_count' => (int) $row->transaction_count,
        ])->all();

        return Inertia::render('reports/customer-summary', [
            'rows' => $data,
            'filters' => ['month' => $month, 'from' => $from, 'to' => $to],
        ]);
    }
}
