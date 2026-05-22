import { useMemo, type CSSProperties, type RefObject } from 'react';
import TierItemDisplay from '../TierItemDisplay';
import type { TierRow } from '../../types';

interface TierListExportCardProps {
	exportRef: RefObject<HTMLDivElement | null>;
	title: string;
	rows: TierRow[];
	labelSize: number | null;
}

export default function TierListExportCard({
	exportRef,
	title,
	rows,
	labelSize,
}: TierListExportCardProps) {
	const resolvedLabelSize = useMemo(() => {
		if (labelSize != null) {
			return labelSize;
		}
		const cellSize = 120;
		const longestName = rows.reduce(
			(longest, row) => Math.max(longest, row.name.length),
			1,
		);
		return Math.max(cellSize, longestName * 28);
	}, [labelSize, rows]);

	return (
		<div
			ref={exportRef}
			className="tierlist-export-card"
			aria-hidden="true"
			style={
				{
					'--tier-label-size': `${String(resolvedLabelSize)}px`,
				} as CSSProperties
			}
		>
			<h1 className="tierlist-export-card__title">{title}</h1>
			<div className="tier-list tierlist-export-card__list" role="presentation">
				{rows.map((row) => (
					<div className="row" key={row.id}>
						<span
							className="header tier-label-readonly"
							style={{ backgroundColor: row.color }}
						>
							{row.name}
						</span>
						<span className="items">
							{row.images.map((item) => (
								<span className="item" key={item.id}>
									<TierItemDisplay item={item} variant="export" />
								</span>
							))}
						</span>
					</div>
				))}
			</div>
		</div>
	);
}
