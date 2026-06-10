import Database from 'better-sqlite3';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import * as readline from 'readline';

const DB_PATH = process.env.DB_PATH || './data/dcc.db';
const BACKUP_PATH = process.argv[2];
const FORCE = process.argv[3] === '--force' || process.env.FORCE_RESTORE === 'true';

if (!BACKUP_PATH) {
	console.error('Usage: npx tsx scripts/restore-db.ts <backup-file> [--force]');
	console.error('Example: npx tsx scripts/restore-db.ts ./data/backups/dcc-2026-06-07T12-34-56.db');
	process.exit(1);
}

if (!existsSync(BACKUP_PATH)) {
	console.error(`Error: Backup file not found at ${BACKUP_PATH}`);
	process.exit(1);
}

async function restore() {
	if (!FORCE) {
		console.warn('⚠️  This will overwrite the current database at:', DB_PATH);
		console.warn('Backup file: ' + BACKUP_PATH);
		console.warn('Press Enter to continue, or Ctrl+C to cancel...');

		const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

		await new Promise<void>((resolve) => {
			rl.question('', () => {
				rl.close();
				resolve();
			});
		});
	}

	// Remove existing DB files (including WAL and shared memory)
	const walFile = `${DB_PATH}-wal`;
	const shmFile = `${DB_PATH}-shm`;

	if (existsSync(DB_PATH)) {
		unlinkSync(DB_PATH);
		console.log(`✓ Removed existing database`);
	}
	if (existsSync(walFile)) {
		unlinkSync(walFile);
		console.log(`✓ Removed existing WAL file`);
	}
	if (existsSync(shmFile)) {
		unlinkSync(shmFile);
		console.log(`✓ Removed existing SHM file`);
	}

	// Restore backup to DB location
	const backupDb = new Database(BACKUP_PATH, { readonly: true });

	try {
		await backupDb.backup(DB_PATH);
		backupDb.close();

		console.log(`✓ Restored database from: ${BACKUP_PATH}`);
		console.log(`✓ Live database at: ${DB_PATH}`);
		console.log('\nVerify the restore: npm run dev');
	} catch (err) {
		console.error('Restore failed:', err);
		process.exit(1);
	}
}

restore();
