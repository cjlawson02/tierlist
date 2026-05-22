import { AnimatePresence, motion } from 'motion/react';
import {
	useCallback,
	useEffect,
	useRef,
	useState,
	type CSSProperties,
} from 'react';
import { createPortal } from 'react-dom';
import TierItemDisplay from './TierItemDisplay';
import PresentationQueue from './presentation/PresentationQueue';
import type { TierItem, TierRow } from '../types';
import { isTextItem } from '../types';

interface SpotlightProps {
	item?: TierItem | null;
	/** Clears spotlight selection in parent immediately so the list thumbnail reappears */
	onRelease: () => void;
	mode?: 'assign' | 'preview';
	slideLabel?: string | null;
	rows?: TierRow[];
	queueItems?: TierItem[];
	totalSlides?: number;
	spotlightItemId?: string | null;
	queuePaused?: boolean;
	onResumeQueue?: () => void;
	onSelectQueueItem?: (itemId: string) => void;
	onAssignTier?: (
		rowId: string,
		rowName: string,
		rowColor: string,
		tierIndex: number,
	) => void;
}

export default function Spotlight({
	item = null,
	onRelease,
	mode = 'assign',
	slideLabel = null,
	rows = [],
	queueItems = [],
	totalSlides = 0,
	spotlightItemId = null,
	queuePaused = false,
	onResumeQueue,
	onSelectQueueItem,
	onAssignTier,
}: SpotlightProps) {
	const dialogRef = useRef<HTMLDivElement>(null);
	const previousFocus = useRef<HTMLElement | null>(null);
	const isPreview = mode === 'preview';
	const [displayItem, setDisplayItem] = useState<TierItem | null>(item);
	const [isVisible, setIsVisible] = useState(item != null);
	const [prevItem, setPrevItem] = useState(item);

	if (item !== prevItem) {
		setPrevItem(item);
		if (item) {
			setDisplayItem(item);
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
		setDisplayItem(null);
		if (previousFocus.current) {
			previousFocus.current.focus();
			previousFocus.current = null;
		}
	}, []);

	useEffect(() => {
		if (!item) {
			return;
		}
		previousFocus.current = document.activeElement as HTMLElement | null;
		requestAnimationFrame(() => dialogRef.current?.focus());
	}, [item]);

	useEffect(() => {
		if (!item || isPreview) {
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
	}, [item, rows, requestClose, assign, isPreview]);

	useEffect(() => {
		if (!item || !isPreview) {
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
	}, [item, requestClose, isPreview]);

	return createPortal(
		<AnimatePresence onExitComplete={handleExitComplete}>
			{displayItem && isVisible && (
				<motion.div
					key={isPreview ? 'spotlight-preview' : 'spotlight-assign'}
					className={`spotlight-backdrop${isPreview ? ' spotlight-backdrop--preview' : ' spotlight-backdrop--assign'} spotlight-backdrop--broadcast`}
					layoutRoot
					role="dialog"
					aria-modal="true"
					aria-label={
						isPreview
							? isTextItem(displayItem)
								? 'Text slide preview — tap outside or press Escape to close'
								: 'Image preview — tap outside or press Escape to close'
							: slideLabel
								? `${slideLabel} — assign a tier or press Escape to pause`
								: 'Slide spotlight — assign a tier or press Escape to pause'
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
						{!isPreview &&
							totalSlides > 0 &&
							onResumeQueue &&
							onSelectQueueItem && (
								<PresentationQueue
									items={queueItems}
									totalSlides={totalSlides}
									spotlightItemId={spotlightItemId}
									queuePaused={queuePaused}
									onResume={onResumeQueue}
									onSelectItem={onSelectQueueItem}
								/>
							)}
						<div className="spotlight-image-wrap">
							<AnimatePresence mode="popLayout">
								<motion.div
									key={displayItem.id}
									className="spotlight-layout-frame spotlight-layout-frame--hero"
									initial={{ opacity: 0, scale: 0.96 }}
									animate={{ opacity: 1, scale: 1 }}
									exit={{ opacity: 0, scale: 0.98 }}
									transition={{ type: 'spring', stiffness: 420, damping: 34 }}
								>
									<TierItemDisplay item={displayItem} variant="hero" />
								</motion.div>
							</AnimatePresence>
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
