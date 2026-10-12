import type { MetadataRoute } from 'next';
import { serverGetSafe, SITE_URL } from '@/lib/server-api';
import type { Company, Job, Listed, Paged } from '@/types';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const [jobs, companies] = await Promise.all([
		serverGetSafe<Paged<Job>>('/jobs?pageSize=50'),
		serverGetSafe<Listed<Company>>('/companies'),
	]);
	return [
		{ url: SITE_URL, changeFrequency: 'daily', priority: 1 },
		{ url: `${SITE_URL}/jobs`, changeFrequency: 'hourly', priority: 0.9 },
		{ url: `${SITE_URL}/companies`, changeFrequency: 'weekly', priority: 0.6 },
		{ url: `${SITE_URL}/community`, changeFrequency: 'weekly', priority: 0.4 },
		...(jobs?.list ?? []).map((j) => ({
			url: `${SITE_URL}/jobs/${j.id}`,
			lastModified: j.publishedAt,
			priority: 0.8,
		})),
		...(companies?.list ?? []).map((c) => ({
			url: `${SITE_URL}/companies/${c.id}`,
			priority: 0.5,
		})),
	];
}
