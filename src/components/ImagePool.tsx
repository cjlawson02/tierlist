import { LayoutGroup, motion } from 'motion/react';
import ImageList from './ImageList';
import type { TierItem } from '../types';

export default function ImagePool({
	images,
	spotlightImageId,
	onImageClick,
	onDelete,
	layoutScroll,
}: {
	images: TierItem[];
	spotlightImageId?: string | null;
	onImageClick?: (imageId: string) => void;
	onDelete?: (imageId: string) => void;
	layoutScroll?: boolean;
}) {
	const className = 'images pool-panel';
	const content = (
		<ImageList
			images={images}
			spotlightImageId={spotlightImageId}
			onImageClick={onImageClick}
			onDelete={onDelete}
		/>
	);

	if (layoutScroll) {
		return (
			<LayoutGroup>
				<motion.section layoutScroll className={className} aria-label="Slides">
					{content}
				</motion.section>
			</LayoutGroup>
		);
	}

	return (
		<LayoutGroup>
			<section className={className} aria-label="Slides">
				{content}
			</section>
		</LayoutGroup>
	);
}
