export interface ImageTierItem {
	id: string;
	kind: 'image';
	src: string;
}

export interface TextTierItem {
	id: string;
	kind: 'text';
	text: string;
}

export type TierItem = ImageTierItem | TextTierItem;

/** @deprecated Use TierItem — kept for gradual migration in prop names */
export type ImageItem = ImageTierItem;

export type SerializedTierItem = string | { kind: 'text'; text: string };

export interface TierRow {
	id: string;
	name: string;
	color: string;
	images: TierItem[];
}

export type DropTarget = { type: 'row'; rowId: string } | { type: 'untiered' };

export interface TierListState {
	title: string;
	rows: TierRow[];
	untieredImages: TierItem[];
	vertical: boolean;
}

export interface SerializedTierList {
	title: string;
	rows: { name: string; color: string; imgs: SerializedTierItem[] }[];
	untiered?: SerializedTierItem[];
}

export interface TierBundleV1 {
	format: 'tier-bundle';
	version: 1;
	app: 'tiers';
	exportedAt: string;
	meta?: {
		title: string;
		imageCount: number;
		slideCount?: number;
		approxBytes?: number;
	};
	document: {
		title: string;
		vertical: boolean;
		rows: { name: string; color: string; images: SerializedTierItem[] }[];
		untiered?: SerializedTierItem[];
	};
}

export type AppPhase = 'setup' | 'presentation';

export const MAX_NAME_LEN = 200;
export const MAX_TEXT_LEN = 500;
export const TIER_COLORS = [
	'#ff6666',
	'#f0a731',
	'#f4d95b',
	'#66ff66',
	'#58c8f4',
	'#5b76f4',
	'#f45bed',
] as const;

export function isImageItem(item: TierItem): item is ImageTierItem {
	return item.kind === 'image';
}

export function isTextItem(item: TierItem): item is TextTierItem {
	return item.kind === 'text';
}

export function serializeTierItem(item: TierItem): SerializedTierItem {
	if (isTextItem(item)) {
		return { kind: 'text', text: item.text };
	}
	return item.src;
}
