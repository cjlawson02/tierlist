import { MAX_IMAGE_BYTES } from './constants';
import { formatBytes } from './bundle';

export const readFileAsDataUrl = (file: Blob) =>
	new Promise<string>((resolve, reject) => {
		if (file.size > MAX_IMAGE_BYTES) {
			reject(
				new Error(
					`Image is too large (${formatBytes(file.size)}). Maximum size is ${formatBytes(MAX_IMAGE_BYTES)}.`,
				),
			);
			return;
		}
		const reader = new FileReader();
		reader.onload = () => {
			resolve(reader.result as string);
		};
		reader.onerror = () => {
			reject(reader.error ?? new Error('Failed to read file'));
		};
		reader.readAsDataURL(file);
	});
