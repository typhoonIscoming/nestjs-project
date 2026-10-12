import type { Metadata } from 'next';
import Link from 'next/link';
import CompanyCard from '@/components/CompanyCard';
import { EmptyState } from '@/components/States';
import { serverGet } from '@/lib/server-api';
import type { Company, Listed } from '@/types';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
	title: 'Web3 公司',
	description: '浏览已认证的 Web3 / 区块链公司，了解团队文化与在招岗位。',
	alternates: { canonical: '/companies' },
};

export default async function CompaniesPage() {
	const data = await serverGet<Listed<Company>>('/companies');
	return (
		<div className="container-page py-8">
			<header className="mb-6">
				<h1 className="text-3xl font-extrabold text-white">Web3 公司</h1>
				<p className="mt-1 text-slate-400">了解团队文化、公司认证状态与在招岗位。</p>
			</header>
			{data && data.list.length ? (
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{data.list.map((c) => (
						<CompanyCard key={c.id} company={c} />
					))}
				</div>
			) : (
				<EmptyState
					title="暂无公司"
					action={
						<Link href="/register?role=employer" className="btn-primary">
							成为第一个入驻企业
						</Link>
					}
				/>
			)}
		</div>
	);
}
