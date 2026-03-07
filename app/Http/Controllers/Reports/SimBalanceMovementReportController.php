<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use App\Models\Sim;
use App\Models\SimBalanceHistory;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SimBalanceMovementReportController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $simId = $request->input('sim_id');
        $from = $request->input('from');
        $to = $request->input('to');

        $from = $from && preg_match('/^\d{4}-\d{2}-\d{2}$/', (string) $from) ? (string) $from : null;
        $to = $to && preg_match('/^\d{4}-\d{2}-\d{2}$/', (string) $to) ? (string) $to : null;

        if (! $from && ! $to) {
            $today = now()->format('Y-m-d');
            $from = $today;
            $to = $today;
        }

        $sims = Sim::query()->orderBy('sim_number')->get()->map(fn (Sim $s) => [
            'id' => $s->id,
            'label' => $s->name ? "{$s->name} ({$s->sim_number})" : $s->sim_number,
        ])->values()->all();

        $rows = [];
        if ($simId && (int) $simId) {
            $query = SimBalanceHistory::query()
                ->where('sim_id', (int) $simId)
                ->orderBy('date', 'desc')
                ->orderBy('id', 'desc');

            if ($from) {
                $query->whereDate('date', '>=', $from);
            }
            if ($to) {
                $query->whereDate('date', '<=', $to);
            }

            $rows = $query->get()->map(fn (SimBalanceHistory $h) => [
                'id' => $h->id,
                'type' => $h->type,
                'type_label' => SimBalanceHistory::TYPES[$h->type] ?? $h->type,
                'amount' => (string) number_format((float) $h->amount, 2),
                'balance_after' => (string) number_format((float) $h->balance_after, 2),
                'date' => $h->date->format('d/m/Y'),
                'note' => $h->note,
            ])->all();
        }

        return Inertia::render('reports/sim-balance-movement', [
            'rows' => $rows,
            'sims' => $sims,
            'filters' => [
                'sim_id' => $simId,
                'from' => $from,
                'to' => $to,
            ],
        ]);
    }
}
