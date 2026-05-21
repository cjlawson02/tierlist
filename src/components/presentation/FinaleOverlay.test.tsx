import { describe, expect, it, vi } from 'vitest';
import FinaleOverlay from './FinaleOverlay';
import { renderWithProviders, screen } from '../../test/render';

describe('FinaleOverlay', () => {
	it('calls onDismiss when Continue is clicked', async () => {
		const onDismiss = vi.fn();
		const { user } = renderWithProviders(
			<FinaleOverlay visible title="Best Tier List" onDismiss={onDismiss} />,
		);

		await user.click(screen.getByRole('button', { name: 'Continue' }));
		expect(onDismiss).toHaveBeenCalledTimes(1);
	});
});
