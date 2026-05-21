import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PRESENTATION_TITLE, PRESENTATION_TIERS } from '../presentationConfig';
import { mockConfirm } from '../test/helpers';
import { DATA_IMAGE_PNG, tierBundleDocument } from '../test/fixtures';
import { getRecentTierlistsStoreState } from '../test/store';
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
		expect(state.recentId).toBeNull();
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
		expect(getSetupStoreState().unsavedChanges).toBe(true);
	});

	it('resetPresentation can preserve a clean saved state on exit', () => {
		getSetupStoreState().addImages([DATA_IMAGE_PNG]);
		getSetupStoreState().saveToRecent();

		getSetupStoreState().resetPresentation({ markUnsaved: false });

		expect(getSetupStoreState().unsavedChanges).toBe(false);
	});

	it('saveToRecent stores the current tier list in local storage', () => {
		getSetupStoreState().addImages([DATA_IMAGE_PNG]);
		getSetupStoreState().setTitle('Saved locally');

		expect(getSetupStoreState().saveToRecent()).toBe('saved');
		expect(getRecentTierlistsStoreState().entries).toHaveLength(1);
		expect(getRecentTierlistsStoreState().entries[0]?.title).toBe(
			'Saved locally',
		);
		expect(getSetupStoreState().recentId).toBe(
			getRecentTierlistsStoreState().entries[0]?.id,
		);
		expect(getSetupStoreState().unsavedChanges).toBe(false);
	});

	it('saveToRecent returns empty when there are no images', () => {
		expect(getSetupStoreState().saveToRecent()).toBe('empty');
		expect(getRecentTierlistsStoreState().entries).toHaveLength(0);
	});

	it('loadRecentTierlist replaces state from a saved entry', () => {
		mockConfirm(true);
		getSetupStoreState().addImages([DATA_IMAGE_PNG]);
		getSetupStoreState().setTitle('Saved locally');
		getSetupStoreState().saveToRecent();
		const entry = getRecentTierlistsStoreState().entries[0];
		expect(entry).toBeDefined();

		getSetupStoreState().setTitle('Different title');
		getSetupStoreState().loadRecentTierlist(
			entry ?? {
				id: '',
				title: '',
				savedAt: '',
				imageCount: 0,
				document: tierBundleDocument(),
			},
		);

		expect(getSetupStoreState().title).toBe('Saved locally');
		expect(getSetupStoreState().recentId).toBe(entry?.id);
	});

	it('loadRecentTierlist accepts https image URLs from inspiration demos', () => {
		getSetupStoreState().loadRecentTierlist({
			id: 'remote-entry',
			title: 'Remote cats',
			savedAt: new Date().toISOString(),
			imageCount: 1,
			document: tierBundleDocument({
				title: 'Remote cats',
				rows: [
					{
						name: 'S',
						color: '#ff6666',
						images: ['https://cataas.com/cat/demo123'],
					},
				],
				untiered: ['https://cataas.com/cat/pool456'],
			}),
		});

		expect(getSetupStoreState().rows[0]?.images[0]?.src).toBe(
			'https://cataas.com/cat/demo123',
		);
		expect(getSetupStoreState().untieredImages[0]?.src).toBe(
			'https://cataas.com/cat/pool456',
		);
	});

	it('loadRecentTierlist requires confirmation when there are unsaved changes', () => {
		mockConfirm(false);
		getSetupStoreState().addImages([DATA_IMAGE_PNG]);
		getSetupStoreState().saveToRecent();
		const entry = getRecentTierlistsStoreState().entries[0];
		seedSetupStore({ unsavedChanges: true, title: 'Dirty title' });

		expect(() => {
			getSetupStoreState().loadRecentTierlist(
				entry ?? {
					id: '',
					title: '',
					savedAt: '',
					imageCount: 0,
					document: tierBundleDocument(),
				},
			);
		}).toThrow('Load cancelled');
	});

	it('startNewTierlist resets to defaults', () => {
		mockConfirm(true);
		getSetupStoreState().addImages([DATA_IMAGE_PNG]);
		getSetupStoreState().setTitle('Custom');

		getSetupStoreState().startNewTierlist();

		expect(getSetupStoreState().title).toBe(PRESENTATION_TITLE);
		expect(getSetupStoreState().untieredImages).toHaveLength(0);
		expect(getSetupStoreState().recentId).toBeNull();
	});
});
