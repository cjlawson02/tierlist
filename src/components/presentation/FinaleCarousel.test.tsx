import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import FinaleCarousel from './FinaleCarousel';
import { act, renderWithProviders, screen } from '../../test/render';
import { DATA_IMAGE_PNG } from '../../test/fixtures';
import { PRESENTATION_TIERS } from '../../presentationConfig';
import { defaultTierColor } from '../../sanitize';

const finaleRows = PRESENTATION_TIERS.map((name, index) => ({
	id: `row-${name.toLowerCase()}`,
	name,
	color: defaultTierColor(index),
	images: index <= 1 ? [{ id: `img-${name}`, src: DATA_IMAGE_PNG }] : [],
}));

const longFinaleRows = PRESENTATION_TIERS.map((name, index) => ({
	id: `long-row-${name.toLowerCase()}`,
	name,
	color: defaultTierColor(index),
	images: index <= 4 ? [{ id: `long-img-${name}`, src: DATA_IMAGE_PNG }] : [],
}));

describe('FinaleCarousel', () => {
	beforeEach(() => {
		vi.useFakeTimers({ shouldAdvanceTime: true });
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('advances slides and completes automatically', async () => {
		const onComplete = vi.fn();
		renderWithProviders(
			<FinaleCarousel active rows={finaleRows} onComplete={onComplete} />,
			{ userEvent: { advanceTimers: vi.advanceTimersByTime } },
		);

		expect(
			await screen.findByRole('dialog', { name: /Finale carousel/i }),
		).toBeInTheDocument();
		expect(screen.getByText('S')).toBeInTheDocument();
		expect(await screen.findByText('A')).toBeInTheDocument();

		await vi.advanceTimersByTimeAsync(20000);
		expect(onComplete).not.toHaveBeenCalled();
	});

	it('finishes early when Escape is pressed', async () => {
		const onComplete = vi.fn();
		const { user } = renderWithProviders(
			<FinaleCarousel
				active
				rows={finaleRows.slice(0, 1)}
				onComplete={onComplete}
			/>,
			{ userEvent: { advanceTimers: vi.advanceTimersByTime } },
		);

		await screen.findByRole('dialog', { name: /Finale carousel/i });
		await user.keyboard('{Escape}');
		expect(onComplete).toHaveBeenCalledTimes(1);
	});

	it('finishes when Continue is clicked', async () => {
		const onComplete = vi.fn();
		const { user } = renderWithProviders(
			<FinaleCarousel active rows={finaleRows} onComplete={onComplete} />,
			{ userEvent: { advanceTimers: vi.advanceTimersByTime } },
		);

		await screen.findByRole('dialog', { name: /Finale carousel/i });
		await user.click(screen.getByRole('button', { name: 'Continue' }));
		expect(onComplete).toHaveBeenCalledTimes(1);
	});

	it('keeps scrolling long tracks without auto-completing', async () => {
		const onComplete = vi.fn();
		renderWithProviders(
			<FinaleCarousel active rows={longFinaleRows} onComplete={onComplete} />,
			{ userEvent: { advanceTimers: vi.advanceTimersByTime } },
		);

		await screen.findByRole('dialog', { name: /Finale carousel/i });

		await vi.advanceTimersByTimeAsync(25000);
		expect(onComplete).not.toHaveBeenCalled();
	});

	it('does not close on keydown from focused input', async () => {
		const onComplete = vi.fn();
		const { user } = renderWithProviders(
			<FinaleCarousel active rows={finaleRows} onComplete={onComplete} />,
			{ userEvent: { advanceTimers: vi.advanceTimersByTime } },
		);

		await screen.findByRole('dialog', { name: /Finale carousel/i });
		const input = document.createElement('input');
		document.body.appendChild(input);
		await user.click(input);
		await user.keyboard('{Enter}');
		expect(onComplete).not.toHaveBeenCalled();
		input.remove();
	});

	it('shows a fallback when an image fails to load', async () => {
		const onComplete = vi.fn();
		renderWithProviders(
			<FinaleCarousel active rows={finaleRows} onComplete={onComplete} />,
			{ userEvent: { advanceTimers: vi.advanceTimersByTime } },
		);

		await screen.findByRole('dialog', { name: /Finale carousel/i });
		const firstImage = screen.getByTestId('finale-slide-img-S');
		act(() => {
			firstImage.dispatchEvent(new Event('error'));
		});
		expect(await screen.findByText('Image unavailable')).toBeInTheDocument();
	});

	it('returns null when inactive', () => {
		const { container } = renderWithProviders(
			<FinaleCarousel active={false} rows={finaleRows} onComplete={vi.fn()} />,
		);

		expect(container).toBeEmptyDOMElement();
	});
});
