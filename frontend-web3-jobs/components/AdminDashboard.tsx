'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import AuthGuard from '@/components/AuthGuard';
import { EmptyState, ErrorState, LoadingState, SkeletonCards } from '@/components/States';
import { Badge, Tabs } from '@/components/ui';
import { api, getErrorMessage } from '@/lib/api';
import {
	useAdminPendingJobs,
	useAdminReports,
	useAdminStats,
	useAdminUsers,
} from '@/hooks/queries';
import { toast } from '@/store/toast';
import { formatDate, formatSalary, timeAgo } from '@/lib/utils';

type TabKey = 'overview' | 'jobs' | 'users' | 'reports';

function Overview() {
	const { data, isLoading, isError, refetch } = useAdminStats();
	if (isLoading) return <LoadingState />;
	if (isError || !data) return <ErrorState onRetry={() => refetch()} />;
	const cards = [
		{
			label: '用户总数',
			value: data.users,
			hint: `求职者 ${data.candidates} · 招聘方 ${data.employers}`,
		},
		{ label: '公司数', value: data.companies, hint: `待认证用户 ${data.usersPending}` },
		{ label: '在线岗位', value: data.jobsLive, hint: `总岗位 ${data.jobsTotal}` },
		{ label: '待审核岗位', value: data.jobsPending, hint: '需要处理' },
		{ label: '投递总数', value: data.applications, hint: '累计' },
		{ label: '待处理举报', value: data.reportsOpen, hint: '需要处理' },
	];
	return (
		<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{cards.map((c) => (
				<div key={c.label} className="card p-5">
					<p className="text-sm text-slate-400">{c.label}</p>
					<p className="mt-1 text-3xl font-extrabold text-white">{c.value}</p>
					<p className="mt-1 text-xs text-slate-500">{c.hint}</p>
				</div>
			))}
		</div>
	);
}

function JobReview() {
	const queryClient = useQueryClient();
	const { data, isLoading, isError, refetch } = useAdminPendingJobs();
	const review = useMutation({
		mutationFn: async ({ id, decision }: { id: number; decision: 'approved' | 'rejected' }) =>
			(await api.post<{ message: string }>(`/admin/jobs/${id}/review`, { decision })).data,
		onSuccess: (res) => {
			toast.success(`岗位${res.message}`);
			queryClient.invalidateQueries({ queryKey: ['admin'] });
			queryClient.invalidateQueries({ queryKey: ['jobs'] });
		},
		onError: (err) => toast.error(getErrorMessage(err)),
	});
	if (isLoading) return <SkeletonCards count={2} />;
	if (isError) return <ErrorState onRetry={() => refetch()} />;
	if (!data?.list.length)
		return <EmptyState title="没有待审核的岗位" description="新提交的岗位会出现在这里。" />;
	return (
		<ul className="space-y-3">
			{data.list.map((job) => (
				<li key={job.id} className="card p-4">
					<div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
						<div className="min-w-0">
							<h3 className="font-bold text-white">{job.title}</h3>
							<p className="text-sm text-slate-400">
								{job.company?.name} · {job.location} ·{' '}
								{formatSalary(job.salaryMin, job.salaryMax)} · 提交于{' '}
								{formatDate(job.publishedAt)}
							</p>
							<p className="mt-2 line-clamp-2 text-sm text-slate-300">
								{job.description}
							</p>
							<div className="mt-2 flex flex-wrap gap-1.5">
								{job.skills.map((s) => (
									<span key={s} className="chip">
										{s}
									</span>
								))}
							</div>
						</div>
						<div className="flex shrink-0 gap-2">
							<button
								type="button"
								className="btn-primary"
								disabled={review.isPending}
								onClick={() => review.mutate({ id: job.id, decision: 'approved' })}
							>
								通过
							</button>
							<button
								type="button"
								className="btn-danger"
								disabled={review.isPending}
								onClick={() => review.mutate({ id: job.id, decision: 'rejected' })}
							>
								驳回
							</button>
						</div>
					</div>
				</li>
			))}
		</ul>
	);
}

