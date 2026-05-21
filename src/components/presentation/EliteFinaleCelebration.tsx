import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
	celebrateSlideshowSlide,
	stopSlideshowConfetti,
} from '../../effects/celebrate';
import {
	startEliteSlideshowMusic,
	stopEliteSlideshowMusic,
} from '../../effects/sounds';
import { getEliteFinaleLabel, isEliteTier } from '../../presentationConfig';
import type { ImageItem, TierRow } from '../../types';

interface EliteSlide {
	image: ImageItem;
	tierName: string;
	tierColor: string;
	tierIndex: number;
	label: string;
	isFirstInTier: boolean;
}

interface EliteFinaleCelebrationProps {
	active: boolean;
	rows: TierRow[];
	onComplete: () => void;
}

const SLIDE_MS = 3200;

export default function EliteFinaleCelebration({
	active,
	rows,
	onComplete,
}: EliteFinaleCelebrationProps) {
	const slides = useMemo<EliteSlide[]>(() => {
		const result: EliteSlide[] = [];
		for (const [tierIndex, row] of rows.entries()) {
			if (!isEliteTier(tierIndex, rows.length) || row.images.length === 0) {
				continue;
			}
			const label = getEliteFinaleLabel(tierIndex, rows.length);
			row.images.forEach((image, imageIndex) => {
				result.push({
					image,
					tierName: row.name,
					tierColor: row.color,
					tierIndex,
					label,
					isFirstInTier: imageIndex === 0,
				});
			});
		}
		return result;
	}, [rows]);

	const [slideIndex, setSlideIndex] = useState(0);
	const completedRef = useRef(false);
	const [prevActive, setPrevActive] = useState(active);
	const isLast = slideIndex >= slides.length - 1;

	if (active !== prevActive) {
		setPrevActive(active);
		if (!active) {
			setSlideIndex(0);
		}
	}

	const finish = useCallback(() => {
		if (completedRef.current) {
			return;
		}
		completedRef.current = true;
		stopEliteSlideshowMusic();
		stopSlideshowConfetti();
		onComplete();
	}, [onComplete]);

	const advance = useCallback(() => {
		setSlideIndex((index) => {
			if (index >= slides.length - 1) {
				finish();
				return index;
			}
			return index + 1;
		});
	}, [finish, slides.length]);

	useEffect(() => {
		if (!active) {
			completedRef.current = false;
			stopEliteSlideshowMusic();
			stopSlideshowConfetti();
			return;
		}
		if (slides.length === 0) {
			finish();
			return;
		}
		startEliteSlideshowMusic();
		return () => {
			stopEliteSlideshowMusic();
			stopSlideshowConfetti();
		};
	}, [active, finish, slides.length]);

	useEffect(() => {
		if (!active || slides.length === 0) {
			return;
		}
		const slide = slides[slideIndex];
		void celebrateSlideshowSlide(slide.tierColor, slide.tierIndex, rows.length);
		const timer = window.setTimeout(advance, SLIDE_MS);
		return () => {
			window.clearTimeout(timer);
		};
	}, [active, advance, slideIndex, slides, rows.length]);

	useEffect(() => {
		if (!active) {
			return;
		}
		const onKeyDown = (event: KeyboardEvent) => {
			if (
				event.key === 'Enter' ||
				event.key === ' ' ||
				event.key === 'ArrowRight'
			) {
				event.preventDefault();
				advance();
			}
			if (event.key === 'Escape') {
				event.preventDefault();
				finish();
			}
		};
		window.addEventListener('keydown', onKeyDown);
		return () => {
			window.removeEventListener('keydown', onKeyDown);
		};
	}, [active, advance, finish]);

	if (!active || slides.length === 0) {
		return null;
	}

	const current = slides[slideIndex];

	return createPortal(
		<AnimatePresence mode="wait">
			<motion.div
				key={current.image.id}
				className="elite-slideshow"
				role="dialog"
				aria-modal="true"
				aria-label={`Celebrating ${current.tierName} tier picks`}
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				transition={{ duration: 0.4 }}
				onClick={advance}
			>
				<div className="elite-slideshow__backdrop" aria-hidden="true" />
				<p className="elite-slideshow__progress">
					{slideIndex + 1} / {slides.length}
				</p>
				<motion.div
					className="elite-slideshow__frame"
					initial={{ opacity: 0, scale: 0.92 }}
					animate={{ opacity: 1, scale: 1 }}
					exit={{ opacity: 0, scale: 0.96 }}
					transition={{ type: 'spring', stiffness: 320, damping: 30 }}
					onClick={(event) => {
						event.stopPropagation();
					}}
				>
					<img
						src={current.image.src}
						alt=""
						className="elite-slideshow__image"
						draggable={false}
					/>
				</motion.div>
				<div
					className="elite-slideshow__footer"
					onClick={(event) => {
						event.stopPropagation();
					}}
				>
					{current.isFirstInTier && (
						<motion.p
							className="elite-slideshow__label"
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.12 }}
						>
							{current.label}
						</motion.p>
					)}
					<div className="elite-slideshow__meta">
						<span
							className="elite-slideshow__badge"
							style={{
								backgroundColor: current.tierColor,
								color: 'var(--stage-bg)',
								boxShadow: `0 0 32px color-mix(in srgb, ${current.tierColor} 50%, transparent)`,
							}}
						>
							{current.tierName}
						</span>
						<button
							type="button"
							className="elite-slideshow__btn"
							onClick={advance}
						>
							{isLast ? 'Done' : 'Next'}
						</button>
					</div>
				</div>
			</motion.div>
		</AnimatePresence>,
		document.body,
	);
}
