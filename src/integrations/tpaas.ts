import { INSPIRATION_DEMO } from './inspiration';

export const TPAAS_BASE_URL = import.meta.env.DEV
	? '/tpaas-proxy'
	: 'https://tpaas.chrislawson.dev';
export const TPAAS_CATALOG_URL = `${TPAAS_BASE_URL}/catalog.json`;
export const TPAAS_DEMO_TITLE = 'Trolley Problem Tier List';

export const TPAAS_DEMO = INSPIRATION_DEMO;

const ASSET_URL_PATTERN =
	/https:\/\/assets\.tpaas\.chrislawson\.dev\/approved\/[0-9a-f-]+\.(?:jpg|png)/gi;

export function parseGalleryAssetUrls(html: string): string[] {
	const matches = html.match(ASSET_URL_PATTERN) ?? [];
	return [...new Set(matches.map((url) => url.toLowerCase()))];
}

function shuffle<T>(items: T[]): T[] {
	const next = [...items];
	for (let i = next.length - 1; i > 0; i -= 1) {
		const j = Math.floor(Math.random() * (i + 1));
		const left = next[i];
		const right = next[j];
		if (left === undefined || right === undefined) {
			continue;
		}
		next[i] = right;
		next[j] = left;
	}
	return next;
}

async function fetchCatalogUrls(): Promise<string[]> {
	const response = await fetch(TPAAS_CATALOG_URL, {
		headers: { Accept: 'application/json' },
	});
	if (!response.ok) {
		throw new Error(`TPaaS catalog unavailable (${String(response.status)})`);
	}
	const data = (await response.json()) as { entries?: { url?: string }[] };
	const urls = (data.entries ?? [])
		.map((entry) => entry.url)
		.filter((url): url is string => typeof url === 'string' && url.length > 0);
	if (urls.length === 0) {
		throw new Error('TPaaS catalog is empty');
	}
	return urls;
}

async function fetchGalleryUrls(): Promise<string[]> {
	const response = await fetch(`${TPAAS_BASE_URL}/gallery`, {
		headers: { Accept: 'text/html' },
	});
	if (!response.ok) {
		throw new Error(`TPaaS gallery unavailable (${String(response.status)})`);
	}
	const urls = parseGalleryAssetUrls(await response.text());
	if (urls.length === 0) {
		throw new Error('TPaaS gallery has no approved trolley problems yet');
	}
	return urls;
}

export async function fetchTpaasCatalog(): Promise<string[]> {
	try {
		return await fetchCatalogUrls();
	} catch {
		return fetchGalleryUrls();
	}
}

export function resolveTpaasAssetUrl(url: string): string {
	if (!import.meta.env.DEV) {
		return url;
	}
	return url.replace(
		'https://assets.tpaas.chrislawson.dev',
		'/tpaas-assets-proxy',
	);
}

export async function pickTpaasImages(count: number): Promise<string[]> {
	const catalog = await fetchTpaasCatalog();
	if (catalog.length < count) {
		throw new Error(
			`TPaaS only has ${String(catalog.length)} approved trolley problems`,
		);
	}
	return shuffle(catalog).slice(0, count).map(resolveTpaasAssetUrl);
}
