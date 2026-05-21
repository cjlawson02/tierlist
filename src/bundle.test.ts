import { describe, expect, it } from 'vitest';
import {
	bundleToSerialized,
	formatBytes,
	normalizeToBundle,
	toBundle,
} from './bundle';
import { defaultTierColor } from './sanitize';
import { mb } from './test/helpers';
import {
	DATA_IMAGE_PNG,
	emptyTierListState,
	legacyTierList,
	tierBundleV1,
} from './test/fixtures';

describe('formatBytes', () => {
	it('formats bytes', () => {
		expect(formatBytes(512)).toBe('512 B');
	});

	it('formats kilobytes', () => {
		expect(formatBytes(1536)).toBe('1.5 KB');
	});

	it('formats megabytes', () => {
		expect(formatBytes(mb(2))).toBe('2.0 MB');
	});
});

describe('normalizeToBundle', () => {
	it('accepts valid tier-bundle documents', () => {
		const bundle = normalizeToBundle(tierBundleV1());
		expect(bundle.format).toBe('tier-bundle');
		expect(bundle.document.rows[0]?.images[0]).toBe(DATA_IMAGE_PNG);
	});

	it('rejects malformed tier-bundle documents', () => {
		expect(() =>
			normalizeToBundle({
				format: 'tier-bundle',
				version: 1,
				document: {
					title: 'Test',
					vertical: false,
					rows: [{ name: 'S', color: '#fff' }],
				},
			}),
		).toThrow('Not a valid Tier List file.');
	});

	it('rejects newer bundle versions', () => {
		expect(() =>
			normalizeToBundle({
				...tierBundleV1(),
				version: 2,
			}),
		).toThrow('newer version of the app');
	});

	it('normalizes legacy tier lists', () => {
		const bundle = normalizeToBundle(legacyTierList());
		expect(bundle.document.title).toBe('Test Tier List');
		expect(bundle.document.rows[0]?.images).toEqual([DATA_IMAGE_PNG]);
	});

	it('rejects remote image URLs in legacy imports', () => {
		expect(() =>
			normalizeToBundle(
				legacyTierList({
					rows: [
						{
							name: 'S',
							color: defaultTierColor(0),
							imgs: ['https://evil.example/a.png'],
						},
					],
				}),
			),
		).toThrow('Only embedded data:image URLs are supported.');
	});
});

describe('toBundle / bundleToSerialized', () => {
	it('round-trips state through bundle serialization', () => {
		const state = emptyTierListState();
		const bundle = toBundle(state);
		const serialized = bundleToSerialized(bundle);

		expect(bundle.meta?.imageCount).toBe(1);
		expect(bundle.meta?.approxBytes).toBeGreaterThan(0);
		expect(serialized.title).toBe(state.title);
		expect(serialized.rows[0]?.imgs).toEqual([]);
		expect(serialized.untiered).toEqual([DATA_IMAGE_PNG]);
	});
});
