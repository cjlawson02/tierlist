import { AnimatePresence, motion } from 'motion/react';
import {
	useCallback,
	useEffect,
	useRef,
	useState,
	type CSSProperties,
} from 'react';
import { createPortal } from 'react-dom';
import PresentationQueue from './presentation/PresentationQueue';
import type { ImageItem, TierRow } from '../types';

interface SpotlightProps {
	image: ImageItem | null;
	/** Clears spotlight selection in parent immediately so the list thumbnail reappears */
	onRelease: () => void;
	mode?: 'assign' | 'preview';
	photoLabel?: string | null;
	rows?: TierRow[];
	queueImages?: ImageItem[];
	totalImages?: number;
	spotlightImageId?: string | null;
	queuePaused?: boolean;
	onResumeQueue?: () => void;
	onSelectQueueImage?: (imageId: string) => void;
	onAssignTier?: (
		rowId: string,
		rowName: string,
		rowColor: string,
		tierIndex: number,
	) => void;
}

export default function Spotlight({
	image,
	onRelease,
	mode = 'assign',
	photoLabel,
	rows = [],
	queueImages = [],
	totalImages = 0,
	spotlightImageId = null,
	queuePaused = false,
	onResumeQueue,
	onSelectQueueImage,
	onAssignTier,
}: SpotlightProps) {
	const dialogRef = useRef<HTMLDivElement>(null);
	const previousFocus = useRef<HTMLElement | null>(null);
	const openedRef = useRef<string | null>(null);
	const isPreview = mode === 'preview';
	const [displayImage, setDisplayImage] = useState<ImageItem | null>(null);
	const [isVisible, setIsVisible] = useState(false);
	const [prevImage, setPrevImage] = useState(image);

	if (image !== prevImage) {
		setPrevImage(image);
		if (image) {
			setDisplayImage(image);
			setIsVisible(true);
		} else {
			setIsVisible(false);
		}
	}

	const requestClose = useCallback(() => {
		onRelease();
		setIsVisible(false);
	}, [onRelease]);

	const assign = useCallback(
		(rowId: string, rowName: string, rowColor: string) => {
			if (!onAssignTier) {
				return;
			}
			const tierIndex = rows.findIndex((r) => r.id === rowId);
			if (tierIndex === -1) {
				return;
			}
			onAssignTier(rowId, rowName, rowColor, tierIndex);
			setIsVisible(false);
		},
		[onAssignTier, rows],
	);

	const handleExitComplete = useCallback(() => {
		setDisplayImage(null);
		if (previousFocus.current) {
			previousFocus.current.focus();
			previousFocus.current = null;
		}
	}, []);

	useEffect(() => {
		if (!image) {
			openedRef.current = null;
			return;
		}
		previousFocus.current = document.activeElement as HTMLElement | null;
		requestAnimationFrame(() => dialogRef.current?.focus());
		openedRef.current = image.id;
	}, [image]);

	useEffect(() => {
		if (!image || isPreview) {
			return;
		}
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				event.preventDefault();
				requestClose();
				return;
			}
			const key = event.key.toLowerCase();
			const row = rows.find((r) => r.name.toLowerCase() === key);
			if (row) {
				event.preventDefault();
				assign(row.id, row.name, row.color);
			}
		};
		window.addEventListener('keydown', onKeyDown);
		return () => {
			window.removeEventListener('keydown', onKeyDown);
		};
	}, [image, rows, requestClose, assign, isPreview]);

	useEffect(() => {
		if (!image || !isPreview) {
			return;
		}
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				event.preventDefault();
				requestClose();
			}
		};
		window.addEventListener('keydown', onKeyDown);
		return () => {
			window.removeEventListener('keydown', onKeyDown);
		};
	}, [image, requestClose, isPreview]);

	return createPortal(
		<AnimatePresence onExitComplete={handleExitComplete}>
			{displayImage && isVisible && (
				<motion.div
					key={displayImage.id}
					className={`spotlight-backdrop${isPreview ? ' spotlight-backdrop--preview' : ' spotlight-backdrop--assign'} spotlight-backdrop--broadcast`}
					layoutRoot
					role="dialog"
					aria-modal="true"
					aria-label={
						isPreview
							? 'Image preview — tap outside or press Escape to close'
							: photoLabel
								? `${photoLabel} — assign a tier or press Escape to pause`
								: 'Image spotlight — assign a tier or press Escape to pause'
					}
					tabIndex={-1}
					ref={dialogRef}
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.22 }}
					onClick={isPreview ? undefined : requestClose}
				>
					{isPreview && (
						<button
							type="button"
							className="spotlight-backdrop__hit"
							aria-label="Close preview"
							onClick={requestClose}
						/>
					)}
					<div
						className={`spotlight-panel${isPreview ? '' : ' spotlight-panel--assign'}`}
						onClick={
							isPreview
								? undefined
								: (event) => {
										event.stopPropagation();
									}
						}
					>
						{!isPreview && totalImages > 0 && onResumeQueue && onSelectQueueImage && (
							<PresentationQueue
								images={queueImages}
								totalImages={totalImages}
								spotlightImageId={spotlightImageId}
								queuePaused={queuePaused}
								onResume={onResumeQueue}
								onSelectImage={onSelectQueueImage}
							/>
						)}
						<div className="spotlight-image-wrap">
							<motion.div
								className="spotlight-layout-frame spotlight-layout-frame--hero"
								initial={{ opacity: 0, scale: 0.94 }}
								animate={{ opacity: 1, scale: 1 }}
								exit={{ opacity: 0, scale: 0.96 }}
								transition={{ type: 'spring', stiffness: 360, damping: 32 }}
							>
								<img
									src={displayImage.src}
									alt=""
									className="spotlight-image"
									draggable={false}
								/>
							</motion.div>
						</div>
						{!isPreview && (
							<>
								<div
									className="spotlight-tier-bar"
									style={{ '--tier-count': rows.length } as CSSProperties}
								>
									<div className="spotlight-tier-bar__track">
										{rows.map((row, index) => (
											<span
												key={row.id}
												className="spotlight-tier-chip-wrap"
												style={{
													animationDelay: `${String(80 + index * 45)}ms`,
												}}
											>
												<button
													type="button"
													className="spotlight-tier-chip"
													style={
														{
															backgroundColor: row.color,
															borderColor: row.color,
															color: 'var(--stage-bg)',
															'--chip-glow': row.color,
														} as CSSProperties
													}
													onClick={() => {
														assign(row.id, row.name, row.color);
													}}
												>
													<span className="spotlight-tier-chip-face">
														{row.name}
													</span>
												</button>
											</span>
										))}
									</div>
								</div>
							</>
						)}
					</div>
				</motion.div>
			)}
		</AnimatePresence>,
		document.body,
	);
}
