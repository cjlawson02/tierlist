import { describe, expect, it } from 'vitest';
import BroadcastLowerThird from './BroadcastLowerThird';
import { renderWithProviders, screen } from '../../test/render';

describe('BroadcastLowerThird', () => {
	it('renders nothing without tier data', () => {
		renderWithProviders(
			<BroadcastLowerThird tierName={null} tierColor={null} />,
		);
		expect(screen.queryByText(/Tier/)).not.toBeInTheDocument();
	});

	it('renders sad styling for devastating tones', () => {
		renderWithProviders(
			<BroadcastLowerThird
				tierName="F"
				tierColor="#ff0000"
				label="Oof —"
				tone="devastating"
			/>,
		);
		expect(screen.getByText('F Tier')).toBeInTheDocument();
		expect(
			document.querySelector('.broadcast-lower-third--devastating'),
		).not.toBeNull();
	});
});
