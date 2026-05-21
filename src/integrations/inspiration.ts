export const INSPIRATION_DEMO = {
	minCount: 3,
	maxCount: 30,
	defaultCount: 10,
} as const;

export type InspirationSource = 'tpaas' | 'cataas';

export const INSPIRATION_SOURCES: Record<
	InspirationSource,
	{
		title: string;
		itemLabel: string;
		siteName: string;
		siteUrl: string;
		description: string;
	}
> = {
	tpaas: {
		title: 'Trolley Problem Tier List',
		itemLabel: 'trolley problems',
		siteName: 'TPaaS',
		siteUrl: 'https://tpaas.chrislawson.dev',
		description: 'Pull trolley problems from',
	},
	cataas: {
		title: 'CATaaS Tier List',
		itemLabel: 'cats',
		siteName: 'CATaaS',
		siteUrl: 'https://cataas.com',
		description: 'Pull random cats from',
	},
};
