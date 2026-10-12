'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import FavoriteButton from '@/components/FavoriteButton';
import JobCard from '@/components/JobCard';
import ShareButtons from '@/components/ShareButtons';
import { BulletList, CollapsibleSection, FormField, Modal, VerifiedBadge } from '@/components/ui';
import { Spinner } from '@/components/States';
import { api, getErrorMessage } from '@/lib/api';
import { useApplications, useAuth } from '@/hooks/queries';
import { useRequireLogin } from '@/hooks/useRequireLogin';
import { toast } from '@/store/toast';
import {
	daysLeft,
	experienceLabel,
	formatDate,
	formatSalary,
	jobTypeLabel,
	timeAgo,
	workModeLabel,
} from '@/lib/utils';
import type { Company, Job } from '@/types';

const sections = [
	{ id: 'overview', label: '岗位简介' },
	{ id: 'responsibilities', label: '岗位职责' },
	{ id: 'requirements', label: '任职要求' },
	{ id: 'benefits', label: '福利待遇' },
];

function ApplyModal({ job, open, onClose }: { job: Job; open: boolean; onClose: () => void }) {
	const router = useRouter();
	const queryClient = useQueryClient();
	const { user } = useAuth();
	const [resumeName, setResumeName] = useState(user?.resumeName ?? '');
	const [note, setNote] = useState('');
	const [error, setError] = useState('');

	const mutation = useMutation({
		mutationFn: async () =>
			(
				await api.post(`/jobs/${job.id}/apply`, {
					resumeName,
					note: note.trim() || undefined,
				})
			).data,
		onSuccess: () => {
			toast.success('投递成功！正在跳转到个人中心…');
			queryClient.invalidateQueries({ queryKey: ['applications'] });
			queryClient.invalidateQueries({ queryKey: ['notifications'] });
			onClose();
			router.push('/profile?tab=applications');
		},
		onError: (err) => setError(getErrorMessage(err, '投递失败，请重试')),
	});

	return (
		<Modal open={open} title={`投递：${job.title}`} onClose={onClose}>
			<form
				className="space-y-4"
				onSubmit={(e) => {
					e.preventDefault();
					if (!resumeName) return setError('请先选择要投递的简历');
					setError('');
					mutation.mutate();
				}}
			>
				<FormField
					label="简历"
					required
					hint="支持 PDF / DOC / DOCX"
					error={!resumeName && error ? error : undefined}
				>
					{(props) => (
						<>
							<input
								{...props}
								type="file"
								accept=".pdf,.doc,.docx"
								onChange={(e) => {
									const file = e.target.files?.[0];
									if (file) {
										setResumeName(file.name);
										setError('');
									}
								}}
							/>
							{resumeName && (
								<p className="mt-2 text-sm text-emerald-300">
									当前简历：{resumeName}
								</p>
							)}
						</>
					)}
				</FormField>
				<FormField label="附言（选填）">
					{(props) => (
						<textarea
							{...props}
							rows={4}
							maxLength={500}
							value={note}
							onChange={(e) => setNote(e.target.value)}
							placeholder="简单介绍你与该岗位的匹配点"
						/>
					)}
				</FormField>
				{error && resumeName && (
					<p className="text-sm text-rose-400" role="alert">
						{error}
					</p>
				)}
				<div className="flex justify-end gap-2">
					<button type="button" className="btn-ghost" onClick={onClose}>
						取消
					</button>
					<button type="submit" className="btn-primary" disabled={mutation.isPending}>
						{mutation.isPending && <Spinner className="h-4 w-4" />}
						{mutation.isPending ? '提交中…' : '确认投递'}
					</button>
				</div>
			</form>
		</Modal>
	);
}

