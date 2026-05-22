export const CATAAS_BASE_URL = '/cataas-proxy';

interface CataasCatResponse {
	id?: string;
	url?: string;
}

export function parseCataasCatUrl(data: CataasCatResponse): string | null {
	if (typeof data.url === 'string' && data.url.length > 0) {
		return data.url.replace('https://cataas.com', CATAAS_BASE_URL);
	}
	if (typeof data.id === 'string' && data.id.length > 0) {
		return `${CATAAS_BASE_URL}/cat/${data.id}`;
	}
	return null;
}

async function fetchRandomCatUrl(): Promise<string> {
	const response = await fetch(`${CATAAS_BASE_URL}/cat?json=true`, {
		headers: { Accept: 'application/json' },
	});
	if (!response.ok) {
		throw new Error(`CATaaS unavailable (${String(response.status)})`);
	}
	const data = (await response.json()) as CataasCatResponse;
	const url = parseCataasCatUrl(data);
	if (!url) {
		throw new Error('CATaaS returned an invalid cat response');
	}
	return url;
}

export async function pickCataasImages(count: number): Promise<string[]> {
	const urls: string[] = [];
	const seen = new Set<string>();

	for (let attempt = 0; urls.length < count && attempt < 8; attempt += 1) {
		const need = count - urls.length;
		const fetched = await Promise.all(
			Array.from({ length: need + 2 }, () => fetchRandomCatUrl()),
		);
		for (const url of fetched) {
			if (seen.has(url)) {
				continue;
			}
			seen.add(url);
			urls.push(url);
			if (urls.length >= count) {
				break;
			}
		}
	}

	if (urls.length < count) {
		throw new Error(
			`Could only load ${String(urls.length)} unique cats from CATaaS`,
		);
	}

	return urls.slice(0, count);
}
