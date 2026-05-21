import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import { useEffect, useState } from 'react';
import { pickCataasImages } from './integrations/cataas';
import type { InspirationSource } from './integrations/inspiration';
import { INSPIRATION_SOURCES } from './integrations/inspiration';
import { pickTpaasImages } from './integrations/tpaas';
import { EFFECTS } from './presentationConfig';
import { resumeAudioContext, stopAllSounds } from './effects/sounds';
import { type SaveToRecentResult, useSetupStore } from './store/setupStore';
import SetupView from './views/SetupView';
import PresentationView from './views/PresentationView';
import type { AppPhase } from './types';

function continueWithoutRecentSave(saveResult: SaveToRecentResult): boolean {
	if (saveResult === 'too-large' || saveResult === 'quota-exceeded') {
		return confirm(
			'This tier list is too large to save locally. Continue without saving to recent lists?',
		);
	}
	return true;
}

export default function App() {
	const unsavedChanges = useSetupStore((state) => state.unsavedChanges);
	const rows = useSetupStore((state) => state.rows);
	const resetPresentation = useSetupStore((state) => state.resetPresentation);
	const loadDemo = useSetupStore((state) => state.loadDemo);
	const saveToRecent = useSetupStore((state) => state.saveToRecent);

	const [appPhase, setAppPhase] = useState<AppPhase>('setup');
	const [curtain, setCurtain] = useState(false);
	const [introActive, setIntroActive] = useState(false);

	useEffect(() => {
		document.body.classList.toggle('ambient-bg', EFFECTS.ambientBackground);
		document.body.classList.toggle(
			'phase-presentation-active',
			appPhase === 'presentation',
		);
		document.body.classList.toggle(
			'broadcast-mode',
			appPhase === 'presentation' && EFFECTS.broadcastMode,
		);
		return () => {
			document.body.classList.remove('ambient-bg');
			document.body.classList.remove('phase-presentation-active');
			document.body.classList.remove('broadcast-mode');
		};
	}, [appPhase]);

	useEffect(() => {
		if (!unsavedChanges) {
			return;
		}
		const onBeforeUnload = (event: BeforeUnloadEvent) => {
			event.preventDefault();
		};
		window.addEventListener('beforeunload', onBeforeUnload);
		return () => {
			window.removeEventListener('beforeunload', onBeforeUnload);
		};
	}, [unsavedChanges]);

	useEffect(() => {
		if (!introActive) {
			return;
		}
		const introMs = 350 + rows.length * 70 + 400;
		const t = window.setTimeout(() => {
			setIntroActive(false);
		}, introMs);
		return () => {
			window.clearTimeout(t);
		};
	}, [introActive, rows.length]);

	const startPresentation = () => {
		if (useSetupStore.getState().untieredImages.length === 0) {
			alert('Add at least one photo to the pool before starting presentation.');
			return;
		}
		const saveResult = saveToRecent();
		if (!continueWithoutRecentSave(saveResult)) {
			return;
		}
		void resumeAudioContext();
		setCurtain(true);
		window.setTimeout(() => {
			setAppPhase('presentation');
			setIntroActive(EFFECTS.introSequence);
			window.setTimeout(() => {
				setCurtain(false);
			}, 80);
		}, 400);
	};

	const startInspirationDemo = async (
		source: InspirationSource,
		count: number,
	) => {
		try {
			const images =
				source === 'tpaas'
					? await pickTpaasImages(count)
					: await pickCataasImages(count);
			loadDemo(INSPIRATION_SOURCES[source].title, images);
			startPresentation();
		} catch (err) {
			alert(
				err instanceof Error
					? err.message
					: `Failed to load ${INSPIRATION_SOURCES[source].itemLabel} from ${INSPIRATION_SOURCES[source].siteName}`,
			);
		}
	};

	const exitPresentation = () => {
		const hasTieredImages = rows.some((row) => row.images.length > 0);
		if (
			hasTieredImages &&
			!confirm(
				'Return to setup? Photos will move back to the pool and tier assignments will be cleared.',
			)
		) {
			return;
		}
		const saveResult = saveToRecent();
		if (!continueWithoutRecentSave(saveResult)) {
			return;
		}
		resetPresentation({ markUnsaved: saveResult !== 'saved' });
		stopAllSounds();
		setIntroActive(false);
		setAppPhase('setup');
	};

	return (
		<MotionConfig reducedMotion="user">
			<div className={`app-root phase-${appPhase}`}>
				{appPhase === 'setup' ? (
					<SetupView
						onStartPresentation={startPresentation}
						onStartInspirationDemo={startInspirationDemo}
					/>
				) : (
					<PresentationView
						onExitSetup={exitPresentation}
						introActive={introActive}
					/>
				)}

				<AnimatePresence>
					{curtain && (
						<motion.div
							className="phase-curtain"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.35 }}
						/>
					)}
				</AnimatePresence>
			</div>
		</MotionConfig>
	);
}
