import type { Metadata } from 'next';
import { ForgotPasswordForm } from '@/components/AuthForms';

export const metadata: Metadata = { title: '重置密码', robots: { index: false } };

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
