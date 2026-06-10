/**
 * Import Kato train data from an XLSX spreadsheet into the local SQLite DB.
 *
 * Usage:
 *   npx tsx src/lib/db/import-kato-xlsx.ts <path-to-spreadsheet.xlsx>
 *
 * Run `npm run db:seed` first so formats/operators/types exist.
 *
 * Spreadsheet columns (Kato DCC Database format):
 *   Scale, Model, Prototype, Varient, Line, Operators, Type, Years, DCC Friendly, Decoder(s)
 *
 *   - Scale is taken as-is per row; blank = N (no inheritance).
 *   - Rows with DCC Friendly = "Possibly" or "Unknown" are skipped.
 *   - Rows with corrupted decoder data "[object Object]" are skipped.
 */
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { eq } from 'drizzle-orm';
import ExcelJS from 'exceljs';
import * as schema from './schema';

const DB_PATH = process.env.DB_PATH || './data/dcc.db';
const XLSX_PATH = process.argv[2] || process.env.KATO_XLSX_PATH;

if (!XLSX_PATH) {
	console.error(
		'Error: no spreadsheet path provided.\n' +
			'Usage: npx tsx src/lib/db/import-kato-xlsx.ts <path-to-spreadsheet.xlsx>'
	);
	process.exit(1);
}

const sqlite = new Database(DB_PATH);
sqlite.pragma('foreign_keys = ON');
const db = drizzle(sqlite, { schema });

/** Read a cell as a trimmed string, or undefined when empty. */
function cellString(value: ExcelJS.CellValue): string | undefined {
	if (value === null || value === undefined) return undefined;
	const text = typeof value === 'object' && 'text' in value ? (value as { text: string }).text : String(value);
	const trimmed = text.trim();
	return trimmed.length > 0 ? trimmed : undefined;
}

/** Normalise raw XLSX operator names to canonical DB values. */
function normaliseOperator(raw: string): string {
	const map: Record<string, string> = {
		'JNF':              'JNR',
		'JR Hakkaido':      'JR Hokkaido',
		'SNCF/SBB':         'SNCF / SBB',
		'SNFC':             'SNCF',
		'Taiwan':           'Taiwan High Speed Rail',
		'Tokyu':            'Tokyu Electric',
	};
	return map[raw] ?? raw;
}

/** Normalise raw XLSX type names to canonical DB values. */
function normaliseType(raw: string): string {
	const map: Record<string, string> = {
		'Deisel Loco': 'Diesel Loco',
		'Elec Loco':   'Electric Loco',
		'BMU':         'Bi-mode',
	};
	return map[raw] ?? raw;
}

/**
 * Extract specific decoder IDs from a free-text decoder string.
 * Returns IDs from the decoders table for train_decoder_compat rows.
 */
function extractDecoderIds(raw: string, decoderByModel: Map<string, number>): number[] {
	const text = raw
		.replace(/tcsk4di/gi, 'k7d4')
		.replace(/dn1634ka/gi, 'dn163k4a')
		.replace(/fl13/gi, 'fl12')
		.replace(/digitrax\s+/gi, '')
		.replace(/d&h\s+/gi, '')
		.replace(/tcs\s+/gi, '')
		.replace(/kato\s+custom/gi, '')
		.replace(/\s*x\s*\d+/gi, '')
		.replace(/\?/g, '')
		.replace(/29-303[^,]*/gi, '')
		.replace(/any\s+small\s+wired\s+decoder/gi, '')
		.replace(/ngdcc/gi, '')
		.replace(/\([^)]*\)/g, '')
		.replace(/\bfor\s+\w+/gi, '')
		.replace(/\s+or\s+/gi, ',');

	const ids: number[] = [];
	for (const token of text.split(/[,\s]+/)) {
		const key = token.trim().toUpperCase();
		if (key.length < 3) continue;
		const id = decoderByModel.get(key);
		if (id !== undefined && !ids.includes(id)) ids.push(id);
	}
	return ids;
}

