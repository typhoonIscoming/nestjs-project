'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ErrorState, LoadingState, Spinner } from '@/components/States';
import { FormField, VerifiedBadge } from '@/components/ui';
import { api, getErrorMessage } from '@/lib/api';
import { useAuth, useEmployerCompany, useJobMeta } from '@/hooks/queries';
import { toast } from '@/store/toast';
import { splitList } from '@/lib/utils';
import type { Company } from '@/types';

function CompanyForm({ company }: { company: Company }) {
  const queryClient = useQueryClient();
  const { data: meta } = useJobMeta();
  const [form, setForm] = useState({
    name: company.name,
    description: company.description,
    industry: company.industry,
    website: company.website,
    location: company.location,
    size: company.size,
    culture: company.culture,
    values: company.values.join(', '),
  });
  const [touched, setTouched] = useState(false);
  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const websiteError = form.website && !/^https?:\/\/.+\..+/.test(form.website) ? '请输入以 http(s):// 开头的有效网址' : '';
  const nameError = form.name.trim() ? '' : '公司名称不能为空';

  const save = useMutation({
    mutationFn: async () => (await api.put<Company>('/employer/company', { ...form, values: splitList(form.values) })).data,
    onSuccess: () => {
      toast.success('公司资料已保存');
      queryClient.invalidateQueries({ queryKey: ['employer', 'company'] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  return (
    <form
      className="card space-y-5 p-6"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        setTouched(true);
        if (nameError || websiteError) return;
        save.mutate();
      }}
    >
      <div className="flex items-center gap-4">
        <img src={company.logoUrl} alt="" className="h-16 w-16 rounded-2xl bg-ink-700" />
        <div><p className="font-bold text-white">{company.name}</p><VerifiedBadge verified={company.verified} /></div>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <FormField label="公司名称" required error={touched ? nameError : undefined}>{(p) => <input {...p} value={form.name} onChange={set('name')} />}</FormField>
        <FormField label="所属行业">
          {(p) => <select {...p} value={form.industry} onChange={set('industry')}>{(meta?.categories ?? [form.industry]).map((c) => <option key={c}>{c}</option>)}</select>}
        </FormField>
        <FormField label="官网" error={websiteError || undefined}>{(p) => <input {...p} type="url" value={form.website} onChange={set('website')} placeholder="https://" />}</FormField>
        <FormField label="公司所在地">{(p) => <input {...p} value={form.location} onChange={set('location')} />}</FormField>
        <FormField label="公司规模">
          {(p) => <select {...p} value={form.size} onChange={set('size')}>{['1-10', '10-50', '50-200', '200-500', '500+'].map((s) => <option key={s}>{s}</option>)}</select>}
        </FormField>
        <FormField label="价值观" hint="使用逗号分隔">{(p) => <input {...p} value={form.values} onChange={set('values')} />}</FormField>
      </div>
      <FormField label="公司简介">{(p) => <textarea {...p} rows={3} value={form.description} onChange={set('description')} />}</FormField>
      <FormField label="团队文化">{(p) => <textarea {...p} rows={3} value={form.culture} onChange={set('culture')} />}</FormField>
      <div className="flex justify-end">
        <button type="submit" className="btn-primary" disabled={save.isPending}>{save.isPending && <Spinner className="h-4 w-4" />}保存公司资料</button>
      </div>
    </form>
  );
}

export default function EmployerCompanyPage() {
  const { user } = useAuth();
  const { data, isLoading, isError, refetch } = useEmployerCompany();

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <section aria-labelledby="company-form">
        <h2 id="company-form" className="section-title mb-4">公司资料</h2>
        {isLoading ? <LoadingState /> : isError || !data ? <ErrorState onRetry={() => refetch()} /> : <CompanyForm company={data} />}
      </section>
      <aside className="card h-fit p-5" aria-labelledby="account">
        <h2 id="account" className="mb-3 text-lg font-bold text-white">账户信息</h2>
        {user && (
          <dl className="space-y-3 text-sm">
            <div><dt className="text-slate-400">姓名</dt><dd className="text-slate-100">{user.name}</dd></div>
            <div><dt className="text-slate-400">邮箱</dt><dd className="break-all text-slate-100">{user.email}</dd></div>
            <div><dt className="text-slate-400">职位</dt><dd className="text-slate-100">{user.headline || '—'}</dd></div>
            <div><dt className="text-slate-400">账号状态</dt><dd className="text-slate-100">{user.status === 'active' ? '已认证' : user.status === 'pending' ? '待认证' : '已封禁'}</dd></div>
          </dl>
        )}
      </aside>
    </div>
  );
}
