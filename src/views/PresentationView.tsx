import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	type CSSProperties,
} from 'react';
import IconButton from '../components/IconButton';
import Spotlight from '../components/Spotlight';
import TierRow from '../components/TierRow';
import BroadcastLowerThird from '../components/presentation/BroadcastLowerThird';
import FinaleCarousel from '../components/presentation/FinaleCarousel';
import FinaleOverlay from '../components/presentation/FinaleOverlay';
import PresentationQueue from '../components/presentation/PresentationQueue';
import SoundToggle from '../components/presentation/SoundToggle';
import { celebrateTier } from '../effects/celebrate';
import {
	playLanding,
	playSpotlightOpen,
	playTierAssign,
	resumeAudioContext,
	stopAllSounds,
} from '../effects/sounds';
import {
	getDisappointmentTone,
	getLowerThirdLabel,
	getTierRank,
	QUEUE,
} from '../presentationConfig';
import { useSetupStore } from '../store/setupStore';

interface PresentationViewProps {
	onExitSetup: () => void;
	introActive?: boolean;
}

export default function PresentationView({
	onExitSetup,
	introActive = false,
}: PresentationViewProps) {
	const title = useSetupStore((state) => state.title);
	const rows = useSetupStore((state) => state.rows);
	const untieredImages = useSetupStore((state) => state.untieredImages);
	const moveImage = useSetupStore((state) => state.moveImage);

	const tierListRef = useRef<HTMLDivElement>(null);
	const finaleTriggered = useRef(false);
	const assignmentsThisSession = useRef(0);
	const highlightTimerRef = useRef<number | null>(null);
	const queueAdvanceTimerRef = useRef<number | null>(null);
	const queueStartedRef = useRef(false);

	const [totalImages] = useState(
		() =>
			untieredImages.length + rows.reduce((n, row) => n + row.images.length, 0),
	);

	const [labelSize, setLabelSize] = useState<number | null>(null);
	const [spotlightImageId, setSpotlightImageId] = useState<string | null>(null);
	const [queuePaused, setQueuePaused] = useState(false);
	const [highlightRowId, setHighlightRowId] = useState<string | null>(null);
	const [highlightColor, setHighlightColor] = useState<string | null>(null);
	const [landedImageId, setLandedImageId] = useState<string | null>(null);
	const [highlightSad, setHighlightSad] = useState(false);
	const [lowerThird, setLowerThird] = useState<{
		name: string;
		color: string;
		label: string;
		tone: ReturnType<typeof getDisappointmentTone>;
	} | null>(null);
	const [showFinale, setShowFinale] = useState(false);
	const [finaleCarouselActive, setFinaleCarouselActive] = useState(false);

	const hasFinaleSlides = useMemo(
		() => rows.some((row) => row.images.length > 0),
		[rows],
	);

	const syncLabelSize = useCallback(() => {
		const tierList = tierListRef.current;
		if (!tierList) {
			return;
		}
		const labels = tierList.querySelectorAll('.tier-label-readonly');
		if (labels.length === 0) {
			return;
		}
		const cellSize =
			Number.parseFloat(
				getComputedStyle(tierList).getPropertyValue('--tier-cell-size'),
			) || 120;
		const contentWidths = [...labels].map(
			(el) => (el as HTMLElement).scrollWidth,
		);
		setLabelSize(Math.max(...contentWidths, cellSize));
	}, []);

	useEffect(() => {
		syncLabelSize();
		const tierList = tierListRef.current;
		if (!tierList) {
			return;
		}
		const observer = new ResizeObserver(() => {
			syncLabelSize();
		});
		observer.observe(tierList);
		return () => {
			observer.disconnect();
		};
	}, [syncLabelSize, rows]);

	useEffect(() => {
		if (landedImageId) {
			const t = window.setTimeout(() => {
				setLandedImageId(null);
			}, 500);
			return () => {
				window.clearTimeout(t);
			};
		}
	}, [landedImageId]);

	useEffect(() => {
		if (lowerThird) {
			const t = window.setTimeout(() => {
				setLowerThird(null);
			}, 2200);
			return () => {
				window.clearTimeout(t);
			};
		}
	}, [lowerThird]);

	useEffect(() => {
		return () => {
			stopAllSounds();
			if (highlightTimerRef.current != null) {
				window.clearTimeout(highlightTimerRef.current);
			}
			if (queueAdvanceTimerRef.current != null) {
				window.clearTimeout(queueAdvanceTimerRef.current);
			}
		};
	}, []);

	useEffect(() => {
		if (
			untieredImages.length === 0 &&
			totalImages > 0 &&
			assignmentsThisSession.current > 0 &&
			!finaleTriggered.current &&
			!introActive
		) {
			finaleTriggered.current = true;
			const t = window.setTimeout(() => {
				setShowFinale(true);
			}, 800);
			return () => {
				window.clearTimeout(t);
			};
		}
	}, [untieredImages.length, totalImages, introActive]);

	const handleFinaleContinue = useCallback(() => {
		setShowFinale(false);
		if (hasFinaleSlides) {
			setFinaleCarouselActive(true);
		}
	}, [hasFinaleSlides]);

	const handleFinaleCarouselComplete = useCallback(() => {
		setFinaleCarouselActive(false);
	}, []);

	const spotlightImage =
		spotlightImageId != null
			? (rows.flatMap((r) => r.images).find((i) => i.id === spotlightImageId) ??
				untieredImages.find((i) => i.id === spotlightImageId) ??
				null)
			: null;

	const openSpotlight = useCallback(async (imageId: string) => {
		await resumeAudioContext();
		playSpotlightOpen();
		setQueuePaused(false);
		setSpotlightImageId(imageId);
	}, []);

	const clearQueueAdvance = useCallback(() => {
		if (queueAdvanceTimerRef.current != null) {
			window.clearTimeout(queueAdvanceTimerRef.current);
			queueAdvanceTimerRef.current = null;
		}
	}, []);

	const scheduleQueueAdvance = useCallback(
		(nextImageId: string, delayMs: number) => {
			clearQueueAdvance();
			queueAdvanceTimerRef.current = window.setTimeout(() => {
				queueAdvanceTimerRef.current = null;
				void openSpotlight(nextImageId);
			}, delayMs);
		},
		[clearQueueAdvance, openSpotlight],
	);

	const resumeQueue = useCallback(() => {
		if (spotlightImageId || untieredImages.length === 0) {
			return;
		}
		void openSpotlight(untieredImages[0].id);
	}, [openSpotlight, spotlightImageId, untieredImages]);

	const handleAssignTier = (
		rowId: string,
		rowName: string,
		rowColor: string,
		tierIndex: number,
	) => {
		if (!spotlightImageId) {
			return;
		}
		const imageId = spotlightImageId;
		const row = rows.find((r) => r.id === rowId);
		if (!row) {
			return;
		}
		const nextImageId =
			untieredImages.find((image) => image.id !== imageId)?.id ?? null;
		const rank = getTierRank(tierIndex, rows.length);
		const tone = getDisappointmentTone(tierIndex, rows.length);
		const sad = rank >= 0.5;
		const highlightMs =
			rank >= 5 / 6 ? 280 : rank >= 0.5 ? 360 : rank >= 1 / 3 ? 440 : 520;

		assignmentsThisSession.current += 1;
		setSpotlightImageId(null);
		moveImage(imageId, { type: 'row', rowId }, row.images.length);
		setQueuePaused(false);
		setHighlightRowId(rowId);
		setHighlightColor(rowColor);
		setHighlightSad(sad);
		setLandedImageId(imageId);
		setLowerThird({
			name: rowName,
			color: rowColor,
			label: getLowerThirdLabel(tone),
			tone,
		});
		playLanding(tierIndex, rows.length);
		void celebrateTier(rowColor, tierIndex, rows.length);
		playTierAssign(tierIndex, rows.length);
		if (highlightTimerRef.current != null) {
			window.clearTimeout(highlightTimerRef.current);
		}
		highlightTimerRef.current = window.setTimeout(() => {
			highlightTimerRef.current = null;
			setHighlightRowId(null);
			setHighlightColor(null);
			setHighlightSad(false);
		}, highlightMs);

		if (nextImageId) {
			scheduleQueueAdvance(
				nextImageId,
				highlightMs + QUEUE.pauseAfterAssignmentMs,
			);
		}
	};

	useEffect(() => {
		if (
			introActive ||
			spotlightImageId ||
			untieredImages.length === 0 ||
			queuePaused
		) {
			return;
		}
		if (!queueStartedRef.current) {
			queueStartedRef.current = true;
			void openSpotlight(untieredImages[0].id);
		}
	}, [
		introActive,
		openSpotlight,
		queuePaused,
		spotlightImageId,
		untieredImages,
	]);

	useEffect(() => {
		if (spotlightImageId || !queuePaused || untieredImages.length === 0) {
			return;
		}
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key !== ' ' && event.key !== 'Enter' && event.key !== 'n') {
				return;
			}
			const target = event.target;
			if (
				target instanceof HTMLElement &&
				(target.tagName === 'INPUT' ||
					target.tagName === 'TEXTAREA' ||
					target.isContentEditable)
			) {
				return;
			}
			event.preventDefault();
			resumeQueue();
		};
		window.addEventListener('keydown', onKeyDown);
		return () => {
			window.removeEventListener('keydown', onKeyDown);
		};
	}, [queuePaused, resumeQueue, spotlightImageId, untieredImages.length]);

	const assignedCount = totalImages - untieredImages.length;
	const spotlightPhotoLabel =
		spotlightImageId && totalImages > 0
			? `Photo ${String(assignedCount + 1)} of ${String(totalImages)}`
			: null;

	return (
		<>
			<header className={`title${introActive ? '' : ' title--revealed'}`}>
				<motion.span
					initial={introActive ? { opacity: 0, y: -20, scale: 0.92 } : false}
					animate={introActive ? { opacity: 1, y: 0, scale: 1 } : undefined}
					transition={{
						type: 'spring',
						stiffness: 260,
						damping: 22,
						delay: 0.05,
					}}
				>
					{title}
				</motion.span>
			</header>

			<div className="present-exit-zone">
				<div className="present-exit present-exit--controls">
					<SoundToggle iconOnly />
					<IconButton
						icon={ArrowLeft}
						label="Back to setup"
						iconOnly
						onClick={onExitSetup}
					/>
				</div>
			</div>

			<main
				className="main-content presentation-main presentation-main--broadcast"
				style={{ '--present-row-count': rows.length } as CSSProperties}
			>
				<div
					ref={tierListRef}
					className="tier-list presentation-tier-list"
					style={
						{
							'--tier-label-size': labelSize
								? `${String(labelSize)}px`
								: undefined,
						} as CSSProperties
					}
					role="list"
					aria-label="Tier rows"
				>
					{rows.map((row, index) => (
						<TierRow
							key={row.id}
							row={row}
							spotlightImageId={spotlightImageId}
							highlight={highlightRowId === row.id}
							highlightColor={highlightColor}
							highlightSad={highlightSad && highlightRowId === row.id}
							landedImageId={landedImageId}
							introIndex={index}
							introActive={introActive}
							onImageClick={(imageId) => {
								void openSpotlight(imageId);
							}}
						/>
					))}
				</div>

				<section
					className="pool-section presentation-pool"
					aria-label="Photo queue"
				>
					<PresentationQueue
						images={untieredImages}
						totalImages={totalImages}
						spotlightImageId={spotlightImageId}
						queuePaused={queuePaused}
						onResume={resumeQueue}
						onSelectImage={(imageId) => {
							clearQueueAdvance();
							void openSpotlight(imageId);
						}}
					/>
				</section>
			</main>

			<BroadcastLowerThird
				tierName={lowerThird?.name ?? null}
				tierColor={lowerThird?.color ?? null}
				label={lowerThird?.label}
				tone={lowerThird?.tone}
			/>

			<Spotlight
				mode="assign"
				image={spotlightImage}
				photoLabel={spotlightPhotoLabel}
				rows={rows}
				onRelease={() => {
					clearQueueAdvance();
					setSpotlightImageId(null);
					setQueuePaused(true);
				}}
				onAssignTier={handleAssignTier}
			/>

			<FinaleCarousel
				active={finaleCarouselActive}
				rows={rows}
				onComplete={handleFinaleCarouselComplete}
			/>

			<FinaleOverlay
				visible={showFinale}
				title={title}
				onDismiss={handleFinaleContinue}
			/>
		</>
	);
}
