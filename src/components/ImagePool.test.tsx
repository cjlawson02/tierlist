import { describe, expect, it } from 'vitest';
import ImagePool from './ImagePool';
import { renderWithProviders, screen } from '../test/render';
import { DATA_IMAGE_PNG } from '../test/fixtures';

const images = [{ id: 'img-1', src: DATA_IMAGE_PNG }];

describe('ImagePool', () => {
	it('renders a scrollable layout section when layoutScroll is enabled', () => {
		renderWithProviders(
			<ImagePool images={images} layoutScroll onImageClick={() => undefined} />,
		);

		const panel = screen.getByRole('region', { name: 'Photos' });
		expect(panel).toBeInTheDocument();
		expect(panel).toHaveClass('pool-panel');
	});
});
