'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CircularProgress, Alert } from '@mui/material';
import { useDebounce } from '@/lib/useDebounce';
import { TurnstileWidget } from './TurnstileWidget';

export function ResetPasswordForm({ nonce }: { nonce?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tokenParam = searchParams.get('token') || '';
  const emailParam = searchParams.get('email') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const debouncedPassword = useDebounce(password, 500);
  const debouncedConfirmPassword = useDebounce(confirmPassword, 500);

  const passwordError = useMemo(() => {
    if (!debouncedPassword) return '';
    if (debouncedPassword.length < 8) {
      return 'Password must be at least 8 characters.';
    }
    return '';
  }, [debouncedPassword]);

  const confirmPasswordError = useMemo(() => {
    if (!debouncedConfirmPassword) return '';
    if (debouncedPassword && debouncedConfirmPassword !== debouncedPassword) {
      return 'Passwords do not match.';
    }
    return '';
  }, [debouncedConfirmPassword, debouncedPassword]);

  const isCheckingPassword = password !== debouncedPassword && password.length > 0;
  const isCheckingConfirm = confirmPassword !== debouncedConfirmPassword && confirmPassword.length > 0;

  useEffect(() => {
    if (!tokenParam || !emailParam) {
      setErrorMessage('Invalid or missing password reset link. Please request a new one.');
    }
  }, [tokenParam, emailParam]);

  const handleCaptchaVerify = useCallback((token: string) => {
    setCaptchaToken(token);
  }, []);

  const handleCaptchaReset = useCallback(() => {
    setCaptchaToken('');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (passwordError || confirmPasswordError || !password || !confirmPassword) return;
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (!tokenParam || !emailParam) {
      setErrorMessage('Invalid reset link.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailParam,
          token: tokenParam,
          password,
          captchaToken,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMessage(data.message || 'Password has been reset successfully! Redirecting to login...');
        setTimeout(() => {
          router.push('/log-in?reset=true');
        }, 1500);
      } else {
        setErrorMessage(data.error || 'Failed to reset password. Please try again.');
      }
    } catch {
      setErrorMessage('A network error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="p-2 w-full flex justify-center min-h-screen">
      <div className="w-full max-w-[560px] md:p-8 md:m-8 shadow-xl drop-shadow-xl bg-gray-400 rounded-lg h-fit">
        <div className="text-lg font-bold text-gray-900 text-center">
          Reset Password
        </div>
        <div className="w-full m-2">
          <div className="rounded-lg shadow-lg h-fit bg-gray-800 text-white min-w-fit text-sm">
            <form className="m-4 p-8" onSubmit={handleSubmit}>
              <div className="border-b-2 pb-2 border-b-orange-600">
                <p className="text-xs text-gray-300 mb-4">
                  Please enter your new password for account <strong>{emailParam || 'your account'}</strong>.
                </p>

                {errorMessage && (
                  <div className="mb-4 p-2 bg-red-900/50 border border-red-500 rounded text-red-200 text-xs">
                    {errorMessage}
                  </div>
                )}

                {successMessage && (
                  <div className="mb-4">
                    <Alert severity="success" sx={{ width: '100%', fontSize: '0.85rem' }}>
                      {successMessage}
                    </Alert>
                  </div>
                )}

                {!successMessage && tokenParam && emailParam && (
                  <>
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm" htmlFor="input-new-password">
                          New Password
                        </label>
                        {isCheckingPassword && (
                          <span className="text-xs text-orange-400 animate-pulse">Checking...</span>
                        )}
                      </div>
                      <input
                        id="input-new-password"
                        className={`shadow border rounded w-full py-2 px-3 leading-tight text-white ${
                          passwordError ? 'border-red-500' : 'border-zinc-700'
                        } focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:opacity-50`}
                        name="password"
                        type="password"
                        placeholder="New password (min 8 characters)"
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

                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm" htmlFor="input-confirm-password">
                          Confirm New Password
                        </label>
                        {isCheckingConfirm && (
                          <span className="text-xs text-orange-400 animate-pulse">Checking...</span>
                        )}
                      </div>
                      <input
                        id="input-confirm-password"
                        className={`shadow border rounded w-full py-2 px-3 leading-tight text-white ${
                          confirmPasswordError ? 'border-red-500' : 'border-zinc-700'
                        } focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:opacity-50`}
                        name="confirmPassword"
                        type="password"
                        placeholder="Confirm new password"
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={isSubmitting}
                        required
                        minLength={8}
                      />
                      {confirmPasswordError && !isCheckingConfirm && (
                        <p className="text-red-400 text-xs mt-1">{confirmPasswordError}</p>
                      )}
                    </div>

                    <TurnstileWidget
                      onVerify={handleCaptchaVerify}
                      onExpire={handleCaptchaReset}
                      onError={handleCaptchaReset}
                      className="my-4 text-xs"
                      nonce={nonce}
                    />

                    <div className="flex items-center justify-center mt-4">
                      <button
                        type="submit"
                        disabled={
                          isSubmitting ||
                          Boolean(passwordError || confirmPasswordError) ||
                          !password ||
                          !confirmPassword
                        }
                        className="bg-orange-600 hover:bg-orange-800 disabled:opacity-50 text-white w-full py-2 px-4 rounded-3xl focus:outline-none focus:shadow-outline transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {isSubmitting && <CircularProgress size={16} sx={{ color: '#fff' }} />}
                        {isSubmitting ? 'Updating Password...' : 'Reset Password'}
                      </button>
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center justify-center mt-6">
                <Link
                  href="/log-in"
                  className="text-sm text-orange-400 hover:text-orange-300 transition-colors"
                >
                  ← Back to Login
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
