import { afterEach, describe, expect, it, vi } from 'vitest';
import { mockDownloadAnchor } from './test/helpers';
import { sanitizeExportFilename, saveTierListImage } from './exportImage';

const mocks = vi.hoisted(() => ({
	toBlob: vi.fn<typeof import('html-to-image').toBlob>(),
	inlineRemoteImages: vi.fn<
		typeof import('./imageEmbed').inlineRemoteImages
	>(),
	waitForImages: vi.fn<typeof import('./imageEmbed').waitForImages>(),
}));

vi.mock('html-to-image', () => ({
	toBlob: mocks.toBlob,
}));

vi.mock('./imageEmbed', () => ({
	inlineRemoteImages: mocks.inlineRemoteImages,
	waitForImages: mocks.waitForImages,
}));

describe('exportImage', () => {
	afterEach(() => {
		vi.restoreAllMocks();
		mocks.toBlob.mockReset();
		mocks.inlineRemoteImages.mockReset();
		mocks.waitForImages.mockReset();
	});

	it('sanitizes export filenames', () => {
		expect(sanitizeExportFilename('My Cool Tier List!')).toBe('My-Cool-Tier-List');
		expect(sanitizeExportFilename('   ')).toBe('tier-list');
	});

	it('downloads a generated png', async () => {
		mocks.inlineRemoteImages.mockResolvedValue(() => undefined);
		mocks.waitForImages.mockResolvedValue(undefined);
		mocks.toBlob.mockResolvedValue(new Blob(['png'], { type: 'image/png' }));
		const { click, anchor } = mockDownloadAnchor();
		const element = document.createElement('div');
		Object.defineProperty(element, 'scrollWidth', { value: 640 });
		Object.defineProperty(element, 'scrollHeight', { value: 480 });

		await saveTierListImage(element, 'Best Cats');

		const snapshot = mocks.inlineRemoteImages.mock.calls[0]?.[0];
		expect(snapshot).toBeInstanceOf(HTMLElement);
		expect(snapshot).not.toBe(element);
		expect((snapshot as HTMLElement).style.top).not.toBe('0px');
		expect(mocks.waitForImages).toHaveBeenCalledWith(snapshot);
		expect(mocks.toBlob).toHaveBeenCalledWith(
			snapshot,
			expect.objectContaining({
				width: 640,
				height: 480,
				backgroundColor: '#0d0d12',
				pixelRatio: 4,
				cacheBust: true,
				style: { position: 'static' },
			}),
		);
		expect(click).toHaveBeenCalledTimes(1);
		expect(anchor.download).toBe('Best-Cats.png');
	});
});
