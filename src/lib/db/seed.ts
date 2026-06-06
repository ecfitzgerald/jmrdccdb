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

// Operators
await db
	.insert(schema.operators)
	.values([
		{ name: 'Aichi Loop',          sortOrder: 1  },
		{ name: 'Caltrain',            sortOrder: 2  },
		{ name: 'DB',                  sortOrder: 3  },
		{ name: 'Echigo Tokimeki',     sortOrder: 4  },
		{ name: 'Eizan Electric',      sortOrder: 5  },
		{ name: 'GWR',                 sortOrder: 6  },
		{ name: 'Hakone Tozan',        sortOrder: 7  },
		{ name: 'Hankyu',              sortOrder: 8  },
		{ name: 'Hokuetsu Express',    sortOrder: 9  },
		{ name: 'Ishikawa',            sortOrder: 10 },
		{ name: 'JNR',                 sortOrder: 11 },
		{ name: 'JRF',                 sortOrder: 12 },
		{ name: 'JR Central',          sortOrder: 13 },
		{ name: 'JR East',             sortOrder: 14 },
		{ name: 'JR Hokkaido',         sortOrder: 15 },
		{ name: 'JR Kyushu',           sortOrder: 16 },
		{ name: 'JR Tokai',            sortOrder: 17 },
		{ name: 'JR West',             sortOrder: 18 },
		{ name: 'Kashima',             sortOrder: 19 },
		{ name: 'Keikyu',              sortOrder: 20 },
		{ name: 'Kinki Nippon',        sortOrder: 21 },
		{ name: 'LNER',                sortOrder: 22 },
		{ name: 'Odakyu',              sortOrder: 23 },
		{ name: 'PRR',                 sortOrder: 24 },
		{ name: 'RhB',                 sortOrder: 25 },
		{ name: 'SBB',                 sortOrder: 26 },
		{ name: 'SNCF',                sortOrder: 27 },
		{ name: 'SNCF / SBB',          sortOrder: 28 },
		{ name: 'Seibu',               sortOrder: 29 },
		{ name: 'Taiwan High Speed Rail', sortOrder: 30 },
		{ name: 'Tokyo Metro',         sortOrder: 31 },
		{ name: 'Tokyu Electric',      sortOrder: 32 },
		{ name: 'Toyama',              sortOrder: 33 },
		{ name: 'Yokohama High Speed', sortOrder: 34 },
	]).onConflictDoNothing();

// Train types
await db
	.insert(schema.trainTypes)
	.values([
		{ name: 'EMU',          sortOrder: 1 },
		{ name: 'DMU',          sortOrder: 2 },
		{ name: 'Bi-mode',      sortOrder: 3 },
		{ name: 'Shinkansen',   sortOrder: 4 },
		{ name: 'Diesel Loco',  sortOrder: 5 },
		{ name: 'Electric Loco', sortOrder: 6 },
		{ name: 'Steam',        sortOrder: 7 },
	]).onConflictDoNothing();

// Formats — Japanese market standards
await db
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
			name: 'NEM651 (6-pin)',
			pinCount: 6,
			description: 'Standard 6-pin plug — some Kato models and select others',
			sortOrder: 8
		},
		{ name: 'NEM652 (8-pin)', pinCount: 8, description: 'Standard 8-pin plug — Kato HO scale models', sortOrder: 9 },
		{ name: 'Wired', pinCount: 0, description: 'Hardwired — no socket, requires soldering', sortOrder: 10 }
	]).onConflictDoNothing();

// Brands — sourced from Kato DCC Database spreadsheet Decoder(s) column
await db
	.insert(schema.decoderBrands)
	.values([
		{ name: 'Digitrax',                    website: 'https://www.digitrax.com' },
		{ name: 'TCS (Train Control Systems)', website: 'https://www.tcsdcc.com' },
		{ name: 'D&H (Doehler & Haass)',       website: 'https://www.doehler-haass.de' },
		{ name: 'MRC',                         website: 'https://www.modelrectifier.com' },
		{ name: 'Kato',                        website: 'https://www.katomodels.com' }
	]).onConflictDoNothing();

// Re-select so maps are populated whether rows were just inserted or already existed.
const formats = db.select().from(schema.dccFormats).all();
const brands  = db.select().from(schema.decoderBrands).all();
const fmt   = Object.fromEntries(formats.map((f) => [f.name, f.id]));
const brand = Object.fromEntries(brands.map((b) => [b.name, b.id]));

// Decoders — extracted from Kato DCC Database spreadsheet Decoder(s) column
await db.insert(schema.decoders).values([
	// EM13
	{ brandId: brand['Kato'],                        formatId: fmt['EM13'],           model: 'EM13',      motor: true,  lights: false },
	// K0
	{ brandId: brand['Digitrax'],                    formatId: fmt['K0'],             model: 'DN163K0A' },
	{ brandId: brand['Digitrax'],                    formatId: fmt['K0'],             model: 'DN163K0D' },
	{ brandId: brand['Digitrax'],                    formatId: fmt['K0'],             model: 'SDN144K0A', soundDecoder: true },
	// K1
	{ brandId: brand['Digitrax'],                    formatId: fmt['K1'],             model: 'DN163K1D' },
	{ brandId: brand['Digitrax'],                    formatId: fmt['K1'],             model: 'DN147K1C' },
	// K4
	{ brandId: brand['Digitrax'],                    formatId: fmt['K4'],             model: 'DN163K4A' },
	{ brandId: brand['TCS (Train Control Systems)'], formatId: fmt['K4'],             model: 'K7D4' },
	// FL12
	{ brandId: brand['Kato'],                        formatId: fmt['FL12'],           model: 'FL12',      motor: false, lights: true },
	// Wired — D&H (installed by soldering in Kato models, not plug-in)
	{ brandId: brand['D&H (Doehler & Haass)'],       formatId: fmt['Wired'],          model: 'PD05A' },
	{ brandId: brand['D&H (Doehler & Haass)'],       formatId: fmt['Wired'],          model: 'PD05A-3' },
	// Wired
	{ brandId: brand['Digitrax'],                    formatId: fmt['Wired'], model: 'DZ123' },
	{ brandId: brand['Digitrax'],                    formatId: fmt['Wired'], model: 'DZ125' },
	{ brandId: brand['MRC'],                         formatId: fmt['Wired'], model: 'MRC1952',   soundDecoder: true }
]).onConflictDoNothing();

console.log('Seed complete.');
sqlite.close();
