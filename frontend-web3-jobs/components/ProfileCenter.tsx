'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import AuthGuard from '@/components/AuthGuard';
import JobCard from '@/components/JobCard';
import { EmptyState, ErrorState, LoadingState, Spinner } from '@/components/States';
import { Badge, FormField, Tabs } from '@/components/ui';
import { api, getErrorMessage } from '@/lib/api';
import { useApplications, useAuth, useFavorites, useNotifications } from '@/hooks/queries';
import { useAuthStore } from '@/store/auth';
import { toast } from '@/store/toast';
import { applicationStatusLabel, formatDate, formatSalary, splitList, timeAgo } from '@/lib/utils';
import type { ApplicationStatus, User } from '@/types';

type TabKey = 'profile' | 'applications' | 'favorites' | 'notifications';

const statusTone: Record<ApplicationStatus, 'blue' | 'purple' | 'green' | 'red' | 'amber'> = {
  applied: 'blue',
  viewed: 'amber',
  interviewing: 'purple',
  accepted: 'green',
  rejected: 'red',
};

function ProfileForm({ user }: { user: User }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: user.name, headline: user.headline, location: user.location, skills: user.skills.join(', ') });
  const [touchedName, setTouchedName] = useState(false);

  const save = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => (await api.put<User>('/users/profile', payload)).data,
    onSuccess: (updated) => {
      useAuthStore.getState().setUser(updated);
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const nameError = touchedName && !form.name.trim() ? '姓名不能为空' : undefined;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form
        className="card space-y-4 p-6"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          setTouchedName(true);
          if (!form.name.trim()) return;
          save.mutate({ name: form.name, headline: form.headline, location: form.location, skills: splitList(form.skills) }, { onSuccess: () => toast.success('资料已保存') });
        }}
      >
        <h2 className="text-lg font-bold text-white">基本资料</h2>
        <div className="flex items-center gap-4">
          <img src={user.avatar} alt="" className="h-16 w-16 rounded-full" />
          <div className="text-sm text-slate-400">{user.email}</div>
        </div>
        <FormField label="姓名" required error={nameError}>
          {(props) => <input {...props} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} onBlur={() => setTouchedName(true)} />}
        </FormField>
        <FormField label="职业头衔">
          {(props) => <input {...props} value={form.headline} maxLength={120} onChange={(e) => setForm({ ...form, headline: e.target.value })} placeholder="例如：Full-stack Web3 Engineer" />}
        </FormField>
        <FormField label="所在地">
          {(props) => <input {...props} value={form.location} maxLength={80} onChange={(e) => setForm({ ...form, location: e.target.value })} />}
        </FormField>
        <FormField label="技能" hint="使用逗号分隔，例如：Solidity, React, Rust">
          {(props) => <input {...props} value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} />}
        </FormField>
        <button type="submit" className="btn-primary" disabled={save.isPending}>
          {save.isPending && <Spinner className="h-4 w-4" />}保存资料
        </button>
      </form>

      <section className="card h-fit space-y-4 p-6" aria-labelledby="resume-title">
        <h2 id="resume-title" className="text-lg font-bold text-white">我的简历</h2>
        {user.resumeName ? (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-700 bg-ink-950/60 p-4">
            <span className="truncate text-sm text-slate-200">📄 {user.resumeName}</span>
            <button type="button" className="btn-danger px-3 py-1.5" disabled={save.isPending} onClick={() => save.mutate({ resumeName: '' }, { onSuccess: () => toast.success('简历已删除') })}>删除</button>
          </div>
        ) : (
          <p className="text-sm text-slate-400">还没有上传简历，投递岗位前需要先上传。</p>
        )}
        <FormField label={user.resumeName ? '替换简历' : '上传简历'} hint="支持 PDF / DOC / DOCX">
          {(props) => (
            <input
              {...props}
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) save.mutate({ resumeName: file.name }, { onSuccess: () => toast.success('简历已更新') });
                e.target.value = '';
              }}
            />
          )}
        </FormField>
      </section>
    </div>
  );
}