/**
 * Extract known DCC format tokens from a free-text decoder string.
 * Returns format name + purpose pairs for train_format_compat rows.
 */
function extractFormats(raw: string): Array<{ name: string; purpose: string }> {
	// Normalise before matching
	let text = raw
		.replace(/\s*x\s*\d+/gi, '')          // strip "x 2", "x2"
		.replace(/\?/g, '')                     // strip trailing "?"
		.replace(/tcsk4di/gi, 'k7d4')           // TCSK4DI → K7D4 (correct TCS K4 model)
		.replace(/dn1634ka/gi, 'dn163k4a')      // typo fix
		.replace(/digitrax\s+/gi, '')           // strip "Digitrax " prefix
		.replace(/d&h\s+/gi, '')                // strip "D&H " prefix
		.toLowerCase()
		.trim();

	const found = new Map<string, string>();
	const add = (name: string, purpose: string) => { if (!found.has(name)) found.set(name, purpose); };

	if (/\bem13\b/.test(text))                                           add('EM13',            'Motor Only');
	if (/fl1[23]/.test(text))                                            add('FL12',            'Lights Only');

	// K0/K1/K2/K4: match standalone token OR embedded in Digitrax model name (e.g. dn163k0a)
	if (/\bk0\b/.test(text) || /(?:dn|sdn)\d+k0/.test(text))            add('K0',              'Motor & Lights');
	if (/\bk1\b/.test(text) || /(?:dn|sdn)\d+k1/.test(text))            add('K1',              'Motor & Lights');
	if (/\bk2\b/.test(text) || /(?:dn|sdn)\d+k2/.test(text))            add('K2',              'Motor & Lights');
	if (/\bk4\b/.test(text) || /(?:dn|sdn)\d+k4/.test(text) || /\bk7d4\b/.test(text)) add('K4', 'Motor & Lights');

	if (/6[\s-]pin/.test(text))                                          add('NEM651 (6-pin)',  'Motor & Lights');
	if (/8[\s-]pin/.test(text))                                          add('NEM652 (8-pin)',  'Motor & Lights');

	// Wired: explicit "wired", small wired, DZ/MRC models, or D&H PD05A (soldered install)
	if (/\bwired\b/.test(text) || /any small/.test(text) ||
	    /\bdz12[35]\b/.test(text) || /\bmrc1952\b/.test(text) || /pd05a/.test(text)) {
		add('Wired', 'Motor & Lights');
	}

	return [...found.entries()].map(([name, purpose]) => ({ name, purpose }));
}

const workbook = new ExcelJS.Workbook();
await workbook.xlsx.readFile(XLSX_PATH);
const sheet = workbook.worksheets[0];
if (!sheet) { console.error(`Error: no worksheets found in ${XLSX_PATH}`); process.exit(1); }

const COL = { scale: 1, model: 2, prototype: 3, variant: 4, line: 5, operators: 6, type: 7, years: 8, dccFriendly: 9, decoders: 10 };
const cell = (row: ExcelJS.Row, col: number) => cellString(row.getCell(col).value);

// Cache lookups.
const formatByName   = new Map(db.select().from(schema.dccFormats).all().map(f => [f.name.toLowerCase(), f.id]));
const operatorByName = new Map(db.select().from(schema.operators).all().map(o => [o.name, o.id]));
const typeByName     = new Map(db.select().from(schema.trainTypes).all().map(t => [t.name, t.id]));
const decoderByModel = new Map(db.select().from(schema.decoders).all().map(d => [d.model.toUpperCase(), d.id]));

// DCC Friendly values to skip
const SKIP_DCC = new Set(['possibly', 'unknown']);

let imported = 0, skipped = 0, noFormats = 0;
const unknownOperators = new Set<string>();
const unknownTypes = new Set<string>();

