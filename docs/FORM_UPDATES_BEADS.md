# Form Updates — Tracked Beads

Work items targeting the `feature/form-updates` branch (successor to
`feature/form-development`, merged to `main` via PR #6 on 2026-06-09).

Beads live in the `jm` project (`/Users/ed/gt/jmrdccdb/.beads`). This file is
a durable pointer to them so the list survives session boundaries.

| Bead | Priority | Type | Title |
|------|----------|------|-------|
| jm-dtc | P2 | bug | Edit-train-records feature (jm-fma) was reverted by stale-checkout commit, never restored |
| jm-n81 | P3 | feature | dcc-compat ux: admin trains and decoders lists have no text filter/search |
| jm-tch | P3 | feature | dcc-compat ux: add-compat suggestion can't set format purpose; manual corrections offer no deep link |
| jm-zog | P3 | feature | dcc-compat ux: suggest form has weak validation and no reset after submit |

## jm-dtc — Edit-train-records feature reverted

`/trains/[id]` still links to `/admin/trains?edit={id}` and
`admin/trains/+page.server.ts` still computes `editId`, but
`admin/trains/+page.svelte` never reads `data.editId` and has no inline edit
form. Re-implement the inline edit form (mirroring the jm-8fn pattern in
`admin/decoders/+page.svelte`), wired to the existing `update` action.

## jm-n81 — No text filter/search on admin lists

`/admin/trains` and `/admin/decoders` support column sorting but no instant
text filter, unlike the public search page. Add a client-side filter
(manufacturer/name/model# for trains; brand/model/format for decoders).

## jm-tch — add-compat purpose not collected; no deep links on manual flows

The add-compat suggest form has no "purpose" selector (Motor & Lights /
Motor Only / Lights Only), so `purpose` is always null on submission, and
the admin review screen lacks one too. Separately, `correction` and
`update_decoder` approvals don't link to the relevant admin page/record.

## jm-zog — Weak suggest-form validation, no reset after submit

Required fields lack `required` attributes and inline validation; server
errors lose entered values; successful submission doesn't reset the form or
offer a "submit another" affordance.
