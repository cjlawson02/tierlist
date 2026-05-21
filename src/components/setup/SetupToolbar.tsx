import { Download, ImagePlus, Play, Upload } from 'lucide-react';
import { useRef } from 'react';
import { formatBytes } from '../../bundle';
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
	const title = useSetupStore((state) => state.title);
	const addImages = useSetupStore((state) => state.addImages);
	const importFile = useSetupStore((state) => state.importFile);
	const exportFile = useSetupStore((state) => state.exportFile);

	const fileInputRef = useRef<HTMLInputElement>(null);
	const importInputRef = useRef<HTMLInputElement>(null);

	const handleExport = async () => {
		const name = prompt('Save as', title || 'My Tier List');
		if (!name) {
			return;
		}
		try {
			const bytes = await exportFile(name);
			if (bytes != null) {
				onToast(`Exported (${formatBytes(bytes)})`);
			}
		} catch (err) {
			onToast(err instanceof Error ? err.message : 'Export failed');
		}
	};

	const handleImport = async (file: File) => {
		try {
			await importFile(file);
			onToast(`Imported ${file.name}`);
		} catch (err) {
			if (err instanceof Error && err.message !== 'Import cancelled') {
				alert(err.message);
			}
		}
		if (importInputRef.current) {
			importInputRef.current.value = '';
		}
	};

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
			<input
				ref={importInputRef}
				type="file"
				accept=".json,.tierlist.json,application/json"
				hidden
				aria-hidden
				onChange={(e) => {
					const file = e.target.files?.[0];
					if (file) {
						void handleImport(file);
					}
				}}
			/>
			<IconButton
				icon={Upload}
				label="Import"
				onClick={() => importInputRef.current?.click()}
			/>
			<IconButton
				icon={Download}
				label="Export"
				onClick={() => void handleExport()}
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
