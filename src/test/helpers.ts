import { vi } from 'vitest';

export function mockConfirm(answer: boolean) {
	return vi.spyOn(window, 'confirm').mockReturnValue(answer);
}

export function mockAlert() {
	return vi.spyOn(window, 'alert').mockImplementation(() => undefined);
}

export function createBlobFile(
	content: string | BlobPart[],
	name: string,
	type: string,
): File {
	const parts = Array.isArray(content) ? content : [content];
	return new File(parts, name, { type });
}

/** Stub FileReader for unit tests that bypass the real async reader. */
export function mockFileReaderResult(result: string | ArrayBuffer | null) {
	const loadListeners: ((event: ProgressEvent<FileReader>) => void)[] = [];

	class MockFileReader {
		result: string | ArrayBuffer | null = result;
		error: DOMException | null = null;
		onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => void) | null =
			null;
		onerror:
			| ((this: FileReader, ev: ProgressEvent<FileReader>) => void)
			| null = null;

		addEventListener(
			type: string,
			listener: (event: ProgressEvent<FileReader>) => void,
		) {
			if (type === 'load') {
				loadListeners.push(listener);
			}
		}

		readAsDataURL() {
			queueMicrotask(() => {
				for (const listener of loadListeners) {
					listener({} as ProgressEvent<FileReader>);
				}
				this.onload?.call(
					this as unknown as FileReader,
					{} as ProgressEvent<FileReader>,
				);
			});
		}

		readAsArrayBuffer() {
			this.readAsDataURL();
		}
	}

	vi.stubGlobal('FileReader', MockFileReader);
}

export function mockReducedMotion(matches = true) {
	window.matchMedia = vi.fn().mockImplementation((query: string) => ({
		matches: query === '(prefers-reduced-motion: reduce)' ? matches : false,
		media: query,
		onchange: null,
		addListener: vi.fn(),
		removeListener: vi.fn(),
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn(),
	}));
}

export function mockAudioContext(state: AudioContextState = 'running') {
	class MockOscillator {
		type: OscillatorType = 'sine';
		frequency = {
			value: 440,
			setValueAtTime: vi.fn(),
			exponentialRampToValueAtTime: vi.fn(),
		};
		connect = vi.fn();
		start = vi.fn();
		stop = vi.fn();
	}

	class MockGain {
		gain = {
			value: 0,
			setValueAtTime: vi.fn(),
			exponentialRampToValueAtTime: vi.fn(),
			linearRampToValueAtTime: vi.fn(),
		};
		connect = vi.fn();
	}

	class MockAudioContext {
		state = state;
		currentTime = 0;
		destination = {};
		sampleRate = 44_100;
		createOscillator = vi.fn(() => new MockOscillator());
		createGain = vi.fn(() => new MockGain());
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
}

export function mb(bytes: number): number {
	return bytes * 1024 * 1024;
}

export function mockDownloadAnchor() {
	const click = vi.fn();
	const anchor = {
		href: '',
		download: '',
		hidden: true,
		click,
		remove: vi.fn(),
	} as unknown as HTMLAnchorElement;
	const originalCreateElement = document.createElement.bind(document);

	vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
		if (tag === 'a') {
			return anchor;
		}
		return originalCreateElement(tag);
	});
	vi.spyOn(document.body, 'appendChild').mockImplementation(
		() => document.body,
	);
	vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');
	vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);

	return { click, anchor };
}
