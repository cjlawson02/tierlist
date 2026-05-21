export const PRESENTATION_TITLE = 'My Tier List';

export const PRESENTATION_TIERS = ['S', 'A', 'B', 'C', 'D', 'F'] as const;

export const BUNDLE_VERSION = 1;

export type TierEffectKind =
	| 'confetti'
	| 'sparkle'
	| 'burst'
	| 'fizzle'
	| 'wilt'
	| 'droop'
	| 'rain';

export const EFFECTS = {
	celebrateTiers: true,
	ambientBackground: true,
	sound: true,
	introSequence: true,
	broadcastMode: true,
} as const;

/** Live presentation queue — auto-reveal photos in order */
export const QUEUE = {
	/** Pause after tier landing animation before opening the next photo */
	pauseAfterAssignmentMs: 1000,
} as const;

export const BUNDLE_SIZE = {
	maxEntryMb: 4,
	maxPersistMb: 4,
} as const;

export const RECENT_TIERLISTS = {
	maxEntries: 10,
	ttlDays: 7,
	storageKey: 'tiers-recent-tierlists',
	storageVersion: 1,
} as const;

export const SOUND_MUTE_KEY = 'tiers-sound-muted';

export type DisappointmentTone =
	| 'celebrate'
	| 'positive'
	| 'neutral'
	| 'meh'
	| 'dull'
	| 'sad'
	| 'devastating';

/** Top tier → bottom tier; maps 1:1 onto default S–F rows */
const TONE_LADDER: DisappointmentTone[] = [
	'celebrate',
	'positive',
	'neutral',
	'meh',
	'sad',
	'devastating',
];

const TONE_TO_EFFECT: Record<DisappointmentTone, TierEffectKind> = {
	celebrate: 'confetti',
	positive: 'sparkle',
	neutral: 'burst',
	meh: 'fizzle',
	dull: 'wilt',
	sad: 'droop',
	devastating: 'rain',
};

const LOWER_THIRD_LABELS: Record<DisappointmentTone, readonly string[]> = {
	celebrate: [
		'Crowned as',
		'Peak placement —',
		'Elite tier —',
		'Certified goated —',
		'Hall of fame —',
		'No notes —',
	],
	positive: [
		'Solid pick —',
		'Strong showing —',
		'W tier energy —',
		'Respectable —',
		'Looking good —',
		'Big W —',
	],
	neutral: [
		'Ranked as',
		'Filed under',
		'Landed in',
		'Placed in',
		'Sorted into',
		'Slotted as',
	],
	meh: [
		'Settled for',
		'Settled at',
		'I guess…',
		'Eh,',
		'It is what it is —',
		'Could be worse —',
	],
	dull: [
		'Dropped to',
		'Fell to',
		'Downgraded to',
		'Slipping to',
		'Not great —',
		'Yikes,',
	],
	sad: [
		'Demoted to',
		'Reluctantly —',
		'Rough one —',
		'Big L —',
		'Sending to',
		'Pain —',
	],
	devastating: [
		'Oof —',
		'Yikes —',
		'RIP —',
		'Brutal —',
		'F in the chat —',
		'Absolutely cooked —',
	],
};

const ELITE_FINALE_LABELS: Record<'celebrate' | 'positive', readonly string[]> =
	{
		celebrate: [
			'The crown jewels',
			'Hall of fame',
			'Peak tier',
			'Certified elite',
			'The GOAT tier',
		],
		positive: [
			'Honorable mentions',
			'Strong contenders',
			'The A-list',
			'W tier energy',
			'Almost flawless',
		],
	};

/** 0 = top tier (best), 1 = bottom tier (worst) */
export function getTierRank(tierIndex: number, totalTiers: number): number {
	if (totalTiers <= 1) {
		return 0;
	}
	return tierIndex / (totalTiers - 1);
}

function getToneIndex(tierIndex: number, totalTiers: number): number {
	if (totalTiers <= 1) {
		return 0;
	}
	if (totalTiers === TONE_LADDER.length) {
		return Math.min(tierIndex, TONE_LADDER.length - 1);
	}
	return Math.min(
		TONE_LADDER.length - 1,
		Math.round((tierIndex / (totalTiers - 1)) * (TONE_LADDER.length - 1)),
	);
}

export function getDisappointmentTone(
	tierIndex: number,
	totalTiers: number,
): DisappointmentTone {
	return TONE_LADDER[getToneIndex(tierIndex, totalTiers)];
}

export function getTierEffectForRank(
	tierIndex: number,
	totalTiers: number,
): TierEffectKind {
	return TONE_TO_EFFECT[getDisappointmentTone(tierIndex, totalTiers)];
}

/** S/A/B only — C tier and below skip canvas-confetti particles */
export function shouldFireConfetti(
	tierIndex: number,
	totalTiers: number,
): boolean {
	const tone = getDisappointmentTone(tierIndex, totalTiers);
	return tone === 'celebrate' || tone === 'positive' || tone === 'neutral';
}

/** S and A tier equivalents (top two tones) */
export function isEliteTier(tierIndex: number, totalTiers: number): boolean {
	const tone = getDisappointmentTone(tierIndex, totalTiers);
	return tone === 'celebrate' || tone === 'positive';
}

export function getEliteFinaleLabel(
	tierIndex: number,
	totalTiers: number,
): string {
	const tone = getDisappointmentTone(tierIndex, totalTiers);
	if (tone !== 'celebrate' && tone !== 'positive') {
		return 'Best of the best';
	}
	const options = ELITE_FINALE_LABELS[tone];
	return options[Math.floor(Math.random() * options.length)];
}

export function getLowerThirdLabel(tone: DisappointmentTone): string {
	const options = LOWER_THIRD_LABELS[tone];
	return options[Math.floor(Math.random() * options.length)];
}
