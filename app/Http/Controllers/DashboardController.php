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
     * Low balance threshold (BDT).
     */
    public const LOW_BALANCE_THRESHOLD = 100;

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

        $sims = Sim::all();
        $totalSims = $sims->count();
        $activeSims = $sims->where('status', 'active')->count();
        $totalBalance = $sims->sum('balance');
        $lowBalanceSims = $sims
            ->where('status', 'active')
            ->filter(fn (Sim $s) => (float) $s->balance < self::LOW_BALANCE_THRESHOLD)
            ->values()
            ->map(fn (Sim $s) => [
                'id' => $s->id,
                'sim_number' => $s->sim_number,
                'operator_label' => Sim::OPERATORS[$s->operator] ?? $s->operator,
                'balance' => $s->balance,
            ])
            ->all();

        $allSimBalances = $sims
            ->sortBy('sim_number')
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

        $transactionChart = $this->transactionChartData($year);
        $chartYears = $this->availableChartYears();

        return Inertia::render('dashboard', [
            'simStats' => [
                'total_sims' => $totalSims,
                'active_sims' => $activeSims,
                'total_balance' => (string) number_format($totalBalance, 2),
            ],
            'lowBalanceSims' => $lowBalanceSims,
            'allSimBalances' => $allSimBalances,
            'transactionChart' => $transactionChart,
            'chartYear' => $year,
            'chartYears' => $chartYears,
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
     * Monthly transaction totals (credit, debit, commission) for the given year (Jan–Dec).
     *
     * @return array<int, array{month_key: string, month_label: string, credit: float, debit: float, commission: float, transaction_count: int}>
     */
    private function transactionChartData(int $year): array
    {
        $start = Carbon::createFromDate($year, 1, 1)->startOfDay();
        $end = Carbon::createFromDate($year, 12, 31)->endOfDay();
        $isSqlite = DB::connection()->getDriverName() === 'sqlite';

        if ($isSqlite) {
            $monthExpr = "strftime('%Y-%m', transactions.date)";
        } else {
            $monthExpr = "DATE_FORMAT(transactions.date, '%Y-%m')";
        }

        $rows = Transaction::query()
            ->join('transaction_categories', 'transactions.transaction_category_id', '=', 'transaction_categories.id')
            ->whereBetween('transactions.date', [$start, $end])
            ->selectRaw("{$monthExpr} as month_key")
            ->selectRaw("SUM(CASE WHEN transaction_categories.type = ? THEN transactions.amount ELSE 0 END) as credit", ['credit'])
            ->selectRaw("SUM(CASE WHEN transaction_categories.type = ? THEN transactions.amount ELSE 0 END) as debit", ['debit'])
            ->selectRaw('SUM(COALESCE(transactions.commission, 0)) as commission')
            ->selectRaw('COUNT(transactions.id) as transaction_count')
            ->groupByRaw($monthExpr)
            ->orderByRaw($monthExpr)
            ->get();

        $months = [];
        foreach (range(1, self::CHART_MONTHS) as $month) {
            $date = Carbon::createFromDate($year, $month, 1);
            $key = $date->format('Y-m');
            $months[$key] = [
                'month_key' => $key,
                'month_label' => $date->translatedFormat('F Y'),
                'credit' => 0.0,
                'debit' => 0.0,
                'commission' => 0.0,
                'transaction_count' => 0,
            ];
        }

        foreach ($rows as $row) {
            $key = $row->month_key;
            if (isset($months[$key])) {
                $months[$key]['credit'] = (float) $row->credit;
                $months[$key]['debit'] = (float) $row->debit;
                $months[$key]['commission'] = (float) $row->commission;
                $months[$key]['transaction_count'] = (int) $row->transaction_count;
            }
        }

        return array_values($months);
    }
}
