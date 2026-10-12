'use client';

import { useState } from 'react';
import { toast } from '@/store/toast';

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export default function ShareButtons({
	path = '/',
	title = 'Web3 Career · 区块链与加密行业招聘平台',
	compact = false,
}: {
	path?: string;
	title?: string;
	compact?: boolean;
}) {
	const [busy, setBusy] = useState(false);
	const url = `${SITE}${path}`;

	const copy = async () => {
		try {
			await navigator.clipboard.writeText(url);
			toast.success('链接已复制');
		} catch {
			toast.error('复制失败，请手动复制地址栏链接');
		}
	};

	const nativeShare = async () => {
		if (!navigator.share) return copy();
		setBusy(true);
		try {
			await navigator.share({ title, url });
		} catch {
			/* user cancelled */
		} finally {
			setBusy(false);
		}
	};

	const enc = encodeURIComponent;
	return (
		<div className="flex flex-wrap items-center gap-2" role="group" aria-label="分享">
			{compact ? (
				<button
					type="button"
					className="btn-secondary"
					onClick={nativeShare}
					disabled={busy}
				>
					分享
				</button>
			) : (
				<>
					<a
						className="btn-secondary"
						href={`https://twitter.com/intent/tweet?url=${enc(url)}&text=${enc(title)}`}
						target="_blank"
						rel="noopener noreferrer"
					>
						分享到 X
					</a>
					<a
						className="btn-secondary"
						href={`https://t.me/share/url?url=${enc(url)}&text=${enc(title)}`}
						target="_blank"
						rel="noopener noreferrer"
					>
						Telegram
					</a>
					<button type="button" className="btn-secondary" onClick={copy}>
						复制链接
					</button>
				</>
			)}
		</div>
	);
}
