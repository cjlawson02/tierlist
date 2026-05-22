import { describe, expect, it } from 'vitest';
import TierItemDisplay from './TierItemDisplay';
import { renderWithProviders, screen } from '../test/render';
import { imageTierItem, textTierItem } from '../test/fixtures';

describe('TierItemDisplay', () => {
	it('renders spotlight hero images with spotlight-image class', () => {
		renderWithProviders(
			<TierItemDisplay
				item={imageTierItem('img-1')}
				variant="hero"
				data-testid="display-img"
			/>,
		);
		const img = screen.getByTestId('display-img');
		expect(img).toHaveClass('spotlight-image');
		expect(img).not.toHaveClass('elite-slideshow__image');
	});

	it('renders finale images without spotlight styling', () => {
		renderWithProviders(
			<TierItemDisplay
				item={imageTierItem('img-1')}
				variant="finale"
				data-testid="display-img"
			/>,
		);
		const img = screen.getByTestId('display-img');
		expect(img).toHaveClass('elite-slideshow__image');
		expect(img).not.toHaveClass('spotlight-image');
	});

	it('renders text slide content', () => {
		renderWithProviders(
			<TierItemDisplay
				item={textTierItem('text-1', 'Rank this idea')}
				variant="hero"
			/>,
		);
		expect(screen.getByText('Rank this idea')).toBeInTheDocument();
	});
});
