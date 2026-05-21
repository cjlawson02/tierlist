import type confetti from 'canvas-confetti';
import {
	getDisappointmentTone,
	getTierEffectForRank,
	getTierRank,
	shouldFireConfetti,
} from '../presentationConfig';
import {
	desaturateScreen,
	flashTierColor,
	shakeScreen,
	type WashIntensity,
} from './screenFlash';

function prefersReducedMotion(): boolean {
	return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

let confettiFire: typeof confetti | null = null;

async function getConfetti(): Promise<typeof confetti | null> {
	if (prefersReducedMotion()) {
		return null;
	}
	if (!confettiFire) {
		const mod = await import('canvas-confetti');
		confettiFire = mod.default;
	}
	return confettiFire;
}

function hexToRgb(hex: string): [number, number, number] {
	const h = hex.replace('#', '');
	const n =
		h.length === 3
			? h
					.split('')
					.map((c) => c + c)
					.join('')
			: h;
	const num = Number.parseInt(n, 16);
	return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function lighten(hex: string, amount: number): string {
	const [r, g, b] = hexToRgb(hex);
	const mix = (c: number) => Math.min(255, Math.round(c + (255 - c) * amount));
	return `rgb(${String(mix(r))}, ${String(mix(g))}, ${String(mix(b))})`;
}

function muteColor(hex: string, amount: number): string {
	const [r, g, b] = hexToRgb(hex);
	const mix = (c: number) => Math.round(c + (128 - c) * amount);
	return `rgb(${String(mix(r))}, ${String(mix(g))}, ${String(mix(b))})`;
}

function tierColors(color: string): string[] {
	return [color, lighten(color, 0.35), lighten(color, 0.6), '#ffffff'];
}

function washForRank(tierIndex: number, totalTiers: number): WashIntensity {
	const tone = getDisappointmentTone(tierIndex, totalTiers);
	switch (tone) {
		case 'celebrate':
			return 'celebrate';
		case 'positive':
		case 'neutral':
			return 'normal';
		case 'meh':
		case 'dull':
			return 'dull';
		case 'sad':
		case 'devastating':
			return 'somber';
	}
}

async function clearConfetti(): Promise<void> {
	const fire = await getConfetti();
	fire?.reset();
}

async function fireConfetti(
	color: string,
	intensity: 'hero' | 'normal' | 'subtle',
): Promise<void> {
	const fire = await getConfetti();
	if (!fire) {
		return;
	}
	const colors = tierColors(color);
	const base = {
		colors,
		disableForReducedMotion: true,
		origin: { y: 0.72, x: 0.5 },
	};
	if (intensity === 'hero') {
		void fire({
			...base,
			particleCount: 220,
			spread: 100,
			startVelocity: 48,
			scalar: 1.25,
		});
		void fire({
			...base,
			particleCount: 160,
			spread: 130,
			startVelocity: 58,
			scalar: 1.1,
		});
		window.setTimeout(() => {
			void fire({
				...base,
				particleCount: 100,
				spread: 150,
				startVelocity: 36,
				scalar: 0.95,
			});
		}, 140);
		return;
	}
	if (intensity === 'normal') {
		void fire({
			...base,
			particleCount: 90,
			spread: 80,
			startVelocity: 38,
			scalar: 1.05,
		});
		void fire({
			...base,
			particleCount: 50,
			spread: 100,
			startVelocity: 28,
			scalar: 0.9,
		});
		return;
	}
	void fire({
		...base,
		particleCount: 35,
		spread: 60,
		startVelocity: 22,
		scalar: 0.85,
	});
}

async function fireSparkle(color: string): Promise<void> {
	const fire = await getConfetti();
	if (!fire) {
		return;
	}
	const colors = tierColors(color);
	void fire({
		particleCount: 60,
		spread: 70,
		startVelocity: 25,
		scalar: 0.7,
		ticks: 120,
		gravity: 0.6,
		colors,
		origin: { y: 0.65, x: 0.5 },
		disableForReducedMotion: true,
	});
	void fire({
		particleCount: 30,
		spread: 100,
		startVelocity: 15,
		scalar: 0.5,
		ticks: 80,
		colors: ['#ffffff', ...colors],
		origin: { y: 0.5, x: 0.3 },
		disableForReducedMotion: true,
	});
	void fire({
		particleCount: 30,
		spread: 100,
		startVelocity: 15,
		scalar: 0.5,
		ticks: 80,
		colors: ['#ffffff', ...colors],
		origin: { y: 0.5, x: 0.7 },
		disableForReducedMotion: true,
	});
}

let slideshowConfettiTimer: number | null = null;

export function stopSlideshowConfetti(): void {
	if (slideshowConfettiTimer != null) {
		window.clearInterval(slideshowConfettiTimer);
		slideshowConfettiTimer = null;
	}
}

export async function celebrateSlideshowSlide(
	color: string,
	tierIndex: number,
	totalTiers: number,
): Promise<void> {
	if (prefersReducedMotion()) {
		return;
	}

	stopSlideshowConfetti();
	slideshowConfettiTimer = window.setInterval(() => {
		void fireConfetti(color, 'subtle');
	}, 1100);

	const tone = getDisappointmentTone(tierIndex, totalTiers);
	if (tone === 'celebrate') {
		await fireConfetti(color, 'hero');
		return;
	}
	await fireSparkle(color);
}

export async function celebrateTier(
	color: string,
	tierIndex: number,
	totalTiers: number,
): Promise<void> {
	if (prefersReducedMotion()) {
		return;
	}
	if (!shouldFireConfetti(tierIndex, totalTiers)) {
		await clearConfetti();
	}
	const effect = getTierEffectForRank(tierIndex, totalTiers);
	const rank = getTierRank(tierIndex, totalTiers);
	const washColor = rank >= 0.5 ? muteColor(color, 0.45 + rank * 0.35) : color;

	flashTierColor(washColor, washForRank(tierIndex, totalTiers));

	if (!shouldFireConfetti(tierIndex, totalTiers)) {
		await clearConfetti();
	} else {
		switch (effect) {
			case 'confetti':
				await fireConfetti(color, 'hero');
				break;
			case 'sparkle':
				await fireSparkle(color);
				break;
			case 'burst':
				await fireConfetti(color, 'normal');
				break;
		}
	}

	switch (effect) {
		case 'wilt':
			desaturateScreen('light');
			break;
		case 'fizzle':
			break;
		case 'droop':
			desaturateScreen('medium');
			shakeScreen('light');
			break;
		case 'rain':
			desaturateScreen('heavy');
			shakeScreen('heavy');
			break;
	}
}
