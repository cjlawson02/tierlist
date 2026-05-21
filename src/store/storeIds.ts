let nextId = 0;

export function createStoreId(): string {
	return `id-${String(nextId++)}`;
}

export function resetStoreIds(): void {
	nextId = 0;
}
