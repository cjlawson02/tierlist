import { BUNDLE_SIZE, BUNDLE_VERSION } from './presentationConfig';
import {
	defaultTierColor,
	sanitizeColor,
	sanitizeName,
	sanitizeStringArray,
} from './sanitize';
import type { SerializedTierList, TierBundleV1, TierListState } from './types';

function isLegacyTierList(data: unknown): data is SerializedTierList {
	if (!data || typeof data !== 'object') {
		return false;
	}
	const obj = data as Record<string, unknown>;
	if (typeof obj.title !== 'string' || !Array.isArray(obj.rows)) {
		return false;
	}
	if (obj.format !== undefined) {
		return false;
	}
	return obj.rows.every((row) => {
		if (!row || typeof row !== 'object') {
			return false;
		}
		const record = row as Record<string, unknown>;
		return (
			typeof record.name === 'string' &&
			typeof record.color === 'string' &&
			Array.isArray(record.imgs) &&
			record.imgs.every((img) => typeof img === 'string')
		);
	});
}

function isTierBundleDocument(data: unknown): data is TierBundleV1['document'] {
	if (!data || typeof data !== 'object') {
		return false;
	}
	const doc = data as Record<string, unknown>;
	if (typeof doc.title !== 'string' || !Array.isArray(doc.rows)) {
		return false;
	}
	return doc.rows.every((row) => {
		if (!row || typeof row !== 'object') {
			return false;
		}
		const record = row as Record<string, unknown>;
		return (
			typeof record.name === 'string' &&
			typeof record.color === 'string' &&
			Array.isArray(record.images) &&
			record.images.every((img) => typeof img === 'string')
		);
	});
}

function sanitizeLegacyTierList(data: SerializedTierList): SerializedTierList {
	return {
		title: sanitizeName(data.title, 'My Tier List'),
		rows: data.rows.map((row, index) => ({
			name: sanitizeName(row.name, `Tier ${String(index + 1)}`),
			color: sanitizeColor(row.color, defaultTierColor(index)),
			imgs: sanitizeStringArray(row.imgs, `row "${row.name}"`),
		})),
		untiered:
			data.untiered != null
				? sanitizeStringArray(data.untiered, 'untiered images')
				: undefined,
	};
}

function sanitizeBundleDocument(
	doc: TierBundleV1['document'],
): TierBundleV1['document'] {
	return {
		title: sanitizeName(doc.title, 'My Tier List'),
		vertical: typeof doc.vertical === 'boolean' ? doc.vertical : false,
		rows: doc.rows.map((row, index) => ({
			name: sanitizeName(row.name, `Tier ${String(index + 1)}`),
			color: sanitizeColor(row.color, defaultTierColor(index)),
			images: sanitizeStringArray(row.images, `row "${row.name}"`),
		})),
		untiered:
			doc.untiered != null
				? sanitizeStringArray(doc.untiered, 'untiered images')
				: undefined,
	};
}

function normalizeToBundle(data: unknown): TierBundleV1 {
	if (!data || typeof data !== 'object') {
		throw new Error('Not a valid Tier List file.');
	}
	const obj = data as Record<string, unknown>;
	if (obj.format === 'tier-bundle' && typeof obj.version === 'number') {
		if (obj.version > BUNDLE_VERSION) {
			throw new Error(
				`This file requires a newer version of the app (format v${String(obj.version)}, app v${String(BUNDLE_VERSION)}).`,
			);
		}
		if (!isTierBundleDocument(obj.document)) {
			throw new Error('Not a valid Tier List file.');
		}
		return {
			format: 'tier-bundle',
			version: 1,
			app: 'tiers',
			exportedAt:
				typeof obj.exportedAt === 'string'
					? obj.exportedAt
					: new Date().toISOString(),
			document: sanitizeBundleDocument(obj.document),
		};
	}
	if (isLegacyTierList(data)) {
		const sanitized = sanitizeLegacyTierList(data);
		return {
			format: 'tier-bundle',
			version: 1,
			app: 'tiers',
			exportedAt: new Date().toISOString(),
			document: {
				title: sanitized.title,
				vertical: false,
				rows: sanitized.rows.map((row) => ({
					name: row.name,
					color: row.color,
					images: row.imgs,
				})),
				untiered: sanitized.untiered,
			},
		};
	}
	throw new Error('Not a valid Tier List file.');
}

