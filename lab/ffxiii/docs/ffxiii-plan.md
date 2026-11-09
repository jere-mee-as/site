# JERE.ING — FFXIII pass: build spec

Status: built as a preview (see `ffxiii-build-notes.md`). Not live.
Reference: a private style book of 22 Final Fantasy XIII images (CG stills plus the main menu, party, Crystarium, battle and title screens). It's kept outside the repo; no game assets are used here.
Output: `lab/ffxiii/preview.html`, a standalone preview, and `lab/ffxiii/template.html`, a drop-in replacement for the root `template.html`. The template keeps `<ol id="list"><!-- LIST --></ol>`, so `build.py` is unchanged. It is separate from the Marathon direction; which direction ships is decided later. If FFXIII ships, the current site is archived first.

**Rule: the site exists to serve the FFXIII look. If something doesn't look or move like FFXIII, cut it. The UI should be radical.**

## Cuts
Remove these:
- The Song, Image, Babel, Color and Culture modules
- The CLI terminal and the boot log
- The telemetry rail, dot-matrix text, barcode and glitch scramble
- The Archivo, JetBrains Mono and Doto fonts

The Song playlist toy could come back later as its own "world". It is out of scope for this pass.

## Screens
The site is a full-viewport game screen with no document scroll. Four screens plus a Settings overlay:
- **Title**
- **Crystarium** (home and showpiece)
- **Datalog** (the readable list)
- **Report viewer**

Routing uses hashes: `#crystarium`, `#datalog`, `#report-07`. Each user action calls pushState. `popstate` runs the normal transitions.

### 0. Title
- Pearl field (dark world: night blue) with drifting cloud wisps and slow motes. Cinematic letterbox bars retract on Begin.
- Wordmark in Instrument Serif caps, tracked .04em, near-black, with a thin teal rule underneath that extends past the left edge. A small Saira micro-caps sub-line sits below.
- Sigil: an original SVG. A tall faceted crystal shard wrapped by 2–3 iridescent brush ribbons (teal → ice → violet → gold). feTurbulence + feDisplacement for watercolor edges, plus a slow hue breathe. No figure and no winged circle, so it can't read as the game's emblem.
- Menu bottom-left: **Begin / Continue / Settings**.
  - Each item has an underline rule that fades out to the right, and a pointer hand marks the active item.
  - Continue opens the newest report directly.
- Tiny serif-caps copyright line at the bottom.
- Begin is the user gesture that unlocks the AudioContext.
- Returning visitors (localStorage) skip the title: a 600ms bloom straight into Crystarium. Title can be reached from the menu or with Esc.

### Global chrome (every screen except Title)
- **HELP strip** at the top, about 44px:
  - Left: a slanted lozenge glyph tag "HELP", then one context sentence that updates on hover and focus.
  - Right: session playtime `⏱ 000:12:34` and `◇ 10 REPORTS`.
  - Under it: a double rule with the screen name right-aligned, sitting on the rule.
- **Main menu** on the left: Crystarium, Datalog, Settings, Title.
  - Mixed case. Each item sits on a bar that fades to transparent toward the right, with hairline separators.
  - A "!" badge on Datalog for unseen reports.
  - A pointer hand springs to the hovered or focused item.
  - On Crystarium the menu collapses into a role-line, `☞ Archive   Lv. N`, where N is the number of stages. Clicking it opens the menu, and so does [Esc].
- **Info bar** at the bottom: a double-height translucent band of micro-labels over values.
  - Crystarium: STAGE (month) / CRYSTAL (title) / LOGGED (date) / INDEX (07/10).
  - Datalog: ENTRIES / NEWEST / SINCE.
- **Hint row** under the info bar, using keycaps we draw ourselves: `←→ Move · Enter Open · Z Toggle zoom · Tab Datalog · W World · M Sound`. On touch devices it shows tap and swipe glyphs instead.

