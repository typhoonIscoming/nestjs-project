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
} from "@nestjs/common";
import { AppService, JobQuery } from "./app.service";

@Controller("api/jobs")
export class JobsController {
  constructor(@Inject(AppService) private readonly appService: AppService) {}

  @Get()
  list(@Query() query: JobQuery) {
    return this.appService.listJobs(query);
  }

  @Get("meta")
  meta() {
    return this.appService.jobMeta();
  }

  @Get(":id")
  detail(@Param("id", ParseIntPipe) id: number) {
    return this.appService.getJob(id);
  }

  @Get(":id/related")
  related(@Param("id", ParseIntPipe) id: number) {
    return this.appService.relatedJobs(id);
  }

  @Post(":id/apply")
  apply(
    @Headers("authorization") auth: string | undefined,
    @Param("id", ParseIntPipe) id: number,
    @Body() body: Record<string, any>,
  ) {
    return this.appService.apply(
      this.appService.authenticate(auth, ["candidate"]),
      id,
      body ?? {},
    );
  }

  @Post(":id/favorite")
  favorite(
    @Headers("authorization") auth: string | undefined,
    @Param("id", ParseIntPipe) id: number,
  ) {
    return this.appService.addFavorite(
      this.appService.authenticate(auth, ["candidate"]),
      id,
    );
  }

  @Delete(":id/favorite")
  unfavorite(
    @Headers("authorization") auth: string | undefined,
    @Param("id", ParseIntPipe) id: number,
  ) {
    return this.appService.removeFavorite(
      this.appService.authenticate(auth, ["candidate"]),
      id,
    );
  }

  @Post(":id/report")
  report(
    @Headers("authorization") auth: string | undefined,
    @Param("id", ParseIntPipe) id: number,
    @Body() body: Record<string, any>,
  ) {
    return this.appService.createReport(this.appService.authenticate(auth), {
      ...body,
      jobId: id,
    });
  }
}
