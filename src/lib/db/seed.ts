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
const formats = await db.insert(schema.dccFormats).values([
	{ name: 'EM13',            pinCount: 13,  description: 'Kato proprietary motor board — motor only or motor + sound. Used in many Kato Japanese N scale models.', sortOrder: 1 },
	{ name: 'K0',              pinCount: null, description: 'Kato N scale board type 0 — older locos and some EMUs', sortOrder: 2 },
	{ name: 'K1',              pinCount: null, description: 'Kato N scale board type 1 — common in EMUs and DMUs', sortOrder: 3 },
	{ name: 'K2',              pinCount: null, description: 'Kato N scale board type 2 — longer board for larger locos', sortOrder: 4 },
	{ name: 'K4',              pinCount: null, description: 'Kato N scale board type 4 — used in some locos and sets', sortOrder: 5 },
	{ name: 'FL12',            pinCount: null, description: 'Kato lighting/function board — trailer and passenger cars, lights only', sortOrder: 6 },
	{ name: 'FL13',            pinCount: null, description: 'Kato lighting/function board variant — similar to FL12, lights only', sortOrder: 7 },
	{ name: 'NEM651 (6-pin)', pinCount: 6,   description: 'Standard 6-pin plug — some Kato models and select others', sortOrder: 8 },
	{ name: 'NEM652 (8-pin)', pinCount: 8,   description: 'Standard 8-pin plug — Kato HO scale models', sortOrder: 9 },
	{ name: 'Wired (direct)', pinCount: 0,   description: 'Hardwired — no socket, requires soldering', sortOrder: 10 }
]).returning();

// Brands
const brands = await db.insert(schema.decoderBrands).values([
	{ name: 'Digitrax',                   website: 'https://www.digitrax.com' },
	{ name: 'TCS (Train Control Systems)', website: 'https://www.tcsdcc.com' },
	{ name: 'ESU LokSound',               website: 'https://www.esu.eu' },
	{ name: 'NCE',                        website: 'https://www.ncedcc.com' },
	{ name: 'Zimo',                       website: 'https://www.zimo.at' },
	{ name: 'Kato',                        website: 'https://www.katomodels.com' }
]).returning();

const fmt   = Object.fromEntries(formats.map(f => [f.name, f.id]));
const brand = Object.fromEntries(brands.map(b => [b.name, b.id]));

// Decoders
await db.insert(schema.decoders).values([
	// K0 — Kato type 0
	{ brandId: brand['Digitrax'],                    formatId: fmt['K0'], model: 'DN163K0a',  notes: 'Drop-in for Kato N scale (type 0 board)' },
	{ brandId: brand['TCS (Train Control Systems)'], formatId: fmt['K0'], model: 'K0D8',      notes: 'Drop-in for Kato, 8-function' },
	{ brandId: brand['Digitrax'],                    formatId: fmt['K0'], model: 'SDN163K0',  notes: 'Sound drop-in for Kato type 0', soundDecoder: true },

	// K1 — Kato type 1
	{ brandId: brand['Digitrax'],                    formatId: fmt['K1'], model: 'DN163K1D',  notes: 'Drop-in for Kato N scale (type 1 board)' },
	{ brandId: brand['TCS (Train Control Systems)'], formatId: fmt['K1'], model: 'K1D8',      notes: 'Drop-in for Kato, 8-function' },
	{ brandId: brand['Digitrax'],                    formatId: fmt['K1'], model: 'SDN163K1',  notes: 'Sound drop-in for Kato type 1', soundDecoder: true },

	// K2 — Kato type 2
	{ brandId: brand['Digitrax'],                    formatId: fmt['K2'], model: 'DN163K2',   notes: 'Drop-in for Kato N scale (type 2 board)' },
	{ brandId: brand['TCS (Train Control Systems)'], formatId: fmt['K2'], model: 'K2D8',      notes: 'Drop-in for Kato, 8-function' },

	// EM13 — Kato (motor only; lights field false per domain knowledge)
	{ brandId: brand['Digitrax'],                    formatId: fmt['EM13'], model: 'DN163K0a',            notes: 'Drop-in for Kato EM13 socket',         lights: false },
	{ brandId: brand['TCS (Train Control Systems)'], formatId: fmt['EM13'], model: 'K0D8',               notes: 'Drop-in for Kato EM13, 8-function',    lights: false },
	{ brandId: brand['ESU LokSound'],                formatId: fmt['EM13'], model: 'LokSound micro EM13', notes: 'Sound decoder for Kato EM13',           lights: false, soundDecoder: true },

	// NEM651 — Kato (select models with 6-pin socket)
	{ brandId: brand['Digitrax'],                    formatId: fmt['NEM651 (6-pin)'], model: 'DN163I0', notes: 'For Kato models with 6-pin socket' },
	{ brandId: brand['NCE'],                         formatId: fmt['NEM651 (6-pin)'], model: 'D13SRJ',  notes: '1.3A stall, 6-pin' },
	{ brandId: brand['Zimo'],                        formatId: fmt['NEM651 (6-pin)'], model: 'MX616',   notes: 'Tiny 6-pin' }
]);

// No sample trains — train data is imported from the Kato XLSX spreadsheet.
// Run the import script after seeding: npx tsx src/lib/db/import-kato-xlsx.ts

console.log('Seed complete.');
sqlite.close();
