import { describe, expect, it, vi } from 'vitest';
import {
	parseGalleryAssetUrls,
	pickTpaasImages,
	resolveTpaasAssetUrl,
} from './tpaas';

describe('tpaas integration', () => {
	it('parses unique asset URLs from gallery HTML', () => {
		const html = `
			<img src="https://assets.tpaas.chrislawson.dev/approved/aaaa-bbbb.jpg">
			<img src="https://assets.tpaas.chrislawson.dev/approved/cccc-dddd.png">
			<img src="https://assets.tpaas.chrislawson.dev/approved/aaaa-bbbb.jpg">
		`;
		expect(parseGalleryAssetUrls(html)).toEqual([
			'https://assets.tpaas.chrislawson.dev/approved/aaaa-bbbb.jpg',
			'https://assets.tpaas.chrislawson.dev/approved/cccc-dddd.png',
		]);
	});

	it('picks the requested number of unique trolley problems', async () => {
		const urls = Array.from(
			{ length: 8 },
			(_, index) =>
				`https://assets.tpaas.chrislawson.dev/approved/cat-${String(index)}.jpg`,
		);
		vi.stubGlobal(
			'fetch',
			vi.fn(() =>
				Promise.resolve({
					ok: true,
					json: () =>
						Promise.resolve({
							entries: urls.map((url) => ({ url })),
						}),
				}),
			),
		);

		const images = await pickTpaasImages(5);
		expect(images).toHaveLength(5);
		expect(new Set(images).size).toBe(5);
	});

	it('rewrites asset URLs through the proxy', () => {
		expect(
			resolveTpaasAssetUrl(
				'https://assets.tpaas.chrislawson.dev/approved/aaaa-bbbb.jpg',
			),
		).toBe('/tpaas-assets-proxy/approved/aaaa-bbbb.jpg');
	});
});
