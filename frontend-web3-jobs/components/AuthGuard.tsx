'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LoadingState } from '@/components/States';
import { useAuth } from '@/hooks/queries';
import type { Role } from '@/types';

export default function AuthGuard({ role, children }: { role: Role; children: React.ReactNode }) {
	const router = useRouter();
	const pathname = usePathname();
	const { hydrated, isLoggedIn, role: current } = useAuth();

	useEffect(() => {
		if (hydrated && !isLoggedIn) {
			const search = typeof window === 'undefined' ? '' : window.location.search;
			router.replace(`/login?redirect=${encodeURIComponent(pathname + search)}`);
		}
	}, [hydrated, isLoggedIn, pathname, router]);

	if (!hydrated || !isLoggedIn)
		return <LoadingState label={hydrated ? '正在跳转到登录页…' : '加载中…'} />;

	if (current !== role) {
		return (
			<div className="container-page py-16 text-center" role="alert">
				<h1 className="text-2xl font-bold text-white">无权访问</h1>
				<p className="mt-2 text-slate-400">当前账号角色无法访问此页面。</p>
				<Link href="/" className="btn-primary mt-6">
					返回首页
				</Link>
			</div>
		);
	}

	return <>{children}</>;
}
