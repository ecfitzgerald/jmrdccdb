import Database from 'better-sqlite3';
import { existsSync, mkdirSync, statSync } from 'fs';
import { join, dirname } from 'path';

const DB_PATH = process.env.DB_PATH || './data/dcc.db';
const BACKUP_DIR = process.env.BACKUP_DIR || './data/backups';
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const BACKUP_PATH = join(BACKUP_DIR, `dcc-${timestamp}.db`);

async function backup() {
	if (!existsSync(DB_PATH)) {
		console.error(`Error: Database not found at ${DB_PATH}`);
		process.exit(1);
	}

	mkdirSync(dirname(BACKUP_PATH), { recursive: true });

	const sourceDb = new Database(DB_PATH, { readonly: true });

	try {
		await sourceDb.backup(BACKUP_PATH);
		sourceDb.close();

		const stats = statSync(BACKUP_PATH);
		console.log(`✓ Backup created: ${BACKUP_PATH}`);
		console.log(`  Size: ${(stats.size / 1024).toFixed(2)} KB`);
		console.log(`  Timestamp: ${timestamp}`);
	} catch (err) {
		console.error('Backup failed:', err);
		process.exit(1);
	}
}

backup();
