import {
	BadRequestException,
	ForbiddenException,
	Inject,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { Job, User } from '../types';
import { AppDataService } from '../common/app-data.service';
const DAY = 24 * 60 * 60 * 1000;
type Body = Record<string, any>;

@Injectable()
export class AdminService {
	constructor(@Inject(AppDataService) private readonly data: AppDataService) {}

	adminStats() {
		const live = this.data.jobs.filter((j) => this.data.isLive(j)).length;
		return {
			users: this.data.users.length,
			candidates: this.data.users.filter((u) => u.role === 'candidate').length,
			employers: this.data.users.filter((u) => u.role === 'employer').length,
			companies: this.data.companies.length,
			jobsTotal: this.data.jobs.length,
			jobsLive: live,
			jobsPending: this.data.jobs.filter((j) => j.status === 'pending').length,
			applications: this.data.applications.length,
			reportsOpen: this.data.reports.filter((r) => r.status === 'open').length,
			usersPending: this.data.users.filter((u) => u.status === 'pending').length,
		};
	}

	adminPendingJobs() {
		const list = this.data.jobs
			.filter((j) => j.status === 'pending')
			.map((j) => this.data.jobView(j));
		return { list, total: list.length };
	}

	reviewJob(id: number, body: Body) {
		const job = this.data.jobs.find((j) => j.id === id);
		if (!job) throw new NotFoundException('岗位不存在');
		if (body.decision !== 'approved' && body.decision !== 'rejected')
			throw new BadRequestException('decision 必须为 approved 或 rejected');
		job.status = body.decision === 'approved' ? 'published' : 'rejected';
		if (job.status === 'published') {
			job.publishedAt = new Date().toISOString();
			job.expiresAt = new Date(Date.now() + 30 * DAY).toISOString();
		}
		const owner = this.data.users.find(
			(u) => u.companyId === job.companyId && u.role === 'employer'
		);
		if (owner)
			this.data.notify(
				owner.id,
				'岗位审核结果',
				`岗位「${job.title}」${job.status === 'published' ? '已通过审核并上线' : '未通过审核'}。`
			);
		return {
			message: job.status === 'published' ? '已通过' : '已驳回',
			job: this.data.jobView(job),
		};
	}

	adminUsers() {
		const list = this.data.users.map((u) => ({
			...this.data.publicUser(u),
			companyName: this.data.companies.find((c) => c.id === u.companyId)?.name,
		}));
		return { list, total: list.length };
	}

	reviewUser(id: number, body: Body) {
		const user = this.data.users.find((u) => u.id === id);
		if (!user) throw new NotFoundException('用户不存在');
		if (user.role === 'admin') throw new ForbiddenException('不能操作管理员账号');
		if (body.decision === 'approve') {
			user.status = 'active';
			const company = this.data.companies.find((c) => c.id === user.companyId);
			if (company) company.verified = true;
		} else if (body.decision === 'ban') {
			user.status = 'banned';
		} else if (body.decision === 'unban') {
			user.status = 'active';
		} else {
			throw new BadRequestException('decision 必须为 approve / ban / unban');
		}
		return { message: '操作成功', user: this.data.publicUser(user) };
	}

	adminReports() {
		const list = this.data.reports
			.map((r) => ({
				...r,
				jobTitle: this.data.jobs.find((j) => j.id === r.jobId)?.title ?? '已删除岗位',
			}))
			.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
		return { list, total: list.length };
	}

	resolveReport(id: number, body: Body) {
		const report = this.data.reports.find((r) => r.id === id);
		if (!report) throw new NotFoundException('举报不存在');
		report.status = 'resolved';
		if (body.takeDown) {
			const job = this.data.jobs.find((j) => j.id === report.jobId);
			if (job) job.status = 'offline';
		}
		return { message: '举报已处理', report };
	}
}
