'use client';

export default function GlobalError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<div className="container-page py-20 text-center" role="alert">
			<div className="text-5xl" aria-hidden="true">
				⚠️
			</div>
			<h1 className="mt-4 text-2xl font-extrabold text-white">页面加载失败</h1>
			<p className="mx-auto mt-2 max-w-md text-slate-400">
				{error.message || '服务暂时不可用'}。请确认后端服务已启动（默认
				http://localhost:3001），然后重试。
			</p>
			<button type="button" className="btn-primary mt-6" onClick={reset}>
				重试
			</button>
		</div>
	);
}
