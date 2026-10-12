'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/queries';
import { toast } from '@/store/toast';
import type { Role } from '@/types';

/** Returns a guard that redirects anonymous users to /login (preserving the return path). */
export function useRequireLogin() {
	const router = useRouter();
	const { isLoggedIn, role } = useAuth();

	return useCallback(
		(allowed: Role = 'candidate', message = '请先登录'): boolean => {
			if (!isLoggedIn) {
				toast.info(message);
				const current = window.location.pathname + window.location.search;
				router.push(`/login?redirect=${encodeURIComponent(current)}`);
				return false;
			}
			if (role !== allowed) {
				toast.error('当前账号角色无法执行此操作');
				return false;
			}
			return true;
		},
		[isLoggedIn, role, router]
	);
}
