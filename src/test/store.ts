import { useSetupStore } from '../store/setupStore';

export function getSetupStoreState() {
	return useSetupStore.getState();
}
