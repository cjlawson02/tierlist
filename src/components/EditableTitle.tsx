import { Pencil } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import IconButton from './IconButton';
import { MAX_NAME_LEN } from '../types';

interface EditableTitleProps {
	value: string;
	onChange: (value: string) => void;
}

export default function EditableTitle({ value, onChange }: EditableTitleProps) {
	const [editing, setEditing] = useState(false);
	const [draft, setDraft] = useState(value);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (!editing) {
			return;
		}
		inputRef.current?.focus();
		inputRef.current?.select();
	}, [editing]);

	const commit = () => {
		const next = draft.trim().slice(0, MAX_NAME_LEN) || value;
		onChange(next);
		setEditing(false);
	};

	const cancel = () => {
		setDraft(value);
		setEditing(false);
	};

	if (editing) {
		return (
			<div className="title-editor">
				<input
					ref={inputRef}
					type="text"
					className="title-input"
					value={draft}
					maxLength={MAX_NAME_LEN}
					aria-label="Tier List title"
					onChange={(event) => {
						setDraft(event.target.value);
					}}
					onKeyDown={(event) => {
						if (event.key === 'Enter') {
							event.preventDefault();
							commit();
						}
						if (event.key === 'Escape') {
							event.preventDefault();
							cancel();
						}
					}}
					onBlur={commit}
				/>
			</div>
		);
	}

	return (
		<div className="title-display">
			<h1 className="title-text">{value}</h1>
			<IconButton
				icon={Pencil}
				label="Edit title"
				iconOnly
				onClick={() => {
					setDraft(value);
					setEditing(true);
				}}
			/>
		</div>
	);
}
