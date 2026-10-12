import { Body, Controller, Get, Headers, Inject, Post, Put } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('api/users')
export class UsersController {
	constructor(@Inject(AppService) private readonly appService: AppService) {}

	private auth(header: string | undefined) {
		return this.appService.authenticate(header);
	}

	@Get('profile')
	profile(@Headers('authorization') auth: string | undefined) {
		return this.appService.me(this.auth(auth));
	}

	@Put('profile')
	updateProfile(
		@Headers('authorization') auth: string | undefined,
		@Body() body: Record<string, any>
	) {
		return this.appService.updateProfile(this.auth(auth), body ?? {});
	}

	@Get('applications')
	applications(@Headers('authorization') auth: string | undefined) {
		return this.appService.listApplications(this.auth(auth));
	}

	@Get('favorites')
	favorites(@Headers('authorization') auth: string | undefined) {
		return this.appService.listFavorites(this.auth(auth));
	}

	@Get('notifications')
	notifications(@Headers('authorization') auth: string | undefined) {
		return this.appService.listNotifications(this.auth(auth));
	}

	@Post('notifications/read')
	readNotifications(@Headers('authorization') auth: string | undefined) {
		return this.appService.markNotificationsRead(this.auth(auth));
	}
}
