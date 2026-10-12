import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import JobCard from '@/components/JobCard';
import { EmptyState } from '@/components/States';
import { VerifiedBadge } from '@/components/ui';
import { serverGet } from '@/lib/server-api';
import type { Company, Job, Listed } from '@/types';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  let company: Company | null = null;
  try {
    company = await serverGet<Company>(`/companies/${id}`);
  } catch {
    /* generic metadata */
  }
  if (!company) return { title: '公司不存在', robots: { index: false } };
  return {
    title: `${company.name} · 公司主页`,
    description: (company.description || `${company.name} 的团队文化与在招岗位`).slice(0, 160),
    alternates: { canonical: `/companies/${company.id}` },
  };
}

export default async function CompanyPage({ params }: Props) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const company = await serverGet<Company>(`/companies/${id}`);
  if (!company) notFound();
  const jobs = await serverGet<Listed<Job>>(`/companies/${id}/jobs`);

  return (
    <div className="container-page py-8">
      <nav aria-label="面包屑" className="mb-4 text-sm text-slate-400">
        <Link href="/companies" className="hover:text-white">公司</Link> <span aria-hidden="true">/</span> <span className="text-slate-300">{company.name}</span>
      </nav>

      <header className="card flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
        <img src={company.logoUrl} alt="" width={80} height={80} className="h-20 w-20 rounded-2xl bg-ink-700" />
        <div className="flex-1">
          <h1 className="flex flex-wrap items-center gap-3 text-3xl font-extrabold text-white">{company.name} <VerifiedBadge verified={company.verified} /></h1>
          <p className="mt-2 text-sm text-slate-400">
            {company.industry}{company.location && ` · ${company.location}`}{company.size && ` · ${company.size} 人`}
          </p>
        </div>
        {company.website && <a href={company.website} target="_blank" rel="noopener noreferrer" className="btn-secondary">访问官网 ↗</a>}
      </header>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <section className="card p-6" aria-labelledby="about">
            <h2 id="about" className="mb-3 text-lg font-bold text-white">公司概述</h2>
            <p className="leading-7 text-slate-300">{company.description || '该公司暂未填写简介。'}</p>
          </section>
          <section aria-labelledby="open-jobs">
            <h2 id="open-jobs" className="section-title mb-4">在招岗位（{jobs?.total ?? 0}）</h2>
            {jobs && jobs.list.length ? (
              <div className="space-y-3">{jobs.list.map((job) => <JobCard key={job.id} job={job} />)}</div>
            ) : (
              <EmptyState title="暂无在招岗位" description="关注该公司，稍后再来看看。" />
            )}
          </section>
        </div>

        <aside className="space-y-4" aria-label="公司文化">
          <section className="card p-5" aria-labelledby="culture">
            <h2 id="culture" className="mb-3 text-lg font-bold text-white">团队文化</h2>
            <p className="text-sm leading-7 text-slate-300">{company.culture || '该公司暂未填写团队文化。'}</p>
          </section>
          <section className="card p-5" aria-labelledby="values">
            <h2 id="values" className="mb-3 text-lg font-bold text-white">价值观</h2>
            {company.values.length ? (
              <ul className="flex flex-wrap gap-2">{company.values.map((v) => <li key={v} className="chip border-emerald-400/30 text-emerald-300">{v}</li>)}</ul>
            ) : (
              <p className="text-sm text-slate-400">暂无</p>
            )}
          </section>
          <section className="card p-5" aria-labelledby="verify">
            <h2 id="verify" className="mb-2 text-lg font-bold text-white">认证状态</h2>
            <VerifiedBadge verified={company.verified} />
            <p className="mt-2 text-xs text-slate-400">{company.verified ? '该公司已通过平台资质审核。' : '该公司尚未通过平台认证，请自行甄别岗位信息。'}</p>
          </section>
        </aside>
      </div>
    </div>
  );
}
