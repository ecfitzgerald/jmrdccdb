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
| hq-8cu | Admin suggestion review page doesn't render hq-vrb edit-mode payloads |
| hq-ofg | Add 'Suggest edit' entry points on train and decoder detail pages |
| hq-oza | Fold add-compatibility fields into the train suggestion form |
| hq-vzo | Suggestion page: format field as multi-select dropdown |
| hq-zj1 | Add link to instructions/help page |

## P3

| Bead | Title |
|------|-------|
| jm-n81 | dcc-compat ux: admin trains and decoders lists have no text filter/search |
| jm-tch | dcc-compat ux: add-compat suggestion can't set format purpose; manual corrections offer no deep link |
| jm-dnn | dcc-compat suggest form: Manufacturer field should be a combobox of existing manufacturers |
| jm-0z5 | dcc-compat suggest form: add 'Line' field to Add Train form |
| jm-4k4 | dcc-compat suggest form: show format outline diagrams in Compatible DCC Formats checklist |
| jm-nfi | Decoder suggestion: add product site URL and affiliate buy link fields |
| jm-7ox | dcc-compat decoder confirm: soft warning when two same-family decoders selected for a train |
| jm-lbg | dcc-compat ui: update K2 and K4 SVG outlines in FormatDiagram.svelte once shapes are confirmed |

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
- 2026-06-12: Reviewed the P3 list. 8/11 entries checked out fine (verified
  still-unaddressed or freshly created this session). 3 entries
  (`hq-2h5`, `hq-7ex`, `hq-fde`) were **phantom IDs** — `bd show` found no
  matching issue in either database, and no bead matched their titles by
  text search either. Recreated as real beads (`jm-nfi`, `jm-7ox`, `jm-lbg`)
  with the same descriptions and re-listed above.
- 2026-06-13: Closed 6 beads (jm-1mj, jm-4nk, jm-18c, jm-kbd, hq-4f5, hq-d2f)
  after verifying their fixes are real commits (8d7614a, b7cb3d4, bb851ab,
  35bb3cc, 8381b5f) and ancestors of `feature/form-updates` HEAD, pushed to
  origin. jm-7qs (Line column on main trains table) slung to ui_engineer as
  convoy hq-cv-shs5w; removed from P3 while in progress.
- 2026-06-13: Closed jm-7qs (verified, commit 199e87b). Slung jm-dtc to
  ui_engineer and jm-0ka to ux_engineer. jm-0ka re-verified the remaining 7
  jm-gnz findings: jm-nzy was genuinely incomplete (fixed in 6687fb9);
  jm-yds/jm-1y5/jm-tl2/jm-pgl/jm-3ou verified fixed; jm-7oq was only 3/4
  fixed and reopened (narrowed to dead-code dashboard stat-card colours).
  jm-0ka closed. jm-dtc verified fixed (commit 5aaa21a, inline edit form
  restored) and closed. jm-7oq fixed (commit 71482eb, removed dead 'cls'
  field entirely) and closed.
- 2026-06-13: An unrequested commit (1e606b7, "feat(jm-zog): add form
  validation and reset on suggest form") landed on feature/form-updates
  while syncing — jm-zog is a P3 bead that wasn't slung. Verified against
  its 3 requirements (required attrs, success+reset, error-value
  preservation) — all met; pre-existing type-check errors unchanged. Closed
  by ux_engineer itself (their own backlog from jm-021 audit); removed from
  P3.
- 2026-06-13: hq-8xc depends on hq-zna (decoder picklist must cover "all
  selected formats" once format selection is multi-select; hq-zna isn't done
  yet). Slung hq-zna to ux_engineer (convoy hq-cv-svicq) as the prerequisite;
  hq-8xc to follow once that lands. Note: hq-vzo ("format field as
  multi-select dropdown") may overlap/duplicate hq-zna — worth reconciling
  once hq-zna is done.
- 2026-06-13: Also found ux_engineer self-closed jm-cma (commit f52c6d1,
  added autocomplete="off" to the suggest form) — their own backlog item,
  reasonable fix. Removed from P3.
- 2026-06-14: hq-zna landed (1e94754) but had a typo bug — the decoder
  picklist's `{#each}` referenced `decodersForFormats` while the `$derived`
  was declared as `decodersForFormatss`, an undefined variable that would
  throw at runtime as soon as a selected format had confirmed decoders.
  Also `compatFormatId` (single-value) was left orphaned after the
  multi-select refactor. Fixed directly by mayor (2fc4b06): renamed to the
  correctly-spelled `decodersForFormats`, removed the dead `compatFormatId`
  state, pointed "Add a decoder" at the first selected format. Verified and
  closed hq-zna. hq-8xc closed as a side effect — the fixed
  `decodersForFormats` already filters `data.allDecoders` across all
  `compatFormatIds` (each decoder has one formatId, so no dupes), satisfying
  hq-8xc's requirement. hq-vzo/hq-zna overlap note: resolved, hq-zna covered
  it.
- 2026-06-14: hq-vrb (commit 8128153) did NOT meet its spec — the
  'correction' and 'update_decoder' suggestion types were still the old
  generic "field / current value / suggested value" forms, not the
  add_train/add_decoder layouts pre-filled with current record values as
  required. Nudged ux_engineer with the gap.
- 2026-06-14: ux_engineer pushed a follow-up (ff08173) adding the
  add_train/add_decoder edit-mode layouts as specced — but it introduced two
  more bugs. (1) The new `fullTrain` query used `eq(trains.id, ...)` without
  importing `eq` from drizzle-orm — every `/suggest?trainId=...` request
  (including the pre-existing preselectedTrain flow) 500'd. Fixed directly by
  mayor (d9f25cc), pushed. (2) The `actions.default` handler was never updated
  for the new edit-mode field sets: submitting the edit-mode 'correction' form
  always fails with "Please specify what to correct" (action still requires
  `suggestedValue`), and the edit-mode 'update_decoder' form always fails with
  "Please select a valid field to correct" (action still requires
  `updateField`) — in both cases the user's edits are silently dropped.
  Reported back to ux_engineer with exact fix needed; hq-vrb remains open in
  P2 pending the action-handler update.
- 2026-06-14: ux_engineer pushed a203f34 fixing the action handlers as
  requested (correction/update_decoder now detect edit-mode by presence of
  manufacturer+name / brandName+model and build full-record payloads, with
  the old generic-form logic preserved as fallback). Verified: type-clean,
  /suggest?trainId=1&type=correction loads fine. Closed hq-vrb.
  New gap found: /admin/suggestions/[id]/+page.svelte still renders the old
  generic payload shape (p.field/p.currentValue/p.suggestedValue/
  p.correctedValue) for correction/update_decoder, so new edit-mode
  suggestions show as '-' placeholders to the reviewing admin. Created
  hq-8cu (P2, ux_engineer) to add a proper diff view for the new payload
  shape.
