import { describe, expect, it, vi } from 'vitest';
import PresentationQueue from './PresentationQueue';
import { renderWithProviders, screen } from '../../test/render';
import { DATA_IMAGE_PNG } from '../../test/fixtures';

const images = [
	{ id: 'img-1', src: DATA_IMAGE_PNG },
	{ id: 'img-2', src: DATA_IMAGE_PNG },
];

describe('PresentationQueue', () => {
	it('shows progress and upcoming thumbnails', () => {
		renderWithProviders(
			<PresentationQueue
				images={images}
				totalImages={5}
				spotlightImageId={null}
				queuePaused={false}
				onResume={vi.fn()}
				onSelectImage={vi.fn()}
			/>,
		);

		expect(screen.getByText('Next up — photo 4 of 5')).toBeInTheDocument();
		expect(screen.getByRole('progressbar')).toHaveAttribute(
			'aria-valuenow',
			'3',
		);
		expect(screen.getAllByRole('button', { name: /photo/i })).toHaveLength(2);
	});

	it('shows resume control when paused', () => {
		renderWithProviders(
			<PresentationQueue
				images={images}
				totalImages={5}
				spotlightImageId={null}
				queuePaused
				onResume={vi.fn()}
				onSelectImage={vi.fn()}
			/>,
		);

		expect(screen.getByText('Paused')).toBeInTheDocument();
		expect(
			screen.getByRole('button', { name: 'Resume queue (Space)' }),
		).toBeInTheDocument();
	});
});
