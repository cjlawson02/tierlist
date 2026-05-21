import { describe, expect, it, vi } from 'vitest';
import RecentTierlistsPanel from './RecentTierlistsPanel';
import { renderWithProviders, screen } from '../../test/render';
import { mockConfirm } from '../../test/helpers';
import { DATA_IMAGE_PNG } from '../../test/fixtures';
import {
	getRecentTierlistsStoreState,
	getSetupStoreState,
} from '../../test/store';

describe('RecentTierlistsPanel', () => {
	it('loads a saved tier list from the panel', async () => {
		getSetupStoreState().addImages([DATA_IMAGE_PNG]);
		getSetupStoreState().setTitle('Weekend snacks');
		getSetupStoreState().saveToRecent();

		const onToast = vi.fn();
		const { user } = renderWithProviders(
			<RecentTierlistsPanel onToast={onToast} />,
		);

		await user.click(
			screen.getByRole('button', { name: /Your recent tier lists/i }),
		);
		await user.click(
			screen.getByRole('button', { name: 'Load Weekend snacks' }),
		);

		expect(getSetupStoreState().title).toBe('Weekend snacks');
		expect(onToast).toHaveBeenCalledWith('Loaded "Weekend snacks"');
	});

	it('starts a new tier list from the panel', async () => {
		mockConfirm(true);
		getSetupStoreState().addImages([DATA_IMAGE_PNG]);
		getSetupStoreState().setTitle('Old list');

		const onToast = vi.fn();
		const { user } = renderWithProviders(
			<RecentTierlistsPanel onToast={onToast} />,
		);

		await user.click(
			screen.getByRole('button', { name: /Your recent tier lists/i }),
		);
		await user.click(screen.getByRole('button', { name: 'New tier list' }));

		expect(getSetupStoreState().untieredImages).toHaveLength(0);
	});

	it('removes a saved tier list', async () => {
		mockConfirm(true);
		getSetupStoreState().addImages([DATA_IMAGE_PNG]);
		getSetupStoreState().setTitle('Delete me');
		getSetupStoreState().saveToRecent();

		const onToast = vi.fn();
		const { user } = renderWithProviders(
			<RecentTierlistsPanel onToast={onToast} />,
		);

		await user.click(
			screen.getByRole('button', { name: /Your recent tier lists/i }),
		);
		await user.click(screen.getByRole('button', { name: 'Remove Delete me' }));

		expect(getRecentTierlistsStoreState().entries).toHaveLength(0);
		expect(onToast).toHaveBeenCalledWith('Removed "Delete me"');
	});
});
