<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class ReportsIndexController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('reports/index', [
            'reports' => [
                [
                    'title' => 'ক্যাটাগরি অনুযায়ী লেনদেন সংক্ষিপ্ত',
                    'description' => 'কোন ক্যাটাগরিতে কত ক্রেডিট/ডেবিট হয়েছে তারিখ অনুযায়ী দেখুন',
                    'href' => '/reports/transaction-by-category',
                    'icon' => 'tags',
                ],
                [
                    'title' => 'ফি সংক্ষিপ্ত',
                    'description' => 'সিম থেকে কাটা ফির যোগফল মাস ও সিম অনুযায়ী',
                    'href' => '/reports/fee-summary',
                    'icon' => 'receipt',
                ],
                [
                    'title' => 'সিম ব্যালেন্স চলাচল',
                    'description' => 'নির্বাচিত সিমের ব্যালেন্স যোগ/বিয়োগের হিসাব',
                    'href' => '/reports/sim-balance-movement',
                    'icon' => 'trending-up',
                ],
                [
                    'title' => 'ক্যাটাগরি পারফরম্যান্স (সময় অনুযায়ী)',
                    'description' => 'মাস অনুযায়ী প্রতিটি ক্যাটাগরির লেনদেনের পরিমাণ',
                    'href' => '/reports/category-performance',
                    'icon' => 'bar-chart',
                ],
                [
                    'title' => 'গ্রাহক নম্বর সংক্ষিপ্ত',
                    'description' => 'কোন গ্রাহক নম্বরে কত লেনদেন ও পরিমাণ',
                    'href' => '/reports/customer-summary',
                    'icon' => 'users',
                ],
                [
                    'title' => 'কমিশন ও ফি একত্রে',
                    'description' => 'কমিশন (ক্রেডিট) ও ফি (ডেবিট) একসাথে মাস ও সিম অনুযায়ী',
                    'href' => '/reports/commission-fee-summary',
                    'icon' => 'wallet',
                ],
            ],
        ]);
    }
}
