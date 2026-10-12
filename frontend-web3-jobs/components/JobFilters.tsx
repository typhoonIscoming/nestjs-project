'use client';

import { useJobMeta } from '@/hooks/queries';
import { experienceLabel, jobTypeLabel, workModeLabel } from '@/lib/utils';
import type { JobFilters as Filters } from '@/types';

const salaryOptions = [
  { value: '', label: '不限' },
  { value: '50000', label: '$50k+' },
  { value: '100000', label: '$100k+' },
  { value: '150000', label: '$150k+' },
  { value: '200000', label: '$200k+' },
];

type Key = 'category' | 'skill' | 'location' | 'salaryMin' | 'jobType' | 'workMode' | 'experience';

function Select({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value?: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string | undefined) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-200">{label}</label>
      <select id={id} className="input" value={value ?? ''} onChange={(e) => onChange(e.target.value || undefined)}>
        <option value="">全部</option>
        {options.filter((o) => o.value).map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

export default function JobFilters({
  filters,
  onChange,
  onReset,
  canReset,
}: {
  filters: Filters;
  onChange: (key: Key, value: string | undefined) => void;
  onReset: () => void;
  canReset: boolean;
}) {
  const { data: meta } = useJobMeta();
  const toOptions = (items: string[] = []) => items.map((item) => ({ value: item, label: item }));

  return (
    <div className="card space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-white">筛选</h2>
        <button type="button" className="text-sm text-emerald-300 hover:underline disabled:cursor-not-allowed disabled:text-slate-600 disabled:no-underline" disabled={!canReset} onClick={onReset}>
          清空筛选
        </button>
      </div>
      <Select id="f-category" label="行业" value={filters.category} options={toOptions(meta?.categories)} onChange={(v) => onChange('category', v)} />
      <Select id="f-skill" label="技能" value={filters.skill} options={toOptions(meta?.skills)} onChange={(v) => onChange('skill', v)} />
      <Select id="f-location" label="工作地点" value={filters.location} options={toOptions(meta?.locations)} onChange={(v) => onChange('location', v)} />
      <Select id="f-salary" label="薪资（年薪上限不低于）" value={filters.salaryMin} options={salaryOptions} onChange={(v) => onChange('salaryMin', v)} />
      <Select id="f-type" label="岗位类型" value={filters.jobType} options={(meta?.jobTypes ?? []).map((v) => ({ value: v, label: jobTypeLabel[v] }))} onChange={(v) => onChange('jobType', v)} />
      <Select id="f-mode" label="远程 / 驻场" value={filters.workMode} options={(meta?.workModes ?? []).map((v) => ({ value: v, label: workModeLabel[v] }))} onChange={(v) => onChange('workMode', v)} />
      <Select id="f-exp" label="经验要求" value={filters.experience} options={(meta?.experiences ?? []).map((v) => ({ value: v, label: experienceLabel[v] }))} onChange={(v) => onChange('experience', v)} />
    </div>
  );
}
