import Link from 'next/link';

export default function NotFound() {
	return (
		<div className="container-page py-20 text-center">
			<p className="text-6xl font-extrabold text-emerald-300">404</p>
			<h1 className="mt-4 text-2xl font-extrabold text-white">页面不存在</h1>
			<p className="mt-2 text-slate-400">你访问的岗位、公司或页面可能已下线或地址有误。</p>
			<div className="mt-6 flex justify-center gap-3">
				<Link href="/jobs" className="btn-primary">
					浏览岗位
				</Link>
				<Link href="/" className="btn-secondary">
					返回首页
				</Link>
			</div>
		</div>
	);
}
