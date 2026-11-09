# JRL Launcher — handoff brief (OLD: superseded by jrl-launcher-v2-handoff.md and jrl-launcher-v2-plan.md)

Goal: an Android home-screen launcher in the same Marathon "graphic realism" style as jere.ing (github.com/jere-mee-as/site, live on GitHub Pages). The website's `template.html` in that repo is the full reference implementation of every effect below; reuse its code.

## Recommended build approach
- Thin native Kotlin app registered as a HOME launcher (intent filter `MAIN` + `HOME` + `DEFAULT`), hosting a full-screen WebView that runs a launcher version of the site.
- A JavaScript bridge exposes phone features: list installed apps (label, package, icon as PNG data), launch an app, open app settings, time, battery, notifications count if permitted, wallpaper/back handling.
- No Android SDK in the Claude workspace: build the APK with a GitHub Actions workflow in a repo, download the artifact, sideload (allow installs from unknown sources once).
- Keep it light: pause animations when the launcher isn't visible; only run canvas loops on the active screen.

## Launcher ideas from the chat
- Home: full-bleed module color field, giant vertical breathing word, dot-matrix clock (Doto), swipe between "modules" using the random glitch transitions.
- App drawer: square cards (like the report cards), round/square pixel icons or the app icon, labels that decode out of symbols.
- Search = the terminal: `open spotify`, `ls` lists apps, `~` for root mode, ASCII "JERE" (thin box-line style), `11011998` birthday egg.
- Background: the Culture dot field, reacting to touch.

## Design system (what Jeremias liked)
- Fonts: Archivo (variable, wide at font-stretch 125%) for display; JetBrains Mono for UI; Doto for numbers. He tried Anybody / Martian Mono / Michroma and rejected them — keep the originals.
- Color fields per section, full-bleed, slowly drifting hue; each section has a complementary hover/selection highlight (not always pink). Palettes: blue + lime, orange + dark green/white, acid yellow + red, pink + mint (with small white and lime touches only; he disliked adding many colors), deep green + mint, mint + cobalt/pink.
- Round-pixel and square-pixel dot-matrix symbols everywhere (9x9 icons mixing both), equalizer made of round pixels.
- Breathing type must be stepped/pixelated (steps()), not smooth.
- Text decodes out of shifting symbols, slowly; one or two characters keep changing slowly afterward. Text should decode after a transition clears so it's visible.
- Transitions: glitchy and blocky, never cute (no flips/bounces/drops). Random pool: glitch (weighted), bands, scatter, rain, checker, construct (blocks rebuilt one by one with labels and scanlines), round-pixel ripple (the one soft one he loves). Not too fast.
- No drop shadows or pop-out hovers; hover = color change only.
- Layout should breathe: no hatched gutters between blocks, collapsible side panels, narrower blocks/squares rather than long rows, varied alignment (not everything left-aligned).
- Terminal: black, lime text with white/red/cyan accents, scanlines, consistent text size (no giant banners), slow decode, gradient invert sweep instead of white flashes.
- Boot: hacker log with real-ish content, ends with a prompt line ("type 'enter'"; "tap here" on phones; "~" opens the terminal).

## Tone
Direct, adult, no cute copy. Easter eggs are welcome.
