import { Metadata } from 'next';
import { Suspense } from 'react';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';

export const metadata: Metadata = {
  title: 'Reset Password | Sujan Kumal',
  description: 'Set your new account password.',
};

export const instant = false;

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-white">Loading Reset Password page...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
