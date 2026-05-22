import { describe, expect, it, vi } from 'vitest';
import Spotlight from './Spotlight';
import { renderWithProviders, screen, within } from '../test/render';
import { DATA_IMAGE_PNG } from '../test/fixtures';

const image = { id: 'img-1', src: DATA_IMAGE_PNG };

describe('Spotlight', () => {
	it('closes when the backdrop is clicked in preview mode', async () => {
		const onRelease = vi.fn();
		const { rerender, user } = renderWithProviders(
			<Spotlight mode="preview" image={null} onRelease={onRelease} />,
		);

		rerender(<Spotlight mode="preview" image={image} onRelease={onRelease} />);

		await user.click(
			await screen.findByRole('button', { name: 'Close preview' }),
		);
		expect(onRelease).toHaveBeenCalled();
	});

	it('closes on Escape in preview mode', async () => {
		const onRelease = vi.fn();
		const { rerender, user } = renderWithProviders(
			<Spotlight mode="preview" image={null} onRelease={onRelease} />,
		);

		rerender(<Spotlight mode="preview" image={image} onRelease={onRelease} />);

		expect(
			await screen.findByRole('dialog', { name: /Image preview/i }),
		).toBeInTheDocument();

		await user.keyboard('{Escape}');
		expect(onRelease).toHaveBeenCalled();
	});

	it('assigns a tier when its key is pressed', async () => {
		const onAssignTier = vi.fn();
		const onRelease = vi.fn();
		const rows = [
			{ id: 'row-s', name: 'S', color: '#f00', images: [] },
			{ id: 'row-a', name: 'A', color: '#0f0', images: [] },
		];

		const { rerender, user } = renderWithProviders(
			<Spotlight
				mode="assign"
				image={null}
				rows={rows}
				onRelease={onRelease}
				onAssignTier={onAssignTier}
			/>,
		);

		rerender(
			<Spotlight
				mode="assign"
				image={image}
				rows={rows}
				onRelease={onRelease}
				onAssignTier={onAssignTier}
			/>,
		);

		await screen.findByRole('dialog', { name: /assign a tier/i });
		await user.keyboard('s');

		expect(onAssignTier).toHaveBeenCalledWith('row-s', 'S', '#f00', 0);
		expect(onRelease).not.toHaveBeenCalled();
	});

	it('assigns a tier when a chip is clicked', async () => {
		const onAssignTier = vi.fn();
		const rows = [{ id: 'row-s', name: 'S', color: '#f00', images: [] }];

		const { rerender, user } = renderWithProviders(
			<Spotlight
				mode="assign"
				image={null}
				rows={rows}
				onRelease={vi.fn()}
				onAssignTier={onAssignTier}
			/>,
		);

		rerender(
			<Spotlight
				mode="assign"
				image={image}
				rows={rows}
				onRelease={vi.fn()}
				onAssignTier={onAssignTier}
			/>,
		);

		await user.click(await screen.findByRole('button', { name: 'S' }));
		expect(onAssignTier).toHaveBeenCalledWith('row-s', 'S', '#f00', 0);
	});

	it('keeps the spotlight open when switching queue photos', async () => {
		const onSelectQueueImage = vi.fn();
		const queueImages = [image, { id: 'img-2', src: DATA_IMAGE_PNG }];
		const rows = [{ id: 'row-s', name: 'S', color: '#f00', images: [] }];

		const { rerender, user } = renderWithProviders(
			<Spotlight mode="assign" image={null} rows={rows} onRelease={vi.fn()} />,
		);

		rerender(
			<Spotlight
				mode="assign"
				image={image}
				rows={rows}
				queueImages={queueImages}
				totalImages={2}
				spotlightImageId="img-1"
				queuePaused={false}
				photoLabel="Photo 1 of 2"
				onRelease={vi.fn()}
				onResumeQueue={vi.fn()}
				onSelectQueueImage={onSelectQueueImage}
			/>,
		);

		const dialog = await screen.findByRole('dialog', { name: /Photo 1 of 2/i });
		await user.click(
			within(dialog).getByRole('button', { name: 'Skip to photo 2 of 2' }),
		);
		expect(onSelectQueueImage).toHaveBeenCalledWith('img-2');

		rerender(
			<Spotlight
				mode="assign"
				image={queueImages[1]}
				rows={rows}
				queueImages={queueImages}
				totalImages={2}
				spotlightImageId="img-2"
				queuePaused={false}
				photoLabel="Photo 2 of 2"
				onRelease={vi.fn()}
				onResumeQueue={vi.fn()}
				onSelectQueueImage={onSelectQueueImage}
			/>,
		);

		expect(
			screen.getByRole('dialog', { name: /Photo 2 of 2/i }),
		).toBeInTheDocument();
	});
});