function Users() {
	const queryClient = useQueryClient();
	const { data, isLoading, isError, refetch } = useAdminUsers();
	const act = useMutation({
		mutationFn: async ({
			id,
			decision,
		}: {
			id: number;
			decision: 'approve' | 'ban' | 'unban';
		}) => (await api.post(`/admin/users/${id}/review`, { decision })).data,
		onSuccess: () => {
			toast.success('操作成功');
			queryClient.invalidateQueries({ queryKey: ['admin'] });
		},
		onError: (err) => toast.error(getErrorMessage(err)),
	});
	if (isLoading) return <LoadingState />;
	if (isError) return <ErrorState onRetry={() => refetch()} />;
	const roleLabel = { candidate: '求职者', employer: '招聘方', admin: '管理员' } as const;
	const statusBadge = {
		active: <Badge tone="green">正常</Badge>,
		pending: <Badge tone="amber">待认证</Badge>,
		banned: <Badge tone="red">已封禁</Badge>,
	};
	return (
		<div className="card overflow-x-auto">
			<table className="w-full min-w-[640px] text-left text-sm">
				<caption className="sr-only">用户列表</caption>
				<thead className="border-b border-slate-800 text-slate-400">
					<tr>
						<th scope="col" className="p-3">
							用户
						</th>
						<th scope="col" className="p-3">
							角色
						</th>
						<th scope="col" className="p-3">
							公司
						</th>
						<th scope="col" className="p-3">
							状态
						</th>
						<th scope="col" className="p-3">
							操作
						</th>
					</tr>
				</thead>
				<tbody>
					{data?.list.map((u) => (
						<tr key={u.id} className="border-b border-slate-800/60 last:border-0">
							<td className="p-3">
								<p className="font-medium text-white">{u.name}</p>
								<p className="text-xs text-slate-400">{u.email}</p>
							</td>
							<td className="p-3">{roleLabel[u.role]}</td>
							<td className="p-3">{u.companyName ?? '—'}</td>
							<td className="p-3">{statusBadge[u.status]}</td>
							<td className="p-3">
								{u.role !== 'admin' && (
									<div className="flex gap-2">
										{u.status === 'pending' && (
											<button
												type="button"
												className="btn-primary px-3 py-1.5"
												disabled={act.isPending}
												onClick={() =>
													act.mutate({ id: u.id, decision: 'approve' })
												}
											>
												通过认证
											</button>
										)}
										{u.status === 'banned' ? (
											<button
												type="button"
												className="btn-secondary px-3 py-1.5"
												disabled={act.isPending}
												onClick={() =>
													act.mutate({ id: u.id, decision: 'unban' })
												}
											>
												解封
											</button>
										) : (
											<button
												type="button"
												className="btn-danger px-3 py-1.5"
												disabled={act.isPending}
												onClick={() =>
													window.confirm(`确认封禁 ${u.name} 吗？`) &&
													act.mutate({ id: u.id, decision: 'ban' })
												}
											>
												封禁
											</button>
										)}
									</div>
								)}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

function Reports() {
	const queryClient = useQueryClient();
	const { data, isLoading, isError, refetch } = useAdminReports();
	const resolve = useMutation({
		mutationFn: async ({ id, takeDown }: { id: number; takeDown: boolean }) =>
			(await api.post(`/admin/reports/${id}/resolve`, { takeDown })).data,
		onSuccess: () => {
			toast.success('举报已处理');
			queryClient.invalidateQueries({ queryKey: ['admin'] });
			queryClient.invalidateQueries({ queryKey: ['jobs'] });
		},
		onError: (err) => toast.error(getErrorMessage(err)),
	});
	if (isLoading) return <SkeletonCards count={2} />;
	if (isError) return <ErrorState onRetry={() => refetch()} />;
	if (!data?.list.length) return <EmptyState title="暂无举报" />;
	return (
		<ul className="space-y-3">
			{data.list.map((r) => (
				<li
					key={r.id}
					className="card flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between"
				>
					<div>
						<p className="flex items-center gap-2 font-bold text-white">
							<Link href={`/jobs/${r.jobId}`} className="hover:text-emerald-300">
								{r.jobTitle}
							</Link>
							<Badge tone={r.status === 'open' ? 'amber' : 'gray'}>
								{r.status === 'open' ? '待处理' : '已处理'}
							</Badge>
						</p>
						<p className="mt-1 text-sm text-slate-300">原因：{r.reason}</p>
						<p className="text-xs text-slate-500">
							举报人 {r.reporter} · {timeAgo(r.createdAt)}
						</p>
					</div>
					{r.status === 'open' && (
						<div className="flex gap-2">
							<button
								type="button"
								className="btn-danger"
								disabled={resolve.isPending}
								onClick={() => resolve.mutate({ id: r.id, takeDown: true })}
							>
								下线岗位并结案
							</button>
							<button
								type="button"
								className="btn-secondary"
								disabled={resolve.isPending}
								onClick={() => resolve.mutate({ id: r.id, takeDown: false })}
							>
								忽略
							</button>
						</div>
					)}
				</li>
			))}
		</ul>
	);
}

function Inner() {
	const [tab, setTab] = useState<TabKey>('overview');
	const { data: stats } = useAdminStats();
	return (
		<div className="container-page py-8">
			<header className="mb-6">
				<h1 className="text-3xl font-extrabold text-white">管理后台</h1>
				<p className="mt-1 text-slate-400">岗位审核、用户审核、举报处理与数据概览。</p>
			</header>
			<Tabs<TabKey>
				label="管理后台"
				value={tab}
				onChange={setTab}
				tabs={[
					{ key: 'overview', label: '数据概览' },
					{ key: 'jobs', label: '岗位审核', badge: stats?.jobsPending },
					{ key: 'users', label: '用户审核', badge: stats?.usersPending },
					{ key: 'reports', label: '举报处理', badge: stats?.reportsOpen },
				]}
			/>
			<div className="mt-6" role="tabpanel">
				{tab === 'overview' && <Overview />}
				{tab === 'jobs' && <JobReview />}
				{tab === 'users' && <Users />}
				{tab === 'reports' && <Reports />}
			</div>
		</div>
	);
}

export default function AdminDashboard() {
	return (
		<AuthGuard role="admin">
			<Inner />
		</AuthGuard>
	);
}
