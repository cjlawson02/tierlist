import { toBlob } from 'html-to-image';
import { inlineRemoteImages, waitForImages } from './imageEmbed';

export function sanitizeExportFilename(title: string): string {
	const trimmed = title.trim();
	if (!trimmed) {
		return 'tier-list';
	}
	const sanitized = trimmed
		.replace(/[^\w\s-]/g, '')
		.trim()
		.replace(/\s+/g, '-');
	return sanitized || 'tier-list';
}

export async function saveTierListImage(
	element: HTMLElement,
	title: string,
): Promise<void> {
	const filename = `${sanitizeExportFilename(title)}.png`;
	const snapshot = createExportSnapshot(element);
	const restoreImages = await inlineRemoteImages(snapshot);
	try {
		await waitForImages(snapshot);
		const width = snapshot.scrollWidth || element.scrollWidth;
		const height = snapshot.scrollHeight || element.scrollHeight;
		if (width === 0 || height === 0) {
			throw new Error('Failed to generate image');
		}
		const blob = await toBlob(snapshot, {
			width,
			height,
			pixelRatio: 4,
			backgroundColor: '#0d0d12',
			cacheBust: true,
			style: {
				position: 'static',
			},
		});

		if (!blob) {
			throw new Error('Failed to generate image');
		}

		downloadBlob(blob, filename);
	} finally {
		restoreImages();
		snapshot.remove();
	}
}

function createExportSnapshot(element: HTMLElement): HTMLElement {
	const snapshot = element.cloneNode(true) as HTMLElement;
	snapshot.setAttribute('aria-hidden', 'true');
	snapshot.style.pointerEvents = 'none';
	document.body.appendChild(snapshot);
	return snapshot;
}

function downloadBlob(blob: Blob, filename: string): void {
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
