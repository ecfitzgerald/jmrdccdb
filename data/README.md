# data/

SQLite database for the JMR DCC Compatibility app. Managed by Drizzle ORM — migrations live in `../drizzle/`.

Seed reference data: `npm run db:seed`  
Import Kato XLSX: `npx tsx src/lib/db/import-kato-xlsx.ts <path.xlsx>`

## First Setup — Canonical DB

**Do not seed from scratch.** The mayor stewards the canonical dataset. Pull it instead:

```bash
npm run db:pull-canonical
```

This fetches the latest dated snapshot from `origin/db-backups` (a dedicated orphan branch) and restores it as your local `dcc.db`. You get the full dataset with operators, lines, and compatibility data — not fake seed data.

- Safe to re-run any time to refresh from the latest canonical state.
- Pass `--force` to skip the confirmation prompt.

**Data changes go through the suggestion workflow**, not direct DB edits. Submit via `/suggest`; the mayor reviews and approves via `/admin/suggestions`.

## Backup & Recovery

**The database is authoritative.** Backups protect against disk failure, accidental deletion, or botched migrations. The live `dcc.db` **must not be committed to the main app branches** — it's a runtime artifact. Dated snapshots are version-controlled separately on the `db-backups` orphan branch and pushed automatically by the mayor's daily backup job.

### Taking a Backup

Create a WAL-safe snapshot using the SQLite backup API:

```bash
npx tsx scripts/backup-db.ts
```

This creates a timestamped backup in `./data/backups/dcc-YYYY-MM-DDTHH-MM-SS.db`. Backups include all current data and are portable across systems.

**Set environment variables to customize:**
- `DB_PATH` (default: `./data/dcc.db`) — path to live database
- `BACKUP_DIR` (default: `./data/backups`) — where to store backups

### Restoring from Backup

To restore from a backup (destructive — overwrites the live database):

```bash
npx tsx scripts/restore-db.ts ./data/backups/dcc-2026-06-07T12-34-56.db
```

This will:
1. Prompt for confirmation (Ctrl+C to cancel)
2. Remove the live database and WAL files
3. Restore from the backup using the SQLite backup API
4. You can then `npm run dev` to verify the restore

### WAL Safety

The database uses SQLite Write-Ahead Logging (WAL) for crash safety. The backup scripts handle this correctly:
- Backup script: Uses `better-sqlite3`'s `.backup()` method, which captures a consistent snapshot
- Restore script: Cleans up WAL and shared-memory files before restoring

Do **not** use `cp` or file copying tools directly — you will get incomplete snapshots if the database is open or under active writes.

### Migration Testing

Before running migrations on the live database, test them on a backup copy:

```bash
# Create a test copy
cp ./data/backups/dcc-latest.db ./data/dcc-test.db

# Run migrations on the test copy
DB_PATH=./data/dcc-test.db npm run db:generate

# Inspect the test database, then delete it
rm ./data/dcc-test.db
```

### File Permissions

The database file should have restricted permissions in production. Set:

```bash
chmod 600 ./data/dcc.db
chmod 700 ./data/backups
```

Only the application runtime user should have read/write access. On shared systems, use:

```bash
chown appuser:appgroup ./data/dcc.db ./data/backups
chmod 600 ./data/dcc.db
chmod 700 ./data/backups
```

## Schema

```
operators                    train_types                  dcc_formats
─────────────────────        ─────────────────────        ─────────────────────
id PK                        id PK                        id PK
name UNIQUE                  name UNIQUE                  name UNIQUE
sort_order                   sort_order                   pin_count
                                                          description
                                                          sort_order

decoder_brands
─────────────────────
id PK
name UNIQUE
website


trains ──────────────────────────────────────────────────────────────────────────
id PK
manufacturer
scale
operator_id ──────────────────────────────────────────────────────► operators.id
model_number
name
line
type_id ──────────────────────────────────────────────────────────► train_types.id
era
notes
created_at


decoders
─────────────────────────────────────────────────────────────────────────────────
id PK
brand_id ──────────────────────────────────────────────────────────► decoder_brands.id
format_id ─────────────────────────────────────────────────────────► dcc_formats.id
model                        UNIQUE (brand_id, model)
notes
buy_url
motor
lights
sound_decoder


train_format_compat          ← which DCC board formats a train accepts
─────────────────────────────────────────────────────────────────────────────────
id PK
train_id ──────────────────────────────────────────────────────────► trains.id  (cascade delete)
format_id ─────────────────────────────────────────────────────────► dcc_formats.id
purpose                      'Motor Only' | 'Lights Only' | 'Motor & Lights'
notes                        UNIQUE (train_id, format_id)


train_decoder_compat         ← specific decoders confirmed to work with a train
─────────────────────────────────────────────────────────────────────────────────
id PK
train_id ──────────────────────────────────────────────────────────► trains.id  (cascade delete)
decoder_id ────────────────────────────────────────────────────────► decoders.id (cascade delete)
confirmed
notes


suggestions                  ← user-submitted additions / corrections (pending review)
─────────────────────────────────────────────────────────────────────────────────
id PK
type                         'add_train' | 'add_decoder' | 'add_compat' | 'correction'
payload                      JSON
submitter_note
submitter_email
status                       'pending' | 'approved' | 'rejected'
admin_note
created_at
```
