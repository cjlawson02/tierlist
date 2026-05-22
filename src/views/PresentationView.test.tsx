import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import PresentationView from './PresentationView';
import { renderWithProviders, screen, waitFor, within } from '../test/render';
import { DATA_IMAGE_PNG } from '../test/fixtures';
import { getSetupStoreState } from '../test/store';
import { QUEUE } from '../presentationConfig';

vi.mock('../effects/celebrate', () => ({
	celebrateTier: vi.fn().mockResolvedValue(undefined),
	celebrateSlideshowSlide: vi.fn().mockResolvedValue(undefined),
	stopSlideshowConfetti: vi.fn(),
}));

const saveTierListImage = vi.hoisted(() =>
	vi.fn<typeof import('../exportImage').saveTierListImage>(),
);

vi.mock('../exportImage', () => ({
	saveTierListImage: saveTierListImage,
}));

describe('PresentationView', () => {
	beforeEach(() => {
		vi.useFakeTimers({ shouldAdvanceTime: true });
		getSetupStoreState().addImages([DATA_IMAGE_PNG]);
		saveTierListImage.mockReset();
		saveTierListImage.mockResolvedValue(undefined);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('auto-opens the first photo and assigns it from the queue', async () => {
		const { user } = renderWithProviders(
			<PresentationView onExitSetup={vi.fn()} />,
			{ userEvent: { advanceTimers: vi.advanceTimersByTime } },
		);

		const dialog = await screen.findByRole('dialog', { name: /Photo 1 of 1/i });
		expect(within(dialog).getByRole('progressbar')).toBeInTheDocument();
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

	it('pauses when the spotlight is dismissed and resumes from the top bar', async () => {
		const { user } = renderWithProviders(
			<PresentationView onExitSetup={vi.fn()} />,
			{ userEvent: { advanceTimers: vi.advanceTimersByTime } },
		);

		await screen.findByRole('dialog', { name: /Photo 1 of 1/i });
		await user.click(screen.getByRole('button', { name: 'Go to tier list' }));

		const resumeButton = screen.getByRole('button', { name: 'Resume' });
		expect(resumeButton).toBeInTheDocument();
		await user.click(resumeButton);

		expect(
			await screen.findByRole('dialog', { name: /Photo 1 of 1/i }),
		).toBeInTheDocument();
	});

	it('shows the combined finale carousel screen after all images are assigned', async () => {
		const { user } = renderWithProviders(
			<PresentationView onExitSetup={vi.fn()} />,
			{ userEvent: { advanceTimers: vi.advanceTimersByTime } },
		);

		await screen.findByRole('dialog', { name: /Photo 1 of 1/i });
		await user.click(screen.getByRole('button', { name: 'S' }));

		await vi.advanceTimersByTimeAsync(800);

		expect(
			await screen.findByRole('dialog', { name: /Finale carousel/i }),
		).toBeInTheDocument();
	});

	it('runs the finale carousel and then closes it', async () => {
		const { user } = renderWithProviders(
			<PresentationView onExitSetup={vi.fn()} />,
			{ userEvent: { advanceTimers: vi.advanceTimersByTime } },
		);

		await screen.findByRole('dialog', { name: /Photo 1 of 1/i });
		await user.click(screen.getByRole('button', { name: 'S' }));
		await vi.advanceTimersByTimeAsync(800);

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

	it('calls onExitSetup when Back to photos is clicked', async () => {
		const onExitSetup = vi.fn();
		const { user } = renderWithProviders(
			<PresentationView onExitSetup={onExitSetup} />,
			{ userEvent: { advanceTimers: vi.advanceTimersByTime } },
		);

		const spotlight = await screen.findByRole('dialog', { name: /Photo 1 of 1/i });
		expect(
			screen.queryByRole('button', { name: 'Back to photos' }),
		).not.toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Go to tier list' })).toBeInTheDocument();

		await user.click(spotlight);
		await user.click(screen.getByRole('button', { name: 'Back to photos' }));
		expect(onExitSetup).toHaveBeenCalledTimes(1);
	});

	it('does not show save image until all photos are tiered', async () => {
		getSetupStoreState().addImages([DATA_IMAGE_PNG]);

		const { user } = renderWithProviders(
			<PresentationView onExitSetup={vi.fn()} />,
			{ userEvent: { advanceTimers: vi.advanceTimersByTime } },
		);

		await screen.findByRole('dialog', { name: /Photo 1 of 2/i });
		expect(
			screen.queryByRole('button', { name: 'Download image' }),
		).not.toBeInTheDocument();

		await user.click(screen.getByRole('button', { name: 'S' }));
		await vi.advanceTimersByTimeAsync(520 + QUEUE.pauseAfterAssignmentMs);
		await screen.findByRole('dialog', { name: /Photo 2 of 2/i });
		expect(
			screen.queryByRole('button', { name: 'Download image' }),
		).not.toBeInTheDocument();
	});

	it('saves a tier list image after all photos are assigned', async () => {
		const { user } = renderWithProviders(
			<PresentationView onExitSetup={vi.fn()} />,
			{ userEvent: { advanceTimers: vi.advanceTimersByTime } },
		);

		await screen.findByRole('dialog', { name: /Photo 1 of 1/i });
		await user.click(screen.getByRole('button', { name: 'S' }));

		await waitFor(() => {
			expect(
				screen.getByRole('button', { name: 'Download image' }),
			).not.toBeDisabled();
		});

		await user.click(screen.getByRole('button', { name: 'Download image' }));

		await waitFor(() => {
			expect(saveTierListImage).toHaveBeenCalledTimes(1);
		});
		expect(await screen.findByRole('status')).toHaveTextContent(
			'Downloaded tier list image',
		);
	});

	it('offers save image from the finale carousel screen', async () => {
		const { user } = renderWithProviders(
			<PresentationView onExitSetup={vi.fn()} />,
			{ userEvent: { advanceTimers: vi.advanceTimersByTime } },
		);

		await screen.findByRole('dialog', { name: /Photo 1 of 1/i });
		await user.click(screen.getByRole('button', { name: 'S' }));
		await vi.advanceTimersByTimeAsync(800);

		const finale = await screen.findByRole('dialog', {
			name: /Finale carousel/i,
		});

		await user.click(
			within(finale).getByRole('button', { name: 'Download image' }),
		);

		await waitFor(() => {
			expect(saveTierListImage).toHaveBeenCalledTimes(1);
		});
	});
});
