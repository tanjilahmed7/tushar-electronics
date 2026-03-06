import { Head, router } from '@inertiajs/react';
import { Search, Users } from 'lucide-react';
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

const PATH = '/reports/customer-summary';

type Row = {
    customer_number: string;
    total_credit: string;
    total_debit: string;
    transaction_count: number;
};
type Props = {
    rows: Row[];
    filters: { month?: string; from?: string; to?: string };
};

const breadcrumbs = (): BreadcrumbItem[] => [
    { title: 'ড্যাশবোর্ড', href: dashboard() },
    { title: 'রিপোর্ট', href: '/reports' },
    { title: 'গ্রাহক নম্বর সংক্ষিপ্ত', href: PATH },
];

export default function CustomerSummaryReport({ rows, filters }: Props) {
    const [month, setMonth] = useState(filters.month ?? '');
    const [from, setFrom] = useState(filters.from ?? '');
    const [to, setTo] = useState(filters.to ?? '');

    const applyFilter = useCallback(() => {
        router.get(
            PATH,
            {
                month: month || undefined,
                from: from || undefined,
                to: to || undefined,
            },
            { preserveState: false }
        );
    }, [month, from, to]);

    return (
        <AppLayout breadcrumbs={breadcrumbs()}>
            <Head title="গ্রাহক নম্বর সংক্ষিপ্ত" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6 md:p-8">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                        গ্রাহক নম্বর সংক্ষিপ্ত
                    </h1>
                    <p className="mt-1 text-base text-muted-foreground">
                        কোন গ্রাহক নম্বরে কত লেনদেন ও মোট ক্রেডিট/ডেবিট
                    </p>
                </div>

                <Card className="border-border">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg font-semibold">ফিল্টার</CardTitle>
                        <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:flex-wrap sm:items-end sm:gap-3">
                            <div className="space-y-2 sm:w-56">
                                <label htmlFor="month" className="text-base font-medium">
                                    মাস (ঐচ্ছিক)
                                </label>
                                <Input
                                    id="month"
                                    type="month"
                                    value={month}
                                    onChange={(e) => setMonth(e.target.value)}
                                    className="h-12 text-base"
                                />
                            </div>
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
                            <Users className="size-5" />
                            গ্রাহক নম্বর অনুযায়ী সংক্ষিপ্ত
                        </CardTitle>
                        <CardDescription className="text-base">
                            প্রতিটি গ্রাহক নম্বরে মোট ক্রেডিট, ডেবিট ও লেনদেন সংখ্যা
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-base" role="grid">
                                <thead>
                                    <tr className="border-b border-border bg-muted/50">
                                        <th className="px-6 py-4 text-left font-semibold text-foreground">
                                            গ্রাহক নম্বর
                                        </th>
                                        <th className="px-6 py-4 text-right font-semibold text-foreground">
                                            মোট ক্রেডিট (৳)
                                        </th>
                                        <th className="px-6 py-4 text-right font-semibold text-foreground">
                                            মোট ডেবিট (৳)
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
                                                এই ফিল্টারে কোনো গ্রাহক নম্বর রেকর্ড নেই।
                                            </td>
                                        </tr>
                                    ) : (
                                        rows.map((row) => (
                                            <tr
                                                key={row.customer_number}
                                                className="border-b border-border/70 transition-colors hover:bg-muted/30"
                                            >
                                                <td className="px-6 py-4 font-medium">
                                                    {row.customer_number}
                                                </td>
                                                <td className="px-6 py-4 text-right tabular-nums">
                                                    {row.total_credit}
                                                </td>
                                                <td className="px-6 py-4 text-right tabular-nums">
                                                    {row.total_debit}
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
