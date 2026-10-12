import Link from 'next/link';
import ShareButtons from '@/components/ShareButtons';

export default function Footer() {
	return (
		<footer className="mt-16 border-t border-slate-800 bg-ink-950/80">
			<div className="container-page grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
				<div>
					<p className="text-lg font-extrabold text-white">Web3 Career</p>
					<p className="mt-2 text-sm text-slate-400">
						连接全球 Web3 人才与团队，让每一次投递都更高效、更可信。
					</p>
				</div>
				<nav aria-label="求职者">
					<p className="mb-3 text-sm font-semibold text-white">求职者</p>
					<ul className="space-y-2 text-sm text-slate-400">
						<li>
							<Link className="hover:text-white" href="/jobs">
								浏览岗位
							</Link>
						</li>
						<li>
							<Link className="hover:text-white" href="/companies">
								公司列表
							</Link>
						</li>
						<li>
							<Link className="hover:text-white" href="/profile">
								个人中心
							</Link>
						</li>
					</ul>
				</nav>
				<nav aria-label="招聘方">
					<p className="mb-3 text-sm font-semibold text-white">招聘方</p>
					<ul className="space-y-2 text-sm text-slate-400">
						<li>
							<Link className="hover:text-white" href="/employer/jobs/new">
								发布岗位
							</Link>
						</li>
						<li>
							<Link className="hover:text-white" href="/employer/jobs">
								招聘后台
							</Link>
						</li>
						<li>
							<Link className="hover:text-white" href="/register?role=employer">
								企业注册
							</Link>
						</li>
					</ul>
				</nav>
				<div>
					<p className="mb-3 text-sm font-semibold text-white">分享平台</p>
					<ShareButtons />
				</div>
			</div>
			<div className="border-t border-slate-800 py-4 text-center text-xs text-slate-500">
				© {new Date().getFullYear()} Web3 Career · 演示项目，数据均为模拟
			</div>
		</footer>
	);
}