function ApplicationsTab() {
  const { data, isLoading, isError, refetch } = useApplications();
  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;
  if (!data?.list.length) return <EmptyState title="还没有投递记录" description="去看看最新的 Web3 岗位吧。" action={<Link href="/jobs" className="btn-primary">浏览岗位</Link>} />;
  return (
    <ul className="space-y-3">
      {data.list.map((a) => (
        <li key={a.id} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <img src={a.job.company?.logoUrl} alt="" className="h-12 w-12 rounded-xl bg-ink-700" />
          <div className="min-w-0 flex-1">
            <Link href={`/jobs/${a.jobId}`} className="font-bold text-white hover:text-emerald-300">{a.job.title}</Link>
            <p className="text-sm text-slate-400">{a.job.company?.name} · {formatSalary(a.job.salaryMin, a.job.salaryMax)}</p>
            <p className="mt-1 text-xs text-slate-500">投递于 {formatDate(a.appliedAt)} · 简历：{a.resumeName}</p>
          </div>
          <Badge tone={statusTone[a.status]}>{applicationStatusLabel[a.status]}</Badge>
        </li>
      ))}
    </ul>
  );
}

function FavoritesTab() {
  const { data, isLoading, isError, refetch } = useFavorites();
  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;
  if (!data?.list.length) return <EmptyState title="还没有收藏岗位" description="点击岗位卡片上的 ♡ 即可收藏。" action={<Link href="/jobs" className="btn-primary">去逛逛</Link>} />;
  return <div className="space-y-3">{data.list.map((job) => <JobCard key={job.id} job={job} />)}</div>;
}

function NotificationsTab() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useNotifications();
  const read = useMutation({
    mutationFn: async () => api.post('/users/notifications/read'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    onError: (err) => toast.error(getErrorMessage(err)),
  });
  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;
  if (!data?.list.length) return <EmptyState title="暂无通知" />;
  return (
    <div>
      <div className="mb-3 flex justify-end">
        <button type="button" className="btn-secondary" disabled={!data.unread || read.isPending} onClick={() => read.mutate()}>全部标为已读</button>
      </div>
      <ul className="space-y-3">
        {data.list.map((n) => (
          <li key={n.id} className="card flex gap-3 p-4">
            <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? 'bg-slate-600' : 'bg-emerald-400'}`} aria-label={n.read ? '已读' : '未读'} />
            <div>
              <p className="font-semibold text-white">{n.title}</p>
              <p className="text-sm text-slate-300">{n.body}</p>
              <p className="mt-1 text-xs text-slate-500">{timeAgo(n.createdAt)}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProfileInner() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { user } = useAuth();
  const { data: notifications } = useNotifications();
  const tab = (['profile', 'applications', 'favorites', 'notifications'].includes(params.get('tab') ?? '') ? params.get('tab') : 'profile') as TabKey;

  if (!user) return null;
  return (
    <div className="container-page py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-extrabold text-white">个人中心</h1>
        <p className="mt-1 text-slate-400">你好，{user.name}</p>
      </header>
      <Tabs<TabKey>
        label="个人中心"
        value={tab}
        onChange={(key) => router.replace(`${pathname}?tab=${key}`, { scroll: false })}
        tabs={[
          { key: 'profile', label: '基本资料 / 简历' },
          { key: 'applications', label: '已投递岗位' },
          { key: 'favorites', label: '收藏岗位' },
          { key: 'notifications', label: '消息通知', badge: notifications?.unread },
        ]}
      />
      <div className="mt-6" role="tabpanel">
        {tab === 'profile' && <ProfileForm user={user} />}
        {tab === 'applications' && <ApplicationsTab />}
        {tab === 'favorites' && <FavoritesTab />}
        {tab === 'notifications' && <NotificationsTab />}
      </div>
    </div>
  );
}

export default function ProfileCenter() {
  return (
    <AuthGuard role="candidate">
      <ProfileInner />
    </AuthGuard>
  );
}
