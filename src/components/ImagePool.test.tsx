import { describe, expect, it } from 'vitest';
import ImagePool from './ImagePool';
import { renderWithProviders, screen } from '../test/render';
import { imageTierItem, textTierItem } from '../test/fixtures';

describe('ImagePool', () => {
	it('renders a scrollable layout section when layoutScroll is enabled', () => {
		renderWithProviders(
			<ImagePool
				images={[imageTierItem('img-1')]}
				layoutScroll
				onImageClick={() => undefined}
			/>,
		);

		const panel = screen.getByRole('region', { name: 'Slides' });
		expect(panel).toBeInTheDocument();
		expect(panel).toHaveClass('pool-panel');
	});

	it('renders text slides in the pool', () => {
		renderWithProviders(
			<ImagePool
				images={[textTierItem('text-1', 'Hello world')]}
				layoutScroll
			/>,
		);

		expect(screen.getByText('Hello world')).toBeInTheDocument();
	});
});
