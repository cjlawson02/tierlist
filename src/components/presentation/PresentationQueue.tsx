import { Play } from 'lucide-react';
import IconButton from '../IconButton';
import type { ImageItem } from '../../types';

interface PresentationQueueProps {
	images: ImageItem[];
	totalImages: number;
	spotlightImageId: string | null;
	queuePaused: boolean;
	onResume: () => void;
	onSelectImage: (imageId: string) => void;
}

export default function PresentationQueue({
	images,
	totalImages,
	spotlightImageId,
	queuePaused,
	onResume,
	onSelectImage,
}: PresentationQueueProps) {
	const assignedCount = totalImages - images.length;
	const activeIndex = spotlightImageId
		? images.findIndex((image) => image.id === spotlightImageId)
		: -1;
	const currentNumber =
		activeIndex >= 0
			? assignedCount + activeIndex + 1
			: Math.min(assignedCount + 1, totalImages);
	const progress =
		totalImages > 0 ? Math.round((assignedCount / totalImages) * 100) : 100;
	const upcomingImages = spotlightImageId
		? images.filter((image) => image.id !== spotlightImageId)
		: images;

	return (
		<section className="presentation-queue" aria-label="Photo queue">
			<div className="presentation-queue__header">
				<div className="presentation-queue__status">
					<p className="presentation-queue__label">
						{spotlightImageId
							? `Photo ${String(currentNumber)} of ${String(totalImages)}`
							: queuePaused
								? 'Paused'
								: images.length > 0
									? `Next up — photo ${String(currentNumber)} of ${String(totalImages)}`
									: 'All photos ranked'}
					</p>
					<div
						className="presentation-queue__progress"
						role="progressbar"
						aria-valuenow={assignedCount}
						aria-valuemin={0}
						aria-valuemax={totalImages}
						aria-label={`${String(assignedCount)} of ${String(totalImages)} photos ranked`}
					>
						<span
							className="presentation-queue__progress-fill"
							style={{ width: `${String(progress)}%` }}
						/>
					</div>
				</div>
				{queuePaused && images.length > 0 && !spotlightImageId && (
					<IconButton
						icon={Play}
						label="Resume queue (Space)"
						variant="primary"
						onClick={onResume}
					/>
				)}
			</div>
			{upcomingImages.length > 0 && (
				<div
					className="presentation-queue__upcoming"
					aria-label="Upcoming photos"
				>
					{upcomingImages.map((image, index) => {
						const photoNumber = spotlightImageId
							? assignedCount + index + 2
							: assignedCount + index + 1;

						return (
							<button
								key={image.id}
								type="button"
								className={`presentation-queue__thumb${index === 0 ? ' presentation-queue__thumb--next' : ''}`}
								onClick={(event) => {
									event.stopPropagation();
									onSelectImage(image.id);
								}}
								aria-label={
									index === 0 && !spotlightImageId
										? `Show photo ${String(photoNumber)} of ${String(totalImages)}`
										: `Skip to photo ${String(photoNumber)} of ${String(totalImages)}`
								}
							>
								<img src={image.src} alt="" draggable={false} />
							</button>
						);
					})}
				</div>
			)}
		</section>
	);
}
