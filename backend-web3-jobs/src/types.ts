export type Role = 'candidate' | 'employer' | 'admin';
export type UserStatus = 'active' | 'pending' | 'banned';
export type JobStatus = 'pending' | 'published' | 'offline' | 'rejected';
export type JobType = 'full-time' | 'part-time' | 'contract' | 'internship';
export type WorkMode = 'remote' | 'onsite' | 'hybrid';
export type Experience = 'entry' | 'mid' | 'senior' | 'lead';
export type ApplicationStatus = 'applied' | 'viewed' | 'interviewing' | 'rejected' | 'accepted';

export interface User {
  id: number;
  email: string;
  password: string;
  name: string;
  role: Role;
  status: UserStatus;
  avatar: string;
  location: string;
  headline: string;
  skills: string[];
  resumeName?: string;
  companyId?: number;
  createdAt: string;
}

export interface Company {
  id: number;
  name: string;
  description: string;
  industry: string;
  website: string;
  logoUrl: string;
  verified: boolean;
  location: string;
  size: string;
  culture: string;
  values: string[];
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
}

export interface Application {
  id: number;
  jobId: number;
  userId: number;
  status: ApplicationStatus;
  appliedAt: string;
  resumeName: string;
  note?: string;
}

export interface Notification {
  id: number;
  userId: number;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export interface Report {
  id: number;
  jobId: number;
  reason: string;
  reporter: string;
  status: 'open' | 'resolved';
  createdAt: string;
}
