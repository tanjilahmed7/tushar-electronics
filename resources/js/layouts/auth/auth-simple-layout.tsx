import { Link } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { login } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div
            className="flex min-h-svh flex-col items-center justify-center bg-background p-6 md:p-10"
            role="main"
        >
            <div className="w-full max-w-104">
                <div className="flex flex-col gap-10">
                    <div className="flex flex-col items-center gap-6">
                        <Link
                            href={login()}
                            className="flex flex-col items-center gap-3 font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
                        >
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg">
                                <AppLogoIcon className="size-12 fill-current text-foreground dark:text-white" />
                            </div>
                            <span className="sr-only">{title}</span>
                        </Link>

                        <div className="space-y-3 text-center">
                            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                                {title}
                            </h1>
                            <p className="text-base text-muted-foreground leading-relaxed max-w-sm mx-auto">
                                {description}
                            </p>
                        </div>
                    </div>
                    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
