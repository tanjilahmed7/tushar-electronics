import { Head, Link, router, usePage } from '@inertiajs/react';
import { AlertTriangle, BarChart3, Eye, Smartphone, Wallet } from 'lucide-react';
import { useCallback } from 'react';
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
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

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

type LowBalanceSim = {
    id: number;
    sim_number: string;
    operator_label: string;
    balance: string;
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
    transaction_count: number;
};

type Props = {
    simStats: SimStats;
    lowBalanceSims: LowBalanceSim[];
    allSimBalances: SimBalanceRow[];
    transactionChart: TransactionChartRow[];
    chartYear: number;
    chartYears: number[];
};

const DASHBOARD_PATH = '/dashboard';

export default function Dashboard() {
    const { auth, simStats, lowBalanceSims, allSimBalances, transactionChart, chartYear, chartYears } =
        usePage().props as {
            auth?: { user?: { name?: string } };
            simStats?: SimStats;
            lowBalanceSims?: LowBalanceSim[];
            allSimBalances?: SimBalanceRow[];
            transactionChart?: TransactionChartRow[];
            chartYear?: number;
            chartYears?: number[];
        };

    const stats = simStats ?? { total_sims: 0, active_sims: 0, total_balance: '0.00' };
    const lowBalance = lowBalanceSims ?? [];
    const allBalances = allSimBalances ?? [];
    const chartData = transactionChart ?? [];
    const years = chartYears ?? [new Date().getFullYear()];
    const currentChartYear = chartYear ?? new Date().getFullYear();

    const onYearChange = useCallback((value: string) => {
        router.get(DASHBOARD_PATH, { year: value }, { preserveState: false });
    }, []);

    const formatChartMonth = (monthKey: string) => {
        const [y, m] = monthKey.split('-').map(Number);
        const d = new Date(y, m - 1, 1);
        return new Intl.DateTimeFormat('bn-BD', { month: 'short', year: 'numeric' }).format(d);
    };

    const chartDataWithLabels = chartData.map((row) => ({
        ...row,
        month_display: formatChartMonth(row.month_key),
    }));

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('bn-BD', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value) + ' ৳';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="ড্যাশবোর্ড" />
            <div className="flex h-full flex-1 flex-col gap-8 overflow-x-auto p-6 md:p-8">
                <section aria-label="Welcome">
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                        স্বাগতম{auth?.user?.name ? `, ${auth.user.name}` : ''}
                    </h1>
                    <p className="mt-2 text-base text-muted-foreground leading-relaxed">
                        আপনার ড্যাশবোর্ডের সংক্ষিপ্ত বিবরণ। বাম মেনু দিয়ে নেভিগেট করুন।
                    </p>
                </section>

                <section
                    className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
                    aria-label="সিম পরিসংখ্যান"
                >
                    <Card className="border-border">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                <Smartphone className="size-5 text-muted-foreground" />
                                মোট সিম
                            </CardTitle>
                            <CardDescription className="text-base">
                                রেজিস্টার্ড সিমের সংখ্যা
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold tabular-nums">{stats.total_sims}</p>
                        </CardContent>
                    </Card>
                    <Card className="border-border">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                <Smartphone className="size-5 text-green-600 dark:text-green-400" />
                                সক্রিয় সিম
                            </CardTitle>
                            <CardDescription className="text-base">
                                সক্রিয় সিমের সংখ্যা
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold tabular-nums text-green-700 dark:text-green-400">{stats.active_sims}</p>
                        </CardContent>
                    </Card>
                    <Card className="border-border">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                <Wallet className="size-5 text-muted-foreground" />
                                মোট সিম ব্যালেন্স
                            </CardTitle>
                            <CardDescription className="text-base">
                                সব সিমের মোট ব্যালেন্স
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold tabular-nums">{stats.total_balance} ৳</p>
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
                            <Link href="/sims" className="text-primary underline hover:no-underline">
                                সিম তালিকা
                            </Link>
                            <Link href="/transactions" className="text-primary underline hover:no-underline">
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
                                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                        <BarChart3 className="size-5 text-muted-foreground" />
                                        লেনদেনের পারফরম্যান্স
                                    </CardTitle>
                                    <CardDescription className="text-base mt-1">
                                        নির্বাচিত বছরের ক্রেডিট, ডেবিট ও কমিশন (মাস অনুযায়ী)
                                    </CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    <label htmlFor="chart-year" className="text-base font-medium whitespace-nowrap">
                                        বছর:
                                    </label>
                                    <Select value={String(currentChartYear)} onValueChange={onYearChange}>
                                        <SelectTrigger id="chart-year" className="w-[120px] h-10 text-base">
                                            <SelectValue placeholder="বছর" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {years.map((y) => (
                                                <SelectItem key={y} value={String(y)}>
                                                    {y}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                            {chartDataWithLabels.length === 0 ? (
                                <p className="py-12 text-center text-base text-muted-foreground">
                                    এখনও কোনো লেনদেন নেই। লেনদেন যোগ করলে এখানে গ্রাফ দেখাবে।
                                </p>
                            ) : (
                                <div className="h-[320px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ComposedChart
                                            data={chartDataWithLabels}
                                            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                            <XAxis
                                                dataKey="month_display"
                                                tick={{ fontSize: 12 }}
                                                className="text-muted-foreground"
                                            />
                                            <YAxis
                                                tick={{ fontSize: 12 }}
                                                tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : String(v))}
                                                className="text-muted-foreground"
                                            />
                                            <Tooltip
                                                formatter={(value: number, name: string) => [
                                                    formatCurrency(value),
                                                    name === 'credit' ? 'ক্রেডিট' : name === 'debit' ? 'ডেবিট' : 'কমিশন',
                                                ]}
                                                labelFormatter={(_, payload) =>
                                                    payload?.[0]?.payload?.month_display ?? ''
                                                }
                                                contentStyle={{
                                                    borderRadius: '8px',
                                                    border: '1px solid var(--border)',
                                                }}
                                            />
                                            <Legend
                                                wrapperStyle={{ fontSize: 13 }}
                                                formatter={(value) =>
                                                    value === 'credit'
                                                        ? 'ক্রেডিট'
                                                        : value === 'debit'
                                                          ? 'ডেবিট'
                                                          : value === 'commission'
                                                            ? 'কমিশন'
                                                            : value
                                                }
                                            />
                                            <Bar dataKey="credit" fill="var(--chart-1)" name="credit" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="debit" fill="var(--chart-2)" name="debit" radius={[4, 4, 0, 0]} />
                                            <Line
                                                type="monotone"
                                                dataKey="commission"
                                                name="commission"
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
                                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                        <Eye className="size-5 text-muted-foreground" />
                                        সব সিমের ব্যালেন্স এক নজরে
                                    </CardTitle>
                                    <CardDescription className="text-base mt-1">
                                        প্রতিটি সিমের বর্তমান ব্যালেন্স
                                    </CardDescription>
                                </div>
                                <Button asChild variant="outline" size="sm" className="h-10 text-base w-fit">
                                    <Link href="/sims">সিম তালিকা</Link>
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-6">
                            {allBalances.length === 0 ? (
                                <p className="py-8 text-base text-muted-foreground text-center">
                                    কোনো সিম যোগ করা হয়নি। সিম তালিকা থেকে নতুন সিম যোগ করুন।
                                </p>
                            ) : (
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                                    {allBalances.map((sim) => (
                                        <div
                                            key={sim.id}
                                            className={`rounded-lg border border-border bg-card p-4 shadow-sm transition-colors hover:bg-muted/30 ${
                                                sim.status === 'inactive' ? 'opacity-70' : ''
                                            }`}
                                        >
                                            <Link
                                                href={`/sims/${sim.id}`}
                                                className="block font-medium text-primary hover:underline"
                                            >
                                                {sim.name ?? sim.sim_number}
                                            </Link>
                                            <p className="mt-2 text-xl font-semibold tabular-nums text-foreground">
                                                {sim.balance} ৳
                                            </p>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                {sim.status === 'active' ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </section>

                {lowBalance.length > 0 && (
                    <section aria-label="কম ব্যালেন্স সতর্কতা">
                        <Card className="border-amber-200 dark:border-amber-800">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg font-semibold flex items-center gap-2 text-amber-800 dark:text-amber-200">
                                    <AlertTriangle className="size-5" />
                                    কম ব্যালেন্সের সিম
                                </CardTitle>
                                <CardDescription className="text-base">
                                    ১০০ ৳ এর নিচে ব্যালেন্স আছে এমন সিমগুলো রিচার্জ করুন
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2 text-base">
                                    {lowBalance.map((sim) => (
                                        <li key={sim.id} className="flex items-center justify-between rounded-md bg-amber-50 px-3 py-2 dark:bg-amber-950/30">
                                            <span className="font-medium">{sim.sim_number}</span>
                                            <span className="text-amber-700 dark:text-amber-300 tabular-nums">{sim.balance} ৳</span>
                                            <Link
                                                href="/sims"
                                                className="text-sm text-primary underline hover:no-underline"
                                            >
                                                সিম দেখুন
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    </section>
                )}

                <section className="flex-1">
                    <Card className="border-border">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg font-semibold">ড্যাশবোর্ড</CardTitle>
                            <CardDescription className="text-base">
                                আপনার মূল ওয়ার্কস্পেস। উপরের কার্ডগুলোতে সিম ও ব্যালেন্সের সারসংক্ষেপ দেখানো হয়েছে।
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="min-h-24 text-base text-muted-foreground leading-relaxed">
                            লেনদেন ও সিম ব্যালেন্স পরিচালনার জন্য সাইডবার মেনু ব্যবহার করুন।
                        </CardContent>
                    </Card>
                </section>
            </div>
        </AppLayout>
    );
}
