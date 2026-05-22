import { describe, expect, it, vi } from 'vitest';
import ImageList from './ImageList';
import { renderWithProviders, screen } from '../test/render';
import { imageTierItem, textTierItem } from '../test/fixtures';

const images = [imageTierItem('img-1'), imageTierItem('img-2')];

describe('ImageList', () => {
	it('calls onImageClick with the image id', async () => {
		const onImageClick = vi.fn();
		const { user } = renderWithProviders(
			<ImageList images={images} onImageClick={onImageClick} />,
		);

		const viewButtons = screen.getAllByRole('button', { name: 'View image' });
		await user.click(viewButtons[1] ?? viewButtons[0]);

		expect(onImageClick).toHaveBeenCalledWith('img-2');
	});

	it('calls onDelete when the remove button is clicked', async () => {
		const onDelete = vi.fn();
		const { user } = renderWithProviders(
			<ImageList images={images.slice(0, 1)} onDelete={onDelete} />,
		);

		await user.click(screen.getByRole('button', { name: 'Remove slide' }));
		expect(onDelete).toHaveBeenCalledWith('img-1');
	});

	it('renders text slide content', () => {
		renderWithProviders(
			<ImageList images={[textTierItem('text-1', 'Rank me')]} />,
		);

		expect(screen.getByText('Rank me')).toBeInTheDocument();
	});
});
