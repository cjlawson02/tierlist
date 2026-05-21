import { describe, expect, it, vi } from 'vitest';
import {
	getDisappointmentTone,
	getEliteFinaleLabel,
	getLowerThirdLabel,
	getTierEffectForRank,
	getTierRank,
	isEliteTier,
	PRESENTATION_TIERS,
	shouldFireConfetti,
} from './presentationConfig';

describe('getTierRank', () => {
	it('returns 0 for a single tier', () => {
		expect(getTierRank(0, 1)).toBe(0);
	});

	it('maps first and last tiers to 0 and 1', () => {
		expect(getTierRank(0, 6)).toBe(0);
		expect(getTierRank(5, 6)).toBe(1);
	});
});

describe('presentationConfig tone ladder', () => {
	it('maps default tiers 1:1 onto six tones', () => {
		expect(PRESENTATION_TIERS).toHaveLength(6);
		expect(getDisappointmentTone(0, 6)).toBe('celebrate');
		expect(getDisappointmentTone(1, 6)).toBe('positive');
		expect(getDisappointmentTone(2, 6)).toBe('neutral');
		expect(getDisappointmentTone(3, 6)).toBe('meh');
		expect(getDisappointmentTone(4, 6)).toBe('sad');
		expect(getDisappointmentTone(5, 6)).toBe('devastating');
	});

	it('maps tones to tier effects', () => {
		expect(getTierEffectForRank(0, 6)).toBe('confetti');
		expect(getTierEffectForRank(3, 6)).toBe('fizzle');
		expect(getTierEffectForRank(5, 6)).toBe('rain');
	});
});

describe('shouldFireConfetti', () => {
	it('fires for top three tones only', () => {
		expect(shouldFireConfetti(0, 6)).toBe(true);
		expect(shouldFireConfetti(2, 6)).toBe(true);
		expect(shouldFireConfetti(3, 6)).toBe(false);
		expect(shouldFireConfetti(5, 6)).toBe(false);
	});
});

describe('isEliteTier', () => {
	it('identifies S and A tier equivalents', () => {
		expect(isEliteTier(0, 6)).toBe(true);
		expect(isEliteTier(1, 6)).toBe(true);
		expect(isEliteTier(2, 6)).toBe(false);
	});
});

describe('label pickers', () => {
	it('getLowerThirdLabel returns a label for each tone', () => {
		vi.spyOn(Math, 'random').mockReturnValue(0);
		expect(getLowerThirdLabel('celebrate')).toBe('Crowned as');
		expect(getLowerThirdLabel('devastating')).toBe('Oof —');
	});

	it('getEliteFinaleLabel returns elite labels for top tiers', () => {
		vi.spyOn(Math, 'random').mockReturnValue(0);
		expect(getEliteFinaleLabel(0, 6)).toBe('The crown jewels');
		expect(getEliteFinaleLabel(1, 6)).toBe('Honorable mentions');
		expect(getEliteFinaleLabel(3, 6)).toBe('Best of the best');
	});
});
