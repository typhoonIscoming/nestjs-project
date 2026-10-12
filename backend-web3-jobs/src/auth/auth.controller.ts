import { Body, Controller, Get, Headers, Inject, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('api/auth')
export class AuthController {
	constructor(@Inject(AuthService) private readonly authService: AuthService) {}

	@Post('register')
	register(@Body() body: Record<string, any>) {
		return this.authService.register(body ?? {});
	}

	@Post('login')
	login(@Body() body: Record<string, any>) {
		return this.authService.login(body ?? {});
	}

	@Post('password-reset')
	passwordReset(@Body() body: Record<string, any>) {
		return this.authService.requestPasswordReset(body ?? {});
	}

	@Get('me')
	me(@Headers('authorization') auth: string | undefined) {
		return this.authService.me(this.authService.authenticate(auth));
	}
}
