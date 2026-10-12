import { Body, Controller, Get, Headers, Inject, Param, ParseIntPipe, Post } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { AdminService } from './admin.service';

@Controller('api/admin')
export class AdminController {
	constructor(
		@Inject(AuthService) private readonly authService: AuthService,
		@Inject(AdminService) private readonly adminService: AdminService
	) {}

	private auth(header: string | undefined) {
		return this.authService.authenticate(header, ['admin']);
	}

	@Get('stats')
	stats(@Headers('authorization') auth: string | undefined) {
		this.auth(auth);
		return this.adminService.adminStats();
	}

	@Get('jobs/review')
	pendingJobs(@Headers('authorization') auth: string | undefined) {
		this.auth(auth);
		return this.adminService.adminPendingJobs();
	}

	@Post('jobs/:id/review')
	reviewJob(
		@Headers('authorization') auth: string | undefined,
		@Param('id', ParseIntPipe) id: number,
		@Body() body: Record<string, any>
	) {
		this.auth(auth);
		return this.adminService.reviewJob(id, body ?? {});
	}

	@Get('users')
	users(@Headers('authorization') auth: string | undefined) {
		this.auth(auth);
		return this.adminService.adminUsers();
	}

	@Post('users/:id/review')
	reviewUser(
		@Headers('authorization') auth: string | undefined,
		@Param('id', ParseIntPipe) id: number,
		@Body() body: Record<string, any>
	) {
		this.auth(auth);
		return this.adminService.reviewUser(id, body ?? {});
	}

	@Get('reports')
	reports(@Headers('authorization') auth: string | undefined) {
		this.auth(auth);
		return this.adminService.adminReports();
	}

	@Post('reports/:id/resolve')
	resolveReport(
		@Headers('authorization') auth: string | undefined,
		@Param('id', ParseIntPipe) id: number,
		@Body() body: Record<string, any>
	) {
		this.auth(auth);
		return this.adminService.resolveReport(id, body ?? {});
	}
}
