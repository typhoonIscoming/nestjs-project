'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { FormField } from '@/components/ui';
import { Spinner } from '@/components/States';
import { api, getErrorMessage } from '@/lib/api';
import { useAuth } from '@/hooks/queries';
import { useAuthStore } from '@/store/auth';
import { toast } from '@/store/toast';
import { cx, isEmail, passwordStrength, safeRedirect } from '@/lib/utils';
import type { Role, User } from '@/types';

const homeFor = (role: Role) =>
	role === 'employer' ? '/employer/jobs' : role === 'admin' ? '/admin' : '/jobs';

function AuthCard({
	title,
	subtitle,
	children,
}: {
	title: string;
	subtitle: string;
	children: React.ReactNode;
}) {
	return (
		<div className="container-page flex justify-center py-12">
			<div className="card w-full max-w-md p-6 sm:p-8">
				<h1 className="text-2xl font-extrabold text-white">{title}</h1>
				<p className="mb-6 mt-1 text-sm text-slate-400">{subtitle}</p>
				{children}
			</div>
		</div>
	);
}

function SubmitButton({ loading, children }: { loading: boolean; children: React.ReactNode }) {
	return (
		<button type="submit" className="btn-primary w-full py-2.5" disabled={loading}>
			{loading && <Spinner className="h-4 w-4" />}
			{loading ? '提交中…' : children}
		</button>
	);
}

const passwordError = (value: string) => {
	if (!value) return '请输入密码';
	if (value.length < 8) return '密码至少 8 位';
	if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) return '密码需同时包含字母和数字';
	return '';
};

function useAuthSuccess() {
	const router = useRouter();
	const search = useSearchParams();
	const queryClient = useQueryClient();
	return (token: string, user: User, message: string) => {
		queryClient.clear();
		useAuthStore.getState().setAuth(token, user);
		toast.success(message);
		router.replace(safeRedirect(search.get('redirect'), homeFor(user.role)));
	};
}

export function LoginForm() {
	const router = useRouter();
	const search = useSearchParams();
	const { isLoggedIn, hydrated, user } = useAuth();
	const onSuccess = useAuthSuccess();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [touched, setTouched] = useState({ email: false, password: false });
	const [loading, setLoading] = useState(false);
	const [serverError, setServerError] = useState('');

	useEffect(() => {
		if (hydrated && isLoggedIn && user)
			router.replace(safeRedirect(search.get('redirect'), homeFor(user.role)));
	}, [hydrated, isLoggedIn, user, router, search]);

	const errors = {
		email: !email ? '请输入邮箱' : !isEmail(email) ? '邮箱格式不正确' : '',
		password: password ? '' : '请输入密码',
	};

	const submit = async (e: React.FormEvent) => {
		e.preventDefault();
		setTouched({ email: true, password: true });
		setServerError('');
		if (errors.email || errors.password) return;
		setLoading(true);
		try {
			const { data } = await api.post<{ token: string; user: User }>('/auth/login', {
				email,
				password,
			});
			onSuccess(data.token, data.user, `欢迎回来，${data.user.name}`);
		} catch (err) {
			setServerError(getErrorMessage(err, '登录失败'));
		} finally {
			setLoading(false);
		}
	};

	const demos = [
		{ label: '求职者', email: 'candidate@demo.com' },
		{ label: '招聘方', email: 'employer@demo.com' },
		{ label: '管理员', email: 'admin@demo.com' },
	];

	return (
		<AuthCard title="登录" subtitle="登录后可投递岗位、收藏并管理申请">
			<form onSubmit={submit} noValidate className="space-y-4">
				{serverError && (
					<p
						className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-300"
						role="alert"
					>
						{serverError}
					</p>
				)}
				<FormField label="邮箱" required error={touched.email ? errors.email : undefined}>
					{(props) => (
						<input
							{...props}
							type="email"
							autoComplete="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							onBlur={() => setTouched((t) => ({ ...t, email: true }))}
							placeholder="you@example.com"
						/>
					)}
				</FormField>
				<FormField
					label="密码"
					required
					error={touched.password ? errors.password : undefined}
				>
					{(props) => (
						<input
							{...props}
							type="password"
							autoComplete="current-password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							onBlur={() => setTouched((t) => ({ ...t, password: true }))}
						/>
					)}
				</FormField>
				<div className="flex justify-end text-sm">
					<Link href="/forgot-password" className="text-emerald-300 hover:underline">
						忘记密码？
					</Link>
				</div>
				<SubmitButton loading={loading}>登录</SubmitButton>
			</form>

			<div className="mt-6 rounded-xl border border-slate-800 bg-ink-950/60 p-3 text-xs text-slate-400">
				<p className="mb-2 font-medium text-slate-300">演示账号（密码均为 Demo1234）</p>
				<div className="flex flex-wrap gap-2">
					{demos.map((d) => (
						<button
							key={d.email}
							type="button"
							className="chip hover:border-emerald-400 hover:text-emerald-300"
							onClick={() => {
								setEmail(d.email);
								setPassword('Demo1234');
								setServerError('');
							}}
						>
							{d.label}
						</button>
					))}
				</div>
			</div>
			<p className="mt-6 text-center text-sm text-slate-400">
				还没有账号？
				<Link href="/register" className="text-emerald-300 hover:underline">
					立即注册
				</Link>
			</p>
		</AuthCard>
	);
}

