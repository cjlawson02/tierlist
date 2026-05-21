import { motion } from 'motion/react';

interface TierLabelProps {
	name: string;
	color: string;
	highlight?: boolean;
	highlightSad?: boolean;
}

export default function TierLabel({
	name,
	color,
	highlight,
	highlightSad,
}: TierLabelProps) {
	return (
		<motion.span
			className={`header tier-label-readonly${highlightSad ? ' tier-label--sad' : ''}`}
			style={{ backgroundColor: color, color: 'var(--stage-bg)' }}
			animate={
				highlightSad
					? { scale: [1, 0.96, 0.98], y: [0, 2, 0] }
					: highlight
						? { scale: [1, 1.06, 1] }
						: {}
			}
			transition={{ duration: highlightSad ? 0.4 : 0.45 }}
		>
			{name}
		</motion.span>
	);
}
