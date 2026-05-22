import { motion } from 'motion/react';
import TierItemDisplay from '../TierItemDisplay';
import { itemAccessibleKind } from '../../tierItem';
import type { TierItem } from '../../types';

interface AnimatedImageProps {
	image: TierItem;
	spotlightImageId?: string | null;
	onImageClick?: () => void;
	justLanded?: boolean;
	landedSad?: boolean;
	children?: React.ReactNode;
}

export default function AnimatedImage({
	image,
	spotlightImageId,
	onImageClick,
	justLanded,
	landedSad,
	children,
}: AnimatedImageProps) {
	const hiddenInSpotlight = spotlightImageId === image.id;

	const content = (
		<motion.div className="spotlight-layout-frame spotlight-layout-frame--thumb">
			<motion.div
				className="tier-item-thumb"
				animate={
					justLanded && landedSad
						? { scale: [1, 0.92, 0.96], rotate: [0, 1, 0], y: [0, 4, 0] }
						: justLanded
							? { scale: [0.88, 1.08, 1], rotate: [0, -2, 0] }
							: { scale: 1, rotate: 0, y: 0 }
				}
				transition={
					justLanded && landedSad
						? { duration: 0.55, ease: [0.55, 0.06, 0.68, 0.2] }
						: justLanded
							? { duration: 0.45, ease: [0.22, 1, 0.36, 1] }
							: { type: 'spring', stiffness: 380, damping: 36 }
				}
			>
				<TierItemDisplay
					item={image}
					variant="thumb"
					hiddenInSpotlight={hiddenInSpotlight}
				/>
			</motion.div>
		</motion.div>
	);

	return (
		<motion.span
			className="motion-thumb-wrap"
			layout="position"
			style={{ display: 'inline-block' }}
		>
			{onImageClick ? (
				<button
					type="button"
					className="tier-image-btn"
					onClick={onImageClick}
					aria-label={`View ${itemAccessibleKind(image)}`}
				>
					{content}
				</button>
			) : (
				content
			)}
			{children}
		</motion.span>
	);
}
