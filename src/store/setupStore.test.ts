import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PRESENTATION_TITLE, PRESENTATION_TIERS } from '../presentationConfig';
import {
	createJsonFile,
	mockConfirm,
	mockFileReaderResult,
} from '../test/helpers';
import { DATA_IMAGE_PNG, tierBundleV1 } from '../test/fixtures';
import { getSetupStoreState, seedSetupStore } from '../test/store';

describe('useSetupStore', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('starts with default tiers and title', () => {
		const state = getSetupStoreState();
		expect(state.title).toBe(PRESENTATION_TITLE);
		expect(state.rows).toHaveLength(PRESENTATION_TIERS.length);
		expect(state.untieredImages).toEqual([]);
		expect(state.unsavedChanges).toBe(false);
	});

	it('setTitle marks the list as unsaved', () => {
		getSetupStoreState().setTitle('Renamed');
		expect(getSetupStoreState().title).toBe('Renamed');
		expect(getSetupStoreState().unsavedChanges).toBe(true);
	});

	it('addImages appends to the pool', () => {
		getSetupStoreState().addImages([DATA_IMAGE_PNG, DATA_IMAGE_PNG]);
		expect(getSetupStoreState().untieredImages).toHaveLength(2);
		expect(getSetupStoreState().unsavedChanges).toBe(true);
	});

	it('deleteImage removes images from rows and the pool', () => {
		getSetupStoreState().addImages([DATA_IMAGE_PNG]);
		const imageId = getSetupStoreState().untieredImages[0]?.id;
		expect(imageId).toBeDefined();

		getSetupStoreState().deleteImage(imageId ?? '');
		expect(getSetupStoreState().untieredImages).toHaveLength(0);
	});

	it('moveImage moves an image into a tier row', () => {
		getSetupStoreState().addImages([DATA_IMAGE_PNG]);
		const imageId = getSetupStoreState().untieredImages[0]?.id;
		const rowId = getSetupStoreState().rows[0]?.id;
		expect(imageId).toBeDefined();
		expect(rowId).toBeDefined();

		getSetupStoreState().moveImage(
			imageId ?? '',
			{ type: 'row', rowId: rowId ?? '' },
			0,
		);

		expect(getSetupStoreState().untieredImages).toHaveLength(0);
		expect(getSetupStoreState().rows[0]?.images).toHaveLength(1);
	});

	it('moveImage adjusts index when reordering within the same row', () => {
		getSetupStoreState().addImages([DATA_IMAGE_PNG, DATA_IMAGE_PNG]);
		const [first, second] = getSetupStoreState().untieredImages;
		const rowId = getSetupStoreState().rows[0]?.id ?? '';

		getSetupStoreState().moveImage(first?.id ?? '', { type: 'row', rowId }, 0);
		getSetupStoreState().moveImage(second?.id ?? '', { type: 'row', rowId }, 0);

		const rowImages = getSetupStoreState().rows[0]?.images ?? [];
		expect(rowImages.map((img) => img.id)).toEqual([second?.id, first?.id]);
	});

	it('resetPresentation returns tiered images to the pool', () => {
		getSetupStoreState().addImages([DATA_IMAGE_PNG]);
		const imageId = getSetupStoreState().untieredImages[0]?.id ?? '';
		const rowId = getSetupStoreState().rows[0]?.id ?? '';
		getSetupStoreState().moveImage(imageId, { type: 'row', rowId }, 0);

		getSetupStoreState().resetPresentation();

		expect(
			getSetupStoreState().rows.every((row) => row.images.length === 0),
		).toBe(true);
		expect(getSetupStoreState().untieredImages).toHaveLength(1);
	});

	it('importFile replaces state from a bundle file', async () => {
		mockConfirm(true);
		mockFileReaderResult(null);
		const file = createJsonFile(tierBundleV1());

		await getSetupStoreState().importFile(file);

		expect(getSetupStoreState().title).toBe('Test Tier List');
		expect(getSetupStoreState().rows[0]?.images).toHaveLength(1);
		expect(getSetupStoreState().unsavedChanges).toBe(false);
	});

	it('importFile requires confirmation when there are unsaved changes', async () => {
		mockConfirm(false);
		seedSetupStore({ unsavedChanges: true });
		const file = createJsonFile(tierBundleV1());

		await expect(getSetupStoreState().importFile(file)).rejects.toThrow(
			'Import cancelled',
		);
	});

	it('exportFile returns null for an empty name', async () => {
		await expect(getSetupStoreState().exportFile('')).resolves.toBeNull();
	});
});
