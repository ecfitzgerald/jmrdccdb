import Database from 'better-sqlite3';
import { existsSync, unlinkSync, createWriteStream, mkdirSync } from 'fs';
import { join } from 'path';
import { spawnSync, spawn } from 'child_process';
import * as readline from 'readline';

const DB_PATH = process.env.DB_PATH || './data/dcc.db';
const FORCE = process.argv.includes('--force');
const REMOTE = 'origin';
const BACKUP_BRANCH = 'db-backups';
const BACKUP_PREFIX = 'data/backups/';

function git(...args: string[]): string {
	const result = spawnSync('git', args, { encoding: 'utf8' });
	if (result.status !== 0) {
		console.error(`git ${args.join(' ')} failed:\n${result.stderr}`);
		process.exit(1);
	}
	return result.stdout.trim();
}

async function extractSnapshot(gitRef: string, destPath: string): Promise<void> {
	return new Promise((resolve, reject) => {
		const writer = createWriteStream(destPath);
		const proc = spawn('git', ['show', gitRef]);
		proc.stdout.pipe(writer);
		proc.on('close', (code) => {
			if (code !== 0) reject(new Error(`git show exited with ${code}`));
			else resolve();
		});
		proc.stderr.on('data', (d) => process.stderr.write(d));
	});
}

async function pull() {
	console.log(`Fetching ${REMOTE}/${BACKUP_BRANCH}...`);
	git('fetch', REMOTE, BACKUP_BRANCH);

	// After the explicit fetch, FETCH_HEAD points to the branch tip
	const tree = git('ls-tree', '-r', '--name-only', 'FETCH_HEAD');
	const snapshots = tree
		.split('\n')
		.filter((f) => f.startsWith(BACKUP_PREFIX) && f.endsWith('.db'))
		.sort();

	if (snapshots.length === 0) {
		console.error(`No snapshots found on ${REMOTE}/${BACKUP_BRANCH}`);
		process.exit(1);
	}

	const latest = snapshots[snapshots.length - 1];
	const snapshotName = latest.replace(BACKUP_PREFIX, '');
	console.log(`Latest canonical snapshot: ${snapshotName}`);
	console.log(`  Available snapshots: ${snapshots.length}`);

	if (!FORCE) {
		if (existsSync(DB_PATH)) {
			const existing = new Database(DB_PATH, { readonly: true });
			const trainCount = (existing.prepare('SELECT COUNT(*) AS n FROM trains').get() as any)?.n ?? '?';
			existing.close();
			console.warn(`\n⚠️  This will replace your local database (${DB_PATH})`);
			console.warn(`   Current local DB has ${trainCount} trains.`);
		} else {
			console.warn(`\n⚠️  No existing local database found — will create ${DB_PATH}`);
		}
		console.warn(`   Replacing with canonical snapshot: ${snapshotName}`);
		console.warn('\nPress Enter to continue, or Ctrl+C to cancel...');

		const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
		await new Promise<void>((resolve) => rl.question('', () => { rl.close(); resolve(); }));
	}

	const tmpPath = `${DB_PATH}.pull-tmp`;
	console.log('\nExtracting snapshot...');
	await extractSnapshot(`FETCH_HEAD:${latest}`, tmpPath);

	const walFile = `${DB_PATH}-wal`;
	const shmFile = `${DB_PATH}-shm`;
	if (existsSync(DB_PATH)) { unlinkSync(DB_PATH); console.log('✓ Removed existing database'); }
	if (existsSync(walFile)) { unlinkSync(walFile); console.log('✓ Removed existing WAL file'); }
	if (existsSync(shmFile)) { unlinkSync(shmFile); console.log('✓ Removed existing SHM file'); }

	mkdirSync('data', { recursive: true });

	const snapshotDb = new Database(tmpPath, { readonly: true });
	try {
		await snapshotDb.backup(DB_PATH);
		snapshotDb.close();
		unlinkSync(tmpPath);

		const restored = new Database(DB_PATH, { readonly: true });
		const trainCount = (restored.prepare('SELECT COUNT(*) AS n FROM trains').get() as any)?.n ?? '?';
		restored.close();

		console.log(`\n✓ Canonical snapshot restored: ${snapshotName}`);
		console.log(`✓ Live database at: ${DB_PATH}`);
		console.log(`  ${trainCount} trains loaded`);
		console.log('\nRun npm run dev to start with the canonical dataset.');
	} catch (err) {
		console.error('Restore failed:', err);
		unlinkSync(tmpPath);
		process.exit(1);
	}
}

pull();
