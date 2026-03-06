import { Head, Link } from '@inertiajs/react';
import {
    BarChart3,
    Percent,
    Receipt,
    Tags,
    TrendingUp,
    Users,
    Wallet,
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

const iconMap: Record<string, typeof Tags> = {
    tags: Tags,
    receipt: Receipt,
    'trending-up': TrendingUp,
    'bar-chart': BarChart3,
    users: Users,
    wallet: Wallet,
    percent: Percent,
};

type ReportItem = {
    title: string;
    description: string;
    href: string;
    icon: string;
};

type Props = {
    reports: ReportItem[];
};

const breadcrumbs = (): BreadcrumbItem[] => [
    { title: 'ড্যাশবোর্ড', href: dashboard() },
    { title: 'রিপোর্ট', href: '/reports' },
];

export default function ReportsIndex({ reports }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs()}>
            <Head title="রিপোর্ট" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6 md:p-8">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                        রিপোর্ট
                    </h1>
                    <p className="mt-1 text-base text-muted-foreground">
                        নিচের রিপোর্টগুলো থেকে প্রয়োজন অনুযায়ী নির্বাচন করুন
                    </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {reports.map((report) => {
                        const Icon = iconMap[report.icon] ?? BarChart3;
                        return (
                            <Card key={report.href} className="border-border">
                                <CardHeader className="pb-2">
                                    <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                                        <Icon className="size-5 text-muted-foreground" />
                                        {report.title}
                                    </CardTitle>
                                    <CardDescription className="text-base">
                                        {report.description}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Button asChild variant="secondary" className="w-full">
                                        <Link href={report.href}>রিপোর্ট দেখুন</Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </AppLayout>
    );
}
