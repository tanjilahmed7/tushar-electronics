import { Head, router } from '@inertiajs/react';
import { Search, Tags } from 'lucide-react';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

const PATH = '/reports/transaction-by-category';

type SimOption = { id: number; label: string };
type Row = {
    category_id: number;
    category_name: string;
    category_type: string;
    total_credit: string;
    total_debit: string;
    transaction_count: number;
};
type Props = {
    rows: Row[];
    sims: SimOption[];
    filters: { month?: string; from?: string; to?: string; sim_id?: string | null };
};

function periodLabel(month: string, from: string, to: string): string {
    if (from || to) {
        const fmt = (d: string) =>
            new Intl.DateTimeFormat('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(d));
        if (from && to) return from === to ? fmt(from) : `${fmt(from)} – ${fmt(to)}`;
        if (from) return `${fmt(from)} থেকে`;
        return `${fmt(to!)} পর্যন্ত`;
    }
    if (month) {
        const [y, m] = month.split('-').map(Number);
        return new Intl.DateTimeFormat('bn-BD', { month: 'long', year: 'numeric' }).format(new Date(y, m - 1, 1));
    }
    return 'সব সময়';
}

const breadcrumbs = (): BreadcrumbItem[] => [
    { title: 'ড্যাশবোর্ড', href: dashboard() },
    { title: 'রিপোর্ট', href: '/reports' },
    { title: 'ক্যাটাগরি অনুযায়ী লেনদেন', href: PATH },
];

export default function TransactionByCategoryReport({
    rows,
    sims,
    filters,
}: Props) {
    const [month, setMonth] = useState(filters.month ?? '');
    const [from, setFrom] = useState(filters.from ?? '');
    const [to, setTo] = useState(filters.to ?? '');
    const [simId, setSimId] = useState(filters.sim_id ?? '');

    const applyFilter = useCallback(() => {
        router.get(
            PATH,
            {
                month: (!from && !to && month) ? month : undefined,
                from: from || undefined,
                to: to || undefined,
                sim_id: simId || undefined,
            },
            { preserveState: false }
        );
    }, [month, from, to, simId]);

    const label = periodLabel(filters.month ?? '', filters.from ?? '', filters.to ?? '');

    return (
        <AppLayout breadcrumbs={breadcrumbs()}>
            <Head title="ক্যাটাগরি অনুযায়ী লেনদেন সংক্ষিপ্ত" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6 md:p-8">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                        ক্যাটাগরি অনুযায়ী লেনদেন সংক্ষিপ্ত
                    </h1>
                    <p className="mt-1 text-base text-muted-foreground">
                        তারিখ ও সিম অনুযায়ী প্রতিটি ক্যাটাগরিতে মোট ক্রেডিট, ডেবিট ও লেনদেন সংখ্যা
                    </p>
                </div>

                <Card className="border-border">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg font-semibold">ফিল্টার</CardTitle>
                        <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:flex-wrap sm:items-end sm:gap-3">
                            <div className="space-y-2 sm:w-52">
                                <label htmlFor="month" className="text-base font-medium">
                                    মাস
                                </label>
                                <Input
                                    id="month"
                                    type="month"
                                    value={month}
                                    onChange={(e) => { setMonth(e.target.value); setFrom(''); setTo(''); }}
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
                                    onChange={(e) => { setFrom(e.target.value); setMonth(''); }}
                                    className="h-12 text-base"
                                />
                            </div>
                            <span className="mb-3 text-muted-foreground">–</span>
                            <div className="space-y-2 sm:w-44">
                                <label htmlFor="to" className="text-base font-medium">
                                    পর্যন্ত (তারিখ)
                                </label>
                                <Input
                                    id="to"
                                    type="date"
                                    value={to}
                                    onChange={(e) => { setTo(e.target.value); setMonth(''); }}
                                    className="h-12 text-base"
                                />
                            </div>
                            <div className="space-y-2 sm:w-56">
                                <label htmlFor="sim" className="text-base font-medium">
                                    সিম (ঐচ্ছিক)
                                </label>
                                <Select
                                    value={simId || '__all__'}
                                    onValueChange={(v) => setSimId(v === '__all__' ? '' : v)}
                                >
                                    <SelectTrigger id="sim" className="h-12 text-base">
                                        <SelectValue placeholder="সব সিম" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__all__">সব সিম</SelectItem>
                                        {sims.map((s) => (
                                            <SelectItem key={s.id} value={String(s.id)}>
                                                {s.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
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
                            <Tags className="size-5" />
                            ক্যাটাগরি অনুযায়ী সংক্ষিপ্ত ({label})
                        </CardTitle>
                        <CardDescription className="text-base">
                            মোট ক্রেডিট, ডেবিট ও লেনদেন সংখ্যা
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
                                                এই ফিল্টারে কোনো তথ্য নেই।
                                            </td>
                                        </tr>
                                    ) : (
                                        rows.map((row) => (
                                            <tr
                                                key={row.category_id}
                                                className="border-b border-border/70 transition-colors hover:bg-muted/30"
                                            >
                                                <td className="px-6 py-4 font-medium">
                                                    {row.category_name}
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
