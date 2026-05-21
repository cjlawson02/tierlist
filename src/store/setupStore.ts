import { create } from 'zustand';
import {
	bundleToSerialized,
	confirmBundleSizeGate,
	downloadBundle,
	readBundleFile,
	toBundle,
} from '../bundle';
import { PRESENTATION_TITLE, PRESENTATION_TIERS } from '../presentationConfig';
import type {
	DropTarget,
	ImageItem,
	SerializedTierList,
	TierListState,
	TierRow,
} from '../types';
import { TIER_COLORS } from '../types';
import { createStoreId, resetStoreIds } from './storeIds';

const createImage = (src: string): ImageItem => ({ id: createStoreId(), src });
const createRow = (name: string, index: number): TierRow => ({
	id: createStoreId(),
	name,
	color: TIER_COLORS[index % TIER_COLORS.length],
	images: [],
});

const createInitialState = (): TierListState => {
	resetStoreIds();
	return {
		title: PRESENTATION_TITLE,
		rows: PRESENTATION_TIERS.map((name, i) => createRow(name, i)),
		untieredImages: [],
		vertical: false,
		unsavedChanges: false,
	};
};

const deserializeTierList = (data: SerializedTierList): TierListState => {
	resetStoreIds();
	return {
		title: data.title,
		rows: data.rows.map((row) => ({
			id: createStoreId(),
			name: row.name,
			color: row.color,
			images: row.imgs.map(createImage),
		})),
		untieredImages: (data.untiered ?? []).map(createImage),
		vertical: false,
		unsavedChanges: false,
	};
};

const selectTierListState = (state: SetupStore): TierListState => ({
	title: state.title,
	rows: state.rows,
	untieredImages: state.untieredImages,
	vertical: state.vertical,
	unsavedChanges: state.unsavedChanges,
});

const withoutImage = (state: TierListState, imageId: string) => ({
	rows: state.rows.map((row) => ({
		...row,
		images: row.images.filter((img) => img.id !== imageId),
	})),
	untieredImages: state.untieredImages.filter((img) => img.id !== imageId),
});

const findImage = (state: TierListState, imageId: string) =>
	state.rows.flatMap((row) => row.images).find((img) => img.id === imageId) ??
	state.untieredImages.find((img) => img.id === imageId) ??
	null;

const findLocation = (state: TierListState, imageId: string) => {
	for (const row of state.rows) {
		const index = row.images.findIndex((img) => img.id === imageId);
		if (index !== -1) {
			return { type: 'row' as const, rowId: row.id, index };
		}
	}
	const index = state.untieredImages.findIndex((img) => img.id === imageId);
	return index !== -1 ? { type: 'untiered' as const, index } : null;
};

const insertImage = (
	state: TierListState,
	image: ImageItem,
	target: DropTarget & { index?: number },
) => {
	if (target.type === 'row') {
		return {
			...state,
			rows: state.rows.map((row) => {
				if (row.id !== target.rowId) {
					return row;
				}
				const images = [...row.images];
				images.splice(target.index ?? images.length, 0, image);
				return { ...row, images };
			}),
		};
	}
	const untieredImages = [...state.untieredImages];
	untieredImages.splice(target.index ?? untieredImages.length, 0, image);
	return { ...state, untieredImages };
};

type SetupStore = TierListState & {
	setTitle: (title: string) => void;
	addImages: (srcs: string[]) => void;
	deleteImage: (imageId: string) => void;
	moveImage: (imageId: string, target: DropTarget, targetIndex: number) => void;
	resetPresentation: () => void;
	importFile: (file: File) => Promise<void>;
	exportFile: (name: string) => Promise<number | null>;
};

export const useSetupStore = create<SetupStore>((set, get) => ({
	...createInitialState(),
	setTitle: (title) => {
		set({ title, unsavedChanges: true });
	},
	addImages: (srcs) => {
		set((state) => ({
			untieredImages: [...state.untieredImages, ...srcs.map(createImage)],
			unsavedChanges: true,
		}));
	},
	deleteImage: (imageId) => {
		set((state) => ({
			...withoutImage(state, imageId),
			unsavedChanges: true,
		}));
	},
	moveImage: (imageId, target, targetIndex) => {
		set((state) => {
			const image = findImage(state, imageId);
			if (!image) {
				return state;
			}
			const from = findLocation(state, imageId);
			let index = targetIndex;
			if (
				from?.type === 'row' &&
				target.type === 'row' &&
				from.rowId === target.rowId &&
				from.index < index
			) {
				index -= 1;
			}
			return {
				...insertImage({ ...state, ...withoutImage(state, imageId) }, image, {
					...target,
					index,
				}),
				unsavedChanges: true,
			};
		});
	},
	resetPresentation: () => {
		set((state) => {
			const tiered = state.rows.flatMap((row) => row.images);
			const poolIds = new Set(state.untieredImages.map((img) => img.id));
			return {
				rows: state.rows.map((row) => ({ ...row, images: [] })),
				untieredImages: [
					...state.untieredImages,
					...tiered.filter((img) => !poolIds.has(img.id)),
				],
				unsavedChanges: true,
			};
		});
	},
	importFile: async (file) => {
		if (
			get().unsavedChanges &&
			!confirm('Replace current Tier List? Unsaved changes will be lost.')
		) {
			throw new Error('Import cancelled');
		}
		const bundle = await readBundleFile(file);
		const loaded = deserializeTierList(bundleToSerialized(bundle));
		set({ ...loaded, vertical: bundle.document.vertical });
	},
	exportFile: async (name) => {
		if (!name) {
			return null;
		}
		const bundle = toBundle(selectTierListState(get()));
		const bytes = bundle.meta?.approxBytes ?? 0;
		try {
			confirmBundleSizeGate(bytes, 'export');
		} catch (err) {
			if (err instanceof Error && err.message === 'Export cancelled') {
				return null;
			}
			throw err;
		}
		await downloadBundle(bundle, name);
		set({ unsavedChanges: false });
		return bytes;
	},
}));