function ReportModal({
	jobId,
	open,
	onClose,
}: {
	jobId: number;
	open: boolean;
	onClose: () => void;
}) {
	const [reason, setReason] = useState('');
	const mutation = useMutation({
		mutationFn: async () => (await api.post(`/jobs/${jobId}/report`, { reason })).data,
		onSuccess: () => {
			toast.success('举报已提交，感谢你的反馈');
			setReason('');
			onClose();
		},
		onError: (err) => toast.error(getErrorMessage(err)),
	});
	return (
		<Modal open={open} title="举报该岗位" onClose={onClose}>
			<form
				className="space-y-4"
				onSubmit={(e) => {
					e.preventDefault();
					if (reason.trim()) mutation.mutate();
				}}
			>
				<FormField
					label="举报原因"
					required
					error={reason.length > 0 && !reason.trim() ? '请填写举报原因' : undefined}
				>
					{(props) => (
						<textarea
							{...props}
							rows={4}
							maxLength={300}
							value={reason}
							onChange={(e) => setReason(e.target.value)}
							placeholder="例如：虚假薪资、疑似诈骗、重复发布…"
						/>
					)}
				</FormField>
				<div className="flex justify-end gap-2">
					<button type="button" className="btn-ghost" onClick={onClose}>
						取消
					</button>
					<button
						type="submit"
						className="btn-danger"
						disabled={mutation.isPending || !reason.trim()}
					>
						{mutation.isPending ? '提交中…' : '提交举报'}
					</button>
				</div>
			</form>
		</Modal>
	);
}

