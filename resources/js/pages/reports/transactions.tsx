import { Head, Link, router } from '@inertiajs/react';
import { Pencil, Search, Wallet } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
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

const PATH = '/reports/transactions';
const TRANSACTIONS_PATH = '/transactions';

const BANGLADESH_TZ = 'Asia/Dhaka';

type TransactionRow = {
    id: number;
    category_name: string;
    type: string;
    type_label: string;
    sim_id: number | null;
    sim_number: string | null;
    sim_name: string | null;
    customer_number: string | null;
    amount: string;
    commission: string | null;
    fee: string | null;
    date: string;
    note: string | null;
    status: string;
    status_label: string;
    created_at: string;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type PaginatedTransactions = {
    data: TransactionRow[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: PaginationLink[];
};

type SimOption = { id: number; label: string };

type Props = {
    transactions: PaginatedTransactions;
    sims: SimOption[];
    filters: { search?: string; month?: string; from?: string; to?: string; sim_id?: string | null };
};

function formatDateBn(dateStr: string): string {
    try {
        const [d, m, y] = dateStr.split('/').map(Number);
        const dateObj = new Date(y, m - 1, d);
        const day = new Intl.DateTimeFormat('bn-BD', { timeZone: BANGLADESH_TZ, day: 'numeric' }).format(dateObj);
        const month = new Intl.DateTimeFormat('bn-BD', { timeZone: BANGLADESH_TZ, month: 'long' }).format(dateObj);
        const year = new Intl.DateTimeFormat('bn-BD', { timeZone: BANGLADESH_TZ, year: 'numeric' }).format(dateObj);
        return `${day} ${month}, ${year}`;
    } catch {
        return dateStr;
    }
}

function formatDateBnFromIso(iso: string): string {
    try {
        const [y, m, d] = iso.split('-').map(Number);
        const dateObj = new Date(y, m - 1, d);
        const day = new Intl.DateTimeFormat('bn-BD', { timeZone: BANGLADESH_TZ, day: 'numeric' }).format(dateObj);
        const month = new Intl.DateTimeFormat('bn-BD', { timeZone: BANGLADESH_TZ, month: 'long' }).format(dateObj);
        const year = new Intl.DateTimeFormat('bn-BD', { timeZone: BANGLADESH_TZ, year: 'numeric' }).format(dateObj);
        return `${day} ${month}, ${year}`;
    } catch {
        return iso;
    }
}

function formatDateHuman(dateStr: string, createdAtStr: string): string {
    try {
        const [d, m, y] = dateStr.split('/').map(Number);
        const dateFormatted = formatDateBn(dateStr);
        const timePart = createdAtStr?.trim().split(/\s+/)[1];
        if (timePart) {
            const [hh, min] = timePart.split(':').map(Number);
            const timeObj = new Date(y, m - 1, d, hh, min);
            const timeFormatted = new Intl.DateTimeFormat('bn-BD', {
                timeZone: BANGLADESH_TZ,
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
            }).format(timeObj);
            return `${dateFormatted}, ${timeFormatted}`;
        }
        return dateFormatted;
    } catch {
        return `${dateStr} - ${createdAtStr}`;
    }
}

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
    { title: 'লেনদেন রিপোর্ট', href: PATH },
];

export default function TransactionReport({
    transactions,
    sims,
    filters,
}: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [month, setMonth] = useState(filters.month ?? '');
    const [from, setFrom] = useState(filters.from ?? '');
    const [to, setTo] = useState(filters.to ?? '');
    const [simId, setSimId] = useState(filters.sim_id ?? '');
    const [simSearch, setSimSearch] = useState('');

    const filteredSims = useMemo(() => {
        const q = simSearch.trim().toLowerCase();
        if (!q) return sims;
        return sims.filter((s) => s.label.toLowerCase().includes(q));
    }, [sims, simSearch]);

    const applyFilter = useCallback(() => {
        router.get(PATH, {
            search: search || undefined,
            month: (!from && !to && month) ? month : undefined,
            from: from || undefined,
            to: to || undefined,
            sim_id: simId || undefined,
            page: 1,
        }, { preserveState: false });
    }, [search, month, from, to, simId]);

    const label = periodLabel(filters.month ?? '', filters.from ?? '', filters.to ?? '');

    const {
        data: rows,
        current_page,
        last_page,
        total,
        from: pageFrom,
        to: pageTo,
        links,
    } = transactions;

    return (
        <AppLayout breadcrumbs={breadcrumbs()}>
            <Head title="লেনদেন রিপোর্ট" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6 md:p-8">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                        লেনদেন রিপোর্ট
                    </h1>
                    <p className="mt-1 text-base text-muted-foreground">
                        তারিখ, সিম ও খুঁজা দিয়ে লেনদেন তালিকা দেখুন
                    </p>
                </div>

                <Card className="border-border">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg font-semibold">ফিল্টার</CardTitle>
                        <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:flex-wrap sm:items-end sm:gap-3">
                            <div className="flex-1 space-y-2 sm:min-w-[200px]">
                                <label htmlFor="search" className="text-base font-medium">
                                    খুঁজুন
                                </label>
                                <Input
                                    id="search"
                                    type="text"
                                    placeholder="গ্রাহক, সিম, ক্যাটাগরি, পরিমাণ, নোট..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && applyFilter()}
                                    className="h-12 text-base"
                                    autoComplete="off"
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
                            <div className="space-y-2 sm:w-48">
                                <label htmlFor="month" className="text-base font-medium">
                                    মাস অনুযায়ী
                                </label>
                                <Input
                                    id="month"
                                    type="month"
                                    value={month}
                                    onChange={(e) => { setMonth(e.target.value); setFrom(''); setTo(''); }}
                                    className="h-12 text-base"
                                />
                            </div>
                            <div className="space-y-2 sm:w-52">
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
                                        <div
                                            className="sticky top-0 z-10 border-b border-border bg-popover p-1.5"
                                            onPointerDown={(e) => e.stopPropagation()}
                                        >
                                            <div className="relative">
                                                <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                                                <Input
                                                    placeholder="সিম খুঁজুন..."
                                                    value={simSearch}
                                                    onChange={(e) => setSimSearch(e.target.value)}
                                                    className="h-9 pl-8 text-sm"
                                                    autoComplete="off"
                                                />
                                            </div>
                                        </div>
                                        <SelectItem value="__all__">সব সিম</SelectItem>
                                        {filteredSims.length === 0 ? (
                                            <div className="px-2 py-3 text-center text-sm text-muted-foreground">
                                                কোনো সিম পাওয়া যায়নি
                                            </div>
                                        ) : (
                                            filteredSims.map((s) => (
                                                <SelectItem key={s.id} value={String(s.id)}>
                                                    {s.label}
                                                </SelectItem>
                                            ))
                                        )}
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

                {(filters.from || filters.to || filters.month) && (
                    <p className="text-base text-muted-foreground">
                        তারিখ ফিল্টার:{' '}
                        <strong className="text-foreground">
                            {filters.from || filters.to
                                ? filters.from && filters.to
                                    ? filters.from === filters.to
                                        ? formatDateBnFromIso(filters.from)
                                        : `${formatDateBnFromIso(filters.from)} – ${formatDateBnFromIso(filters.to)}`
                                    : filters.from
                                        ? `${formatDateBnFromIso(filters.from)} থেকে`
                                        : `${formatDateBnFromIso(filters.to!)} পর্যন্ত`
                                : filters.month
                                    ? (() => {
                                        const [y, m] = filters.month!.split('-').map(Number);
                                        const dateObj = new Date(y, m - 1, 1);
                                        const monthName = new Intl.DateTimeFormat('bn-BD', { month: 'long' }).format(dateObj);
                                        const yearBn = new Intl.DateTimeFormat('bn-BD', { year: 'numeric' }).format(dateObj);
                                        return `${monthName}, ${yearBn}`;
                                    })()
                                    : ''}
                        </strong>
                    </p>
                )}

                <Card className="border-border">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                            <Wallet className="size-5" />
                            লেনদেন তালিকা ({label})
                        </CardTitle>
                        <CardDescription className="text-base">
                            তারিখ, গ্রাহক, সিম, ক্যাটাগরি ও পরিমাণ অনুযায়ী
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-base" role="grid">
                                <thead>
                                    <tr className="border-b border-border bg-muted/50">
                                        <th className="px-6 py-4 text-left font-semibold text-foreground">তারিখ</th>
                                        <th className="px-6 py-4 text-left font-semibold text-foreground">গ্রাহক নম্বর</th>
                                        <th className="px-6 py-4 text-right font-semibold text-foreground">পরিমাণ</th>
                                        <th className="px-6 py-4 text-right font-semibold text-foreground">কমিশন</th>
                                        <th className="px-6 py-4 text-right font-semibold text-foreground">ফি</th>
                                        <th className="px-6 py-4 text-left font-semibold text-foreground">সিমের নাম</th>
                                        <th className="px-6 py-4 text-left font-semibold text-foreground">ধরন</th>
                                        <th className="px-6 py-4 text-left font-semibold text-foreground">ক্যাটাগরি</th>
                                        <th className="px-6 py-4 text-left font-semibold text-foreground">নোট</th>
                                        <th className="px-6 py-4 text-right font-semibold text-foreground">ক্রিয়া</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.length === 0 ? (
                                        <tr>
                                            <td colSpan={10} className="px-6 py-12 text-center text-muted-foreground">
                                                এই ফিল্টারে কোনো লেনদেন নেই।
                                            </td>
                                        </tr>
                                    ) : (
                                        rows.map((t) => (
                                            <tr
                                                key={t.id}
                                                className="border-b border-border/70 transition-colors hover:bg-muted/30"
                                            >
                                                <td className="px-6 py-4 text-muted-foreground">
                                                    {formatDateHuman(t.date, t.created_at)}
                                                </td>
                                                <td className="px-6 py-4 text-muted-foreground">
                                                    {t.customer_number ?? '—'}
                                                </td>
                                                <td className="px-6 py-4 text-right font-medium">{t.amount}</td>
                                                <td className="px-6 py-4 text-right tabular-nums text-muted-foreground">
                                                    {t.commission != null && t.commission !== '' ? `${t.commission} ৳` : '—'}
                                                </td>
                                                <td className="px-6 py-4 text-right tabular-nums text-muted-foreground">
                                                    {t.fee != null && t.fee !== '' ? `${t.fee} ৳` : '—'}
                                                </td>
                                                <td className="px-6 py-4 text-muted-foreground">
                                                    {t.sim_name ?? t.sim_number ?? '—'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span
                                                        className={
                                                            t.type === 'credit'
                                                                ? 'text-green-700 dark:text-green-400'
                                                                : 'text-amber-700 dark:text-amber-400'
                                                        }
                                                    >
                                                        {t.type_label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-muted-foreground">
                                                    {t.category_name ?? '—'}
                                                </td>
                                                <td className="px-6 py-4 max-w-[200px] truncate text-muted-foreground" title={t.note ?? undefined}>
                                                    {t.note ?? '—'}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <Button variant="ghost" size="sm" asChild className="h-10 text-base">
                                                        <Link href={`${TRANSACTIONS_PATH}/${t.id}/edit`}>
                                                            <Pencil className="size-4" />
                                                        </Link>
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {last_page > 1 && (
                            <div className="flex flex-col gap-4 border-t border-border px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-base text-muted-foreground">
                                    {pageFrom != null && pageTo != null && (
                                        <>
                                            দেখাচ্ছি <span className="font-medium text-foreground">{pageFrom}</span> থেকে{' '}
                                            <span className="font-medium text-foreground">{pageTo}</span> (মোট{' '}
                                            <span className="font-medium text-foreground">{total}</span> টি)
                                        </>
                                    )}
                                </p>
                                <nav className="flex flex-wrap items-center gap-2" aria-label="পেজিনেশন">
                                    {links.map((link, i) => (
                                        <span key={i}>
                                            {link.url ? (
                                                <Link
                                                    href={link.url}
                                                    className={`inline-flex h-10 min-w-10 items-center justify-center rounded-md px-3 text-base font-medium transition-colors ${
                                                        link.active
                                                            ? 'bg-primary text-primary-foreground'
                                                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                                    }`}
                                                >
                                                    <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                                </Link>
                                            ) : (
                                                <span
                                                    className="inline-flex h-10 min-w-10 cursor-default items-center justify-center rounded-md px-3 text-muted-foreground"
                                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                                />
                                            )}
                                        </span>
                                    ))}
                                </nav>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
