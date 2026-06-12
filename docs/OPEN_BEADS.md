# Open Beads

A living snapshot of actionable work items (beads) for this project, kept in
git so they're discoverable across sessions and branches. Excludes
persistent infrastructure/role beads (mayor, deacon, witness, refinery,
patrols, crew workspaces) — those never close and aren't "work to do".

Source of truth is always the `bd` tool:
- `jm-*` beads: `cd /Users/ed/gt/jmrdccdb && BEADS_DIR=/Users/ed/gt/jmrdccdb/.beads bd show <id>`
- `hq-*` beads: `bd show <id>` (global town database)

**Maintenance:** when a bead listed here is closed, remove its row. When a
new actionable bead is created for this project, add a row. This file was
added on `feature/form-updates` and should merge to `main` with that branch.

## P1

| Bead | Title |
|------|-------|
| hq-wisp-o52.1 | [bug] Schema blocker: `wd` table missing `depends_on_id` column |
| jm-pv5 | [bug] `bd mol wisp gc --age 1h --force` deletes active `gt:merge-request` wisps with no recovery path |

## P2

| Bead | Title |
|------|-------|
| jm-dtc | [bug] Edit-train-records feature (jm-fma) was reverted by stale-checkout commit, never restored |
| jm-1mj | dcc-compat ui: admin/trains scale badge uses blue instead of scale colours (reopened — falsely closed) |
| jm-4nk | dcc-compat ui: typo 'tracking-widests' drops label letter-spacing (reopened — falsely closed) |
| jm-18c | dcc-compat ui: sound decoder colour is hardcoded and inconsistent; add palette token (reopened — falsely closed) |
| jm-kbd | dcc-compat ui: train detail re-inlines icon SVGs instead of icon components (reopened — falsely closed) |
| jm-0ka | Re-verify remaining jm-gnz UI-audit findings for fabricated close reasons |
| hq-4f5 | Train detail page: expose all train fields |
| hq-d2f | Show line, era, and notes on train detail page |
| hq-8xc | Suggestion form: Confirmed Decoders multi-select should cover all selected formats |
| hq-ofg | Add 'Suggest edit' entry points on train and decoder detail pages |
| hq-oza | Fold add-compatibility fields into the train suggestion form |
| hq-vrb | Suggestion forms: edit mode pre-populates existing train/decoder data |
| hq-vzo | Suggestion page: format field as multi-select dropdown |
| hq-zna | Suggestion form: allow selecting multiple DCC formats at once |
| hq-zj1 | Add link to instructions/help page |

## P3

| Bead | Title |
|------|-------|
| jm-n81 | dcc-compat ux: admin trains and decoders lists have no text filter/search |
| jm-tch | dcc-compat ux: add-compat suggestion can't set format purpose; manual corrections offer no deep link |
| jm-zog | dcc-compat ux: suggest form has weak validation and no reset after submit |
| jm-7qs | dcc-compat: show Line column on main trains table, after Operator |
| jm-dnn | dcc-compat suggest form: Manufacturer field should be a combobox of existing manufacturers |
| jm-cma | dcc-compat suggest form: 'Model Name' field triggers 1Password autofill prompt |
| jm-0z5 | dcc-compat suggest form: add 'Line' field to Add Train form |
| jm-4k4 | dcc-compat suggest form: show format outline diagrams in Compatible DCC Formats checklist |
| hq-2h5 | Decoder suggestion: add product site URL and affiliate buy link fields |
| hq-7ex | dcc-compat decoder confirm: soft warning when two same-family decoders selected for a train |
| hq-fde | dcc-compat ui: update K2 and K4 SVG outlines in FormatDiagram.svelte once shapes are confirmed |

## Notes / possible duplicates or already-resolved

- 2026-06-12: Spot-checked all 16 P2 `hq-cv-*` convoy beads against
  `feature/form-updates`. 13 were verified as genuinely done and closed
  (hq-cv-pg7ve, qnmts, rides, sjnko, rzwla, 4oyea, jwshk, qzkky, npjta,
  krm3q, lgzfk, oeph6, xpfro). hq-cv-pg7ve's remaining "dead end" half lives
  on as jm-dtc (already tracked above).
- **Fabricated close reasons found**: jm-1mj, jm-4nk, jm-18c, and jm-kbd
  (all findings from the jm-gnz UI audit) were marked closed citing specific
  commit hashes "on feature/form-development" — none of those hashes exist
  anywhere in repo history, and the claimed fixes are absent from the code.
  All 4 reopened as P2 (listed above). jm-0ka tracks re-verifying the
  remaining 7 jm-gnz findings for the same issue.
