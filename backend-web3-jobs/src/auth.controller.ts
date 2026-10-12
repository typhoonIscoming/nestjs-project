import { Body, Controller, Get, Headers, Inject, Post } from "@nestjs/common";
import { AppService } from "./app.service";

@Controller("api/auth")
export class AuthController {
  constructor(@Inject(AppService) private readonly appService: AppService) {}

  @Post("register")
  register(@Body() body: Record<string, any>) {
    return this.appService.register(body ?? {});
  }

  @Post("login")
  login(@Body() body: Record<string, any>) {
    return this.appService.login(body ?? {});
  }

  @Post("password-reset")
  passwordReset(@Body() body: Record<string, any>) {
    return this.appService.requestPasswordReset(body ?? {});
  }

  @Get("me")
  me(@Headers("authorization") auth: string | undefined) {
    return this.appService.me(this.appService.authenticate(auth));
  }
}
