import { Trash2 } from 'lucide-react';
import AnimatedImage from './motion/AnimatedImage';
import type { TierItem } from '../types';

interface ImageListProps {
	images: TierItem[];
	spotlightImageId?: string | null;
	landedImageId?: string | null;
	landedSad?: boolean;
	onImageClick?: (imageId: string) => void;
	onDelete?: (imageId: string) => void;
}

export default function ImageList({
	images,
	spotlightImageId,
	landedImageId,
	landedSad,
	onImageClick,
	onDelete,
}: ImageListProps) {
	return (
		<>
			{images.map((image) => (
				<span key={image.id} className="item">
					<AnimatedImage
						image={image}
						spotlightImageId={spotlightImageId}
						justLanded={landedImageId === image.id}
						landedSad={landedSad && landedImageId === image.id}
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
								aria-label="Remove slide"
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