export default function JobDetail({
	job,
	company,
	related,
}: {
	job: Job;
	company: Company | null;
	related: Job[];
}) {
	const requireLogin = useRequireLogin();
	const { role } = useAuth();
	const { data: applications } = useApplications();
	const [applyOpen, setApplyOpen] = useState(false);
	const [reportOpen, setReportOpen] = useState(false);
	const closeApply = useCallback(() => setApplyOpen(false), []);
	const closeReport = useCallback(() => setReportOpen(false), []);

	const applied = applications?.list.some((a) => a.jobId === job.id) ?? false;
	const remaining = daysLeft(job.expiresAt);

	return (
		<div className="container-page py-8">
			<nav aria-label="面包屑" className="mb-4 text-sm text-slate-400">
				<Link href="/jobs" className="hover:text-white">
					岗位
				</Link>{' '}
				<span aria-hidden="true">/</span>{' '}
				<span className="text-slate-300">{job.title}</span>
			</nav>

			<header className="card flex flex-col gap-5 p-5 sm:p-6 md:flex-row md:items-start md:justify-between">
				<div className="flex gap-4">
					<img
						src={job.company?.logoUrl}
						alt=""
						width={64}
						height={64}
						className="h-16 w-16 rounded-2xl bg-ink-700"
					/>
					<div>
						<h1 className="text-2xl font-extrabold text-white sm:text-3xl">
							{job.title}
						</h1>
						<p className="mt-1 flex flex-wrap items-center gap-2 text-slate-300">
							<Link
								href={`/companies/${job.companyId}`}
								className="font-medium hover:text-emerald-300"
							>
								{job.company?.name}
							</Link>
							{job.company && <VerifiedBadge verified={job.company.verified} />}
						</p>
						<p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-300">
							<span>📍 {job.location}</span>
							<span className="font-semibold text-emerald-300">
								{formatSalary(job.salaryMin, job.salaryMax)}
							</span>
							<span>{jobTypeLabel[job.jobType]}</span>
							<span>{workModeLabel[job.workMode]}</span>
						</p>
						<div className="mt-3 flex flex-wrap gap-2">
							<span className="chip border-violet-400/30 text-violet-300">
								{job.category}
							</span>
							{job.skills.map((skill) => (
								<span key={skill} className="chip">
									{skill}
								</span>
							))}
						</div>
					</div>
				</div>
				<div className="flex flex-wrap items-center gap-2 md:justify-end">
					{applied ? (
						<Link href="/profile?tab=applications" className="btn-secondary">
							已投递 · 查看进度
						</Link>
					) : (
						<button
							type="button"
							className="btn-primary px-6"
							onClick={() =>
								requireLogin('candidate', '请先登录后再投递简历') &&
								setApplyOpen(true)
							}
						>
							立即投递
						</button>
					)}
					<FavoriteButton jobId={job.id} withLabel />
					<ShareButtons
						compact
						path={`/jobs/${job.id}`}
						title={`${job.title} · ${job.company?.name}`}
					/>
					<button
						type="button"
						className="btn-ghost text-slate-400"
						onClick={() =>
							requireLogin(role ?? 'candidate', '登录后才能举报') &&
							setReportOpen(true)
						}
					>
						举报
					</button>
				</div>
			</header>

			<div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
				<div className="space-y-4">
					<nav
						aria-label="章节导航"
						className="card flex gap-2 overflow-x-auto p-2 lg:hidden"
					>
						{sections.map((s) => (
							<a
								key={s.id}
								href={`#${s.id}`}
								className="shrink-0 rounded-lg px-3 py-1.5 text-sm text-slate-300 hover:bg-ink-800"
							>
								{s.label}
							</a>
						))}
					</nav>
					<CollapsibleSection id="overview" title="岗位简介">
						<p>{job.description}</p>
					</CollapsibleSection>
					<CollapsibleSection id="responsibilities" title="岗位职责">
						<BulletList items={job.responsibilities} />
					</CollapsibleSection>
					<CollapsibleSection id="requirements" title="任职要求">
						<BulletList items={job.requirements} />
					</CollapsibleSection>
					<CollapsibleSection id="benefits" title="福利待遇">
						<BulletList items={job.benefits} />
					</CollapsibleSection>
				</div>

				<aside
					className="space-y-4 lg:sticky lg:top-24 lg:self-start"
					aria-label="岗位信息"
				>
					<nav aria-label="章节导航" className="card hidden p-4 lg:block">
						<p className="mb-2 text-sm font-semibold text-white">章节导航</p>
						<ul className="space-y-1 text-sm">
							{sections.map((s) => (
								<li key={s.id}>
									<a
										href={`#${s.id}`}
										className="block rounded px-2 py-1 text-slate-300 hover:bg-ink-800 hover:text-white"
									>
										{s.label}
									</a>
								</li>
							))}
						</ul>
					</nav>
					<div className="card p-4">
						<p className="mb-3 text-sm font-semibold text-white">岗位信息</p>
						<dl className="space-y-2 text-sm">
							<div className="flex justify-between gap-2">
								<dt className="text-slate-400">发布时间</dt>
								<dd>{timeAgo(job.publishedAt)}</dd>
							</div>
							<div className="flex justify-between gap-2">
								<dt className="text-slate-400">有效期至</dt>
								<dd>
									{formatDate(job.expiresAt)}（剩 {remaining} 天）
								</dd>
							</div>
							<div className="flex justify-between gap-2">
								<dt className="text-slate-400">经验要求</dt>
								<dd>{experienceLabel[job.experience]}</dd>
							</div>
							<div className="flex justify-between gap-2">
								<dt className="text-slate-400">申请人数</dt>
								<dd>{job.applicantCount}</dd>
							</div>
						</dl>
					</div>
					{company && (
						<div className="card p-4">
							<p className="mb-3 text-sm font-semibold text-white">公司简介</p>
							<p className="text-sm leading-6 text-slate-300">
								{company.description || '该公司暂未填写简介'}
							</p>
							<Link
								href={`/companies/${company.id}`}
								className="btn-secondary mt-3 w-full"
							>
								查看公司主页
							</Link>
						</div>
					)}
				</aside>
			</div>

			{related.length > 0 && (
				<section className="mt-10" aria-labelledby="related-title">
					<h2 id="related-title" className="section-title mb-4">
						相关岗位推荐
					</h2>
					<div className="grid gap-4 md:grid-cols-2">
						{related.map((item) => (
							<JobCard key={item.id} job={item} />
						))}
					</div>
				</section>
			)}

			{applyOpen && <ApplyModal job={job} open onClose={closeApply} />}
			<ReportModal jobId={job.id} open={reportOpen} onClose={closeReport} />
		</div>
	);
}
