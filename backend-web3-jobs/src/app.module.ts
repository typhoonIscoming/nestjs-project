import { Module } from '@nestjs/common';
import { AdminController } from './admin/admin.controller.js';
import { AppController } from './app/app.controller.js';
import { AuthController } from './auth/auth.controller.js';
import { CompaniesController } from './companies/companies.controller.js';
import { EmployerController } from './employer/employer.controller.js';
import { JobsController } from './jobs/jobs.controller.js';
import { UsersController } from './users/users.controller.js';
import { WorkController } from './work/work.controller.js';
import { AdminService } from './admin/admin.service.js';
import { AppDataService } from './common/app-data.service.js';
import { AppService } from './app/app.service.js';
import { AuthService } from './auth/auth.service.js';
import { CompaniesService } from './companies/companies.service.js';
import { EmployerService } from './employer/employer.service.js';
import { JobsService } from './jobs/jobs.service.js';
import { UsersService } from './users/users.service.js';
import { WorkService } from './work/work.service.js';

@Module({
	controllers: [
		AppController,
		JobsController,
		CompaniesController,
		AuthController,
		UsersController,
		EmployerController,
		AdminController,
		WorkController,
	],
	providers: [
		AppDataService,
		AppService,
		AuthService,
		JobsService,
		UsersService,
		CompaniesService,
		EmployerService,
		AdminService,
		WorkService,
	],
})
export class AppModule {}
