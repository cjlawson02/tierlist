import { act } from '@testing-library/react';
import { useSetupStore } from '../store/setupStore';

export function getSetupStoreState() {
	return useSetupStore.getState();
}

export function seedSetupStore(
	partial: Partial<ReturnType<typeof useSetupStore.getState>>,
): void {
	act(() => {
		useSetupStore.setState(partial);
	});
}
