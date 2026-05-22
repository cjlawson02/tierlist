import { formatBytes } from './bundle';
import { MAX_IMAGE_BYTES } from './constants';
import { resolveTpaasAssetUrl } from './integrations/tpaas';

export function resolveImageFetchUrl(url: string): string {
	if (url.startsWith('data:') || url.startsWith('blob:')) {
		return url;
	}
	if (url.startsWith('/')) {
		return url;
	}
	try {
		const parsed = new URL(url, window.location.origin);
		if (
			import.meta.env.DEV &&
			parsed.hostname === 'assets.tpaas.chrislawson.dev'
		) {
			return resolveTpaasAssetUrl(url);
		}
		if (import.meta.env.DEV && parsed.hostname === 'cataas.com') {
			return `/cataas-proxy${parsed.pathname}${parsed.search}`;
		}
	} catch {
		return url;
	}
	return url;
}

export async function fetchUrlAsDataUrl(url: string): Promise<string> {
	if (url.startsWith('data:')) {
		return url;
	}
	const fetchUrl = resolveImageFetchUrl(url);
	const response = await fetch(fetchUrl);
	if (!response.ok) {
		throw new Error(`Failed to load image (${String(response.status)})`);
	}
	const blob = await response.blob();
	if (blob.size > MAX_IMAGE_BYTES) {
		throw new Error(
			`Image too large for export (${formatBytes(blob.size)}). Maximum size is ${formatBytes(MAX_IMAGE_BYTES)}.`,
		);
	}
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			resolve(reader.result as string);
		};
		reader.onerror = () => {
			reject(reader.error ?? new Error('Failed to read image'));
		};
		reader.readAsDataURL(blob);
	});
}

export async function inlineRemoteImages(
	root: HTMLElement,
): Promise<() => void> {
	const restores: (() => void)[] = [];
	const images = root.querySelectorAll('img');

	await Promise.all(
		[...images].map(async (img) => {
			const src = img.getAttribute('src');
			if (!src || src.startsWith('data:')) {
				return;
			}
			const original = src;
			const dataUrl = await fetchUrlAsDataUrl(src);
			img.removeAttribute('crossorigin');
			img.setAttribute('src', dataUrl);
			restores.push(() => {
				img.setAttribute('src', original);
			});
		}),
	);

	return () => {
		for (const restore of restores) {
			restore();
		}
	};
}

export async function waitForImages(root: HTMLElement): Promise<void> {
	const images = [...root.querySelectorAll('img')];
	await Promise.all(
		images.map(
			(img) =>
				new Promise<void>((resolve) => {
					if (img.complete && img.naturalWidth > 0) {
						resolve();
						return;
					}
					img.onload = () => {
						resolve();
					};
					img.onerror = () => {
						resolve();
					};
				}),
		),
	);
}
