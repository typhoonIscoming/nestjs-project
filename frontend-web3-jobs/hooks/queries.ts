'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import type {
	AdminStats,
	AdminUser,
	Application,
	Company,
	EmployerApplication,
	Job,
	JobFilters,
	JobMeta,
	Listed,
	Notification,
	Paged,
	Report,
} from '@/types';

export const PAGE_SIZE = 8;

export function useAuth() {
	const token = useAuthStore((s) => s.token);
	const user = useAuthStore((s) => s.user);
	const hydrated = useAuthStore((s) => s.hydrated);
	return { token, user, hydrated, isLoggedIn: Boolean(token && user), role: user?.role };
}

export function useJobs(filters: JobFilters) {
	return useQuery({
		queryKey: ['jobs', filters],
		queryFn: async () =>
			(await api.get<Paged<Job>>('/jobs', { params: { ...filters, pageSize: PAGE_SIZE } }))
				.data,
		placeholderData: keepPreviousData,
	});
}

export function useJobMeta() {
	return useQuery({
		queryKey: ['job-meta'],
		queryFn: async () => (await api.get<JobMeta>('/jobs/meta')).data,
		staleTime: 5 * 60 * 1000,
	});
}

export function useFavorites() {
	const { role, hydrated } = useAuth();
	return useQuery({
		queryKey: ['favorites'],
		queryFn: async () =>
			(await api.get<Listed<Job> & { ids: number[] }>('/users/favorites')).data,
		enabled: hydrated && role === 'candidate',
	});
}

export function useApplications() {
	const { role, hydrated } = useAuth();
	return useQuery({
		queryKey: ['applications'],
		queryFn: async () => (await api.get<Listed<Application>>('/users/applications')).data,
		enabled: hydrated && role === 'candidate',
	});
}

export function useNotifications() {
	const { isLoggedIn, hydrated } = useAuth();
	return useQuery({
		queryKey: ['notifications'],
		queryFn: async () =>
			(await api.get<Listed<Notification> & { unread: number }>('/users/notifications')).data,
		enabled: hydrated && isLoggedIn,
		refetchInterval: 60_000,
	});
}

export function useEmployerJobs() {
	return useQuery({
		queryKey: ['employer', 'jobs'],
		queryFn: async () => (await api.get<Listed<Job>>('/employer/jobs')).data,
	});
}

export function useEmployerApplications(params: {
	jobId?: string;
	status?: string;
	keyword?: string;
}) {
	return useQuery({
		queryKey: ['employer', 'applications', params],
		queryFn: async () =>
			(await api.get<Listed<EmployerApplication>>('/employer/applications', { params })).data,
		placeholderData: keepPreviousData,
	});
}

export function useEmployerCompany() {
	return useQuery({
		queryKey: ['employer', 'company'],
		queryFn: async () => (await api.get<Company>('/employer/company')).data,
	});
}

export const useAdminStats = () =>
	useQuery({
		queryKey: ['admin', 'stats'],
		queryFn: async () => (await api.get<AdminStats>('/admin/stats')).data,
	});

export const useAdminPendingJobs = () =>
	useQuery({
		queryKey: ['admin', 'jobs'],
		queryFn: async () => (await api.get<Listed<Job>>('/admin/jobs/review')).data,
	});

export const useAdminUsers = () =>
	useQuery({
		queryKey: ['admin', 'users'],
		queryFn: async () => (await api.get<Listed<AdminUser>>('/admin/users')).data,
	});

export const useAdminReports = () =>
	useQuery({
		queryKey: ['admin', 'reports'],
		queryFn: async () => (await api.get<Listed<Report>>('/admin/reports')).data,
	});
