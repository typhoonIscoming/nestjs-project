import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  CATEGORIES,
  seedApplications,
  seedCompanies,
  seedFavorites,
  seedJobs,
  seedNotifications,
  seedReports,
  seedUsers,
} from './seed';
import { Application, ApplicationStatus, Company, Experience, Job, JobType, Role, User, WorkMode } from './types';

const DAY = 24 * 60 * 60 * 1000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const JOB_TYPES: JobType[] = ['full-time', 'part-time', 'contract', 'internship'];
const WORK_MODES: WorkMode[] = ['remote', 'onsite', 'hybrid'];
const EXPERIENCES: Experience[] = ['entry', 'mid', 'senior', 'lead'];
const APPLICATION_STATUSES: ApplicationStatus[] = ['applied', 'viewed', 'interviewing', 'rejected', 'accepted'];

export interface JobQuery {
  keyword?: string;
  category?: string;
  skill?: string;
  location?: string;
  salaryMin?: string;
  jobType?: string;
  workMode?: string;
  experience?: string;
  sort?: string;
  page?: string;
  pageSize?: string;
}

type Body = Record<string, any>;

@Injectable()
export class AppService {
  private users = seedUsers();
  private companies = seedCompanies();
  private jobs = seedJobs();
  private applications = seedApplications();
  private notifications = seedNotifications();
  private reports = seedReports();
  private favorites = seedFavorites();
  private nextId = { user: 100, company: 100, job: 100, application: 100, notification: 100 };

  getHello(): string {
    return 'Hello World!';
  }

  // ---------- auth ----------
  authenticate(header: string | undefined, roles?: Role[]): User {
    const match = header?.match(/^Bearer token-(\d+)$/);
    const user = match ? this.users.find((u) => u.id === Number(match[1])) : undefined;
    if (!user) throw new UnauthorizedException('请先登录');
    if (user.status === 'banned') throw new ForbiddenException('账号已被封禁');
    if (roles && !roles.includes(user.role)) throw new ForbiddenException('无权访问');
    return user;
  }

  private publicUser(user: User) {
    const { password, ...rest } = user;
    return rest;
  }

  private validateEmail(email: unknown): string {
    if (typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
      throw new BadRequestException('邮箱格式不正确');
    }
    return email.trim().toLowerCase();
  }

