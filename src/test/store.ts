import { act } from '@testing-library/react';
import { useRecentTierlistsStore } from '../store/recentTierlistsStore';
import { useSetupStore } from '../store/setupStore';

export function getSetupStoreState() {
	return useSetupStore.getState();
}

export function getRecentTierlistsStoreState() {
	return useRecentTierlistsStore.getState();
}

export function seedSetupStore(
	partial: Partial<ReturnType<typeof useSetupStore.getState>>,
): void {
	act(() => {
		useSetupStore.setState(partial);
	});
}
