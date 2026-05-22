interface Env {
	ASSETS: {
		fetch(request: Request): Promise<Response>;
	};
}

const PROXY_ROUTES = [
	{ prefix: '/tpaas-proxy', origin: 'https://tpaas.chrislawson.dev' },
	{
		prefix: '/tpaas-assets-proxy',
		origin: 'https://assets.tpaas.chrislawson.dev',
	},
	{ prefix: '/cataas-proxy', origin: 'https://cataas.com' },
] as const;

function proxyRequest(
	request: Request,
	prefix: string,
	origin: string,
): Request {
	const url = new URL(request.url);
	const path = url.pathname.slice(prefix.length) || '/';
	const target = new URL(path, origin);
	target.search = url.search;
	return new Request(target.toString(), request);
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const { pathname } = new URL(request.url);
		for (const route of PROXY_ROUTES) {
			if (pathname.startsWith(route.prefix)) {
				return fetch(proxyRequest(request, route.prefix, route.origin));
			}
		}
		return env.ASSETS.fetch(request);
	},
};
