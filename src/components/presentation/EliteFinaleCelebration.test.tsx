import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import EliteFinaleCelebration from './EliteFinaleCelebration';
import { renderWithProviders, screen } from '../../test/render';
import { DATA_IMAGE_PNG } from '../../test/fixtures';
import { PRESENTATION_TIERS } from '../../presentationConfig';
import { defaultTierColor } from '../../sanitize';

vi.mock('../../effects/celebrate', () => ({
	celebrateSlideshowSlide: vi.fn().mockResolvedValue(undefined),
	stopSlideshowConfetti: vi.fn(),
}));

vi.mock('../../effects/sounds', () => ({
	startEliteSlideshowMusic: vi.fn(),
	stopEliteSlideshowMusic: vi.fn(),
}));

const eliteRows = PRESENTATION_TIERS.map((name, index) => ({
	id: `row-${name.toLowerCase()}`,
	name,
	color: defaultTierColor(index),
	images: index <= 1 ? [{ id: `img-${name}`, src: DATA_IMAGE_PNG }] : [],
}));

describe('EliteFinaleCelebration', () => {
	beforeEach(() => {
		vi.useFakeTimers({ shouldAdvanceTime: true });
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('advances slides and completes on Done', async () => {
		const onComplete = vi.fn();
		const { user } = renderWithProviders(
			<EliteFinaleCelebration
				active
				rows={eliteRows}
				onComplete={onComplete}
			/>,
			{ userEvent: { advanceTimers: vi.advanceTimersByTime } },
		);

		expect(
			await screen.findByRole('dialog', { name: /Celebrating S tier picks/i }),
		).toBeInTheDocument();
		expect(screen.getByText(/1\s+\/\s+2/)).toBeInTheDocument();

		await user.keyboard('{ArrowRight}');
		expect(
			await screen.findByRole('dialog', { name: /Celebrating A tier picks/i }),
		).toBeInTheDocument();
		expect(screen.getByText(/2\s+\/\s+2/)).toBeInTheDocument();

		await user.click(screen.getByRole('button', { name: 'Done' }));
		expect(onComplete).toHaveBeenCalledTimes(1);
	});

	it('finishes early when Escape is pressed', async () => {
		const onComplete = vi.fn();
		const { user } = renderWithProviders(
			<EliteFinaleCelebration
				active
				rows={eliteRows.slice(0, 1)}
				onComplete={onComplete}
			/>,
			{ userEvent: { advanceTimers: vi.advanceTimersByTime } },
		);

		await screen.findByRole('dialog', { name: /Celebrating S tier picks/i });
		await user.keyboard('{Escape}');
		expect(onComplete).toHaveBeenCalledTimes(1);
	});

	it('returns null when inactive', () => {
		const { container } = renderWithProviders(
			<EliteFinaleCelebration
				active={false}
				rows={eliteRows}
				onComplete={vi.fn()}
			/>,
		);

		expect(container).toBeEmptyDOMElement();
	});
});
