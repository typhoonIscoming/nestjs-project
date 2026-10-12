import {
	BadRequestException,
	ConflictException,
	ForbiddenException,
	Inject,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { CATEGORIES } from '../seed';
import { Application, Experience, Job, JobType, User, WorkMode } from '../types';
import { AppDataService } from '../common/app-data.service';
type Body = Record<string, any>;
const DAY = 24 * 60 * 60 * 1000;
const JOB_TYPES: JobType[] = ['full-time', 'part-time', 'contract', 'internship'];
const WORK_MODES: WorkMode[] = ['remote', 'onsite', 'hybrid'];
const EXPERIENCES: Experience[] = ['entry', 'mid', 'senior', 'lead'];

@Injectable()
export class JobsService {
	constructor(@Inject(AppDataService) private readonly data: AppDataService) {}

	listJobs(query: JobQuery) {
		const page = Math.max(1, parseInt(query.page ?? '1', 10) || 1);
		const pageSize = Math.min(50, Math.max(1, parseInt(query.pageSize ?? '10', 10) || 10));
		const keyword = query.keyword?.trim().toLowerCase();
		const salaryMin = Number(query.salaryMin) || 0;

		const scoreOf = (job: Job) => {
			if (!keyword) return 0;
			const companyName =
				this.data.companies.find((c) => c.id === job.companyId)?.name.toLowerCase() ?? '';
			let score = 0;
			if (job.title.toLowerCase().includes(keyword)) score += 5;
			if (job.skills.some((s) => s.toLowerCase().includes(keyword))) score += 3;
			if (companyName.includes(keyword)) score += 2;
			if (job.category.toLowerCase().includes(keyword)) score += 2;
			if (job.description.toLowerCase().includes(keyword)) score += 1;
			return score;
		};

		let list = this.data.jobs.filter((job) => this.data.isLive(job));
		if (keyword) list = list.filter((job) => scoreOf(job) > 0);
		if (query.category) list = list.filter((job) => job.category === query.category);
		if (query.skill)
			list = list.filter((job) =>
				job.skills.some((s) => s.toLowerCase() === query.skill!.toLowerCase())
			);
		if (query.location)
			list = list.filter((job) =>
				job.location.toLowerCase().includes(query.location!.toLowerCase())
			);
		if (salaryMin) list = list.filter((job) => job.salaryMax >= salaryMin);
		if (query.jobType) list = list.filter((job) => job.jobType === query.jobType);
		if (query.workMode) list = list.filter((job) => job.workMode === query.workMode);
		if (query.experience) list = list.filter((job) => job.experience === query.experience);

		const byLatest = (a: Job, b: Job) => +new Date(b.publishedAt) - +new Date(a.publishedAt);
		if (query.sort === 'salary')
			list.sort((a, b) => b.salaryMax - a.salaryMax || byLatest(a, b));
		else if (query.sort === 'relevance' && keyword)
			list.sort((a, b) => scoreOf(b) - scoreOf(a) || byLatest(a, b));
		else list.sort(byLatest);

		const total = list.length;
		const start = (page - 1) * pageSize;
		return {
			list: list.slice(start, start + pageSize).map((j) => this.data.jobView(j)),
			total,
			page,
			pageSize,
		};
	}

	jobMeta() {
		const live = this.data.jobs.filter((j) => this.data.isLive(j));
		const unique = (values: string[]) => [...new Set(values)].sort();
		return {
			categories: CATEGORIES,
			skills: unique(live.flatMap((j) => j.skills)),
			locations: unique(live.map((j) => j.location)),
			jobTypes: JOB_TYPES,
			workModes: WORK_MODES,
			experiences: EXPERIENCES,
		};
	}

	getJob(id: number) {
		const job = this.data.jobs.find((j) => j.id === id);
		if (!job || !this.data.isLive(job)) throw new NotFoundException('岗位不存在或已下线');
		return this.data.jobView(job);
	}

	relatedJobs(id: number) {
		const job = this.getJob(id);
		const related = this.data.jobs
			.filter((j) => j.id !== id && this.data.isLive(j))
			.map((j) => ({
				j,
				score:
					(j.category === job.category ? 3 : 0) +
					j.skills.filter((s) => job.skills.includes(s)).length +
					(j.companyId === job.companyId ? 1 : 0),
			}))
			.filter((x) => x.score > 0)
			.sort((a, b) => b.score - a.score)
			.slice(0, 4)
			.map((x) => this.data.jobView(x.j));
		return { list: related, total: related.length };
	}

	apply(user: User, jobId: number, body: Body) {
		const job = this.data.jobs.find((j) => j.id === jobId);
		if (!job || !this.data.isLive(job)) throw new NotFoundException('岗位不存在或已下线');
		if (user.role !== 'candidate') throw new ForbiddenException('仅求职者可以投递岗位');
		if (this.data.applications.some((a) => a.jobId === jobId && a.userId === user.id)) {
			throw new ConflictException('你已投递过该岗位');
		}
		const resumeName = String(body.resumeName ?? user.resumeName ?? '').trim();
		if (!resumeName) throw new BadRequestException('请先上传简历再投递');

		const application: Application = {
			id: this.data.nextId.application++,
			jobId,
			userId: user.id,
			status: 'applied',
			appliedAt: new Date().toISOString(),
			resumeName,
			note: body.note ? String(body.note).slice(0, 500) : undefined,
		};
		this.data.applications.push(application);
		job.applicantCount += 1;
		this.data.notify(
			user.id,
			'投递成功',
			`你已成功投递「${job.title}」，可在个人中心查看进度。`
		);
		return { message: '投递成功', application };
	}

	addFavorite(user: User, jobId: number) {
		this.getJob(jobId);
		const set = this.data.favorites.get(user.id) ?? new Set<number>();
		set.add(jobId);
		this.data.favorites.set(user.id, set);
		return { favorited: true, jobId };
	}

	removeFavorite(user: User, jobId: number) {
		this.data.favorites.get(user.id)?.delete(jobId);
		return { favorited: false, jobId };
	}

	createReport(user: User, body: Body) {
		const jobId = Number(body.jobId);
		this.getJob(jobId);
		const reason = String(body.reason ?? '').trim();
		if (!reason) throw new BadRequestException('请填写举报原因');
		const report = {
			id: this.data.reports.length + 1,
			jobId,
			reason: reason.slice(0, 300),
			reporter: user.email,
			status: 'open' as const,
			createdAt: new Date().toISOString(),
		};
		this.data.reports.push(report);
		return { message: '举报已提交，我们会尽快处理', report };
	}
}

export interface JobQuery {
	keyword?: string;
	category?: string;
	skill?: string;
	location?: string;
	salaryMin?: string;
	jobType?: string;
	workMode?: string;
	experience?: string;
	sort?: string;
	page?: string;
	pageSize?: string;
}
