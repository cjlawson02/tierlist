import { describe, expect, it } from 'vitest';
import SoundToggle from './SoundToggle';
import { SOUND_MUTE_KEY } from '../../presentationConfig';
import { renderWithProviders, screen } from '../../test/render';

describe('SoundToggle', () => {
	it('toggles mute state in localStorage', async () => {
		const { user } = renderWithProviders(<SoundToggle />);

		expect(
			screen.getByRole('button', { name: 'Mute sounds' }),
		).toBeInTheDocument();

		await user.click(screen.getByRole('button', { name: 'Mute sounds' }));

		expect(localStorage.getItem(SOUND_MUTE_KEY)).toBe('1');
		expect(
			screen.getByRole('button', { name: 'Unmute sounds' }),
		).toBeInTheDocument();
	});
});
