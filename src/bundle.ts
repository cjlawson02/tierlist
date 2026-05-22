import { BUNDLE_VERSION } from './presentationConfig';
import {
	defaultTierColor,
	sanitizeColor,
	sanitizeName,
	sanitizeTierItemArray,
} from './sanitize';
import { serializeTierItem, isImageItem } from './types';
import type {
	SerializedTierItem,
	SerializedTierList,
	TierBundleV1,
	TierListState,
} from './types';

function isSerializedTierItem(value: unknown): value is SerializedTierItem {
	if (typeof value === 'string') {
		return true;
	}
	if (!value || typeof value !== 'object') {
		return false;
	}
	const record = value as Record<string, unknown>;
	return record.kind === 'text' && typeof record.text === 'string';
}

function isSerializedTierItemArray(values: unknown): values is unknown[] {
	return (
		Array.isArray(values) &&
		values.every((value) => isSerializedTierItem(value))
	);
}

function isLegacyTierList(data: unknown): data is SerializedTierList {
	if (!data || typeof data !== 'object') {
		return false;
	}
	const obj = data as Record<string, unknown>;
	if (typeof obj.title !== 'string' || !Array.isArray(obj.rows)) {
		return false;
	}
	if (obj.format !== undefined) {
		return false;
	}
	return obj.rows.every((row) => {
		if (!row || typeof row !== 'object') {
			return false;
		}
		const record = row as Record<string, unknown>;
		return (
			typeof record.name === 'string' &&
			typeof record.color === 'string' &&
			Array.isArray(record.imgs) &&
			isSerializedTierItemArray(record.imgs)
		);
	});
}

function isTierBundleDocument(data: unknown): data is TierBundleV1['document'] {
	if (!data || typeof data !== 'object') {
		return false;
	}
	const doc = data as Record<string, unknown>;
	if (typeof doc.title !== 'string' || !Array.isArray(doc.rows)) {
		return false;
	}
	return doc.rows.every((row) => {
		if (!row || typeof row !== 'object') {
			return false;
		}
		const record = row as Record<string, unknown>;
		return (
			typeof record.name === 'string' &&
			typeof record.color === 'string' &&
			Array.isArray(record.images) &&
			isSerializedTierItemArray(record.images)
		);
	});
}

function sanitizeLegacyTierList(data: SerializedTierList): SerializedTierList {
	return {
		title: sanitizeName(data.title, 'My Tier List'),
		rows: data.rows.map((row, index) => ({
			name: sanitizeName(row.name, `Tier ${String(index + 1)}`),
			color: sanitizeColor(row.color, defaultTierColor(index)),
			imgs: sanitizeTierItemArray(row.imgs, `row "${row.name}"`),
		})),
		untiered:
			data.untiered != null
				? sanitizeTierItemArray(data.untiered, 'untiered items')
				: undefined,
	};
}

function sanitizeBundleDocument(
	doc: TierBundleV1['document'],
): TierBundleV1['document'] {
	return {
		title: sanitizeName(doc.title, 'My Tier List'),
		vertical: typeof doc.vertical === 'boolean' ? doc.vertical : false,
		rows: doc.rows.map((row, index) => ({
			name: sanitizeName(row.name, `Tier ${String(index + 1)}`),
			color: sanitizeColor(row.color, defaultTierColor(index)),
			images: sanitizeTierItemArray(row.images, `row "${row.name}"`),
		})),
		untiered:
			doc.untiered != null
				? sanitizeTierItemArray(doc.untiered, 'untiered items')
				: undefined,
	};
}

function normalizeToBundle(data: unknown): TierBundleV1 {
	if (!data || typeof data !== 'object') {
		throw new Error('Not a valid Tier List file.');
	}
	const obj = data as Record<string, unknown>;
	if (obj.format === 'tier-bundle' && typeof obj.version === 'number') {
		if (obj.version > BUNDLE_VERSION) {
			throw new Error(
				`This file requires a newer version of the app (format v${String(obj.version)}, app v${String(BUNDLE_VERSION)}).`,
			);
		}
		if (!isTierBundleDocument(obj.document)) {
			throw new Error('Not a valid Tier List file.');
		}
		return {
			format: 'tier-bundle',
			version: 1,
			app: 'tiers',
			exportedAt:
				typeof obj.exportedAt === 'string'
					? obj.exportedAt
					: new Date().toISOString(),
			document: sanitizeBundleDocument(obj.document),
		};
	}
	if (isLegacyTierList(data)) {
		const sanitized = sanitizeLegacyTierList(data);
		return {
			format: 'tier-bundle',
			version: 1,
			app: 'tiers',
			exportedAt: new Date().toISOString(),
			document: {
				title: sanitized.title,
				vertical: false,
				rows: sanitized.rows.map((row) => ({
					name: row.name,
					color: row.color,
					images: row.imgs,
				})),
				untiered: sanitized.untiered,
			},
		};
	}
	throw new Error('Not a valid Tier List file.');
}

export function toBundle(state: TierListState): TierBundleV1 {
	const allItems = [
		...state.untieredImages,
		...state.rows.flatMap((row) => row.images),
	];
	const slideCount = allItems.length;
	const imageCount = allItems.filter((item) => isImageItem(item)).length;
	const bundle: TierBundleV1 = {
		format: 'tier-bundle',
		version: 1,
		app: 'tiers',
		exportedAt: new Date().toISOString(),
		meta: {
			title: state.title,
			imageCount,
			slideCount,
		},
		document: {
			title: state.title,
			vertical: state.vertical,
			rows: state.rows.map((row) => ({
				name: row.name,
				color: row.color,
				images: row.images.map(serializeTierItem),
			})),
			untiered:
				state.untieredImages.length > 0
					? state.untieredImages.map(serializeTierItem)
					: undefined,
		},
	};
	const json = JSON.stringify(bundle, null, 2);
	bundle.meta = {
		title: state.title,
		imageCount,
		slideCount,
		approxBytes: new Blob([json]).size,
	};
	return bundle;
}

export function bundleToSerialized(bundle: TierBundleV1): SerializedTierList {
	const doc = bundle.document;
	return {
		title: doc.title,
		rows: doc.rows.map((row) => ({
			name: row.name,
			color: row.color,
			imgs: row.images,
		})),
		untiered: doc.untiered,
	};
}

export { formatBytes } from './formatBytes';
export { normalizeToBundle };
