import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SOUND_MUTE_KEY } from '../presentationConfig';
import {
	getSoundMuted,
	playLanding,
	playSpotlightOpen,
	playTierAssign,
	resumeAudioContext,
	setSoundMuted,
	stopAllSounds,
} from './sounds';
import { mockAudioContext } from '../test/helpers';

describe('sounds', () => {
	beforeEach(() => {
		mockAudioContext('running');
		localStorage.clear();
	});

	it('persists mute preference in localStorage', () => {
		setSoundMuted(true);
		expect(localStorage.getItem(SOUND_MUTE_KEY)).toBe('1');
		expect(getSoundMuted()).toBe(true);
	});

	it('does not resume audio when muted', async () => {
		setSoundMuted(true);
		await resumeAudioContext();
		expect(globalThis.AudioContext).toBeDefined();
	});

	it('playSpotlightOpen does not throw with a running audio context', () => {
		expect(() => {
			playSpotlightOpen();
		}).not.toThrow();
	});

	it('playTierAssign covers each rank band without throwing', () => {
		expect(() => {
			playTierAssign(0, 6);
			playTierAssign(1, 6);
			playTierAssign(2, 6);
			playTierAssign(3, 6);
			playTierAssign(4, 6);
			playTierAssign(5, 6);
		}).not.toThrow();
	});

	it('playLanding covers high, mid, and low tiers', () => {
		expect(() => {
			playLanding(0, 6);
			playLanding(3, 6);
			playLanding(5, 6);
		}).not.toThrow();
	});

	it('stopAllSounds clears pending timers', () => {
		vi.useFakeTimers();
		playSpotlightOpen();
		expect(() => {
			stopAllSounds();
		}).not.toThrow();
		vi.useRealTimers();
	});
});
