# JERE.ING — Marathon restyle pass: build plan

Status: planning (do not build until Jeremias says go). Site: jere.ing, repo jere-mee-as/site, all UI in `template.html` (+ `build.py`, built by Cloudflare Pages on push).
References: a private style book (80 images) and 5 reference videos, kept outside the repo.
Sample pages: `lab/marathon/type-specimen.html` · `lab/marathon/color-map.html`

**Guiding question for every change: does it move the way the reference moves and look the way the reference looks?** Jeremias's brief: dramatic changes to how the site works are welcome.

## Decisions made (Nov 7)
- Type system A + Hubot Sans display (locked, see §2).
- WHITE mode replaces GREY.
- Sound on by default, with an on-style mute control.
- Back button walks back through sections.
- Old site archived inside the repo (see §10).
- Scope page restyle: NEXT pass, not this one. Remind Jeremias when this pass ships.

## 0. Archive first
- Before touching anything: tag the current commit `v2-graphic-realism`.
- Copy the built site to `/archive/2026-11-graphic-realism/`. Rewrite relative data paths (images.json, songs, tarot) to `../../`. Freeze its data so the nightly build doesn't touch it.
- Also restore the original paper-and-ink design from git history to `/archive/2026-10-paper-and-ink/`.
- Link both from the terminal (`ls /archive`, `open archive/...`) and from a small footer line.

## 1. Motion (highest priority)
Measured from the videos:
- UI reel boot: black, then lime pixel-block fragments flash in bursts: 3 new frames at 33ms each, then a ~170ms hold, repeated about 4 times, then the wordmark resolves out of the blocks.
- Shot-to-shot transition (UI reel 6.8–8.1s): about 270ms of full-frame graphic cards, each held 1–4 frames at 60fps (17–67ms): blue code-UI card → violet → pink/orange dither → red dither → hard cut. No wipes, fades or easing.
- Alpha/Story intros: changes every frame at 30fps inside bursts, otherwise 2–3s holds. Faction intros: calm, 2.5–3s holds, white field + one accent, giant type cropped off the edge, split panels that flip white ↔ accent.

Rules:
- Time base is 30fps. CSS `steps()` durations are multiples of 33ms; JS animations step on a shared 30fps tick.
- Remove: the springy overshoot curve `cubic-bezier(.3,1.35,.5,1)`, 1.5s background crossfades, 0.5–0.9s opacity fades, the CRT scanline transition, directional clip-path wipes.
- Module switch (dark mode): flash-card burst of 5–7 cards built from the source and destination palettes (code-UI slab, dither field, block mosaic, then destination field + giant cropped title held 2 frames), then hard cut. About 270ms.
- Module switch (WHITE mode): panel inversion flip (white ↔ accent, 2–3 frames), then cut.
- Boot: black + lime block bursts → JERE.ING resolves from blocks → existing boot log, restyled.
- Inside modules: images and panels arrive by block resolve (6 steps); titles cut in; list rows appear one per tick.
- Hover: instant invert (0ms) plus micro tick sound. No eased lifts or shadows.
- Idle 20s: the field steps through nearby hues, with holds. Ink re-picks black or white by contrast at each step.
- Safety (WCAG 2.3.1): at most 3 big brightness jumps per burst, no full-frame red alternating with black, and `prefers-reduced-motion` gets a single hard cut.

## 2. Type (LOCKED)
- Display: **Hubot Sans** (Google Fonts, OFL).
  - Wordmark: 500 weight / 75% width. Jeremias picked "400" on the sample page, where the wordmark drew 100 heavier than the slider, so 500 is what he saw. Confirm with him.
  - Module titles: 300 / 88%, sentence case, tracking -0.03em.
  - Slogans: 200 / 100%, tracking -0.035em. Use only at 24px and up; below about 20px floor it at 300.
  - Card titles: same as module titles.
- Archivo 125% / 900: only for giant words cropped off the edge. Use sparingly, at most one per screen.
- Codes, tags, big numbers: Kode Mono 700.
- Interface and terminal: JetBrains Mono 400/600; vertical labels at 200.
- Clock and dot effects: Doto.
- Rare accent lines: EB Garamond italic. This is the Babel librarian's voice.

