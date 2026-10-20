import { Form, Head, Link, usePage } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { home, register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
};

export default function Login({ status, canResetPassword }: Props) {
    const { name } = usePage().props;

    return (
        <>
            <Head title="Log in" />

            <main className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 text-slate-900 [--color-accent-foreground:#0f172a] [--color-accent:#f4f4f4] [--color-background:#fdfdfd] [--color-border:#e8e8e8] [--color-card-foreground:#0f172a] [--color-card:#fdfdfd] [--color-foreground:#0f172a] [--color-input:#e8e8e8] [--color-muted-foreground:#64748b] [--color-muted:#f4f4f4] [--color-primary-foreground:#fdfdfd] [--color-primary:#1e3a8a] [--color-ring:#94a3b8] md:p-10">
                <div className="flex w-full max-w-3xl flex-col gap-6">
                    <div className="flex justify-center">
                        <Link
                            href={home()}
                            aria-label={name}
                            className="flex w-full justify-center"
                        >
                            <img
                                src="/tdams%20no%20logo.png"
                                alt="TDAMS — Tax Declaration Archive Management System"
                                className="h-auto w-full max-w-3xl object-contain"
                            />
                        </Link>
                    </div>

                    <Card className="mx-auto w-full max-w-sm rounded-none border-black bg-card text-slate-900 shadow-none [&_[data-slot=button]]:rounded-none [&_[data-slot=checkbox]]:rounded-none [&_[data-slot=input]]:rounded-none">
                        <CardHeader className="text-center">
                            <CardTitle className="text-xl">
                                Login to your account
                            </CardTitle>
                            <CardDescription>
                                Enter your email below to login to your account
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form
                                {...store.form()}
                                resetOnSuccess={['password']}
                                className="flex flex-col gap-6"
                            >
                                {({ processing, errors }) => (
                                    <>
                                        <div className="grid gap-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="email">
                                                    Email
                                                </Label>
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    name="email"
                                                    className="autofill:shadow-[inset_0_0_0_1000px_white] autofill:[-webkit-text-fill-color:#0f172a]"
                                                    required
                                                    autoFocus
                                                    tabIndex={1}
                                                    autoComplete="email"
                                                    placeholder="m@example.com"
                                                />
                                                <InputError
                                                    message={errors.email}
                                                />
                                            </div>

                                            <div className="grid gap-2">
                                                <div className="flex items-center">
                                                    <Label htmlFor="password">
                                                        Password
                                                    </Label>
                                                    {canResetPassword && (
                                                        <TextLink
                                                            href={request()}
                                                            className="ml-auto text-sm underline-offset-4 hover:underline"
                                                            tabIndex={5}
                                                        >
                                                            Forgot your
                                                            password?
                                                        </TextLink>
                                                    )}
                                                </div>
                                                <PasswordInput
                                                    id="password"
                                                    name="password"
                                                    required
                                                    tabIndex={2}
                                                    autoComplete="current-password"
                                                />
                                                <InputError
                                                    message={errors.password}
                                                />
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <Checkbox
                                                    id="remember"
                                                    name="remember"
                                                    tabIndex={3}
                                                />
                                                <Label htmlFor="remember">
                                                    Remember me
                                                </Label>
                                            </div>

                                            {status && (
                                                <div className="text-center text-sm font-medium text-green-600">
                                                    {status}
                                                </div>
                                            )}

                                            <Button
                                                type="submit"
                                                className="w-full"
                                                tabIndex={4}
                                                disabled={processing}
                                                data-test="login-button"
                                            >
                                                {processing && <Spinner />}
                                                Login
                                            </Button>
                                        </div>

                                        <p className="text-center text-sm text-muted-foreground">
                                            Don&apos;t have an account?{' '}
                                            <TextLink
                                                href={register()}
                                                tabIndex={6}
                                            >
                                                Sign up
                                            </TextLink>
                                        </p>
                                    </>
                                )}
                            </Form>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </>
    );
}
