import { Volume2, VolumeX } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getSoundMuted, setSoundMuted } from '../../effects/sounds';
import IconButton from '../IconButton';

export default function SoundToggle() {
	const [muted, setMuted] = useState(() => getSoundMuted());

	useEffect(() => {
		setSoundMuted(muted);
	}, [muted]);

	return (
		<IconButton
			icon={muted ? VolumeX : Volume2}
			label={muted ? 'Unmute sounds' : 'Mute sounds'}
			onClick={() => {
				setMuted((m) => !m);
			}}
		/>
	);
}
