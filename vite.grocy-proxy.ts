import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';
import {
	DEV_PROXY_PREFIX,
	GROCY_ORIGIN_HEADER,
	loopbackProxyTarget
} from './src/lib/grocy/local-url.js';

const SKIP_HEADERS = new Set([
	'connection',
	'content-length',
	'host',
	'transfer-encoding',
	GROCY_ORIGIN_HEADER
]);

async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
	const origin = req.headers[GROCY_ORIGIN_HEADER];
	const target = typeof origin === 'string' ? loopbackProxyTarget(origin) : null;
	if (!target) {
		res.statusCode = 400;
		res.setHeader('Content-Type', 'application/json');
		res.end(JSON.stringify({ error_message: 'Grocy-proxyn tillåter bara localhost/127.0.0.1.' }));
		return;
	}

	const incoming = new URL(req.url ?? '/', 'http://vite.local');
	const dest = new URL(incoming.pathname.slice(DEV_PROXY_PREFIX.length) || '/', target);
	dest.search = incoming.search;

	const headers = new Headers();
	for (const [key, value] of Object.entries(req.headers)) {
		if (value == null || SKIP_HEADERS.has(key.toLowerCase())) continue;
		headers.set(key, Array.isArray(value) ? value.join(', ') : value);
	}

	const method = req.method ?? 'GET';
	let body: Uint8Array | undefined;
	if (method !== 'GET' && method !== 'HEAD') {
		const chunks: Buffer[] = [];
		for await (const chunk of req) {
			chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
		}
		body = new Uint8Array(Buffer.concat(chunks));
	}

	try {
		const response = await fetch(dest, {
			method,
			headers,
			body: body as BodyInit | undefined,
			redirect: 'manual'
		});
		res.statusCode = response.status;
		response.headers.forEach((value, key) => {
			if (SKIP_HEADERS.has(key.toLowerCase())) return;
			res.setHeader(key, value);
		});
		res.end(Buffer.from(await response.arrayBuffer()));
	} catch (error) {
		res.statusCode = 502;
		res.setHeader('Content-Type', 'application/json');
		res.end(
			JSON.stringify({
				error_message: error instanceof Error ? error.message : String(error)
			})
		);
	}
}

export function grocyDevProxy(): Plugin {
	return {
		name: 'grocy-dev-proxy',
		configureServer(server) {
			server.middlewares.use((req, res, next) => {
				if (!req.url?.startsWith(DEV_PROXY_PREFIX)) {
					next();
					return;
				}
				void handle(req, res);
			});
		},
		configurePreviewServer(server) {
			server.middlewares.use((req, res, next) => {
				if (!req.url?.startsWith(DEV_PROXY_PREFIX)) {
					next();
					return;
				}
				void handle(req, res);
			});
		}
	};
}
