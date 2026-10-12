import { Suspense } from 'react';
import type { Metadata } from 'next';
import ProfileCenter from '@/components/ProfileCenter';

export const metadata: Metadata = { title: '个人中心', robots: { index: false } };

export default function ProfilePage() {
  return <Suspense><ProfileCenter /></Suspense>;
}
