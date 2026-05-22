import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SetupView from './SetupView';
import { renderWithProviders, screen, waitFor } from '../test/render';
import { DATA_IMAGE_PNG } from '../test/fixtures';
import { createBlobFile, mockFileReaderResult } from '../test/helpers';
import { getSetupStoreState } from '../test/store';

vi.mock('../effects/sounds', () => ({
	resumeAudioContext: vi.fn().mockResolvedValue(undefined),
	playSpotlightOpen: vi.fn(),
}));

describe('SetupView', () => {
	beforeEach(() => {
		vi.useFakeTimers({ shouldAdvanceTime: true });
		getSetupStoreState().addImages([DATA_IMAGE_PNG]);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('opens spotlight preview when a pool image is clicked', async () => {
		const { user } = renderWithProviders(
			<SetupView
				onStartPresentation={vi.fn()}
				onStartInspirationDemo={vi.fn().mockResolvedValue(undefined)}
			/>,
			{ userEvent: { advanceTimers: vi.advanceTimersByTime } },
		);

		await user.click(screen.getByRole('button', { name: 'View image' }));

		expect(
			await screen.findByRole('dialog', { name: /Image preview/i }),
		).toBeInTheDocument();

		await user.click(screen.getByRole('button', { name: 'Close preview' }));
		await waitFor(() => {
			expect(
				screen.queryByRole('dialog', { name: /Image preview/i }),
			).not.toBeInTheDocument();
		});
	});

	it('adds pasted images and shows a toast', async () => {
		mockFileReaderResult(DATA_IMAGE_PNG);
		renderWithProviders(
			<SetupView
				onStartPresentation={vi.fn()}
				onStartInspirationDemo={vi.fn().mockResolvedValue(undefined)}
			/>,
			{
				userEvent: { advanceTimers: vi.advanceTimersByTime },
			},
		);

		const file = createBlobFile('paste-image', 'pasted.png', 'image/png');
		const pasteEvent = new Event('paste', { bubbles: true, cancelable: true });
		Object.defineProperty(pasteEvent, 'clipboardData', {
			value: {
				items: [{ kind: 'file', getAsFile: () => file }],
			},
		});
		document.dispatchEvent(pasteEvent);
		await vi.waitFor(() => {
			expect(getSetupStoreState().untieredImages.length).toBeGreaterThan(1);
		});

		expect(await screen.findByRole('status')).toHaveTextContent(
			'Added 1 image(s)',
		);
	});

	it('clears the toast after three seconds', async () => {
		mockFileReaderResult(DATA_IMAGE_PNG);
		renderWithProviders(
			<SetupView
				onStartPresentation={vi.fn()}
				onStartInspirationDemo={vi.fn().mockResolvedValue(undefined)}
			/>,
			{
				userEvent: { advanceTimers: vi.advanceTimersByTime },
			},
		);

		const file = createBlobFile('paste-image', 'pasted.png', 'image/png');
		const pasteEvent = new Event('paste', { bubbles: true, cancelable: true });
		Object.defineProperty(pasteEvent, 'clipboardData', {
			value: {
				items: [{ kind: 'file', getAsFile: () => file }],
			},
		});
		document.dispatchEvent(pasteEvent);
		expect(await screen.findByRole('status')).toBeInTheDocument();

		await vi.advanceTimersByTimeAsync(3000);
		await waitFor(() => {
			expect(screen.queryByRole('status')).not.toBeInTheDocument();
		});
	});
});
