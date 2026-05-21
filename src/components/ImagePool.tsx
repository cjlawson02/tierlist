import { LayoutGroup, motion } from 'motion/react';
import ImageList from './ImageList';
import type { ImageItem } from '../types';

export default function ImagePool({
	images,
	spotlightImageId,
	onImageClick,
	onDelete,
	layoutScroll,
	highlightFirst,
	introActive,
}: {
	images: ImageItem[];
	spotlightImageId?: string | null;
	onImageClick?: (imageId: string) => void;
	onDelete?: (imageId: string) => void;
	layoutScroll?: boolean;
	highlightFirst?: boolean;
	introActive?: boolean;
}) {
	const className = `images pool-panel${introActive ? ' pool-panel--intro' : ''}`;
	const content = (
		<ImageList
			images={images}
			spotlightImageId={spotlightImageId}
			highlightFirst={highlightFirst}
			onImageClick={onImageClick}
			onDelete={onDelete}
		/>
	);

	if (layoutScroll) {
		return (
			<LayoutGroup>
				<motion.section layoutScroll className={className} aria-label="Photos">
					{content}
				</motion.section>
			</LayoutGroup>
		);
	}

	return (
		<LayoutGroup>
			<section className={className} aria-label="Photos">
				{content}
			</section>
		</LayoutGroup>
	);
}
