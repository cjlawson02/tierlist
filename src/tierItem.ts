import { createStoreId } from './store/storeIds';
import { sanitizeImageSrc, sanitizeTextContent } from './sanitize';
import { ARIA_LABEL_PREVIEW_LEN } from './constants';
import type { SerializedTierItem, TierItem } from './types';
import { isTextItem } from './types';

export function createImageItem(src: string): TierItem {
	return { id: createStoreId(), kind: 'image', src };
}

export function createTextItem(text: string): TierItem {
	return { id: createStoreId(), kind: 'text', text };
}

export function deserializeTierItem(
	value: SerializedTierItem,
	id = createStoreId(),
): TierItem {
	if (typeof value === 'string') {
		const src = sanitizeImageSrc(value);
		if (!src) {
			throw new Error('Invalid image data URL.');
		}
		return { id, kind: 'image', src };
	}
	const text = sanitizeTextContent(value.text);
	if (!text) {
		throw new Error('Invalid text slide.');
	}
	return { id, kind: 'text', text };
}

export function itemAccessibleKind(item: TierItem): string {
	return isTextItem(item) ? 'text slide' : 'image';
}

export function itemPreviewLabel(
	item: TierItem,
	maxLen = ARIA_LABEL_PREVIEW_LEN,
): string {
	if (isTextItem(item)) {
		const text = item.text;
		return text.length > maxLen ? `${text.slice(0, maxLen)}…` : text;
	}
	return 'image';
}