### 1. Crystarium (home)
- A full-bleed 2D canvas with its own 3D projection (no WebGL). Camera tilted about 55°. Layout is a helix: each month is one ring ("stage"). Reports sit along the ring in date order, rings stack upward, the newest report is at the frontier.
- **Path:** one line through every node. Lit segments glow (ice-white core plus coloured halo); the rest stay faint.
- **Nodes:** crystal orbs drawn as radial-gradient spheres with a specular highlight and additive bloom. Colour comes from the report type.
- **Disc:** under the current stage, an engraved ring with concentric circles and glyph ticks. It rotates slowly and is semi-transparent.
- **Input:** keyboard ←/→ step, ↑/↓ jump a stage; mouse hover selects, click opens, drag orbits, wheel zooms; touch swipe steps, tap selects, tap again opens.
- **Camera and cursor:** a pointer hand is pinned to the selected node. The camera eases to it with critical damping.
- **Labels:** translucent teal chips with thin light borders on the 3–5 nearest nodes. [Z] switches between near view (current stage) and far view (whole helix).
- **Portrait card** on the right, a tall rounded frame with a silver bevel: generated crystal art seeded from a hash of the title, type tag, date, the note clamped to 3 lines, and a segmented ATB-style bar showing the report's position in the archive. On selection change it slides with a glint.
- **Opening a report:** Enter or click on the selected node triggers the SHATTER transition into the viewer.

### 2. Datalog
- Menu on the left, entry list in the middle, entry pane on the right.
- **List:** grouped by month under micro-caps headers. Rows sit on fading bars, carry "!" when unseen, and get the pointer hand on focus.
- **Entry pane:** title in Instrument Serif sentence case, date, note in Saira, a generated art banner, and an **Open** button styled as a glossy blue capsule.
- Rows enter staggered 30ms apart, sliding in from the left with blur going to sharp.
- Every entry is a real `<a href>`. A `<noscript>` fallback shows `#list` styled plainly.

### 3. Report viewer
- After the shatter, a full-viewport iframe of the report, with a slim HELP strip: `Datalog — {title}`, `[Esc] Back`, `Open in new tab ↗`.
- Letterbox bars appear during the transition, then settle into the strip. Back uses a white bloom fade.
- PDFs load in the iframe. Any other file type opens in a new tab.

### Settings overlay
- A centered panel with each value shown as `◂ Pearl ▸`. Options: World (Pearl / Pulse), Sound, Music, Motion (default follows prefers-reduced-motion). All persist in localStorage.

## Worlds
Tokens under `[data-world=pearl]` and `[data-world=pulse]`. Default is **Pearl** regardless of the OS setting.

**Pearl** (light, dawn-lit): field radial gradient #f2f3f1 → #d9d7d5 → #c1bdbb with white cloud wisps; ink #2b2a2e; bars `linear-gradient(90deg, rgba(40,38,36,.80), rgba(40,38,36,.32) 65%, transparent)` with #f4f6f8 text; warm glow, rose #f2c9c0 and gold bloom.

**Pulse** (night): field #101419 → #212c39 with mist #4e5760; bars rgba(8,10,14,.70) with a 1px top highlight rgba(255,255,255,.12); text #eef3f8, dim #8d99a6; glows jade #7dffb0, ice, violet.

**Shared accents:** ice #8fe6f0, crystal #3f8ab8, gold #f2cf63 → #b8862b, violet #a98bd6, jade #6fd99a, rose #f2c9c0.

**Type colours:** connectome = violet, field report = jade, weak ties = rose, scope = gold, everything else = ice.

**Contrast:** all text ≥ 4.5:1 against its actual surface. Light ink only ever goes on dark bars.