export function toBundle(state: TierListState): TierBundleV1 {
	const imageCount =
		state.untieredImages.length +
		state.rows.reduce((n, row) => n + row.images.length, 0);
	const bundle: TierBundleV1 = {
		format: 'tier-bundle',
		version: 1,
		app: 'tiers',
		exportedAt: new Date().toISOString(),
		meta: {
			title: state.title,
			imageCount,
		},
		document: {
			title: state.title,
			vertical: state.vertical,
			rows: state.rows.map((row) => ({
				name: row.name,
				color: row.color,
				images: row.images.map((img) => img.src),
			})),
			untiered:
				state.untieredImages.length > 0
					? state.untieredImages.map((img) => img.src)
					: undefined,
		},
	};
	const json = JSON.stringify(bundle, null, 2);
	bundle.meta = {
		title: state.title,
		imageCount,
		approxBytes: new Blob([json]).size,
	};
	return bundle;
}

export function bundleToSerialized(bundle: TierBundleV1): SerializedTierList {
	const doc = bundle.document;
	return {
		title: doc.title,
		rows: doc.rows.map((row) => ({
			name: row.name,
			color: row.color,
			imgs: row.images,
		})),
		untiered: doc.untiered,
	};
}

export function formatBytes(bytes: number): string {
	if (bytes < 1024) {
		return `${String(bytes)} B`;
	}
	if (bytes < 1024 * 1024) {
		return `${(bytes / 1024).toFixed(1)} KB`;
	}
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getSizeGateMessage(
	bytes: number,
): 'silent' | 'info' | 'confirm' | 'strong' | 'block' {
	const mb = bytes / (1024 * 1024);
	if (mb >= BUNDLE_SIZE.blockImportMb) {
		return 'block';
	}
	if (mb >= BUNDLE_SIZE.strongWarnMb) {
		return 'strong';
	}
	if (mb >= BUNDLE_SIZE.confirmMb) {
		return 'confirm';
	}
	if (mb >= BUNDLE_SIZE.infoMb) {
		return 'info';
	}
	return 'silent';
}

function confirmSizeGate(
	gate: ReturnType<typeof getSizeGateMessage>,
	bytes: number,
	action: 'import' | 'export',
): void {
	if (gate === 'block') {
		throw new Error(
			`File is too large (${formatBytes(bytes)}). Maximum recommended size is ${String(BUNDLE_SIZE.blockImportMb)} MB.`,
		);
	}
	if (gate === 'info') {
		if (
			!confirm(
				`This file is ${formatBytes(bytes)}. Continue ${action === 'import' ? 'importing' : 'exporting'}?`,
			)
		) {
			throw new Error(`${action === 'import' ? 'Import' : 'Export'} cancelled`);
		}
		return;
	}
	if (gate === 'strong' || gate === 'confirm') {
		const msg =
			gate === 'strong'
				? action === 'import'
					? `This file is ${formatBytes(bytes)}. Loading may take a while and use significant memory. Continue?`
					: `File is ${formatBytes(bytes)}. Export may be slow. Continue?`
				: `This file is ${formatBytes(bytes)}. Continue ${action === 'import' ? 'importing' : 'exporting'}?`;
		if (!confirm(msg)) {
			throw new Error(`${action === 'import' ? 'Import' : 'Export'} cancelled`);
		}
	}
}

export async function downloadBundle(
	bundle: TierBundleV1,
	suggestedName: string,
): Promise<void> {
	const json = JSON.stringify(bundle, null, 2);
	const blob = new Blob([json], { type: 'application/json' });
	const filename = suggestedName.endsWith('.json')
		? suggestedName
		: `${suggestedName}.tierlist.json`;

	if ('showSaveFilePicker' in window) {
		try {
			const handle = await (
				window as Window & {
					showSaveFilePicker: (opts: object) => Promise<FileSystemFileHandle>;
				}
			).showSaveFilePicker({
				suggestedName: filename,
				types: [
					{
						description: 'Tier List',
						accept: { 'application/json': ['.json', '.tierlist.json'] },
					},
				],
			});
			const writable = await handle.createWritable();
			await writable.write(blob);
			await writable.close();
			return;
		} catch (err) {
			if ((err as DOMException).name === 'AbortError') {
				return;
			}
		}
	}

	const url = URL.createObjectURL(blob);
	const anchor = document.createElement('a');
	anchor.href = url;
	anchor.download = filename;
	anchor.hidden = true;
	document.body.appendChild(anchor);
	anchor.click();
	anchor.remove();
	URL.revokeObjectURL(url);
}

export function confirmBundleSizeGate(
	bytes: number,
	action: 'import' | 'export',
): void {
	confirmSizeGate(getSizeGateMessage(bytes), bytes, action);
}

export async function readBundleFile(file: File): Promise<TierBundleV1> {
	confirmBundleSizeGate(file.size, 'import');
	const text = await file.text();
	let parsed: unknown;
	try {
		parsed = JSON.parse(text);
	} catch {
		throw new Error('Not a valid Tier List file.');
	}
	return normalizeToBundle(parsed);
}

export { normalizeToBundle };
