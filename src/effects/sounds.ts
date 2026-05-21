import { getTierRank, SOUND_MUTE_KEY } from '../presentationConfig';

let ctx: AudioContext | null = null;
let pendingTimers: number[] = [];

function isMuted(): boolean {
	try {
		return localStorage.getItem(SOUND_MUTE_KEY) === '1';
	} catch {
		return false;
	}
}

export function setSoundMuted(muted: boolean): void {
	try {
		localStorage.setItem(SOUND_MUTE_KEY, muted ? '1' : '0');
	} catch {
		/* ignore */
	}
	if (muted) {
		stopAllSounds();
	}
}

export function getSoundMuted(): boolean {
	return isMuted();
}

export async function resumeAudioContext(): Promise<void> {
	if (isMuted()) {
		return;
	}
	ctx ??= new AudioContext();
	if (ctx.state === 'suspended') {
		await ctx.resume();
	}
}

function getCtx(): AudioContext | null {
	if (isMuted()) {
		return null;
	}
	ctx ??= new AudioContext();
	return ctx;
}

function scheduleTimeout(callback: () => void, delayMs: number): void {
	const id = window.setTimeout(() => {
		pendingTimers = pendingTimers.filter((timerId) => timerId !== id);
		if (isMuted()) {
			return;
		}
		callback();
	}, delayMs);
	pendingTimers.push(id);
}

function tone(
	frequency: number,
	duration: number,
	type: OscillatorType = 'sine',
	gain = 0.08,
	ramp: 'down' | 'up' | 'flat' = 'down',
): void {
	const audio = getCtx();
	if (audio?.state !== 'running') {
		return;
	}
	const osc = audio.createOscillator();
	const g = audio.createGain();
	osc.type = type;
	osc.frequency.value = frequency;
	g.gain.value = gain;
	osc.connect(g);
	g.connect(audio.destination);
	const now = audio.currentTime;
	if (ramp === 'down') {
		g.gain.setValueAtTime(gain, now);
		g.gain.exponentialRampToValueAtTime(0.001, now + duration);
	} else if (ramp === 'up') {
		g.gain.setValueAtTime(0.001, now);
		g.gain.exponentialRampToValueAtTime(gain, now + duration * 0.15);
		g.gain.exponentialRampToValueAtTime(0.001, now + duration);
	} else {
		g.gain.setValueAtTime(gain * 0.7, now);
		g.gain.linearRampToValueAtTime(gain * 0.5, now + duration * 0.6);
		g.gain.exponentialRampToValueAtTime(0.001, now + duration);
	}
	osc.start(now);
	osc.stop(now + duration + 0.02);
}

function slideTone(
	from: number,
	to: number,
	duration: number,
	type: OscillatorType = 'sawtooth',
	gain = 0.05,
): void {
	const audio = getCtx();
	if (audio?.state !== 'running') {
		return;
	}
	const osc = audio.createOscillator();
	const g = audio.createGain();
	osc.type = type;
	osc.frequency.setValueAtTime(from, audio.currentTime);
	osc.frequency.exponentialRampToValueAtTime(
		Math.max(to, 40),
		audio.currentTime + duration,
	);
	g.gain.setValueAtTime(gain, audio.currentTime);
	g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration);
	osc.connect(g);
	g.connect(audio.destination);
	osc.start();
	osc.stop(audio.currentTime + duration + 0.02);
}

function noiseSweep(duration = 0.18): void {
	const audio = getCtx();
	if (audio?.state !== 'running') {
		return;
	}
	const bufferSize = audio.sampleRate * duration;
	const buffer = audio.createBuffer(1, bufferSize, audio.sampleRate);
	const data = buffer.getChannelData(0);
	for (let i = 0; i < bufferSize; i++) {
		data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
	}
	const source = audio.createBufferSource();
	source.buffer = buffer;
	const filter = audio.createBiquadFilter();
	filter.type = 'bandpass';
	filter.frequency.value = 800;
	filter.Q.value = 0.6;
	const g = audio.createGain();
	g.gain.value = 0.06;
	source.connect(filter);
	filter.connect(g);
	g.connect(audio.destination);
	const now = audio.currentTime;
	filter.frequency.setValueAtTime(1200, now);
	filter.frequency.exponentialRampToValueAtTime(180, now + duration);
	g.gain.exponentialRampToValueAtTime(0.001, now + duration);
	source.start(now);
	source.stop(now + duration + 0.02);
}

