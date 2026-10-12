import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { User } from '../types';
import { AppDataService } from '../common/app-data.service';
type Body = Record<string, any>;

@Injectable()
export class UsersService {
	constructor(@Inject(AppDataService) private readonly data: AppDataService) {}

	me(user: User) {
		return this.data.publicUser(user);
	}

	listFavorites(user: User) {
		const ids = this.data.favorites.get(user.id) ?? new Set<number>();
		const list = this.data.jobs
			.filter((j) => ids.has(j.id) && this.data.isLive(j))
			.map((j) => this.data.jobView(j));
		return { list, total: list.length, ids: [...ids] };
	}

	listApplications(user: User) {
		const list = this.data.applications
			.filter((a) => a.userId === user.id)
			.sort((a, b) => +new Date(b.appliedAt) - +new Date(a.appliedAt))
			.map((a) => ({
				...a,
				job: this.data.jobView(this.data.jobs.find((j) => j.id === a.jobId)!),
			}));
		return { list, total: list.length };
	}

	updateProfile(user: User, body: Body) {
		if (body.name !== undefined) {
			const name = String(body.name).trim();
			if (!name) throw new BadRequestException('姓名不能为空');
			user.name = name;
		}
		if (body.location !== undefined) user.location = String(body.location).slice(0, 80);
		if (body.headline !== undefined) user.headline = String(body.headline).slice(0, 120);
		if (Array.isArray(body.skills))
			user.skills = body.skills
				.map((s: unknown) => String(s).trim())
				.filter(Boolean)
				.slice(0, 20);
		if (body.resumeName !== undefined) {
			const resumeName = String(body.resumeName).trim();
			if (resumeName && !/\.(pdf|docx?)$/i.test(resumeName))
				throw new BadRequestException('简历仅支持 PDF / DOC / DOCX');
			user.resumeName = resumeName || undefined;
		}
		return this.data.publicUser(user);
	}

	listNotifications(user: User) {
		const list = this.data.notifications
			.filter((n) => n.userId === user.id)
			.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
		return {
			list,
			total: list.length,
			unread: list.filter((n) => !n.read).length,
		};
	}

	markNotificationsRead(user: User) {
		this.data.notifications.filter((n) => n.userId === user.id).forEach((n) => (n.read = true));
		return { message: '已全部标记为已读' };
	}
}
