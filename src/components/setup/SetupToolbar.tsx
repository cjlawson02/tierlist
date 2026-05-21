import { ImagePlus, Play } from 'lucide-react';
import { useRef } from 'react';
import { useSetupStore } from '../../store/setupStore';
import { readFileAsDataUrl } from '../../tierlist';
import IconButton from '../IconButton';

interface SetupToolbarProps {
	onToast: (message: string) => void;
	onStartPresentation: () => void;
}

export default function SetupToolbar({
	onToast,
	onStartPresentation,
}: SetupToolbarProps) {
	const addImages = useSetupStore((state) => state.addImages);
	const fileInputRef = useRef<HTMLInputElement>(null);

	return (
		<div className="setup-toolbar">
			<input
				ref={fileInputRef}
				type="file"
				accept="image/*"
				multiple
				hidden
				aria-hidden
				onChange={(e) => {
					void (async () => {
						const files = [...(e.target.files ?? [])];
						if (files.length === 0) {
							return;
						}
						try {
							addImages(await Promise.all(files.map(readFileAsDataUrl)));
							e.target.value = '';
						} catch (err) {
							onToast(
								err instanceof Error ? err.message : 'Failed to add image(s)',
							);
							e.target.value = '';
						}
					})();
				}}
			/>
			<IconButton
				icon={ImagePlus}
				label="Add photos"
				onClick={() => fileInputRef.current?.click()}
			/>
			<IconButton
				icon={Play}
				label="Start presentation"
				variant="primary"
				iconSize={24}
				className="setup-toolbar__start"
				onClick={onStartPresentation}
			/>
		</div>
	);
}
