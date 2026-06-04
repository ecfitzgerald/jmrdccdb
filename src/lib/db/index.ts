import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { join } from 'path';

const DB_PATH = process.env.DB_PATH || './data/dcc.db';

function getDb() {
	const sqlite = new Database(DB_PATH);
	sqlite.pragma('journal_mode = WAL');
	sqlite.pragma('foreign_keys = ON');
	const db = drizzle(sqlite, { schema });
	migrate(db, { migrationsFolder: join(process.cwd(), 'drizzle') });
	return db;
}

let _db: ReturnType<typeof getDb> | null = null;

export function db() {
	if (!_db) _db = getDb();
	return _db;
}
