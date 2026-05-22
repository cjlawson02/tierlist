import { ImagePlus, Play, Type } from 'lucide-react';
import { useId, useRef, useState } from 'react';
import { MAX_TEXT_SLIDES_PER_BATCH } from '../../constants';
import { MAX_TEXT_LEN } from '../../types';
import { useSetupStore } from '../../store/setupStore';
import { readFileAsDataUrl } from '../../tierlist';
import IconButton from '../IconButton';

const MAX_TEXT_DRAFT_LEN = MAX_TEXT_SLIDES_PER_BATCH * MAX_TEXT_LEN;

interface SetupToolbarProps {
	onToast: (message: string) => void;
	onStartPresentation: () => void;
}

export default function SetupToolbar({
	onToast,
	onStartPresentation,
}: SetupToolbarProps) {
	const addImages = useSetupStore((state) => state.addImages);
	const addTextSlides = useSetupStore((state) => state.addTextSlides);
	const hasSlides = useSetupStore((state) => state.untieredImages.length > 0);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const textInputRef = useRef<HTMLTextAreaElement>(null);
	const textEditorId = useId();
	const [textEditorOpen, setTextEditorOpen] = useState(false);
	const [textDraft, setTextDraft] = useState('');

	const closeTextEditor = () => {
		setTextEditorOpen(false);
		setTextDraft('');
	};

	const submitTextSlides = () => {
		const lines = textDraft.split('\n');
		if (lines.every((line) => line.trim() === '')) {
			onToast('Enter at least one line of text');
			return;
		}
		const nonEmptyLineCount = textDraft
			.split('\n')
			.filter((line) => line.trim() !== '').length;
		const beforeCount = useSetupStore.getState().untieredImages.length;
		addTextSlides(lines);
		const added = useSetupStore.getState().untieredImages.length - beforeCount;
		if (added === 0) {
			onToast('Enter at least one line of text');
			return;
		}
		closeTextEditor();
		const capped = nonEmptyLineCount > MAX_TEXT_SLIDES_PER_BATCH;
		onToast(
			capped
				? `Added ${String(added)} text slide(s) (${String(MAX_TEXT_SLIDES_PER_BATCH)} max per batch)`
				: `Added ${String(added)} text slide(s)`,
		);
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
			<IconButton
				icon={Type}
				label="Add text slides"
				aria-expanded={textEditorOpen}
				aria-controls={textEditorId}
				onClick={() => {
					setTextEditorOpen((open) => {
						const next = !open;
						if (next) {
							requestAnimationFrame(() => textInputRef.current?.focus());
						}
						return next;
					});
				}}
			/>
			<IconButton
				icon={Play}
				label="Start presentation"
				variant="primary"
				iconSize={24}
				className="setup-toolbar__start"
				disabled={!hasSlides}
				onClick={onStartPresentation}
			/>
			{textEditorOpen && (
				<section
					id={textEditorId}
					className="setup-text-editor"
					aria-label="Add text slides"
				>
					<label
						className="setup-text-editor__label"
						htmlFor="text-slide-input"
					>
						One slide per line
					</label>
					<textarea
						id="text-slide-input"
						ref={textInputRef}
						className="setup-text-editor__input"
						value={textDraft}
						maxLength={MAX_TEXT_DRAFT_LEN}
						placeholder="Best pizza topping&#10;Worst movie sequel&#10;..."
						rows={4}
						onChange={(event) => {
							setTextDraft(event.target.value);
						}}
						onKeyDown={(event) => {
							if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
								event.preventDefault();
								submitTextSlides();
							}
							if (event.key === 'Escape') {
								event.preventDefault();
								closeTextEditor();
							}
						}}
					/>
					<div className="setup-text-editor__actions">
						<button
							type="button"
							className="setup-text-editor__cancel"
							onClick={closeTextEditor}
						>
							Cancel
						</button>
						<button
							type="button"
							className="setup-text-editor__submit"
							onClick={submitTextSlides}
						>
							Add slides
						</button>
					</div>
				</section>
			)}
		</div>
	);
}
