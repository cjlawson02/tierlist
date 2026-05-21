import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import PresentationView from './PresentationView';
import { renderWithProviders, screen, waitFor } from '../test/render';
import { DATA_IMAGE_PNG } from '../test/fixtures';
import { getSetupStoreState } from '../test/store';

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

	it('assigns an image from the pool to a tier', async () => {
		const { user } = renderWithProviders(
			<PresentationView onExitSetup={vi.fn()} />,
			{ userEvent: { advanceTimers: vi.advanceTimersByTime } },
		);

		await user.click(screen.getByRole('button', { name: 'View image' }));
		await screen.findByRole('dialog', { name: /assign a tier/i });
		await user.keyboard('s');

		await waitFor(() => {
			expect(getSetupStoreState().untieredImages).toHaveLength(0);
		});
		expect(getSetupStoreState().rows[0]?.images).toHaveLength(1);
	});

	it('shows the finale overlay after all images are assigned', async () => {
		const { user } = renderWithProviders(
			<PresentationView onExitSetup={vi.fn()} />,
			{ userEvent: { advanceTimers: vi.advanceTimersByTime } },
		);

		await user.click(screen.getByRole('button', { name: 'View image' }));
		await screen.findByRole('dialog', { name: /assign a tier/i });
		await user.keyboard('s');

		await vi.advanceTimersByTimeAsync(800);

		expect(
			await screen.findByRole('dialog', { name: /Tier List complete/i }),
		).toBeInTheDocument();
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
