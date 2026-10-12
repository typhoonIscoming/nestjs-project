import { Injectable, NotFoundException } from '@nestjs/common';
import {
	seedApplications,
	seedCompanies,
	seedFavorites,
	seedJobs,
	seedNotifications,
	seedReports,
	seedUsers,
} from '../seed';
import { Job, User } from '../types';

@Injectable()
export class AppDataService {
	users = seedUsers();
	companies = seedCompanies();
	jobs = seedJobs();
	applications = seedApplications();
	notifications = seedNotifications();
	reports = seedReports();
	favorites = seedFavorites();
	nextId = {
		user: 100,
		company: 100,
		job: 100,
		application: 100,
		notification: 100,
	};

	publicUser(user: User) {
		const { password, ...rest } = user;
		return rest;
	}

	isLive(job: Job) {
		return job.status === 'published' && new Date(job.expiresAt).getTime() > Date.now();
	}

	jobView(job: Job) {
		const company = this.companies.find((c) => c.id === job.companyId);
		return {
			...job,
			company: company && {
				id: company.id,
				name: company.name,
				logoUrl: company.logoUrl,
				verified: company.verified,
				location: company.location,
				industry: company.industry,
			},
		};
	}

	notify(userId: number, title: string, body: string) {
		this.notifications.push({
			id: this.nextId.notification++,
			userId,
			title,
			body,
			read: false,
			createdAt: new Date().toISOString(),
		});
	}

	getCompany(id: number) {
		const company = this.companies.find((item) => item.id === id);
		if (!company) throw new NotFoundException('公司不存在');
		return {
			...company,
			openJobs: this.jobs.filter((job) => job.companyId === id && this.isLive(job)).length,
		};
	}
}
