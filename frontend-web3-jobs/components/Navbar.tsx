'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth, useNotifications } from '@/hooks/queries';
import { useAuthStore } from '@/store/auth';
import { toast } from '@/store/toast';
import { cx } from '@/lib/utils';

const links = [
	{ href: '/jobs', label: '岗位' },
	{ href: '/companies', label: '公司' },
	{ href: '/community', label: '社区' },
];

export default function Navbar() {
	const pathname = usePathname();
	const router = useRouter();
	const queryClient = useQueryClient();
	const { user, isLoggedIn, hydrated } = useAuth();
	const { data: notifications } = useNotifications();
	const [open, setOpen] = useState(false);

	const logout = () => {
		useAuthStore.getState().logout();
		queryClient.clear();
		setOpen(false);
		toast.success('已退出登录');
		router.push('/');
	};

	const home =
		user?.role === 'candidate'
			? { href: '/profile', label: '个人中心' }
			: user?.role === 'employer'
				? { href: '/employer/jobs', label: '招聘后台' }
				: user?.role === 'admin'
					? { href: '/admin', label: '管理后台' }
					: null;

	const postJobHref =
		user?.role === 'employer'
			? '/employer/jobs/new'
			: isLoggedIn
				? '/employer/jobs/new'
				: '/register?role=employer';
	const unread = notifications?.unread ?? 0;
	const linkClass = (href: string) =>
		cx(
			'rounded-lg px-3 py-2 text-sm font-medium transition',
			pathname.startsWith(href)
				? 'bg-ink-800 text-white'
				: 'text-slate-300 hover:bg-ink-800 hover:text-white'
		);

	return (
		<header className="sticky top-0 z-50 border-b border-slate-800 bg-ink-950/85 backdrop-blur">
			<div className="container-page flex h-16 items-center justify-between gap-4">
				<Link
					href="/"
					className="flex items-center gap-2 text-lg font-extrabold text-white"
					aria-label="Web3 Career 首页"
				>
					<span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-emerald-400 via-sky-400 to-violet-500 text-sm text-slate-950">
						W3
					</span>
					Web3 Career
				</Link>

				<nav aria-label="主导航" className="hidden items-center gap-1 md:flex">
					{links.map((l) => (
						<Link
							key={l.href}
							href={l.href}
							className={linkClass(l.href)}
							aria-current={pathname.startsWith(l.href) ? 'page' : undefined}
						>
							{l.label}
						</Link>
					))}
				</nav>

				<div className="hidden items-center gap-2 md:flex">
					{user?.role !== 'candidate' && user?.role !== 'admin' && (
						<Link href={postJobHref} className="btn-secondary">
							发布岗位
						</Link>
					)}
					{hydrated && isLoggedIn && user ? (
						<>
							{home && (
								<Link href={home.href} className="btn-ghost relative">
									<img
										src={user.avatar}
										alt=""
										className="h-6 w-6 rounded-full"
									/>
									{home.label}
									{unread > 0 && (
										<span
											className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-emerald-400 px-1 text-xs font-bold text-slate-950"
											aria-label={`${unread} 条未读通知`}
										>
											{unread}
										</span>
									)}
								</Link>
							)}
							<button type="button" className="btn-ghost" onClick={logout}>
								退出
							</button>
						</>
					) : (
						<>
							<Link href="/login" className="btn-ghost">
								登录
							</Link>
							<Link href="/register" className="btn-primary">
								注册
							</Link>
						</>
					)}
				</div>

				<button
					type="button"
					className="btn-ghost px-2 md:hidden"
					aria-label={open ? '关闭菜单' : '打开菜单'}
					aria-expanded={open}
					aria-controls="mobile-menu"
					onClick={() => setOpen((v) => !v)}
				>
					<span aria-hidden="true" className="text-xl">
						{open ? '✕' : '☰'}
					</span>
				</button>
			</div>

			{open && (
				<div id="mobile-menu" className="border-t border-slate-800 bg-ink-950 md:hidden">
					<nav
						aria-label="移动端导航"
						className="container-page flex flex-col gap-1 py-3"
					>
						{links.map((l) => (
							<Link
								key={l.href}
								href={l.href}
								className={linkClass(l.href)}
								onClick={() => setOpen(false)}
							>
								{l.label}
							</Link>
						))}
						{user?.role !== 'candidate' && user?.role !== 'admin' && (
							<Link
								href={postJobHref}
								className={linkClass('/employer')}
								onClick={() => setOpen(false)}
							>
								发布岗位
							</Link>
						)}
						{hydrated && isLoggedIn && user ? (
							<>
								{home && (
									<Link
										href={home.href}
										className={linkClass(home.href)}
										onClick={() => setOpen(false)}
									>
										{home.label}
										{unread > 0 ? `（${unread}）` : ''}
									</Link>
								)}
								<button
									type="button"
									className="rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-300 hover:bg-ink-800"
									onClick={logout}
								>
									退出登录
								</button>
							</>
						) : (
							<>
								<Link
									href="/login"
									className={linkClass('/login')}
									onClick={() => setOpen(false)}
								>
									登录
								</Link>
								<Link
									href="/register"
									className="btn-primary mt-1"
									onClick={() => setOpen(false)}
								>
									注册
								</Link>
							</>
						)}
					</nav>
				</div>
			)}
		</header>
	);
}
