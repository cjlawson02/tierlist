import Autoplay from 'embla-carousel-autoplay';
import useEmblaCarousel from 'embla-carousel-react';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	type Dispatch,
	type SetStateAction,
} from 'react';
import { createPortal } from 'react-dom';
import IconButton from '../IconButton';
import TierItemDisplay from '../TierItemDisplay';
import type { TierItem, TierRow } from '../../types';
import { isImageItem } from '../../types';

interface FinaleSlide {
	item: TierItem;
	tierName: string;
	tierColor: string;
}

interface FinaleCarouselProps {
	active: boolean;
	title: string;
	rows: TierRow[];
	onComplete: () => void;
	onSaveImage?: () => void;
	saveImageBusy?: boolean;
}

const VISIBLE_CARDS = 3;
const BADGE_INSET_PX = 14;
const AUTOPLAY_DELAY_MS = 1700;

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
		const textSlide = media.querySelector(
			'.tier-text-slide--finale, .tier-text-slide--hero',
		);
		if (textSlide instanceof HTMLElement) {
			const rect = textSlide.getBoundingClientRect();
			if (rect.width === 0 && rect.height === 0) {
				setBadgePosition(null);
				return;
			}
			const mediaRect = media.getBoundingClientRect();
			setBadgePosition({
				left: rect.left - mediaRect.left + rect.width / 2,
				bottom: mediaRect.bottom - rect.bottom + BADGE_INSET_PX,
			});
			return;
		}
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
	}, [slide.item, syncBadgePosition]);

	return (
		<div className="elite-slideshow__media" ref={mediaRef}>
			{failed && isImageItem(slide.item) ? (
				<div
					className="elite-slideshow__image-fallback"
					role="img"
					aria-label="Image unavailable"
				>
					Image unavailable
				</div>
			) : (
				<TierItemDisplay
					item={slide.item}
					variant="finale"
					data-testid={`finale-slide-${slide.item.id}`}
					onImageError={onImageError}
					onImageLoad={syncBadgePosition}
					onContentReady={syncBadgePosition}
				/>
			)}
			<span
				className="elite-slideshow__badge"
				style={{
					backgroundColor: slide.tierColor,
					color: 'var(--stage-bg)',
					...(badgePosition
						? {
								left: `${String(badgePosition.left)}px`,
								bottom: `${String(badgePosition.bottom)}px`,
							}
						: {}),
				}}
			>
				{slide.tierName}
			</span>
		</div>
	);
}

function markItemFailed(
	itemId: string,
	setFailedItemIds: Dispatch<SetStateAction<Set<string>>>,
) {
	setFailedItemIds((current) => {
		if (current.has(itemId)) {
			return current;
		}
		const next = new Set(current);
		next.add(itemId);
		return next;
	});
}

interface FinaleCarouselLaneProps {
	slides: FinaleSlide[];
	failedItemIds: Set<string>;
	onImageError: (itemId: string) => void;
}

function FinaleCarouselEmblaLane({
	slides,
	failedItemIds,
	onImageError,
	active,
}: FinaleCarouselLaneProps & { active: boolean }) {
	const [autoplayPlugin] = useState(() =>
		Autoplay({
			delay: AUTOPLAY_DELAY_MS,
			stopOnInteraction: true,
			stopOnMouseEnter: false,
		}),
	);
	const [emblaRef, emblaApi] = useEmblaCarousel(
		{
			align: 'start',
			loop: true,
			dragFree: true,
		},
		[autoplayPlugin],
	);

	useEffect(() => {
		if (!emblaApi) {
			return;
		}
		if (!active) {
			autoplayPlugin.stop();
			return;
		}
		emblaApi.reInit({
			align: 'start',
			loop: true,
			dragFree: true,
		});
		autoplayPlugin.reset();
		autoplayPlugin.play();
	}, [active, autoplayPlugin, emblaApi]);

	return (
		<div
			className="elite-slideshow__lane"
			onClick={(event) => {
				event.stopPropagation();
			}}
		>
			<div className="elite-slideshow__viewport" ref={emblaRef}>
				<motion.div className="elite-slideshow__track">
					{slides.map((slide) => (
						<FinaleSlideCard
							key={slide.item.id}
							slide={slide}
							failed={failedItemIds.has(slide.item.id)}
							onImageError={() => {
								onImageError(slide.item.id);
							}}
						/>
					))}
				</motion.div>
			</div>
		</div>
	);
}

function FinaleCarouselStaticLane({
	slides,
	failedItemIds,
	onImageError,
}: FinaleCarouselLaneProps) {
	return (
		<div
			className="elite-slideshow__lane elite-slideshow__lane--static"
			onClick={(event) => {
				event.stopPropagation();
			}}
		>
			<div className="elite-slideshow__track">
				{slides.map((slide) => (
					<FinaleSlideCard
						key={slide.item.id}
						slide={slide}
						failed={failedItemIds.has(slide.item.id)}
						onImageError={() => {
							onImageError(slide.item.id);
						}}
					/>
				))}
			</div>
		</div>
	);
}

export default function FinaleCarousel({
	active,
	title,
	rows,
	onComplete,
	onSaveImage,
	saveImageBusy = false,
}: FinaleCarouselProps) {
	const slides = useMemo<FinaleSlide[]>(() => {
		const result: FinaleSlide[] = [];
		for (const row of rows) {
			if (row.images.length === 0) {
				continue;
			}
			row.images.forEach((item) => {
				result.push({
					item,
					tierName: row.name,
					tierColor: row.color,
				});
			});
		}
		return result;
	}, [rows]);

	const completedRef = useRef(false);
	const [failedItemIds, setFailedItemIds] = useState<Set<string>>(new Set());
	const [prevActive, setPrevActive] = useState(active);

	if (active !== prevActive) {
		setPrevActive(active);
		if (active) {
			setFailedItemIds(new Set());
		}
	}

	const shouldScroll = slides.length > VISIBLE_CARDS;
	const handleImageError = useCallback(
		(itemId: string) => {
			markItemFailed(itemId, setFailedItemIds);
		},
		[setFailedItemIds],
	);

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
					<p className="elite-slideshow__eyebrow">Complete</p>
					<h2 className="elite-slideshow__title">{title}</h2>
					<p className="elite-slideshow__subtitle">
						Download an image of your tier list to share with friends.
					</p>
				</header>
				{shouldScroll ? (
					<FinaleCarouselEmblaLane
						active={active}
						slides={slides}
						failedItemIds={failedItemIds}
						onImageError={handleImageError}
					/>
				) : (
					<FinaleCarouselStaticLane
						slides={slides}
						failedItemIds={failedItemIds}
						onImageError={handleImageError}
					/>
				)}
				<footer className="elite-slideshow__footer">
					{onSaveImage && (
						<button
							type="button"
							className="elite-slideshow__action elite-slideshow__action--primary"
							onClick={(event) => {
								event.stopPropagation();
								onSaveImage();
							}}
							disabled={saveImageBusy}
						>
							{saveImageBusy ? 'Downloading…' : 'Download image'}
						</button>
					)}
					<button
						type="button"
						className="elite-slideshow__action"
						onClick={(event) => {
							event.stopPropagation();
							finish();
						}}
						disabled={saveImageBusy}
					>
						Show me my list
					</button>
				</footer>
			</motion.div>
		</AnimatePresence>,
		document.body,
	);
}
