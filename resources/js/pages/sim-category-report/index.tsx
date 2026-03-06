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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

const REPORT_PATH = '/sim-category-report';

type SimOption = { id: number; sim_number: string; sim_name: string | null; label: string };

type Row = {
    sim_id: number;
    sim_name: string | null;
    sim_number: string;
    sim_display: string;
    category_id: number;
    category_name: string;
    transaction_count: number;
};

type Props = {
    rows: Row[];
    sims: SimOption[];
    filters: { month?: string; from?: string; to?: string; sim_id?: string | null };
};

const breadcrumbs = (): BreadcrumbItem[] => [
    { title: 'ড্যাশবোর্ড', href: dashboard() },
    { title: 'রিপোর্ট', href: '/reports' },
    { title: 'সিম–ক্যাটাগরি রিপোর্ট', href: REPORT_PATH },
];

function periodLabel(month: string, from: string, to: string): string {
    if (from || to) {
        const fmt = (d: string) =>
            new Intl.DateTimeFormat('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(d));
        if (from && to) return `${fmt(from)} – ${fmt(to)}`;
        if (from) return `${fmt(from)} থেকে`;
        return `${fmt(to!)} পর্যন্ত`;
    }
    if (month) {
        const [y, m] = month.split('-').map(Number);
        return new Intl.DateTimeFormat('bn-BD', { month: 'long', year: 'numeric' }).format(new Date(y, m - 1, 1));
    }
    return 'সব সময়';
}

export default function SimCategoryReportIndex({ rows, sims, filters }: Props) {
    const [month, setMonth] = useState(filters.month ?? '');
    const [from, setFrom]   = useState(filters.from ?? '');
    const [to, setTo]       = useState(filters.to ?? '');
    const [simId, setSimId] = useState<string>(filters.sim_id ?? '');

    const applyFilter = useCallback(() => {
        router.get(
            REPORT_PATH,
            {
                month: (!from && !to && month) ? month : undefined,
                from: from || undefined,
                to: to || undefined,
                sim_id: simId || undefined,
            },
            { preserveState: false }
        );
    }, [month, from, to, simId]);

    const selectedSimLabel = simId ? sims.find((s) => String(s.id) === simId)?.label : null;
    const label = periodLabel(filters.month ?? '', filters.from ?? '', filters.to ?? '');

    return (
        <AppLayout breadcrumbs={breadcrumbs()}>
            <Head title="সিম–ক্যাটাগরি রিপোর্ট" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6 md:p-8">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                        সিম–ক্যাটাগরি রিপোর্ট
                    </h1>
                    <p className="mt-1 text-base text-muted-foreground">
                        প্রতিটি সিমে কোন ক্যাটাগরিতে কতগুলো লেনদেন হয়েছে তা মাস বা দিন অনুযায়ী দেখুন
                    </p>
                </div>

                <Card className="border-border">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg font-semibold">সিম ও তারিখ অনুযায়ী ফিল্টার</CardTitle>
                        <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:flex-wrap sm:items-end sm:gap-3">
                            <div className="space-y-2 sm:w-52">
                                <label htmlFor="sim_filter" className="text-base font-medium">
                                    সিম নির্বাচন করুন
                                </label>
                                <Select
                                    value={simId || '__all__'}
                                    onValueChange={(v) => setSimId(v === '__all__' ? '' : v)}
                                >
                                    <SelectTrigger id="sim_filter" className="h-12 text-base">
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
                            <div className="space-y-2 sm:w-48">
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
                            <div className="flex items-end gap-2">
                                <div className="space-y-2 sm:w-40">
                                    <label htmlFor="from" className="text-base font-medium">
                                        তারিখ থেকে
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
                                <div className="space-y-2 sm:w-40">
                                    <label htmlFor="to" className="text-base font-medium">
                                        তারিখ পর্যন্ত
                                    </label>
                                    <Input
                                        id="to"
                                        type="date"
                                        value={to}
                                        onChange={(e) => { setTo(e.target.value); setMonth(''); }}
                                        className="h-12 text-base"
                                    />
                                </div>
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
                            সিম অনুযায়ী ক্যাটাগরি ও লেনদেন সংখ্যা
                            {(selectedSimLabel || filters.month || filters.from || filters.to) &&
                                ` (${[selectedSimLabel, label !== 'সব সময়' ? label : null].filter(Boolean).join(' · ')})`}
                        </CardTitle>
                        <CardDescription className="text-base">
                            {selectedSimLabel
                                ? `নির্বাচিত সিমে কোন ক্যাটাগরিতে কতবার লেনদেন হয়েছে`
                                : 'যে সিমে কোন ক্যাটাগরিতে কতবার লেনদেন হয়েছে'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-base" role="grid">
                                <thead>
                                    <tr className="border-b border-border bg-muted/50">
                                        <th className="px-6 py-4 text-left font-semibold text-foreground">
                                            সিম
                                        </th>
                                        <th className="px-6 py-4 text-left font-semibold text-foreground">
                                            ক্যাটাগরি
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
                                                colSpan={3}
                                                className="px-6 py-12 text-center text-muted-foreground"
                                            >
                                                এই সময়ের মধ্যে কোনো লেনদেন নেই অথবা সব লেনদেন সিম ছাড়া।
                                            </td>
                                        </tr>
                                    ) : (
                                        rows.map((row, index) => (
                                            <tr
                                                key={`${row.sim_id}-${row.category_id}-${index}`}
                                                className="border-b border-border/70 transition-colors hover:bg-muted/30"
                                            >
                                                <td className="px-6 py-4">
                                                    <span className="font-medium">
                                                        {row.sim_display}
                                                    </span>
                                                    {row.sim_number !== row.sim_display && (
                                                        <span className="ml-1 text-muted-foreground">
                                                            ({row.sim_number})
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-muted-foreground">
                                                    {row.category_name}
                                                </td>
                                                <td className="px-6 py-4 text-right font-medium tabular-nums">
                                                    {row.transaction_count} বার
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
