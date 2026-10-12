export type Role = 'candidate' | 'employer' | 'admin';
export type JobStatus = 'pending' | 'published' | 'offline' | 'rejected';
export type JobType = 'full-time' | 'part-time' | 'contract' | 'internship';
export type WorkMode = 'remote' | 'onsite' | 'hybrid';
export type Experience = 'entry' | 'mid' | 'senior' | 'lead';
export type ApplicationStatus = 'applied' | 'viewed' | 'interviewing' | 'rejected' | 'accepted';

export interface User {
	id: number;
	email: string;
	name: string;
	role: Role;
	status: 'active' | 'pending' | 'banned';
	avatar: string;
	location: string;
	headline: string;
	skills: string[];
	resumeName?: string;
	companyId?: number;
	createdAt: string;
}

export interface CompanyBrief {
	id: number;
	name: string;
	logoUrl: string;
	verified: boolean;
	location: string;
	industry: string;
}

export interface Company extends CompanyBrief {
	description: string;
	website: string;
	size: string;
	culture: string;
	values: string[];
	openJobs: number;
}

export interface Job {
	id: number;
	companyId: number;
	title: string;
	category: string;
	skills: string[];
	location: string;
	salaryMin: number;
	salaryMax: number;
	jobType: JobType;
	workMode: WorkMode;
	experience: Experience;
	description: string;
	responsibilities: string[];
	requirements: string[];
	benefits: string[];
	status: JobStatus;
	publishedAt: string;
	expiresAt: string;
	applicantCount: number;
	company?: CompanyBrief;
}

export interface Paged<T> {
	list: T[];
	total: number;
	page: number;
	pageSize: number;
}

export interface Listed<T> {
	list: T[];
	total: number;
}

export interface Application {
	id: number;
	jobId: number;
	userId: number;
	status: ApplicationStatus;
	appliedAt: string;
	resumeName: string;
	note?: string;
	job: Job;
}

export interface EmployerApplication extends Omit<Application, 'job'> {
	jobTitle: string;
	candidate: Pick<User, 'id' | 'name' | 'email' | 'avatar' | 'headline' | 'location' | 'skills'>;
}

export interface Notification {
	id: number;
	title: string;
	body: string;
	read: boolean;
	createdAt: string;
}

export interface JobMeta {
	categories: string[];
	skills: string[];
	locations: string[];
	jobTypes: JobType[];
	workModes: WorkMode[];
	experiences: Experience[];
}

export interface JobFilters {
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
}

export interface AdminStats {
	users: number;
	candidates: number;
	employers: number;
	companies: number;
	jobsTotal: number;
	jobsLive: number;
	jobsPending: number;
	applications: number;
	reportsOpen: number;
	usersPending: number;
}

export interface AdminUser extends User {
	companyName?: string;
}

export interface Report {
	id: number;
	jobId: number;
	jobTitle: string;
	reason: string;
	reporter: string;
	status: 'open' | 'resolved';
	createdAt: string;
}

export interface JobFormValues {
	title: string;
	category: string;
	location: string;
	salaryMin: number | '';
	salaryMax: number | '';
	jobType: JobType;
	workMode: WorkMode;
	experience: Experience;
	description: string;
	skills: string[];
	responsibilities: string[];
	requirements: string[];
	benefits: string[];
}
