import type { Metadata } from 'next';
import Link from 'next/link';
import ShareButtons from '@/components/ShareButtons';

export const metadata: Metadata = {
	title: 'Web3 社区',
	description: '加入 Web3 Career 社区，获取岗位提醒、职业建议与行业动态。',
	alternates: { canonical: '/community' },
};

const channels = [
	{
		name: 'Telegram 岗位频道',
		desc: '每日精选新岗位推送',
		href: 'https://t.me/',
		tone: 'text-sky-300',
	},
	{
		name: 'Discord 社区',
		desc: '与开发者、安全研究员、产品经理交流',
		href: 'https://discord.com/',
		tone: 'text-violet-300',
	},
	{
		name: 'X / Twitter',
		desc: '行业动态与薪资报告',
		href: 'https://x.com/',
		tone: 'text-emerald-300',
	},
];

const guides = [
	{ title: '如何准备智能合约工程师面试', tag: '面试指南' },
	{ title: 'Web3 远程工作薪资与税务入门', tag: '薪资' },
	{ title: '从 Web2 转型 Web3 的 5 条路径', tag: '职业发展' },
];

export default function CommunityPage() {
	return (
		<div className="container-page py-8">
			<header className="mb-8">
				<h1 className="text-3xl font-extrabold text-white">Web3 社区</h1>
				<p className="mt-1 text-slate-400">和全球的 Web3 从业者一起成长。</p>
			</header>

			<section aria-labelledby="channels" className="mb-10">
				<h2 id="channels" className="section-title mb-4">
					加入频道
				</h2>
				<div className="grid gap-4 md:grid-cols-3">
					{channels.map((c) => (
						<a
							key={c.name}
							href={c.href}
							target="_blank"
							rel="noopener noreferrer"
							className="card block p-5 transition hover:border-slate-600"
						>
							<h3 className={`font-bold ${c.tone}`}>{c.name} ↗</h3>
							<p className="mt-2 text-sm text-slate-400">{c.desc}</p>
						</a>
					))}
				</div>
			</section>

			<section aria-labelledby="guides" className="mb-10">
				<h2 id="guides" className="section-title mb-4">
					精选指南
				</h2>
				<ul className="space-y-3">
					{guides.map((g) => (
						<li
							key={g.title}
							className="card flex items-center justify-between gap-3 p-4"
						>
							<span className="font-medium text-white">{g.title}</span>
							<span className="chip">{g.tag}</span>
						</li>
					))}
				</ul>
			</section>

			<section className="card flex flex-col items-center gap-3 p-8 text-center">
				<h2 className="section-title">邀请朋友一起来</h2>
				<ShareButtons path="/community" title="加入 Web3 Career 社区" />
				<Link href="/jobs" className="text-sm text-emerald-300 hover:underline">
					先去看看最新岗位 →
				</Link>
			</section>
		</div>
	);
}
