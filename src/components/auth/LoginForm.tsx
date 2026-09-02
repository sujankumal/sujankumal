'use client';

import { useEffect, useState, useMemo, useCallback } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Google } from "@mui/icons-material";
import { CircularProgress } from "@mui/material";
import { csrfToken as getCsrfToken } from "@/services/csrf";
import { useDebounce } from "@/lib/useDebounce";
import Link from "next/link";
import { TurnstileWidget } from "./TurnstileWidget";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginForm() {
    const [show_credentials_error, set_show_credentials_error] = useState(false);
    const [show_error_message, set_show_error_message] = useState('');
    const [csrfToken, setCsrfToken] = useState('');
    const [isLoadingCsrf, setIsLoadingCsrf] = useState(true);
    const [captchaToken, setCaptchaToken] = useState('');
    const [showTotpField, setShowTotpField] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [totpCode, setTotpCode] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);

    // Debounce inputs so checks are not triggered immediately on every keystroke
    const debouncedEmail = useDebounce(email, 500);
    const debouncedPassword = useDebounce(password, 500);

    const handleCaptchaVerify = useCallback((token: string) => {
        setCaptchaToken(token);
    }, []);

    const handleCaptchaReset = useCallback(() => {
        setCaptchaToken('');
    }, []);

    const router = useRouter();
    const { status } = useSession();
    const searchParams = useSearchParams();

    // Field-level validation after debounce delay
    const emailError = useMemo(() => {
        if (!debouncedEmail) return '';
        if (!EMAIL_REGEX.test(debouncedEmail)) {
            return 'Please enter a valid email address.';
        }
        return '';
    }, [debouncedEmail]);

    const passwordError = useMemo(() => {
        if (!debouncedPassword) return '';
        if (debouncedPassword.length < 10) {
            return 'Password must be at least 10 characters.';
        }
        return '';
    }, [debouncedPassword]);

    const isCheckingEmail = email !== debouncedEmail && email.length > 0;
    const isCheckingPassword = password !== debouncedPassword && password.length > 0;
    const [success_banner, set_success_banner] = useState('');

    useEffect(() => {
        const error = searchParams.get('error');
        if (error === "CredentialsSignin") {
            set_show_credentials_error(true);
            set_show_error_message('Invalid email or password.');
        } else if (error) {
            set_show_credentials_error(true);
            set_show_error_message(error);
        }

        if (searchParams.get('registered') === 'true') {
            set_success_banner('Account created successfully! Please sign in with your credentials.');
        } else if (searchParams.get('reset') === 'true') {
            set_success_banner('Password reset successfully! Please sign in with your new password.');
        }
    }, [searchParams]);

    useEffect(() => {
        let isMounted = true;
        setIsLoadingCsrf(true);
        getCsrfToken()
            .then((data) => {
                if (isMounted) {
                    setCsrfToken(data);
                    setIsLoadingCsrf(false);
                }
            })
            .catch(() => {
                if (isMounted) {
                    set_show_error_message('Failed to load CSRF token. Please refresh.');
                    setIsLoadingCsrf(false);
                }
            });
        return () => { isMounted = false; };
    }, []);

    useEffect(() => {
        if (status === 'authenticated') {
            router.replace('/dashboard');
        }
    }, [status, router]);

    const handleSubmit = async (e: React.SubmitEvent) => {
        e.preventDefault();
        set_show_credentials_error(false);
        set_show_error_message('');

        if (emailError || passwordError) {
            return;
        }

        setIsSubmitting(true);

        try {
            const res = await signIn('credentials', {
                email,
                password,
                totpCode: totpCode || undefined,
                captchaToken,
                redirect: false,
            });

            if (res?.error) {
                set_show_credentials_error(true);
                if (res.error.includes('MFA_REQUIRED') || res.error.includes('2FA')) {
                    setShowTotpField(true);
                    set_show_error_message('Two-factor authentication code required.');
                } else if (res.error.includes('locked')) {
                    set_show_error_message('Unable to sign in at this time.');
                } else {
                    set_show_error_message('Invalid email, password, or security code.');
                }
            } else if (res?.ok) {
                router.replace('/dashboard');
            }
        } catch {
            set_show_credentials_error(true);
            set_show_error_message('An unexpected error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGoogleSignIn = async () => {
        if (isGoogleLoading || isSubmitting) return;

        setIsGoogleLoading(true);

        try {
            await signIn("google", {
                callbackUrl: "/dashboard",
            });
        } catch {
            setIsGoogleLoading(false);
        }
    };

    if (status === 'loading') {
        return (
            <main className="p-2 w-full flex justify-center items-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-3 text-zinc-300">
                    <CircularProgress size={36} className="text-orange-500" sx={{ color: '#ea580c' }} />
                    <span className="text-sm font-medium">Checking authentication...</span>
                </div>
            </main>
        );
    }

    if (status === 'authenticated') {
        return (
            <main className="p-2 w-full flex justify-center items-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-3 text-zinc-300">
                    <CircularProgress size={36} className="text-orange-500" sx={{ color: '#ea580c' }} />
                    <span className="text-sm font-medium">Redirecting to dashboard...</span>
                </div>
            </main>
        );
    }

    return (
        <main className="p-2 w-full flex justify-center min-h-screen">
            <div className="w-full max-w-[560px] md:p-8 md:m-8 shadow-xl drop-shadow-xl bg-gray-400 rounded-lg h-fit">
                <div className="text-lg font-bold text-gray-900 text-center">
                    Login
                </div>

                <div className="w-full m-2">
                    <div className={"rounded-lg shadow-lg h-fit bg-gray-800 text-white text-sm"}>
                        <form className="m-4 p-8" id="form-sign-in" onSubmit={handleSubmit}>
                            <input name="csrfToken" type="hidden" value={csrfToken} />
                            <div className="border-b-2 pb-2 border-b-orange-600">
                                <div className="mb-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="block text-sm" htmlFor="input-email-login">
                                            Email
                                        </label>
                                        {isCheckingEmail && (
                                            <span className="text-xs text-orange-400 animate-pulse">Checking...</span>
                                        )}
                                    </div>
                                    <input
                                        id="input-email-login"
                                        name="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value);
                                            set_show_credentials_error(false);
                                        }}
                                        required
                                        disabled={isSubmitting}
                                        placeholder="example@sujankumal.com.np"
                                        className={`shadow border text-white ${emailError || show_credentials_error ? 'border-red-500' : 'border-zinc-700'} rounded w-full py-2 px-3 mb-1 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:opacity-50`}
                                    />
                                    {emailError && !isCheckingEmail && (
                                        <p className="text-red-400 text-xs mt-1">{emailError}</p>
                                    )}
                                </div>
                                <div className="mb-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="block text-sm" htmlFor="input-password-login">
                                            Password
                                        </label>
                                        {isCheckingPassword && (
                                            <span className="text-xs text-orange-400 animate-pulse">Checking...</span>
                                        )}
                                    </div>
                                    <input
                                        id="input-password-login"
                                        name="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => {
                                            setPassword(e.target.value);
                                            set_show_credentials_error(false);
                                        }}
                                        required
                                        disabled={isSubmitting}
                                        placeholder="********"
                                        className={`shadow border text-white ${passwordError || show_credentials_error ? 'border-red-500' : 'border-zinc-700'} rounded w-full py-2 px-3 mb-1 leading-tight focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:opacity-50`}
                                    />
                                    {passwordError && !isCheckingPassword && (
                                        <p className="text-red-400 text-xs mt-1">{passwordError}</p>
                                    )}
                                </div>

                                {showTotpField && (
                                    <div className="mb-4 animate-fade-in">
                                        <label className="block text-sm mb-2 text-orange-400 font-medium" htmlFor="input-totp-login">
                                            2FA / Backup Code
                                        </label>
                                        <input
                                            id="input-totp-login"
                                            name="totpCode"
                                            type="text"
                                            value={totpCode}
                                            onChange={(e) => setTotpCode(e.target.value)}
                                            placeholder="123456 or XXXX-XXXX"
                                            autoComplete="one-time-code"
                                            disabled={isSubmitting}
                                            className="shadow border border-orange-500 text-white rounded w-full py-2 px-3 mb-2 tracking-widest text-center text-lg font-mono focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
                                        />
                                    </div>
                                )}

                                <TurnstileWidget
                                    onVerify={handleCaptchaVerify}
                                    onExpire={handleCaptchaReset}
                                    onError={handleCaptchaReset}
                                    className="my-4 text-xs"
                                />

                                {success_banner && (
                                    <div className="mb-4 p-2 bg-green-900/50 border border-green-500 rounded text-green-200 text-xs">
                                        {success_banner}
                                    </div>
                                )}

                                {show_credentials_error && (
                                    <div className="mb-4 p-2 bg-red-900/50 border border-red-500 rounded text-red-200 text-xs">
                                        {show_error_message}
                                    </div>
                                )}

                                <div className="flex items-center justify-between mt-4">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || isLoadingCsrf || Boolean(emailError || passwordError)}
                                        className="bg-orange-600 hover:bg-orange-800 disabled:opacity-50 text-white py-2 px-4 mr-6 rounded-3xl focus:outline-none focus:shadow-outline transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        {isSubmitting && <CircularProgress size={16} sx={{ color: '#fff' }} />}
                                        {isSubmitting ? 'Signing In...' : showTotpField ? 'Verify & Sign In' : 'Sign In'}
                                    </button>
                                    <Link
                                        href="/forgot-password"
                                        className="inline-block align-baseline text-sm text-gray-400 hover:text-orange-400 ml-6 transition-colors"
                                    >
                                        Forgot Password?
                                    </Link>
                                </div>
                            </div>
                        </form>
                        <div className="mx-4 px-8 mb-4 pb-8">
                            <div className="flex items-center justify-center">
                                <div className="block my-2">Don&apos;t have account?</div>
                            </div>
                            <div className="flex items-center justify-center">
                                <Link href={'/sign-up'} className="bg-orange-600 hover:bg-orange-800 text-white w-full py-2 px-4 rounded-3xl focus:outline-none focus:shadow-outline text-center">
                                    Create account
                                </Link>
                            </div>
                        </div>
                    </div>

                </div>
                <div className="w-full flex">
                    <div className="w-full flex flex-col justify-center"><div className="w-full h-px bg-orange-800"></div></div>
                    <div className="w-fit m-1 text-orange-800">Or</div>
                    <div className="w-full flex flex-col justify-center"><div className="w-full h-px bg-orange-800"></div></div>
                </div>
                <div className="w-full p-2">
                    <div className="flex items-center justify-center">
                        <button
                            onClick={handleGoogleSignIn}
                            disabled={isGoogleLoading || isSubmitting}
                            className="bg-orange-600 hover:bg-orange-800 disabled:opacity-50 text-white w-full py-2 px-4 rounded-3xl focus:outline-none focus:shadow-outline inline-flex items-center justify-center"
                            type="button"
                        >
                            <span className="inline-flex items-center">
                                {isGoogleLoading ? (
                                    <CircularProgress size={20} sx={{ color: '#fff' }} className="mr-2" />
                                ) : (
                                    <Google className="mr-1" />
                                )}
                                <span className="inline-flex flex-col justify-center px-2 text-sm">
                                    {isGoogleLoading ? 'Connecting...' : 'Login with google'}
                                </span>
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}
