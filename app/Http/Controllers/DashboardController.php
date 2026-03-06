<?php

namespace App\Http\Controllers;

use App\Models\Sim;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Number of months in the transaction performance chart (full year).
     */
    private const CHART_MONTHS = 12;

    public function __invoke(Request $request): Response
    {
        $currentYear = (int) date('Y');
        $yearInput = $request->input('year');
        $year = $yearInput !== null && preg_match('/^\d{4}$/', (string) $yearInput)
            ? (int) $yearInput
            : $currentYear;
        $year = max(2000, min(2100, $year));

        $month = $request->input('month');
        $month = $month && preg_match('/^\d{4}-\d{2}$/', (string) $month) ? (string) $month : null;

        $from = $request->input('from');
        $to = $request->input('to');
        $from = $from && preg_match('/^\d{4}-\d{2}-\d{2}$/', (string) $from) ? (string) $from : null;
        $to = $to && preg_match('/^\d{4}-\d{2}-\d{2}$/', (string) $to) ? (string) $to : null;

        $sims = Sim::all();
        $totalSims = $sims->count();
        $activeSims = $sims->where('status', 'active')->count();
        $totalBalance = $sims->sum('balance');

        $allSimBalances = $sims
            ->sortByDesc(fn (Sim $s) => (float) $s->balance)
            ->values()
            ->map(fn (Sim $s) => [
                'id' => $s->id,
                'name' => $s->name,
                'sim_number' => $s->sim_number,
                'operator_label' => Sim::OPERATORS[$s->operator] ?? $s->operator,
                'balance' => $s->balance,
                'status' => $s->status,
            ])
            ->all();

        $transactionChart = $this->transactionChartData($year, $from, $to, $month);
        $chartYears = $this->availableChartYears();

        return Inertia::render('dashboard', [
            'simStats' => [
                'total_sims' => $totalSims,
                'active_sims' => $activeSims,
                'total_balance' => (string) number_format($totalBalance, 2),
            ],
            'allSimBalances' => $allSimBalances,
            'transactionChart' => $transactionChart,
            'chartYear' => $year,
            'chartYears' => $chartYears,
            'chartMonth' => $month,
            'chartFrom' => $from,
            'chartTo' => $to,
        ]);
    }

    /**
     * Years that can be selected for the chart (years with transactions + current year).
     *
     * @return array<int>
     */
    private function availableChartYears(): array
    {
        $currentYear = (int) date('Y');
        $isSqlite = DB::connection()->getDriverName() === 'sqlite';
        $yearExpr = $isSqlite ? "CAST(strftime('%Y', date) AS INTEGER)" : 'YEAR(date)';
        $minYear = (int) Transaction::query()->min(DB::raw($yearExpr));
        if ($minYear === 0 || $minYear === null) {
            return [$currentYear];
        }
        $years = range($minYear, $currentYear);
        return array_values(array_reverse($years));
    }

    /**
     * Transaction totals for the selected period.
     *
     * - If from/to is provided, groups by day (YYYY-MM-DD) within the range.
     * - Otherwise, groups by month (YYYY-MM) for the given year.
     *
     * Includes credit, debit, commission, fee and derived profit (commission − fee).
     *
     * @return array<int, array{
     *     month_key: string,
     *     month_label: string,
     *     credit: float,
     *     debit: float,
     *     commission: float,
     *     fee: float,
     *     profit: float,
     *     transaction_count: int
     * }>
     */
    private function transactionChartData(int $year, ?string $from = null, ?string $to = null, ?string $month = null): array
    {
        $isSqlite = DB::connection()->getDriverName() === 'sqlite';

        $useDayWise = (bool) ($from || $to || $month);

        if ($month) {
            [$y, $m] = array_map('intval', explode('-', $month, 2));
            $start = Carbon::createFromDate($y, $m, 1)->startOfDay();
            $end = Carbon::createFromDate($y, $m, 1)->endOfMonth()->endOfDay();
        } elseif ($from || $to) {
            $start = $from ? Carbon::parse($from)->startOfDay() : Carbon::parse((string) $to)->startOfDay();
            $end = $to ? Carbon::parse($to)->endOfDay() : Carbon::parse((string) $from)->endOfDay();
        } else {
            $start = Carbon::createFromDate($year, 1, 1)->startOfDay();
            $end = Carbon::createFromDate($year, 12, 31)->endOfDay();
        }

        if ($isSqlite) {
            $periodExpr = $useDayWise
                ? "strftime('%Y-%m-%d', transactions.date)"
                : "strftime('%Y-%m', transactions.date)";
        } else {
            $periodExpr = $useDayWise
                ? "DATE_FORMAT(transactions.date, '%Y-%m-%d')"
                : "DATE_FORMAT(transactions.date, '%Y-%m')";
        }

        $rows = Transaction::query()
            ->join('transaction_categories', 'transactions.transaction_category_id', '=', 'transaction_categories.id')
            ->whereBetween('transactions.date', [$start, $end])
            ->selectRaw("{$periodExpr} as month_key")
            ->selectRaw("SUM(CASE WHEN transaction_categories.type = ? THEN transactions.amount ELSE 0 END) as credit", ['credit'])
            ->selectRaw("SUM(CASE WHEN transaction_categories.type = ? THEN transactions.amount ELSE 0 END) as debit", ['debit'])
            ->selectRaw('SUM(COALESCE(transactions.commission, 0)) as commission')
            ->selectRaw('SUM(COALESCE(transactions.fee, 0)) as fee')
            ->selectRaw('COUNT(transactions.id) as transaction_count')
            ->groupByRaw($periodExpr)
            ->orderByRaw($periodExpr)
            ->get();

        $months = [];
        if ($useDayWise) {
            $cursor = $start->copy()->startOfDay();
            $last = $end->copy()->startOfDay();
            while ($cursor->lte($last)) {
                $key = $cursor->format('Y-m-d');
                $months[$key] = [
                    'month_key' => $key,
                    'month_label' => $cursor->translatedFormat('j F Y'),
                    'credit' => 0.0,
                    'debit' => 0.0,
                    'commission' => 0.0,
                    'fee' => 0.0,
                    'profit' => 0.0,
                    'transaction_count' => 0,
                ];
                $cursor->addDay();
            }
        } else {
            foreach (range(1, self::CHART_MONTHS) as $month) {
                $date = Carbon::createFromDate($year, $month, 1);
                $key = $date->format('Y-m');
                $months[$key] = [
                    'month_key' => $key,
                    'month_label' => $date->translatedFormat('F Y'),
                    'credit' => 0.0,
                    'debit' => 0.0,
                    'commission' => 0.0,
                    'fee' => 0.0,
                    'profit' => 0.0,
                    'transaction_count' => 0,
                ];
            }
        }

        foreach ($rows as $row) {
            $key = $row->month_key;
            if (isset($months[$key])) {
                $credit = (float) $row->credit;
                $debit = (float) $row->debit;
                $commission = (float) $row->commission;
                $fee = (float) $row->fee;

                $months[$key]['credit'] = $credit;
                $months[$key]['debit'] = $debit;
                $months[$key]['commission'] = $commission;
                $months[$key]['fee'] = $fee;
                $months[$key]['profit'] = $commission - $fee;
                $months[$key]['transaction_count'] = (int) $row->transaction_count;
            }
        }

        return array_values($months);
    }
}
