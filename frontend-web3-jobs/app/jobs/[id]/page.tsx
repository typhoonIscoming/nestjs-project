import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import JobDetail from '@/components/JobDetail';
import { serverGet, SITE_URL } from '@/lib/server-api';
import { formatSalary, jobTypeLabel } from '@/lib/utils';
import type { Company, Job, Listed } from '@/types';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { id } = await params;
	let job: Job | null = null;
	try {
		job = await serverGet<Job>(`/jobs/${id}`);
	} catch {
		/* fall through to generic metadata */
	}
	if (!job) return { title: '岗位不存在', robots: { index: false } };

	const title = `${job.title} · ${job.company?.name ?? ''}`;
	const description =
		`${job.company?.name} 正在招聘 ${job.title}（${job.location}，${formatSalary(job.salaryMin, job.salaryMax)}）。${job.description}`.slice(
			0,
			160
		);
	return {
		title,
		description,
		alternates: { canonical: `/jobs/${job.id}` },
		openGraph: { type: 'article', title, description, url: `/jobs/${job.id}` },
		twitter: { card: 'summary', title, description },
	};
}

export default async function JobDetailPage({ params }: Props) {
	const { id } = await params;
	if (!/^\d+$/.test(id)) notFound();

	const job = await serverGet<Job>(`/jobs/${id}`);
	if (!job) notFound();

	const [related, company] = await Promise.all([
		serverGet<Listed<Job>>(`/jobs/${id}/related`).catch(() => null),
		serverGet<Company>(`/companies/${job.companyId}`).catch(() => null),
	]);

	const jsonLd = {
		'@context': 'https://schema.org',
		'@type': 'JobPosting',
		title: job.title,
		description: job.description,
		datePosted: job.publishedAt,
		validThrough: job.expiresAt,
		employmentType: jobTypeLabel[job.jobType],
		hiringOrganization: {
			'@type': 'Organization',
			name: job.company?.name,
			sameAs: company?.website || undefined,
			logo: job.company?.logoUrl,
		},
		jobLocationType: job.workMode === 'remote' ? 'TELECOMMUTE' : undefined,
		jobLocation: { '@type': 'Place', address: job.location },
		baseSalary: {
			'@type': 'MonetaryAmount',
			currency: 'USD',
			value: {
				'@type': 'QuantitativeValue',
				minValue: job.salaryMin,
				maxValue: job.salaryMax,
				unitText: 'YEAR',
			},
		},
		url: `${SITE_URL}/jobs/${job.id}`,
	};

	return (
		<>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
			/>
			<JobDetail job={job} company={company} related={related?.list ?? []} />
		</>
	);
}
