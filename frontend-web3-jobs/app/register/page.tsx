import { Suspense } from 'react';
import type { Metadata } from 'next';
import { RegisterForm } from '@/components/AuthForms';

export const metadata: Metadata = { title: '注册', description: '注册 Web3 Career，成为求职者或招聘方。', robots: { index: false } };

export default function RegisterPage() {
  return <Suspense><RegisterForm /></Suspense>;
}