export function stopAllSounds(): void {
	for (const id of pendingTimers) {
		window.clearTimeout(id);
	}
	pendingTimers = [];
	stopEliteSlideshowMusic();
}

export function playSpotlightOpen(): void {
	noiseSweep(0.14);
}

export function playTierAssign(tierIndex: number, totalTiers: number): void {
	const rank = getTierRank(tierIndex, totalTiers);

	if (rank <= 0) {
		[523, 659, 784, 1047].forEach((f, i) => {
			scheduleTimeout(() => {
				tone(f, 0.22, 'triangle', 0.09);
			}, i * 70);
		});
		return;
	}
	if (rank <= 1 / 6) {
		tone(880, 0.12, 'sine', 0.07);
		scheduleTimeout(() => {
			tone(1175, 0.15, 'sine', 0.06);
		}, 60);
		return;
	}
	if (rank <= 2 / 6) {
		tone(523, 0.12, 'sine', 0.055);
		return;
	}
	if (rank <= 3 / 6) {
		tone(349, 0.28, 'triangle', 0.045, 'flat');
		scheduleTimeout(() => {
			slideTone(280, 220, 0.35, 'triangle', 0.035);
		}, 80);
		return;
	}
	if (rank <= 4 / 6) {
		tone(294, 0.32, 'sawtooth', 0.05);
		scheduleTimeout(() => {
			tone(247, 0.38, 'sawtooth', 0.045);
		}, 110);
		return;
	}
	if (rank <= 5 / 6) {
		tone(220, 0.38, 'sawtooth', 0.055);
		scheduleTimeout(() => {
			tone(165, 0.45, 'sawtooth', 0.05);
		}, 130);
		scheduleTimeout(() => {
			slideTone(180, 120, 0.5, 'sawtooth', 0.04);
		}, 280);
		return;
	}
	tone(196, 0.42, 'sawtooth', 0.06);
	scheduleTimeout(() => {
		tone(147, 0.55, 'sawtooth', 0.055);
	}, 160);
	scheduleTimeout(() => {
		slideTone(155, 82, 0.65, 'square', 0.035);
	}, 320);
	scheduleTimeout(() => {
		tone(98, 0.35, 'sawtooth', 0.04);
	}, 520);
}

const SLIDESHOW_CHORDS = [
	[523, 659, 784],
	[587, 740, 880],
	[659, 831, 988],
	[698, 880, 1047],
] as const;

let slideshowMusicTimer: number | null = null;
let slideshowMusicStep = 0;

export function startEliteSlideshowMusic(): void {
	stopEliteSlideshowMusic();
	const playStep = () => {
		const chord =
			SLIDESHOW_CHORDS[slideshowMusicStep % SLIDESHOW_CHORDS.length];
		chord.forEach((frequency, index) => {
			scheduleTimeout(() => {
				tone(frequency, 0.55, 'triangle', 0.045, 'flat');
			}, index * 40);
		});
		slideshowMusicStep += 1;
	};
	playStep();
	slideshowMusicTimer = window.setInterval(playStep, 720);
}

export function stopEliteSlideshowMusic(): void {
	if (slideshowMusicTimer != null) {
		window.clearInterval(slideshowMusicTimer);
		slideshowMusicTimer = null;
	}
	slideshowMusicStep = 0;
}

export function playLanding(tierIndex: number, totalTiers: number): void {
	const rank = getTierRank(tierIndex, totalTiers);
	if (rank <= 2 / 6) {
		tone(320, 0.06, 'sine', 0.04);
		return;
	}
	if (rank <= 4 / 6) {
		tone(220, 0.09, 'triangle', 0.035);
		return;
	}
	tone(110, 0.14, 'sawtooth', 0.045);
	scheduleTimeout(() => {
		tone(82, 0.1, 'sawtooth', 0.03);
	}, 60);
}
