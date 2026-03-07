<?php

namespace App\Http\Controllers;

use App\Models\Sim;
use App\Models\Transaction;
use App\Models\TransactionCategory;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SimCategoryReportController extends Controller
{
    /**
     * Show report: per SIM, per category, count of transactions (optional sim + month/date filter).
     */
    public function index(Request $request): Response
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
            $month = now()->format('Y-m');
        }

        $query = Transaction::query()
            ->selectRaw('sim_id, transaction_category_id, count(*) as transaction_count, COALESCE(SUM(amount), 0) as total_amount')
            ->whereNotNull('sim_id')
            ->groupBy('sim_id', 'transaction_category_id');

        if ($simId !== null) {
            $query->where('sim_id', $simId);
        }

        if ($from) {
            $query->whereDate('date', '>=', $from);
        }
        if ($to) {
            $query->whereDate('date', '<=', $to);
        }
        if (! $from && ! $to && $month && preg_match('/^(\d{4})-(\d{2})$/', (string) $month, $m)) {
            $query->whereYear('date', (int) $m[1])
                ->whereMonth('date', (int) $m[2]);
        }

        $rows = $query->get();

        $simIds = $rows->pluck('sim_id')->unique()->filter()->values()->all();
        $categoryIds = $rows->pluck('transaction_category_id')->unique()->filter()->values()->all();

        $sims = Sim::whereIn('id', $simIds)->get()->keyBy('id');
        $categories = TransactionCategory::whereIn('id', $categoryIds)->get()->keyBy('id');

        $data = $rows->map(function ($row) use ($sims, $categories) {
            $sim = $sims->get($row->sim_id);
            $category = $categories->get($row->transaction_category_id);
            return [
                'sim_id' => $row->sim_id,
                'sim_name' => $sim?->name,
                'sim_number' => $sim?->sim_number ?? '—',
                'sim_display' => $sim?->name ?: ($sim?->sim_number ?? '—'),
                'category_id' => $row->transaction_category_id,
                'category_name' => $category?->name ?? '—',
                'transaction_count' => (int) $row->transaction_count,
                'total_amount' => number_format((float) ($row->total_amount ?? 0), 2),
            ];
        })->sortBy([
            ['sim_display', 'asc'],
            ['category_name', 'asc'],
        ])->values()->all();

        $simOptions = Sim::query()->orderBy('sim_number')->get()->map(fn (Sim $s) => [
            'id' => $s->id,
            'sim_number' => $s->sim_number,
            'sim_name' => $s->name,
            'label' => $s->name ? "{$s->name} ({$s->sim_number})" : $s->sim_number,
        ])->values()->all();

        return Inertia::render('sim-category-report/index', [
            'rows' => $data,
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
