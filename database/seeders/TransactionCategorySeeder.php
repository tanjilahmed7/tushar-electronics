<?php

namespace Database\Seeders;

use App\Models\TransactionCategory;
use Illuminate\Database\Seeder;

class TransactionCategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            [
                'name' => 'বিক্রয়',
                'type' => 'credit',
                'description' => 'পণ্য বা সেবা বিক্রয় থেকে আয়',
            ],
            [
                'name' => 'খরচ',
                'type' => 'debit',
                'description' => 'সাধারণ খরচ',
            ],
            [
                'name' => 'বেতন',
                'type' => 'debit',
                'description' => 'কর্মচারী বেতন',
            ],
            [
                'name' => 'অন্যান্য আয়',
                'type' => 'credit',
                'description' => 'অন্যান্য উৎস থেকে আয়',
            ],
            [
                'name' => 'রক্ষণাবেক্ষণ',
                'type' => 'debit',
                'description' => 'রক্ষণাবেক্ষণ ব্যয়',
            ],
        ];

        foreach ($categories as $category) {
            TransactionCategory::firstOrCreate(
                ['name' => $category['name']],
                $category
            );
        }
    }
}
