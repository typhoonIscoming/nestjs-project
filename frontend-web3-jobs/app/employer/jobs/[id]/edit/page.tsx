'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import JobForm from '@/components/JobForm';
import { ErrorState, LoadingState } from '@/components/States';
import { api } from '@/lib/api';
import type { Job } from '@/types';

export default function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = use(params);
	const { data, isLoading, isError, refetch } = useQuery({
		queryKey: ['employer', 'job', id],
		queryFn: async () => (await api.get<Job>(`/employer/jobs/${id}`)).data,
		gcTime: 0,
	});

	if (isLoading) return <LoadingState />;
	if (isError || !data)
		return <ErrorState message="岗位加载失败或无权编辑" onRetry={() => refetch()} />;

	return (
		<section aria-labelledby="edit-job">
			<h2 id="edit-job" className="section-title mb-4">
				编辑岗位
			</h2>
			<JobForm
				jobId={data.id}
				initial={{
					title: data.title,
					category: data.category,
					location: data.location,
					salaryMin: data.salaryMin,
					salaryMax: data.salaryMax,
					jobType: data.jobType,
					workMode: data.workMode,
					experience: data.experience,
					description: data.description,
					skills: data.skills,
					responsibilities: data.responsibilities,
					requirements: data.requirements,
					benefits: data.benefits,
				}}
			/>
		</section>
	);
}
