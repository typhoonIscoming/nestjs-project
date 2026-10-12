const SERVER_API_BASE =
	process.env.API_BASE_SERVER ?? process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:3001/api';

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

/** Server-side GET. Returns null on 404; throws on other failures so error.tsx can offer a retry. */
export async function serverGet<T>(path: string): Promise<T | null> {
	const response = await fetch(`${SERVER_API_BASE}${path}`, { cache: 'no-store' });
	if (response.status === 404) return null;
	if (!response.ok) throw new Error(`接口请求失败（${response.status}）`);
	return (await response.json()) as T;
}

/** Same as serverGet but swallows errors, for optional page sections. */
export async function serverGetSafe<T>(path: string): Promise<T | null> {
	try {
		return await serverGet<T>(path);
	} catch {
		return null;
	}
}
