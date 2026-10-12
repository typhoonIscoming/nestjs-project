'use client';

import { Suspense, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { EmptyState, ErrorState, SkeletonCards } from '@/components/States';
import { api, getErrorMessage } from '@/lib/api';
import { useEmployerApplications, useEmployerJobs } from '@/hooks/queries';
import { useDebounce } from '@/hooks/useDebounce';
import { toast } from '@/store/toast';
import { applicationStatusLabel, formatDate } from '@/lib/utils';
import type { ApplicationStatus } from '@/types';

function Inner() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const queryClient = useQueryClient();
  const jobId = params.get('jobId') ?? '';
  const status = params.get('status') ?? '';
  const urlKeyword = params.get('keyword') ?? '';

  const [keyword, setKeyword] = useState(urlKeyword);
  const debounced = useDebounce(keyword, 400);

  const setParam = (patch: Record<string, string>) => {
    const next = new URLSearchParams(params.toString());
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  useEffect(() => {
    if (debounced.trim() !== urlKeyword) setParam({ keyword: debounced.trim() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const { data: jobs } = useEmployerJobs();
  const { data, isLoading, isError, refetch } = useEmployerApplications({
    jobId: jobId || undefined,
    status: status || undefined,
    keyword: urlKeyword || undefined,
  });

  const update = useMutation({
    mutationFn: async ({ id, next }: { id: number; next: ApplicationStatus }) => (await api.post(`/employer/applications/${id}/status`, { status: next })).data,
    onSuccess: () => {
      toast.success('候选人状态已更新');
      queryClient.invalidateQueries({ queryKey: ['employer', 'applications'] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const hasFilter = Boolean(jobId || status || urlKeyword);

  return (
    <section aria-labelledby="apps-title">
      <h2 id="apps-title" className="section-title mb-4">应用列表 / 候选人筛选</h2>
      <div className="card mb-4 grid gap-3 p-4 md:grid-cols-4">
        <div>
          <label htmlFor="a-job" className="mb-1.5 block text-sm font-medium">岗位</label>
          <select id="a-job" className="input" value={jobId} onChange={(e) => setParam({ jobId: e.target.value })}>
            <option value="">全部岗位</option>
            {jobs?.list.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="a-status" className="mb-1.5 block text-sm font-medium">状态</label>
          <select id="a-status" className="input" value={status} onChange={(e) => setParam({ status: e.target.value })}>
            <option value="">全部状态</option>
            {Object.entries(applicationStatusLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="a-keyword" className="mb-1.5 block text-sm font-medium">候选人 / 技能</label>
          <input id="a-keyword" type="search" className="input" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="姓名或技能" />
        </div>
        <div className="flex items-end">
          <button type="button" className="btn-secondary w-full" disabled={!hasFilter && !keyword} onClick={() => { setKeyword(''); router.replace(pathname, { scroll: false }); }}>清空筛选</button>
        </div>
      </div>

      {isLoading ? <SkeletonCards count={3} /> : isError ? <ErrorState onRetry={() => refetch()} /> : !data?.list.length ? (
        <EmptyState title="暂无符合条件的申请" description={hasFilter ? '尝试调整筛选条件。' : '岗位上线后，候选人的投递会出现在这里。'} />
      ) : (
        <ul className="space-y-3">
          {data.list.map((a) => (
            <li key={a.id} className="card flex flex-col gap-4 p-4 md:flex-row md:items-center">
              <img src={a.candidate.avatar} alt="" className="h-12 w-12 rounded-full" />
              <div className="min-w-0 flex-1">
                <p className="font-bold text-white">{a.candidate.name} <span className="text-sm font-normal text-slate-400">· {a.candidate.headline || '未填写头衔'}</span></p>
                <p className="text-sm text-slate-400">投递：{a.jobTitle} · {formatDate(a.appliedAt)} · {a.candidate.email}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">{a.candidate.skills.map((s) => <span key={s} className="chip">{s}</span>)}</div>
                <p className="mt-2 text-xs text-slate-500">📄 {a.resumeName}{a.note && ` · 附言：${a.note}`}</p>
              </div>
              <div>
                <label htmlFor={`st-${a.id}`} className="sr-only">更新 {a.candidate.name} 的状态</label>
                <select id={`st-${a.id}`} className="input" value={a.status} disabled={update.isPending} onChange={(e) => update.mutate({ id: a.id, next: e.target.value as ApplicationStatus })}>
                  {Object.entries(applicationStatusLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function EmployerApplicationsPage() {
  return <Suspense><Inner /></Suspense>;
}
