import { Volume2, VolumeX } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getSoundMuted, setSoundMuted } from '../../effects/sounds';
import IconButton from '../IconButton';

interface SoundToggleProps {
	iconOnly?: boolean;
}

export default function SoundToggle({ iconOnly = false }: SoundToggleProps) {
	const [muted, setMuted] = useState(() => getSoundMuted());

	useEffect(() => {
		setSoundMuted(muted);
	}, [muted]);

	return (
		<IconButton
			icon={muted ? VolumeX : Volume2}
			label={muted ? 'Unmute sounds' : 'Mute sounds'}
			iconOnly={iconOnly}
			onClick={() => {
				setMuted((m) => !m);
			}}
		/>
	);
}
