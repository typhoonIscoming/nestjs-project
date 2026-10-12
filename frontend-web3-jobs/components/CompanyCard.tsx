import Link from 'next/link';
import { VerifiedBadge } from '@/components/ui';
import type { Company } from '@/types';

export default function CompanyCard({ company }: { company: Company }) {
  return (
    <article className="card relative p-5 transition hover:border-sky-400/40">
      <div className="flex items-center gap-3">
        <img src={company.logoUrl} alt="" width={48} height={48} className="h-12 w-12 rounded-xl bg-ink-700" />
        <div className="min-w-0">
          <h3 className="truncate font-bold text-white">
            <Link href={`/companies/${company.id}`} className="after:absolute after:inset-0 after:content-['']">
              {company.name}
            </Link>
          </h3>
          <p className="text-xs text-slate-400">{company.industry} · {company.location}</p>
        </div>
      </div>
      <p className="mt-3 line-clamp-2 min-h-10 text-sm text-slate-400">{company.description || '该公司暂未填写简介'}</p>
      <div className="mt-3 flex items-center justify-between">
        <VerifiedBadge verified={company.verified} />
        <span className="text-sm text-emerald-300">{company.openJobs} 个在招岗位</span>
      </div>
    </article>
  );
}
