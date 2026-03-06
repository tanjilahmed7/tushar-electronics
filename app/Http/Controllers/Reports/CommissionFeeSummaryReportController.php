<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use App\Models\Sim;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CommissionFeeSummaryReportController extends Controller
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

        $baseQuery = Transaction::query();

        if ($from && preg_match('/^\d{4}-\d{2}-\d{2}$/', $from)) {
            $baseQuery->whereDate('date', '>=', $from);
        }
        if ($to && preg_match('/^\d{4}-\d{2}-\d{2}$/', $to)) {
            $baseQuery->whereDate('date', '<=', $to);
        }
        if (! $from && ! $to && $month && preg_match('/^(\d{4})-(\d{2})$/', $month, $m)) {
            $baseQuery->whereYear('date', (int) $m[1])->whereMonth('date', (int) $m[2]);
        }
        if ($simId !== null) {
            $baseQuery->where(function ($q) use ($simId) {
                $q->where('sim_id', $simId)->orWhere('commission_sim_id', $simId);
            });
        }

        $totalCommission = (float) (clone $baseQuery)->whereNotNull('commission')->where('commission', '>', 0)->sum('commission');
        $totalFee = (float) (clone $baseQuery)->whereNotNull('fee')->where('fee', '>', 0)->sum('fee');
        $net = $totalCommission - $totalFee;

        $commissionBySim = (clone $baseQuery)
            ->whereNotNull('commission')->where('commission', '>', 0)
            ->selectRaw('COALESCE(commission_sim_id, sim_id) as sim_id, sum(commission) as total')
            ->where(function ($q) {
                $q->whereNotNull('commission_sim_id')->orWhereNotNull('sim_id');
            })
            ->groupByRaw('COALESCE(commission_sim_id, sim_id)')
            ->get()
            ->keyBy('sim_id');

        $feeBySim = (clone $baseQuery)
            ->whereNotNull('fee')->where('fee', '>', 0)
            ->whereNotNull('sim_id')
            ->selectRaw('sim_id, sum(fee) as total')
            ->groupBy('sim_id')
            ->get()
            ->keyBy('sim_id');

        $simIds = $commissionBySim->keys()->merge($feeBySim->keys())->unique()->filter()->values()->all();
        $sims = Sim::whereIn('id', $simIds)->get()->keyBy('id');

        $bySim = collect($simIds)->map(function ($id) use ($commissionBySim, $feeBySim, $sims) {
            $sim = $sims->get($id);
            $comm = (float) ($commissionBySim->get($id)?->total ?? 0);
            $fee = (float) ($feeBySim->get($id)?->total ?? 0);
            return [
                'sim_id' => $id,
                'sim_display' => $sim?->name ?: ($sim?->sim_number ?? '—'),
                'sim_number' => $sim?->sim_number ?? '—',
                'total_commission' => (string) number_format($comm, 2),
                'total_fee' => (string) number_format($fee, 2),
                'net' => (string) number_format($comm - $fee, 2),
            ];
        })->values()->all();

        $simOptions = Sim::query()->orderBy('sim_number')->get()->map(fn (Sim $s) => [
            'id' => $s->id,
            'label' => $s->name ? "{$s->name} ({$s->sim_number})" : $s->sim_number,
        ])->values()->all();

        return Inertia::render('reports/commission-fee-summary', [
            'totalCommission' => (string) number_format($totalCommission, 2),
            'totalFee' => (string) number_format($totalFee, 2),
            'net' => (string) number_format($net, 2),
            'bySim' => $bySim,
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
