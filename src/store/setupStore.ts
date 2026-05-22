import { create } from 'zustand';
import { PRESENTATION_TITLE, PRESENTATION_TIERS } from '../presentationConfig';
import { MAX_TEXT_SLIDES_PER_BATCH } from '../constants';
import { sanitizeTextContent } from '../sanitize';
import { createImageItem, createTextItem } from '../tierItem';
import type { DropTarget, TierItem, TierListState, TierRow } from '../types';
import { TIER_COLORS } from '../types';
import { createStoreId, resetStoreIds } from './storeIds';

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
	};
};

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
	image: TierItem,
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
	addTextSlides: (texts: string[]) => void;
	deleteImage: (imageId: string) => void;
	moveImage: (imageId: string, target: DropTarget, targetIndex: number) => void;
	resetPresentation: () => void;
	loadDemo: (title: string, srcs: string[]) => void;
};

export const useSetupStore = create<SetupStore>((set) => ({
	...createInitialState(),
	setTitle: (title) => {
		set({ title });
	},
	addImages: (srcs) => {
		set((state) => ({
			untieredImages: [
				...state.untieredImages,
				...srcs.map((src) => createImageItem(src)),
			],
		}));
	},
	addTextSlides: (texts) => {
		const sanitized = texts
			.slice(0, MAX_TEXT_SLIDES_PER_BATCH)
			.map((text) => sanitizeTextContent(text))
			.filter((text): text is string => text != null);
		if (sanitized.length === 0) {
			return;
		}
		set((state) => ({
			untieredImages: [
				...state.untieredImages,
				...sanitized.map((text) => createTextItem(text)),
			],
		}));
	},
	deleteImage: (imageId) => {
		set((state) => withoutImage(state, imageId));
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
			return insertImage({ ...state, ...withoutImage(state, imageId) }, image, {
				...target,
				index,
			});
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
			};
		});
	},
	loadDemo: (title, srcs) => {
		resetStoreIds();
		set({
			title,
			rows: PRESENTATION_TIERS.map((name, i) => createRow(name, i)),
			untieredImages: srcs.map((src) => createImageItem(src)),
			vertical: false,
		});
	},
}));
