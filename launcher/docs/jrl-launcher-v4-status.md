# JRL Launcher v4.0 — status (Nov 9, 2026)

Built from `jrl-launcher-v4-plan.md`. The preview is `../previews/v4.0.html`; it is also the page bundled into the Android app (`../android/app/src/main/assets/www/index.html`).

## What's in it
- Rooms engine (`pal.js`): fog Shell, white/pink Apps, bone/orange Agenda, orange/blue Music, lavender Inbox, carbon/teal Colony; carbon everywhere 00–06 ET. `set paint` changes the signal colour only.
- Chrome: carbon system strip (JRL id, room + JP, signal, battery, Doto time or `2026.313` on the Shell, SND chip) replaces Android's bar; arrivals turn it lime for 3s. Prompt bar keeps the A–Z ruler full width; gesture prompts flash 2s on entering a room.
- Shell: Doto 300 clock, one line, carbon panel with the lit dithered planet (`planet.js`: real time-of-day terminator, city lights in the signal colour, real moon phase) beside the four readouts, 16 white slot cards with colour edge, category glyph, code, unread count. Brackets stay on the last opened slot; the hold bar times the program file.
- Icons (`glyphs.js`): 33 hand-drawn 9×9 category pictograms matched by package/label; `set icons glyph|app|pixel|code`.
- Apps: stash of up to 11 apps by use (1 big, 2 mid, 8 small; falls back to loadout order), then A–Z table in pages (tabs, swipe, arrows). Rows arrive one per tick.
- Agenda: next events across days, fit to screen, "+N more · open calendar"; week strip read-only.
- Nothing scrolls in any room (checked).

## QA (sandbox, Playwright)
412×915 and 984×1092, at 02:00, 09:15, 14:30, 19:30; Paint rose; icons app/code; slots list. Zero page errors (Google Fonts can't load in the sandbox, so fallbacks rendered). Daily jobs: slot tap launches, slide-and-release on S launches, swipe up → Apps, swipe sideways pages, swipe down → Shell, play/pause from the readout, kit opens, brackets return to last slot.

## Open
- Doto 300 clock legibility in sunlight (a `set clock` option if weak).
- Unfolded Shell has a large planet panel; may want the loadout wider there.
- Apps 2-column index splits a letter across columns without repeating the header.
- Native side: see `../android/README.md` (bridge gaps and Kotlin to-dos).
