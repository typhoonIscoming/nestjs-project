import {
	BadRequestException,
	ConflictException,
	ForbiddenException,
	Inject,
	Injectable,
	UnauthorizedException,
} from '@nestjs/common';
import { Company, Role, User } from '../types';
import { AppDataService } from '../common/app-data.service';
type Body = Record<string, any>;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Injectable()
export class AuthService {
	constructor(@Inject(AppDataService) private readonly data: AppDataService) {}

	authenticate(header: string | undefined, roles?: Role[]): User {
		const match = header?.match(/^Bearer token-(\d+)$/);
		const user = match ? this.data.users.find((u) => u.id === Number(match[1])) : undefined;
		if (!user) throw new UnauthorizedException('请先登录');
		if (user.status === 'banned') throw new ForbiddenException('账号已被封禁');
		if (roles && !roles.includes(user.role)) throw new ForbiddenException('无权访问');
		return user;
	}

	private validateEmail(email: unknown): string {
		if (typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
			throw new BadRequestException('邮箱格式不正确');
		}
		return email.trim().toLowerCase();
	}

	private validatePassword(password: unknown): string {
		if (
			typeof password !== 'string' ||
			password.length < 8 ||
			!/[A-Za-z]/.test(password) ||
			!/\d/.test(password)
		) {
			throw new BadRequestException('密码至少 8 位，且需同时包含字母和数字');
		}
		return password;
	}

	register(body: Body) {
		const email = this.validateEmail(body.email);
		const password = this.validatePassword(body.password);
		const name = String(body.name ?? '').trim();
		if (!name) throw new BadRequestException('请填写姓名');
		if (body.role !== 'candidate' && body.role !== 'employer') {
			throw new BadRequestException('角色必须为 candidate 或 employer');
		}
		if (this.data.users.some((u) => u.email === email))
			throw new ConflictException('该邮箱已注册');

		let companyId: number | undefined;
		if (body.role === 'employer') {
			const companyName = String(body.companyName ?? '').trim() || `${name} 的公司`;
			const company: Company = {
				id: this.data.nextId.company++,
				name: companyName,
				description: '',
				industry: 'Layer 1',
				website: '',
				logoUrl: `https://placehold.co/120x120/334155/ffffff?text=${encodeURIComponent(companyName.slice(0, 2).toUpperCase())}`,
				verified: false,
				location: '',
				size: '1-10',
				culture: '',
				values: [],
			};
			this.data.companies.push(company);
			companyId = company.id;
		}

		const user: User = {
			id: this.data.nextId.user++,
			email,
			password,
			name,
			role: body.role,
			status: body.role === 'employer' ? 'pending' : 'active',
			avatar: `https://placehold.co/120x120/334155/ffffff?text=${encodeURIComponent(name.slice(0, 2).toUpperCase())}`,
			location: '',
			headline: '',
			skills: [],
			companyId,
			createdAt: new Date().toISOString(),
		};
		this.data.users.push(user);
		return { token: `token-${user.id}`, user: this.data.publicUser(user) };
	}

	login(body: Body) {
		const email = this.validateEmail(body.email);
		const user = this.data.users.find((u) => u.email === email && u.password === body.password);
		if (!user) throw new UnauthorizedException('邮箱或密码错误');
		if (user.status === 'banned') throw new ForbiddenException('账号已被封禁');
		return { token: `token-${user.id}`, user: this.data.publicUser(user) };
	}

	requestPasswordReset(body: Body) {
		this.validateEmail(body.email);
		return { message: '如果该邮箱已注册，我们已发送重置密码邮件' };
	}

	me(user: User) {
		return this.data.publicUser(user);
	}
}
