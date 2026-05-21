import { AnimatePresence, motion } from 'motion/react';
import { createPortal } from 'react-dom';

interface FinaleOverlayProps {
	visible: boolean;
	title: string;
	onDismiss: () => void;
}

export default function FinaleOverlay({
	visible,
	title,
	onDismiss,
}: FinaleOverlayProps) {
	return createPortal(
		<AnimatePresence>
			{visible && (
				<motion.div
					className="finale-overlay"
					role="dialog"
					aria-modal="true"
					aria-label="Tier List complete"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.4 }}
					onClick={onDismiss}
				>
					<motion.div
						className="finale-overlay__panel"
						initial={{ scale: 0.88, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						exit={{ scale: 0.94, opacity: 0 }}
						transition={{
							type: 'spring',
							stiffness: 280,
							damping: 24,
							delay: 0.1,
						}}
						onClick={(e) => {
							e.stopPropagation();
						}}
					>
						<p className="finale-overlay__eyebrow">Complete</p>
						<h2 className="finale-overlay__title">{title}</h2>
						<p className="finale-overlay__subtitle">
							Every item has been ranked.
						</p>
						<button
							type="button"
							className="finale-overlay__btn"
							onClick={onDismiss}
						>
							Continue
						</button>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>,
		document.body,
	);
}
