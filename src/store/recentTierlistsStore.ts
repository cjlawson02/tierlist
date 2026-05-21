import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { RECENT_TIERLISTS } from '../presentationConfig';
import type { TierBundleV1 } from '../types';
import { createStoreId } from './storeIds';

export interface RecentTierlistEntry {
	id: string;
	title: string;
	savedAt: string;
	imageCount: number;
	document: TierBundleV1['document'];
}

const TTL_MS = RECENT_TIERLISTS.ttlDays * 24 * 60 * 60 * 1000;

interface PersistedRecentTierlists {
	entries: RecentTierlistEntry[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return value != null && typeof value === 'object';
}

function isValidStoredEntry(value: unknown): value is RecentTierlistEntry {
	if (!isRecord(value)) {
		return false;
	}
	if (typeof value.id !== 'string' || value.id.length === 0) {
		return false;
	}
	if (typeof value.title !== 'string') {
		return false;
	}
	if (typeof value.savedAt !== 'string') {
		return false;
	}
	if (
		typeof value.imageCount !== 'number' ||
		!Number.isFinite(value.imageCount)
	) {
		return false;
	}
	if (!isRecord(value.document)) {
		return false;
	}
	const document = value.document;
	if (typeof document.title !== 'string' || !Array.isArray(document.rows)) {
		return false;
	}
	if (typeof document.vertical !== 'boolean') {
		return false;
	}
	return document.rows.every((row) => {
		if (!isRecord(row)) {
			return false;
		}
		return (
			typeof row.name === 'string' &&
			typeof row.color === 'string' &&
			Array.isArray(row.images)
		);
	});
}

export function parseStoredEntries(persisted: unknown): RecentTierlistEntry[] {
	if (!isRecord(persisted)) {
		return [];
	}
	if (Array.isArray(persisted.entries)) {
		return persisted.entries.filter(isValidStoredEntry);
	}
	return [];
}

export function isRecentTierlistExpired(
	savedAt: string,
	now = Date.now(),
): boolean {
	const savedMs = Date.parse(savedAt);
	if (Number.isNaN(savedMs)) {
		return true;
	}
	return now - savedMs > TTL_MS;
}

export function filterRecentTierlistsByTtl(
	entries: RecentTierlistEntry[],
	now = Date.now(),
): RecentTierlistEntry[] {
	return entries.filter(
		(entry) => !isRecentTierlistExpired(entry.savedAt, now),
	);
}

export function estimateRecentTierlistsPersistBytes(
	entries: RecentTierlistEntry[],
): number {
	return new Blob([
		JSON.stringify({
			state: { entries },
			version: RECENT_TIERLISTS.storageVersion,
		}),
	]).size;
}

export class RecentTierlistsQuotaError extends Error {
	constructor() {
		super('Recent tier lists storage quota exceeded');
		this.name = 'RecentTierlistsQuotaError';
	}
}

const recentTierlistsStorage = createJSONStorage<PersistedRecentTierlists>(
	() => ({
		getItem: (name) => localStorage.getItem(name),
		setItem: (name, value) => {
			try {
				localStorage.setItem(name, value);
			} catch {
				throw new RecentTierlistsQuotaError();
			}
		},
		removeItem: (name) => {
			localStorage.removeItem(name);
		},
	}),
);

interface RecentTierlistsStore {
	entries: RecentTierlistEntry[];
	upsert: (entry: Omit<RecentTierlistEntry, 'id'> & { id?: string }) => string;
	remove: (id: string) => void;
	clearAll: () => void;
}

const pruneEntries = (entries: RecentTierlistEntry[]) =>
	filterRecentTierlistsByTtl(parseStoredEntries({ entries }));

export const useRecentTierlistsStore = create<RecentTierlistsStore>()(
	persist(
		(set, get) => ({
			entries: [],
			upsert: (entry) => {
				const id = entry.id ?? createStoreId();
				const saved: RecentTierlistEntry = {
					id,
					title: entry.title,
					savedAt: entry.savedAt,
					imageCount: entry.imageCount,
					document: entry.document,
				};
				const freshEntries = pruneEntries(get().entries);
				set({
					entries: pruneEntries([
						saved,
						...freshEntries.filter((item) => item.id !== id),
					]).slice(0, RECENT_TIERLISTS.maxEntries),
				});
				return id;
			},
			remove: (id) => {
				set({ entries: get().entries.filter((item) => item.id !== id) });
			},
			clearAll: () => {
				set({ entries: [] });
			},
		}),
		{
			name: RECENT_TIERLISTS.storageKey,
			storage: recentTierlistsStorage,
			version: RECENT_TIERLISTS.storageVersion,
			migrate: (persistedState) => ({
				entries: parseStoredEntries(persistedState),
			}),
			partialize: (state) => ({ entries: state.entries }),
			onRehydrateStorage: () => (state) => {
				if (!state) {
					return;
				}
				const freshEntries = pruneEntries(state.entries);
				if (freshEntries.length !== state.entries.length) {
					useRecentTierlistsStore.setState({ entries: freshEntries });
				}
			},
		},
	),
);

export function projectRecentTierlistsAfterUpsert(
	entries: RecentTierlistEntry[],
	candidate: RecentTierlistEntry,
): RecentTierlistEntry[] {
	const freshEntries = filterRecentTierlistsByTtl(entries);
	return filterRecentTierlistsByTtl([
		candidate,
		...freshEntries.filter((item) => item.id !== candidate.id),
	]).slice(0, RECENT_TIERLISTS.maxEntries);
}
