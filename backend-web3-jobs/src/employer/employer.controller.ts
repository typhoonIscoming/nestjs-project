import {
	Body,
	Controller,
	Get,
	Headers,
	Inject,
	Param,
	ParseIntPipe,
	Post,
	Put,
	Query,
} from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { EmployerService } from './employer.service';

@Controller('api/employer')
export class EmployerController {
	constructor(
		@Inject(AuthService) private readonly authService: AuthService,
		@Inject(EmployerService) private readonly employerService: EmployerService
	) {}

	private auth(header: string | undefined) {
		return this.authService.authenticate(header, ['employer']);
	}

	@Get('jobs')
	jobs(@Headers('authorization') auth: string | undefined) {
		return this.employerService.employerJobs(this.auth(auth));
	}

	@Post('jobs')
	create(@Headers('authorization') auth: string | undefined, @Body() body: Record<string, any>) {
		return this.employerService.createJob(this.auth(auth), body ?? {});
	}

	@Get('jobs/:id')
	job(@Headers('authorization') auth: string | undefined, @Param('id', ParseIntPipe) id: number) {
		return this.employerService.employerJob(this.auth(auth), id);
	}

	@Put('jobs/:id')
	update(
		@Headers('authorization') auth: string | undefined,
		@Param('id', ParseIntPipe) id: number,
		@Body() body: Record<string, any>
	) {
		return this.employerService.updateJob(this.auth(auth), id, body ?? {});
	}

	@Post('jobs/:id/offline')
	offline(
		@Headers('authorization') auth: string | undefined,
		@Param('id', ParseIntPipe) id: number
	) {
		return this.employerService.offlineJob(this.auth(auth), id);
	}

	@Post('jobs/:id/republish')
	republish(
		@Headers('authorization') auth: string | undefined,
		@Param('id', ParseIntPipe) id: number
	) {
		return this.employerService.republishJob(this.auth(auth), id);
	}

	@Get('applications')
	applications(
		@Headers('authorization') auth: string | undefined,
		@Query() query: { jobId?: string; status?: string; keyword?: string }
	) {
		return this.employerService.employerApplications(this.auth(auth), query);
	}

	@Post('applications/:id/status')
	applicationStatus(
		@Headers('authorization') auth: string | undefined,
		@Param('id', ParseIntPipe) id: number,
		@Body() body: Record<string, any>
	) {
		return this.employerService.updateApplicationStatus(this.auth(auth), id, body ?? {});
	}

	@Get('company')
	company(@Headers('authorization') auth: string | undefined) {
		return this.employerService.getEmployerCompany(this.auth(auth));
	}

	@Put('company')
	updateCompany(
		@Headers('authorization') auth: string | undefined,
		@Body() body: Record<string, any>
	) {
		return this.employerService.updateEmployerCompany(this.auth(auth), body ?? {});
	}
}
