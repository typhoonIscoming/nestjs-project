import { Controller, Get, Inject, Param, ParseIntPipe } from '@nestjs/common';
import { CompaniesService } from './companies.service';

@Controller('api/companies')
export class CompaniesController {
	constructor(@Inject(CompaniesService) private readonly companiesService: CompaniesService) {}

	@Get()
	list() {
		return this.companiesService.listCompanies();
	}

	@Get(':id')
	detail(@Param('id', ParseIntPipe) id: number) {
		return this.companiesService.getCompany(id);
	}

	@Get(':id/jobs')
	jobs(@Param('id', ParseIntPipe) id: number) {
		return this.companiesService.companyJobs(id);
	}
}
