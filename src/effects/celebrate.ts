import type confetti from 'canvas-confetti';
import {
	getDisappointmentTone,
	getTierEffectForRank,
	getTierRank,
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

function sadColors(color: string): string[] {
	return [muteColor(color, 0.55), '#777788', '#555566', '#444450'];
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

async function fireFizzle(color: string): Promise<void> {
	const fire = await getConfetti();
	if (!fire) {
		return;
	}
	const colors = [...sadColors(color), '#666677'];
	void fire({
		particleCount: 18,
		spread: 55,
		startVelocity: 18,
		gravity: 1.6,
		scalar: 0.55,
		ticks: 50,
		decay: 0.92,
		colors,
		origin: { y: 0.55, x: 0.5 },
		disableForReducedMotion: true,
	});
	window.setTimeout(() => {
		void fire({
			particleCount: 12,
			angle: 270,
			spread: 25,
			startVelocity: 6,
			gravity: 1.8,
			scalar: 0.45,
			ticks: 40,
			colors: ['#888899', '#666677'],
			origin: { y: 0.45, x: 0.5 },
			disableForReducedMotion: true,
		});
	}, 120);
}

async function fireRain(
	color: string,
	intensity: 'droop' | 'devastating',
): Promise<void> {
	const fire = await getConfetti();
	if (!fire) {
		return;
	}
	const gray = sadColors(color);
	const bursts = intensity === 'devastating' ? 5 : 2;
	const particles = intensity === 'devastating' ? 45 : 22;
	for (let i = 0; i < bursts; i++) {
		window.setTimeout(
			() => {
				void fire({
					particleCount: particles,
					angle: 270,
					spread: intensity === 'devastating' ? 45 : 30,
					startVelocity: intensity === 'devastating' ? 20 : 14,
					gravity: 1.5,
					drift: (Math.random() - 0.5) * 2,
					scalar: 0.75,
					colors: gray,
					origin: { x: 0.1 + Math.random() * 0.8, y: -0.05 },
					disableForReducedMotion: true,
				});
			},
			i * (intensity === 'devastating' ? 90 : 130),
		);
	}
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
	const effect = getTierEffectForRank(tierIndex, totalTiers);
	const rank = getTierRank(tierIndex, totalTiers);
	const washColor = rank >= 0.5 ? muteColor(color, 0.45 + rank * 0.35) : color;

	flashTierColor(washColor, washForRank(tierIndex, totalTiers));

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
		case 'fizzle':
			await fireFizzle(color);
			break;
		case 'wilt':
			desaturateScreen('light');
			break;
		case 'droop':
			desaturateScreen('medium');
			shakeScreen('light');
			await fireRain(color, 'droop');
			break;
		case 'rain':
			desaturateScreen('heavy');
			shakeScreen('heavy');
			await fireRain(color, 'devastating');
			break;
	}
}
