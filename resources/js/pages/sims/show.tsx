import { Head, Link } from '@inertiajs/react';
import { Pencil } from 'lucide-react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

const SIMS_PATH = '/sims';

type SimShow = {
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
    updated_at: string;
};

type Props = {
    sim: SimShow;
};

export default function SimsShow({ sim }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'ড্যাশবোর্ড', href: dashboard() },
        { title: 'সিম ব্যবস্থাপনা', href: SIMS_PATH },
        { title: 'সিম বিস্তারিত', href: `${SIMS_PATH}/${sim.id}` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`সিম - ${sim.sim_number}`} />
            <div className="flex h-full flex-1 flex-col gap-6 p-6 md:p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                            সিম বিস্তারিত
                        </h1>
                        <p className="mt-1 text-base text-muted-foreground">
                            সিম নম্বর: {sim.sim_number}
                        </p>
                    </div>
                    <Button asChild size="lg" className="h-12 text-base" variant="outline">
                        <Link href={`${SIMS_PATH}/${sim.id}/edit`}>
                            <Pencil className="mr-2 size-5" />
                            সম্পাদনা
                        </Link>
                    </Button>
                </div>

                <Card className="max-w-2xl border-border">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold">সিম তথ্য</CardTitle>
                        <CardDescription className="text-base">
                            সংরক্ষিত বিবরণ
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-4 sm:grid-cols-2">
                            {sim.name && (
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">সিমের নাম</p>
                                    <p className="mt-1 text-base font-medium">{sim.name}</p>
                                </div>
                            )}
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">অপারেটর</p>
                                <p className="mt-1 text-base font-medium">{sim.operator_label}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">সিম নম্বর</p>
                                <p className="mt-1 text-base font-medium">{sim.sim_number}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">স্ট্যাটাস</p>
                                <p className={`mt-1 text-base font-medium ${sim.status === 'active' ? 'text-green-700 dark:text-green-400' : 'text-muted-foreground'}`}>
                                    {sim.status_label}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">বর্তমান ব্যালেন্স</p>
                                <p className="mt-1 text-base font-medium tabular-nums">{sim.balance}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">আপডেট হয়েছে</p>
                                <p className="mt-1 text-base">{sim.updated_at}</p>
                            </div>
                        </div>
                        {sim.note && (
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">নোট</p>
                                <p className="mt-1 text-base whitespace-pre-wrap">{sim.note}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div>
                    <Button variant="ghost" asChild className="text-base">
                        <Link href={SIMS_PATH}>← সিম তালিকায় ফিরে যান</Link>
                    </Button>
                </div>
            </div>
        </AppLayout>
    );
}