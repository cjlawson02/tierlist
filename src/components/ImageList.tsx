import { Trash2 } from 'lucide-react';
import AnimatedImage from './motion/AnimatedImage';
import type { ImageItem } from '../types';

interface ImageListProps {
	images: ImageItem[];
	spotlightImageId?: string | null;
	landedImageId?: string | null;
	landedSad?: boolean;
	highlightFirst?: boolean;
	onImageClick?: (imageId: string) => void;
	onDelete?: (imageId: string) => void;
}

export default function ImageList({
	images,
	spotlightImageId,
	landedImageId,
	landedSad,
	highlightFirst,
	onImageClick,
	onDelete,
}: ImageListProps) {
	return (
		<>
			{images.map((image, index) => (
				<span key={image.id} className="item">
					<AnimatedImage
						image={image}
						spotlightImageId={spotlightImageId}
						justLanded={landedImageId === image.id}
						landedSad={landedSad && landedImageId === image.id}
						highlightNext={highlightFirst && index === 0 && !spotlightImageId}
						onImageClick={
							onImageClick
								? () => {
										onImageClick(image.id);
									}
								: undefined
						}
					>
						{onDelete && (
							<button
								type="button"
								className="image-delete-btn"
								onClick={() => {
									onDelete(image.id);
								}}
								aria-label="Remove image"
							>
								<Trash2 size={16} aria-hidden />
							</button>
						)}
					</AnimatedImage>
				</span>
			))}
		</>
	);
}
