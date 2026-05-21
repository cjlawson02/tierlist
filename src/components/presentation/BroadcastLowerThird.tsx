import { AnimatePresence, motion } from 'motion/react';
import type { DisappointmentTone } from '../../presentationConfig';

interface BroadcastLowerThirdProps {
	tierName: string | null;
	tierColor: string | null;
	label?: string;
	tone?: DisappointmentTone;
}

export default function BroadcastLowerThird({
	tierName,
	tierColor,
	label = 'Assigned to',
	tone = 'neutral',
}: BroadcastLowerThirdProps) {
	const sad =
		tone === 'meh' ||
		tone === 'dull' ||
		tone === 'sad' ||
		tone === 'devastating';

	return (
		<AnimatePresence>
			{tierName && tierColor && (
				<motion.div
					className={`broadcast-lower-third${sad ? ' broadcast-lower-third--sad' : ''}${tone === 'devastating' ? ' broadcast-lower-third--devastating' : ''}`}
					key={`${tierName}-${label}`}
					initial={{ opacity: 0, y: 28, x: '-50%' }}
					animate={{ opacity: 1, y: 0, x: '-50%' }}
					exit={{ opacity: 0, y: 16, x: '-50%' }}
					transition={
						sad
							? { type: 'spring', stiffness: 200, damping: 22 }
							: { type: 'spring', stiffness: 420, damping: 32 }
					}
				>
					<div
						className="broadcast-lower-third__accent"
						style={{ backgroundColor: tierColor }}
					/>
					<div className="broadcast-lower-third__content">
						<span className="broadcast-lower-third__label">{label}</span>
						<span
							className="broadcast-lower-third__tier"
							style={{ color: tierColor }}
						>
							{tierName} Tier
						</span>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
