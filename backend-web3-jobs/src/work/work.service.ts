import { Injectable } from '@nestjs/common';

@Injectable()
export class WorkService {
	getWorkList() {
		return {
			list: [
				{ id: 1, title: 'Solidity Dev', status: 'Open' },
				{ id: 2, title: 'Product Manager', status: 'Reviewing' },
				{ id: 3, title: 'Frontend Engineer', status: 'Closed' },
			],
			total: 3,
		};
	}
}
