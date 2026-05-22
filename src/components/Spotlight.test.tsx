import { describe, expect, it, vi } from 'vitest';
import Spotlight from './Spotlight';
import { renderWithProviders, screen, within } from '../test/render';
import { imageTierItem } from '../test/fixtures';

const image = imageTierItem('img-1');

describe('Spotlight', () => {
	it('closes when the backdrop is clicked in preview mode', async () => {
		const onRelease = vi.fn();
		const { rerender, user } = renderWithProviders(
			<Spotlight mode="preview" item={null} onRelease={onRelease} />,
		);

		rerender(<Spotlight mode="preview" item={image} onRelease={onRelease} />);

		await user.click(
			await screen.findByRole('button', { name: 'Close preview' }),
		);
		expect(onRelease).toHaveBeenCalled();
	});

	it('closes on Escape in preview mode', async () => {
		const onRelease = vi.fn();
		const { rerender, user } = renderWithProviders(
			<Spotlight mode="preview" item={null} onRelease={onRelease} />,
		);

		rerender(<Spotlight mode="preview" item={image} onRelease={onRelease} />);

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
				item={null}
				rows={rows}
				onRelease={onRelease}
				onAssignTier={onAssignTier}
			/>,
		);

		rerender(
			<Spotlight
				mode="assign"
				item={image}
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
				item={null}
				rows={rows}
				onRelease={vi.fn()}
				onAssignTier={onAssignTier}
			/>,
		);

		rerender(
			<Spotlight
				mode="assign"
				item={image}
				rows={rows}
				onRelease={vi.fn()}
				onAssignTier={onAssignTier}
			/>,
		);

		await user.click(await screen.findByRole('button', { name: 'S' }));
		expect(onAssignTier).toHaveBeenCalledWith('row-s', 'S', '#f00', 0);
	});

	it('keeps the spotlight open when switching queue slides', async () => {
		const onSelectQueueItem = vi.fn();
		const queueItems = [image, imageTierItem('img-2')];
		const rows = [{ id: 'row-s', name: 'S', color: '#f00', images: [] }];

		const { rerender, user } = renderWithProviders(
			<Spotlight mode="assign" item={null} rows={rows} onRelease={vi.fn()} />,
		);

		rerender(
			<Spotlight
				mode="assign"
				item={image}
				rows={rows}
				queueItems={queueItems}
				totalSlides={2}
				spotlightItemId="img-1"
				queuePaused={false}
				slideLabel="Slide 1 of 2"
				onRelease={vi.fn()}
				onResumeQueue={vi.fn()}
				onSelectQueueItem={onSelectQueueItem}
			/>,
		);

		const dialog = await screen.findByRole('dialog', { name: /Slide 1 of 2/i });
		await user.click(
			within(dialog).getByRole('button', { name: /Skip to slide 2 of 2/i }),
		);
		expect(onSelectQueueItem).toHaveBeenCalledWith('img-2');

		rerender(
			<Spotlight
				mode="assign"
				item={queueItems[1]}
				rows={rows}
				queueItems={queueItems}
				totalSlides={2}
				spotlightItemId="img-2"
				queuePaused={false}
				slideLabel="Slide 2 of 2"
				onRelease={vi.fn()}
				onResumeQueue={vi.fn()}
				onSelectQueueItem={onSelectQueueItem}
			/>,
		);

		expect(
			screen.getByRole('dialog', { name: /Slide 2 of 2/i }),
		).toBeInTheDocument();
	});

	it('renders text slide content in assign mode', async () => {
		const textItem = {
			id: 'text-1',
			kind: 'text' as const,
			text: 'Rank this idea',
		};

		renderWithProviders(
			<Spotlight
				mode="assign"
				item={textItem}
				rows={[{ id: 'row-s', name: 'S', color: '#f00', images: [] }]}
				onRelease={vi.fn()}
			/>,
		);

		expect(await screen.findByText('Rank this idea')).toBeInTheDocument();
	});
});
