import { Play } from 'lucide-react';
import IconButton from '../IconButton';
import TierItemDisplay from '../TierItemDisplay';
import { itemPreviewLabel } from '../../tierItem';
import type { TierItem } from '../../types';

interface PresentationQueueProps {
	items: TierItem[];
	totalSlides: number;
	spotlightItemId: string | null;
	queuePaused: boolean;
	onResume: () => void;
	onSelectItem: (itemId: string) => void;
}

export default function PresentationQueue({
	items,
	totalSlides,
	spotlightItemId,
	queuePaused,
	onResume,
	onSelectItem,
}: PresentationQueueProps) {
	const assignedCount = totalSlides - items.length;
	const activeIndex = spotlightItemId
		? items.findIndex((item) => item.id === spotlightItemId)
		: -1;
	const currentNumber =
		activeIndex >= 0
			? assignedCount + activeIndex + 1
			: Math.min(assignedCount + 1, totalSlides);
	const progress =
		totalSlides > 0 ? Math.round((assignedCount / totalSlides) * 100) : 100;
	const upcomingItems = spotlightItemId
		? items.filter((item) => item.id !== spotlightItemId)
		: items;

	return (
		<section className="presentation-queue" aria-label="Slide queue">
			<div className="presentation-queue__header">
				<div className="presentation-queue__status">
					<p className="presentation-queue__label">
						{spotlightItemId
							? `Slide ${String(currentNumber)} of ${String(totalSlides)}`
							: queuePaused
								? 'Paused'
								: items.length > 0
									? `Next up — slide ${String(currentNumber)} of ${String(totalSlides)}`
									: 'All slides ranked'}
					</p>
					<div
						className="presentation-queue__progress"
						role="progressbar"
						aria-valuenow={assignedCount}
						aria-valuemin={0}
						aria-valuemax={totalSlides}
						aria-label={`${String(assignedCount)} of ${String(totalSlides)} slides ranked`}
					>
						<span
							className="presentation-queue__progress-fill"
							style={{ width: `${String(progress)}%` }}
						/>
					</div>
				</div>
				{queuePaused && items.length > 0 && !spotlightItemId && (
					<IconButton
						icon={Play}
						label="Resume queue (Space)"
						variant="primary"
						onClick={onResume}
					/>
				)}
			</div>
			{upcomingItems.length > 0 && (
				<div
					className="presentation-queue__upcoming"
					aria-label="Upcoming slides"
				>
					{upcomingItems.map((item, index) => {
						const slideNumber = spotlightItemId
							? assignedCount + index + 2
							: assignedCount + index + 1;
						const preview = itemPreviewLabel(item);

						return (
							<button
								key={item.id}
								type="button"
								className={`presentation-queue__thumb${index === 0 ? ' presentation-queue__thumb--next' : ''}`}
								onClick={(event) => {
									event.stopPropagation();
									onSelectItem(item.id);
								}}
								aria-label={
									index === 0 && !spotlightItemId
										? `Show slide ${String(slideNumber)} of ${String(totalSlides)}: ${preview}`
										: `Skip to slide ${String(slideNumber)} of ${String(totalSlides)}: ${preview}`
								}
							>
								<TierItemDisplay item={item} variant="thumb" />
							</button>
						);
					})}
				</div>
			)}
		</section>
	);
}
