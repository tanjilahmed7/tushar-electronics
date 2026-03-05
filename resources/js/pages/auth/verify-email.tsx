// Components
import { Form, Head } from '@inertiajs/react';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { logout } from '@/routes';
import { send } from '@/routes/verification';

export default function VerifyEmail({ status }: { status?: string }) {
    return (
        <AuthLayout
            title="ইমেইল যাচাই করুন"
            description="রেজিস্ট্রেশনে দেওয়া ইমেইলে আমরা একটি লিংক পাঠিয়েছি। যাচাই করতে সেই লিংকে ক্লিক করুন।"
        >
            <Head title="ইমেইল যাচাই" />

            {status === 'verification-link-sent' && (
                <div className="mb-4 text-center text-sm font-medium text-green-600">
                    রেজিস্ট্রেশনে দেওয়া ইমেইলে একটি নতুন যাচাই লিংক পাঠানো হয়েছে।
                </div>
            )}

            <Form {...send.form()} className="space-y-6 text-center">
                {({ processing }) => (
                    <>
                        <Button disabled={processing} variant="secondary">
                            {processing && <Spinner />}
                            যাচাই ইমেইল আবার পাঠান
                        </Button>

                        <TextLink
                            href={logout()}
                            className="mx-auto block text-sm"
                        >
                            লগআউট
                        </TextLink>
                    </>
                )}
            </Form>
        </AuthLayout>
    );
}
