import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { renderWithProviders, screen } from './test/render';
import { getSetupStoreState } from './test/store';
import { DATA_IMAGE_PNG } from './test/fixtures';
import { mockAlert, mockConfirm } from './test/helpers';

describe('App', () => {
	beforeEach(() => {
		vi.useFakeTimers({ shouldAdvanceTime: true });
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('blocks presentation when the pool is empty', async () => {
		const alert = mockAlert();
		const { user } = renderWithProviders(<App />, {
			userEvent: { advanceTimers: vi.advanceTimersByTime },
		});

		await user.click(
			screen.getByRole('button', { name: 'Start presentation' }),
		);

		expect(alert).toHaveBeenCalledWith(
			'Add at least one photo to the pool before starting presentation.',
		);
		expect(
			screen.getByRole('button', { name: 'Add photos' }),
		).toBeInTheDocument();
	});

	it('enters presentation when photos exist in the pool', async () => {
		mockAlert();
		getSetupStoreState().addImages([DATA_IMAGE_PNG]);

		const { user } = renderWithProviders(<App />, {
			userEvent: { advanceTimers: vi.advanceTimersByTime },
		});
		await user.click(
			screen.getByRole('button', { name: 'Start presentation' }),
		);
		await vi.advanceTimersByTimeAsync(500);

		expect(
			await screen.findByRole('button', { name: 'Back to setup' }),
		).toBeInTheDocument();
	});

	it('returns to setup after confirming exit from presentation', async () => {
		mockAlert();
		mockConfirm(true);
		getSetupStoreState().addImages([DATA_IMAGE_PNG]);

		const { user } = renderWithProviders(<App />, {
			userEvent: { advanceTimers: vi.advanceTimersByTime },
		});
		await user.click(
			screen.getByRole('button', { name: 'Start presentation' }),
		);
		await vi.advanceTimersByTimeAsync(500);
		await user.click(
			await screen.findByRole('button', { name: 'Back to setup' }),
		);
		await vi.advanceTimersByTimeAsync(100);

		expect(
			await screen.findByRole('button', { name: 'Start presentation' }),
		).toBeInTheDocument();
	});
});
