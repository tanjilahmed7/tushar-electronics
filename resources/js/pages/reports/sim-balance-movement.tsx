import { Head, router } from '@inertiajs/react';
import { Search, TrendingUp } from 'lucide-react';
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

const PATH = '/reports/sim-balance-movement';

type SimOption = { id: number; label: string };
type Row = {
    id: number;
    type: string;
    type_label: string;
    amount: string;
    balance_after: string;
    date: string;
    note: string | null;
};
type Props = {
    rows: Row[];
    sims: SimOption[];
    filters: { sim_id?: string; from?: string; to?: string };
};

const breadcrumbs = (): BreadcrumbItem[] => [
    { title: 'ড্যাশবোর্ড', href: dashboard() },
    { title: 'রিপোর্ট', href: '/reports' },
    { title: 'সিম ব্যালেন্স চলাচল', href: PATH },
];

export default function SimBalanceMovementReport({
    rows,
    sims,
    filters,
}: Props) {
    const [simId, setSimId] = useState(filters.sim_id ?? '');
    const [from, setFrom] = useState(filters.from ?? '');
    const [to, setTo] = useState(filters.to ?? '');

    const applyFilter = useCallback(() => {
        router.get(
            PATH,
            {
                sim_id: simId || undefined,
                from: from || undefined,
                to: to || undefined,
            },
            { preserveState: false }
        );
    }, [simId, from, to]);

    return (
        <AppLayout breadcrumbs={breadcrumbs()}>
            <Head title="সিম ব্যালেন্স চলাচল" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6 md:p-8">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                        সিম ব্যালেন্স চলাচল
                    </h1>
                    <p className="mt-1 text-base text-muted-foreground">
                        নির্বাচিত সিমের ব্যালেন্স যোগ/বিয়োগের হিসাব (লেজার)
                    </p>
                </div>

                <Card className="border-border">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg font-semibold">ফিল্টার</CardTitle>
                        <CardDescription className="text-base">
                            সিম নির্বাচন বাধ্যতামূলক; তারিখ রেঞ্জ ঐচ্ছিক
                        </CardDescription>
                        <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:flex-wrap sm:items-end sm:gap-3">
                            <div className="space-y-2 sm:w-56">
                                <label htmlFor="sim" className="text-base font-medium">
                                    সিম
                                </label>
                                <Select
                                    value={simId || '__none__'}
                                    onValueChange={(v) => setSimId(v === '__none__' ? '' : v)}
                                >
                                    <SelectTrigger id="sim" className="h-12 text-base">
                                        <SelectValue placeholder="সিম নির্বাচন করুন" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__none__">
                                            সিম নির্বাচন করুন
                                        </SelectItem>
                                        {sims.map((s) => (
                                            <SelectItem key={s.id} value={String(s.id)}>
                                                {s.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
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
                            <TrendingUp className="size-5" />
                            ব্যালেন্স চলাচল
                        </CardTitle>
                        <CardDescription className="text-base">
                            তারিখ, ধরন (যোগ/বিয়োগ), পরিমাণ, ব্যালেন্স পর ও নোট
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-base" role="grid">
                                <thead>
                                    <tr className="border-b border-border bg-muted/50">
                                        <th className="px-6 py-4 text-left font-semibold text-foreground">
                                            তারিখ
                                        </th>
                                        <th className="px-6 py-4 text-left font-semibold text-foreground">
                                            ধরন
                                        </th>
                                        <th className="px-6 py-4 text-right font-semibold text-foreground">
                                            পরিমাণ (৳)
                                        </th>
                                        <th className="px-6 py-4 text-right font-semibold text-foreground">
                                            ব্যালেন্স পর (৳)
                                        </th>
                                        <th className="px-6 py-4 text-left font-semibold text-foreground">
                                            নোট
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={5}
                                                className="px-6 py-12 text-center text-muted-foreground"
                                            >
                                                সিম নির্বাচন করুন অথবা এই ফিল্টারে কোনো রেকর্ড নেই।
                                            </td>
                                        </tr>
                                    ) : (
                                        rows.map((row) => (
                                            <tr
                                                key={row.id}
                                                className="border-b border-border/70 transition-colors hover:bg-muted/30"
                                            >
                                                <td className="px-6 py-4">{row.date}</td>
                                                <td className="px-6 py-4">{row.type_label}</td>
                                                <td className="px-6 py-4 text-right tabular-nums">
                                                    {row.amount}
                                                </td>
                                                <td className="px-6 py-4 text-right tabular-nums">
                                                    {row.balance_after}
                                                </td>
                                                <td className="px-6 py-4 text-muted-foreground">
                                                    {row.note ?? '—'}
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
