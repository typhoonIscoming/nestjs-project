import type { Metadata } from 'next';
import EmployerShell from '@/components/EmployerShell';

export const metadata: Metadata = {
	title: { default: '招聘后台', template: '%s | 招聘后台' },
	robots: { index: false },
};

export default function EmployerLayout({ children }: { children: React.ReactNode }) {
	return <EmployerShell>{children}</EmployerShell>;
}
