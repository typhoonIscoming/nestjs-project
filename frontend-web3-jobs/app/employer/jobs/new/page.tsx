'use client';

import JobForm, { emptyJobForm } from '@/components/JobForm';

export default function NewJobPage() {
  return (
    <section aria-labelledby="new-job">
      <h2 id="new-job" className="section-title mb-4">发布岗位</h2>
      <p className="mb-4 text-sm text-slate-400">提交后将进入平台审核，审核通过后展示在岗位列表中。</p>
      <JobForm initial={emptyJobForm} />
    </section>
  );
}
