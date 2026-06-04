import { trains, decoders, decoderBrands, suggestions } from './schema';
import { eq, sql } from 'drizzle-orm';
import * as schema from './schema';
import type { db } from './index';

type DB = ReturnType<typeof db>;

export function distinctManufacturers(d: DB): string[] {
	return d.selectDistinct({ v: trains.manufacturer }).from(trains).orderBy(trains.manufacturer).all().map((r) => r.v);
}

export function distinctScales(d: DB): string[] {
	return d.selectDistinct({ v: trains.scale }).from(trains).orderBy(trains.scale).all().map((r) => r.v);
}

export function distinctOperators(d: DB): string[] {
	return d
		.selectDistinct({ v: trains.roadName })
		.from(trains)
		.orderBy(trains.roadName)
		.all()
		.map((r) => r.v)
		.filter(Boolean) as string[];
}

export function decodersWithBrands(d: DB) {
	return d
		.select({
			id: decoders.id,
			brandName: decoderBrands.name,
			model: decoders.model,
			formatId: decoders.formatId,
			motor: decoders.motor,
			lights: decoders.lights,
			soundDecoder: decoders.soundDecoder,
			notes: decoders.notes
		})
		.from(decoders)
		.innerJoin(decoderBrands, eq(decoders.brandId, decoderBrands.id))
		.orderBy(decoderBrands.name, decoders.model)
		.all();
}

export function adminCounts(d: DB): { pendingCount: number; trainCount: number; decoderCount: number } {
	const pendingCount = d.select({ count: sql<number>`count(*)` }).from(suggestions).where(eq(suggestions.status, 'pending')).get()?.count ?? 0;
	const trainCount = d.select({ count: sql<number>`count(*)` }).from(trains).get()?.count ?? 0;
	const decoderCount = d.select({ count: sql<number>`count(*)` }).from(decoders).get()?.count ?? 0;
	return { pendingCount, trainCount, decoderCount };
}

if (import.meta.vitest) {
	const { it, expect, beforeEach } = import.meta.vitest;

	let testDb: DB;

	beforeEach(async () => {
		const BetterSQLite3 = (await import('better-sqlite3')).default;
		const { drizzle } = await import('drizzle-orm/better-sqlite3');
		const sqlite = new BetterSQLite3(':memory:');
		sqlite.exec(`
			CREATE TABLE dcc_formats (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, pin_count INTEGER, description TEXT, sort_order INTEGER DEFAULT 0);
			CREATE TABLE decoder_brands (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, website TEXT);
			CREATE TABLE decoders (id INTEGER PRIMARY KEY AUTOINCREMENT, brand_id INTEGER NOT NULL, format_id INTEGER NOT NULL, model TEXT NOT NULL, notes TEXT, buy_url TEXT, sound_decoder INTEGER DEFAULT 0, motor INTEGER DEFAULT 1 NOT NULL, lights INTEGER DEFAULT 1 NOT NULL);
			CREATE TABLE trains (id INTEGER PRIMARY KEY AUTOINCREMENT, manufacturer TEXT NOT NULL, scale TEXT NOT NULL, road_name TEXT, model_number TEXT NOT NULL, name TEXT NOT NULL, era TEXT, notes TEXT, created_at TEXT DEFAULT (datetime('now')));
			CREATE TABLE train_format_compat (id INTEGER PRIMARY KEY AUTOINCREMENT, train_id INTEGER NOT NULL, format_id INTEGER NOT NULL, purpose TEXT DEFAULT 'Motor & Lights' NOT NULL, notes TEXT);
			CREATE TABLE train_decoder_compat (id INTEGER PRIMARY KEY AUTOINCREMENT, train_id INTEGER NOT NULL, decoder_id INTEGER NOT NULL, confirmed INTEGER DEFAULT 1 NOT NULL, notes TEXT);
			CREATE TABLE suggestions (id INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT NOT NULL, payload TEXT NOT NULL, submitter_note TEXT, submitter_email TEXT, status TEXT DEFAULT 'pending' NOT NULL, admin_note TEXT, created_at TEXT DEFAULT (datetime('now')));
		`);
		testDb = drizzle(sqlite, { schema }) as unknown as DB;
	});

	it('distinctManufacturers returns sorted unique manufacturers', () => {
		testDb.insert(trains).values([
			{ manufacturer: 'Kato', scale: 'N', modelNumber: 'A1', name: 'Test' },
			{ manufacturer: 'Tomix', scale: 'N', modelNumber: 'B1', name: 'Test' },
			{ manufacturer: 'Kato', scale: 'N', modelNumber: 'A2', name: 'Test2' }
		]).run();
		const result = distinctManufacturers(testDb);
		expect(result).toEqual(['Kato', 'Tomix']);
	});

	it('distinctScales returns sorted unique scales', () => {
		testDb.insert(trains).values([
			{ manufacturer: 'Kato', scale: 'HO', modelNumber: 'A1', name: 'Test' },
			{ manufacturer: 'Kato', scale: 'N', modelNumber: 'A2', name: 'Test2' },
			{ manufacturer: 'Tomix', scale: 'N', modelNumber: 'B1', name: 'Test3' }
		]).run();
		const result = distinctScales(testDb);
		expect(result).toEqual(['HO', 'N']);
	});

	it('distinctOperators filters out nulls', () => {
		testDb.insert(trains).values([
			{ manufacturer: 'Kato', scale: 'N', modelNumber: 'A1', name: 'T1', roadName: 'JR East' },
			{ manufacturer: 'Kato', scale: 'N', modelNumber: 'A2', name: 'T2', roadName: null },
			{ manufacturer: 'Tomix', scale: 'N', modelNumber: 'B1', name: 'T3', roadName: 'JR West' }
		]).run();
		const result = distinctOperators(testDb);
		expect(result).toEqual(['JR East', 'JR West']);
		expect(result).not.toContain(null);
	});

	it('decodersWithBrands returns joined shape', () => {
		testDb.insert(schema.dccFormats).values({ name: 'NMRA DCC', sortOrder: 1 }).run();
		testDb.insert(decoderBrands).values({ name: 'Digitrax' }).run();
		testDb.insert(decoders).values({ brandId: 1, formatId: 1, model: 'DZ126', motor: true, lights: true, soundDecoder: false }).run();
		const result = decodersWithBrands(testDb);
		expect(result).toHaveLength(1);
		expect(result[0]).toMatchObject({ brandName: 'Digitrax', model: 'DZ126', motor: true, lights: true, soundDecoder: false });
	});

	it('decodersWithBrands returns empty array when no decoders', () => {
		expect(decodersWithBrands(testDb)).toEqual([]);
	});

	it('adminCounts returns zero counts on empty DB', () => {
		expect(adminCounts(testDb)).toEqual({ pendingCount: 0, trainCount: 0, decoderCount: 0 });
	});

	it('adminCounts only counts pending suggestions', () => {
		testDb.insert(schema.suggestions).values([
			{ type: 'add_train', payload: '{}', status: 'pending' },
			{ type: 'add_train', payload: '{}', status: 'approved' },
			{ type: 'add_train', payload: '{}', status: 'pending' }
		]).run();
		const { pendingCount } = adminCounts(testDb);
		expect(pendingCount).toBe(2);
	});
}
