import { motion } from 'motion/react';
import { useLayoutEffect } from 'react';
import type { TierItem } from '../types';
import { isImageItem, isTextItem } from '../types';

export type TierItemDisplayVariant = 'thumb' | 'hero' | 'finale' | 'export';

interface TierItemDisplayProps {
	item: TierItem;
	variant?: TierItemDisplayVariant;
	className?: string;
	hiddenInSpotlight?: boolean;
	onImageError?: () => void;
	onImageLoad?: () => void;
	onContentReady?: () => void;
	'data-testid'?: string;
}

export default function TierItemDisplay({
	item,
	variant = 'thumb',
	className = '',
	hiddenInSpotlight = false,
	onImageError,
	onImageLoad,
	onContentReady,
	'data-testid': dataTestId,
}: TierItemDisplayProps) {
	useLayoutEffect(() => {
		if (isTextItem(item)) {
			onContentReady?.();
		}
	}, [item, onContentReady]);

	if (isTextItem(item)) {
		const sizeClass =
			variant === 'hero'
				? 'tier-text-slide tier-text-slide--hero'
				: variant === 'finale'
					? 'tier-text-slide tier-text-slide--finale'
					: variant === 'export'
						? 'tier-text-slide tier-text-slide--export'
						: 'tier-text-slide tier-text-slide--thumb';
		return (
			<div
				className={`${sizeClass}${hiddenInSpotlight ? ' tier-text-slide--spotlight-hidden' : ''}${className ? ` ${className}` : ''}`}
				data-testid={dataTestId}
			>
				<span className="tier-text-slide__content">{item.text}</span>
			</div>
		);
	}

	if (!isImageItem(item)) {
		return null;
	}

	const imageClass =
		variant === 'hero'
			? 'spotlight-image'
			: variant === 'finale'
				? 'elite-slideshow__image'
				: variant === 'export'
					? 'tier-image'
					: `tier-image${hiddenInSpotlight ? ' tier-image--spotlight-hidden' : ''}`;

	return (
		<motion.img
			src={item.src}
			alt=""
			className={`${imageClass}${className ? ` ${className}` : ''}`}
			data-testid={dataTestId}
			draggable={false}
			onError={onImageError}
			onLoad={onImageLoad}
		/>
	);
}
