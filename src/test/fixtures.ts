import type { SerializedTierList, TierBundleV1, TierListState } from '../types';
import { defaultTierColor } from '../sanitize';

export const DATA_IMAGE_PNG = 'data:image/png;base64,iVBORw0KGgo=';

export function legacyTierList(
	overrides: Partial<SerializedTierList> = {},
): SerializedTierList {
	return {
		title: 'Test Tier List',
		rows: [
			{
				name: 'S',
				color: defaultTierColor(0),
				imgs: [DATA_IMAGE_PNG],
			},
		],
		...overrides,
	};
}

export function tierBundleDocument(
	overrides: Partial<TierBundleV1['document']> = {},
): TierBundleV1['document'] {
	return {
		title: 'Test Tier List',
		vertical: false,
		rows: [
			{
				name: 'S',
				color: defaultTierColor(0),
				images: [DATA_IMAGE_PNG],
			},
		],
		...overrides,
	};
}

export function tierBundleV1(
	overrides: Partial<TierBundleV1> = {},
): TierBundleV1 {
	return {
		format: 'tier-bundle',
		version: 1,
		app: 'tiers',
		exportedAt: '2026-01-01T00:00:00.000Z',
		document: tierBundleDocument(),
		...overrides,
	};
}

export function emptyTierListState(
	overrides: Partial<TierListState> = {},
): TierListState {
	return {
		title: 'Test Tier List',
		rows: [
			{
				id: 'row-s',
				name: 'S',
				color: defaultTierColor(0),
				images: [],
			},
			{
				id: 'row-a',
				name: 'A',
				color: defaultTierColor(1),
				images: [],
			},
		],
		untieredImages: [{ id: 'img-1', src: DATA_IMAGE_PNG }],
		vertical: false,
		unsavedChanges: false,
		...overrides,
	};
}
