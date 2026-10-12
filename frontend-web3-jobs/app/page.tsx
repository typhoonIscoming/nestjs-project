import Link from 'next/link';
import type { Metadata } from 'next';
import HeroSearch from '@/components/HeroSearch';
import JobCard from '@/components/JobCard';
import CompanyCard from '@/components/CompanyCard';
import ShareButtons from '@/components/ShareButtons';
import { serverGetSafe, SITE_URL } from '@/lib/server-api';
import type { Company, Job, JobMeta, Listed, Paged } from '@/types';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
	title: { absolute: 'Web3 Career · 区块链、智能合约、DeFi 岗位招聘平台' },
	description:
		'汇聚全球 Layer 1 / Layer 2、DeFi、NFT、DAO、智能合约与安全研究岗位，支持远程办公，快速筛选、一键投递。',
	alternates: { canonical: '/' },
};

const tagStyles = [
	'border-emerald-400/40 text-emerald-300 hover:bg-emerald-400/10',
	'border-sky-400/40 text-sky-300 hover:bg-sky-400/10',
	'border-violet-400/40 text-violet-300 hover:bg-violet-400/10',
];

export default async function HomePage() {
	const [jobsResult, companiesResult, meta] = await Promise.all([
		serverGetSafe<Paged<Job>>('/jobs?pageSize=50'),
		serverGetSafe<Listed<Company>>('/companies'),
		serverGetSafe<JobMeta>('/jobs/meta'),
	]);

	const hotJobs = [...(jobsResult?.list ?? [])]
		.sort((a, b) => b.applicantCount - a.applicantCount)
		.slice(0, 6);
	const companies = (companiesResult?.list ?? []).filter((c) => c.verified).slice(0, 6);
	const categories = meta?.categories ?? [
		'Layer 1',
		'Layer 2',
		'DeFi',
		'NFT',
		'DAO',
		'智能合约',
		'安全',
		'研究',
	];

	const jsonLd = {
		'@context': 'https://schema.org',
		'@type': 'WebSite',
		name: 'Web3 Career',
		url: SITE_URL,
		potentialAction: {
			'@type': 'SearchAction',
			target: `${SITE_URL}/jobs?keyword={search_term_string}`,
			'query-input': 'required name=search_term_string',
		},
	};

	return (
		<>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
			/>

			<section
				className="container-page pb-10 pt-14 text-center sm:pt-20"
				aria-labelledby="hero-title"
			>
				<p className="mx-auto mb-4 w-fit rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
					{jobsResult
						? `${jobsResult.total} 个在招岗位 · 全球远程友好`
						: '全球 Web3 人才与团队的连接器'}
				</p>
				<h1
					id="hero-title"
					className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl"
				>
					找到下一份
					<span className="bg-gradient-to-r from-emerald-300 via-sky-300 to-violet-400 bg-clip-text text-transparent">
						{' '}
						Web3{' '}
					</span>
					工作
				</h1>
				<p className="mx-auto mt-5 max-w-2xl text-base text-slate-400 sm:text-lg">
					覆盖区块链基础设施、DeFi、NFT、DAO、智能合约与安全研究，高信任公司、清晰薪资、一键投递。
				</p>
				<div className="mt-8">
					<HeroSearch />
				</div>
				<div className="mt-6 flex flex-wrap justify-center gap-3">
					<Link href="/jobs" className="btn-primary">
						浏览岗位
					</Link>
					<Link href="/employer/jobs/new" className="btn-secondary">
						发布岗位
					</Link>
				</div>
			</section>

			<section className="container-page py-6" aria-labelledby="tags-title">
				<h2 id="tags-title" className="sr-only">
					行业标签
				</h2>
				<ul className="flex flex-wrap justify-center gap-2">
					{categories.map((category, i) => (
						<li key={category}>
							<Link
								href={`/jobs?category=${encodeURIComponent(category)}`}
								className={`inline-block rounded-full border px-4 py-1.5 text-sm font-medium transition ${tagStyles[i % tagStyles.length]}`}
							>
								{category}
							</Link>
						</li>
					))}
				</ul>
			</section>

			<section className="container-page py-10" aria-labelledby="hot-title">
				<div className="mb-5 flex items-end justify-between">
					<h2 id="hot-title" className="section-title">
						🔥 热门岗位
					</h2>
					<Link href="/jobs" className="text-sm text-emerald-300 hover:underline">
						查看全部 →
					</Link>
				</div>
				{hotJobs.length ? (
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						{hotJobs.map((job) => (
							<JobCard key={job.id} job={job} />
						))}
					</div>
				) : (
					<div className="card px-6 py-12 text-center text-slate-400" role="alert">
						热门岗位暂时无法加载，请确认后端服务已启动，然后
						<Link href="/" className="text-emerald-300 underline">
							刷新页面
						</Link>
						。
					</div>
				)}
			</section>

			<section className="container-page py-10" aria-labelledby="company-title">
				<div className="mb-5 flex items-end justify-between">
					<h2 id="company-title" className="section-title">
						认证企业
					</h2>
					<Link href="/companies" className="text-sm text-emerald-300 hover:underline">
						全部公司 →
					</Link>
				</div>
				{companies.length ? (
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{companies.map((c) => (
							<CompanyCard key={c.id} company={c} />
						))}
					</div>
				) : (
					<p className="text-slate-400">暂无企业数据</p>
				)}
			</section>

			<section className="container-page py-10">
				<div className="card flex flex-col items-center gap-4 bg-gradient-to-br from-ink-800 to-ink-900 p-8 text-center">
					<h2 className="section-title">把好机会分享给朋友</h2>
					<p className="text-sm text-slate-400">
						一次转发，可能改变一位 Web3 开发者的职业轨迹。
					</p>
					<ShareButtons path="/" />
				</div>
			</section>
		</>
	);
}