  private validatePassword(password: unknown): string {
    if (typeof password !== 'string' || password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
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
    if (this.users.some((u) => u.email === email)) throw new ConflictException('该邮箱已注册');

    let companyId: number | undefined;
    if (body.role === 'employer') {
      const companyName = String(body.companyName ?? '').trim() || `${name} 的公司`;
      const company: Company = {
        id: this.nextId.company++,
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
      this.companies.push(company);
      companyId = company.id;
    }

    const user: User = {
      id: this.nextId.user++,
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
    this.users.push(user);
    return { token: `token-${user.id}`, user: this.publicUser(user) };
  }

  login(body: Body) {
    const email = this.validateEmail(body.email);
    const user = this.users.find((u) => u.email === email && u.password === body.password);
    if (!user) throw new UnauthorizedException('邮箱或密码错误');
    if (user.status === 'banned') throw new ForbiddenException('账号已被封禁');
    return { token: `token-${user.id}`, user: this.publicUser(user) };
  }

  requestPasswordReset(body: Body) {
    this.validateEmail(body.email);
    return { message: '如果该邮箱已注册，我们已发送重置密码邮件' };
  }

  me(user: User) {
    return this.publicUser(user);
  }

  // ---------- jobs (public) ----------
  private isLive(job: Job) {
    return job.status === 'published' && new Date(job.expiresAt).getTime() > Date.now();
  }

  private jobView(job: Job) {
    const company = this.companies.find((c) => c.id === job.companyId);
    return {
      ...job,
      company: company && {
        id: company.id,
        name: company.name,
        logoUrl: company.logoUrl,
        verified: company.verified,
        location: company.location,
        industry: company.industry,
      },
    };
  }

  listJobs(query: JobQuery) {
    const page = Math.max(1, parseInt(query.page ?? '1', 10) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(query.pageSize ?? '10', 10) || 10));
    const keyword = query.keyword?.trim().toLowerCase();
    const salaryMin = Number(query.salaryMin) || 0;

    const scoreOf = (job: Job) => {
      if (!keyword) return 0;
      const companyName = this.companies.find((c) => c.id === job.companyId)?.name.toLowerCase() ?? '';
      let score = 0;
      if (job.title.toLowerCase().includes(keyword)) score += 5;
      if (job.skills.some((s) => s.toLowerCase().includes(keyword))) score += 3;
      if (companyName.includes(keyword)) score += 2;
      if (job.category.toLowerCase().includes(keyword)) score += 2;
      if (job.description.toLowerCase().includes(keyword)) score += 1;
      return score;
    };

    let list = this.jobs.filter((job) => this.isLive(job));
    if (keyword) list = list.filter((job) => scoreOf(job) > 0);
    if (query.category) list = list.filter((job) => job.category === query.category);
    if (query.skill) list = list.filter((job) => job.skills.some((s) => s.toLowerCase() === query.skill!.toLowerCase()));
    if (query.location) list = list.filter((job) => job.location.toLowerCase().includes(query.location!.toLowerCase()));
    if (salaryMin) list = list.filter((job) => job.salaryMax >= salaryMin);
    if (query.jobType) list = list.filter((job) => job.jobType === query.jobType);
    if (query.workMode) list = list.filter((job) => job.workMode === query.workMode);
    if (query.experience) list = list.filter((job) => job.experience === query.experience);

    const byLatest = (a: Job, b: Job) => +new Date(b.publishedAt) - +new Date(a.publishedAt);
    if (query.sort === 'salary') list.sort((a, b) => b.salaryMax - a.salaryMax || byLatest(a, b));
    else if (query.sort === 'relevance' && keyword) list.sort((a, b) => scoreOf(b) - scoreOf(a) || byLatest(a, b));
    else list.sort(byLatest);

    const total = list.length;
    const start = (page - 1) * pageSize;
    return { list: list.slice(start, start + pageSize).map((j) => this.jobView(j)), total, page, pageSize };
  }

  jobMeta() {
    const live = this.jobs.filter((j) => this.isLive(j));
    const unique = (values: string[]) => [...new Set(values)].sort();
    return {
      categories: CATEGORIES,
      skills: unique(live.flatMap((j) => j.skills)),
      locations: unique(live.map((j) => j.location)),
      jobTypes: JOB_TYPES,
      workModes: WORK_MODES,
      experiences: EXPERIENCES,
    };
  }

  getJob(id: number) {
    const job = this.jobs.find((j) => j.id === id);
    if (!job || !this.isLive(job)) throw new NotFoundException('岗位不存在或已下线');
    return this.jobView(job);
  }

  relatedJobs(id: number) {
    const job = this.getJob(id);
    const related = this.jobs
      .filter((j) => j.id !== id && this.isLive(j))
      .map((j) => ({
        j,
        score: (j.category === job.category ? 3 : 0) + j.skills.filter((s) => job.skills.includes(s)).length + (j.companyId === job.companyId ? 1 : 0),
      }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map((x) => this.jobView(x.j));
    return { list: related, total: related.length };
  }

  // ---------- candidate actions ----------
  apply(user: User, jobId: number, body: Body) {
    const job = this.jobs.find((j) => j.id === jobId);
    if (!job || !this.isLive(job)) throw new NotFoundException('岗位不存在或已下线');
    if (user.role !== 'candidate') throw new ForbiddenException('仅求职者可以投递岗位');
    if (this.applications.some((a) => a.jobId === jobId && a.userId === user.id)) {
      throw new ConflictException('你已投递过该岗位');
    }
    const resumeName = String(body.resumeName ?? user.resumeName ?? '').trim();
    if (!resumeName) throw new BadRequestException('请先上传简历再投递');

    const application: Application = {
      id: this.nextId.application++,
      jobId,
      userId: user.id,
      status: 'applied',
      appliedAt: new Date().toISOString(),
      resumeName,
      note: body.note ? String(body.note).slice(0, 500) : undefined,
    };
    this.applications.push(application);
    job.applicantCount += 1;
    this.notify(user.id, '投递成功', `你已成功投递「${job.title}」，可在个人中心查看进度。`);
    return { message: '投递成功', application };
  }

  addFavorite(user: User, jobId: number) {
    this.getJob(jobId);
    const set = this.favorites.get(user.id) ?? new Set<number>();
    set.add(jobId);
    this.favorites.set(user.id, set);
    return { favorited: true, jobId };
  }

  removeFavorite(user: User, jobId: number) {
    this.favorites.get(user.id)?.delete(jobId);
    return { favorited: false, jobId };
  }

  listFavorites(user: User) {
    const ids = this.favorites.get(user.id) ?? new Set<number>();
    const list = this.jobs.filter((j) => ids.has(j.id) && this.isLive(j)).map((j) => this.jobView(j));
    return { list, total: list.length, ids: [...ids] };
  }

  listApplications(user: User) {
    const list = this.applications
      .filter((a) => a.userId === user.id)
      .sort((a, b) => +new Date(b.appliedAt) - +new Date(a.appliedAt))
      .map((a) => ({ ...a, job: this.jobView(this.jobs.find((j) => j.id === a.jobId)!) }));
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
    if (Array.isArray(body.skills)) user.skills = body.skills.map((s: unknown) => String(s).trim()).filter(Boolean).slice(0, 20);
    if (body.resumeName !== undefined) {
      const resumeName = String(body.resumeName).trim();
      if (resumeName && !/\.(pdf|docx?)$/i.test(resumeName)) throw new BadRequestException('简历仅支持 PDF / DOC / DOCX');
      user.resumeName = resumeName || undefined;
    }
    return this.publicUser(user);
  }

  listNotifications(user: User) {
    const list = this.notifications
      .filter((n) => n.userId === user.id)
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    return { list, total: list.length, unread: list.filter((n) => !n.read).length };
  }

  markNotificationsRead(user: User) {
    this.notifications.filter((n) => n.userId === user.id).forEach((n) => (n.read = true));
    return { message: '已全部标记为已读' };
  }

  private notify(userId: number, title: string, body: string) {
    this.notifications.push({
      id: this.nextId.notification++,
      userId,
      title,
      body,
      read: false,
      createdAt: new Date().toISOString(),
    });
  }

  createReport(user: User, body: Body) {
    const jobId = Number(body.jobId);
    this.getJob(jobId);
    const reason = String(body.reason ?? '').trim();
    if (!reason) throw new BadRequestException('请填写举报原因');
    const report = {
      id: this.reports.length + 1,
      jobId,
      reason: reason.slice(0, 300),
      reporter: user.email,
      status: 'open' as const,
      createdAt: new Date().toISOString(),
    };
    this.reports.push(report);
    return { message: '举报已提交，我们会尽快处理', report };
  }

  // ---------- companies ----------
  listCompanies() {
    const list = this.companies
      .filter((c) => this.jobs.some((j) => j.companyId === c.id && this.isLive(j)) || c.verified)
      .map((c) => ({ ...c, openJobs: this.jobs.filter((j) => j.companyId === c.id && this.isLive(j)).length }));
    return { list, total: list.length };
  }

  getCompany(id: number) {
    const company = this.companies.find((c) => c.id === id);
    if (!company) throw new NotFoundException('公司不存在');
    return { ...company, openJobs: this.jobs.filter((j) => j.companyId === id && this.isLive(j)).length };
  }

  companyJobs(id: number) {
    this.getCompany(id);
    const list = this.jobs.filter((j) => j.companyId === id && this.isLive(j)).map((j) => this.jobView(j));
    return { list, total: list.length };
  }

  // ---------- employer ----------
  private employerCompanyId(user: User): number {
    if (!user.companyId) throw new BadRequestException('尚未绑定公司');
    return user.companyId;
  }

  private parseJobBody(body: Body, partial: boolean): Partial<Job> {
    const out: Partial<Job> = {};
    const requireText = (key: 'title' | 'description' | 'location', label: string) => {
      const value = body[key];
      if (value === undefined && partial) return;
      const text = String(value ?? '').trim();
      if (!text) throw new BadRequestException(`请填写${label}`);
      out[key] = text;
    };
    requireText('title', '岗位名称');
    requireText('description', '岗位简介');
    requireText('location', '工作地点');

    if (body.category !== undefined || !partial) {
      if (!CATEGORIES.includes(body.category)) throw new BadRequestException('行业分类不合法');
      out.category = body.category;
    }
    const pickEnum = <T extends string>(key: 'jobType' | 'workMode' | 'experience', allowed: T[], label: string) => {
      if (body[key] === undefined && partial) return;
      if (!allowed.includes(body[key])) throw new BadRequestException(`${label}不合法`);
      (out as any)[key] = body[key];
    };
    pickEnum('jobType', JOB_TYPES, '岗位类型');
    pickEnum('workMode', WORK_MODES, '工作方式');
    pickEnum('experience', EXPERIENCES, '经验要求');

    if (body.salaryMin !== undefined || body.salaryMax !== undefined || !partial) {
      const min = Number(body.salaryMin);
      const max = Number(body.salaryMax);
      if (!Number.isFinite(min) || !Number.isFinite(max) || min <= 0 || max < min) {
        throw new BadRequestException('薪资范围不合法');
      }
      out.salaryMin = min;
      out.salaryMax = max;
    }
    const list = (key: 'skills' | 'responsibilities' | 'requirements' | 'benefits') => {
      if (body[key] === undefined && partial) return;
      if (!Array.isArray(body[key])) throw new BadRequestException(`${key} 必须是数组`);
      out[key] = body[key].map((s: unknown) => String(s).trim()).filter(Boolean).slice(0, 20);
    };
    list('skills');
    list('responsibilities');
    list('requirements');
    list('benefits');
    return out;
  }

  employerJobs(user: User) {
    const companyId = this.employerCompanyId(user);
    const list = this.jobs
      .filter((j) => j.companyId === companyId)
      .sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt))
      .map((j) => this.jobView(j));
    return { list, total: list.length };
  }

  employerJob(user: User, id: number) {
    return this.jobView(this.ownedJob(user, id));
  }

  private ownedJob(user: User, id: number): Job {
    const job = this.jobs.find((j) => j.id === id);
    if (!job) throw new NotFoundException('岗位不存在');
    if (job.companyId !== this.employerCompanyId(user)) throw new ForbiddenException('无权操作该岗位');
    return job;
  }

  createJob(user: User, body: Body) {
    const companyId = this.employerCompanyId(user);
    const data = this.parseJobBody(body, false);
    const job: Job = {
      ...(data as Job),
      id: this.nextId.job++,
      companyId,
      status: 'pending',
      publishedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * DAY).toISOString(),
      applicantCount: 0,
    };
    this.jobs.push(job);
    return { message: '岗位已提交审核', job: this.jobView(job) };
  }

  updateJob(user: User, id: number, body: Body) {
    const job = this.ownedJob(user, id);
    Object.assign(job, this.parseJobBody(body, true));
    if (job.status === 'rejected') job.status = 'pending';
    return { message: '岗位已更新', job: this.jobView(job) };
  }

  offlineJob(user: User, id: number) {
    const job = this.ownedJob(user, id);
    job.status = 'offline';
    return { message: '岗位已下线', job: this.jobView(job) };
  }

  republishJob(user: User, id: number) {
    const job = this.ownedJob(user, id);
    job.status = 'pending';
    job.expiresAt = new Date(Date.now() + 30 * DAY).toISOString();
    return { message: '岗位已重新提交审核', job: this.jobView(job) };
  }

  employerApplications(user: User, query: { jobId?: string; status?: string; keyword?: string }) {
    const companyId = this.employerCompanyId(user);
    const keyword = query.keyword?.trim().toLowerCase();
    const list = this.applications
      .map((a) => ({ a, job: this.jobs.find((j) => j.id === a.jobId)!, candidate: this.users.find((u) => u.id === a.userId)! }))
      .filter(({ job }) => job.companyId === companyId)
      .filter(({ a }) => !query.jobId || a.jobId === Number(query.jobId))
      .filter(({ a }) => !query.status || a.status === query.status)
      .filter(
        ({ candidate }) =>
          !keyword ||
          candidate.name.toLowerCase().includes(keyword) ||
          candidate.skills.some((s) => s.toLowerCase().includes(keyword)),
      )
      .sort((x, y) => +new Date(y.a.appliedAt) - +new Date(x.a.appliedAt))
      .map(({ a, job, candidate }) => ({
        ...a,
        jobTitle: job.title,
        candidate: {
          id: candidate.id,
          name: candidate.name,
          email: candidate.email,
          avatar: candidate.avatar,
          headline: candidate.headline,
          location: candidate.location,
          skills: candidate.skills,
        },
      }));
    return { list, total: list.length };
  }

  updateApplicationStatus(user: User, id: number, body: Body) {
    const companyId = this.employerCompanyId(user);
    const application = this.applications.find((a) => a.id === id);
    const job = application && this.jobs.find((j) => j.id === application.jobId);
    if (!application || !job || job.companyId !== companyId) throw new NotFoundException('申请不存在');
    if (!APPLICATION_STATUSES.includes(body.status)) throw new BadRequestException('状态不合法');
    application.status = body.status;
    this.notify(application.userId, '投递状态更新', `你对「${job.title}」的申请状态更新为：${body.status}`);
    return { message: '状态已更新', application };
  }

  getEmployerCompany(user: User) {
    return this.getCompany(this.employerCompanyId(user));
  }

  updateEmployerCompany(user: User, body: Body) {
    const company = this.companies.find((c) => c.id === this.employerCompanyId(user))!;
    const text = (key: 'name' | 'description' | 'industry' | 'website' | 'location' | 'size' | 'culture') => {
      if (body[key] !== undefined) company[key] = String(body[key]).trim().slice(0, 1000);
    };
    (['name', 'description', 'industry', 'website', 'location', 'size', 'culture'] as const).forEach(text);
    if (!company.name) throw new BadRequestException('公司名称不能为空');
    if (Array.isArray(body.values)) company.values = body.values.map((v: unknown) => String(v).trim()).filter(Boolean).slice(0, 10);
    return this.getCompany(company.id);
  }

  // ---------- admin ----------
  adminStats() {
    const live = this.jobs.filter((j) => this.isLive(j)).length;
    return {
      users: this.users.length,
      candidates: this.users.filter((u) => u.role === 'candidate').length,
      employers: this.users.filter((u) => u.role === 'employer').length,
      companies: this.companies.length,
      jobsTotal: this.jobs.length,
      jobsLive: live,
      jobsPending: this.jobs.filter((j) => j.status === 'pending').length,
      applications: this.applications.length,
      reportsOpen: this.reports.filter((r) => r.status === 'open').length,
      usersPending: this.users.filter((u) => u.status === 'pending').length,
    };
  }

  adminPendingJobs() {
    const list = this.jobs.filter((j) => j.status === 'pending').map((j) => this.jobView(j));
    return { list, total: list.length };
  }

  reviewJob(id: number, body: Body) {
    const job = this.jobs.find((j) => j.id === id);
    if (!job) throw new NotFoundException('岗位不存在');
    if (body.decision !== 'approved' && body.decision !== 'rejected') throw new BadRequestException('decision 必须为 approved 或 rejected');
    job.status = body.decision === 'approved' ? 'published' : 'rejected';
    if (job.status === 'published') {
      job.publishedAt = new Date().toISOString();
      job.expiresAt = new Date(Date.now() + 30 * DAY).toISOString();
    }
    const owner = this.users.find((u) => u.companyId === job.companyId && u.role === 'employer');
    if (owner) this.notify(owner.id, '岗位审核结果', `岗位「${job.title}」${job.status === 'published' ? '已通过审核并上线' : '未通过审核'}。`);
    return { message: job.status === 'published' ? '已通过' : '已驳回', job: this.jobView(job) };
  }

  adminUsers() {
    const list = this.users.map((u) => ({
      ...this.publicUser(u),
      companyName: this.companies.find((c) => c.id === u.companyId)?.name,
    }));
    return { list, total: list.length };
  }

  reviewUser(id: number, body: Body) {
    const user = this.users.find((u) => u.id === id);
    if (!user) throw new NotFoundException('用户不存在');
    if (user.role === 'admin') throw new ForbiddenException('不能操作管理员账号');
    if (body.decision === 'approve') {
      user.status = 'active';
      const company = this.companies.find((c) => c.id === user.companyId);
      if (company) company.verified = true;
    } else if (body.decision === 'ban') {
      user.status = 'banned';
    } else if (body.decision === 'unban') {
      user.status = 'active';
    } else {
      throw new BadRequestException('decision 必须为 approve / ban / unban');
    }
    return { message: '操作成功', user: this.publicUser(user) };
  }

  adminReports() {
    const list = this.reports
      .map((r) => ({ ...r, jobTitle: this.jobs.find((j) => j.id === r.jobId)?.title ?? '已删除岗位' }))
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    return { list, total: list.length };
  }

  resolveReport(id: number, body: Body) {
    const report = this.reports.find((r) => r.id === id);
    if (!report) throw new NotFoundException('举报不存在');
    report.status = 'resolved';
    if (body.takeDown) {
      const job = this.jobs.find((j) => j.id === report.jobId);
      if (job) job.status = 'offline';
    }
    return { message: '举报已处理', report };
  }
}
