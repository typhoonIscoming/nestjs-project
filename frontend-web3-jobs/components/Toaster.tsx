'use client';

import { useToastStore } from '@/store/toast';
import { cx } from '@/lib/utils';

const styles = {
	success: 'border-emerald-500/50 bg-emerald-950 text-emerald-200',
	error: 'border-rose-500/50 bg-rose-950 text-rose-200',
	info: 'border-sky-500/50 bg-sky-950 text-sky-200',
} as const;

export default function Toaster() {
	const items = useToastStore((s) => s.items);
	const dismiss = useToastStore((s) => s.dismiss);

	return (
		<div
			className="pointer-events-none fixed inset-x-0 bottom-4 z-[90] flex flex-col items-center gap-2 px-4 sm:items-end sm:pr-6"
			aria-live="polite"
			role="status"
		>
			{items.map((item) => (
				<div
					key={item.id}
					className={cx(
						'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg',
						styles[item.kind]
					)}
				>
					<span className="flex-1">{item.message}</span>
					<button
						type="button"
						onClick={() => dismiss(item.id)}
						aria-label="关闭提示"
						className="text-current opacity-70 hover:opacity-100"
					>
						✕
					</button>
				</div>
			))}
		</div>
	);
}
