import type { Metadata } from 'next';
import EmployerCompanyPage from '@/components/EmployerCompanyPage';

export const metadata: Metadata = { title: '账户与公司资料' };

export default function Page() {
	return <EmployerCompanyPage />;
}
