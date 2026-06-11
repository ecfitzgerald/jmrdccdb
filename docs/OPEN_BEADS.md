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
| hq-cv-pg7ve | dcc-compat ux: 'Edit' link on public train page is a dead end and exposed to all visitors |
| hq-cv-qnmts | security: admin form actions are not authenticated (broken access control) |
| hq-cv-rides | security regression: server-side admin sessions never expire (jm-cic regressed) |
| hq-cv-sjnko | security: harden login rate limiter — client-IP source trust and unbounded map |
| hq-cv-rzwla | dx: `ADMIN_PASSWORD` via `$env/static/private` breaks build & check on clean env |
| hq-cv-4oyea | dcc-compat ux: no admin UI to edit a decoder, so approved decoder corrections have nowhere to land |
| hq-cv-jwshk | dcc-compat ux: add-compat suggestion dead-ends when chosen format has no decoders |
| hq-cv-qzkky | dcc-compat ux: Reject button is nested inside the Approve form on suggestion review |
| hq-cv-vv4ao | dcc-compat ui: admin/trains scale badge uses blue instead of scale colours |
| hq-cv-womgm | dcc-compat ui: typo 'tracking-widests' drops label letter-spacing |
| hq-cv-j4h3y | dcc-compat ui: sound decoder colour is hardcoded and inconsistent; add palette token |
| hq-4f5 | Train detail page: expose all train fields |
| hq-d2f | Show line, era, and notes on train detail page |
| hq-8xc | Suggestion form: Confirmed Decoders multi-select should cover all selected formats |
| hq-ofg | Add 'Suggest edit' entry points on train and decoder detail pages |
| hq-oza | Fold add-compatibility fields into the train suggestion form |
| hq-vrb | Suggestion forms: edit mode pre-populates existing train/decoder data |
| hq-vzo | Suggestion page: format field as multi-select dropdown |
| hq-zna | Suggestion form: allow selecting multiple DCC formats at once |
| hq-zj1 | Add link to instructions/help page |
| hq-cv-npjta | Add line column to trains table and show on train detail page |
| hq-cv-krm3q | audit: UX flow and usability review |
| hq-cv-lgzfk | audit: security posture review |
| hq-cv-oeph6 | audit: UI consistency and visual quality review |
| hq-cv-xpfro | audit: developer experience and code quality review |

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

- **hq-cv-npjta** ("Add line column to trains table") may already be done —
  recent merges (PR #4/#6) added `trains.line` and `trains.operatorId`.
  Verify and close if so.
- **hq-cv-pg7ve** (Edit link is a dead end *and exposed to all visitors*)
  overlaps with **jm-dtc** (Edit link is a dead end, period). The
  `data.isAdmin` gate already addresses the "exposed to all visitors" half;
  jm-dtc covers the remaining "dead end" half. Consider closing
  hq-cv-pg7ve once jm-dtc lands, or merging the two.
