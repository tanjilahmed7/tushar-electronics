import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { Plus, Search, Trash2 } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

const TRANSACTIONS_PATH = '/transactions';
const TRANSACTIONS_BULK_PATH = '/transactions/bulk';
const CATEGORIES_PATH = '/transaction-categories';

type CategoryOption = {
    id: number;
    name: string;
    type: string;
    type_label: string;
};

type TransactionRow = {
    transaction_category_id: string | number;
    sim_id: string | number;
    customer_number: string;
    amount: string;
    date: string;
    note: string;
    commission: string;
    fee: string;
};

type SimOption = {
    id: number;
    sim_number: string;
    sim_name: string | null;
    operator_label: string;
};

type Props = {
    categories: CategoryOption[];
    sims: SimOption[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'ড্যাশবোর্ড', href: dashboard() },
    { title: 'লেনদেন', href: TRANSACTIONS_PATH },
    { title: 'নতুন লেনদেন যোগ করুন', href: `${TRANSACTIONS_PATH}/create` },
];

const defaultRow = (): TransactionRow => ({
    transaction_category_id: '',
    sim_id: '',
    customer_number: '',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    note: '',
    commission: '',
    fee: '',
});

const simSearchMatch = (s: SimOption, q: string): boolean => {
    const qq = q.trim().toLowerCase();
    if (!qq) return true;
    const name = (s.sim_name ?? '').toLowerCase();
    const number = (s.sim_number ?? '').toLowerCase();
    const operator = (s.operator_label ?? '').toLowerCase();
    return name.includes(qq) || number.includes(qq) || operator.includes(qq);
};

const categorySearchMatch = (c: CategoryOption, q: string): boolean => {
    const qq = q.trim().toLowerCase();
    if (!qq) return true;
    const name = (c.name ?? '').toLowerCase();
    const typeLabel = (c.type_label ?? '').toLowerCase();
    return name.includes(qq) || typeLabel.includes(qq);
};