export function RegisterForm() {
	const router = useRouter();
	const search = useSearchParams();
	const { isLoggedIn, hydrated, user } = useAuth();
	const onSuccess = useAuthSuccess();
	const [role, setRole] = useState<'candidate' | 'employer'>(
		search.get('role') === 'employer' ? 'employer' : 'candidate'
	);
	const [form, setForm] = useState({
		name: '',
		companyName: '',
		email: '',
		password: '',
		confirm: '',
	});
	const [touched, setTouched] = useState<Record<string, boolean>>({});
	const [loading, setLoading] = useState(false);
	const [serverError, setServerError] = useState('');

	useEffect(() => {
		if (hydrated && isLoggedIn && user) router.replace(homeFor(user.role));
	}, [hydrated, isLoggedIn, user, router]);

	const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
		setForm((f) => ({ ...f, [key]: e.target.value }));
	const blur = (key: string) => () => setTouched((t) => ({ ...t, [key]: true }));
	const strength = passwordStrength(form.password);

	const errors = {
		name: form.name.trim() ? '' : '请填写姓名',
		companyName: role === 'employer' && !form.companyName.trim() ? '请填写公司名称' : '',
		email: !form.email ? '请输入邮箱' : !isEmail(form.email) ? '邮箱格式不正确' : '',
		password: passwordError(form.password),
		confirm: form.confirm !== form.password ? '两次输入的密码不一致' : '',
	};
	const show = (key: keyof typeof errors) => (touched[key] ? errors[key] : undefined);

	const submit = async (e: React.FormEvent) => {
		e.preventDefault();
		setTouched({ name: true, companyName: true, email: true, password: true, confirm: true });
		setServerError('');
		if (Object.values(errors).some(Boolean)) return;
		setLoading(true);
		try {
			const { data } = await api.post<{ token: string; user: User }>('/auth/register', {
				role,
				name: form.name.trim(),
				email: form.email,
				password: form.password,
				companyName: role === 'employer' ? form.companyName.trim() : undefined,
			});
			onSuccess(data.token, data.user, '注册成功，欢迎加入 Web3 Career');
		} catch (err) {
			setServerError(getErrorMessage(err, '注册失败'));
		} finally {
			setLoading(false);
		}
	};

	const roles = [
		{ value: 'candidate' as const, title: '我是求职者', desc: '搜索并投递岗位' },
		{ value: 'employer' as const, title: '我是招聘方', desc: '发布岗位并管理候选人' },
	];

	return (
		<AuthCard title="创建账号" subtitle="选择你的身份，开始 Web3 之旅">
			<form onSubmit={submit} noValidate className="space-y-4">
				{serverError && (
					<p
						className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-300"
						role="alert"
					>
						{serverError}
					</p>
				)}
				<fieldset>
					<legend className="mb-1.5 text-sm font-medium text-slate-200">角色</legend>
					<div className="grid grid-cols-2 gap-3">
						{roles.map((r) => (
							<label
								key={r.value}
								className={cx(
									'cursor-pointer rounded-xl border p-3 text-sm transition focus-within:ring-2 focus-within:ring-emerald-400',
									role === r.value
										? 'border-emerald-400 bg-emerald-400/10'
										: 'border-slate-700 hover:border-slate-500'
								)}
							>
								<input
									type="radio"
									name="role"
									value={r.value}
									checked={role === r.value}
									onChange={() => setRole(r.value)}
									className="sr-only"
								/>
								<span className="block font-semibold text-white">{r.title}</span>
								<span className="text-xs text-slate-400">{r.desc}</span>
							</label>
						))}
					</div>
				</fieldset>
				<FormField label="姓名" required error={show('name')}>
					{(props) => (
						<input
							{...props}
							autoComplete="name"
							value={form.name}
							onChange={set('name')}
							onBlur={blur('name')}
						/>
					)}
				</FormField>
				{role === 'employer' && (
					<FormField label="公司名称" required error={show('companyName')}>
						{(props) => (
							<input
								{...props}
								autoComplete="organization"
								value={form.companyName}
								onChange={set('companyName')}
								onBlur={blur('companyName')}
							/>
						)}
					</FormField>
				)}
				<FormField label="邮箱" required error={show('email')}>
					{(props) => (
						<input
							{...props}
							type="email"
							autoComplete="email"
							value={form.email}
							onChange={set('email')}
							onBlur={blur('email')}
						/>
					)}
				</FormField>
				<div>
					<FormField
						label="密码"
						required
						error={show('password')}
						hint="至少 8 位，需同时包含字母和数字"
					>
						{(props) => (
							<input
								{...props}
								type="password"
								autoComplete="new-password"
								value={form.password}
								onChange={set('password')}
								onBlur={blur('password')}
							/>
						)}
					</FormField>
					{form.password && (
						<div className="mt-2" aria-live="polite">
							<div className="flex gap-1" aria-hidden="true">
								{[1, 2, 3, 4].map((n) => (
									<span
										key={n}
										className={cx(
											'h-1.5 flex-1 rounded-full',
											strength.score >= n ? strength.color : 'bg-slate-700'
										)}
									/>
								))}
							</div>
							<p className="mt-1 text-xs text-slate-400">
								密码强度：{strength.label}
							</p>
						</div>
					)}
				</div>
				<FormField label="确认密码" required error={show('confirm')}>
					{(props) => (
						<input
							{...props}
							type="password"
							autoComplete="new-password"
							value={form.confirm}
							onChange={set('confirm')}
							onBlur={blur('confirm')}
						/>
					)}
				</FormField>
				<SubmitButton loading={loading}>注册</SubmitButton>
			</form>
			<p className="mt-6 text-center text-sm text-slate-400">
				已有账号？
				<Link href="/login" className="text-emerald-300 hover:underline">
					去登录
				</Link>
			</p>
		</AuthCard>
	);
}

