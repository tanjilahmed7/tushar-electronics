import { Head, Link, useForm } from '@inertiajs/react';
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

const SIMS_PATH = '/sims';

type SimEdit = {
    id: number;
    name: string | null;
    operator: string;
    sim_number: string;
    status: string;
    balance: string;
    note: string | null;
};

type Props = {
    sim: SimEdit;
    operators: Record<string, string>;
    statuses: Record<string, string>;
};

export default function SimsEdit({ sim, operators, statuses }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        name: sim.name ?? '',
        operator: sim.operator,
        sim_number: sim.sim_number,
        status: sim.status,
        balance: typeof sim.balance === 'string' ? sim.balance : String(sim.balance ?? 0),
        note: sim.note ?? '',
    });

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'ড্যাশবোর্ড', href: dashboard() },
        { title: 'সিম ব্যবস্থাপনা', href: SIMS_PATH },
        { title: 'সিম সম্পাদনা', href: `${SIMS_PATH}/${sim.id}/edit` },
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`${SIMS_PATH}/${sim.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="সিম সম্পাদনা" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6 md:p-8">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                        সিম সম্পাদনা
                    </h1>
                    <p className="mt-1 text-base text-muted-foreground">
                        সিমের তথ্য আপডেট করুন
                    </p>
                </div>

                <Card className="max-w-2xl border-border">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold">সিম তথ্য</CardTitle>
                        <CardDescription className="text-base">
                            প্রয়োজন অনুযায়ী পরিবর্তন করুন
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                            <div className="grid gap-4 sm:grid-cols-1">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-base font-medium">
                                        সিমের নাম (ঐচ্ছিক)
                                    </Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        type="text"
                                        placeholder="যেমন: অফিস প্রাইমারি"
                                        className="h-12 text-base"
                                        autoComplete="off"
                                    />
                                    <InputError message={errors.name} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="operator" className="text-base font-medium">
                                        অপারেটর *
                                    </Label>
                                    <Select
                                        value={data.operator}
                                        onValueChange={(v) => setData('operator', v)}
                                    >
                                        <SelectTrigger id="operator" className="h-12 text-base">
                                            <SelectValue placeholder="অপারেটর নির্বাচন করুন" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(operators).map(([value, label]) => (
                                                <SelectItem key={value} value={value}>
                                                    {label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.operator} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="sim_number" className="text-base font-medium">
                                        সিম নম্বর *
                                    </Label>
                                    <Input
                                        id="sim_number"
                                        value={data.sim_number}
                                        onChange={(e) => setData('sim_number', e.target.value)}
                                        type="text"
                                        required
                                        placeholder="সিম নম্বর লিখুন"
                                        className="h-12 text-base"
                                        autoComplete="off"
                                    />
                                    <InputError message={errors.sim_number} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="status" className="text-base font-medium">
                                        স্ট্যাটাস *
                                    </Label>
                                    <Select
                                        value={data.status}
                                        onValueChange={(v) => setData('status', v)}
                                    >
                                        <SelectTrigger id="status" className="h-12 text-base">
                                            <SelectValue placeholder="স্ট্যাটাস নির্বাচন করুন" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(statuses).map(([value, label]) => (
                                                <SelectItem key={value} value={value}>
                                                    {label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.status} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="balance" className="text-base font-medium">
                                        ব্যালেন্স
                                    </Label>
                                    <Input
                                        id="balance"
                                        value={data.balance}
                                        onChange={(e) => setData('balance', e.target.value)}
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="০"
                                        className="h-12 text-base"
                                        autoComplete="off"
                                    />
                                    <InputError message={errors.balance} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="note" className="text-base font-medium">
                                        নোট (ঐচ্ছিক)
                                    </Label>
                                    <textarea
                                        id="note"
                                        value={data.note}
                                        onChange={(e) => setData('note', e.target.value)}
                                        rows={4}
                                        placeholder="যেকোনো নোট লিখুন..."
                                        className="border-input placeholder:text-muted-foreground flex min-h-[120px] w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button type="submit" className="h-12 text-base px-6" disabled={processing}>
                                    {processing && <Spinner className="mr-2" />}
                                    আপডেট করুন
                                </Button>
                                <Button type="button" variant="outline" asChild className="h-12 text-base">
                                    <Link href={SIMS_PATH}>বাতিল</Link>
                                </Button>
                                <Button type="button" variant="ghost" asChild className="h-12 text-base">
                                    <Link href={`${SIMS_PATH}/${sim.id}`}>দেখুন</Link>
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}