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
} from "@nestjs/common";
import { AppService } from "./app.service";

@Controller("api/employer")
export class EmployerController {
  constructor(@Inject(AppService) private readonly appService: AppService) {}

  private auth(header: string | undefined) {
    return this.appService.authenticate(header, ["employer"]);
  }

  @Get("jobs")
  jobs(@Headers("authorization") auth: string | undefined) {
    return this.appService.employerJobs(this.auth(auth));
  }

  @Post("jobs")
  create(
    @Headers("authorization") auth: string | undefined,
    @Body() body: Record<string, any>,
  ) {
    return this.appService.createJob(this.auth(auth), body ?? {});
  }

  @Get("jobs/:id")
  job(
    @Headers("authorization") auth: string | undefined,
    @Param("id", ParseIntPipe) id: number,
  ) {
    return this.appService.employerJob(this.auth(auth), id);
  }

  @Put("jobs/:id")
  update(
    @Headers("authorization") auth: string | undefined,
    @Param("id", ParseIntPipe) id: number,
    @Body() body: Record<string, any>,
  ) {
    return this.appService.updateJob(this.auth(auth), id, body ?? {});
  }

  @Post("jobs/:id/offline")
  offline(
    @Headers("authorization") auth: string | undefined,
    @Param("id", ParseIntPipe) id: number,
  ) {
    return this.appService.offlineJob(this.auth(auth), id);
  }

  @Post("jobs/:id/republish")
  republish(
    @Headers("authorization") auth: string | undefined,
    @Param("id", ParseIntPipe) id: number,
  ) {
    return this.appService.republishJob(this.auth(auth), id);
  }

  @Get("applications")
  applications(
    @Headers("authorization") auth: string | undefined,
    @Query() query: { jobId?: string; status?: string; keyword?: string },
  ) {
    return this.appService.employerApplications(this.auth(auth), query);
  }

  @Post("applications/:id/status")
  applicationStatus(
    @Headers("authorization") auth: string | undefined,
    @Param("id", ParseIntPipe) id: number,
    @Body() body: Record<string, any>,
  ) {
    return this.appService.updateApplicationStatus(
      this.auth(auth),
      id,
      body ?? {},
    );
  }

  @Get("company")
  company(@Headers("authorization") auth: string | undefined) {
    return this.appService.getEmployerCompany(this.auth(auth));
  }

  @Put("company")
  updateCompany(
    @Headers("authorization") auth: string | undefined,
    @Body() body: Record<string, any>,
  ) {
    return this.appService.updateEmployerCompany(this.auth(auth), body ?? {});
  }
}
