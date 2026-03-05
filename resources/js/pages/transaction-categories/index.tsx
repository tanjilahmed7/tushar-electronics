import { Head, Link, router, usePage } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useCallback } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

const CATEGORIES_PATH = '/transaction-categories';

type CategoryRow = {
    id: number;
    name: string;
    type: string;
    type_label: string;
    description: string | null;
    created_at: string;
};

type Props = {
    categories: CategoryRow[];
    types: Record<string, string>;
};

const breadcrumbs = (): BreadcrumbItem[] => [
    { title: 'ড্যাশবোর্ড', href: dashboard() },
    { title: 'লেনদেনের ক্যাটাগরি', href: CATEGORIES_PATH },
];

export default function TransactionCategoriesIndex({ categories, types }: Props) {
    const { flash } = usePage().props as { flash?: { status?: string } };

    const handleDelete = useCallback((id: number) => {
        if (window.confirm('আপনি কি নিশ্চিত যে এই ক্যাটাগরি মুছতে চান?')) {
            router.delete(`${CATEGORIES_PATH}/${id}`);
        }
    }, []);

    return (
        <AppLayout breadcrumbs={breadcrumbs()}>
            <Head title="লেনদেনের ক্যাটাগরি" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6 md:p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                            লেনদেনের ক্যাটাগরি
                        </h1>
                        <p className="mt-1 text-base text-muted-foreground">
                            লেনদেনের লেবেল (ক্রেডিট/ডেবিট) তৈরি ও পরিচালনা করুন
                        </p>
                    </div>
                    <Button asChild size="lg" className="h-12 text-base">
                        <Link href={`${CATEGORIES_PATH}/create`}>
                            <Plus className="mr-2 size-5" />
                            নতুন ক্যাটাগরি যোগ করুন
                        </Link>
                    </Button>
                </div>

                {flash?.status && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-base text-green-800 dark:border-green-800 dark:bg-green-950/30 dark:text-green-200">
                        {flash.status}
                    </div>
                )}

                <Card className="border-border">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-base" role="grid">
                                <thead>
                                    <tr className="border-b border-border bg-muted/50">
                                        <th className="px-6 py-4 text-left font-semibold text-foreground">
                                            ক্যাটাগরির নাম
                                        </th>
                                        <th className="px-6 py-4 text-left font-semibold text-foreground">
                                            লেনদেনের ধরন
                                        </th>
                                        <th className="px-6 py-4 text-left font-semibold text-foreground">
                                            বিবরণ
                                        </th>
                                        <th className="px-6 py-4 text-right font-semibold text-foreground">
                                            ক্রিয়া
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {categories.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                                                কোনো ক্যাটাগরি পাওয়া যায়নি। নতুন ক্যাটাগরি যোগ করতে উপরের বাটন ব্যবহার করুন।
                                            </td>
                                        </tr>
                                    ) : (
                                        categories.map((cat) => (
                                            <tr
                                                key={cat.id}
                                                className="border-b border-border/70 transition-colors hover:bg-muted/30"
                                            >
                                                <td className="px-6 py-4 font-medium">{cat.name}</td>
                                                <td className="px-6 py-4">
                                                    <span
                                                        className={
                                                            cat.type === 'credit'
                                                                ? 'text-green-700 dark:text-green-400'
                                                                : 'text-amber-700 dark:text-amber-400'
                                                        }
                                                    >
                                                        {cat.type_label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-muted-foreground">
                                                    {cat.description || '—'}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button variant="ghost" size="sm" asChild className="h-10 text-base">
                                                            <Link href={`${CATEGORIES_PATH}/${cat.id}/edit`}>
                                                                <Pencil className="mr-1 size-4" />
                                                                সম্পাদনা
                                                            </Link>
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-10 text-base text-destructive hover:text-destructive"
                                                            onClick={() => handleDelete(cat.id)}
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
