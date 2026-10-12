import { Suspense } from 'react';
import type { Metadata } from 'next';
import { LoginForm } from '@/components/AuthForms';

export const metadata: Metadata = { title: '登录', description: '登录 Web3 Career，投递岗位或管理招聘。', robots: { index: false } };

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