for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber++) {
	const row = sheet.getRow(rowNumber);

	const modelNumber = cell(row, COL.model);
	const name        = cell(row, COL.prototype);
	if (!modelNumber && !name) continue;
	if (!modelNumber || !name) { skipped++; continue; }

	// Scale: use explicit value if present, otherwise N (no inheritance)
	const scale = cell(row, COL.scale) ?? 'N';

	const dccFriendly = cell(row, COL.dccFriendly);
	if (dccFriendly && SKIP_DCC.has(dccFriendly.toLowerCase())) { skipped++; continue; }

	const rawDecoder = cell(row, COL.decoders);

	// Skip corrupted cells
	if (rawDecoder?.toLowerCase().includes('[object object]')) { skipped++; continue; }

	// Skip already-imported trains
	const exists = db.select({ id: schema.trains.id }).from(schema.trains)
		.where(eq(schema.trains.modelNumber, modelNumber)).all().length > 0;
	if (exists) { skipped++; continue; }

	const rawOperator  = cell(row, COL.operators);
	const rawType      = cell(row, COL.type);
	const variant      = cell(row, COL.variant);
	const line         = cell(row, COL.line);

	const canonicalOp   = rawOperator ? normaliseOperator(rawOperator) : undefined;
	const canonicalType = rawType     ? normaliseType(rawType)         : undefined;

	const operatorId = canonicalOp   ? operatorByName.get(canonicalOp)   : undefined;
	const typeId     = canonicalType ? typeByName.get(canonicalType)      : undefined;

	if (canonicalOp   && !operatorId) unknownOperators.add(canonicalOp);
	if (canonicalType && !typeId)     unknownTypes.add(canonicalType);

	const isNgdcc = rawDecoder?.toLowerCase() === 'ngdcc';
	const isSolderAll = dccFriendly?.toLowerCase() === 'solder-all';

	const parts: string[] = [];
	if (variant)    parts.push(variant);
	if (dccFriendly && dccFriendly.toLowerCase() !== 'yes') parts.push(`DCC: ${dccFriendly}`);
	if (isNgdcc)    parts.push('Likely has an NGDCC decoder');
	const notes = parts.length > 0 ? parts.join(' · ') : undefined;

	const formatEntries = (!isNgdcc && rawDecoder) ? extractFormats(rawDecoder) : [];
	// Solder-All means the decoder is hardwired — always add Wired format compat
	if (isSolderAll && !formatEntries.some((f) => f.name === 'Wired')) {
		formatEntries.push({ name: 'Wired', purpose: 'Motor & Lights' });
	}

	const decoderIds = (!isNgdcc && rawDecoder) ? extractDecoderIds(rawDecoder, decoderByModel) : [];

	db.transaction((tx) => {
		const [train] = tx.insert(schema.trains).values({
			manufacturer: 'Kato',
			scale,
			operatorId,
			typeId,
			modelNumber,
			name,
			line: line ?? null,
			era: cell(row, COL.years),
			notes
		}).returning().all();

		for (const { name: formatName, purpose } of formatEntries) {
			const formatId = formatByName.get(formatName.toLowerCase());
			if (!formatId) continue;
			tx.insert(schema.trainFormatCompat).values({ trainId: train.id, formatId, purpose }).run();
		}

		for (const decoderId of decoderIds) {
			tx.insert(schema.trainDecoderCompat).values({ trainId: train.id, decoderId, confirmed: true }).run();
		}
	});

	if (formatEntries.length === 0) noFormats++;
	imported++;
}

console.log(`Import complete: ${imported} train(s) imported, ${skipped} skipped.`);
if (noFormats > 0)             console.log(`  ${noFormats} with no recognised DCC format.`);
if (unknownOperators.size > 0) console.warn(`  Unknown operators: ${[...unknownOperators].join(', ')}`);
if (unknownTypes.size > 0)     console.warn(`  Unknown types: ${[...unknownTypes].join(', ')}`);
sqlite.close();
