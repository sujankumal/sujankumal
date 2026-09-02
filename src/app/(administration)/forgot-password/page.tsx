import { Metadata } from 'next';
import { Suspense } from 'react';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';

export const metadata: Metadata = {
  title: 'Forgot Password | Sujan Kumal',
  description: 'Reset your password securely.',
};

export const instant = false;

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-white">Loading Forgot Password page...</div>}>
      <ForgotPasswordForm />
    </Suspense>
  );
}
