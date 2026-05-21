export interface ImageItem {
	id: string;
	src: string;
}

export interface TierRow {
	id: string;
	name: string;
	color: string;
	images: ImageItem[];
}

export type DropTarget = { type: 'row'; rowId: string } | { type: 'untiered' };

export interface TierListState {
	title: string;
	rows: TierRow[];
	untieredImages: ImageItem[];
	vertical: boolean;
	unsavedChanges: boolean;
}

export interface SerializedTierList {
	title: string;
	rows: { name: string; color: string; imgs: string[] }[];
	untiered?: string[];
}

export interface TierBundleV1 {
	format: 'tier-bundle';
	version: 1;
	app: 'tiers';
	exportedAt: string;
	meta?: { title: string; imageCount: number; approxBytes?: number };
	document: {
		title: string;
		vertical: boolean;
		rows: { name: string; color: string; images: string[] }[];
		untiered?: string[];
	};
}

export type AppPhase = 'setup' | 'presentation';

export const MAX_NAME_LEN = 200;
export const TIER_COLORS = [
	'#ff6666',
	'#f0a731',
	'#f4d95b',
	'#66ff66',
	'#58c8f4',
	'#5b76f4',
	'#f45bed',
] as const;
