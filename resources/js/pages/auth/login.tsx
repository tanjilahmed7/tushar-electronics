import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
};

export default function Login({
    status,
    canResetPassword,
    canRegister,
}: Props) {
    return (
        <AuthLayout
            title="আপনার অ্যাকাউন্টে লগইন করুন"
            description="লগইন করতে নিচে আপনার ইমেইল ও পাসওয়ার্ড লিখুন"
        >
            <Head title="লগইন" />

            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                className="flex flex-col gap-7"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-6">
                            <div className="grid gap-3">
                                <Label
                                    htmlFor="email"
                                    className="text-base font-medium"
                                >
                                    ইমেইল ঠিকানা
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="email"
                                    placeholder="ইমেইল@উদাহরণ.কম"
                                    className="h-12 text-base"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-3">
                                <div className="flex items-center justify-between gap-2">
                                    <Label
                                        htmlFor="password"
                                        className="text-base font-medium"
                                    >
                                        পাসওয়ার্ড
                                    </Label>
                                    {canResetPassword && (
                                        <TextLink
                                            href={request()}
                                            className="text-base"
                                            tabIndex={5}
                                        >
                                            পাসওয়ার্ড ভুলে গেছেন?
                                        </TextLink>
                                    )}
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    name="password"
                                    required
                                    tabIndex={2}
                                    autoComplete="current-password"
                                    placeholder="পাসওয়ার্ড"
                                    className="h-12 text-base"
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="flex items-center gap-3 pt-1">
                                <Checkbox
                                    id="remember"
                                    name="remember"
                                    tabIndex={3}
                                    className="size-5"
                                />
                                <Label
                                    htmlFor="remember"
                                    className="text-base cursor-pointer"
                                >
                                    আমাকে মনে রাখুন
                                </Label>
                            </div>

                            <Button
                                type="submit"
                                className="mt-2 h-12 w-full text-base font-medium"
                                tabIndex={4}
                                disabled={processing}
                                data-test="login-button"
                            >
                                {processing && <Spinner />}
                                লগইন
                            </Button>
                        </div>

                        {canRegister && (
                            <div className="text-center text-base text-muted-foreground">
                                অ্যাকাউন্ট নেই?{' '}
                                <TextLink href={register()} tabIndex={6}>
                                    নিবন্ধন করুন
                                </TextLink>
                            </div>
                        )}
                    </>
                )}
            </Form>

            {status && (
                <div className="mb-4 text-center text-sm font-medium text-green-600">
                    {status}
                </div>
            )}
        </AuthLayout>
    );
}
