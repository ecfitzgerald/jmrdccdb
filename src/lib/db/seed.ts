import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { mkdirSync } from 'fs';
import { join } from 'path';

const DB_PATH = process.env.DB_PATH || './data/dcc.db';
mkdirSync('./data', { recursive: true });

const sqlite = new Database(DB_PATH);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');
const db = drizzle(sqlite, { schema });
migrate(db, { migrationsFolder: join(process.cwd(), 'drizzle') });

// Formats — Japanese market standards
const formats = await db
	.insert(schema.dccFormats)
	.values([
		{
			name: 'EM13',
			pinCount: 13,
			description:
				'Kato proprietary motor board — motor only or motor + sound. Used in many Kato Japanese N scale models.',
			sortOrder: 1
		},
		{ name: 'K0', pinCount: null, description: 'Kato N scale board type 0 — older locos and some EMUs', sortOrder: 2 },
		{ name: 'K1', pinCount: null, description: 'Kato N scale board type 1 — common in EMUs and DMUs', sortOrder: 3 },
		{
			name: 'K2',
			pinCount: null,
			description: 'Kato N scale board type 2 — longer board for larger locos',
			sortOrder: 4
		},
		{
			name: 'K4',
			pinCount: null,
			description: 'Kato N scale board type 4 — used in some locos and sets',
			sortOrder: 5
		},
		{
			name: 'FL12',
			pinCount: null,
			description: 'Kato lighting/function board — trailer and passenger cars, lights only',
			sortOrder: 6
		},
		{
			name: 'FL13',
			pinCount: null,
			description: 'Kato lighting/function board variant — similar to FL12, lights only',
			sortOrder: 7
		},
		{
			name: 'NEM651 (6-pin)',
			pinCount: 6,
			description: 'Standard 6-pin plug — some Kato models and select others',
			sortOrder: 8
		},
		{ name: 'NEM652 (8-pin)', pinCount: 8, description: 'Standard 8-pin plug — Kato HO scale models', sortOrder: 9 },
		{ name: 'Wired (direct)', pinCount: 0, description: 'Hardwired — no socket, requires soldering', sortOrder: 10 }
	])
	.returning();

// Brands — sourced from Kato DCC Database spreadsheet Decoder(s) column
const brands = await db
	.insert(schema.decoderBrands)
	.values([
		{ name: 'Digitrax',                    website: 'https://www.digitrax.com' },
		{ name: 'TCS (Train Control Systems)', website: 'https://www.tcsdcc.com' },
		{ name: 'D&H (Doehler & Haass)',       website: 'https://www.doehler-haass.de' },
		{ name: 'MRC',                         website: 'https://www.modelrectifier.com' },
		{ name: 'Kato',                        website: 'https://www.katomodels.com' }
	])
	.returning();

const fmt   = Object.fromEntries(formats.map((f) => [f.name, f.id]));
const brand = Object.fromEntries(brands.map((b) => [b.name, b.id]));

// Decoders — extracted from Kato DCC Database spreadsheet Decoder(s) column
await db.insert(schema.decoders).values([
	// K0
	{ brandId: brand['Digitrax'],                    formatId: fmt['K0'],            model: 'DN163K0a',  notes: 'Drop-in for Kato K0 board' },
	{ brandId: brand['Digitrax'],                    formatId: fmt['K0'],            model: 'SDN144K0A', notes: 'Sound drop-in for Kato K0 board', soundDecoder: true },
	// K4
	{ brandId: brand['Digitrax'],                    formatId: fmt['K4'],            model: 'DN163K4a',  notes: 'Drop-in for Kato K4 board' },
	{ brandId: brand['TCS (Train Control Systems)'], formatId: fmt['K4'],            model: 'TCSK4DI',   notes: 'TCS drop-in for Kato K4 board' },
	{ brandId: brand['TCS (Train Control Systems)'], formatId: fmt['K4'],            model: 'K7D4',      notes: 'TCS drop-in for Kato K4 board' },
	// NEM651 — D&H
	{ brandId: brand['D&H (Doehler & Haass)'],       formatId: fmt['NEM651 (6-pin)'],model: 'PD05A',     notes: 'Tiny N scale 6-pin decoder' },
	{ brandId: brand['D&H (Doehler & Haass)'],       formatId: fmt['NEM651 (6-pin)'],model: 'PD05a-3',   notes: 'Tiny N scale 6-pin decoder, 3-function' },
	// Wired
	{ brandId: brand['Digitrax'],                    formatId: fmt['Wired (direct)'],model: 'DZ123',     notes: 'Small wired decoder' },
	{ brandId: brand['Digitrax'],                    formatId: fmt['Wired (direct)'],model: 'DZ125',     notes: 'Small wired decoder' },
	{ brandId: brand['MRC'],                         formatId: fmt['Wired (direct)'],model: '1952',      notes: 'Sound decoder, requires modification to fit', soundDecoder: true },
	// Kato proprietary boards — EM13 (motor), FL12/FL13 (lights)
	{ brandId: brand['Kato'],                        formatId: fmt['EM13'],          model: 'EM13',      notes: 'Kato motor decoder board',             motor: true,  lights: false },
	{ brandId: brand['Kato'],                        formatId: fmt['FL12'],          model: 'FL12',      notes: 'Kato lighting function board',          motor: false, lights: true  },
	{ brandId: brand['Kato'],                        formatId: fmt['FL13'],          model: 'FL13',      notes: 'Kato lighting function board variant',  motor: false, lights: true  }
]);

// No sample trains — train data is imported from the Kato XLSX spreadsheet.
// Run the import script after seeding: npx tsx src/lib/db/import-kato-xlsx.ts

console.log('Seed complete.');
sqlite.close();
