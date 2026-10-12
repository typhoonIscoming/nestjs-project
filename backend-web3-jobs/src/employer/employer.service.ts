import {
	BadRequestException,
	ForbiddenException,
	Inject,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { CATEGORIES } from '../seed';
import { ApplicationStatus, Experience, Job, JobType, User, WorkMode } from '../types';
import { AppDataService } from '../common/app-data.service';
type Body = Record<string, any>;
const DAY = 24 * 60 * 60 * 1000;
const JOB_TYPES: JobType[] = ['full-time', 'part-time', 'contract', 'internship'];
const WORK_MODES: WorkMode[] = ['remote', 'onsite', 'hybrid'];
const EXPERIENCES: Experience[] = ['entry', 'mid', 'senior', 'lead'];
const APPLICATION_STATUSES: ApplicationStatus[] = [
	'applied',
	'viewed',
	'interviewing',
	'rejected',
	'accepted',
];

@Injectable()
export class EmployerService {
	constructor(@Inject(AppDataService) private readonly data: AppDataService) {}

	private employerCompanyId(user: User): number {
		if (!user.companyId) throw new BadRequestException('尚未绑定公司');
		return user.companyId;
	}

	private parseJobBody(body: Body, partial: boolean): Partial<Job> {
		const out: Partial<Job> = {};
		const requireText = (key: 'title' | 'description' | 'location', label: string) => {
			const value = body[key];
			if (value === undefined && partial) return;
			const text = String(value ?? '').trim();
			if (!text) throw new BadRequestException(`请填写${label}`);
			out[key] = text;
		};
		requireText('title', '岗位名称');
		requireText('description', '岗位简介');
		requireText('location', '工作地点');

		if (body.category !== undefined || !partial) {
			if (!CATEGORIES.includes(body.category))
				throw new BadRequestException('行业分类不合法');
			out.category = body.category;
		}
		const pickEnum = <T extends string>(
			key: 'jobType' | 'workMode' | 'experience',
			allowed: T[],
			label: string
		) => {
			if (body[key] === undefined && partial) return;
			if (!allowed.includes(body[key])) throw new BadRequestException(`${label}不合法`);
			(out as any)[key] = body[key];
		};
		pickEnum('jobType', JOB_TYPES, '岗位类型');
		pickEnum('workMode', WORK_MODES, '工作方式');
		pickEnum('experience', EXPERIENCES, '经验要求');

		if (body.salaryMin !== undefined || body.salaryMax !== undefined || !partial) {
			const min = Number(body.salaryMin);
			const max = Number(body.salaryMax);
			if (!Number.isFinite(min) || !Number.isFinite(max) || min <= 0 || max < min) {
				throw new BadRequestException('薪资范围不合法');
			}
			out.salaryMin = min;
			out.salaryMax = max;
		}
		const list = (key: 'skills' | 'responsibilities' | 'requirements' | 'benefits') => {
			if (body[key] === undefined && partial) return;
			if (!Array.isArray(body[key])) throw new BadRequestException(`${key} 必须是数组`);
			out[key] = body[key]
				.map((s: unknown) => String(s).trim())
				.filter(Boolean)
				.slice(0, 20);
		};
		list('skills');
		list('responsibilities');
		list('requirements');
		list('benefits');
		return out;
	}

	employerJobs(user: User) {
		const companyId = this.employerCompanyId(user);
		const list = this.data.jobs
			.filter((j) => j.companyId === companyId)
			.sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt))
			.map((j) => this.data.jobView(j));
		return { list, total: list.length };
	}

	employerJob(user: User, id: number) {
		return this.data.jobView(this.ownedJob(user, id));
	}

	private ownedJob(user: User, id: number): Job {
		const job = this.data.jobs.find((j) => j.id === id);
		if (!job) throw new NotFoundException('岗位不存在');
		if (job.companyId !== this.employerCompanyId(user))
			throw new ForbiddenException('无权操作该岗位');
		return job;
	}

	createJob(user: User, body: Body) {
		const companyId = this.employerCompanyId(user);
		const data = this.parseJobBody(body, false);
		const job: Job = {
			...(data as Job),
			id: this.data.nextId.job++,
			companyId,
			status: 'pending',
			publishedAt: new Date().toISOString(),
			expiresAt: new Date(Date.now() + 30 * DAY).toISOString(),
			applicantCount: 0,
		};
		this.data.jobs.push(job);
		return { message: '岗位已提交审核', job: this.data.jobView(job) };
	}

	updateJob(user: User, id: number, body: Body) {
		const job = this.ownedJob(user, id);
		Object.assign(job, this.parseJobBody(body, true));
		if (job.status === 'rejected') job.status = 'pending';
		return { message: '岗位已更新', job: this.data.jobView(job) };
	}

	offlineJob(user: User, id: number) {
		const job = this.ownedJob(user, id);
		job.status = 'offline';
		return { message: '岗位已下线', job: this.data.jobView(job) };
	}

	republishJob(user: User, id: number) {
		const job = this.ownedJob(user, id);
		job.status = 'pending';
		job.expiresAt = new Date(Date.now() + 30 * DAY).toISOString();
		return { message: '岗位已重新提交审核', job: this.data.jobView(job) };
	}

	employerApplications(user: User, query: { jobId?: string; status?: string; keyword?: string }) {
		const companyId = this.employerCompanyId(user);
		const keyword = query.keyword?.trim().toLowerCase();
		const list = this.data.applications
			.map((a) => ({
				a,
				job: this.data.jobs.find((j) => j.id === a.jobId)!,
				candidate: this.data.users.find((u) => u.id === a.userId)!,
			}))
			.filter(({ job }) => job.companyId === companyId)
			.filter(({ a }) => !query.jobId || a.jobId === Number(query.jobId))
			.filter(({ a }) => !query.status || a.status === query.status)
			.filter(
				({ candidate }) =>
					!keyword ||
					candidate.name.toLowerCase().includes(keyword) ||
					candidate.skills.some((s) => s.toLowerCase().includes(keyword))
			)
			.sort((x, y) => +new Date(y.a.appliedAt) - +new Date(x.a.appliedAt))
			.map(({ a, job, candidate }) => ({
				...a,
				jobTitle: job.title,
				candidate: {
					id: candidate.id,
					name: candidate.name,
					email: candidate.email,
					avatar: candidate.avatar,
					headline: candidate.headline,
					location: candidate.location,
					skills: candidate.skills,
				},
			}));
		return { list, total: list.length };
	}

	updateApplicationStatus(user: User, id: number, body: Body) {
		const companyId = this.employerCompanyId(user);
		const application = this.data.applications.find((a) => a.id === id);
		const job = application && this.data.jobs.find((j) => j.id === application.jobId);
		if (!application || !job || job.companyId !== companyId)
			throw new NotFoundException('申请不存在');
		if (!APPLICATION_STATUSES.includes(body.status))
			throw new BadRequestException('状态不合法');
		application.status = body.status;
		this.data.notify(
			application.userId,
			'投递状态更新',
			`你对「${job.title}」的申请状态更新为：${body.status}`
		);
		return { message: '状态已更新', application };
	}

	getEmployerCompany(user: User) {
		return this.data.getCompany(this.employerCompanyId(user));
	}

	updateEmployerCompany(user: User, body: Body) {
		const company = this.data.companies.find((c) => c.id === this.employerCompanyId(user))!;
		const text = (
			key: 'name' | 'description' | 'industry' | 'website' | 'location' | 'size' | 'culture'
		) => {
			if (body[key] !== undefined) company[key] = String(body[key]).trim().slice(0, 1000);
		};
		(
			['name', 'description', 'industry', 'website', 'location', 'size', 'culture'] as const
		).forEach(text);
		if (!company.name) throw new BadRequestException('公司名称不能为空');
		if (Array.isArray(body.values))
			company.values = body.values
				.map((v: unknown) => String(v).trim())
				.filter(Boolean)
				.slice(0, 10);
		return this.data.getCompany(company.id);
	}
}
