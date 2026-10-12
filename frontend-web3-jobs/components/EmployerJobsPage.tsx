'use client';

import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { EmptyState, ErrorState, SkeletonCards } from '@/components/States';
import { Badge } from '@/components/ui';
import { api, getErrorMessage } from '@/lib/api';
import { useEmployerJobs } from '@/hooks/queries';
import { toast } from '@/store/toast';
import { formatDate, formatSalary, jobStatusLabel } from '@/lib/utils';
import type { JobStatus } from '@/types';

const tone: Record<JobStatus, 'green' | 'amber' | 'gray' | 'red'> = { published: 'green', pending: 'amber', offline: 'gray', rejected: 'red' };

export default function EmployerJobsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useEmployerJobs();

  const action = useMutation({
    mutationFn: async ({ id, type }: { id: number; type: 'offline' | 'republish' }) => (await api.post<{ message: string }>(`/employer/jobs/${id}/${type}`)).data,
    onSuccess: (res) => {
      toast.success(res.message);
      queryClient.invalidateQueries({ queryKey: ['employer', 'jobs'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  return (
    <section aria-labelledby="my-jobs">
      <div className="mb-4 flex items-center justify-between">
        <h2 id="my-jobs" className="section-title">我的岗位{data ? `（${data.total}）` : ''}</h2>
        <Link href="/employer/jobs/new" className="btn-primary">+ 发布岗位</Link>
      </div>

      {isLoading ? <SkeletonCards count={3} /> : isError ? <ErrorState onRetry={() => refetch()} /> : !data?.list.length ? (
        <EmptyState title="还没有发布岗位" description="发布后将进入平台审核，通过后展示在岗位列表。" action={<Link href="/employer/jobs/new" className="btn-primary">发布第一个岗位</Link>} />
      ) : (
        <ul className="space-y-3">
          {data.list.map((job) => (
            <li key={job.id} className="card flex flex-col gap-3 p-4 md:flex-row md:items-center">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-white">{job.title}</h3>
                  <Badge tone={tone[job.status]}>{jobStatusLabel[job.status]}</Badge>
                </div>
                <p className="mt-1 text-sm text-slate-400">{job.location} · {formatSalary(job.salaryMin, job.salaryMax)} · 发布于 {formatDate(job.publishedAt)} · 有效期至 {formatDate(job.expiresAt)}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/employer/applications?jobId=${job.id}`} className="btn-secondary">申请 {job.applicantCount}</Link>
                <Link href={`/employer/jobs/${job.id}/edit`} className="btn-secondary">编辑</Link>
                {job.status === 'published' && (
                  <button type="button" className="btn-danger" disabled={action.isPending} onClick={() => window.confirm(`确认下线「${job.title}」吗？`) && action.mutate({ id: job.id, type: 'offline' })}>下线</button>
                )}
                {(job.status === 'offline') && (
                  <button type="button" className="btn-secondary" disabled={action.isPending} onClick={() => action.mutate({ id: job.id, type: 'republish' })}>重新提交</button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