## 3. Color (distribution, contrast-checked)
Palette: black #0a0a0b, white #f2f2ee, fog #f1f0f0 (panel #e1dfe0), lime #c2ff16, blue #0400f5, orange #ef4606, pink #e0216f, bone #c7c2b6, teal #2ddccd, lavender #8476bf (+ mint-grey #cce4dc), red #e9042b (alarm), yellow #eae00b (warning).

Rules:
1. The system layer (header, nav, terminal, feed, boot, sound chip) never takes a module color. Dark mode: black/white/lime. White mode: fog/black, with lime only as a solid strip with black text.
2. Each module = one field + one ink + at most one accent. No tints of the field. Two hues on screen at most, plus the system layer.
3. Small text only on black, white or fog. Measured: red 4.1/4.3, pink 4.1/4.4, orange 3.4/5.2 (white/black), lavender 3.5/5.0. So red, pink and lavender never carry small text; orange takes black ink only. Blue takes white ink only (8.1; black is 2.2).
4. Red = errors only. Yellow + black = warnings / hazard stripes. Neither is a module color.
5. Lime and yellow are about 1:1 on fog, so in WHITE mode they're fills only.
6. Extra hues only in transitions and the idle cycle.

Module map (field / ink / accent):
| Module | Dark | White |
|---|---|---|
| Reports | blue / white / lime | fog / black / pink |
| Song | orange / black / blue | fog / black / orange |
| Image | bone / black / orange | fog / black / bone |
| Babel | pink / white large type, text on black slabs / lime | fog / black / lavender (+ mint) |
| Color | black chrome / generator | fog chrome / generator |
| Culture | black / white / teal point cloud | fog / black / blue dots |
| System | black / white / lime, red errors, yellow hazard | fog / black, terminal stays a black slab |

Watch items from the color map: keep Culture dots clear of the title area; check Babel's white title (4.1 large-pass) at real size.

