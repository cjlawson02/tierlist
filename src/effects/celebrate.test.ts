import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	celebrateSlideshowSlide,
	celebrateTier,
	stopSlideshowConfetti,
} from './celebrate';
import { mockReducedMotion } from '../test/helpers';

const confettiMock = vi.hoisted(() => vi.fn());

vi.mock('canvas-confetti', () => ({
	default: confettiMock,
}));

describe('celebrate', () => {
	beforeEach(() => {
		confettiMock.mockClear();
		mockReducedMotion(false);
		document.body.innerHTML = '';
	});

	it('celebrateTier fires confetti for top tiers', async () => {
		await celebrateTier('#ff0000', 0, 6);
		expect(confettiMock).toHaveBeenCalled();
	});

	it('celebrateTier skips confetti particles for low tiers', async () => {
		await celebrateTier('#ff0000', 5, 6);
		expect(confettiMock).not.toHaveBeenCalled();
	});

	it('celebrateTier skips everything when reduced motion is preferred', async () => {
		mockReducedMotion(true);
		await celebrateTier('#ff0000', 0, 6);
		expect(confettiMock).not.toHaveBeenCalled();
	});

	it('celebrateSlideshowSlide runs for elite tiers', async () => {
		await celebrateSlideshowSlide('#ff0000', 0, 6);
		expect(confettiMock).toHaveBeenCalled();
	});

	it('stopSlideshowConfetti is safe to call repeatedly', () => {
		expect(() => {
			stopSlideshowConfetti();
			stopSlideshowConfetti();
		}).not.toThrow();
	});
});
