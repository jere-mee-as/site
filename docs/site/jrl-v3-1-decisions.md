# JERE.ING v3: decisions from the grilling (Nov 7, 2026)

These override jrl-site-restyle-plan.md where they conflict. Shipped as PR #1 ("v3: the terminal of the future"), merged to main Nov 7. See **Status** at the bottom.

## v3.1
- **Navigation:** no rail. The top strip has six codes (01 REP … 06 CUL); Q/E cycles, 1–6 jumps, Tab opens a full-screen index of six cards.
- **Chrome:** the section owns the screen. Only a top strip and a lime bottom strip. The feed (F) and the terminal (/ or click the prompt) slide in.
- **The terminal is the navigation:** every click types its command into the bottom-strip prompt and the terminal history (`go song`, `open 07`, `index`, `feed`, `mute`, `pull`, `back`).
- **Two transition tiers:**
  - Big moves (entering Color or Culture, opening a report, boot) get the full flash-card burst, or the white/accent panel flip in the white register.
  - Everything else is a hard cut with one inverted frame (33ms).
- **Decode scramble:** only in the terminal, the boot log and Babel.
- **Boot:**
  - First-ever visit: the full log with typed `enter`.
  - Later sessions: blocks → wordmark → straight in (about 1.6s).
  - `reboot` replays the full boot.
- **Idle palette cycle:** only on Color and Culture, after 25s.
- **Register follows content (no toggle):** Reports and Babel are white; Song, Color and Culture are dark; Image alternates daily.
- **Colors:** six module identities. Reports pink, Song orange, Image bone, Babel lavender, Color lime, Culture teal.
- **Labels:** the code line and the giant watermark were removed. Each section is a tag, one huge word and a slogan.
- **Sound:** only actions make sound; hovering is silent.
- **Fiction:** in-world system copy (boot, strips, terminal, "EXT // 08" on reports); section names stay plain.
- **Report viewer:** each open creates a fresh iframe so Back closes the viewer instead of stepping through the frame.

## v3.2–v3.4
- The old invert sweep is back: `root` plays it.
- `wipe` plays the invert sweep on any page. It closes the terminal during the sweep and reopens it afterward.
- The boot carrier tone stops itself after 2s and can never hang.
- The clicky text sound plays only while text is actually changing.

## v3.5: the stage
- 12-column stage: the hero (8fr) beside a live instrument column (4fr), max-width 1560px.
- Rulers, coordinate tags and a grid-snapped reticle.
- Background bursts: 3 frames, then a hold.

## v3.6: alive
- **Colony:** a 32×18 Life-like organism in the instrument column.
  - Steps once per background burst, mutates, blooms when thin and molts when crowded.
  - Fed by visits (10+ minutes apart) and clicks. Hunger thins it; it dies after 30 days unfed, and the lost count goes up.
  - Day 001 is 2026-11-07, Eastern Time. Dormant from 00:00 to 06:00 ET; dozes after 2 minutes idle and wakes on input; escapes every 3–6 minutes.
- **Life support FULL/LOW:** drops to LOW automatically on reduced motion, ≤4 cores, ≤4GB memory, data saver or battery under 20%. Toggle with the chip or `life low|full`.
- **Colony sounds:** feed, molt, die, skitter, wake, doze. Two new voices, `beep` and `note`, support morse and synth.
- **Root toys:**
  - Readouts: top/ps/kill, scan, ping, weather (real moon phase), decrypt.
  - Toys: roll, 8ball, colonysay, launch/sl, rain.
  - Sound: morse, synth. Game: snake.
  - Secrets: `ls -a` dotfiles, ily, hello, xyzzy, `make me a sandwich`, `colony show`.
  - `achievements` (28 to find), did-you-mean on typos.
  - Fixes: queued commands no longer stall; a keypress no longer skips every later animation.

## Status
- Shipped to main on Nov 7. Hosting moved to Cloudflare Pages (jere.ing) in Nov 2026.

Next: Scope page (reports/scope.html) restyle.
