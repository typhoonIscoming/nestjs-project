import type { Metadata } from 'next';
import EmployerJobsPage from '@/components/EmployerJobsPage';

export const metadata: Metadata = { title: '岗位管理' };

export default function Page() {
	return <EmployerJobsPage />;
}
