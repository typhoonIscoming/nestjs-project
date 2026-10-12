import type { Metadata } from 'next';
import EmployerApplicationsPage from '@/components/EmployerApplicationsPage';

export const metadata: Metadata = { title: '应用列表' };

export default function Page() {
  return <EmployerApplicationsPage />;
}
