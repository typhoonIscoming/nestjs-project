'use client';

import { cx } from '@/lib/utils';

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cx('inline-block h-5 w-5 animate-spin rounded-full border-2 border-slate-600 border-t-emerald-400', className)}
      aria-hidden="true"
    />
  );
}

export function LoadingState({ label = '加载中…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-slate-400" role="status" aria-live="polite">
      <Spinner />
      <span>{label}</span>
    </div>
  );
}

export function SkeletonCards({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3" role="status" aria-label="加载中">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card animate-pulse p-5">
          <div className="flex gap-4">
            <div className="h-12 w-12 rounded-xl bg-ink-700" />
            <div className="flex-1 space-y-3">
              <div className="h-4 w-1/3 rounded bg-ink-700" />
              <div className="h-3 w-1/2 rounded bg-ink-800" />
              <div className="h-3 w-2/3 rounded bg-ink-800" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
      <div className="text-4xl" aria-hidden="true">
        🔍
      </div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      {description && <p className="max-w-md text-sm text-slate-400">{description}</p>}
      {action}
    </div>
  );
}

export function ErrorState({
  message = '数据加载失败',
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="card flex flex-col items-center gap-3 border-rose-500/30 px-6 py-12 text-center" role="alert">
      <div className="text-4xl" aria-hidden="true">
        ⚠️
      </div>
      <h3 className="text-lg font-semibold text-white">{message}</h3>
      <p className="text-sm text-slate-400">请检查网络或稍后重试。</p>
      {onRetry && (
        <button type="button" className="btn-secondary" onClick={onRetry}>
          重新加载
        </button>
      )}
    </div>
  );
}
