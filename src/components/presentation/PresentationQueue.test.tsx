import { describe, expect, it, vi } from 'vitest';
import PresentationQueue from './PresentationQueue';
import { renderWithProviders, screen } from '../../test/render';
import { imageTierItem } from '../../test/fixtures';

const items = [imageTierItem('img-1'), imageTierItem('img-2')];

describe('PresentationQueue', () => {
	it('shows progress and upcoming thumbnails', () => {
		renderWithProviders(
			<PresentationQueue
				items={items}
				totalSlides={5}
				spotlightItemId={null}
				queuePaused={false}
				onResume={vi.fn()}
				onSelectItem={vi.fn()}
			/>,
		);

		expect(screen.getByText('Next up — slide 4 of 5')).toBeInTheDocument();
		expect(screen.getByRole('progressbar')).toHaveAttribute(
			'aria-valuenow',
			'3',
		);
		expect(screen.getAllByRole('button', { name: /slide/i })).toHaveLength(2);
	});

	it('hides the current slide from upcoming thumbnails', () => {
		renderWithProviders(
			<PresentationQueue
				items={items}
				totalSlides={5}
				spotlightItemId="img-1"
				queuePaused={false}
				onResume={vi.fn()}
				onSelectItem={vi.fn()}
			/>,
		);

		expect(screen.getByText('Slide 4 of 5')).toBeInTheDocument();
		expect(
			screen.getByRole('button', { name: /Skip to slide 5 of 5/i }),
		).toBeInTheDocument();
		expect(
			screen.queryByRole('button', { name: /slide 4 of 5/i }),
		).not.toBeInTheDocument();
	});

	it('calls onSelectItem when an upcoming thumbnail is clicked', async () => {
		const onSelectItem = vi.fn();
		const { user } = renderWithProviders(
			<PresentationQueue
				items={items}
				totalSlides={5}
				spotlightItemId="img-1"
				queuePaused={false}
				onResume={vi.fn()}
				onSelectItem={onSelectItem}
			/>,
		);

		await user.click(
			screen.getByRole('button', { name: /Skip to slide 5 of 5/i }),
		);
		expect(onSelectItem).toHaveBeenCalledWith('img-2');
	});

	it('shows resume control when paused', () => {
		renderWithProviders(
			<PresentationQueue
				items={items}
				totalSlides={5}
				spotlightItemId={null}
				queuePaused
				onResume={vi.fn()}
				onSelectItem={vi.fn()}
			/>,
		);

		expect(screen.getByText('Paused')).toBeInTheDocument();
		expect(
			screen.getByRole('button', { name: 'Resume queue (Space)' }),
		).toBeInTheDocument();
	});

	it('renders text slide previews in the queue', () => {
		renderWithProviders(
			<PresentationQueue
				items={[
					imageTierItem('img-1'),
					{ id: 'text-1', kind: 'text', text: 'Hello world' },
				]}
				totalSlides={2}
				spotlightItemId="img-1"
				queuePaused={false}
				onResume={vi.fn()}
				onSelectItem={vi.fn()}
			/>,
		);

		expect(screen.getByText('Hello world')).toBeInTheDocument();
	});
});
