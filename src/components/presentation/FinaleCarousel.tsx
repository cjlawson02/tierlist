import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	type CSSProperties,
} from 'react';
import { createPortal } from 'react-dom';
import IconButton from '../IconButton';
import type { ImageItem, TierRow } from '../../types';

interface FinaleSlide {
	image: ImageItem;
	tierName: string;
	tierColor: string;
}

interface FinaleCarouselProps {
	active: boolean;
	rows: TierRow[];
	onComplete: () => void;
}

const STEP_MS = 1700;
const VISIBLE_CARDS = 3;
const MIN_LOOP_MS = 16000;
const BADGE_INSET_PX = 14;

interface FinaleSlideCardProps {
	slide: FinaleSlide;
	failed: boolean;
	onImageError: () => void;
}

function FinaleSlideCard({
	slide,
	failed,
	onImageError,
}: FinaleSlideCardProps) {
	const mediaRef = useRef<HTMLDivElement>(null);
	const [badgePosition, setBadgePosition] = useState<{
		left: number;
		bottom: number;
	} | null>(null);

	const syncBadgePosition = useCallback(() => {
		const media = mediaRef.current;
		if (!media) {
			return;
		}
		const { clientWidth, clientHeight } = media;
		const img = media.querySelector('img');
		if (
			failed ||
			!(img instanceof HTMLImageElement) ||
			!img.complete ||
			img.naturalWidth === 0
		) {
			setBadgePosition(null);
			return;
		}

		const scale = Math.min(
			clientWidth / img.naturalWidth,
			clientHeight / img.naturalHeight,
		);
		const displayWidth = img.naturalWidth * scale;
		const displayHeight = img.naturalHeight * scale;
		const offsetX = (clientWidth - displayWidth) / 2;
		const offsetY = (clientHeight - displayHeight) / 2;

		setBadgePosition({
			left: offsetX + displayWidth / 2,
			bottom: clientHeight - (offsetY + displayHeight) + BADGE_INSET_PX,
		});
	}, [failed]);

	useEffect(() => {
		syncBadgePosition();
		const media = mediaRef.current;
		if (!media) {
			return;
		}
		const observer = new ResizeObserver(syncBadgePosition);
		observer.observe(media);
		return () => {
			observer.disconnect();
		};
	}, [slide.image.src, syncBadgePosition]);

	return (
		<figure className="elite-slideshow__card">
			<div className="elite-slideshow__media" ref={mediaRef}>
				{failed ? (
					<div
						className="elite-slideshow__image-fallback"
						role="img"
						aria-label="Image unavailable"
					>
						Image unavailable
					</div>
				) : (
					<img
						src={slide.image.src}
						alt=""
						data-testid={`finale-slide-${slide.image.id}`}
						className="elite-slideshow__image"
						draggable={false}
						onLoad={syncBadgePosition}
						onError={onImageError}
					/>
				)}
				<span
					className="elite-slideshow__badge"
					style={
						{
							backgroundColor: slide.tierColor,
							color: 'var(--stage-bg)',
							'--badge-glow': slide.tierColor,
							...(badgePosition
								? {
										left: `${String(badgePosition.left)}px`,
										bottom: `${String(badgePosition.bottom)}px`,
									}
								: {}),
						} as CSSProperties
					}
				>
					{slide.tierName}
				</span>
			</div>
		</figure>
	);
}

export default function FinaleCarousel({
	active,
	rows,
	onComplete,
}: FinaleCarouselProps) {
	const slides = useMemo<FinaleSlide[]>(() => {
		const result: FinaleSlide[] = [];
		for (const row of rows) {
			if (row.images.length === 0) {
				continue;
			}
			row.images.forEach((image) => {
				result.push({
					image,
					tierName: row.name,
					tierColor: row.color,
				});
			});
		}
		return result;
	}, [rows]);

	const completedRef = useRef(false);
	const [failedImageIds, setFailedImageIds] = useState<Set<string>>(new Set());
	const [prevActive, setPrevActive] = useState(active);

	if (active !== prevActive) {
		setPrevActive(active);
		if (active) {
			setFailedImageIds(new Set());
		}
	}

	const shouldScroll = slides.length > VISIBLE_CARDS;
	const loopMs = Math.max(MIN_LOOP_MS, slides.length * STEP_MS);
	const trackSlides = shouldScroll ? [...slides, ...slides] : slides;

	const finish = useCallback(() => {
		if (completedRef.current) {
			return;
		}
		completedRef.current = true;
		onComplete();
	}, [onComplete]);

	useEffect(() => {
		if (active) {
			completedRef.current = false;
		}
	}, [active]);

	useEffect(() => {
		if (active && slides.length === 0) {
			finish();
		}
	}, [active, finish, slides.length]);

	useEffect(() => {
		if (!active) {
			return;
		}
		const onKeyDown = (event: KeyboardEvent) => {
			const target = event.target;
			if (
				target instanceof HTMLElement &&
				(target.tagName === 'INPUT' ||
					target.tagName === 'TEXTAREA' ||
					target.isContentEditable)
			) {
				return;
			}
			if (
				event.key === 'Enter' ||
				event.key === ' ' ||
				event.key === 'ArrowRight'
			) {
				event.preventDefault();
				finish();
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
	}, [active, finish]);

	if (!active || slides.length === 0) {
		return null;
	}

	return createPortal(
		<AnimatePresence>
			<motion.div
				className="elite-slideshow"
				role="dialog"
				aria-modal="true"
				aria-label="Finale carousel"
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				transition={{ duration: 0.4 }}
			>
				<div className="elite-slideshow__backdrop" aria-hidden="true" />
				<div className="elite-slideshow__close">
					<IconButton
						icon={X}
						label="Exit carousel"
						iconOnly
						onClick={(event) => {
							event.stopPropagation();
							finish();
						}}
					/>
				</div>
				<header className="elite-slideshow__header">
					<p className="elite-slideshow__message">Nice job ranking!</p>
					<p className="elite-slideshow__submessage">
						Every photo landed in a tier.
					</p>
				</header>
				<div
					className="elite-slideshow__lane"
					onClick={(event) => {
						event.stopPropagation();
					}}
				>
					<motion.div
						className={`elite-slideshow__track${shouldScroll ? ' elite-slideshow__track--scrolling' : ''}`}
						style={
							{
								'--finale-scroll-duration': `${String(loopMs)}ms`,
							} as CSSProperties
						}
					>
						{trackSlides.map((slide, index) => (
							<FinaleSlideCard
								key={`${slide.image.id}-${String(index)}`}
								slide={slide}
								failed={failedImageIds.has(slide.image.id)}
								onImageError={() => {
									setFailedImageIds((current) => {
										if (current.has(slide.image.id)) {
											return current;
										}
										const next = new Set(current);
										next.add(slide.image.id);
										return next;
									});
								}}
							/>
						))}
					</motion.div>
				</div>
				<footer className="elite-slideshow__footer">
					<button
						type="button"
						className="elite-slideshow__continue"
						onClick={(event) => {
							event.stopPropagation();
							finish();
						}}
					>
						Continue
					</button>
				</footer>
			</motion.div>
		</AnimatePresence>,
		document.body,
	);
}
