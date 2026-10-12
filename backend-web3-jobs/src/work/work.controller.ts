import { Controller, Get, Inject } from '@nestjs/common';
import { WorkService } from './work.service';

@Controller('api/work')
export class WorkController {
	constructor(@Inject(WorkService) private readonly workService: WorkService) {}

	@Get('list')
	getWorkList() {
		return this.workService.getWorkList();
	}
}
