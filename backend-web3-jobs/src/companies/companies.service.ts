import { Inject, Injectable } from '@nestjs/common';
import { AppDataService } from '../common/app-data.service';

@Injectable()
export class CompaniesService {
	constructor(@Inject(AppDataService) private readonly data: AppDataService) {}

	listCompanies() {
		const list = this.data.companies
			.filter(
				(c) =>
					this.data.jobs.some((j) => j.companyId === c.id && this.data.isLive(j)) ||
					c.verified
			)
			.map((c) => ({
				...c,
				openJobs: this.data.jobs.filter((j) => j.companyId === c.id && this.data.isLive(j))
					.length,
			}));
		return { list, total: list.length };
	}

	getCompany(id: number) {
		return this.data.getCompany(id);
	}

	companyJobs(id: number) {
		this.getCompany(id);
		const list = this.data.jobs
			.filter((j) => j.companyId === id && this.data.isLive(j))
			.map((j) => this.data.jobView(j));
		return { list, total: list.length };
	}
}
