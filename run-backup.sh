#!/bin/bash
# Snapshots dx_engineer's live dcc.db (WAL-safe, via the existing npm run db:backup
# tooling) and pushes the dated copy to the db-backups branch on origin.
#
# This branch is orphaned from main — it never merges back, so the binary .db
# snapshots never bloat the app's source history. Run on a schedule (cron/launchd).
set -euo pipefail

SOURCE_REPO=/Users/ed/gt/jmrdccdb/crew/dx_engineer
CLONE_DIR=/Users/ed/gt/jmrdccdb/.db-backups-clone
KEEP_SNAPSHOTS=14   # retain this many dated snapshots; prune the rest

cd "$SOURCE_REPO"
npm run db:backup > /tmp/db-backup-run.log 2>&1
LATEST=$(ls -t data/backups/*.db | head -1)
BASENAME=$(basename "$LATEST")

cd "$CLONE_DIR"
git pull --ff-only -q
cp "$SOURCE_REPO/$LATEST" "data/backups/$BASENAME"
git add "data/backups/$BASENAME"
if git diff --cached --quiet; then
	echo "No new snapshot to commit ($BASENAME already present)."
	exit 0
fi
git commit -q -m "backup: $BASENAME"

# Prune snapshots beyond KEEP_SNAPSHOTS (oldest first, by filename sort = chronological)
SNAPSHOTS=($(ls data/backups/*.db 2>/dev/null | sort))
EXCESS=$(( ${#SNAPSHOTS[@]} - KEEP_SNAPSHOTS ))
if (( EXCESS > 0 )); then
	for f in "${SNAPSHOTS[@]:0:$EXCESS}"; do
		git rm -q "$f"
		echo "Pruned old snapshot: $(basename "$f")"
	done
	git commit -q -m "prune: retain last $KEEP_SNAPSHOTS snapshots"
fi

git push -q origin db-backups
echo "Pushed $BASENAME to origin/db-backups"
