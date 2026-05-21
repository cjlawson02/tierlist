import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen } from '../test/render';
import EditableTitle from './EditableTitle';

describe('EditableTitle', () => {
	it('commits the edited title on Enter', async () => {
		const onChange = vi.fn();
		const { user } = renderWithProviders(
			<EditableTitle value="My List" onChange={onChange} />,
		);

		await user.click(screen.getByRole('button', { name: 'Edit title' }));
		const input = screen.getByRole('textbox', { name: 'Tier List title' });
		await user.clear(input);
		await user.type(input, 'New Title{Enter}');

		expect(onChange).toHaveBeenCalledWith('New Title');
	});

	it('restores the original title on Escape', async () => {
		const onChange = vi.fn();
		const { user } = renderWithProviders(
			<EditableTitle value="My List" onChange={onChange} />,
		);

		await user.click(screen.getByRole('button', { name: 'Edit title' }));
		const input = screen.getByRole('textbox', { name: 'Tier List title' });
		await user.type(input, ' changed');
		await user.keyboard('{Escape}');

		expect(onChange).not.toHaveBeenCalled();
		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
			'My List',
		);
	});

	it('commits on blur with trimmed value', async () => {
		const onChange = vi.fn();
		const { user } = renderWithProviders(
			<EditableTitle value="My List" onChange={onChange} />,
		);

		await user.click(screen.getByRole('button', { name: 'Edit title' }));
		const input = screen.getByRole('textbox', { name: 'Tier List title' });
		await user.clear(input);
		await user.type(input, '  Trimmed  ');
		await user.tab();

		expect(onChange).toHaveBeenCalledWith('Trimmed');
	});
});
