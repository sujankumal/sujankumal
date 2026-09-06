'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Google } from "@mui/icons-material";
import { CircularProgress } from "@mui/material";
import { csrfToken as getCsrfToken } from "@/services/csrf";
import { useDebounce } from "@/lib/useDebounce";
import Link from "next/link";
import { TurnstileWidget } from "./TurnstileWidget";
import { OtpInput, OtpInputHandle } from "./OtpInput";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type LoginStep = 'credentials' | 'otp';
type OtpMethod = 'totp' | 'backup';

export function LoginForm({ nonce }: { nonce?: string }) {
    const [loginStep, setLoginStep] = useState<LoginStep>('credentials');
    const [otpMethod, setOtpMethod] = useState<OtpMethod>('totp');
    const [show_credentials_error, set_show_credentials_error] = useState(false);
    const [show_error_message, set_show_error_message] = useState('');
    const [csrfToken, setCsrfToken] = useState('');
    const [isLoadingCsrf, setIsLoadingCsrf] = useState(true);
    const [captchaToken, setCaptchaToken] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [totpCode, setTotpCode] = useState('');
    const [backupCode, setBackupCode] = useState('');
    const [hasOtpError, setHasOtpError] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);

    const otpRef = useRef<OtpInputHandle>(null);

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
        const code = searchParams.get('code')?.toLowerCase();
        if (error === "CredentialsSignin") {
            if (code === 'mfa_required') {
                // Password was correct — move to OTP step without showing an error
                setLoginStep('otp');
            } else if (code === 'invalid_2fa') {
                setLoginStep('otp');
                set_show_credentials_error(true);
                set_show_error_message('Invalid two-factor authentication code. Please try again.');
            } else if (code === 'captcha_failed') {
                set_show_credentials_error(true);
                set_show_error_message('Security check failed. Please complete it again.');
            } else {
                set_show_credentials_error(true);
                set_show_error_message('Invalid email or password.');
            }
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

    const handleBackToCredentials = () => {
        setLoginStep('credentials');
        setOtpMethod('totp');
        setTotpCode('');
        setBackupCode('');
        setHasOtpError(false);
        set_show_credentials_error(false);
        set_show_error_message('');
    };

    const handleVerify2FA = async (codeToVerify: string) => {
        const trimmed = codeToVerify.trim();
        if (!trimmed || isSubmitting) return;

        setIsSubmitting(true);
        set_show_credentials_error(false);
        set_show_error_message('');
        setHasOtpError(false);

        try {
            console.log('[LoginForm:handleVerify2FA] Verifying 2FA code:', trimmed);
            const res = await signIn('credentials', {
                email,
                password,
                totpCode: trimmed,
                captchaToken,
                redirectTo: '/dashboard',
                redirect: false,
            });

            if (res?.error) {
                const errorCode = res.code?.toLowerCase();
                if (errorCode === 'invalid_2fa') {
                    set_show_credentials_error(true);
                    set_show_error_message(
                        otpMethod === 'totp'
                            ? 'Invalid 6-digit authenticator code. Please try again.'
                            : 'Invalid or already used backup code. Please try another code.'
                    );
                    setHasOtpError(true);
                    if (otpMethod === 'totp') {
                        setTotpCode('');
                        otpRef.current?.clear();
                    }
                } else if (res.error.includes('locked')) {
                    set_show_credentials_error(true);
                    set_show_error_message('Account is temporarily locked. Please try again later.');
                } else {
                    set_show_credentials_error(true);
                    set_show_error_message('Two-factor verification failed. Please try again.');
                }
            }
        } catch (error) {
            set_show_credentials_error(true);
            set_show_error_message('An unexpected error occurred during verification.');
            console.error('[LoginForm:handleVerify2FA]', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmit = async (e: React.SubmitEvent) => {
        e.preventDefault();
        if (isSubmitting) return;

        // If in OTP step, verify the active method's code
        if (loginStep === 'otp') {
            if (otpMethod === 'totp') {
                if (totpCode.length === 6) {
                    handleVerify2FA(totpCode);
                }
            } else {
                if (backupCode.trim()) {
                    handleVerify2FA(backupCode);
                }
            }
            return;
        }

        set_show_credentials_error(false);
        set_show_error_message('');

        if (loginStep === 'credentials' && (emailError || passwordError)) {
            return;
        }

        if (loginStep === 'credentials' && !captchaToken) {
            set_show_credentials_error(true);
            set_show_error_message('Please complete the security check.');
            return;
        }

        setIsSubmitting(true);

        try {
            const res = await signIn('credentials', {
                email,
                password,
                captchaToken,
                redirectTo: '/dashboard',
                redirect: false,
            });

            if (res?.error) {
                const errorCode = res.code?.toLowerCase();
                const isMfaRequired = errorCode === 'mfa_required'
                    || res.error.toUpperCase().includes('MFA_REQUIRED')
                    || res.error.toUpperCase().includes('2FA');

                if (isMfaRequired) {
                    // Password accepted — move to OTP step cleanly, no error shown
                    setLoginStep('otp');
                    setOtpMethod('totp');
                    setTotpCode('');
                    setBackupCode('');
                    setHasOtpError(false);
                    set_show_credentials_error(false);
                    set_show_error_message('');
                } else if (errorCode === 'captcha_failed') {
                    set_show_credentials_error(true);
                    set_show_error_message('Security check failed. Please complete it again.');
                } else if (res.error.includes('locked')) {
                    set_show_credentials_error(true);
                    set_show_error_message('Account is temporarily locked. Please try again later.');
                } else {
                    set_show_credentials_error(true);
                    set_show_error_message('Invalid email or password.');
                }
            }
        } catch (error) {
            set_show_credentials_error(true);
            set_show_error_message('An unexpected error occurred. Please try again.');
            console.error('[LoginForm:handleSubmit]', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGoogleSignIn = async () => {
        if (isGoogleLoading || isSubmitting) return;

        setIsGoogleLoading(true);

        try {
            await signIn("google", {
                redirectTo: "/dashboard",
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
                    {loginStep === 'otp' ? 'Two-Factor Authentication' : 'Login'}
                </div>

                <div className="w-full m-2">
                    <div className={"rounded-lg shadow-lg h-fit bg-gray-800 text-white text-sm"}>
                        <form className="m-4 p-8" id="form-sign-in" onSubmit={handleSubmit}>
                            <input name="csrfToken" type="hidden" value={csrfToken} />

                            {/* ── Step 1: Credentials ── */}
                            {loginStep === 'credentials' && (
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
                                            className={`shadow border text-white ${
                                                emailError ? 'border-red-500'
                                                : show_credentials_error ? 'border-red-500'
                                                : 'border-zinc-700'
                                            } rounded w-full py-2 px-3 mb-1 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:opacity-50`}
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
                                            className={`shadow border text-white ${
                                                passwordError ? 'border-red-500'
                                                : show_credentials_error ? 'border-red-500'
                                                : 'border-zinc-700'
                                            } rounded w-full py-2 px-3 mb-1 leading-tight focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:opacity-50`}
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
                                        nonce={nonce}
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
                                            {isSubmitting ? 'Signing In...' : 'Sign In'}
                                        </button>
                                        <Link
                                            href="/forgot-password"
                                            className="inline-block align-baseline text-sm text-gray-400 hover:text-orange-400 ml-6 transition-colors"
                                        >
                                            Forgot Password?
                                        </Link>
                                    </div>
                                </div>
                            )}

                            {/* ── Step 2: OTP / 2FA ── */}
                            {loginStep === 'otp' && (
                                <div className="border-b-2 pb-4 border-b-orange-600">
                                    {/* Info banner */}
                                    <div className="mb-4 rounded-xl border border-orange-500/40 bg-orange-950/30 p-3.5 text-orange-200">
                                        <div className="flex items-center gap-2">
                                            <span className="text-base">🛡️</span>
                                            <p className="font-semibold text-sm text-orange-300">Two-Factor Authentication</p>
                                        </div>
                                        <p className="mt-1 text-xs text-orange-200/80 leading-relaxed">
                                            {otpMethod === 'totp'
                                                ? 'Enter the 6-digit code from your authenticator app (Google Authenticator, 1Password, Authy, etc.).'
                                                : 'Enter one of your emergency recovery backup codes. Each backup code can only be used once.'}
                                        </p>
                                    </div>

                                    {/* Method Switcher Tabs */}
                                    <div className="flex rounded-lg bg-zinc-900 p-1 mb-4 border border-zinc-700/80">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setOtpMethod('totp');
                                                set_show_credentials_error(false);
                                                set_show_error_message('');
                                                setHasOtpError(false);
                                            }}
                                            disabled={isSubmitting}
                                            className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-all cursor-pointer ${
                                                otpMethod === 'totp'
                                                    ? 'bg-orange-600 text-white shadow-sm'
                                                    : 'text-zinc-400 hover:text-zinc-200'
                                            }`}
                                        >
                                            Authenticator App
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setOtpMethod('backup');
                                                set_show_credentials_error(false);
                                                set_show_error_message('');
                                                setHasOtpError(false);
                                            }}
                                            disabled={isSubmitting}
                                            className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-all cursor-pointer ${
                                                otpMethod === 'backup'
                                                    ? 'bg-orange-600 text-white shadow-sm'
                                                    : 'text-zinc-400 hover:text-zinc-200'
                                            }`}
                                        >
                                            Backup Code
                                        </button>
                                    </div>

                                    {/* Error banner */}
                                    {show_credentials_error && (
                                        <div className="mb-4 p-2.5 bg-red-950/60 border border-red-500/80 rounded-lg text-red-200 text-xs flex items-center gap-2 animate-shake">
                                            <span>⚠️</span>
                                            <span>{show_error_message}</span>
                                        </div>
                                    )}

                                    {/* ── Mode 1: 6-Digit Individual Squares ── */}
                                    {otpMethod === 'totp' && (
                                        <div className="py-2">
                                            <div className={hasOtpError ? 'animate-shake' : ''}>
                                                <OtpInput
                                                    ref={otpRef}
                                                    length={6}
                                                    value={totpCode}
                                                    onChange={(val) => {
                                                        setTotpCode(val);
                                                        if (show_credentials_error) {
                                                            set_show_credentials_error(false);
                                                            setHasOtpError(false);
                                                        }
                                                    }}
                                                    onComplete={(code) => {
                                                        handleVerify2FA(code);
                                                    }}
                                                    disabled={isSubmitting}
                                                    hasError={hasOtpError}
                                                    autoFocus
                                                />
                                            </div>

                                            <p className="text-center text-xs text-zinc-400 mt-2">
                                                {isSubmitting ? (
                                                    <span className="inline-flex items-center gap-2 text-orange-400 font-medium">
                                                        <CircularProgress size={14} sx={{ color: '#fb923c' }} />
                                                        Verifying code...
                                                    </span>
                                                ) : (
                                                    'Auto-submits as soon as the 6th digit is entered.'
                                                )}
                                            </p>
                                        </div>
                                    )}

                                    {/* ── Mode 2: Backup Recovery Code Input ── */}
                                    {otpMethod === 'backup' && (
                                        <div className="space-y-3 py-1">
                                            <div>
                                                <label
                                                    htmlFor="input-backup-code"
                                                    className="block text-xs font-medium text-zinc-300 mb-1.5"
                                                >
                                                    Emergency Recovery Code
                                                </label>
                                                <input
                                                    id="input-backup-code"
                                                    type="text"
                                                    autoComplete="off"
                                                    autoCapitalize="characters"
                                                    spellCheck={false}
                                                    value={backupCode}
                                                    onChange={(e) => {
                                                        setBackupCode(e.target.value.toUpperCase());
                                                        set_show_credentials_error(false);
                                                        setHasOtpError(false);
                                                    }}
                                                    placeholder="e.g. ABCD-1234 or 89AB-CDEF"
                                                    disabled={isSubmitting}
                                                    autoFocus
                                                    className={`w-full bg-zinc-900 border ${
                                                        show_credentials_error
                                                            ? 'border-red-500 ring-2 ring-red-500/20'
                                                            : 'border-zinc-700 focus:border-orange-500'
                                                    } rounded-xl py-2.5 px-4 text-center font-mono text-lg tracking-widest text-white placeholder:text-zinc-600 placeholder:text-sm placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-orange-500/30 disabled:opacity-50`}
                                                />
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => handleVerify2FA(backupCode)}
                                                disabled={isSubmitting || !backupCode.trim()}
                                                className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white py-2.5 px-4 rounded-xl font-medium text-sm transition-colors inline-flex items-center justify-center gap-2 cursor-pointer shadow-md"
                                            >
                                                {isSubmitting && <CircularProgress size={16} sx={{ color: '#fff' }} />}
                                                {isSubmitting ? 'Verifying Backup Code...' : 'Verify Backup Code'}
                                            </button>
                                        </div>
                                    )}

                                    {/* Navigation Links */}
                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-5 pt-3 border-t border-zinc-800">
                                        <button
                                            type="button"
                                            onClick={handleBackToCredentials}
                                            disabled={isSubmitting}
                                            className="text-xs text-zinc-400 hover:text-orange-400 transition-colors disabled:opacity-50 cursor-pointer"
                                        >
                                            ← Back to email & password
                                        </button>

                                        {otpMethod === 'totp' ? (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setOtpMethod('backup');
                                                    set_show_credentials_error(false);
                                                    set_show_error_message('');
                                                    setHasOtpError(false);
                                                }}
                                                disabled={isSubmitting}
                                                className="text-xs text-orange-400/90 hover:text-orange-300 transition-colors disabled:opacity-50 cursor-pointer font-medium"
                                            >
                                                Lost your device? Use backup code
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setOtpMethod('totp');
                                                    set_show_credentials_error(false);
                                                    set_show_error_message('');
                                                    setHasOtpError(false);
                                                }}
                                                disabled={isSubmitting}
                                                className="text-xs text-orange-400/90 hover:text-orange-300 transition-colors disabled:opacity-50 cursor-pointer font-medium"
                                            >
                                                Use authenticator app instead
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                        </form>

                        {loginStep === 'credentials' && (
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
                        )}
                    </div>
                </div>

                {loginStep === 'credentials' && (
                    <>
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
                    </>
                )}
            </div>
        </main>
    );
}
