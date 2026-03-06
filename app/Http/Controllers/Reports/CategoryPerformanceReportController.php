<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class CategoryPerformanceReportController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $from = $request->input('from');
        $to = $request->input('to');

        $start = $from && preg_match('/^\d{4}-\d{2}-\d{2}$/', $from) ? $from : now()->subMonths(11)->startOfMonth()->format('Y-m-d');
        $end = $to && preg_match('/^\d{4}-\d{2}-\d{2}$/', $to) ? $to : now()->format('Y-m-d');

        $driver = DB::connection()->getDriverName();
        $monthExpr = $driver === 'sqlite' ? "strftime('%Y-%m', transactions.date)" : "DATE_FORMAT(transactions.date, '%Y-%m')";

        $rows = Transaction::query()
            ->join('transaction_categories', 'transactions.transaction_category_id', '=', 'transaction_categories.id')
            ->whereBetween('transactions.date', [$start, $end])
            ->selectRaw('transaction_categories.id as category_id, transaction_categories.name as category_name, transaction_categories.type as category_type')
            ->selectRaw("{$monthExpr} as month_key")
            ->selectRaw('SUM(transactions.amount) as total_amount')
            ->selectRaw('COUNT(transactions.id) as transaction_count')
            ->groupByRaw('transaction_categories.id, transaction_categories.name, transaction_categories.type, '.$monthExpr)
            ->orderByRaw($monthExpr)
            ->orderBy('transaction_categories.name')
            ->get();

        $data = $rows->map(fn ($row) => [
            'category_id' => $row->category_id,
            'category_name' => $row->category_name,
            'category_type' => $row->category_type,
            'month_key' => $row->month_key,
            'total_amount' => (string) number_format((float) $row->total_amount, 2),
            'transaction_count' => (int) $row->transaction_count,
        ])->all();

        return Inertia::render('reports/category-performance', [
            'rows' => $data,
            'filters' => ['from' => $from, 'to' => $to],
        ]);
    }
}
