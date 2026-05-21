function prefersReducedMotion(): boolean {
	return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

let washEl: HTMLDivElement | null = null;
let desaturateEl: HTMLDivElement | null = null;

let washGeneration = 0;
let washTimer: number | null = null;
let desaturateGeneration = 0;
let desaturateTimer: number | null = null;
let shakeGeneration = 0;
let shakeTimer: number | null = null;
let shakeIntensity: 'light' | 'normal' | 'heavy' | null = null;

/** Shake #root so fixed portals on body (spotlight, overlays) stay anchored on iOS. */
function getShakeTarget(): HTMLElement {
	return document.getElementById('root') ?? document.body;
}

function getWashEl(): HTMLDivElement {
	if (!washEl) {
		washEl = document.createElement('div');
		washEl.className = 'screen-color-wash';
		washEl.setAttribute('aria-hidden', 'true');
		document.body.appendChild(washEl);
	}
	return washEl;
}

function getDesaturateEl(): HTMLDivElement {
	if (!desaturateEl) {
		desaturateEl = document.createElement('div');
		desaturateEl.className = 'screen-desaturate';
		desaturateEl.setAttribute('aria-hidden', 'true');
		document.body.appendChild(desaturateEl);
	}
	return desaturateEl;
}

export type WashIntensity = 'celebrate' | 'normal' | 'dull' | 'somber';

export function flashTierColor(
	color: string,
	intensity: WashIntensity = 'normal',
): void {
	if (prefersReducedMotion()) {
		return;
	}
	const el = getWashEl();
	el.style.setProperty('--wash-color', color);
	el.classList.remove(
		'screen-color-wash--active',
		'screen-color-wash--strong',
		'screen-color-wash--dull',
		'screen-color-wash--somber',
	);
	void el.offsetWidth;
	el.classList.add('screen-color-wash--active');
	if (intensity === 'celebrate') {
		el.classList.add('screen-color-wash--strong');
	}
	if (intensity === 'dull') {
		el.classList.add('screen-color-wash--dull');
	}
	if (intensity === 'somber') {
		el.classList.add('screen-color-wash--somber');
	}
	const duration =
		intensity === 'celebrate'
			? 520
			: intensity === 'somber'
				? 420
				: intensity === 'dull'
					? 420
					: 380;
	if (washTimer != null) {
		window.clearTimeout(washTimer);
	}
	washGeneration += 1;
	const generation = washGeneration;
	washTimer = window.setTimeout(() => {
		if (generation !== washGeneration) {
			return;
		}
		el.classList.remove(
			'screen-color-wash--active',
			'screen-color-wash--strong',
			'screen-color-wash--dull',
			'screen-color-wash--somber',
		);
		washTimer = null;
	}, duration);
}

export function desaturateScreen(severity: 'light' | 'medium' | 'heavy'): void {
	if (prefersReducedMotion()) {
		return;
	}
	const el = getDesaturateEl();
	el.classList.remove(
		'screen-desaturate--light',
		'screen-desaturate--medium',
		'screen-desaturate--heavy',
	);
	void el.offsetWidth;
	el.classList.add(
		`screen-desaturate--${severity}`,
		'screen-desaturate--active',
	);
	const ms = severity === 'heavy' ? 720 : severity === 'medium' ? 520 : 380;
	if (desaturateTimer != null) {
		window.clearTimeout(desaturateTimer);
	}
	desaturateGeneration += 1;
	const generation = desaturateGeneration;
	desaturateTimer = window.setTimeout(() => {
		if (generation !== desaturateGeneration) {
			return;
		}
		el.classList.remove(
			'screen-desaturate--light',
			'screen-desaturate--medium',
			'screen-desaturate--heavy',
			'screen-desaturate--active',
		);
		desaturateTimer = null;
	}, ms);
}

export function shakeScreen(
	intensity: 'light' | 'normal' | 'heavy' = 'normal',
): void {
	if (prefersReducedMotion()) {
		return;
	}
	const target = getShakeTarget();
	if (shakeIntensity != null) {
		target.classList.remove(`screen-shake--${shakeIntensity}`);
	}
	target.classList.add(`screen-shake--${intensity}`);
	shakeIntensity = intensity;
	const ms = intensity === 'heavy' ? 580 : intensity === 'light' ? 320 : 480;
	if (shakeTimer != null) {
		window.clearTimeout(shakeTimer);
	}
	shakeGeneration += 1;
	const generation = shakeGeneration;
	shakeTimer = window.setTimeout(() => {
		if (generation !== shakeGeneration) {
			return;
		}
		if (shakeIntensity != null) {
			getShakeTarget().classList.remove(`screen-shake--${shakeIntensity}`);
			shakeIntensity = null;
		}
		shakeTimer = null;
	}, ms);
}
