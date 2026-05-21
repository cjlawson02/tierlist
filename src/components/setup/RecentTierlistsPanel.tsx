import { ChevronDown, Clock, FilePlus, Trash2 } from 'lucide-react';
import { useId, useState } from 'react';
import { useRecentTierlistsStore } from '../../store/recentTierlistsStore';
import { useSetupStore } from '../../store/setupStore';
import IconButton from '../IconButton';

interface RecentTierlistsPanelProps {
	onToast: (message: string) => void;
}

function formatSavedAt(iso: string): string {
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) {
		return '';
	}
	return date.toLocaleString(undefined, {
		month: 'short',
		day: 'numeric',
		hour: 'numeric',
		minute: '2-digit',
	});
}

export default function RecentTierlistsPanel({
	onToast,
}: RecentTierlistsPanelProps) {
	const panelId = useId();
	const [expanded, setExpanded] = useState(false);
	const entries = useRecentTierlistsStore((state) => state.entries);
	const removeEntry = useRecentTierlistsStore((state) => state.remove);
	const recentId = useSetupStore((state) => state.recentId);
	const loadRecentTierlist = useSetupStore((state) => state.loadRecentTierlist);
	const startNewTierlist = useSetupStore((state) => state.startNewTierlist);
	const clearRecentId = useSetupStore((state) => state.clearRecentId);

	const handleLoad = (entryId: string) => {
		const entry = entries.find((item) => item.id === entryId);
		if (!entry) {
			return;
		}
		try {
			loadRecentTierlist(entry);
			onToast(`Loaded "${entry.title}"`);
		} catch (err) {
			if (err instanceof Error && err.message !== 'Load cancelled') {
				onToast(err.message);
			}
		}
	};

	const handleRemove = (entryId: string, title: string) => {
		if (!confirm(`Remove "${title}" from your recent tier lists?`)) {
			return;
		}
		removeEntry(entryId);
		if (recentId === entryId) {
			clearRecentId();
		}
		onToast(`Removed "${title}"`);
	};

	return (
		<section className="recent-tierlists" aria-label="Your recent tier lists">
			<button
				type="button"
				className="recent-tierlists__toggle"
				aria-expanded={expanded}
				aria-controls={panelId}
				onClick={() => {
					setExpanded((open) => !open);
				}}
			>
				<Clock aria-hidden size={18} />
				<span>Your recent tier lists</span>
				{entries.length > 0 && (
					<span className="recent-tierlists__count">{entries.length}</span>
				)}
				<ChevronDown
					aria-hidden
					size={18}
					className={`recent-tierlists__chevron${expanded ? ' recent-tierlists__chevron--open' : ''}`}
				/>
			</button>

			{expanded && (
				<div id={panelId} className="recent-tierlists__panel">
					<div className="recent-tierlists__actions">
						<IconButton
							icon={FilePlus}
							label="New tier list"
							onClick={startNewTierlist}
						/>
					</div>

					{entries.length === 0 ? (
						<p className="recent-tierlists__empty">
							Recent tier lists appear here automatically when you start a
							presentation or return to setup.
						</p>
					) : (
						<ul className="recent-tierlists__list">
							{entries.map((entry) => (
								<li key={entry.id} className="recent-tierlists__item">
									<button
										type="button"
										className={`recent-tierlists__load${entry.id === recentId ? ' recent-tierlists__load--active' : ''}`}
										aria-label={`Load ${entry.title}`}
										onClick={() => {
											handleLoad(entry.id);
										}}
									>
										<span className="recent-tierlists__title">
											{entry.title}
										</span>
										<span className="recent-tierlists__meta">
											{formatSavedAt(entry.savedAt)} ·{' '}
											{String(entry.imageCount)} photo
											{entry.imageCount === 1 ? '' : 's'}
										</span>
									</button>
									<button
										type="button"
										className="recent-tierlists__remove"
										aria-label={`Remove ${entry.title}`}
										onClick={() => {
											handleRemove(entry.id, entry.title);
										}}
									>
										<Trash2 aria-hidden size={16} />
									</button>
								</li>
							))}
						</ul>
					)}
				</div>
			)}
		</section>
	);
}
