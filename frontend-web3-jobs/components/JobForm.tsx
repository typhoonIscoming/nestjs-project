'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FormField } from '@/components/ui';
import { Spinner } from '@/components/States';
import { api, getErrorMessage } from '@/lib/api';
import { useJobMeta } from '@/hooks/queries';
import { toast } from '@/store/toast';
import { experienceLabel, jobTypeLabel, workModeLabel } from '@/lib/utils';
import type { Job, JobFormValues } from '@/types';

export const emptyJobForm: JobFormValues = {
  title: '',
  category: 'DeFi',
  location: '',
  salaryMin: '',
  salaryMax: '',
  jobType: 'full-time',
  workMode: 'remote',
  experience: 'mid',
  description: '',
  skills: [],
  responsibilities: [],
  requirements: [],
  benefits: [],
};

const lines = (value: string) => value.split('\n').map((s) => s.trim()).filter(Boolean);
const csv = (value: string) => value.split(/[,，]/).map((s) => s.trim()).filter(Boolean);

export default function JobForm({ jobId, initial }: { jobId?: number; initial: JobFormValues }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: meta } = useJobMeta();
  const [values, setValues] = useState(initial);
  const [skillsText, setSkillsText] = useState(initial.skills.join(', '));
  const [respText, setRespText] = useState(initial.responsibilities.join('\n'));
  const [reqText, setReqText] = useState(initial.requirements.join('\n'));
  const [benefitText, setBenefitText] = useState(initial.benefits.join('\n'));
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [serverError, setServerError] = useState('');

  const min = Number(values.salaryMin);
  const max = Number(values.salaryMax);
  const errors = {
    title: values.title.trim() ? '' : '请填写岗位名称',
    location: values.location.trim() ? '' : '请填写工作地点',
    salaryMin: !values.salaryMin || min <= 0 ? '请填写有效的最低年薪' : '',
    salaryMax: !values.salaryMax ? '请填写最高年薪' : max < min ? '最高年薪不能低于最低年薪' : '',
    description: values.description.trim().length >= 20 ? '' : '岗位简介至少 20 个字符',
    skills: csv(skillsText).length ? '' : '请至少填写 1 项技能',
    responsibilities: lines(respText).length ? '' : '请至少填写 1 条岗位职责',
    requirements: lines(reqText).length ? '' : '请至少填写 1 条任职要求',
  };
  const show = (key: keyof typeof errors) => (touched[key] ? errors[key] : undefined);
  const blur = (key: string) => () => setTouched((t) => ({ ...t, [key]: true }));
  const set = <K extends keyof JobFormValues>(key: K, value: JobFormValues[K]) => setValues((v) => ({ ...v, [key]: value }));

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...values,
        title: values.title.trim(),
        location: values.location.trim(),
        description: values.description.trim(),
        salaryMin: Number(values.salaryMin),
        salaryMax: Number(values.salaryMax),
        skills: csv(skillsText),
        responsibilities: lines(respText),
        requirements: lines(reqText),
        benefits: lines(benefitText),
      };
      return (jobId ? await api.put<{ message: string; job: Job }>(`/employer/jobs/${jobId}`, payload) : await api.post<{ message: string; job: Job }>('/employer/jobs', payload)).data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['employer', 'jobs'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      router.push('/employer/jobs');
    },
    onError: (err) => setServerError(getErrorMessage(err)),
  });

  return (
    <form
      className="card space-y-5 p-6"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        setTouched(Object.fromEntries(Object.keys(errors).map((k) => [k, true])));
        setServerError('');
        if (Object.values(errors).some(Boolean)) {
          toast.error('请先修正表单中的错误');
          return;
        }
        mutation.mutate();
      }}
    >
      {serverError && <p className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-300" role="alert">{serverError}</p>}

      <div className="grid gap-5 md:grid-cols-2">
        <FormField label="岗位名称" required error={show('title')}>
          {(props) => <input {...props} value={values.title} onChange={(e) => set('title', e.target.value)} onBlur={blur('title')} placeholder="例如：Senior Solidity Engineer" />}
        </FormField>
        <FormField label="行业分类" required>
          {(props) => (
            <select {...props} value={values.category} onChange={(e) => set('category', e.target.value)}>
              {(meta?.categories ?? [values.category]).map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
        </FormField>
        <FormField label="工作地点" required error={show('location')}>
          {(props) => <input {...props} value={values.location} onChange={(e) => set('location', e.target.value)} onBlur={blur('location')} placeholder="例如：Remote · Global / Singapore" />}
        </FormField>
        <FormField label="技能标签" required error={show('skills')} hint="使用逗号分隔，例如：Solidity, Foundry">
          {(props) => <input {...props} value={skillsText} onChange={(e) => setSkillsText(e.target.value)} onBlur={blur('skills')} />}
        </FormField>
        <FormField label="最低年薪（USD）" required error={show('salaryMin')}>
          {(props) => <input {...props} type="number" min={0} value={values.salaryMin} onChange={(e) => set('salaryMin', e.target.value === '' ? '' : Number(e.target.value))} onBlur={blur('salaryMin')} />}
        </FormField>
        <FormField label="最高年薪（USD）" required error={show('salaryMax')}>
          {(props) => <input {...props} type="number" min={0} value={values.salaryMax} onChange={(e) => set('salaryMax', e.target.value === '' ? '' : Number(e.target.value))} onBlur={blur('salaryMax')} />}
        </FormField>
        <FormField label="岗位类型">
          {(props) => <select {...props} value={values.jobType} onChange={(e) => set('jobType', e.target.value as JobFormValues['jobType'])}>{Object.entries(jobTypeLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>}
        </FormField>
        <FormField label="工作方式">
          {(props) => <select {...props} value={values.workMode} onChange={(e) => set('workMode', e.target.value as JobFormValues['workMode'])}>{Object.entries(workModeLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>}
        </FormField>
        <FormField label="经验要求">
          {(props) => <select {...props} value={values.experience} onChange={(e) => set('experience', e.target.value as JobFormValues['experience'])}>{Object.entries(experienceLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>}
        </FormField>
      </div>

      <FormField label="岗位简介" required error={show('description')} hint={`${values.description.trim().length} / 至少 20 字`}>
        {(props) => <textarea {...props} rows={4} value={values.description} onChange={(e) => set('description', e.target.value)} onBlur={blur('description')} />}
      </FormField>
      <FormField label="岗位职责" required error={show('responsibilities')} hint="每行一条">
        {(props) => <textarea {...props} rows={4} value={respText} onChange={(e) => setRespText(e.target.value)} onBlur={blur('responsibilities')} />}
      </FormField>
      <FormField label="任职要求" required error={show('requirements')} hint="每行一条">
        {(props) => <textarea {...props} rows={4} value={reqText} onChange={(e) => setReqText(e.target.value)} onBlur={blur('requirements')} />}
      </FormField>
      <FormField label="福利待遇" hint="每行一条（选填）">
        {(props) => <textarea {...props} rows={3} value={benefitText} onChange={(e) => setBenefitText(e.target.value)} />}
      </FormField>

      <div className="flex justify-end gap-2">
        <button type="button" className="btn-ghost" onClick={() => router.push('/employer/jobs')}>取消</button>
        <button type="submit" className="btn-primary" disabled={mutation.isPending}>
          {mutation.isPending && <Spinner className="h-4 w-4" />}
          {jobId ? '保存修改' : '提交审核'}
        </button>
      </div>
    </form>
  );
}
