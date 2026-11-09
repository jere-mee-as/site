# JERE.ING FFXIII pass: build notes

Status: **v3 built as a preview (Nov 8, 2026), not live.**
Specs: `ffxiii-plan.md` (original), `ffxiii-footage-notes.md` (v2 measurements), `ffxiii-audit.md` (audit + the Crystarium spec v3 implements). The audit page itself is `../audit.html`.

## Files
- **`../preview.html`** (v3) opens locally; its report links point at https://jere.ing/reports/.
- **`../template.html`** (v3) is the drop-in for the root `template.html`: `<ol id="list" hidden>\n<!-- LIST -->\n</ol>`, build.py unchanged.
- `../preview-v2.html` / `../template-v2.html` are the v2 versions.
- To ship it: archive the current site into `archive/`, swap in the template, push.

## What v3 changed (the audit's change list)
- **Chrome** at measured game proportions: pale sky band (11% of height) with italic HELP glyph; screen name bold/underlined on a rule; dark info band (Party, Crystarium only); pale footer with ⏱ playtime and ◇ count left, dark keycap prompts right. Every single-key prompt is a clickable button.
- **Rows**: main menu = dark fading bars; Datalog/Settings = silver rows with black slanted caps and drawn empty rows. Selection is the hand only (no teal fill, sheen, glint or glow ring). Outlined white text; serif only on the title wordmark.
- **Party**: role tag top right, LEADER mark on newest, grey → colour selection.
- **Datalog**: months on the left (chapter list), that month's reports on the right under LOG ENTRY; Enter opens a dark entry band (art, title, note, Read / New tab / Back); Enter again reads. Backdrop = selected report art, grey and cool, 480 ms dissolve. Esc: entry → entries → months → Party.
- **Crystarium** (rebuilt to the audit spec): marble field + bloom + vignette; one glassy ribbon loop per month (6 slots, two future months dark) on a dark thread; spokes to a month crystal on an engraved dish; slate chips + chevrons; overview = tunnel of ring icons with the type list ("Connectome Lv. 4") and a "{Type} Crystals" table; portrait card (No./Stage, Logged/Type, Archive level bar). Keys: ←/→ crystal, ↑/↓ month, Enter read, Z overview, Tab crystal names, Esc ring → overview → Party. Mouse: hover names, click selects, click again reads, wheel zooms. Phone: types as a horizontal row, card hidden.
- **Transitions**: Party → Datalog = cards fly off up-right (35 ms stagger), hard cut at 200 ms, right list wipes in, backdrop after a cloud beat. Into the Crystarium = cards off, ~300 ms of cloud with chrome on screen, month crystal condenses, holds ~1.1 s, type list snaps in and the view pulls out under a white flash. Leaving the Crystarium = in-place crossfade. No full-screen fog any more.
- **Notices**: slate box for "New report filed: …" on entry (once per session) and "Crystal acquired: …!" (or "Report logged: …") after a first read.
- **Acquisition**: thinner beam, node flash + hexes, then the white cut. Camera snaps back on close (bug fixed).
- **Bugs fixed**: fog over chrome, camera spring-back after closing, stale HELP line.
- **World switch** is a white flash instead of a fog pass.
- Sigil: thinner ribbons, three hairlines, more transparent shard.

## Not done (P3)
Report cover images for Datalog backdrops (needs build.py), loading capsule for slow reports.

## QA (sandbox)
Playwright at 1440×810, 1280×800 reduced motion, 390×844 touch: zero console errors, no horizontal scroll on phone. Real fonts (Saira, Instrument Serif) and audio weren't verifiable in the sandbox.
