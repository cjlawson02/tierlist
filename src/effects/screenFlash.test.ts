import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { desaturateScreen, flashTierColor, shakeScreen } from './screenFlash';
import { mockReducedMotion } from '../test/helpers';

describe('screenFlash', () => {
	beforeEach(() => {
		mockReducedMotion(false);
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('flashTierColor adds active wash classes', () => {
		flashTierColor('#ff0000', 'celebrate');
		const wash = document.querySelector('.screen-color-wash');
		expect(wash).not.toBeNull();
		expect(wash?.classList.contains('screen-color-wash--active')).toBe(true);
		expect(wash?.classList.contains('screen-color-wash--strong')).toBe(true);
	});

	it('flashTierColor skips work when reduced motion is preferred', () => {
		document.querySelector('.screen-color-wash')?.remove();
		mockReducedMotion(true);
		flashTierColor('#ff0000');
		expect(document.querySelector('.screen-color-wash')).toBeNull();
	});

	it('desaturateScreen toggles severity classes', () => {
		desaturateScreen('heavy');
		const overlay = document.querySelector('.screen-desaturate');
		expect(overlay?.classList.contains('screen-desaturate--heavy')).toBe(true);
		expect(overlay?.classList.contains('screen-desaturate--active')).toBe(true);
	});

	it('shakeScreen adds and removes body shake classes', () => {
		shakeScreen('light');
		expect(document.body.classList.contains('screen-shake--light')).toBe(true);
		vi.advanceTimersByTime(400);
		expect(document.body.classList.contains('screen-shake--light')).toBe(false);
	});
});
