import type { LucideIcon } from 'lucide-react';
import type { ButtonHTMLAttributes } from 'react';

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
	icon: LucideIcon;
	label: string;
	variant?: 'default' | 'primary';
	iconSize?: number;
	iconOnly?: boolean;
};

export default function IconButton({
	icon: Icon,
	label,
	variant = 'default',
	iconSize = 20,
	iconOnly = false,
	className = '',
	...props
}: IconButtonProps) {
	return (
		<button
			type="button"
			className={`icon-btn${variant === 'primary' ? ' icon-btn--primary' : ''}${iconOnly ? ' icon-btn--icon-only' : ''} ${className}`.trim()}
			aria-label={label}
			title={label}
			{...props}
		>
			<Icon size={iconSize} aria-hidden />
			{!iconOnly && <span>{label}</span>}
		</button>
	);
}
