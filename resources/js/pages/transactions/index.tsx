import { Head, Link, router, usePage } from '@inertiajs/react';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

const TRANSACTIONS_PATH = '/transactions';
const CATEGORIES_PATH = '/transaction-categories';

type TransactionRow = {
    id: number;
    category_name: string;
    type: string;
    type_label: string;
    sim_id: number | null;
    sim_number: string | null;
    customer_number: string | null;
    amount: string;
    commission: string | null;
    date: string;
    note: string | null;
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

type Props = {
    transactions: PaginatedTransactions;
    filters: { search?: string; month?: string };
};

const breadcrumbs = (): BreadcrumbItem[] => [
    { title: 'ড্যাশবোর্ড', href: dashboard() },
    { title: 'লেনদেন', href: TRANSACTIONS_PATH },
];

const BANGLADESH_TZ = 'Asia/Dhaka';

/** Parse backend date (dd/mm/yyyy) and created_at (dd/mm/yyyy HH:mm) into human-readable Bangla text (Bangladesh timezone) */
function formatDateHuman(dateStr: string, createdAtStr: string): string {
    try {
        const [d, m, y] = dateStr.split('/').map(Number);
        const dateObj = new Date(y, m - 1, d);
        const dateFormatted = new Intl.DateTimeFormat('bn-BD', {
            timeZone: BANGLADESH_TZ,
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        }).format(dateObj);

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

const SUGGESTIONS_DEBOUNCE_MS = 300;
const SEARCH_SUGGESTIONS_URL = '/transactions/search-suggestions';

export default function TransactionsIndex({ transactions, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [month, setMonth] = useState(filters.month ?? '');
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const suggestionRef = useRef<HTMLDivElement>(null);

    const applySearch = useCallback(() => {
        setShowSuggestions(false);
        router.get(TRANSACTIONS_PATH, {
            search: search || undefined,
            month: month || undefined,
            page: 1,
        }, { preserveState: false });
    }, [search, month]);

    useEffect(() => {
        const q = search.trim();
        if (q.length < 1) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }
        const t = window.setTimeout(() => {
            setLoadingSuggestions(true);
            fetch(`${SEARCH_SUGGESTIONS_URL}?q=${encodeURIComponent(q)}`)
                .then((res) => res.json())
                .then((data: { suggestions?: string[] }) => {
                    setSuggestions(data.suggestions ?? []);
                    setShowSuggestions((data.suggestions?.length ?? 0) > 0);
                })
                .catch(() => setSuggestions([]))
                .finally(() => setLoadingSuggestions(false));
        }, SUGGESTIONS_DEBOUNCE_MS);
        return () => clearTimeout(t);
    }, [search]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const pickSuggestion = useCallback(
        (value: string) => {
            setSearch(value);
            setShowSuggestions(false);
            router.get(TRANSACTIONS_PATH, { search: value, page: 1 }, { preserveState: false });
        },
        []
    );

    const { flash } = usePage().props as { flash?: { status?: string } };

    const handleDelete = useCallback((id: number) => {
        if (window.confirm('আপনি কি নিশ্চিত যে এই লেনদেন মুছতে চান?')) {
            router.delete(`${TRANSACTIONS_PATH}/${id}`);
        }
    }, []);

    const { data: rows, current_page, last_page, per_page, total, from, to, links } = transactions;
    const activeSearch = (filters.search ?? '').trim().toLowerCase();

    const cellMatches = useCallback(
        (value: string | number | null | undefined): boolean => {
            if (activeSearch.length === 0) return false;
            if (value == null) return false;
            return String(value).toLowerCase().includes(activeSearch);
        },
        [activeSearch]
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs()}>
            <Head title="লেনদেন" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6 md:p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                            লেনদেন
                        </h1>
                        <p className="mt-1 text-base text-muted-foreground">
                            লেনদেনের তালিকা। সার্চ ও পেজিনেশন সার্ভার সাইড।
                        </p>
                    </div>
                    <Button asChild size="lg" className="h-12 text-base">
                        <Link href={`${TRANSACTIONS_PATH}/create`}>
                            <Plus className="mr-2 size-5" />
                            নতুন লেনদেন যোগ করুন
                        </Link>
                    </Button>
                </div>

                {flash?.status && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-base text-green-800 dark:border-green-800 dark:bg-green-950/30 dark:text-green-200">
                        {flash.status}
                    </div>
                )}

                <Card className="border-border">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg font-semibold">অনুসন্ধান ও ফিল্টার</CardTitle>
                        <div className="flex flex-col gap-4 pt-2">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-3">
                                <div className="relative flex-1 space-y-2" ref={suggestionRef}>
                                    <label htmlFor="search" className="text-base font-medium">
                                        গ্রাহক নম্বর দিয়ে খুঁজুন
                                    </label>
                                    <Input
                                        id="search"
                                        type="text"
                                        placeholder="গ্রাহক নম্বর লিখুন..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') applySearch();
                                        }}
                                        className="h-12 text-base"
                                        autoComplete="off"
                                    />
                                    {showSuggestions && (suggestions.length > 0 || loadingSuggestions) && (
                                        <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-auto rounded-md border border-border bg-background shadow-lg">
                                            {loadingSuggestions ? (
                                                <div className="px-4 py-3 text-base text-muted-foreground">
                                                    খুঁজছি...
                                                </div>
                                            ) : (
                                                suggestions.map((s, i) => (
                                                    <button
                                                        key={`${s}-${i}`}
                                                        type="button"
                                                        className="w-full px-4 py-3 text-left text-base hover:bg-muted focus:bg-muted focus:outline-none"
                                                        onClick={() => pickSuggestion(s)}
                                                    >
                                                        {s}
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2 sm:w-48">
                                    <label htmlFor="month" className="text-base font-medium">
                                        মাস অনুযায়ী ফিল্টার
                                    </label>
                                    <Input
                                        id="month"
                                        type="month"
                                        value={month}
                                        onChange={(e) => setMonth(e.target.value)}
                                        className="h-12 text-base"
                                    />
                                </div>
                                <Button onClick={applySearch} className="h-12 text-base px-6">
                                    <Search className="mr-2 size-5" />
                                    খুঁজুন
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                {activeSearch.length > 0 && (
                    <p className="text-base text-muted-foreground">
                        খুঁজার ফলাফল: <strong className="text-foreground">&quot;{filters.search}&quot;</strong> — যে কলামে মিলেছে সেটি হাইলাইট করা হয়েছে
                    </p>
                )}

                <Card className="border-border">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-base" role="grid">
                                <thead>
                                    <tr className="border-b border-border bg-muted/50">
                                        <th className="px-6 py-4 text-left font-semibold text-foreground">
                                            তারিখ
                                        </th>
                                        <th className="px-6 py-4 text-left font-semibold text-foreground">
                                            গ্রাহক নম্বর
                                        </th>
                                        <th className="px-6 py-4 text-right font-semibold text-foreground">
                                            পরিমাণ
                                        </th>
                                        <th className="px-6 py-4 text-right font-semibold text-foreground">
                                            কমিশন
                                        </th>
                                        <th className="px-6 py-4 text-left font-semibold text-foreground">
                                            সিম
                                        </th>
                                        <th className="px-6 py-4 text-left font-semibold text-foreground">
                                            ধরন
                                        </th>
                                        <th className="px-6 py-4 text-right font-semibold text-foreground">
                                            ক্রিয়া
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                                                কোনো লেনদেন পাওয়া যায়নি। প্রথমে{' '}
                                                <Link href={CATEGORIES_PATH} className="text-primary underline">
                                                    লেনদেনের ক্যাটাগরি
                                                </Link>{' '}
                                                তৈরি করুন, তারপর নতুন লেনদেন যোগ করুন।
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
                                                <td
                                                    className={`px-6 py-4 text-muted-foreground ${cellMatches(t.customer_number) ? 'bg-primary/15 font-medium text-foreground ring-1 ring-primary/30' : ''}`}
                                                >
                                                    {t.customer_number ?? '—'}
                                                </td>
                                                <td
                                                    className={`px-6 py-4 text-right font-medium ${cellMatches(t.amount) ? 'bg-primary/15 text-foreground ring-1 ring-primary/30' : ''}`}
                                                >
                                                    {t.amount}
                                                </td>
                                                <td className="px-6 py-4 text-right tabular-nums text-muted-foreground">
                                                    {t.commission != null && t.commission !== '' ? `${t.commission} ৳` : '—'}
                                                </td>
                                                <td
                                                    className={`px-6 py-4 text-muted-foreground ${cellMatches(t.sim_number) ? 'bg-primary/15 font-medium text-foreground ring-1 ring-primary/30' : ''}`}
                                                >
                                                    {t.sim_number ?? '—'}
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
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button variant="ghost" size="sm" asChild className="h-10 text-base">
                                                            <Link href={`${TRANSACTIONS_PATH}/${t.id}/edit`}>
                                                                <Pencil className="size-4" />
                                                            </Link>
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-10 text-base text-destructive hover:text-destructive"
                                                            onClick={() => handleDelete(t.id)}
                                                        >
                                                            <Trash2 className="size-4" />
                                                        </Button>
                                                    </div>
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
                                    {from != null && to != null && (
                                        <>
                                            দেখাচ্ছি <span className="font-medium text-foreground">{from}</span> থেকে{' '}
                                            <span className="font-medium text-foreground">{to}</span> (মোট{' '}
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
                                                    className="inline-flex h-10 min-w-10 cursor-default items-center justify-center rounded-md px-3 text-base text-muted-foreground"
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
