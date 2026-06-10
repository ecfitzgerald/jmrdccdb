# Database Operations

This document covers backup, restore, migration safety, and access control for the DCC Compatibility database.

## Overview

The authoritative database lives at `data/dcc.db` and contains all train, decoder, and compatibility data. It is:
- **Not committed to main app branches** (gitignored as a runtime artifact — live DB only)
- **Backed up automatically** to the `db-backups` orphan branch on `origin` daily via the mayor's backup job (retain last 14 snapshots)
- **SQLite3** with Write-Ahead Logging (WAL) enabled
- **Managed by Drizzle ORM**, with migrations in `drizzle/`

## DB Stewardship

The **mayor** is the DB steward. All canonical data changes go through:
1. User submits a suggestion via `/suggest`
2. Mayor reviews and approves/rejects via `/admin/suggestions` (runs `start-admin.sh` at `mayor/admin/` in the rig)
3. Approved changes are applied to the canonical DB (mayor's `dx_engineer` checkout)
4. Daily backup job captures the updated state and pushes to `origin/db-backups`

**New crew clones** should bootstrap from the canonical snapshot, not seed data:
```bash
npm run db:pull-canonical
```

## Backup Strategy

### When to Backup

Backups are created before:
1. **Major schema migrations** — test migration on a backup first
2. **Import operations** — before importing XLSX or other bulk data
3. **Manual edits** — before running one-off SQL updates
4. **Scheduled maintenance** — nightly or before deployments (optional, manual)

### How to Backup

Create a consistent backup using SQLite's backup API:

```bash
npm run db:backup
```

Output:
```
✓ Backup created: ./data/backups/dcc-2026-06-07T12-34-56-123.db
  Size: 128.45 KB
  Timestamp: 2026-06-07T12-34-56-123
```

Backups are timestamped and stored in `./data/backups/`. They are portable and can be copied to external storage or cloud backup.

### Backup Safety Guarantees

The backup API ensures:
- ✓ **Consistency**: Captures a complete, point-in-time snapshot even if the DB is under concurrent writes
- ✓ **WAL-safe**: Includes all pending writes from the WAL without locking the live database
- ✓ **Zero corruption**: Uses SQLite's internal backup mechanism, not file copying
- ✓ **Portable**: The backup is a complete, independent database file

## Restore Procedure

### Before Restore

1. **Identify the backup**: Find the backup file you want to restore from
   ```bash
   ls -lh ./data/backups/
   ```

2. **Test the backup** (optional but recommended):
   ```bash
   DB_PATH=./data/dcc-test.db npm run db:restore ./data/backups/dcc-2026-06-07T12-34-56-123.db
   npm run dev  # Verify the restored DB works
   rm ./data/dcc-test.db ./data/dcc-test.db-wal ./data/dcc-test.db-shm
   ```

### To Restore

```bash
npm run db:restore ./data/backups/dcc-2026-06-07T12-34-56-123.db
```

You will be prompted to confirm. The restore will:
1. Stop the live application
2. Remove the existing database and WAL files
3. Copy the backup to the live location
4. Clean up any stale WAL or shared-memory files

### After Restore

1. Verify the database:
   ```bash
   npm run dev  # Start the app and check the data
   ```

2. Check the restore logs to confirm all data is present
3. If the app starts successfully and data looks correct, the restore is complete

## Migration Safety

Migrations are defined in `drizzle/` and run automatically on app startup.

### Before Running a New Migration

1. **Backup the database**:
   ```bash
   npm run db:backup
   ```

2. **Test the migration on a copy**:
   ```bash
   cp ./data/backups/dcc-latest.db ./data/dcc-test.db
   DB_PATH=./data/dcc-test.db npm run dev
   # Inspect the test database to ensure migration succeeded
   rm ./data/dcc-test.db ./data/dcc-test.db-wal ./data/dcc-test.db-shm
   ```

3. **Ensure migrations are idempotent**: Running the same migration twice should be safe (Drizzle manages this via the `__drizzle_migrations` table)

### Rollback

If a migration fails or causes issues:

1. **Stop the app**
2. **Restore from the pre-migration backup**:
   ```bash
   npm run db:restore ./data/backups/dcc-before-migration.db
   ```
3. **Fix the migration** in `drizzle/` and test again

## Access Control

### File Permissions

The database should have restricted permissions to prevent accidental or unauthorized access.

```bash
# Restrict to owner only (recommended for development)
chmod 600 ./data/dcc.db
chmod 700 ./data/backups

# Production: assign to application user
sudo chown appuser:appgroup ./data/dcc.db ./data/backups
chmod 600 ./data/dcc.db
chmod 700 ./data/backups
```

### Environment Variables

Set these to customize paths:

| Variable | Default | Purpose |
|----------|---------|---------|
| `DB_PATH` | `./data/dcc.db` | Location of the live database |
| `BACKUP_DIR` | `./data/backups` | Where backups are stored |

### Verification

Verify current permissions:

```bash
ls -lh ./data/dcc.db
ls -ldh ./data/backups
```

Expected output (development):
```
-rw------- ed wheel 131072 Jun  7 12:34 ./data/dcc.db
drwx------ ed wheel   4096 Jun  7 12:34 ./data/backups
```

## Foreign Key Constraints

The database enforces foreign keys and cascade deletes:

```sql
PRAGMA foreign_keys = ON;
```

This is enabled on every connection. Deleting a train cascades to delete all its compatibility records. Plan deletions carefully.

## Data Import

### From XLSX

Import Kato train and decoder data from Excel:

```bash
npx tsx src/lib/db/import-kato-xlsx.ts ./data/Kato_trains.xlsx
```

This is idempotent: importing the same file twice will upsert based on unique keys.

**Workflow:**
1. Backup before import: `npm run db:backup`
2. Run import: `npx tsx src/lib/db/import-kato-xlsx.ts ./data/Kato_trains.xlsx`
3. Verify data in the app: `npm run dev`
4. If import fails, restore: `npm run db:restore ./data/backups/dcc-before-import.db`

### Seeding Reference Data

Initialize the database with reference data (operators, formats, decoder brands):

```bash
npm run db:seed
```

This populates the reference tables. Safe to run multiple times (upserts by unique key).

## Monitoring & Maintenance

### Database Size

Check current database size:

```bash
ls -lh ./data/dcc.db ./data/dcc.db-wal ./data/dcc.db-shm
du -sh ./data/
```

WAL files grow during active writes and shrink when checkpointed. If the database grows unexpectedly, investigate:
- Are there old suggestions waiting for review?
- Are there duplicate train/decoder records?

### WAL Checkpoint

SQLite checkpoints the WAL automatically, but you can force it:

```bash
sqlite3 ./data/dcc.db "PRAGMA wal_checkpoint(RESTART);"
```

This flushes the WAL to the main database file.

### Integrity Check

Periodically verify database integrity:

```bash
sqlite3 ./data/dcc.db "PRAGMA integrity_check;"
```

Output should be `ok`. If corruption is detected, restore from a known-good backup.

## Disaster Recovery

### Complete Database Loss

If the database is corrupted or deleted:

1. **Restore from the most recent backup**:
   ```bash
   npm run db:restore ./data/backups/dcc-latest.db
   ```

2. **If no backups exist**, re-import from the original XLSX source (lossy for user suggestions):
   ```bash
   npm run db:seed
   npx tsx src/lib/db/import-kato-xlsx.ts ./data/Kato_trains.xlsx
   ```
   This recovers train and decoder data but not user suggestions.

### Partial Data Loss

If specific records are missing or corrupted:

1. **Restore to a previous backup**
2. **Identify the missing records** in the restored database
3. **Merge changes manually** if newer data exists in a more recent backup

## FAQs

**Q: How often should I backup?**  
A: At minimum before major operations (imports, migrations). In production, consider nightly backups.

**Q: Can I restore while the app is running?**  
A: No. Stop the app first with Ctrl+C, then restore.

**Q: What if the backup fails?**  
A: Check file permissions on `./data/backups`. Ensure the directory exists and is writable. If `./data/dcc.db` is locked by another process, stop the app first.

**Q: How do I know if a restore succeeded?**  
A: After restore, run `npm run dev` and verify the data in the app. Check that the record count matches your expectations.

**Q: Can I backup to a different location?**  
A: Yes, set `BACKUP_DIR` when running the backup script:
```bash
BACKUP_DIR=/mnt/backup npm run db:backup
```
