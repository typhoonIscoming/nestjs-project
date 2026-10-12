import {
  Body,
  Controller,
  Get,
  Headers,
  Inject,
  Param,
  ParseIntPipe,
  Post,
} from "@nestjs/common";
import { AppService } from "./app.service";

@Controller("api/admin")
export class AdminController {
  constructor(@Inject(AppService) private readonly appService: AppService) {}

  private auth(header: string | undefined) {
    return this.appService.authenticate(header, ["admin"]);
  }

  @Get("stats")
  stats(@Headers("authorization") auth: string | undefined) {
    this.auth(auth);
    return this.appService.adminStats();
  }

  @Get("jobs/review")
  pendingJobs(@Headers("authorization") auth: string | undefined) {
    this.auth(auth);
    return this.appService.adminPendingJobs();
  }

  @Post("jobs/:id/review")
  reviewJob(
    @Headers("authorization") auth: string | undefined,
    @Param("id", ParseIntPipe) id: number,
    @Body() body: Record<string, any>,
  ) {
    this.auth(auth);
    return this.appService.reviewJob(id, body ?? {});
  }

  @Get("users")
  users(@Headers("authorization") auth: string | undefined) {
    this.auth(auth);
    return this.appService.adminUsers();
  }

  @Post("users/:id/review")
  reviewUser(
    @Headers("authorization") auth: string | undefined,
    @Param("id", ParseIntPipe) id: number,
    @Body() body: Record<string, any>,
  ) {
    this.auth(auth);
    return this.appService.reviewUser(id, body ?? {});
  }

  @Get("reports")
  reports(@Headers("authorization") auth: string | undefined) {
    this.auth(auth);
    return this.appService.adminReports();
  }

  @Post("reports/:id/resolve")
  resolveReport(
    @Headers("authorization") auth: string | undefined,
    @Param("id", ParseIntPipe) id: number,
    @Body() body: Record<string, any>,
  ) {
    this.auth(auth);
    return this.appService.resolveReport(id, body ?? {});
  }
}
