import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { BarChart3, Eye, Smartphone, Wallet } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import {
    Bar,
    CartesianGrid,
    ComposedChart,
    Legend,
    Line,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'ড্যাশবোর্ড',
        href: dashboard(),
    },
];

type SimStats = {
    total_sims: number;
    active_sims: number;
    total_balance: string;
};

type SimBalanceRow = {
    id: number;
    name: string | null;
    sim_number: string;
    operator_label: string;
    balance: string;
    status: string;
};

type TransactionChartRow = {
    month_key: string;
    month_label: string;
    credit: number;
    debit: number;
    commission: number;
    fee?: number;
    profit?: number;
    transaction_count: number;
};

type Props = {
    simStats: SimStats;
    allSimBalances: SimBalanceRow[];
    transactionChart: TransactionChartRow[];
    chartYear: number;
    chartYears: number[];
    chartMonth?: string | null;
    chartFrom?: string | null;
    chartTo?: string | null;
};

const DASHBOARD_PATH = '/dashboard';

export default function Dashboard() {
    const {
        auth,
        simStats,
        allSimBalances,
        transactionChart,
        chartYear,
        chartYears,
        chartMonth,
        chartFrom,
        chartTo,
    } = usePage().props as {
        auth?: { user?: { name?: string } };
        simStats?: SimStats;
        allSimBalances?: SimBalanceRow[];
        transactionChart?: TransactionChartRow[];
        chartYear?: number;
        chartYears?: number[];
        chartMonth?: string | null;
        chartFrom?: string | null;
        chartTo?: string | null;
    };

    const stats = simStats ?? {
        total_sims: 0,
        active_sims: 0,
        total_balance: '0.00',
    };
    const allBalances = allSimBalances ?? [];
    const chartData = transactionChart ?? [];
    const years = chartYears ?? [new Date().getFullYear()];
    const currentChartYear = chartYear ?? new Date().getFullYear();
    const [monthFilter, setMonthFilter] = useState<string>(chartMonth ?? '');
    const [from, setFrom] = useState<string>(chartFrom ?? '');
    const [to, setTo] = useState<string>(chartTo ?? '');

    useEffect(() => {
        setMonthFilter(chartMonth ?? '');
    }, [chartMonth]);
    useEffect(() => {
        setFrom(chartFrom ?? '');
    }, [chartFrom]);
    useEffect(() => {
        setTo(chartTo ?? '');
    }, [chartTo]);

    const onYearChange = useCallback((value: string) => {
        setMonthFilter('');
        setFrom('');
        setTo('');
        router.get(
            DASHBOARD_PATH,
            { year: value, from: undefined, to: undefined },
            { preserveState: false }
        );
    }, []);

    const onMonthChange = useCallback((value: string) => {
        setMonthFilter(value);
        setFrom('');
        setTo('');
        router.get(
            DASHBOARD_PATH,
            { month: value || undefined, year: undefined, from: undefined, to: undefined },
            { preserveState: false }
        );
    }, []);

    const onDateApply = useCallback(() => {
        setMonthFilter('');
        router.get(
            DASHBOARD_PATH,
            {
                from: from || undefined,
                to: to || undefined,
                year: undefined,
            },
            { preserveState: false }
        );
    }, [from, to]);

    const formatChartMonth = (monthKey: string) => {
        const parts = monthKey.split('-').map(Number);
        if (parts.length === 3) {
            const [y, m, d] = parts;
            return new Intl.DateTimeFormat('bn-BD', {
                day: '2-digit',
                month: 'short',
            }).format(new Date(y, m - 1, d));
        }
        const [y, m] = parts;
        return new Intl.DateTimeFormat('bn-BD', {
            month: 'short',
            year: 'numeric',
        }).format(new Date(y, m - 1, 1));
    };

    const chartDataWithLabels = chartData.map((row) => ({
        ...row,
        month_display: formatChartMonth(row.month_key),
    }));

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('bn-BD', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value) + ' ৳';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="ড্যাশবোর্ড" />
            <div className="flex h-full flex-1 flex-col gap-8 overflow-x-auto p-6 md:p-8">
                <section aria-label="Welcome">
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                        স্বাগতম{auth?.user?.name ? `, ${auth.user.name}` : ''}
                    </h1>
                    <p className="mt-2 text-base leading-relaxed text-muted-foreground">
                        আপনার ড্যাশবোর্ডের সংক্ষিপ্ত বিবরণ। বাম মেনু দিয়ে
                        নেভিগেট করুন।
                    </p>
                </section>

                <section
                    className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
                    aria-label="সিম পরিসংখ্যান"
                >
                    <Card className="border-border">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                                <Smartphone className="size-5 text-muted-foreground" />
                                মোট সিম
                            </CardTitle>
                            <CardDescription className="text-base">
                                রেজিস্টার্ড সিমের সংখ্যা
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold tabular-nums">
                                {stats.total_sims}
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="border-border">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                                <Smartphone className="size-5 text-green-600 dark:text-green-400" />
                                সক্রিয় সিম
                            </CardTitle>
                            <CardDescription className="text-base">
                                সক্রিয় সিমের সংখ্যা
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold text-green-700 tabular-nums dark:text-green-400">
                                {stats.active_sims}
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="border-border">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                                <Wallet className="size-5 text-muted-foreground" />
                                মোট সিম ব্যালেন্স
                            </CardTitle>
                            <CardDescription className="text-base">
                                সব সিমের মোট ব্যালেন্স
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold tabular-nums">
                                {stats.total_balance} ৳
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="border-border sm:col-span-2 lg:col-span-1">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg font-semibold">
                                দ্রুত লিংক
                            </CardTitle>
                            <CardDescription className="text-base">
                                সিম ও ব্যালেন্স ব্যবস্থাপনা
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-2 text-base">
                            <Link
                                href="/sims"
                                className="text-primary underline hover:no-underline"
                            >
                                সিম তালিকা
                            </Link>
                            <Link
                                href="/transactions"
                                className="text-primary underline hover:no-underline"
                            >
                                লেনদেন
                            </Link>
                        </CardContent>
                    </Card>
                </section>

                <section aria-label="লেনদেনের পারফরম্যান্স">
                    <Card className="border-border">
                        <CardHeader className="pb-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                                        <BarChart3 className="size-5 text-muted-foreground" />
                                        লেনদেনের পারফরম্যান্স
                                    </CardTitle>
                                    <CardDescription className="mt-1 text-base">
                                        লাভ (কমিশন − ফি){' '}
                                        {monthFilter || from || to
                                            ? '(দিন অনুযায়ী)'
                                            : '(মাস অনুযায়ী)'}
                                    </CardDescription>
                                </div>
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
                                    <div className="flex items-center gap-2">
                                        <label
                                            htmlFor="chart-year"
                                            className="text-base font-medium whitespace-nowrap"
                                        >
                                            বছর:
                                        </label>
                                        <Select
                                            value={String(currentChartYear)}
                                            onValueChange={onYearChange}
                                            disabled={Boolean(monthFilter || from || to)}
                                        >
                                            <SelectTrigger
                                                id="chart-year"
                                                className="h-10 w-[120px] text-base"
                                            >
                                                <SelectValue placeholder="বছর" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {years.map((y) => (
                                                    <SelectItem
                                                        key={y}
                                                        value={String(y)}
                                                    >
                                                        {y}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <label
                                            htmlFor="chart-month"
                                            className="text-base font-medium whitespace-nowrap"
                                        >
                                            মাস:
                                        </label>
                                        <Input
                                            id="chart-month"
                                            type="month"
                                            value={monthFilter}
                                            onChange={(e) => onMonthChange(e.target.value)}
                                            className="h-10 w-[150px] text-base"
                                        />
                                    </div>
                                    <div className="flex items-end gap-2">
                                        <div className="space-y-1">
                                            <label
                                                htmlFor="chart-from"
                                                className="text-base font-medium whitespace-nowrap"
                                            >
                                                তারিখ থেকে
                                            </label>
                                            <Input
                                                id="chart-from"
                                                type="date"
                                                value={from}
                                                onChange={(e) => setFrom(e.target.value)}
                                                className="h-10 w-[150px] text-base"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label
                                                htmlFor="chart-to"
                                                className="text-base font-medium whitespace-nowrap"
                                            >
                                                তারিখ পর্যন্ত
                                            </label>
                                            <Input
                                                id="chart-to"
                                                type="date"
                                                value={to}
                                                onChange={(e) => setTo(e.target.value)}
                                                className="h-10 w-[150px] text-base"
                                            />
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-10 text-base w-fit"
                                            onClick={onDateApply}
                                            disabled={!from && !to}
                                        >
                                            দেখুন
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                            {chartDataWithLabels.length === 0 ? (
                                <p className="py-12 text-center text-base text-muted-foreground">
                                    এখনও কোনো লেনদেন নেই। লেনদেন যোগ করলে এখানে
                                    গ্রাফ দেখাবে।
                                </p>
                            ) : (
                                <div className="h-[320px] w-full">
                                    <ResponsiveContainer
                                        width="100%"
                                        height="100%"
                                    >
                                        <ComposedChart
                                            data={chartDataWithLabels}
                                            margin={{
                                                top: 8,
                                                right: 8,
                                                left: 0,
                                                bottom: 0,
                                            }}
                                        >
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                className="stroke-muted"
                                            />
                                            <XAxis
                                                dataKey="month_display"
                                                tick={{ fontSize: 12 }}
                                                className="text-muted-foreground"
                                            />
                                            <YAxis
                                                tick={{ fontSize: 12 }}
                                                tickFormatter={(v) =>
                                                    v >= 1000
                                                        ? `${v / 1000}k`
                                                        : String(v)
                                                }
                                                className="text-muted-foreground"
                                            />
                                            <Tooltip
                                                formatter={(
                                                    value: number,
                                                    name: string,
                                                ) => [
                                                    formatCurrency(value),
                                                    name === 'profit'
                                                        ? 'লাভ'
                                                        : name === 'commission'
                                                          ? 'কমিশন'
                                                          : name === 'fee'
                                                            ? 'ফি'
                                                            : name,
                                                ]}
                                                labelFormatter={(_, payload) =>
                                                    payload?.[0]?.payload
                                                        ?.month_display ?? ''
                                                }
                                                contentStyle={{
                                                    borderRadius: '8px',
                                                    border: '1px solid var(--border)',
                                                }}
                                            />
                                            <Legend
                                                wrapperStyle={{ fontSize: 13 }}
                                                formatter={(value) =>
                                                    value === 'profit'
                                                        ? 'লাভ'
                                                        : value === 'commission'
                                                          ? 'কমিশন'
                                                          : value === 'fee'
                                                            ? 'ফি'
                                                            : value
                                                }
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="profit"
                                                name="profit"
                                                stroke="var(--chart-3)"
                                                strokeWidth={2}
                                                dot={{ r: 4 }}
                                            />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </section>

                <section aria-label="সব সিমের ব্যালেন্স এক নজরে">
                    <Card className="border-border">
                        <CardHeader className="pb-2">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                                        <Eye className="size-5 text-muted-foreground" />
                                        সব সিমের ব্যালেন্স এক নজরে
                                    </CardTitle>
                                    <CardDescription className="mt-1 text-base">
                                        প্রতিটি সিমের বর্তমান ব্যালেন্স
                                    </CardDescription>
                                </div>
                                <Button
                                    asChild
                                    variant="outline"
                                    size="sm"
                                    className="h-10 w-fit text-base"
                                >
                                    <Link href="/sims">সিম তালিকা</Link>
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-6">
                            {allBalances.length === 0 ? (
                                <p className="py-8 text-center text-base text-muted-foreground">
                                    কোনো সিম যোগ করা হয়নি। সিম তালিকা থেকে নতুন
                                    সিম যোগ করুন।
                                </p>
                            ) : (
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                                    {allBalances.map((sim) => (
                                        <div
                                            key={sim.id}
                                            className={`rounded-lg border border-border bg-card p-4 shadow-sm transition-colors hover:bg-muted/30 ${
                                                sim.status === 'inactive'
                                                    ? 'opacity-70'
                                                    : ''
                                            }`}
                                        >
                                            <Link
                                                href={`/sims/${sim.id}`}
                                                className="block font-medium text-primary hover:underline"
                                            >
                                                {sim.name ?? sim.sim_number}
                                            </Link>
                                            <p className="mt-2 text-xl font-semibold text-foreground tabular-nums">
                                                {sim.balance} ৳
                                            </p>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                {sim.status === 'active'
                                                    ? 'সক্রিয়'
                                                    : 'নিষ্ক্রিয়'}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </section>
            </div>
        </AppLayout>
    );
}
