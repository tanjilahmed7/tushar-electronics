<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use App\Models\Sim;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FeeSummaryReportController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $month = $request->input('month');
        $from  = $request->input('from');
        $to    = $request->input('to');
        $simId = $request->input('sim_id');
        if ($simId !== null && $simId !== '') {
            $simId = (int) $simId;
        } else {
            $simId = null;
        }

        $from = $from && preg_match('/^\d{4}-\d{2}-\d{2}$/', (string) $from) ? (string) $from : null;
        $to   = $to && preg_match('/^\d{4}-\d{2}-\d{2}$/', (string) $to) ? (string) $to : null;

        if (! $from && ! $to && (! $month || ! preg_match('/^(\d{4})-(\d{2})$/', (string) $month))) {
            $today = now()->format('Y-m-d');
            $from = $today;
            $to   = $today;
        }

        $query = Transaction::query()
            ->whereNotNull('fee')
            ->where('fee', '>', 0);

        if ($from) {
            $query->whereDate('date', '>=', $from);
        }
        if ($to) {
            $query->whereDate('date', '<=', $to);
        }
        if ($month && preg_match('/^(\d{4})-(\d{2})$/', (string) $month, $m) && ! $from && ! $to) {
            $query->whereYear('date', (int) $m[1])->whereMonth('date', (int) $m[2]);
        }
        if ($simId !== null) {
            $query->where('sim_id', $simId);
        }

        $totalFee = (float) (clone $query)->sum('fee');

        $bySim = (clone $query)
            ->selectRaw('sim_id, sum(fee) as total_fee, count(*) as transaction_count')
            ->whereNotNull('sim_id')
            ->groupBy('sim_id')
            ->get();

        $simIds = $bySim->pluck('sim_id')->unique()->filter()->values()->all();
        $simsList = Sim::whereIn('id', $simIds)->get()->keyBy('id');

        $bySimFormatted = $bySim->map(function ($row) use ($simsList) {
            $sim = $simsList->get($row->sim_id);
            return [
                'sim_id' => $row->sim_id,
                'sim_number' => $sim?->sim_number ?? '—',
                'sim_name' => $sim?->name,
                'sim_display' => $sim?->name ?: ($sim?->sim_number ?? '—'),
                'total_fee' => (string) number_format((float) $row->total_fee, 2),
                'transaction_count' => (int) $row->transaction_count,
            ];
        })->values()->all();

        $simOptions = Sim::query()->orderBy('sim_number')->get()->map(fn (Sim $s) => [
            'id' => $s->id,
            'label' => $s->name ? "{$s->name} ({$s->sim_number})" : $s->sim_number,
        ])->values()->all();

        return Inertia::render('reports/fee-summary', [
            'totalFee' => (string) number_format($totalFee, 2),
            'bySim' => $bySimFormatted,
            'sims' => $simOptions,
            'filters' => [
                'month' => $month,
                'from' => $from,
                'to' => $to,
                'sim_id' => $simId !== null ? (string) $simId : null,
            ],
        ]);
    }
}
