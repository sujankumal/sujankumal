'use client';

import { useEffect, useState, useMemo, useCallback } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { csrfToken as getCsrfToken } from "@/services/csrf";
import { useDebounce } from "@/lib/useDebounce";
import Link from "next/link";
import { Google } from "@mui/icons-material";
import { Alert, CircularProgress, Snackbar } from "@mui/material";
import { TurnstileWidget } from "./TurnstileWidget";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function SignupForm() {
    const [show_alert, set_show_alert] = useState(false);
    const [show_error_message, set_show_error_message] = useState('');
    const [csrfToken, setCsrfToken] = useState('');
    const [isLoadingCsrf, setIsLoadingCsrf] = useState(true);
    const [captchaToken, setCaptchaToken] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);

    // Debounce field inputs to delay checks while typing
    const debouncedName = useDebounce(name, 500);
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

    // Field-level validations executed only after debounce delay
    const nameError = useMemo(() => {
        if (!debouncedName) return '';
        if (debouncedName.trim().length < 2) {
            return 'Name must be at least 2 characters.';
        }
        return '';
    }, [debouncedName]);

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

    const isCheckingName = name !== debouncedName && name.length > 0;
    const isCheckingEmail = email !== debouncedEmail && email.length > 0;
    const isCheckingPassword = password !== debouncedPassword && password.length > 0;

    useEffect(() => {
        if (searchParams.get('error') === "CredentialsSignin") {
            set_show_error_message('Please re-check Email or Password');
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

    const [show_success_alert, set_show_success_alert] = useState(false);
    const [success_message, set_success_message] = useState('');

    const handle_sign_up = async (e: React.FormEvent) => {
        e.preventDefault();
        set_show_error_message('');
        if (nameError || emailError || passwordError) {
            return;
        }
        setIsSubmitting(true);

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    email,
                    password,
                    captchaToken,
                }),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                set_success_message(data.message || 'Account created successfully! Redirecting to login...');
                set_show_success_alert(true);
                setTimeout(() => {
                    router.push('/log-in?registered=true');
                }, 1500);
            } else {
                set_show_error_message(data.error || 'Failed to create account. Please check your information and try again.');
            }
        } catch {
            set_show_error_message('A network error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAlertClose = () => {
        set_show_alert(false);
        set_show_success_alert(false);
    };

    const handleGoogleSignUp = async () => {
        setIsGoogleLoading(true);
        try {
            await signIn("google");
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
            <Snackbar open={show_alert} autoHideDuration={5000} onClose={handleAlertClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert onClose={handleAlertClose} severity="error" sx={{ width: '100%' }}>
                    {show_error_message || 'Sorry! We are not able to sign up at this moment.'}
                </Alert>
            </Snackbar>
            <Snackbar open={show_success_alert} autoHideDuration={5000} onClose={handleAlertClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert onClose={handleAlertClose} severity="success" sx={{ width: '100%' }}>
                    {success_message}
                </Alert>
            </Snackbar>
            <div className="w-full max-w-[560px] md:p-8 md:m-8 shadow-xl drop-shadow-xl bg-gray-400 rounded-lg h-fit">
                <div className="text-lg font-bold text-gray-900 text-center">
                 Signup
                </div>
                <div className="w-full m-2">
                    <div className={"rounded-lg shadow-lg h-fit bg-gray-800 text-white min-w-fit text-sm"}>
                        <form className="m-4 p-8" id="form-sign-up" onSubmit={handle_sign_up}>
                            <input name="csrfToken" type="hidden" value={csrfToken} />
                            <div className="border-b-2 pb-2 border-b-orange-600">
                                <div className="mb-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="block text-sm" htmlFor="input-name-signup">
                                            Name
                                        </label>
                                        {isCheckingName && (
                                            <span className="text-xs text-orange-400 animate-pulse">Checking...</span>
                                        )}
                                    </div>
                                    <input
                                        id="input-name-signup"
                                        className={`shadow border rounded w-full py-2 px-3 leading-tight text-white ${nameError ? 'border-red-500' : 'border-zinc-700'} focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:opacity-50`}
                                        name="name"
                                        type="text"
                                        placeholder="Name"
                                        autoComplete="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        disabled={isSubmitting}
                                        required
                                    />
                                    {nameError && !isCheckingName && (
                                        <p className="text-red-400 text-xs mt-1">{nameError}</p>
                                    )}
                                </div>
                                <div className="mb-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="block text-sm" htmlFor="input-email-signup">
                                            Email
                                        </label>
                                        {isCheckingEmail && (
                                            <span className="text-xs text-orange-400 animate-pulse">Checking...</span>
                                        )}
                                    </div>
                                    <input
                                        id="input-email-signup"
                                        className={`shadow border rounded w-full py-2 px-3 leading-tight text-white ${emailError ? 'border-red-500' : 'border-zinc-700'} focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:opacity-50`}
                                        name="email"
                                        type="email"
                                        placeholder="example@sujankumal.com.np"
                                        autoComplete="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={isSubmitting}
                                        required
                                    />
                                    {emailError && !isCheckingEmail && (
                                        <p className="text-red-400 text-xs mt-1">{emailError}</p>
                                    )}
                                </div>
                                <div className="mb-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="block text-sm" htmlFor="input-password-signup">
                                            Password
                                        </label>
                                        {isCheckingPassword && (
                                            <span className="text-xs text-orange-400 animate-pulse">Checking...</span>
                                        )}
                                    </div>
                                    <input
                                        id="input-password-signup"
                                        className={`shadow border rounded w-full py-2 px-3 mb-1 leading-tight text-white ${passwordError ? 'border-red-500' : 'border-zinc-700'} focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:opacity-50`}
                                        name="password"
                                        type="password"
                                        placeholder="********"
                                        autoComplete="new-password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        disabled={isSubmitting}
                                        required
                                        minLength={8}
                                    />
                                    {passwordError && !isCheckingPassword && (
                                        <p className="text-red-400 text-xs mt-1">{passwordError}</p>
                                    )}
                                </div>

                                <TurnstileWidget
                                    onVerify={handleCaptchaVerify}
                                    onExpire={handleCaptchaReset}
                                    onError={handleCaptchaReset}
                                    className="my-4 text-xs"
                                />

                                {show_error_message && (
                                    <div className="mb-4 p-2 bg-red-900/50 border border-red-500 rounded text-red-200 text-xs">
                                        {show_error_message}
                                    </div>
                                )}

                                <div className="flex items-center justify-center mt-4">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || isLoadingCsrf || Boolean(nameError || emailError || passwordError)}
                                        className="bg-orange-600 hover:bg-orange-800 disabled:opacity-50 text-white w-full py-2 px-4 rounded-3xl focus:outline-none focus:shadow-outline transition-colors inline-flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting && <CircularProgress size={16} sx={{ color: '#fff' }} />}
                                        {isSubmitting ? 'Processing...' : 'Create account'}
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center justify-center">
                                <div className="block my-2">Already have account?</div>
                            </div>
                            <div className="flex items-center justify-center">
                                <Link href={'/log-in'} className="bg-orange-600 hover:bg-orange-800 text-white w-full py-2 px-4 rounded-3xl focus:outline-none focus:shadow-outline text-center">
                                    Go to login page
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>
                <div className="w-full flex">
                    <div className="w-full flex flex-col justify-center"><div className="w-full h-[1px] bg-orange-800"></div></div>
                    <div className="w-fit m-1 text-orange-800">Or</div>
                    <div className="w-full flex flex-col justify-center"><div className="w-full h-[1px] bg-orange-800"></div></div>
                </div>
                <div className="w-full p-2">
                    <div className="flex items-center justify-center">
                        <button
                            onClick={handleGoogleSignUp}
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
                                    {isGoogleLoading ? 'Connecting...' : 'Sign up with google'}
                                </span>
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}
