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

const CATEGORIES_PATH = '/transaction-categories';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'ড্যাশবোর্ড', href: dashboard() },
    { title: 'লেনদেনের ক্যাটাগরি', href: CATEGORIES_PATH },
    { title: 'নতুন ক্যাটাগরি যোগ করুন', href: `${CATEGORIES_PATH}/create` },
];

type Props = {
    types: Record<string, string>;
};

export default function TransactionCategoriesCreate({ types }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        type: 'credit' as string,
        description: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(CATEGORIES_PATH);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="নতুন ক্যাটাগরি যোগ করুন" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6 md:p-8">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                        নতুন ক্যাটাগরি যোগ করুন
                    </h1>
                    <p className="mt-1 text-base text-muted-foreground">
                        লেনদেনের লেবেল তৈরি করুন (ক্রেডিট বা ডেবিট)
                    </p>
                </div>

                <Card className="max-w-2xl border-border">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold">ক্যাটাগরি তথ্য</CardTitle>
                        <CardDescription className="text-base">
                            সব প্রয়োজনীয় ফিল্ড পূরণ করুন
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                            <div className="grid gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-base font-medium">
                                        ক্যাটাগরির নাম *
                                    </Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        type="text"
                                        required
                                        placeholder="ক্যাটাগরির নাম লিখুন"
                                        className="h-12 text-base"
                                        autoComplete="off"
                                    />
                                    <InputError message={errors.name} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="type" className="text-base font-medium">
                                        লেনদেনের ধরন *
                                    </Label>
                                    <Select
                                        value={data.type}
                                        onValueChange={(v) => setData('type', v)}
                                    >
                                        <SelectTrigger id="type" className="h-12 text-base">
                                            <SelectValue placeholder="ক্রেডিট বা ডেবিট নির্বাচন করুন" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(types).map(([value, label]) => (
                                                <SelectItem key={value} value={value}>
                                                    {label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.type} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description" className="text-base font-medium">
                                        বিবরণ (ঐচ্ছিক)
                                    </Label>
                                    <textarea
                                        id="description"
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        rows={4}
                                        placeholder="যেকোনো বিবরণ লিখুন..."
                                        className="border-input placeholder:text-muted-foreground flex min-h-[120px] w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button type="submit" className="h-12 text-base px-6" disabled={processing}>
                                    {processing && <Spinner className="mr-2" />}
                                    ক্যাটাগরি সংরক্ষণ করুন
                                </Button>
                                <Button type="button" variant="outline" asChild className="h-12 text-base">
                                    <Link href={CATEGORIES_PATH}>বাতিল</Link>
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
