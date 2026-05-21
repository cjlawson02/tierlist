import { useEffect, useState } from 'react';
import EditableTitle from '../components/EditableTitle';
import ImagePool from '../components/ImagePool';
import Spotlight from '../components/Spotlight';
import SetupToolbar from '../components/setup/SetupToolbar';
import { playSpotlightOpen, resumeAudioContext } from '../effects/sounds';
import { useSetupStore } from '../store/setupStore';
import { readFileAsDataUrl } from '../tierlist';

interface SetupViewProps {
	onStartPresentation: () => void;
}

export default function SetupView({ onStartPresentation }: SetupViewProps) {
	const title = useSetupStore((state) => state.title);
	const untieredImages = useSetupStore((state) => state.untieredImages);
	const setTitle = useSetupStore((state) => state.setTitle);
	const addImages = useSetupStore((state) => state.addImages);
	const deleteImage = useSetupStore((state) => state.deleteImage);

	const [toast, setToast] = useState<string | null>(null);
	const [previewImageId, setPreviewImageId] = useState<string | null>(null);

	const openPreview = async (imageId: string) => {
		await resumeAudioContext();
		playSpotlightOpen();
		setPreviewImageId(imageId);
	};

	const previewImage =
		previewImageId != null
			? (untieredImages.find((i) => i.id === previewImageId) ?? null)
			: null;

	useEffect(() => {
		const onPaste = (event: ClipboardEvent) => {
			void (async () => {
				const files = [...(event.clipboardData?.items ?? [])]
					.filter((item) => item.kind === 'file')
					.map((item) => item.getAsFile())
					.filter((file): file is File => file != null);
				if (files.length > 0) {
					try {
						addImages(await Promise.all(files.map(readFileAsDataUrl)));
						setToast(`Added ${String(files.length)} image(s)`);
					} catch (err) {
						setToast(
							err instanceof Error ? err.message : 'Failed to add image(s)',
						);
					}
				}
			})();
		};
		document.addEventListener('paste', onPaste);
		return () => {
			document.removeEventListener('paste', onPaste);
		};
	}, [addImages]);

	useEffect(() => {
		if (!toast) {
			return;
		}
		const t = setTimeout(() => {
			setToast(null);
		}, 3000);
		return () => {
			clearTimeout(t);
		};
	}, [toast]);

	return (
		<>
			<header className="title">
				<EditableTitle value={title} onChange={setTitle} />
			</header>

			<main className="main-content setup-main">
				<section className="setup-panel" aria-label="Photos to rank">
					<SetupToolbar
						onToast={setToast}
						onStartPresentation={onStartPresentation}
					/>
					<p className="pool-label">Photos</p>
					<div className="bottom-container setup-pool-layout">
						<ImagePool
							images={untieredImages}
							spotlightImageId={previewImageId}
							layoutScroll
							onImageClick={(imageId) => {
								void openPreview(imageId);
							}}
							onDelete={deleteImage}
						/>
					</div>
				</section>
			</main>

			<Spotlight
				mode="preview"
				image={previewImage}
				onRelease={() => {
					setPreviewImageId(null);
				}}
			/>

			{toast && (
				<div className="toast" role="status">
					{toast}
				</div>
			)}
		</>
	);
}
