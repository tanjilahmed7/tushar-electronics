import { Head, router } from '@inertiajs/react';
import { BarChart3, Search } from 'lucide-react';
import { useCallback, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

const PATH = '/reports/category-performance';

type Row = {
    category_id: number;
    category_name: string;
    category_type: string;
    month_key: string;
    total_amount: string;
    transaction_count: number;
};
type Props = {
    rows: Row[];
    filters: { from?: string; to?: string };
};

const breadcrumbs = (): BreadcrumbItem[] => [
    { title: 'ড্যাশবোর্ড', href: dashboard() },
    { title: 'রিপোর্ট', href: '/reports' },
    { title: 'ক্যাটাগরি পারফরম্যান্স', href: PATH },
];

function monthLabel(key: string): string {
    const [y, m] = key.split('-').map(Number);
    return new Intl.DateTimeFormat('bn-BD', {
        month: 'short',
        year: 'numeric',
    }).format(new Date(y, m - 1, 1));
}

export default function CategoryPerformanceReport({ rows, filters }: Props) {
    const [from, setFrom] = useState(filters.from ?? '');
    const [to, setTo] = useState(filters.to ?? '');

    const applyFilter = useCallback(() => {
        router.get(
            PATH,
            { from: from || undefined, to: to || undefined },
            { preserveState: false }
        );
    }, [from, to]);

    return (
        <AppLayout breadcrumbs={breadcrumbs()}>
            <Head title="ক্যাটাগরি পারফরম্যান্স (সময় অনুযায়ী)" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6 md:p-8">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                        ক্যাটাগরি পারফরম্যান্স (সময় অনুযায়ী)
                    </h1>
                    <p className="mt-1 text-base text-muted-foreground">
                        মাস অনুযায়ী প্রতিটি ক্যাটাগরির মোট লেনদেন পরিমাণ ও সংখ্যা
                    </p>
                </div>

                <Card className="border-border">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg font-semibold">ফিল্টার</CardTitle>
                        <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-end sm:gap-3">
                            <div className="space-y-2 sm:w-44">
                                <label htmlFor="from" className="text-base font-medium">
                                    থেকে (তারিখ)
                                </label>
                                <Input
                                    id="from"
                                    type="date"
                                    value={from}
                                    onChange={(e) => setFrom(e.target.value)}
                                    className="h-12 text-base"
                                />
                            </div>
                            <div className="space-y-2 sm:w-44">
                                <label htmlFor="to" className="text-base font-medium">
                                    পর্যন্ত (তারিখ)
                                </label>
                                <Input
                                    id="to"
                                    type="date"
                                    value={to}
                                    onChange={(e) => setTo(e.target.value)}
                                    className="h-12 text-base"
                                />
                            </div>
                            <Button onClick={applyFilter} className="h-12 text-base px-6">
                                <Search className="mr-2 size-5" />
                                দেখুন
                            </Button>
                        </div>
                    </CardHeader>
                </Card>

                <Card className="border-border">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                            <BarChart3 className="size-5" />
                            মাস ও ক্যাটাগরি অনুযায়ী লেনদেন
                        </CardTitle>
                        <CardDescription className="text-base">
                            প্রতিটি মাসে প্রতিটি ক্যাটাগরির মোট পরিমাণ ও লেনদেন সংখ্যা
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-base" role="grid">
                                <thead>
                                    <tr className="border-b border-border bg-muted/50">
                                        <th className="px-6 py-4 text-left font-semibold text-foreground">
                                            ক্যাটাগরি
                                        </th>
                                        <th className="px-6 py-4 text-left font-semibold text-foreground">
                                            মাস
                                        </th>
                                        <th className="px-6 py-4 text-right font-semibold text-foreground">
                                            মোট পরিমাণ (৳)
                                        </th>
                                        <th className="px-6 py-4 text-right font-semibold text-foreground">
                                            লেনদেন সংখ্যা
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={4}
                                                className="px-6 py-12 text-center text-muted-foreground"
                                            >
                                                এই সময়ের মধ্যে কোনো লেনদেন নেই।
                                            </td>
                                        </tr>
                                    ) : (
                                        rows.map((row, index) => (
                                            <tr
                                                key={`${row.category_id}-${row.month_key}-${index}`}
                                                className="border-b border-border/70 transition-colors hover:bg-muted/30"
                                            >
                                                <td className="px-6 py-4 font-medium">
                                                    {row.category_name}
                                                </td>
                                                <td className="px-6 py-4 text-muted-foreground">
                                                    {monthLabel(row.month_key)}
                                                </td>
                                                <td className="px-6 py-4 text-right tabular-nums">
                                                    {row.total_amount}
                                                </td>
                                                <td className="px-6 py-4 text-right tabular-nums">
                                                    {row.transaction_count}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
