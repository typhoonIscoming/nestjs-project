'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { cx } from '@/lib/utils';

export function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const titleId = useId();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    ref.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      previous?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4" onMouseDown={onClose}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onMouseDown={(e) => e.stopPropagation()}
        className="card max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-b-none p-6 sm:rounded-b-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id={titleId} className="text-lg font-bold text-white">
            {title}
          </h2>
          <button type="button" className="btn-ghost px-2 py-1" onClick={onClose} aria-label="关闭">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function FormField({
  label,
  error,
  hint,
  required,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: (props: { id: string; 'aria-invalid': boolean; 'aria-describedby'?: string; className: string }) => React.ReactNode;
}) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-200">
        {label}
        {required && <span className="ml-0.5 text-rose-400">*</span>}
      </label>
      {children({ id, 'aria-invalid': Boolean(error), 'aria-describedby': describedBy, className: cx('input', error && 'input-error') })}
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-xs text-rose-400" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1 text-xs text-slate-400">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function VerifiedBadge({ verified }: { verified: boolean }) {
  return verified ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/10 px-2 py-0.5 text-xs font-medium text-emerald-300">
      ✓ 已认证
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-slate-700/40 px-2 py-0.5 text-xs text-slate-400">未认证</span>
  );
}

const tones = {
  green: 'bg-emerald-400/10 text-emerald-300',
  blue: 'bg-sky-400/10 text-sky-300',
  purple: 'bg-violet-400/10 text-violet-300',
  amber: 'bg-amber-400/10 text-amber-300',
  red: 'bg-rose-400/10 text-rose-300',
  gray: 'bg-slate-700/40 text-slate-300',
} as const;

export function Badge({ tone = 'gray', children }: { tone?: keyof typeof tones; children: React.ReactNode }) {
  return <span className={cx('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', tones[tone])}>{children}</span>;
}

export function CollapsibleSection({
  id,
  title,
  children,
  defaultOpen = true,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section id={id} className="card scroll-mt-24 p-5 sm:p-6">
      <h2>
        <button
          type="button"
          className="flex w-full items-center justify-between text-left text-lg font-bold text-white"
          aria-expanded={open}
          aria-controls={`${id}-panel`}
          onClick={() => setOpen((v) => !v)}
        >
          {title}
          <span className="text-sm font-normal text-slate-400">{open ? '收起 ▲' : '展开 ▼'}</span>
        </button>
      </h2>
      <div id={`${id}-panel`} hidden={!open} className="mt-4 text-sm leading-7 text-slate-300">
        {children}
      </div>
    </section>
  );
}

export function BulletList({ items }: { items: string[] }) {
  if (!items.length) return <p className="text-slate-400">暂无内容</p>;
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  label,
}: {
  tabs: Array<{ key: T; label: string; badge?: number }>;
  value: T;
  onChange: (key: T) => void;
  label: string;
}) {
  return (
    <div role="tablist" aria-label={label} className="flex gap-1 overflow-x-auto border-b border-slate-800">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          role="tab"
          aria-selected={value === tab.key}
          onClick={() => onChange(tab.key)}
          className={cx(
            '-mb-px flex shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition',
            value === tab.key ? 'border-emerald-400 text-white' : 'border-transparent text-slate-400 hover:text-white',
          )}
        >
          {tab.label}
          {tab.badge ? <span className="rounded-full bg-emerald-400 px-1.5 text-xs font-semibold text-slate-950">{tab.badge}</span> : null}
        </button>
      ))}
    </div>
  );
}

export function NavTabs({ tabs, pathname }: { tabs: Array<{ href: string; label: string }>; pathname: string }) {
  return (
    <nav aria-label="子导航" className="flex gap-1 overflow-x-auto border-b border-slate-800">
      {tabs.map((tab) => {
        const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? 'page' : undefined}
            className={cx(
              '-mb-px shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium transition',
              active ? 'border-emerald-400 text-white' : 'border-transparent text-slate-400 hover:text-white',
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function Pagination({
  page,
  total,
  pageSize,
  onChange,
}: {
  page: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  const numbers = Array.from({ length: pages }, (_, i) => i + 1).filter((n) => n === 1 || n === pages || Math.abs(n - page) <= 1);
  return (
    <nav aria-label="分页" className="mt-6 flex flex-wrap items-center justify-center gap-2">
      <button type="button" className="btn-secondary" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        上一页
      </button>
      {numbers.map((n, i) => (
        <span key={n} className="flex items-center gap-2">
          {i > 0 && n - numbers[i - 1] > 1 && <span className="text-slate-500">…</span>}
          <button
            type="button"
            onClick={() => onChange(n)}
            aria-current={n === page ? 'page' : undefined}
            className={cx('btn min-w-9 px-3', n === page ? 'bg-emerald-400 text-slate-950' : 'border border-slate-700 bg-ink-800 text-slate-200 hover:bg-ink-700')}
          >
            {n}
          </button>
        </span>
      ))}
      <button type="button" className="btn-secondary" disabled={page >= pages} onClick={() => onChange(page + 1)}>
        下一页
      </button>
    </nav>
  );
}
