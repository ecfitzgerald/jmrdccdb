/**
 * Import Kato train data from an XLSX spreadsheet into the local SQLite DB.
 *
 * Usage:
 *   npx tsx src/lib/db/import-kato-xlsx.ts <path-to-spreadsheet.xlsx>
 *   # or set KATO_XLSX_PATH=./data/kato.xlsx and run without an argument
 *
 * Run `npm run db:seed` first so the formats/brands/decoders exist.
 *
 * Expected columns (header row, case-insensitive, order-independent):
 *   Manufacturer, Scale, Road Name, Model Number, Name, Era, Notes, Formats, Purpose
 *
 *   - Formats: comma-separated DCC format names that must match `dcc_formats.name`
 *     (e.g. "EM13, FL12"). Unknown names are reported and skipped.
 *   - Purpose: optional compat purpose applied to every format on the row
 *     ('Motor Only' | 'Lights Only' | 'Motor & Lights'). Defaults to 'Motor & Lights'.
 *
 * Uses exceljs (xlsx was removed for prototype-pollution / ReDoS CVEs).
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

/** Normalise a header cell to a lookup key: lowercased, trimmed, single-spaced. */
function headerKey(value: unknown): string {
	return String(value ?? '')
		.trim()
		.toLowerCase()
		.replace(/\s+/g, ' ');
}

/** Read a cell as a trimmed string, or undefined when empty. */
function cellString(value: ExcelJS.CellValue): string | undefined {
	if (value === null || value === undefined) return undefined;
	const text = typeof value === 'object' && 'text' in value ? value.text : String(value);
	const trimmed = text.trim();
	return trimmed.length > 0 ? trimmed : undefined;
}

const workbook = new ExcelJS.Workbook();
await workbook.xlsx.readFile(XLSX_PATH);
const sheet = workbook.worksheets[0];
if (!sheet) {
	console.error(`Error: no worksheets found in ${XLSX_PATH}`);
	process.exit(1);
}

// Map header names -> 1-based column indices.
const headerRow = sheet.getRow(1);
const columns = new Map<string, number>();
headerRow.eachCell((cell, colNumber) => {
	const key = headerKey(cell.value);
	if (key) columns.set(key, colNumber);
});

const required = ['manufacturer', 'scale', 'model number', 'name'];
const missing = required.filter((c) => !columns.has(c));
if (missing.length > 0) {
	console.error(`Error: spreadsheet is missing required column(s): ${missing.join(', ')}`);
	process.exit(1);
}

const get = (row: ExcelJS.Row, header: string): string | undefined => {
	const col = columns.get(header);
	return col ? cellString(row.getCell(col).value) : undefined;
};

// Cache format name -> id (case-insensitive).
const formats = db.select().from(schema.dccFormats).all();
const formatByName = new Map(formats.map((f) => [f.name.toLowerCase(), f.id]));

let imported = 0;
let skipped = 0;
const unknownFormats = new Set<string>();

for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber++) {
	const row = sheet.getRow(rowNumber);

	const manufacturer = get(row, 'manufacturer');
	const scale = get(row, 'scale');
	const modelNumber = get(row, 'model number');
	const name = get(row, 'name');

	// Skip blank rows entirely.
	if (!manufacturer && !scale && !modelNumber && !name) continue;

	if (!manufacturer || !scale || !modelNumber || !name) {
		console.warn(`Row ${rowNumber}: missing required field(s), skipping.`);
		skipped++;
		continue;
	}

	// Skip duplicates by (manufacturer, model number).
	const existing = db
		.select({ id: schema.trains.id })
		.from(schema.trains)
		.where(eq(schema.trains.modelNumber, modelNumber))
		.all()
		.find((t) => t.id != null);
	if (existing) {
		skipped++;
		continue;
	}

	const purpose = get(row, 'purpose') || 'Motor & Lights';

	db.transaction((tx) => {
		const [train] = tx
			.insert(schema.trains)
			.values({
				manufacturer,
				scale,
				roadName: get(row, 'road name'),
				modelNumber,
				name,
				era: get(row, 'era'),
				notes: get(row, 'notes')
			})
			.returning()
			.all();

		const formatList = (get(row, 'formats') || '')
			.split(',')
			.map((s) => s.trim())
			.filter(Boolean);

		for (const formatName of formatList) {
			const formatId = formatByName.get(formatName.toLowerCase());
			if (!formatId) {
				unknownFormats.add(formatName);
				continue;
			}
			tx.insert(schema.trainFormatCompat)
				.values({ trainId: train.id, formatId, purpose })
				.run();
		}
	});

	imported++;
}

console.log(`Import complete: ${imported} train(s) imported, ${skipped} skipped.`);
if (unknownFormats.size > 0) {
	console.warn(
		`Unknown format name(s) skipped (no match in dcc_formats): ${[...unknownFormats].join(', ')}`
	);
}
sqlite.close();
