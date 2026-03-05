import { Head, Link, useForm } from '@inertiajs/react';
import { useMemo } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

const TRANSACTIONS_PATH = '/transactions';
const CATEGORIES_PATH = '/transaction-categories';

type CategoryOption = {
    id: number;
    name: string;
    type: string;
    type_label: string;
};

type SimOption = { id: number; sim_number: string; operator_label: string; balance: string };

type TransactionEdit = {
    id: number;
    transaction_category_id: number;
    sim_id: number | null;
    customer_number: string | null;
    amount: string;
    date: string;
    note: string | null;
    commission: string | null;
};

type Props = {
    transaction: TransactionEdit;
    categories: CategoryOption[];
    sims: SimOption[];
};

export default function TransactionsEdit({ transaction, categories, sims }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        transaction_category_id: transaction.transaction_category_id,
        sim_id: transaction.sim_id ?? '',
        customer_number: transaction.customer_number ?? '',
        amount: String(transaction.amount),
        date: transaction.date,
        note: transaction.note ?? '',
        commission: transaction.commission != null && transaction.commission !== '' ? String(transaction.commission) : '',
    });

    const selectedCategory = useMemo(
        () => categories.find((c) => c.id === data.transaction_category_id),
        [categories, data.transaction_category_id]
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`${TRANSACTIONS_PATH}/${transaction.id}`, {
            transform: (d) => ({
                ...d,
                transaction_category_id: Number(d.transaction_category_id),
                sim_id: d.sim_id && String(d.sim_id).trim() !== '' ? Number(d.sim_id) : null,
                amount: Number(d.amount),
                commission: d.commission && String(d.commission).trim() !== '' ? Number(d.commission) : null,
                commission_sim_id: (d.commission && parseFloat(String(d.commission)) > 0 && d.sim_id && String(d.sim_id).trim() !== '') ? Number(d.sim_id) : null,
            }),
        });
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'ড্যাশবোর্ড', href: dashboard() },
        { title: 'লেনদেন', href: TRANSACTIONS_PATH },
        { title: 'লেনদেন সম্পাদনা', href: `${TRANSACTIONS_PATH}/${transaction.id}/edit` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="লেনদেন সম্পাদনা" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6 md:p-8">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                        লেনদেন সম্পাদনা
                    </h1>
                    <p className="mt-1 text-base text-muted-foreground">
                        লেনদেন # {transaction.id} — তথ্য পরিবর্তন করলে সিম ব্যালেন্স স্বয়ংক্রিয়ভাবে সামঞ্জস্য করা হবে।
                    </p>
                </div>

                {sims.length === 0 && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-base text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
                        সিম তালিকায় কোনো সিম নেই। ডেবিট বা কমিশন ব্যবহার করতে সিম যোগ করুন।
                    </div>
                )}

                <Card className="max-w-2xl border-border">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold">লেনদেনের তথ্য</CardTitle>
                        <CardDescription className="text-base">
                            প্রয়োজন অনুযায়ী পরিবর্তন করুন
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                            <div className="grid gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="transaction_category_id" className="text-base font-medium">
                                        লেনদেনের ক্যাটাগরি *
                                    </Label>
                                    <Select
                                        value={String(data.transaction_category_id)}
                                        onValueChange={(v) => setData('transaction_category_id', v)}
                                    >
                                        <SelectTrigger id="transaction_category_id" className="h-12 text-base">
                                            <SelectValue placeholder="ক্যাটাগরি নির্বাচন করুন" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map((c) => (
                                                <SelectItem key={c.id} value={String(c.id)}>
                                                    {c.name} ({c.type_label})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.transaction_category_id} />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-base font-medium">সিম (ডেবিট হলে ব্যালেন্স কাটা হবে)</Label>
                                    <Select
                                        value={data.sim_id ? String(data.sim_id) : '__none__'}
                                        onValueChange={(v) => setData('sim_id', v === '__none__' ? '' : v)}
                                    >
                                        <SelectTrigger className="h-12 text-base">
                                            <SelectValue placeholder="সিম নির্বাচন করুন (ঐচ্ছিক)" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="__none__">কোনো সিম নয়</SelectItem>
                                            {sims.map((s) => (
                                                <SelectItem key={s.id} value={String(s.id)}>
                                                    {s.sim_number} ({s.operator_label}) — ব্যালেন্স: {s.balance}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.sim_id} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="customer_number" className="text-base font-medium">
                                        গ্রাহক নম্বর (ঐচ্ছিক)
                                    </Label>
                                    <Input
                                        id="customer_number"
                                        value={data.customer_number}
                                        onChange={(e) => setData('customer_number', e.target.value)}
                                        type="text"
                                        placeholder="গ্রাহক নম্বর"
                                        className="h-12 text-base"
                                        autoComplete="off"
                                    />
                                    <InputError message={errors.customer_number} />
                                </div>

                                {selectedCategory && (
                                    <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
                                        <p className="text-sm font-medium text-muted-foreground">লেনদেনের ধরন</p>
                                        <p
                                            className={`mt-1 text-xl font-semibold ${
                                                selectedCategory.type === 'credit'
                                                    ? 'text-green-700 dark:text-green-400'
                                                    : 'text-amber-700 dark:text-amber-400'
                                            }`}
                                        >
                                            {selectedCategory.type_label}
                                        </p>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="amount" className="text-base font-medium">
                                        পরিমাণ *
                                    </Label>
                                    <Input
                                        id="amount"
                                        value={data.amount}
                                        onChange={(e) => setData('amount', e.target.value)}
                                        type="number"
                                        required
                                        min="0"
                                        step="0.01"
                                        placeholder="০"
                                        className="h-12 text-base"
                                        autoComplete="off"
                                    />
                                    <InputError message={errors.amount} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="date" className="text-base font-medium">
                                        তারিখ *
                                    </Label>
                                    <Input
                                        id="date"
                                        value={data.date}
                                        onChange={(e) => setData('date', e.target.value)}
                                        type="date"
                                        required
                                        className="h-12 text-base"
                                    />
                                    <InputError message={errors.date} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="note" className="text-base font-medium">
                                        নোট (ঐচ্ছিক)
                                    </Label>
                                    <textarea
                                        id="note"
                                        value={data.note}
                                        onChange={(e) => setData('note', e.target.value)}
                                        rows={3}
                                        placeholder="যেকোনো নোট..."
                                        className="border-input placeholder:text-muted-foreground flex min-h-[80px] w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                    />
                                    <InputError message={errors.note} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="commission" className="text-base font-medium">
                                        কমিশন (ঐচ্ছিক)
                                    </Label>
                                    <Input
                                        id="commission"
                                        value={data.commission}
                                        onChange={(e) => setData('commission', e.target.value)}
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="০"
                                        className="h-12 text-base"
                                        autoComplete="off"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        কমিশন নির্বাচিত সিমের ব্যালেন্সে ক্রেডিট যোগ করবে
                                    </p>
                                    <InputError message={errors.commission} />
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    type="submit"
                                    className="h-12 text-base px-6"
                                    disabled={processing}
                                >
                                    {processing && <Spinner className="mr-2" />}
                                    আপডেট করুন
                                </Button>
                                <Button type="button" variant="outline" asChild className="h-12 text-base">
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
