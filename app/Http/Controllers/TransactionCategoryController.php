<?php

namespace App\Http\Controllers;

use App\Models\TransactionCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TransactionCategoryController extends Controller
{
    /**
     * Display a listing of transaction categories.
     */
    public function index(): Response
    {
        $categories = TransactionCategory::query()
            ->orderBy('name')
            ->get()
            ->map(fn (TransactionCategory $c) => [
                'id' => $c->id,
                'name' => $c->name,
                'type' => $c->type,
                'type_label' => TransactionCategory::TYPES[$c->type] ?? $c->type,
                'description' => $c->description,
                'created_at' => $c->created_at->format('d/m/Y'),
            ]);

        return Inertia::render('transaction-categories/index', [
            'categories' => $categories,
            'types' => TransactionCategory::TYPES,
        ]);
    }

    /**
     * Show the form for creating a new category.
     */
    public function create(): Response
    {
        return Inertia::render('transaction-categories/create', [
            'types' => TransactionCategory::TYPES,
        ]);
    }

    /**
     * Store a newly created category.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'string', 'in:'.implode(',', array_keys(TransactionCategory::TYPES))],
            'description' => ['nullable', 'string', 'max:1000'],
        ]);

        TransactionCategory::create($validated);

        return redirect()->route('transaction-categories.index')->with('status', 'ক্যাটাগরি সফলভাবে যোগ করা হয়েছে।');
    }

    /**
     * Show the form for editing the specified category.
     */
    public function edit(TransactionCategory $transaction_category): Response
    {
        return Inertia::render('transaction-categories/edit', [
            'category' => [
                'id' => $transaction_category->id,
                'name' => $transaction_category->name,
                'type' => $transaction_category->type,
                'description' => $transaction_category->description,
            ],
            'types' => TransactionCategory::TYPES,
        ]);
    }

    /**
     * Update the specified category.
     */
    public function update(Request $request, TransactionCategory $transaction_category): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'string', 'in:'.implode(',', array_keys(TransactionCategory::TYPES))],
            'description' => ['nullable', 'string', 'max:1000'],
        ]);

        $transaction_category->update($validated);

        return redirect()->route('transaction-categories.index')->with('status', 'ক্যাটাগরি সফলভাবে আপডেট করা হয়েছে।');
    }

    /**
     * Remove the specified category.
     */
    public function destroy(TransactionCategory $transaction_category): RedirectResponse
    {
        $transaction_category->delete();

        return redirect()->route('transaction-categories.index')->with('status', 'ক্যাটাগরি সফলভাবে মুছে ফেলা হয়েছে।');
    }
}
