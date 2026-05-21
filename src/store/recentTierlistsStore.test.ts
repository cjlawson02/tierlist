import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	estimateRecentTierlistsPersistBytes,
	filterRecentTierlistsByTtl,
	isRecentTierlistExpired,
	parseStoredEntries,
	projectRecentTierlistsAfterUpsert,
} from './recentTierlistsStore';
import { RECENT_TIERLISTS } from '../presentationConfig';
import { tierBundleDocument } from '../test/fixtures';
import { getRecentTierlistsStoreState } from '../test/store';

const DAY_MS = 24 * 60 * 60 * 1000;
const NOW = Date.parse('2026-05-21T12:00:00.000Z');

function recentSavedAt(daysAgo: number): string {
	return new Date(NOW - daysAgo * DAY_MS).toISOString();
}

describe('recent tierlist TTL', () => {
	it('expires entries older than the configured TTL', () => {
		const freshSavedAt = new Date(
			NOW - (RECENT_TIERLISTS.ttlDays - 1) * DAY_MS,
		).toISOString();
		const staleSavedAt = new Date(
			NOW - (RECENT_TIERLISTS.ttlDays + 1) * DAY_MS,
		).toISOString();

		expect(isRecentTierlistExpired(freshSavedAt, NOW)).toBe(false);
		expect(isRecentTierlistExpired(staleSavedAt, NOW)).toBe(true);
	});

	it('treats invalid savedAt values as expired', () => {
		expect(isRecentTierlistExpired('not-a-date')).toBe(true);
	});
});

describe('parseStoredEntries', () => {
	it('returns valid entries and drops malformed storage', () => {
		const valid = {
			id: 'entry-1',
			title: 'Valid',
			savedAt: recentSavedAt(1),
			imageCount: 1,
			document: tierBundleDocument({ title: 'Valid' }),
		};

		expect(parseStoredEntries({ entries: [valid, { bad: true }] })).toEqual([
			valid,
		]);
		expect(parseStoredEntries(null)).toEqual([]);
		expect(parseStoredEntries({ entries: 'nope' })).toEqual([]);
	});
});

describe('useRecentTierlistsStore', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(NOW);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('upserts entries and moves updated items to the front', () => {
		const store = getRecentTierlistsStoreState();
		const firstId = store.upsert({
			title: 'First',
			savedAt: recentSavedAt(2),
			imageCount: 1,
			document: tierBundleDocument({ title: 'First' }),
		});
		const secondId = store.upsert({
			title: 'Second',
			savedAt: recentSavedAt(1),
			imageCount: 2,
			document: tierBundleDocument({ title: 'Second' }),
		});

		expect(
			getRecentTierlistsStoreState().entries.map((entry) => entry.id),
		).toEqual([secondId, firstId]);

		store.upsert({
			id: firstId,
			title: 'First updated',
			savedAt: recentSavedAt(0),
			imageCount: 3,
			document: tierBundleDocument({ title: 'First updated' }),
		});

		expect(getRecentTierlistsStoreState().entries[0]?.id).toBe(firstId);
		expect(getRecentTierlistsStoreState().entries[0]?.title).toBe(
			'First updated',
		);
	});

	it('trims entries to the configured maximum', () => {
		const store = getRecentTierlistsStoreState();
		for (let index = 0; index < RECENT_TIERLISTS.maxEntries + 3; index += 1) {
			store.upsert({
				title: `List ${String(index)}`,
				savedAt: recentSavedAt(index % RECENT_TIERLISTS.ttlDays),
				imageCount: 1,
				document: tierBundleDocument({ title: `List ${String(index)}` }),
			});
		}

		expect(getRecentTierlistsStoreState().entries).toHaveLength(
			RECENT_TIERLISTS.maxEntries,
		);
	});

	it('removes and clears entries', () => {
		const store = getRecentTierlistsStoreState();
		const id = store.upsert({
			title: 'Remove me',
			savedAt: recentSavedAt(1),
			imageCount: 1,
			document: tierBundleDocument({ title: 'Remove me' }),
		});

		store.remove(id);
		expect(getRecentTierlistsStoreState().entries).toHaveLength(0);

		store.upsert({
			title: 'One',
			savedAt: recentSavedAt(1),
			imageCount: 1,
			document: tierBundleDocument({ title: 'One' }),
		});
		store.clearAll();
		expect(getRecentTierlistsStoreState().entries).toHaveLength(0);
	});

	it('drops expired entries when upserting', () => {
		const staleSavedAt = new Date(
			NOW - (RECENT_TIERLISTS.ttlDays + 1) * DAY_MS,
		).toISOString();
		const store = getRecentTierlistsStoreState();

		store.upsert({
			title: 'Stale list',
			savedAt: staleSavedAt,
			imageCount: 1,
			document: tierBundleDocument({ title: 'Stale list' }),
		});
		expect(getRecentTierlistsStoreState().entries).toHaveLength(0);

		store.upsert({
			title: 'Fresh list',
			savedAt: new Date(NOW).toISOString(),
			imageCount: 1,
			document: tierBundleDocument({ title: 'Fresh list' }),
		});

		expect(
			getRecentTierlistsStoreState().entries.map((entry) => entry.title),
		).toEqual(['Fresh list']);
	});

	it('estimates persisted payload size for projected entries', () => {
		const entry = {
			id: 'entry-1',
			title: 'Sized',
			savedAt: recentSavedAt(0),
			imageCount: 1,
			document: tierBundleDocument({ title: 'Sized' }),
		};
		const projected = projectRecentTierlistsAfterUpsert([], entry);

		expect(estimateRecentTierlistsPersistBytes(projected)).toBeGreaterThan(0);
		expect(filterRecentTierlistsByTtl(projected, NOW)).toHaveLength(1);
	});
});