## Type (Google Fonts: Saira ital/wdth 50..125/wght 100..900 + Instrument Serif)
| Role | Spec |
|---|---|
| Wordmark | Instrument Serif caps |
| Datalog titles | Instrument Serif, sentence case |
| Menu items | Saira wdth 112, wght 500, 18–20px, mixed case, text-shadow 0 1px 2px rgba(0,0,0,.45) |
| Micro-labels | Saira wdth 125, wght 700, 9–10px, caps, tracking .14em |
| Info-bar values | Saira wdth 112, wght 500, 16px |
| Callouts | Saira wdth 125, wght 800, italic caps, 28–40px, chrome gradient fill with a dark 1px outline |
| Numbers | Saira wdth 125, wght 700, tabular-nums; big ones italic gold gradient (#fff6cc → #f2cf63 → #b8862b) with a dark outline |

No monospace anywhere.

## Motion
Eased, glossy and layered: the opposite of the Marathon direction's hard cuts.
- Easing: out `cubic-bezier(.16,1,.3,1)`, in-out `cubic-bezier(.65,0,.35,1)`, pointer and camera on a critically damped spring, overshoot only on number pops.
- Transitions:
  1. **Title → app:** letterbox bars retract (500ms), radial white bloom (300ms), menu bars sweep in 40ms apart (blur 6px → 0), info bar slides up.
  2. **View switch:** an italic chrome-caps callout on a dark slanted bar with 8–12 speed lines; old view blurs out (200ms), new view un-blurs in (300ms); about 550ms total.
  3. **SHATTER (opening a report only):** chrome fades out (100ms); the Crystarium canvas is frozen with toDataURL; ~28 triangle shards from a random triangulation fly outward and toward the camera (scale 1 → 1.6, random rotate3d, opacity → 0) over 650ms, staggered by distance from the click, with a glint at the origin. From Datalog the shards use the world gradient.
  4. **Hover and focus:** specular sheen across the bar (450ms), pointer springs, cursor tick.
  5. **Crystarium selection:** camera ease (450ms), card slide with glint, chips fade.
  6. **Numbers:** count up over 600ms with a pop from 1.25 to 1.
  7. **World switch:** circular clip-path reveal from the pointer, 700ms.
  8. **Ambient:** cloud layers on 60–120s loops, 40–80 bokeh motes, an anamorphic flare about every 25s, light rays from the top-left.
  9. **Reduced motion:** shatter becomes a 200ms crossfade; no speed lines, flares or drift; camera moves become cuts with a 150ms fade.

## Sound (Web Audio, synthesized, original)
Master gain about 0.1 into a compressor; reverb is a ConvolverNode with a generated impulse response.

| Event | Recipe |
|---|---|
| Cursor | Sine 2350Hz + 4700Hz partial at 0.3, 2ms attack, 60ms decay, ±3% pitch, max one per 45ms |
| Confirm | Bell notes E6 then B6, 70ms apart; sine plus inharmonic partials (×2.76, ×5.4), 600ms decay, into the reverb |
| Back | B5 then E5, softer |
| View switch | Noise through a bandpass sweeping 400 → 3000Hz over 350ms, plus a 70Hz thump (120ms) |
| Shatter | Noise burst high-passed at 3kHz (80ms) plus 8–12 random pings 3–8kHz over 400ms, randomly panned |
| World switch | Rising shimmer cluster plus a swell |
| Count tick | Quiet 3kHz click, at most 12 |
| Disabled | Muted 220Hz tick |

**Ambient pad** (quiet, gain about 0.04): four sine/triangle voices alternating Emaj9 and C#m9 every 16s, 4s attack, lowpass 1.8kHz, slow detune LFO, into the reverb. Plays on Title, Crystarium and Datalog; ducks out when a report opens.

Sound and Music on by default; Begin unlocks audio; [M] toggles all sound; a speaker glyph with 3 reactive bars in the header.

## Responsive
- ≥ 1100px: the layouts above.
- 700–1100px: smaller portrait card, narrow menu column.
- < 700px: full-screen Crystarium with a bottom-sheet card; bottom tab strip (Crystarium · Datalog · Settings); one-line HELP strip; no hint row; Datalog list full width with the entry pane as a sheet.
- Everywhere: 16px gutters, no horizontal scroll.

## Data
- `<ol id="list" hidden><!-- LIST --></ol>` stays the data source; `build.py` emits `<li><a href>title</a><span class="note">…</span><time datetime>…</time></li>`, newest first.
- Report type comes from keywords in the title or href. A "seen" set in localStorage drives the "!" badges.

## Guardrails
- None of these: the game's logo or emblem, character art, screenshots or game audio. The pointer hand, keycaps, sigil and ring glyphs are all drawn for this project.
- `build.py`, `reports/` and the deploy are untouched by this pass.
