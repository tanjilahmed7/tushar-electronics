<?php

namespace App\Http\Controllers;

use App\Models\Sim;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CommissionController extends Controller
{
    public function index(Request $request): Response
    {
        $month = $request->input('month');
        $from  = $request->input('from');
        $to    = $request->input('to');

        $from = $from && preg_match('/^\d{4}-\d{2}-\d{2}$/', (string) $from) ? (string) $from : null;
        $to   = $to && preg_match('/^\d{4}-\d{2}-\d{2}$/', (string) $to) ? (string) $to : null;

        if (! $from && ! $to && (! $month || ! preg_match('/^(\d{4})-(\d{2})$/', (string) $month))) {
            $today = now()->format('Y-m-d');
            $from = $today;
            $to   = $today;
        }

        $query = Transaction::query()
            ->whereNotNull('commission')
            ->where('commission', '>', 0);

        if ($from) {
            $query->whereDate('date', '>=', $from);
        }
        if ($to) {
            $query->whereDate('date', '<=', $to);
        }
        if ($month && preg_match('/^(\d{4})-(\d{2})$/', (string) $month, $m) && ! $from && ! $to) {
            $query->whereYear('date', (int) $m[1])
                ->whereMonth('date', (int) $m[2]);
        }

        $totalCommission = (float) (clone $query)->sum('commission');

        // Use COALESCE(commission_sim_id, sim_id) so commission is attributed to the SIM that received it
        // even when commission_sim_id was not stored (e.g. fallback to main SIM at save time).
        $bySim = (clone $query)
            ->selectRaw('COALESCE(commission_sim_id, sim_id) as sim_id, sum(commission) as total_commission')
            ->where(function ($q) {
                $q->whereNotNull('commission_sim_id')->orWhereNotNull('sim_id');
            })
            ->groupByRaw('COALESCE(commission_sim_id, sim_id)')
            ->get();

        $simIds = $bySim->pluck('sim_id')->unique()->filter()->all();
        $sims = Sim::whereIn('id', $simIds)->get()->keyBy('id');

        $bySimFormatted = $bySim->map(function ($row) use ($sims) {
            $sim = $sims->get($row->sim_id);
            return [
                'sim_id' => $row->sim_id,
                'sim_number' => $sim ? $sim->sim_number : '—',
                'sim_name' => $sim ? $sim->name : null,
                'operator_label' => $sim ? (Sim::OPERATORS[$sim->operator] ?? $sim->operator) : '—',
                'total_commission' => (string) number_format((float) $row->total_commission, 2),
            ];
        })->values()->all();

        return Inertia::render('commission/index', [
            'totalCommission' => (string) number_format($totalCommission, 2),
            'bySim' => $bySimFormatted,
            'filters' => [
                'month' => $month,
                'from' => $from,
                'to' => $to,
            ],
        ]);
    }
}
