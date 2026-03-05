import { Download, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PwaInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showBanner, setShowBanner] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setShowBanner(true);
        };

        const isStandalone = window.matchMedia('(display-mode: standalone)').matches
            || (window.navigator as unknown as { standalone?: boolean }).standalone === true;

        if (!isStandalone) {
            window.addEventListener('beforeinstallprompt', handler);
        }

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = useCallback(async () => {
        if (!deferredPrompt) return;
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setShowBanner(false);
            setDeferredPrompt(null);
        }
    }, [deferredPrompt]);

    const handleDismiss = useCallback(() => {
        setDismissed(true);
        setShowBanner(false);
    }, []);

    if (!showBanner || dismissed || !deferredPrompt) {
        return null;
    }

    return (
        <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md rounded-lg border border-border bg-card p-4 shadow-lg sm:left-auto sm:right-6">
            <div className="flex items-start gap-3">
                <div className="flex flex-1 flex-col gap-2">
                    <p className="text-sm font-medium text-foreground">
                        অ্যাপ ইনস্টল করুন
                    </p>
                    <p className="text-xs text-muted-foreground">
                        হোম স্ক্রিনে যোগ করে দ্রুত অ্যাক্সেস করুন
                    </p>
                    <div className="mt-1 flex gap-2">
                        <Button size="sm" onClick={handleInstall} className="gap-1.5">
                            <Download className="size-4" />
                            ইনস্টল করুন
                        </Button>
                        <Button size="sm" variant="ghost" onClick={handleDismiss}>
                            পরে
                        </Button>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0"
                    onClick={handleDismiss}
                    aria-label="বন্ধ করুন"
                >
                    <X className="size-4" />
                </Button>
            </div>
        </div>
    );
}
