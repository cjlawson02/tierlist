import { describe, expect, it } from 'vitest';
import {
	bundleToSerialized,
	confirmBundleSizeGate,
	downloadBundle,
	formatBytes,
	getSizeGateMessage,
	normalizeToBundle,
	readBundleFile,
	toBundle,
} from './bundle';
import { defaultTierColor } from './sanitize';
import {
	createBlobFile,
	createJsonFile,
	mb,
	mockConfirm,
	mockDownloadAnchor,
} from './test/helpers';
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

describe('getSizeGateMessage', () => {
	it('returns silent for small files', () => {
		expect(getSizeGateMessage(1024)).toBe('silent');
	});

	it('returns info at the info threshold', () => {
		expect(getSizeGateMessage(mb(5))).toBe('info');
	});

	it('returns confirm at the confirm threshold', () => {
		expect(getSizeGateMessage(mb(10))).toBe('confirm');
	});

	it('returns strong at the strong threshold', () => {
		expect(getSizeGateMessage(mb(25))).toBe('strong');
	});

	it('returns block at the block threshold', () => {
		expect(getSizeGateMessage(mb(50))).toBe('block');
	});
});

describe('confirmBundleSizeGate', () => {
	it('throws when import is blocked by size', () => {
		expect(() => {
			confirmBundleSizeGate(mb(50), 'import');
		}).toThrow('File is too large');
	});

	it('throws when user declines info gate', () => {
		mockConfirm(false);
		expect(() => {
			confirmBundleSizeGate(mb(5), 'import');
		}).toThrow('Import cancelled');
	});

	it('allows import when user confirms info gate', () => {
		mockConfirm(true);
		expect(() => {
			confirmBundleSizeGate(mb(5), 'import');
		}).not.toThrow();
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

describe('readBundleFile', () => {
	it('parses a valid JSON bundle file', async () => {
		mockConfirm(true);
		const file = createJsonFile(tierBundleV1());
		const bundle = await readBundleFile(file);
		expect(bundle.document.title).toBe('Test Tier List');
	});

	it('rejects invalid JSON', async () => {
		mockConfirm(true);
		const file = createBlobFile('not json', 'bad.json', 'application/json');
		await expect(readBundleFile(file)).rejects.toThrow(
			'Not a valid Tier List file.',
		);
	});

	it('blocks oversized files without prompting', async () => {
		const confirm = mockConfirm(true);
		const file = createJsonFile(tierBundleV1());
		Object.defineProperty(file, 'size', { value: mb(50) });

		await expect(readBundleFile(file)).rejects.toThrow('File is too large');
		expect(confirm).not.toHaveBeenCalled();
	});
});

describe('downloadBundle', () => {
	it('downloads via anchor fallback when File System Access API is unavailable', async () => {
		const { click } = mockDownloadAnchor();
		await downloadBundle(tierBundleV1(), 'my-list');

		expect(click).toHaveBeenCalled();
	});

	it('appends .tierlist.json when filename has no json extension', async () => {
		const { anchor } = mockDownloadAnchor();
		await downloadBundle(tierBundleV1(), 'my-list');

		expect(anchor.download).toBe('my-list.tierlist.json');
	});
});
