import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadDotEnv } from './load-env.mjs';

loadDotEnv();

const TIMEOUT_MS = 15_000;

export function grocyOrigin(raw = process.env.GROCY_URL ?? '') {
	let base = raw.trim().replace(/\/+$/, '');
	if (base.toLowerCase().endsWith('/api')) {
		base = base.slice(0, -4);
	}
	return base;
}

export function grocyConfigured() {
	return grocyOrigin() !== '' && Boolean(process.env.GROCY_API_KEY?.trim());
}

function requireConfig() {
	if (grocyConfigured()) return;
	console.error(
		'Missing GROCY_URL or GROCY_API_KEY.\n' +
			'Local: copy .env.example to .env.\n' +
			'Cloud: add the same names in Cursor Cloud Agents → Secrets.'
	);
	process.exit(1);
}

/**
 * @param {string} method
 * @param {string} apiPath path after `/api/`, e.g. `system/info`
 * @param {unknown} [body]
 */
export async function grocyRequest(method, apiPath, body) {
	const origin = grocyOrigin();
	const key = process.env.GROCY_API_KEY?.trim() ?? '';
	if (!origin || !key) {
		throw new Error('GROCY_URL and GROCY_API_KEY are required');
	}

	const path = apiPath.replace(/^\//, '').replace(/^api\//, '');
	const headers = {
		Accept: 'application/json',
		'GROCY-API-KEY': key
	};
	/** @type {RequestInit} */
	const init = {
		method,
		headers,
		signal: AbortSignal.timeout(TIMEOUT_MS)
	};
	if (body !== undefined) {
		headers['Content-Type'] = 'application/json';
		init.body = typeof body === 'string' ? body : JSON.stringify(body);
	}

	const response = await fetch(`${origin}/api/${path}`, init);
	const text = await response.text();
	let json = null;
	if (text) {
		try {
			json = JSON.parse(text);
		} catch {
			json = text;
		}
	}

	if (!response.ok) {
		const detail =
			json && typeof json === 'object' && 'error_message' in json
				? String(json.error_message)
				: text.slice(0, 200);
		throw new Error(`Grocy ${response.status} ${method} /api/${path}${detail ? `: ${detail}` : ''}`);
	}

	return json;
}

const USAGE = `Call the public Grocy 4.5.0 API with GROCY_URL + GROCY_API_KEY.

Usage:
  npm run grocy -- ping
  npm run grocy -- get <api-path>
  npm run grocy -- request <METHOD> <api-path> [json-body]

Examples:
  npm run grocy -- ping
  npm run grocy -- get objects/products
  npm run grocy -- get stock/products/by-barcode/7310070761253
`;

async function main(argv) {
	const [command, ...rest] = argv;
	if (!command || command === '-h' || command === '--help') {
		process.stdout.write(USAGE);
		process.exit(command ? 0 : 1);
	}

	requireConfig();

	if (command === 'ping') {
		const info = await grocyRequest('GET', 'system/info');
		process.stdout.write(`${JSON.stringify(info, null, 2)}\n`);
		return;
	}

	if (command === 'get') {
		const path = rest[0];
		if (!path) {
			console.error('Missing API path. Example: npm run grocy -- get objects/locations');
			process.exit(1);
		}
		const json = await grocyRequest('GET', path);
		process.stdout.write(`${JSON.stringify(json, null, 2)}\n`);
		return;
	}

	if (command === 'request') {
		const method = rest[0]?.toUpperCase();
		const path = rest[1];
		const rawBody = rest[2];
		if (!method || !path) {
			console.error('Usage: npm run grocy -- request <METHOD> <api-path> [json-body]');
			process.exit(1);
		}
		const body = rawBody ? JSON.parse(rawBody) : undefined;
		const json = await grocyRequest(method, path, body);
		process.stdout.write(`${JSON.stringify(json ?? null, null, 2)}\n`);
		return;
	}

	console.error(`Unknown command: ${command}\n`);
	process.stdout.write(USAGE);
	process.exit(1);
}

const thisFile = import.meta.filename ?? fileURLToPath(import.meta.url);
const invokedAsCli = Boolean(process.argv[1]) && resolve(process.argv[1]) === resolve(thisFile);

if (invokedAsCli) {
	main(process.argv.slice(2)).catch((error) => {
		console.error(error instanceof Error ? error.message : error);
		process.exit(1);
	});
}
