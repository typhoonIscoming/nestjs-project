import { Controller, Get, Inject, Param, ParseIntPipe } from "@nestjs/common";
import { AppService } from "./app.service";

@Controller("api/companies")
export class CompaniesController {
  constructor(@Inject(AppService) private readonly appService: AppService) {}

  @Get()
  list() {
    return this.appService.listCompanies();
  }

  @Get(":id")
  detail(@Param("id", ParseIntPipe) id: number) {
    return this.appService.getCompany(id);
  }

  @Get(":id/jobs")
  jobs(@Param("id", ParseIntPipe) id: number) {
    return this.appService.companyJobs(id);
  }
}
