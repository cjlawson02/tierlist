import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import PresentationView from './PresentationView';
import { renderWithProviders, screen, waitFor } from '../test/render';
import { DATA_IMAGE_PNG } from '../test/fixtures';
import { getSetupStoreState } from '../test/store';
import { QUEUE } from '../presentationConfig';

vi.mock('../effects/celebrate', () => ({
	celebrateTier: vi.fn().mockResolvedValue(undefined),
	celebrateSlideshowSlide: vi.fn().mockResolvedValue(undefined),
	stopSlideshowConfetti: vi.fn(),
}));

describe('PresentationView', () => {
	beforeEach(() => {
		vi.useFakeTimers({ shouldAdvanceTime: true });
		getSetupStoreState().addImages([DATA_IMAGE_PNG]);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('auto-opens the first photo and assigns it from the queue', async () => {
		const { user } = renderWithProviders(
			<PresentationView onExitSetup={vi.fn()} />,
			{ userEvent: { advanceTimers: vi.advanceTimersByTime } },
		);

		await screen.findByRole('dialog', { name: /Photo 1 of 1/i });
		await user.click(screen.getByRole('button', { name: 'S' }));

		await waitFor(() => {
			expect(getSetupStoreState().untieredImages).toHaveLength(0);
		});
		expect(getSetupStoreState().rows[0]?.images).toHaveLength(1);
	});

	it('auto-advances to the next photo after assigning a tier', async () => {
		getSetupStoreState().addImages([DATA_IMAGE_PNG]);

		const { user } = renderWithProviders(
			<PresentationView onExitSetup={vi.fn()} />,
			{ userEvent: { advanceTimers: vi.advanceTimersByTime } },
		);

		await screen.findByRole('dialog', { name: /Photo 1 of 2/i });
		await user.click(screen.getByRole('button', { name: 'S' }));
		await vi.advanceTimersByTimeAsync(520 + QUEUE.pauseAfterAssignmentMs);

		expect(
			await screen.findByRole('dialog', { name: /Photo 2 of 2/i }),
		).toBeInTheDocument();
	});

	it('pauses when the spotlight is dismissed and resumes with Space', async () => {
		const { user } = renderWithProviders(
			<PresentationView onExitSetup={vi.fn()} />,
			{ userEvent: { advanceTimers: vi.advanceTimersByTime } },
		);

		const dialog = await screen.findByRole('dialog', { name: /Photo 1 of 1/i });
		await user.click(dialog);

		expect(await screen.findByText('Paused')).toBeInTheDocument();
		await user.keyboard(' ');

		expect(
			await screen.findByRole('dialog', { name: /Photo 1 of 1/i }),
		).toBeInTheDocument();
	});

	it('shows the finale overlay after all images are assigned', async () => {
		const { user } = renderWithProviders(
			<PresentationView onExitSetup={vi.fn()} />,
			{ userEvent: { advanceTimers: vi.advanceTimersByTime } },
		);

		await screen.findByRole('dialog', { name: /Photo 1 of 1/i });
		await user.click(screen.getByRole('button', { name: 'S' }));

		await vi.advanceTimersByTimeAsync(800);

		expect(
			await screen.findByRole('dialog', { name: /Tier List complete/i }),
		).toBeInTheDocument();
	});

	it('runs the finale carousel after continue and then closes it', async () => {
		const { user } = renderWithProviders(
			<PresentationView onExitSetup={vi.fn()} />,
			{ userEvent: { advanceTimers: vi.advanceTimersByTime } },
		);

		await screen.findByRole('dialog', { name: /Photo 1 of 1/i });
		await user.click(screen.getByRole('button', { name: 'S' }));
		await vi.advanceTimersByTimeAsync(800);

		await user.click(await screen.findByRole('button', { name: /Continue/i }));
		expect(
			await screen.findByRole('dialog', { name: /Finale carousel/i }),
		).toBeInTheDocument();

		await vi.advanceTimersByTimeAsync(20000);
		expect(
			screen.getByRole('dialog', { name: /Finale carousel/i }),
		).toBeInTheDocument();

		await user.keyboard('{Escape}');
		await waitFor(() => {
			expect(
				screen.queryByRole('dialog', { name: /Finale carousel/i }),
			).not.toBeInTheDocument();
		});
	});

	it('calls onExitSetup when Back to setup is clicked', async () => {
		const onExitSetup = vi.fn();
		const { user } = renderWithProviders(
			<PresentationView onExitSetup={onExitSetup} />,
			{ userEvent: { advanceTimers: vi.advanceTimersByTime } },
		);

		await user.click(screen.getByRole('button', { name: 'Back to setup' }));
		expect(onExitSetup).toHaveBeenCalledTimes(1);
	});
});
