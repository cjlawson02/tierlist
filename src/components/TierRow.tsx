import { motion } from 'motion/react';
import type { CSSProperties } from 'react';
import ImageList from './ImageList';
import TierLabel from './TierLabel';
import type { TierRow as TierRowData } from '../types';

interface TierRowProps {
	row: TierRowData;
	spotlightImageId?: string | null;
	highlight?: boolean;
	highlightColor?: string | null;
	highlightSad?: boolean;
	landedImageId?: string | null;
	introIndex?: number;
	introActive?: boolean;
	onImageClick?: (imageId: string) => void;
}

export default function TierRow({
	row,
	spotlightImageId,
	highlight,
	highlightColor,
	highlightSad,
	landedImageId,
	introIndex = 0,
	introActive,
	onImageClick,
}: TierRowProps) {
	return (
		<motion.div
			className={`row${highlight ? ` row-highlight${highlightSad ? ' row-highlight--sad' : ''}` : ''}`}
			data-row-id={row.id}
			layout="position"
			style={
				{
					'--row-intro-index': introIndex,
					'--row-highlight-color': highlightColor ?? row.color,
				} as CSSProperties
			}
			initial={introActive ? { opacity: 0, x: -28 } : false}
			animate={introActive ? { opacity: 1, x: 0 } : undefined}
			transition={
				introActive
					? {
							delay: 0.15 + introIndex * 0.07,
							type: 'spring',
							stiffness: 320,
							damping: 28,
						}
					: undefined
			}
		>
			<TierLabel
				name={row.name}
				color={row.color}
				highlight={highlight}
				highlightSad={highlightSad}
			/>
			<span className="items">
				<ImageList
					images={row.images}
					spotlightImageId={spotlightImageId}
					landedImageId={landedImageId}
					landedSad={highlightSad}
					onImageClick={onImageClick}
				/>
			</span>
		</motion.div>
	);
}
