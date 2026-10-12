import type { Metadata } from 'next';
import AdminDashboard from '@/components/AdminDashboard';

export const metadata: Metadata = { title: '管理后台', robots: { index: false } };

export default function AdminPage() {
  return <AdminDashboard />;
}
