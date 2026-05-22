import { describe, expect, it } from 'vitest';
import { DATA_IMAGE_PNG } from './test/fixtures';
import {
	defaultTierColor,
	sanitizeColor,
	sanitizeImageSrc,
	sanitizeName,
	sanitizeStringArray,
	sanitizeTierItemArray,
} from './sanitize';

describe('sanitizeImageSrc', () => {
	it('accepts data:image base64 URLs', () => {
		expect(sanitizeImageSrc(DATA_IMAGE_PNG)).toBe(DATA_IMAGE_PNG);
	});

	it('rejects remote URLs', () => {
		expect(sanitizeImageSrc('https://evil.example/a.png')).toBeNull();
	});

	it('rejects non-string values', () => {
		expect(sanitizeImageSrc(null)).toBeNull();
		expect(sanitizeImageSrc(42)).toBeNull();
	});
});

describe('sanitizeColor', () => {
	it('accepts hex colors', () => {
		expect(sanitizeColor('#ff0000', '#000000')).toBe('#ff0000');
	});

	it('accepts valid rgb colors', () => {
		expect(sanitizeColor('rgb(255, 0, 128)', '#000000')).toBe(
			'rgb(255, 0, 128)',
		);
	});

	it('rejects CSS injection attempts', () => {
		expect(
			sanitizeColor('red; background-image: url(https://evil)', '#000000'),
		).toBe('#000000');
	});

	it('rejects out-of-range rgb channels', () => {
		expect(sanitizeColor('rgb(999, 0, 0)', '#000000')).toBe('#000000');
	});
});

describe('sanitizeName', () => {
	it('truncates long names', () => {
		expect(sanitizeName('x'.repeat(300), 'fallback')).toHaveLength(200);
	});

	it('falls back when empty after trim', () => {
		expect(sanitizeName('   ', 'fallback')).toBe('fallback');
	});

	it('falls back for non-string values', () => {
		expect(sanitizeName(undefined, 'fallback')).toBe('fallback');
	});
});

describe('sanitizeStringArray', () => {
	it('accepts valid data URLs', () => {
		expect(sanitizeStringArray([DATA_IMAGE_PNG], 'images')).toEqual([
			DATA_IMAGE_PNG,
		]);
	});

	it('throws when any entry is invalid', () => {
		expect(() =>
			sanitizeStringArray(['https://evil.example/a.png'], 'row "S"'),
		).toThrow('Only embedded data:image URLs are supported.');
	});

	it('throws when value is not an array', () => {
		expect(() => sanitizeStringArray('nope', 'images')).toThrow(
			'Invalid images.',
		);
	});
});

describe('sanitizeTierItemArray', () => {
	it('accepts text slide objects', () => {
		expect(
			sanitizeTierItemArray(
				[{ kind: 'text', text: 'Hello' }, DATA_IMAGE_PNG],
				'items',
			),
		).toEqual([{ kind: 'text', text: 'Hello' }, DATA_IMAGE_PNG]);
	});

	it('rejects empty text slides', () => {
		expect(() =>
			sanitizeTierItemArray([{ kind: 'text', text: '   ' }], 'items'),
		).toThrow('Invalid text in items[0].');
	});
});

describe('defaultTierColor', () => {
	it('cycles through tier palette', () => {
		expect(defaultTierColor(0)).not.toBe(defaultTierColor(1));
		expect(defaultTierColor(8)).toBe(defaultTierColor(1));
	});
});
