<?php

namespace App\Http\Controllers;

use App\Models\Sim;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SimController extends Controller
{
    /**
     * Display a listing of SIMs with optional search and filter.
     */
    public function index(Request $request): Response
    {
        $query = Sim::query()->orderBy('created_at', 'desc');

        if ($request->filled('search')) {
            $query->where('sim_number', 'like', '%'.$request->search.'%');
        }

        if ($request->filled('operator')) {
            $query->where('operator', $request->operator);
        }

        $sims = $query->get()->map(fn (Sim $sim) => [
            'id' => $sim->id,
            'name' => $sim->name,
            'operator' => $sim->operator,
            'operator_label' => Sim::OPERATORS[$sim->operator] ?? $sim->operator,
            'sim_number' => $sim->sim_number,
            'status' => $sim->status,
            'status_label' => Sim::STATUSES[$sim->status] ?? $sim->status,
            'balance' => $sim->balance,
            'note' => $sim->note,
            'created_at' => $sim->created_at->format('d/m/Y'),
        ]);

        return Inertia::render('sims/index', [
            'sims' => $sims,
            'filters' => [
                'search' => $request->search,
                'operator' => $request->operator,
            ],
            'operators' => Sim::OPERATORS,
        ]);
    }

    /**
     * Show the form for creating a new SIM.
     */
    public function create(): Response
    {
        return Inertia::render('sims/create', [
            'statuses' => Sim::STATUSES,
        ]);
    }

    /**
     * Store a newly created SIM.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['nullable', 'string', 'max:100'],
            'operator' => ['nullable', 'string', 'in:'.implode(',', array_keys(Sim::OPERATORS))],
            'sim_number' => ['required', 'string', 'max:50'],
            'status' => ['required', 'string', 'in:'.implode(',', array_keys(Sim::STATUSES))],
            'balance' => ['nullable', 'numeric', 'min:0'],
            'note' => ['nullable', 'string', 'max:1000'],
        ]);
        $validated['balance'] = (float) ($validated['balance'] ?? 0);
        if (empty($validated['operator'])) {
            $validated['operator'] = array_keys(Sim::OPERATORS)[0];
        }

        Sim::create($validated);

        return redirect()->route('sims.index')->with('status', 'সিম সফলভাবে যোগ করা হয়েছে।');
    }

    /**
     * Display the specified SIM.
     */
    public function show(Sim $sim): Response
    {
        return Inertia::render('sims/show', [
            'sim' => [
                'id' => $sim->id,
                'name' => $sim->name,
                'operator' => $sim->operator,
                'operator_label' => Sim::OPERATORS[$sim->operator] ?? $sim->operator,
                'sim_number' => $sim->sim_number,
                'status' => $sim->status,
                'status_label' => Sim::STATUSES[$sim->status] ?? $sim->status,
                'balance' => $sim->balance,
                'note' => $sim->note,
                'created_at' => $sim->created_at->format('d/m/Y H:i'),
                'updated_at' => $sim->updated_at->format('d/m/Y H:i'),
            ],
        ]);
    }

    /**
     * Show the form for editing the specified SIM.
     */
    public function edit(Sim $sim): Response
    {
        return Inertia::render('sims/edit', [
            'sim' => [
                'id' => $sim->id,
                'name' => $sim->name,
                'operator' => $sim->operator,
                'sim_number' => $sim->sim_number,
                'status' => $sim->status,
                'balance' => $sim->balance,
                'note' => $sim->note,
            ],
            'operators' => Sim::OPERATORS,
            'statuses' => Sim::STATUSES,
        ]);
    }

    /**
     * Update the specified SIM.
     */
    public function update(Request $request, Sim $sim): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['nullable', 'string', 'max:100'],
            'operator' => ['required', 'string', 'in:'.implode(',', array_keys(Sim::OPERATORS))],
            'sim_number' => ['required', 'string', 'max:50'],
            'status' => ['required', 'string', 'in:'.implode(',', array_keys(Sim::STATUSES))],
            'balance' => ['nullable', 'numeric', 'min:0'],
            'note' => ['nullable', 'string', 'max:1000'],
        ]);
        $validated['balance'] = (float) ($validated['balance'] ?? $sim->balance);

        $sim->update($validated);

        return redirect()->route('sims.index')->with('status', 'সিম সফলভাবে আপডেট করা হয়েছে।');
    }

    /**
     * Remove the specified SIM.
     */
    public function destroy(Sim $sim): RedirectResponse
    {
        $sim->delete();

        return redirect()->route('sims.index')->with('status', 'সিম সফলভাবে মুছে ফেলা হয়েছে।');
    }
}
