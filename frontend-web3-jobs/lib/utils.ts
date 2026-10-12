import type { ApplicationStatus, Experience, JobStatus, JobType, WorkMode } from '@/types';

export const jobTypeLabel: Record<JobType, string> = {
	'full-time': '全职',
	'part-time': '兼职',
	contract: '合同制',
	internship: '实习',
};

export const workModeLabel: Record<WorkMode, string> = {
	remote: '远程',
	onsite: '驻场',
	hybrid: '混合办公',
};

export const experienceLabel: Record<Experience, string> = {
	entry: '初级 / 应届',
	mid: '中级 (2-5 年)',
	senior: '高级 (5 年+)',
	lead: '专家 / 负责人',
};

export const applicationStatusLabel: Record<ApplicationStatus, string> = {
	applied: '已投递',
	viewed: '已查看',
	interviewing: '面试中',
	rejected: '未通过',
	accepted: '已录用',
};

export const jobStatusLabel: Record<JobStatus, string> = {
	pending: '审核中',
	published: '已上线',
	offline: '已下线',
	rejected: '未通过',
};

const k = (value: number) => (value >= 1000 ? `${Math.round(value / 100) / 10}k` : String(value));

export const formatSalary = (min: number, max: number) => `$${k(min)} - $${k(max)} / 年`;

export function timeAgo(iso: string): string {
	const diff = Date.now() - new Date(iso).getTime();
	const minutes = Math.floor(diff / 60000);
	if (minutes < 1) return '刚刚';
	if (minutes < 60) return `${minutes} 分钟前`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours} 小时前`;
	const days = Math.floor(hours / 24);
	if (days < 30) return `${days} 天前`;
	return new Date(iso).toLocaleDateString('zh-CN');
}

export const formatDate = (iso: string) => new Date(iso).toLocaleDateString('zh-CN');

export function daysLeft(iso: string): number {
	return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000));
}

export const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export function passwordStrength(password: string): {
	score: number;
	label: string;
	color: string;
} {
	let score = 0;
	if (password.length >= 8) score++;
	if (/[A-Za-z]/.test(password) && /\d/.test(password)) score++;
	if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
	if (/[^A-Za-z0-9]/.test(password) || password.length >= 12) score++;
	const labels = ['太弱', '较弱', '一般', '较强', '很强'];
	const colors = [
		'bg-rose-500',
		'bg-rose-500',
		'bg-amber-500',
		'bg-emerald-500',
		'bg-emerald-400',
	];
	const index = password ? Math.max(1, score) : 0;
	return {
		score: password ? score : 0,
		label: password ? labels[index] : '',
		color: colors[index],
	};
}

export const splitList = (value: string) =>
	value
		.split(/[\n,，]/)
		.map((item) => item.trim())
		.filter(Boolean);

export const safeRedirect = (value: string | null | undefined, fallback = '/') =>
	value && value.startsWith('/') && !value.startsWith('//') ? value : fallback;

export const cx = (...classes: Array<string | false | null | undefined>) =>
	classes.filter(Boolean).join(' ');
