import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

vi.mock('zustand');

class MockAudioContext {
	state: AudioContextState = 'running';
	currentTime = 0;
	destination = {};
	sampleRate = 44_100;
	createOscillator = vi.fn(() => ({
		type: 'sine',
		frequency: {
			value: 440,
			setValueAtTime: vi.fn(),
			exponentialRampToValueAtTime: vi.fn(),
		},
		connect: vi.fn(),
		start: vi.fn(),
		stop: vi.fn(),
	}));
	createGain = vi.fn(() => ({
		gain: {
			value: 0,
			setValueAtTime: vi.fn(),
			exponentialRampToValueAtTime: vi.fn(),
			linearRampToValueAtTime: vi.fn(),
		},
		connect: vi.fn(),
	}));
	createBuffer = vi.fn((_channels: number, length: number) => ({
		getChannelData: () => new Float32Array(length),
	}));
	createBufferSource = vi.fn(() => ({
		buffer: null,
		connect: vi.fn(),
		start: vi.fn(),
		stop: vi.fn(),
	}));
	createBiquadFilter = vi.fn(() => ({
		type: 'bandpass',
		frequency: {
			value: 800,
			setValueAtTime: vi.fn(),
			exponentialRampToValueAtTime: vi.fn(),
		},
		Q: { value: 0.6 },
		connect: vi.fn(),
	}));
	resume = vi.fn().mockResolvedValue(undefined);
}

vi.stubGlobal('AudioContext', MockAudioContext);

class MockResizeObserver {
	observe = vi.fn();
	unobserve = vi.fn();
	disconnect = vi.fn();
}

vi.stubGlobal('ResizeObserver', MockResizeObserver);

class MockIntersectionObserver {
	observe = vi.fn();
	unobserve = vi.fn();
	disconnect = vi.fn();
	takeRecords = vi.fn(() => []);
	root = null;
	rootMargin = '0px';
	thresholds = [0];
}

vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);

afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
	localStorage.clear();
	sessionStorage.clear();
	vi.stubGlobal('AudioContext', MockAudioContext);
	vi.stubGlobal('ResizeObserver', MockResizeObserver);
	vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
	Object.defineProperty(window, 'matchMedia', {
		writable: true,
		value: vi.fn().mockImplementation((query: string) => ({
			matches: false,
			media: query,
			onchange: null,
			addListener: vi.fn(),
			removeListener: vi.fn(),
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			dispatchEvent: vi.fn(),
		})),
	});
});

Object.defineProperty(window, 'matchMedia', {
	writable: true,
	value: vi.fn().mockImplementation((query: string) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: vi.fn(),
		removeListener: vi.fn(),
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn(),
	})),
});
