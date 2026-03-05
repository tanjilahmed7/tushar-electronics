<?php

use App\Http\Controllers\CommissionController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\SimController;
use App\Http\Controllers\TransactionCategoryController;
use App\Http\Controllers\TransactionController;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

// Root redirects to login – only authenticated users access the dashboard
Route::get('/', function () {
    return redirect()->route('login');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');

    Route::get('commission', [CommissionController::class, 'index'])->name('commission.index');

    Route::get('sims', [SimController::class, 'index'])->name('sims.index');
    Route::get('sims/create', [SimController::class, 'create'])->name('sims.create');
    Route::post('sims', [SimController::class, 'store'])->name('sims.store');
    Route::get('sims/{sim}', [SimController::class, 'show'])->name('sims.show');
    Route::get('sims/{sim}/edit', [SimController::class, 'edit'])->name('sims.edit');
    Route::put('sims/{sim}', [SimController::class, 'update'])->name('sims.update');
    Route::delete('sims/{sim}', [SimController::class, 'destroy'])->name('sims.destroy');

    Route::get('transaction-categories', [TransactionCategoryController::class, 'index'])->name('transaction-categories.index');
    Route::get('transaction-categories/create', [TransactionCategoryController::class, 'create'])->name('transaction-categories.create');
    Route::post('transaction-categories', [TransactionCategoryController::class, 'store'])->name('transaction-categories.store');
    Route::get('transaction-categories/{transaction_category}/edit', [TransactionCategoryController::class, 'edit'])->name('transaction-categories.edit');
    Route::put('transaction-categories/{transaction_category}', [TransactionCategoryController::class, 'update'])->name('transaction-categories.update');
    Route::delete('transaction-categories/{transaction_category}', [TransactionCategoryController::class, 'destroy'])->name('transaction-categories.destroy');

    Route::get('transactions', [TransactionController::class, 'index'])->name('transactions.index');
    Route::get('transactions/search-suggestions', [TransactionController::class, 'searchSuggestions'])->name('transactions.search-suggestions');
    Route::get('transactions/create', [TransactionController::class, 'create'])->name('transactions.create');
    Route::post('transactions', [TransactionController::class, 'store'])->name('transactions.store');
    Route::post('transactions/bulk', [TransactionController::class, 'storeBulk'])->name('transactions.bulk.store');
    Route::get('transactions/{transaction}/edit', [TransactionController::class, 'edit'])->name('transactions.edit');
    Route::put('transactions/{transaction}', [TransactionController::class, 'update'])->name('transactions.update');
    Route::delete('transactions/{transaction}', [TransactionController::class, 'destroy'])->name('transactions.destroy');
});

require __DIR__.'/settings.php';
