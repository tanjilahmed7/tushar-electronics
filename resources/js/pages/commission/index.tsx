import { Head, router } from '@inertiajs/react';
import { Percent, Search } from 'lucide-react';
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

const COMMISSION_PATH = '/commission';

type BySimRow = {
    sim_id: number;
    sim_number: string;
    sim_name: string | null;
    operator_label: string;
    total_commission: string;
};

type Props = {
    totalCommission: string;
    bySim: BySimRow[];
    filters: { month?: string };
};

const breadcrumbs = (): BreadcrumbItem[] => [
    { title: 'ড্যাশবোর্ড', href: dashboard() },
    { title: 'রিপোর্ট', href: '/reports' },
    { title: 'কমিশন', href: COMMISSION_PATH },
];

export default function CommissionIndex({ totalCommission, bySim, filters }: Props) {
    const [month, setMonth] = useState(filters.month ?? '');

    const applyFilter = useCallback(() => {
        router.get(COMMISSION_PATH, { month: month || undefined }, { preserveState: false });
    }, [month]);

    const monthLabel = month
        ? (() => {
              const [y, m] = month.split('-').map(Number);
              const d = new Date(y, m - 1, 1);
              return new Intl.DateTimeFormat('bn-BD', { month: 'long', year: 'numeric' }).format(d);
          })()
        : 'সব সময়';

    return (
        <AppLayout breadcrumbs={breadcrumbs()}>
            <Head title="কমিশন" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6 md:p-8">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                        কমিশন সংক্ষিপ্ত
                    </h1>
                    <p className="mt-1 text-base text-muted-foreground">
                        মাস অনুযায়ী ও সিম অনুযায়ী মোট কমিশন দেখুন
                    </p>
                </div>

                <Card className="border-border">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg font-semibold">মাস অনুযায়ী ফিল্টার</CardTitle>
                        <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-end sm:gap-3">
                            <div className="space-y-2 sm:w-56">
                                <label htmlFor="month" className="text-base font-medium">
                                    মাস নির্বাচন করুন
                                </label>
                                <Input
                                    id="month"
                                    type="month"
                                    value={month}
                                    onChange={(e) => setMonth(e.target.value)}
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
                            <Percent className="size-5" />
                            মোট কমিশন {month ? `(${monthLabel})` : ''}
                        </CardTitle>
                        <CardContent className="pt-4">
                            <p className="text-3xl font-bold tabular-nums text-foreground">
                                ৳ {totalCommission}
                            </p>
                        </CardContent>
                    </CardHeader>
                </Card>

                <Card className="border-border">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-semibold">সিম অনুযায়ী কমিশন</CardTitle>
                        <CardDescription className="text-base">
                            যে সিমে কমিশন জমা হয়েছে তার যোগফল
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-base" role="grid">
                                <thead>
                                    <tr className="border-b border-border bg-muted/50">
                                        <th className="px-6 py-4 text-left font-semibold text-foreground">
                                            সিমের নাম
                                        </th>
                                        <th className="px-6 py-4 text-left font-semibold text-foreground">
                                            অপারেটর
                                        </th>
                                        <th className="px-6 py-4 text-left font-semibold text-foreground">
                                            সিম নম্বর
                                        </th>
                                        <th className="px-6 py-4 text-right font-semibold text-foreground">
                                            মোট কমিশন (৳)
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bySim.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={4}
                                                className="px-6 py-12 text-center text-muted-foreground"
                                            >
                                                এই সময়ের মধ্যে কোনো কমিশন রেকর্ড নেই।
                                            </td>
                                        </tr>
                                    ) : (
                                        bySim.map((row) => (
                                            <tr
                                                key={row.sim_id}
                                                className="border-b border-border/70 transition-colors hover:bg-muted/30"
                                            >
                                                <td className="px-6 py-4 text-muted-foreground">
                                                    {row.sim_name ?? '—'}
                                                </td>
                                                <td className="px-6 py-4">{row.operator_label}</td>
                                                <td className="px-6 py-4 font-medium">{row.sim_number}</td>
                                                <td className="px-6 py-4 text-right font-medium tabular-nums">
                                                    {row.total_commission}
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