export function ForgotPasswordForm() {
	const [email, setEmail] = useState('');
	const [touched, setTouched] = useState(false);
	const [loading, setLoading] = useState(false);
	const [done, setDone] = useState('');
	const [serverError, setServerError] = useState('');
	const error = !email ? '请输入邮箱' : !isEmail(email) ? '邮箱格式不正确' : '';

	const submit = async (e: React.FormEvent) => {
		e.preventDefault();
		setTouched(true);
		setServerError('');
		if (error) return;
		setLoading(true);
		try {
			const { data } = await api.post<{ message: string }>('/auth/password-reset', { email });
			setDone(data.message);
		} catch (err) {
			setServerError(getErrorMessage(err));
		} finally {
			setLoading(false);
		}
	};

	return (
		<AuthCard title="重置密码" subtitle="输入注册邮箱，我们会发送重置链接">
			{done ? (
				<div className="space-y-4 text-center" role="status">
					<div className="text-4xl" aria-hidden="true">
						📬
					</div>
					<p className="text-slate-200">{done}</p>
					<Link href="/login" className="btn-secondary w-full">
						返回登录
					</Link>
				</div>
			) : (
				<form onSubmit={submit} noValidate className="space-y-4">
					{serverError && (
						<p
							className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-300"
							role="alert"
						>
							{serverError}
						</p>
					)}
					<FormField label="邮箱" required error={touched ? error : undefined}>
						{(props) => (
							<input
								{...props}
								type="email"
								autoComplete="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								onBlur={() => setTouched(true)}
							/>
						)}
					</FormField>
					<SubmitButton loading={loading}>发送重置邮件</SubmitButton>
					<p className="text-center text-sm">
						<Link href="/login" className="text-emerald-300 hover:underline">
							返回登录
						</Link>
					</p>
				</form>
			)}
		</AuthCard>
	);
}
