import { Head, router } from '@inertiajs/react';
import { Search, Wallet } from 'lucide-react';
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

const PATH = '/reports/commission-fee-summary';

type SimOption = { id: number; label: string };
type BySimRow = {
    sim_id: number;
    sim_display: string;
    sim_number: string;
    total_commission: string;
    total_fee: string;
    net: string;
};
type Props = {
    totalCommission: string;
    totalFee: string;
    net: string;
    bySim: BySimRow[];
    sims: SimOption[];
    filters: { month?: string; sim_id?: string | null };
};

const breadcrumbs = (): BreadcrumbItem[] => [
    { title: 'ড্যাশবোর্ড', href: dashboard() },
    { title: 'রিপোর্ট', href: '/reports' },
    { title: 'কমিশন ও ফি একত্রে', href: PATH },
];

export default function CommissionFeeSummaryReport({
    totalCommission,
    totalFee,
    net,
    bySim,
    sims,
    filters,
}: Props) {
    const [month, setMonth] = useState(filters.month ?? '');
    const [simId, setSimId] = useState(filters.sim_id ?? '');

    const applyFilter = useCallback(() => {
        router.get(
            PATH,
            { month: month || undefined, sim_id: simId || undefined },
            { preserveState: false }
        );
    }, [month, simId]);

    const monthLabel = month
        ? (() => {
              const [y, m] = month.split('-').map(Number);
              return new Intl.DateTimeFormat('bn-BD', {
                  month: 'long',
                  year: 'numeric',
              }).format(new Date(y, m - 1, 1));
          })()
        : 'সব সময়';

    return (
        <AppLayout breadcrumbs={breadcrumbs()}>
            <Head title="কমিশন ও ফি একত্রে" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6 md:p-8">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                        কমিশন ও ফি একত্রে
                    </h1>
                    <p className="mt-1 text-base text-muted-foreground">
                        মোট কমিশন, মোট ফি ও নিট (কমিশন − ফি); মাস ও সিম অনুযায়ী
                    </p>
                </div>

                <Card className="border-border">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg font-semibold">ফিল্টার</CardTitle>
                        <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:flex-wrap sm:items-end sm:gap-3">
                            <div className="space-y-2 sm:w-56">
                                <label htmlFor="month" className="text-base font-medium">
                                    মাস
                                </label>
                                <Input
                                    id="month"
                                    type="month"
                                    value={month}
                                    onChange={(e) => setMonth(e.target.value)}
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
                            <Wallet className="size-5" />
                            সারাংশ {month ? `(${monthLabel})` : ''}
                        </CardTitle>
                        <CardContent className="pt-4">
                            <div className="grid gap-4 sm:grid-cols-3">
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        মোট কমিশন
                                    </p>
                                    <p className="text-2xl font-bold tabular-nums text-foreground">
                                        ৳ {totalCommission}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">মোট ফি</p>
                                    <p className="text-2xl font-bold tabular-nums text-foreground">
                                        ৳ {totalFee}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">নিট</p>
                                    <p
                                        className={`text-2xl font-bold tabular-nums ${
                                            parseFloat(net.replace(/,/g, '')) >= 0
                                                ? 'text-foreground'
                                                : 'text-destructive'
                                        }`}
                                    >
                                        ৳ {net}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </CardHeader>
                </Card>

                <Card className="border-border">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-semibold">সিম অনুযায়ী</CardTitle>
                        <CardDescription className="text-base">
                            প্রতিটি সিমে কমিশন, ফি ও নিট
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
                                        <th className="px-6 py-4 text-right font-semibold text-foreground">
                                            কমিশন (৳)
                                        </th>
                                        <th className="px-6 py-4 text-right font-semibold text-foreground">
                                            ফি (৳)
                                        </th>
                                        <th className="px-6 py-4 text-right font-semibold text-foreground">
                                            নিট (৳)
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
                                                এই সময়ের মধ্যে কোনো রেকর্ড নেই।
                                            </td>
                                        </tr>
                                    ) : (
                                        bySim.map((row) => (
                                            <tr
                                                key={row.sim_id}
                                                className="border-b border-border/70 transition-colors hover:bg-muted/30"
                                            >
                                                <td className="px-6 py-4 font-medium">
                                                    {row.sim_display}
                                                </td>
                                                <td className="px-6 py-4 text-right tabular-nums">
                                                    {row.total_commission}
                                                </td>
                                                <td className="px-6 py-4 text-right tabular-nums">
                                                    {row.total_fee}
                                                </td>
                                                <td className="px-6 py-4 text-right tabular-nums">
                                                    {row.net}
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
