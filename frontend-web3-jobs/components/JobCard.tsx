import Link from 'next/link';
import FavoriteButton from '@/components/FavoriteButton';
import { VerifiedBadge } from '@/components/ui';
import { formatSalary, jobTypeLabel, timeAgo, workModeLabel } from '@/lib/utils';
import type { Job } from '@/types';

export default function JobCard({ job }: { job: Job }) {
	return (
		<article className="card group relative p-5 transition hover:border-emerald-400/40 hover:shadow-glow">
			<div className="flex gap-4">
				<img
					src={job.company?.logoUrl}
					alt=""
					width={48}
					height={48}
					className="h-12 w-12 shrink-0 rounded-xl bg-ink-700"
				/>
				<div className="min-w-0 flex-1">
					<div className="flex items-start justify-between gap-3">
						<div className="min-w-0">
							<h3 className="truncate text-base font-bold text-white sm:text-lg">
								<Link
									href={`/jobs/${job.id}`}
									className="after:absolute after:inset-0 after:content-[''] focus-visible:after:rounded-2xl"
								>
									{job.title}
								</Link>
							</h3>
							<p className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-slate-400">
								<span>{job.company?.name}</span>
								{job.company && <VerifiedBadge verified={job.company.verified} />}
							</p>
						</div>
						<FavoriteButton jobId={job.id} />
					</div>

					<p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-300">
						<span>📍 {job.location}</span>
						<span className="font-semibold text-emerald-300">
							{formatSalary(job.salaryMin, job.salaryMax)}
						</span>
						<span>{jobTypeLabel[job.jobType]}</span>
						<span>{workModeLabel[job.workMode]}</span>
					</p>

					<div className="mt-3 flex flex-wrap items-center gap-2">
						<span className="chip border-violet-400/30 text-violet-300">
							{job.category}
						</span>
						{job.skills.slice(0, 4).map((skill) => (
							<span key={skill} className="chip">
								{skill}
							</span>
						))}
						<span className="ml-auto text-xs text-slate-500">
							{timeAgo(job.publishedAt)}
						</span>
					</div>
				</div>
			</div>
		</article>
	);
}
