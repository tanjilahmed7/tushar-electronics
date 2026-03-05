<?php

namespace Database\Seeders;

use App\Models\Transaction;
use App\Models\TransactionCategory;
use Illuminate\Database\Seeder;

class TransactionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        if (Transaction::exists()) {
            return;
        }

        $creditCategories = TransactionCategory::where('type', 'credit')->pluck('id')->toArray();
        $debitCategories = TransactionCategory::where('type', 'debit')->pluck('id')->toArray();

        if (empty($creditCategories) || empty($debitCategories)) {
            return;
        }

        $transactions = [
            [
                'transaction_category_id' => $creditCategories[0],
                'amount' => 15000.00,
                'date' => now()->subDays(5),
                'note' => 'মাসিক বিক্রয়',
            ],
            [
                'transaction_category_id' => $debitCategories[0],
                'amount' => 3500.00,
                'date' => now()->subDays(3),
                'note' => 'অফিস খরচ',
            ],
            [
                'transaction_category_id' => $creditCategories[0],
                'amount' => 8200.00,
                'date' => now()->subDays(1),
                'note' => null,
            ],
            [
                'transaction_category_id' => $debitCategories[1] ?? $debitCategories[0],
                'amount' => 12000.00,
                'date' => now(),
                'note' => 'বেতন প্রদান',
            ],
        ];

        foreach ($transactions as $transaction) {
            Transaction::create($transaction);
        }
    }
}
