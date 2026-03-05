import { Head, Link, router, usePage } from '@inertiajs/react';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useCallback, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

const SIMS_PATH = '/sims';

type SimRow = {
    id: number;
    name: string | null;
    operator: string;
    operator_label: string;
    sim_number: string;
    status: string;
    status_label: string;
    balance: string;
    note: string | null;
    created_at: string;
};

type Props = {
    sims: SimRow[];
    filters: { search?: string; operator?: string };
    operators: Record<string, string>;
};

const breadcrumbs = (): BreadcrumbItem[] => [
    { title: 'ড্যাশবোর্ড', href: dashboard() },
    { title: 'সিম ব্যবস্থাপনা', href: SIMS_PATH },
];

export default function SimsIndex({ sims, filters, operators }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [operator, setOperator] = useState(filters.operator ?? '__all__');
    const { flash } = usePage().props as { flash?: { status?: string } };

    const applyFilters = useCallback(() => {
        router.get(SIMS_PATH, { search: search || undefined, operator: operator === '__all__' ? undefined : operator || undefined }, { preserveState: true });
    }, [search, operator]);

    const clearFilters = useCallback(() => {
        setSearch('');
        setOperator('__all__');
        router.get(SIMS_PATH);
    }, []);

    const handleDelete = useCallback((id: number) => {
        if (window.confirm('আপনি কি নিশ্চিত যে এই সিম মুছতে চান?')) {
            router.delete(`${SIMS_PATH}/${id}`);
        }
    }, []);

    return (
        <AppLayout breadcrumbs={breadcrumbs()}>
            <Head title="সিম ব্যবস্থাপনা" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6 md:p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                            সিম ব্যবস্থাপনা
                        </h1>
                        <p className="mt-1 text-base text-muted-foreground">
                            সিম কার্ড তালিকা দেখুন ও পরিচালনা করুন
                        </p>
                    </div>
                    <Button asChild size="lg" className="h-12 text-base">
                        <Link href={`${SIMS_PATH}/create`}>
                            <Plus className="mr-2 size-5" />
                            নতুন সিম যোগ করুন
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
                        <CardTitle className="text-lg font-semibold">
                            অনুসন্ধান ও ফিল্টার
                        </CardTitle>
                        <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-end sm:gap-3">
                            <div className="flex-1 space-y-2">
                                <label htmlFor="search" className="text-base font-medium">
                                    সিম নম্বর দিয়ে খুঁজুন
                                </label>
                                <Input
                                    id="search"
                                    type="text"
                                    placeholder="সিম নম্বর লিখুন..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                                    className="h-12 text-base"
                                />
                            </div>
                            <div className="space-y-2 sm:w-48">
                                <label htmlFor="operator" className="text-base font-medium">
                                    অপারেটর
                                </label>
                                <Select
                                    value={operator}
                                    onValueChange={setOperator}
                                >
                                    <SelectTrigger id="operator" className="h-12 text-base w-full">
                                        <SelectValue placeholder="সব অপারেটর" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__all__">সব অপারেটর</SelectItem>
                                        {Object.entries(operators).map(([value, label]) => (
                                            <SelectItem key={value} value={value}>
                                                {label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex gap-2">
                                <Button onClick={applyFilters} className="h-12 text-base px-6">
                                    <Search className="mr-2 size-5" />
                                    খুঁজুন
                                </Button>
                                <Button variant="outline" onClick={clearFilters} className="h-12 text-base">
                                    পরিষ্কার করুন
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                <Card className="border-border">
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
                                            বর্তমান ব্যালেন্স
                                        </th>
                                        <th className="px-6 py-4 text-left font-semibold text-foreground">
                                            স্ট্যাটাস
                                        </th>
                                        <th className="px-6 py-4 text-right font-semibold text-foreground">
                                            ক্রিয়া
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sims.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                                                কোনো সিম পাওয়া যায়নি। নতুন সিম যোগ করতে উপরের বাটন ব্যবহার করুন।
                                            </td>
                                        </tr>
                                    ) : (
                                        sims.map((sim) => (
                                            <tr
                                                key={sim.id}
                                                className="border-b border-border/70 transition-colors hover:bg-muted/30"
                                            >
                                                <td className="px-6 py-4 text-muted-foreground">{sim.name ?? '—'}</td>
                                                <td className="px-6 py-4">{sim.operator_label}</td>
                                                <td className="px-6 py-4 font-medium">{sim.sim_number}</td>
                                                <td className="px-6 py-4 text-right font-medium tabular-nums">{sim.balance}</td>
                                                <td className="px-6 py-4">
                                                    <span
                                                        className={
                                                            sim.status === 'active'
                                                                ? 'text-green-700 dark:text-green-400'
                                                                : 'text-muted-foreground'
                                                        }
                                                    >
                                                        {sim.status_label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button variant="ghost" size="sm" asChild className="h-10 text-base">
                                                            <Link href={`/sims/${sim.id}`}>
                                                                দেখুন
                                                            </Link>
                                                        </Button>
                                                        <Button variant="ghost" size="sm" asChild className="h-10 text-base">
                                                            <Link href={`/sims/${sim.id}/edit`}>
                                                                <Pencil className="size-4" />
                                                            </Link>
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-10 text-base text-destructive hover:text-destructive"
                                                            onClick={() => handleDelete(sim.id)}
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
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
