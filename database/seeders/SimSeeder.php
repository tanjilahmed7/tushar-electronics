<?php

namespace Database\Seeders;

use App\Models\Sim;
use Illuminate\Database\Seeder;

class SimSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $sims = [
            [
                'name' => 'প্রধান অফিস',
                'operator' => 'grameenphone',
                'sim_number' => '01712345678',
                'status' => 'active',
                'balance' => 500.00,
                'note' => 'প্রধান ব্যবসায়িক নম্বর',
            ],
            [
                'name' => 'রবি ব্যাকআপ',
                'operator' => 'robi',
                'sim_number' => '01812345678',
                'status' => 'active',
                'balance' => 200.00,
                'note' => null,
            ],
            [
                'name' => null,
                'operator' => 'banglalink',
                'sim_number' => '01912345678',
                'status' => 'active',
                'balance' => 0,
                'note' => null,
            ],
            [
                'name' => 'রিজার্ভ সিম',
                'operator' => 'grameenphone',
                'sim_number' => '01798765432',
                'status' => 'inactive',
                'balance' => 0,
                'note' => 'রিজার্ভ',
            ],
            [
                'name' => null,
                'operator' => 'airtel',
                'sim_number' => '01612345678',
                'status' => 'active',
                'balance' => 150.00,
                'note' => null,
            ],
        ];

        foreach ($sims as $sim) {
            Sim::firstOrCreate(
                ['sim_number' => $sim['sim_number']],
                $sim
            );
        }
    }
}
