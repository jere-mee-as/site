# JRL Launcher v4: the handheld (Uplink pass) — plan + grill (Nov 8–9, 2026)

Builds on `jrl-launcher-uplink-audit.md` (the audit) and `../../lab/uplink/docs/uplink-notes.md` (the site). Overrides `jrl-launcher-v2-plan.md` where they conflict. v3.0 behaviour (scrub-to-launch, program file, kits, terminal + `set`, colony, clock hold/lock, wake resolve, launch burst, haptic waveform, bridge adapter) is kept; the view layer is rebuilt. Test for every choice: on a phone unlocked 80× a day, does it look like the Uplink world AND stay faster than the stock home? The grill was passed on Nov 9.

## Decisions
1. **Fiction:** the phone is the runner's handheld, paired to the shell. Light touch: it's a phone, no roleplay bloat unless it earns its place. Host `jrl-h`.
2. **Colour by place:** palettes and radical/utility are gone. Fog hangar ground, one hue per room, only inside its room. `set paint` (Stock, Vault rose, Hazard, Dust, Somatic, Scan) recolours the signal colour only.
3. **Rooms (plain names, JP co-labels):** 00 Shell (fog) · 01 Apps (white/pink) · 02 Agenda (bone/orange) · 03 Music (orange/blue) · 04 Inbox (lavender, small text on carbon) · 05 Colony (carbon/teal). Diagnostics = the terminal. Night 00–06 ET: carbon grounds.
4. **Sound:** off by default; SND chip in the system strip and `set sound on`.
5. **Shell object:** no wireframe. The one object is a lit, dithered planet (Tau Ceti IV): the terminator follows the real time of day, the moon phase is real. The four readouts (Agenda, Music, Inbox, Colony) sit beside it in one carbon panel.
6. **Icons:** default `glyph` = hand-drawn 9×9 category pictograms (mail, messages, camera, maps, music, money, dating, AI, …) matched by package/category, plus the app's colour as the slot's edge band and the 3-letter code. `set icons glyph|app|pixel|code`.
7. **Apps room:** a stash by use (top ~12 as tiles sized by how often you open them, like the Vault's item size = file size), then the long tail as a compact A–Z table in pages. Nothing scrolls.
8. **Colony:** lives in its own room (no Shell wallpaper); Shell ground is the site's chevron.
9. **Chrome:** carbon system strip on top (replaces Android's bar), carbon prompt bar below with the A–Z ruler at full width. Gesture prompts flash ~2s on entering a room, then hide.
10. **Arrivals:** the top strip turns lime for 3s with `INCOMING // WHATSAPP 04` (keeps the thumb zone clear).
11. **Clock:** Doto 300 like the site (check sunlight legibility; a `set` option if weak).
12. **Date in the strip (Shell):** real date as the ISO ordinal `2026.313`.
13. **Agenda:** next events across days in one list (day tag per row), fit to screen; the 7-day strip is a read-only density ruler.
14. **Brackets:** snap to what you touch (hold bar times "hold for program file"), and stay on the slot you last opened. Lime fills only while pressed.

## Build
Preview `../previews/v4.0.html`. The v4.0 split sources (`base.css`, `overlays.css`, `wide.css`, `shell_*.html`, `core.js`, `bridge.js`, `pal.js` = rooms engine, `planet.js`, `app.js`, `term.js`, `assemble.py`) were delivered as an archive and aren't in the repo yet; `../web/src` holds the v3.0 sources. QA in Playwright at 412×915 and 984×1092, day and night, grid and list, zero console errors, daily-jobs tap check.
