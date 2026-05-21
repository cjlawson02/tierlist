import { describe, expect, it, vi } from 'vitest';
import SetupToolbar from './SetupToolbar';
import { renderWithProviders, screen } from '../../test/render';
import {
	createBlobFile,
	createJsonFile,
	mockAlert,
	mockFileReaderResult,
	mockPrompt,
} from '../../test/helpers';
import { DATA_IMAGE_PNG, tierBundleV1 } from '../../test/fixtures';
import { getSetupStoreState } from '../../test/store';

describe('SetupToolbar', () => {
	it('starts presentation when the start button is clicked', async () => {
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

	it('exports the tier list and shows a toast', async () => {
		mockPrompt('Saved List');
		const exportSpy = vi
			.spyOn(getSetupStoreState(), 'exportFile')
			.mockResolvedValue(1024);
		const onToast = vi.fn();
		const { user } = renderWithProviders(
			<SetupToolbar onToast={onToast} onStartPresentation={vi.fn()} />,
		);

		await user.click(screen.getByRole('button', { name: 'Export' }));

		expect(exportSpy).toHaveBeenCalledWith('Saved List');
		expect(onToast).toHaveBeenCalledWith(expect.stringMatching(/^Exported \(/));
	});

	it('imports a bundle file and shows a toast', async () => {
		mockFileReaderResult(JSON.stringify(tierBundleV1()));
		const onToast = vi.fn();
		const { user } = renderWithProviders(
			<SetupToolbar onToast={onToast} onStartPresentation={vi.fn()} />,
		);

		await user.click(screen.getByRole('button', { name: 'Import' }));
		const importInput = document.querySelectorAll('input[type="file"]')[1];
		expect(importInput).toBeTruthy();
		await user.upload(
			importInput as HTMLInputElement,
			createJsonFile(tierBundleV1(), 'import.tierlist.json'),
		);

		expect(onToast).toHaveBeenCalledWith('Imported import.tierlist.json');
		expect(getSetupStoreState().title).toBe('Test Tier List');
	});

	it('alerts when import fails', async () => {
		mockFileReaderResult('{ invalid json');
		const alert = mockAlert();
		const { user } = renderWithProviders(
			<SetupToolbar onToast={vi.fn()} onStartPresentation={vi.fn()} />,
		);

		await user.click(screen.getByRole('button', { name: 'Import' }));
		const importInput = document.querySelectorAll('input[type="file"]')[1];
		await user.upload(
			importInput as HTMLInputElement,
			createJsonFile({ bad: true }, 'broken.json'),
		);

		expect(alert).toHaveBeenCalled();
	});

	it('adds photos from the file picker', async () => {
		mockFileReaderResult(DATA_IMAGE_PNG);
		const onToast = vi.fn();
		const { user } = renderWithProviders(
			<SetupToolbar onToast={onToast} onStartPresentation={vi.fn()} />,
		);

		await user.click(screen.getByRole('button', { name: 'Add photos' }));
		const photoInput = document.querySelectorAll('input[type="file"]')[0];
		await user.upload(
			photoInput as HTMLInputElement,
			createBlobFile('image-bytes', 'photo.png', 'image/png'),
		);

		expect(getSetupStoreState().untieredImages).toHaveLength(1);
		expect(onToast).not.toHaveBeenCalled();
	});
});
