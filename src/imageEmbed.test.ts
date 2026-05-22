import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	fetchUrlAsDataUrl,
	inlineRemoteImages,
	resolveImageFetchUrl,
} from './imageEmbed';

describe('imageEmbed', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('rewrites tpaas asset URLs through the dev proxy', () => {
		expect(
			resolveImageFetchUrl(
				'https://assets.tpaas.chrislawson.dev/approved/aaaa-bbbb.jpg',
			),
		).toBe('/tpaas-assets-proxy/approved/aaaa-bbbb.jpg');
	});

	it('inlines remote images before export', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(() =>
				Promise.resolve({
					ok: true,
					blob: () =>
						Promise.resolve(new Blob(['img'], { type: 'image/png' })),
				}),
			),
		);
		const readAsDataURL = vi.fn(function (this: FileReader) {
			Object.defineProperty(this, 'result', {
				value: 'data:image/png;base64,aW1n',
			});
			this.onload?.({} as ProgressEvent<FileReader>);
		});
		vi.stubGlobal(
			'FileReader',
			class {
				onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => void) | null =
					null;
				onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => void) | null =
					null;
				readAsDataURL = readAsDataURL;
			},
		);

		const root = document.createElement('div');
		root.innerHTML =
			'<img src="https://assets.tpaas.chrislawson.dev/approved/aaaa-bbbb.jpg" />';
		const img = root.querySelector('img');
		expect(img).not.toBeNull();

		const restore = await inlineRemoteImages(root);
		expect(img?.getAttribute('src')).toBe('data:image/png;base64,aW1n');

		restore();
		expect(img?.getAttribute('src')).toBe(
			'https://assets.tpaas.chrislawson.dev/approved/aaaa-bbbb.jpg',
		);
	});

	it('returns data URLs unchanged', async () => {
		const dataUrl = 'data:image/png;base64,abc';
		await expect(fetchUrlAsDataUrl(dataUrl)).resolves.toBe(dataUrl);
	});
});
