'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import JobCard from '@/components/JobCard';
import JobFilters from '@/components/JobFilters';
import { EmptyState, ErrorState, SkeletonCards } from '@/components/States';
import { Pagination } from '@/components/ui';
import { PAGE_SIZE, useJobs } from '@/hooks/queries';
import { useDebounce } from '@/hooks/useDebounce';
import type { JobFilters as Filters } from '@/types';

const FILTER_KEYS = [
	'category',
	'skill',
	'location',
	'salaryMin',
	'jobType',
	'workMode',
	'experience',
] as const;

export default function JobsExplorer() {
	const router = useRouter();
	const pathname = usePathname();
	const params = useSearchParams();

	const filters: Filters = useMemo(() => {
		const result: Filters = {};
		for (const key of ['keyword', 'sort', 'page', ...FILTER_KEYS] as const) {
			const value = params.get(key);
			if (value) result[key] = value;
		}
		return result;
	}, [params]);

	const [keyword, setKeyword] = useState(filters.keyword ?? '');
	const debouncedKeyword = useDebounce(keyword, 400);
	const [filtersOpen, setFiltersOpen] = useState(false);

	const update = (
		patch: Partial<Record<keyof Filters, string | undefined>>,
		keepPage = false
	) => {
		const next = new URLSearchParams(params.toString());
		Object.entries(patch).forEach(([key, value]) =>
			value ? next.set(key, value) : next.delete(key)
		);
		if (!keepPage) next.delete('page');
		const query = next.toString();
		router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
	};

	useEffect(() => {
		if ((filters.keyword ?? '') !== debouncedKeyword.trim())
			update({ keyword: debouncedKeyword.trim() || undefined });
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [debouncedKeyword]);

	useEffect(() => {
		setKeyword(filters.keyword ?? '');
	}, [filters.keyword]);

	const { data, isLoading, isError, isFetching, refetch } = useJobs(filters);
	const page = Number(filters.page) || 1;
	const activeCount = FILTER_KEYS.filter((key) => filters[key]).length;
	const hasAny = activeCount > 0 || Boolean(filters.keyword);

	const reset = () => {
		setKeyword('');
		router.replace(pathname, { scroll: false });
	};

	return (
		<div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
			<aside aria-label="筛选条件">
				<button
					type="button"
					className="btn-secondary mb-3 w-full lg:hidden"
					aria-expanded={filtersOpen}
					aria-controls="filters-panel"
					onClick={() => setFiltersOpen((v) => !v)}
				>
					筛选条件{activeCount ? `（已选 ${activeCount}）` : ''} {filtersOpen ? '▲' : '▼'}
				</button>
				<div id="filters-panel" className={filtersOpen ? 'block' : 'hidden lg:block'}>
					<JobFilters
						filters={filters}
						onChange={(key, value) => update({ [key]: value })}
						onReset={reset}
						canReset={hasAny}
					/>
				</div>
			</aside>

			<section aria-label="岗位列表" aria-busy={isFetching}>
				<form
					role="search"
					className="card mb-4 flex flex-col gap-3 p-3 sm:flex-row"
					onSubmit={(e) => {
						e.preventDefault();
						update({ keyword: keyword.trim() || undefined });
					}}
				>
					<label htmlFor="job-keyword" className="sr-only">
						关键词搜索
					</label>
					<input
						id="job-keyword"
						type="search"
						className="input flex-1"
						placeholder="搜索岗位名称、技能、公司…"
						value={keyword}
						onChange={(e) => setKeyword(e.target.value)}
					/>
					<label htmlFor="job-sort" className="sr-only">
						排序方式
					</label>
					<select
						id="job-sort"
						className="input sm:w-40"
						value={filters.sort ?? 'latest'}
						onChange={(e) =>
							update({
								sort: e.target.value === 'latest' ? undefined : e.target.value,
							})
						}
					>
						<option value="latest">最新发布</option>
						<option value="salary">薪资最高</option>
						<option value="relevance">相关度</option>
					</select>
				</form>

				<div
					className="mb-3 flex items-center justify-between text-sm text-slate-400"
					aria-live="polite"
				>
					<span>{data ? `共 ${data.total} 个岗位` : ' '}</span>
					{isFetching && !isLoading && <span>更新中…</span>}
				</div>

				{isLoading ? (
					<SkeletonCards count={4} />
				) : isError ? (
					<ErrorState message="岗位加载失败" onRetry={() => refetch()} />
				) : data && data.list.length === 0 ? (
					<EmptyState
						title="没有找到匹配的岗位"
						description="试试放宽筛选条件，或使用不同的关键词。"
						action={
							hasAny ? (
								<button type="button" className="btn-primary" onClick={reset}>
									重置筛选
								</button>
							) : undefined
						}
					/>
				) : (
					<>
						<div className="space-y-3">
							{data?.list.map((job) => (
								<JobCard key={job.id} job={job} />
							))}
						</div>
						<Pagination
							page={page}
							total={data?.total ?? 0}
							pageSize={PAGE_SIZE}
							onChange={(p) => {
								update({ page: p === 1 ? undefined : String(p) }, true);
								window.scrollTo({ top: 0, behavior: 'smooth' });
							}}
						/>
					</>
				)}
			</section>
		</div>
	);
}
