import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthController } from './auth.controller.js';
import { CompaniesController } from './companies.controller.js';
import { EmployerController } from './employer.controller.js';
import { JobsController } from './jobs.controller.js';
import { UsersController } from './users.controller.js';
import { WorkController } from './work.controller.js';

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
	providers: [AppService],
})
export class AppModule {}
