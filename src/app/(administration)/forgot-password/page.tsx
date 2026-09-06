import { Metadata } from 'next';
import { Suspense } from 'react';
import { headers } from 'next/headers';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';

export const metadata: Metadata = {
  title: 'Forgot Password | Sujan Kumal',
  description: 'Reset your password securely.',
};

export const instant = false;

export default async function ForgotPasswordPage() {
  const nonce = (await headers()).get('x-nonce') ?? undefined;
  return (
    <Suspense fallback={<div className="p-8 text-center text-white">Loading Forgot Password page...</div>}>
      <ForgotPasswordForm nonce={nonce} />
    </Suspense>
  );
}