## 4. Interaction redesign (consistency pass)
Site-wide:
- **One navigation for every module.** Replace the per-module nav shapes (sidebar tiles / top strip / right rail) with one fixed index: a left rail on desktop and a bottom bar on phones, 6 entries "01 REPORTS … 06 CULTURE" with Kode Mono numbers, dot icons and live counts, in the same place everywhere. The reference keeps one stable frame, and it makes Back predictable.
- Keyboard: 1–6 jump to modules, M mute, W white/dark, / or ` focuses the terminal, Esc closes overlays. All module jumps go through the same transition + history.
- Header: wordmark, node, report count, Doto clock, SND chip, WHITE chip.
- Telemetry + event feed: a collapsible FEED slab in system colors. Kode Mono timestamps; errors appear in red; every module switch, pull, shelve and play is logged.
- Focus: 2px lime (dark) / black (white) ring, offset 2px. Crosshair cursor over the canvases (Culture, Color).
- External links get a ↗ code chip; no confirmation dialogs.
- **Reports open inside the site** in a full-frame viewer with a slim system header (number, title, close). Same transition; Back returns to the list; URL #report-08. (Jeremias can veto; Scope stays standalone until its own pass.)

Per feature:
- Boot: block-burst intro, then the log restyled ([ ok ] lines in system colors), typed `enter` (also unlocks sound). Esc or a "skip" chip skips.
- Terminal (help, ls, open, play, pause, pull, wall, unwall, cats, sub, mode, panel, view, clear, date, whoami, sudo, history, echo, id, uname, uptime, pwd, banner, skull, fortune, cat, go, exit, song, babel, tarot, chaos, invert, color, reboot, ~ root, neofetch):
  - Keep all of them. Always a black slab, [ ok ]/[FAIL] prefixes.
  - Errors trigger the ERROR band + buzz.
  - `chaos` = flash-card burst + idle cycle (reduced-motion safe). `invert` = WHITE/dark. `reboot` replays the block boot.
  - New commands: `mute`, `sfx on|off`, `back`, `ls /archive`, `open archive/…`.
  - neofetch lists the new fonts.
- Reports: cards view = product grid (each card one flat fill from the module set, big Kode Mono number, Hubot title); list view rows appear on ticks. Instant invert on hover. NEW chip in Kode Mono.
- Song: the record gets a HUD ring with a Kode Mono timecode. Keep the round-pixel EQ (Jeremias asked for it; it matches Doto) but step it at 30fps. Sound effects mute while the song plays.
- Image: Are.na image in duotone + halftone (SVG filters/CSS masks for cross-origin), block-resolve on load, original on hover. Tarot card as a cut-corner slab with its code, same treatment. Cat easter egg stays hidden, plus an 8-bit chirp.
- Babel: decode steps on the 30fps tick with a tick-roll sound. Addresses in Kode Mono. Shelved phrase shown in a repeating word band with the phrase highlighted. The librarian speaks in EB Garamond italic.
- Color generator: see §8.
- Culture: modes and controls stay. Teal point cloud on black / blue on fog. Palettes 1/6 drawn from the module set. "type" mode in Hubot. Pulse ping sound. Controls as cut-corner chips.
- Controls everywhere: one chip component (cut corner, Kode Mono 700 label, instant invert when active), one segmented-control component.

## 5. Graphics
Solid panels with cut corners; "+" registration crosses instead of the dot grid; hazard stripes for warnings; small clusters of made-up symbols; a lime slate strip at the bottom of each module ("JRL |||||| × 2026 ≡ JERE.ING", no Bungie/Marathon marks); ERROR_/WARNING_ scrolling band; repeating word bands; HUD rings.

## 6. Images
Two-color tint plus a pixel grid via SVG filters and CSS masks (works on cross-origin images). Block resolve on load; original on hover.

## 7. Sound (Web Audio, synthesized, no files)
Vocabulary (from the UI reel spectrogram): short full-band static bursts, sub thumps under 100Hz on cuts, about 1s low swells, a faint high carrier tone during boot only. No melodies.
- Boot crackles + a swell when the wordmark resolves.
- Module switch: a crackle per card + a sub thump on the final cut.
- Hover: micro tick. Click: thump-click. Back: lower.
- Error: static + low buzz. Babel: tick roll + lock click. Culture: ping, pitch from height. Color lock: shutter click. Cat: chirp.
- On by default; starts at the boot `enter` (browsers need a first gesture).
- SND chip with a 5-bar dot meter that reacts to the sounds; muted shows a flat line. M key, `mute` command, localStorage. Auto-mutes while the song plays.

## 8. Back button
On every user-initiated module change (nav, keys, terminal, report viewer): `pushState`. On first load: `replaceState`. Skip duplicates. On `popstate`: switch with the normal transition and sound. Back from the first section leaves the site.

## 9. Color generator
- Lighten:
  - Its own file, loaded on first visit to Color (or when wallpaper mode is saved on).
  - Render at 1/6–1/8 resolution and let the browser upscale; remove the CSS blur filter.
  - 30fps cap. Pause when the tab is hidden or the module isn't visible.
  - Measure before and after.
- On-style:
  - DITHER mode (ordered dither into 2–4 palette colors, chunky square pixels).
  - Palette readout as cut-corner chips with codes (C-01 #EF4606), click to copy.
  - Drifting "+" sample markers labeled with the color under them.
  - Optional burst palette change.
  - Poster snapshot PNG.

## 10. Build order (one session)
1. Archive + tag.
2. Tokens (palette, type, 30fps timing, motion primitives, chip component).
3. Type.
4. Color + WHITE mode.
5. Navigation rail + keyboard + history.
6. Graphics.
7. Images.
8. Motion (transitions, boot, idle, reduced motion).
9. Sound + SND chip.
10. Per-feature pass (§4).
11. Report viewer.
12. Color generator.
13. QA: every module at 1440×900 and 390px, both modes, reduced motion, sound on/off, back/forward, keyboard, archive links. Then push.

Model: Opus at high effort (or above) for the build; medium for follow-up tweaks.

## Next pass
- Scope page (reports/scope.html) restyle in the same system.
