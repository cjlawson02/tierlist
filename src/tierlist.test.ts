import { describe, expect, it } from 'vitest';
import { MAX_IMAGE_BYTES } from './constants';
import { readFileAsDataUrl } from './tierlist';
import { createBlobFile, mb, mockFileReaderResult } from './test/helpers';
import { DATA_IMAGE_PNG } from './test/fixtures';

describe('readFileAsDataUrl', () => {
	it('resolves with reader result for valid blobs', async () => {
		mockFileReaderResult(DATA_IMAGE_PNG);
		const file = createBlobFile('x', 'photo.png', 'image/png');
		await expect(readFileAsDataUrl(file)).resolves.toBe(DATA_IMAGE_PNG);
	});

	it('rejects blobs over the size limit', async () => {
		const file = createBlobFile('x', 'huge.png', 'image/png');
		Object.defineProperty(file, 'size', { value: MAX_IMAGE_BYTES + 1 });

		await expect(readFileAsDataUrl(file)).rejects.toThrow('Image is too large');
	});

	it('rejects when size gate would block import-scale payloads', async () => {
		const file = createBlobFile('x', 'large.png', 'image/png');
		Object.defineProperty(file, 'size', { value: mb(16) });

		await expect(readFileAsDataUrl(file)).rejects.toThrow('Maximum size is');
	});
});
