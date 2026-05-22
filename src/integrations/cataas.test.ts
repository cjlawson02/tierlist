import { describe, expect, it, vi } from 'vitest';
import { parseCataasCatUrl, pickCataasImages } from './cataas';

describe('cataas integration', () => {
	it('parses cat URLs from json responses', () => {
		expect(
			parseCataasCatUrl({
				id: 'abc123',
				url: 'https://cataas.com/cat/abc123?position=center',
			}),
		).toBe('/cataas-proxy/cat/abc123?position=center');
		expect(parseCataasCatUrl({ id: 'abc123' })).toBe(
			'/cataas-proxy/cat/abc123',
		);
	});

	it('loads the requested number of unique cat images', async () => {
		let call = 0;
		vi.stubGlobal(
			'fetch',
			vi.fn(() =>
				Promise.resolve({
					ok: true,
					json: () =>
						Promise.resolve({
							id: `cat-${String((call += 1))}`,
							url: `https://cataas.com/cat/cat-${String(call)}`,
						}),
				}),
			),
		);

		const images = await pickCataasImages(3);
		expect(images).toHaveLength(3);
		expect(new Set(images).size).toBe(3);
		expect(images.every((url) => url.startsWith('/cataas-proxy/cat/'))).toBe(
			true,
		);
	});
});
