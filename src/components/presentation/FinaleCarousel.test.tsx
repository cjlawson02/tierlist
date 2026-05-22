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
			<FinaleCarousel
				active
				title="Best Tier List"
				rows={finaleRows}
				onComplete={onComplete}
			/>,
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
				title="Best Tier List"
				rows={finaleRows.slice(0, 1)}
				onComplete={onComplete}
			/>,
			{ userEvent: { advanceTimers: vi.advanceTimersByTime } },
		);

		await screen.findByRole('dialog', { name: /Finale carousel/i });
		await user.keyboard('{Escape}');
		expect(onComplete).toHaveBeenCalledTimes(1);
	});

	it('centers up to three slides without embla', async () => {
		renderWithProviders(
			<FinaleCarousel
				active
				title="Best Tier List"
				rows={finaleRows}
				onComplete={vi.fn()}
			/>,
			{ userEvent: { advanceTimers: vi.advanceTimersByTime } },
		);

		await screen.findByRole('dialog', { name: /Finale carousel/i });
		expect(document.querySelector('.elite-slideshow__lane--static')).toBeTruthy();
		expect(document.querySelector('.elite-slideshow__viewport')).toBeNull();
	});

	it('finishes when Continue is clicked', async () => {
		const onComplete = vi.fn();
		const { user } = renderWithProviders(
			<FinaleCarousel
				active
				title="Best Tier List"
				rows={finaleRows}
				onComplete={onComplete}
			/>,
			{ userEvent: { advanceTimers: vi.advanceTimersByTime } },
		);

		await screen.findByRole('dialog', { name: /Finale carousel/i });
		await user.click(screen.getByRole('button', { name: 'Show me my list' }));
		expect(onComplete).toHaveBeenCalledTimes(1);
	});

	it('keeps scrolling long tracks without auto-completing', async () => {
		const onComplete = vi.fn();
		renderWithProviders(
			<FinaleCarousel
				active
				title="Best Tier List"
				rows={longFinaleRows}
				onComplete={onComplete}
			/>,
			{ userEvent: { advanceTimers: vi.advanceTimersByTime } },
		);

		await screen.findByRole('dialog', { name: /Finale carousel/i });

		await vi.advanceTimersByTimeAsync(25000);
		expect(onComplete).not.toHaveBeenCalled();
	});

	it('renders a draggable embla viewport without duplicating slides', async () => {
		renderWithProviders(
			<FinaleCarousel
				active
				title="Best Tier List"
				rows={longFinaleRows}
				onComplete={vi.fn()}
			/>,
			{ userEvent: { advanceTimers: vi.advanceTimersByTime } },
		);

		await screen.findByRole('dialog', { name: /Finale carousel/i });
		expect(document.querySelector('.elite-slideshow__viewport')).toBeTruthy();
		expect(
			document.querySelectorAll('[data-testid^="finale-slide-long-img-"]'),
		).toHaveLength(5);
	});

	it('does not close on keydown from focused input', async () => {
		const onComplete = vi.fn();
		const { user } = renderWithProviders(
			<FinaleCarousel
				active
				title="Best Tier List"
				rows={finaleRows}
				onComplete={onComplete}
			/>,
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
			<FinaleCarousel
				active
				title="Best Tier List"
				rows={finaleRows}
				onComplete={onComplete}
			/>,
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
			<FinaleCarousel
				active={false}
				title="Best Tier List"
				rows={finaleRows}
				onComplete={vi.fn()}
			/>,
		);

		expect(container).toBeEmptyDOMElement();
	});
});
