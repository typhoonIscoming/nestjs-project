import { Body, Controller, Get, Headers, Inject, Post, Put } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { UsersService } from './users.service';

@Controller('api/users')
export class UsersController {
	constructor(
		@Inject(AuthService) private readonly authService: AuthService,
		@Inject(UsersService) private readonly usersService: UsersService
	) {}

	private auth(header: string | undefined) {
		return this.authService.authenticate(header);
	}

	@Get('profile')
	profile(@Headers('authorization') auth: string | undefined) {
		return this.usersService.me(this.auth(auth));
	}

	@Put('profile')
	updateProfile(
		@Headers('authorization') auth: string | undefined,
		@Body() body: Record<string, any>
	) {
		return this.usersService.updateProfile(this.auth(auth), body ?? {});
	}

	@Get('applications')
	applications(@Headers('authorization') auth: string | undefined) {
		return this.usersService.listApplications(this.auth(auth));
	}

	@Get('favorites')
	favorites(@Headers('authorization') auth: string | undefined) {
		return this.usersService.listFavorites(this.auth(auth));
	}

	@Get('notifications')
	notifications(@Headers('authorization') auth: string | undefined) {
		return this.usersService.listNotifications(this.auth(auth));
	}

	@Post('notifications/read')
	readNotifications(@Headers('authorization') auth: string | undefined) {
		return this.usersService.markNotificationsRead(this.auth(auth));
	}
}
