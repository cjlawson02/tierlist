import { create } from 'zustand';
import { sanitizeRecentBundleDocument, toBundle } from '../bundle';
import {
	BUNDLE_SIZE,
	PRESENTATION_TITLE,
	PRESENTATION_TIERS,
} from '../presentationConfig';
import type {
	DropTarget,
	ImageItem,
	TierBundleV1,
	TierListState,
	TierRow,
} from '../types';
import { TIER_COLORS } from '../types';
import {
	type RecentTierlistEntry,
	estimateRecentTierlistsPersistBytes,
	RecentTierlistsQuotaError,
	projectRecentTierlistsAfterUpsert,
	useRecentTierlistsStore,
} from './recentTierlistsStore';
import { createStoreId, resetStoreIds } from './storeIds';

export type SaveToRecentResult =
	| 'saved'
	| 'empty'
	| 'too-large'
	| 'quota-exceeded';

const mbToBytes = (mb: number) => mb * 1024 * 1024;

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

const loadFromDocument = (
	document: TierBundleV1['document'],
): TierListState => {
	resetStoreIds();
	return {
		title: document.title,
		rows: document.rows.map((row) => ({
			id: createStoreId(),
			name: row.name,
			color: row.color,
			images: row.images.map(createImage),
		})),
		untieredImages: (document.untiered ?? []).map(createImage),
		vertical: document.vertical,
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

const countImages = (state: TierListState) =>
	state.untieredImages.length +
	state.rows.reduce((total, row) => total + row.images.length, 0);

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
	recentId: string | null;
	setTitle: (title: string) => void;
	addImages: (srcs: string[]) => void;
	deleteImage: (imageId: string) => void;
	moveImage: (imageId: string, target: DropTarget, targetIndex: number) => void;
	resetPresentation: (options?: { markUnsaved?: boolean }) => void;
	loadDemo: (title: string, srcs: string[]) => void;
	loadRecentTierlist: (entry: RecentTierlistEntry) => void;
	saveToRecent: () => SaveToRecentResult;
	startNewTierlist: () => void;
	clearRecentId: () => void;
};

export const useSetupStore = create<SetupStore>((set, get) => ({
	...createInitialState(),
	recentId: null,
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
	resetPresentation: (options) => {
		const markUnsaved = options?.markUnsaved ?? true;
		set((state) => {
			const tiered = state.rows.flatMap((row) => row.images);
			const poolIds = new Set(state.untieredImages.map((img) => img.id));
			return {
				rows: state.rows.map((row) => ({ ...row, images: [] })),
				untieredImages: [
					...state.untieredImages,
					...tiered.filter((img) => !poolIds.has(img.id)),
				],
				unsavedChanges: markUnsaved,
			};
		});
	},
	loadDemo: (title, srcs) => {
		resetStoreIds();
		set({
			title,
			rows: PRESENTATION_TIERS.map((name, i) => createRow(name, i)),
			untieredImages: srcs.map(createImage),
			vertical: false,
			unsavedChanges: true,
			recentId: null,
		});
	},
	loadRecentTierlist: (entry) => {
		if (
			get().unsavedChanges &&
			!confirm('Replace current Tier List? Unsaved changes will be lost.')
		) {
			throw new Error('Load cancelled');
		}
		const document = sanitizeRecentBundleDocument(entry.document);
		set({ ...loadFromDocument(document), recentId: entry.id });
	},
	saveToRecent: () => {
		const state = selectTierListState(get());
		const imageCount = countImages(state);
		if (imageCount === 0) {
			return 'empty';
		}
		const bundle = toBundle(state);
		const approxBytes = bundle.meta?.approxBytes;
		if (approxBytes === undefined) {
			return 'too-large';
		}
		if (approxBytes > mbToBytes(BUNDLE_SIZE.maxEntryMb)) {
			return 'too-large';
		}

		const recentId = get().recentId;
		const savedAt = new Date().toISOString();
		const candidate: RecentTierlistEntry = {
			id: recentId ?? createStoreId(),
			title: state.title,
			savedAt,
			imageCount,
			document: bundle.document,
		};
		const projectedEntries = projectRecentTierlistsAfterUpsert(
			useRecentTierlistsStore.getState().entries,
			candidate,
		);
		if (
			estimateRecentTierlistsPersistBytes(projectedEntries) >
			mbToBytes(BUNDLE_SIZE.maxPersistMb)
		) {
			return 'too-large';
		}

		try {
			const id = useRecentTierlistsStore.getState().upsert({
				id: recentId ?? undefined,
				title: candidate.title,
				savedAt,
				imageCount,
				document: candidate.document,
			});
			set({ recentId: id, unsavedChanges: false });
			return 'saved';
		} catch (err) {
			if (err instanceof RecentTierlistsQuotaError) {
				return 'quota-exceeded';
			}
			throw err;
		}
	},
	startNewTierlist: () => {
		if (
			get().unsavedChanges &&
			!confirm('Start a new Tier List? Unsaved changes will be lost.')
		) {
			return;
		}
		set({ ...createInitialState(), recentId: null });
	},
	clearRecentId: () => {
		set({ recentId: null });
	},
}));