export default function TransactionsCreate({ categories, sims }: Props) {
    const [simSearch, setSimSearch] = useState('');
    const [categorySearch, setCategorySearch] = useState('');
    const { data, setData, post, processing, errors } = useForm<{
        transactions: TransactionRow[];
    }>({
        transactions: [defaultRow()],
    });

    const filteredSims = useMemo(
        () => sims.filter((s) => simSearchMatch(s, simSearch)),
        [sims, simSearch],
    );

    const filteredCategories = useMemo(
        () => categories.filter((c) => categorySearchMatch(c, categorySearch)),
        [categories, categorySearch],
    );

    const updateRow = useCallback(
        (
            index: number,
            field: keyof TransactionRow,
            value: string | number,
        ) => {
            setData(
                'transactions',
                data.transactions.map((row, i) =>
                    i === index ? { ...row, [field]: value } : row,
                ),
            );
        },
        [data.transactions, setData],
    );

    const addRow = useCallback(() => {
        setData('transactions', [...data.transactions, defaultRow()]);
    }, [data.transactions, setData]);

    const removeRow = useCallback(
        (index: number) => {
            if (data.transactions.length <= 1) return;
            setData(
                'transactions',
                data.transactions.filter((_, i) => i !== index),
            );
        },
        [data.transactions, setData],
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(TRANSACTIONS_BULK_PATH, {
            transform: (d: { transactions: TransactionRow[] }) => ({
                transactions: d.transactions.map((t) => ({
                    ...t,
                    transaction_category_id: Number(t.transaction_category_id),
                    sim_id:
                        t.sim_id && String(t.sim_id).trim() !== ''
                            ? Number(t.sim_id)
                            : null,
                    amount: Number(t.amount),
                    commission:
                        t.commission && String(t.commission).trim() !== ''
                            ? Number(t.commission)
                            : null,
                    commission_sim_id:
                        t.commission &&
                        parseFloat(String(t.commission)) > 0 &&
                        t.sim_id &&
                        String(t.sim_id).trim() !== ''
                            ? Number(t.sim_id)
                            : null,
                    fee:
                        t.fee && String(t.fee).trim() !== ''
                            ? Number(t.fee)
                            : null,
                })),
            }),
        });
    };

    const hasAnyRowError = useMemo(() => {
        return Object.keys(errors).some((k) => k.startsWith('transactions.'));
    }, [errors]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="নতুন লেনদেন যোগ করুন" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6 md:p-8">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                        নতুন লেনদেন যোগ করুন
                    </h1>
                    <p className="mt-1 text-base text-muted-foreground">
                        একসাথে একাধিক লেনদেন যোগ করতে নিচে সারি যোগ করুন।
                        ক্যাটাগরি নির্বাচন করলে ধরন (ক্রেডিট/ডেবিট)
                        স্বয়ংক্রিয়ভাবে নির্ধারিত হবে।
                    </p>
                </div>

                {categories.length === 0 && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-base text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
                        প্রথমে{' '}
                        <Link
                            href={CATEGORIES_PATH}
                            className="font-medium underline"
                        >
                            লেনদেনের ক্যাটাগরি
                        </Link>{' '}
                        তৈরি করুন। তারপর এখানে লেনদেন যোগ করতে পারবেন।
                    </div>
                )}

                <Card className="w-full border-border">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold">
                            লেনদেনের তথ্য
                        </CardTitle>
                        <CardDescription className="text-base">
                            প্রতিটি সারিতে একটি লেনদেন। আরও যোগ করতে নিচের বাটন
                            ব্যবহার করুন।
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form
                            onSubmit={handleSubmit}
                            className="flex flex-col gap-6"
                        >
                            <div className="flex flex-col gap-6">
                                {data.transactions.map((row, index) => (
                                    <TransactionRowFields
                                        key={index}
                                        index={index}
                                        row={row}
                                        categories={categories}
                                        filteredCategories={filteredCategories}
                                        categorySearch={categorySearch}
                                        setCategorySearch={setCategorySearch}
                                        sims={sims}
                                        filteredSims={filteredSims}
                                        simSearch={simSearch}
                                        setSimSearch={setSimSearch}
                                        errors={errors}
                                        onUpdate={(field, value) =>
                                            updateRow(index, field, value)
                                        }
                                        onRemove={() => removeRow(index)}
                                        canRemove={data.transactions.length > 1}
                                    />
                                ))}

                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={addRow}
                                    className="h-12 w-full max-w-xs text-base"
                                >
                                    <Plus className="mr-2 size-5" />
                                    আরও লেনদেন যোগ করুন
                                </Button>
                            </div>

                            {(hasAnyRowError || errors.transactions) && (
                                <p className="text-base text-destructive">
                                    {errors.transactions ||
                                        'উপরের কিছু ক্ষেত্রে ত্রুটি আছে। সংশোধন করুন।'}
                                </p>
                            )}

                            <div className="flex gap-3">
                                <Button
                                    type="submit"
                                    className="h-12 px-6 text-base"
                                    disabled={
                                        processing || categories.length === 0
                                    }
                                >
                                    {processing && <Spinner className="mr-2" />}
                                    {data.transactions.length === 1
                                        ? 'লেনদেন সংরক্ষণ করুন'
                                        : `${data.transactions.length}টি লেনদেন সংরক্ষণ করুন`}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    asChild
                                    className="h-12 text-base"
                                >
                                    <Link href={TRANSACTIONS_PATH}>বাতিল</Link>
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

type RowProps = {
    index: number;
    row: TransactionRow;
    categories: CategoryOption[];
    filteredCategories: CategoryOption[];
    categorySearch: string;
    setCategorySearch: (v: string) => void;
    sims: SimOption[];
    filteredSims: SimOption[];
    simSearch: string;
    setSimSearch: (v: string) => void;
    errors: Record<string, string>;
    onUpdate: (field: keyof TransactionRow, value: string | number) => void;
    onRemove: () => void;
    canRemove: boolean;
};

function TransactionRowFields({
    index,
    row,
    categories,
    filteredCategories,
    categorySearch,
    setCategorySearch,
    sims,
    filteredSims,
    simSearch,
    setSimSearch,
    errors,
    onUpdate,
    onRemove,
    canRemove,
}: RowProps) {
    const selectedCategory = useMemo(
        () =>
            categories.find(
                (c) => String(c.id) === String(row.transaction_category_id),
            ),
        [categories, row.transaction_category_id],
    );

    const err = (field: string) => errors[`transactions.${index}.${field}`];

    return (
        <div className="rounded-lg border border-border bg-muted/20 p-4">
            <div className="mb-3 flex items-center justify-between">
                <span className="text-base font-medium text-muted-foreground">
                    লেনদেন #{index + 1}
                </span>
                {canRemove && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-9 text-destructive hover:text-destructive"
                        onClick={onRemove}
                    >
                        <Trash2 className="mr-1 size-4" />
                        সরান
                    </Button>
                )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                    <Label className="text-base font-medium">ক্যাটাগরি *</Label>
                    <Select
                        value={String(row.transaction_category_id)}
                        onValueChange={(v) =>
                            onUpdate('transaction_category_id', v)
                        }
                    >
                        <SelectTrigger className="h-11 w-full text-base">
                            <SelectValue placeholder="ক্যাটাগরি নির্বাচন করুন" />
                        </SelectTrigger>
                        <SelectContent>
                            <div
                                className="sticky top-0 z-10 border-b border-border bg-popover p-1.5"
                                onPointerDown={(e) => e.stopPropagation()}
                            >
                                <div className="relative">
                                    <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="ক্যাটাগরি খুঁজুন (নাম/ধরন)..."
                                        value={categorySearch}
                                        onChange={(e) =>
                                            setCategorySearch(e.target.value)
                                        }
                                        className="h-9 pl-8 text-sm"
                                        autoComplete="off"
                                    />
                                </div>
                            </div>
                            {filteredCategories.length === 0 ? (
                                <div className="px-2 py-3 text-center text-sm text-muted-foreground">
                                    কোনো ক্যাটাগরি পাওয়া যায়নি
                                </div>
                            ) : (
                                filteredCategories.map((c) => (
                                    <SelectItem key={c.id} value={String(c.id)}>
                                        {c.name} ({c.type_label})
                                    </SelectItem>
                                ))
                            )}
                        </SelectContent>
                    </Select>
                    <InputError message={err('transaction_category_id')} />
                </div>
                <div className="space-y-2">
                    <Label className="text-base font-medium">
                        সিম (ডেবিট হলে ব্যালেন্স কাটা হবে)
                    </Label>
                    <Select
                        value={row.sim_id ? String(row.sim_id) : '__none__'}
                        onValueChange={(v) =>
                            onUpdate('sim_id', v === '__none__' ? '' : v)
                        }
                    >
                        <SelectTrigger className="h-11 w-full text-base">
                            <SelectValue placeholder="সিম নির্বাচন করুন (ঐচ্ছিক)" />
                        </SelectTrigger>
                        <SelectContent>
                            <div
                                className="sticky top-0 z-10 border-b border-border bg-popover p-1.5"
                                onPointerDown={(e) => e.stopPropagation()}
                            >
                                <div className="relative">
                                    <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="সিম খুঁজুন (নাম/নম্বর/অপারেটর)..."
                                        value={simSearch}
                                        onChange={(e) =>
                                            setSimSearch(e.target.value)
                                        }
                                        className="h-9 pl-8 text-sm"
                                        autoComplete="off"
                                    />
                                </div>
                            </div>
                            <SelectItem value="__none__">
                                কোনো সিম নয়
                            </SelectItem>
                            {filteredSims.length === 0 ? (
                                <div className="px-2 py-3 text-center text-sm text-muted-foreground">
                                    কোনো সিম পাওয়া যায়নি
                                </div>
                            ) : (
                                filteredSims.map((s) => (
                                    <SelectItem key={s.id} value={String(s.id)}>
                                        {s.sim_name
                                            ? `${s.sim_name} (${s.sim_number})`
                                            : `${s.sim_number} (${s.operator_label})`}
                                    </SelectItem>
                                ))
                            )}
                        </SelectContent>
                    </Select>
                    <InputError message={err('sim_id')} />
                </div>
                <div className="space-y-2">
                    <Label className="text-base font-medium">
                        গ্রাহক নম্বর
                    </Label>
                    <Input
                        value={row.customer_number}
                        onChange={(e) =>
                            onUpdate('customer_number', e.target.value)
                        }
                        type="text"
                        placeholder="গ্রাহক নম্বর"
                        className="h-11 w-full text-base"
                        autoComplete="off"
                    />
                    <InputError message={err('customer_number')} />
                </div>
                <div className="space-y-2">
                    <Label className="text-base font-medium">পরিমাণ *</Label>
                    <Input
                        value={row.amount}
                        onChange={(e) => onUpdate('amount', e.target.value)}
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="০"
                        className="h-11 w-full text-base"
                        autoComplete="off"
                    />
                    <InputError message={err('amount')} />
                </div>
                <div className="space-y-2">
                    <Label className="text-base font-medium">তারিখ *</Label>
                    <Input
                        value={row.date}
                        onChange={(e) => onUpdate('date', e.target.value)}
                        type="date"
                        className="h-11 w-full text-base"
                    />
                    <InputError message={err('date')} />
                </div>
                <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                    <Label className="text-base font-medium">নোট</Label>
                    <Input
                        value={row.note}
                        onChange={(e) => onUpdate('note', e.target.value)}
                        type="text"
                        placeholder="নোট (ঐচ্ছিক)"
                        className="h-11 w-full text-base"
                        autoComplete="off"
                    />
                    <InputError message={err('note')} />
                </div>
                <div className="space-y-2">
                    <Label className="text-base font-medium">
                        কমিশন (ঐচ্ছিক)
                    </Label>
                    <Input
                        value={row.commission}
                        onChange={(e) => onUpdate('commission', e.target.value)}
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="০"
                        className="h-11 w-full text-base"
                        autoComplete="off"
                    />

                    <InputError message={err('commission')} />
                </div>
                <div className="space-y-2">
                    <Label className="text-base font-medium">ফি (ঐচ্ছিক)</Label>
                    <Input
                        value={row.fee}
                        onChange={(e) => onUpdate('fee', e.target.value)}
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="০"
                        className="h-11 w-full text-base"
                        autoComplete="off"
                    />
                    <InputError message={err('fee')} />
                </div>
            </div>
            {selectedCategory && (
                <div className="mt-3 rounded border border-border bg-background px-3 py-2">
                    <span className="text-sm text-muted-foreground">ধরন: </span>
                    <span
                        className={
                            selectedCategory.type === 'credit'
                                ? 'text-green-700 dark:text-green-400'
                                : 'text-amber-700 dark:text-amber-400'
                        }
                    >
                        {selectedCategory.type_label}
                    </span>
                </div>
            )}
        </div>
    );
}
