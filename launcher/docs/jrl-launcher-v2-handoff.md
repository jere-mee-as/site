# JRL Launcher v2: handoff (Nov 7, 2026)

> **Update (Nov 7, evening):** the plan below was settled and a v2.0 mockup is built. Read `jrl-launcher-v2-plan.md` first: it has the decisions and the status. The sections below are the original handoff.

Goal: rebuild the Android launcher (JRL Launcher v0.2) so it matches the **v3 site**, "the terminal of the future." Read first: `claude/jrl-launcher-build-notes.md` (how v0.2 works and what Jeremias uses daily), then `claude/jrl-v3-1-decisions.md` (every v3 design decision). `claude/jrl-launcher-brief.md` is the **old** design brief. Its fonts, palettes and transition pool are out of date; this doc overrides it.

## Hosting

Hosting moved to Cloudflare Pages (jere.ing) in Nov 2026; code lives in jere-mee-as/site.

## Where the v3 source is

- `template.html` on `main` in `jere-mee-as/site` is the full built site, about 270KB, one file. It was merged before the suspension. The modular build sources (a.js, b.js, c.js, fun.js, shell.html, assemble.py) lived only in the old chat's scratch space and are gone. **Work from template.html.**

## v3 design system (replaces the old brief)

- **Fonts:**
  - Hubot Sans: wordmark 500 at 75% width, titles 300 at 88%, slogans 200
  - Kode Mono for codes and numbers, JetBrains Mono for the interface, Doto for the clock
  - EB Garamond italic for the librarian voice
  - Archivo 125%/900 only for rare, giant, cropped words
- **Palette:**
  - Black #0a0a0b, white #f2f2ee, fog #f1f0f0
  - Lime #c2ff16, blue #0400f5, orange #ef4606, pink #e0216f, bone #c7c2b6, teal #2ddccd, lavender #8476bf
  - Red #e9042b for errors, yellow #eae00b for warnings
  - Small text only on black, white or fog
- **Module identities:** Reports pink, Song orange, Image bone, Babel lavender, Color lime, Culture teal.
- **Register follows content:** Reports and Babel are white; Song, Color and Culture are dark; Image alternates daily. No mode toggle.
- **Motion:** everything on a 30fps grid.
  - Small moves: a hard cut with one inverted frame.
  - Big moves: a flash-card burst (code card → dither → mosaic → title card) or a panel flip in the white register.
  - Background bursts: 3 frames, then a hold.
  - The invert sweep exists only as `wipe` and `root`.
  - The old random glitch-transition pool is retired.
- **Text scramble:** only in the terminal, the boot log and Babel. Labels elsewhere are plain.
- **Chrome:**
  - A top strip of six codes (01 REP … 06 CUL), Q/E to cycle, 1–6 to jump, Tab for an index of six cards.
  - A lime bottom strip with the prompt; every tap types its command there (`go song`, `open 07`).
  - The feed and the terminal slide in.
- **12-column stage:** a hero area plus a live instrument column with rulers, coordinate tags, a reticle, mutating glyphs and genome hex rows.
- **Sound:**
  - Synthesized with Web Audio, on by default, with a mute chip.
  - Only actions make sound, never hovering.
  - Colony voices: feed, molt, die, skitter, wake, doze. Plus `beep` and `note` for morse and synth.
- **Alive (v3.6):** the colony.
  - A 32×18 Life-like grid in localStorage. It steps per burst, mutates, blooms and molts.
  - Fed by visits and taps; dies after 30 days unfed.
  - Day 001 is 2026-11-07 in Eastern Time. Dormant from 00:00 to 06:00 ET; dozes after 2 minutes idle.
- **Life support FULL/LOW:** LOW is automatic on reduced motion, weak hardware, data saver or battery under 20%, and throttles every animation loop. **On a phone this matters most.** The launcher should feed real battery and charging state from the bridge into it.
- **Root terminal:** about 20 toys (top, scan, ping, weather, decrypt, roll, 8ball, colonysay, launch, rain, morse, synth, snake, achievements with 28 to find) plus "did you mean" on typos.
- **Tone:** direct, in-world system copy, no cute copy. Easter eggs welcome.

## What to keep from launcher v0.2 (his daily needs)

- About 16 pinned apps low near the thumb, folders, recognizable color icons
- Agenda (calendar), now playing with controls
- Swipe up for the drawer; he almost never searches
- The Kotlin shell and `window.JRLAndroid` bridge can probably stay as they are; v2 is mostly a new page.

## Starting points (confirm with him first)

- **Mapping:** home becomes the stage; the hero holds the clock, agenda, now playing and pinned grid; the instrument column becomes a strip with the colony, battery-driven life support and notification counts.
- **Modules:** the six site modules could become launcher "screens" (Q/E becomes swipe), or the launcher could have its own set (Home, Apps, Agenda, Media, Terminal, Colony).
- **Apps typed into the prompt:** `open spotify`. The drawer becomes the Tab index style.
- **The colony on the phone:** fed by unlocks or app launches; it shares a day count with the site.

## Workflow he expects

Plan first, then an HTML mockup, then grill him with a test ("is this the way it would be if the world had this aesthetic?") before any PR. Every preview is a NEW versioned file, never overwritten. Push only after he approves. Also pending after this: the Scope page (reports/scope.html) restyle.
