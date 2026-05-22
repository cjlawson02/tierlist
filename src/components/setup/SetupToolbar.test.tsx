import { describe, expect, it, vi } from 'vitest';
import SetupToolbar from './SetupToolbar';
import { renderWithProviders, screen } from '../../test/render';
import { createBlobFile, mockFileReaderResult } from '../../test/helpers';
import { DATA_IMAGE_PNG } from '../../test/fixtures';
import { getSetupStoreState } from '../../test/store';

describe('SetupToolbar', () => {
	it('disables start presentation until photos are added', () => {
		renderWithProviders(
			<SetupToolbar onToast={vi.fn()} onStartPresentation={vi.fn()} />,
		);

		expect(
			screen.getByRole('button', { name: 'Start presentation' }),
		).toBeDisabled();
	});

	it('starts presentation when the start button is clicked', async () => {
		getSetupStoreState().addImages([DATA_IMAGE_PNG]);
		const onStartPresentation = vi.fn();
		const { user } = renderWithProviders(
			<SetupToolbar
				onToast={vi.fn()}
				onStartPresentation={onStartPresentation}
			/>,
		);

		await user.click(
			screen.getByRole('button', { name: 'Start presentation' }),
		);
		expect(onStartPresentation).toHaveBeenCalledTimes(1);
	});

	it('adds photos from the file picker', async () => {
		mockFileReaderResult(DATA_IMAGE_PNG);
		const onToast = vi.fn();
		const { user } = renderWithProviders(
			<SetupToolbar onToast={onToast} onStartPresentation={vi.fn()} />,
		);

		await user.click(screen.getByRole('button', { name: 'Add photos' }));
		const photoInput = document.querySelector('input[type="file"]');
		await user.upload(
			photoInput as HTMLInputElement,
			createBlobFile('image-bytes', 'photo.png', 'image/png'),
		);

		expect(getSetupStoreState().untieredImages).toHaveLength(1);
		expect(onToast).not.toHaveBeenCalled();
	});
});
