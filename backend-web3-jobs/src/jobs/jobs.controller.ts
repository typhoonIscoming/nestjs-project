import {
	Body,
	Controller,
	Delete,
	Get,
	Headers,
	Inject,
	Param,
	ParseIntPipe,
	Post,
	Query,
} from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { JobQuery, JobsService } from './jobs.service';

@Controller('api/jobs')
export class JobsController {
	constructor(
		@Inject(AuthService) private readonly authService: AuthService,
		@Inject(JobsService) private readonly jobsService: JobsService
	) {}

	@Get()
	list(@Query() query: JobQuery) {
		return this.jobsService.listJobs(query);
	}

	@Get('meta')
	meta() {
		return this.jobsService.jobMeta();
	}

	@Get(':id')
	detail(@Param('id', ParseIntPipe) id: number) {
		return this.jobsService.getJob(id);
	}

	@Get(':id/related')
	related(@Param('id', ParseIntPipe) id: number) {
		return this.jobsService.relatedJobs(id);
	}

	@Post(':id/apply')
	apply(
		@Headers('authorization') auth: string | undefined,
		@Param('id', ParseIntPipe) id: number,
		@Body() body: Record<string, any>
	) {
		return this.jobsService.apply(
			this.authService.authenticate(auth, ['candidate']),
			id,
			body ?? {}
		);
	}

	@Post(':id/favorite')
	favorite(
		@Headers('authorization') auth: string | undefined,
		@Param('id', ParseIntPipe) id: number
	) {
		return this.jobsService.addFavorite(this.authService.authenticate(auth, ['candidate']), id);
	}

	@Delete(':id/favorite')
	unfavorite(
		@Headers('authorization') auth: string | undefined,
		@Param('id', ParseIntPipe) id: number
	) {
		return this.jobsService.removeFavorite(
			this.authService.authenticate(auth, ['candidate']),
			id
		);
	}

	@Post(':id/report')
	report(
		@Headers('authorization') auth: string | undefined,
		@Param('id', ParseIntPipe) id: number,
		@Body() body: Record<string, any>
	) {
		return this.jobsService.createReport(this.authService.authenticate(auth), {
			...body,
			jobId: id,
		});
	}
}
