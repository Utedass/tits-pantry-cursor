import { existsSync, mkdirSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dbPath = resolve(root, 'grocy.db');
const outPath = resolve(root, 'src/lib/grocy/types.generated.ts');

const TABLES = [
	'products',
	'product_barcodes',
	'stock',
	'locations',
	'quantity_units',
	'quantity_unit_conversions',
	'shopping_list',
	'shopping_lists',
	'product_groups',
	'shopping_locations',
	'user_settings'
];

function toPascal(name) {
	return name
		.split('_')
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join('');
}

function tsType(sqliteType, notNull) {
	const t = (sqliteType ?? '').toUpperCase();
	let ts = 'string';
	if (
		t.includes('INT') ||
		t.includes('REAL') ||
		t.includes('FLOA') ||
		t.includes('DOUB') ||
		t.includes('DEC') ||
		t.includes('NUM')
	) {
		ts = 'number';
	}
	return notNull ? ts : `${ts} | null`;
}

if (!existsSync(dbPath)) {
	console.error(`Missing ${dbPath}. Place a Grocy 4.5.0 grocy.db in the repo root (gitignored).`);
	process.exit(1);
}

const db = new DatabaseSync(dbPath, { readOnly: true });
const chunks = [
	'/** Generated from local grocy.db — do not edit by hand. Run `npm run gen:types`. */',
	''
];

for (const table of TABLES) {
	const cols = db.prepare(`PRAGMA table_info("${table}")`).all();
	if (cols.length === 0) {
		console.error(`Table not found: ${table}`);
		process.exit(1);
	}
	const name = toPascal(table);
	chunks.push(`export interface ${name} {`);
	for (const col of cols) {
		chunks.push(`	${col.name}: ${tsType(col.type, col.notnull === 1)};`);
	}
	chunks.push(`}`);
	chunks.push('');
}

db.close();
mkdirSync(dirname(outPath), { recursive: true });
await writeFile(outPath, chunks.join('\n'), 'utf8');
console.log(`Wrote ${outPath}`);
