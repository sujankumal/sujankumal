'use client';

import React, { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { CircularProgress, Alert } from '@mui/material';
import { useDebounce } from '@/lib/useDebounce';
import { TurnstileWidget } from './TurnstileWidget';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ForgotPasswordForm({ nonce }: { nonce?: string }) {
  const [email, setEmail] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const debouncedEmail = useDebounce(email, 500);

  const emailError = useMemo(() => {
    if (!debouncedEmail) return '';
    if (!EMAIL_REGEX.test(debouncedEmail)) {
      return 'Please enter a valid email address.';
    }
    return '';
  }, [debouncedEmail]);

  const isCheckingEmail = email !== debouncedEmail && email.length > 0;

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

    if (emailError || !email) return;

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, captchaToken }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMessage(data.message || 'If an account exists with that email, reset instructions have been sent.');
      } else {
        setErrorMessage(data.error || 'Failed to request password reset. Please try again.');
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
          Forgot Password
        </div>
        <div className="w-full m-2">
          <div className="rounded-lg shadow-lg h-fit bg-gray-800 text-white min-w-fit text-sm">
            <form className="m-4 p-8" onSubmit={handleSubmit}>
              <div className="border-b-2 pb-2 border-b-orange-600">
                <p className="text-xs text-gray-300 mb-4">
                  Enter your registered email address and we will send you instructions to reset your password.
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

                {!successMessage && (
                  <>
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm" htmlFor="input-email-forgot">
                          Email Address
                        </label>
                        {isCheckingEmail && (
                          <span className="text-xs text-orange-400 animate-pulse">Checking...</span>
                        )}
                      </div>
                      <input
                        id="input-email-forgot"
                        className={`shadow border rounded w-full py-2 px-3 leading-tight text-white ${
                          emailError ? 'border-red-500' : 'border-zinc-700'
                        } focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:opacity-50`}
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
                        disabled={isSubmitting || Boolean(emailError) || !email}
                        className="bg-orange-600 hover:bg-orange-800 disabled:opacity-50 text-white w-full py-2 px-4 rounded-3xl focus:outline-none focus:shadow-outline transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {isSubmitting && <CircularProgress size={16} sx={{ color: '#fff' }} />}
                        {isSubmitting ? 'Sending Link...' : 'Send Reset Link'}
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
