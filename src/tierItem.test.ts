import { describe, expect, it } from 'vitest';
import { DATA_IMAGE_PNG, textTierItem } from './test/fixtures';
import {
	deserializeTierItem,
	itemAccessibleKind,
	itemPreviewLabel,
} from './tierItem';

describe('itemPreviewLabel', () => {
	it('returns lowercase image for photo items', () => {
		expect(
			itemPreviewLabel({ id: '1', kind: 'image', src: DATA_IMAGE_PNG }),
		).toBe('image');
	});

	it('truncates long text slide content', () => {
		const label = itemPreviewLabel(textTierItem('t', 'A'.repeat(100)), 60);
		expect(label).toHaveLength(61);
		expect(label.endsWith('…')).toBe(true);
	});
});

describe('itemAccessibleKind', () => {
	it('uses stable accessible kind names', () => {
		expect(
			itemAccessibleKind({ id: '1', kind: 'image', src: DATA_IMAGE_PNG }),
		).toBe('image');
		expect(itemAccessibleKind(textTierItem('t', 'Hello'))).toBe('text slide');
	});
});

describe('deserializeTierItem', () => {
	it('hydrates image and text slides from bundle data', () => {
		expect(deserializeTierItem(DATA_IMAGE_PNG, 'img-1')).toEqual({
			id: 'img-1',
			kind: 'image',
			src: DATA_IMAGE_PNG,
		});
		expect(
			deserializeTierItem({ kind: 'text', text: 'Hello' }, 'text-1'),
		).toEqual({
			id: 'text-1',
			kind: 'text',
			text: 'Hello',
		});
	});

	it('rejects invalid bundle item data', () => {
		expect(() => deserializeTierItem('https://evil.example/a.png')).toThrow(
			'Invalid image data URL.',
		);
		expect(() => deserializeTierItem({ kind: 'text', text: '   ' })).toThrow(
			'Invalid text slide.',
		);
	});
});
