import { Cat, ChevronDown, LoaderCircle, TrainFront } from 'lucide-react';
import { useId, useState } from 'react';
import {
	INSPIRATION_DEMO,
	INSPIRATION_SOURCES,
	type InspirationSource,
} from '../../integrations/inspiration';
import IconButton from '../IconButton';

interface InspirationPanelProps {
	onStartDemo: (source: InspirationSource, count: number) => Promise<void>;
}

const SOURCE_OPTIONS: {
	id: InspirationSource;
	label: string;
	icon: typeof TrainFront;
}[] = [
	{ id: 'tpaas', label: 'Trolley problems', icon: TrainFront },
	{ id: 'cataas', label: 'Cats', icon: Cat },
];

export default function InspirationPanel({ onStartDemo }: InspirationPanelProps) {
	const panelId = useId();
	const [expanded, setExpanded] = useState(false);
	const [source, setSource] = useState<InspirationSource>('tpaas');
	const [count, setCount] = useState<number>(INSPIRATION_DEMO.defaultCount);
	const [loading, setLoading] = useState(false);

	const config = INSPIRATION_SOURCES[source];
	const SourceIcon = SOURCE_OPTIONS.find((option) => option.id === source)?.icon;

	const handleStart = () => {
		void (async () => {
			setLoading(true);
			try {
				await onStartDemo(source, count);
			} finally {
				setLoading(false);
			}
		})();
	};

	return (
		<section className="inspiration-demo" aria-label="Inspiration demos">
			<button
				type="button"
				className="inspiration-demo__toggle"
				aria-expanded={expanded}
				aria-controls={panelId}
				onClick={() => {
					setExpanded((open) => !open);
				}}
			>
				<span>Need inspiration?</span>
				<ChevronDown
					aria-hidden
					size={18}
					className={`inspiration-demo__chevron${expanded ? ' inspiration-demo__chevron--open' : ''}`}
				/>
			</button>

			{expanded && (
				<div id={panelId} className="inspiration-demo__panel">
					<div
						className="inspiration-demo__sources"
						role="radiogroup"
						aria-label="Inspiration source"
					>
						{SOURCE_OPTIONS.map(({ id, label, icon: Icon }) => (
							<label key={id} className="inspiration-demo__source">
								<input
									type="radio"
									name="inspiration-source"
									value={id}
									checked={source === id}
									disabled={loading}
									onChange={() => {
										setSource(id);
									}}
								/>
								<span className="inspiration-demo__source-label">
									<Icon aria-hidden size={16} />
									{label}
								</span>
							</label>
						))}
					</div>

					<div className="inspiration-demo__header">
						{SourceIcon && (
							<SourceIcon aria-hidden className="inspiration-demo__icon" size={20} />
						)}
						<div>
							<h2 className="inspiration-demo__title">{config.title}</h2>
							<p className="inspiration-demo__copy">
								{config.description}{' '}
								<a
									href={config.siteUrl}
									target="_blank"
									rel="noopener noreferrer"
								>
									{config.siteName}
								</a>{' '}
								and start the tier list presentation.
							</p>
						</div>
					</div>

					<label
						className="inspiration-demo__slider-label"
						htmlFor="inspiration-count"
					>
						<span className="inspiration-demo__slider-name">
							{config.itemLabel.charAt(0).toUpperCase() +
								config.itemLabel.slice(1)}
						</span>
						<strong>{count}</strong>
					</label>
					<input
						id="inspiration-count"
						className="inspiration-demo__slider"
						type="range"
						min={INSPIRATION_DEMO.minCount}
						max={INSPIRATION_DEMO.maxCount}
						step={1}
						value={count}
						disabled={loading}
						onChange={(event) => {
							setCount(Number.parseInt(event.target.value, 10));
						}}
					/>
					<div className="inspiration-demo__range-labels" aria-hidden="true">
						<span>{INSPIRATION_DEMO.minCount}</span>
						<span>{INSPIRATION_DEMO.maxCount}</span>
					</div>

					<IconButton
						icon={loading ? LoaderCircle : (SourceIcon ?? TrainFront)}
						label={
							loading
								? `Loading ${config.itemLabel}…`
								: `Load ${String(count)} ${config.itemLabel} and start`
						}
						variant="primary"
						className={`inspiration-demo__start${loading ? ' inspiration-demo__start--loading' : ''}`}
						disabled={loading}
						onClick={handleStart}
					/>
				</div>
			)}
		</section>
	);
}
