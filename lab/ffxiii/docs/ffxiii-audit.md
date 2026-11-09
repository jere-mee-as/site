# JERE.ING FFXIII v2 preview: style audit (Nov 8, 2026)

The full illustrated audit is `../audit.html` (its "now" screenshots are of our own v2 preview). It compared `../preview-v2.html` against a private reference set (28 stills + 5 clips at 1080p60). Builds on `ffxiii-footage-notes.md` and `ffxiii-build-notes.md`. Section 4 of the audit page has a live canvas Crystarium built to the clip-29 spec.

## Keep
Title sequence, cursor 117 ms glide, cloud drift speed, grey→colour party cards, hex bokeh on events only, 730 ms title→app, 600 ms desaturate on close, acquisition white cut.

## Chrome geometry (1920×1080 frames; use site-wide)
- Pale sky band = top 11% of height; double rule at 11%. HELP glyph from 10% of width, text 30 px.
- Screen name bold + underlined, right edge at 30% width, on a white rule at ~15% height.
- Left panel dark bars 0–30% width, rows 43 px, names from 10.6%, "Lv." column at 26%.
- Info band 82.7–88% of height; micro labels at 10%, 30%, 62.5% of width.
- Prompts on the pale band below, dark text, right edge 92.5%. No playtime on the Crystarium.
- Portrait card 75–89% width, 14–81% height, 2 px light border, 12 px radius.
- Notice box 35–65% width, 28–36% height, slate gradient, 2 px light border.

## Crystarium spec (clip 29)
- Field: mid grey-violet marble with fine white scratches, white-hot bloom ~1/3 screen wide behind the current stage, purple-grey vignette, darker strip under the top rule. Not dark.
- Stages: one closed loop of thick glassy teal ribbon per stage (bright outer edge, darker inner); acquired arcs bright, rest faint. Thin dark spokes with a gold glint from nodes to a rough violet-white stage crystal on an engraved dish (glowing outer band with inward spikes + key glyphs, gear-toothed dish, hex plates outside). All stages hang on one dark thread crossing the screen.
- Nodes: acquired = small glowing spheres in their colour; unacquired = dark metal. Slate chips on selected + two neighbours. Hand points from the left. White chevrons on the ribbon show possible moves.
- Overview (Toggle zoom): camera down the thread, nodes become coloured ring icons, tunnel around the bloom, slow drift. Left panel = role list with Lv. + "{Role} Crystals" table under a rule.
- Timings: enter = cards out → cloud → crystal condenses 750–1250 ms → hold → role list snaps ~1.95 s → pull-out to overview under white flash ~450 ms. Choose role = list collapses instantly, ~900 ms swoop in. Next node = ~600 ms camera glide. Toggle zoom = ~250 ms under a flash. Acquire = node bloom + violet hexes + notice (~100 ms in / ~0.9 s hold / ~100 ms out).
- Mapping: roles → report types (Lv = count); stages → months (6 slots, future dark); nodes → reports; stage crystal → month; HP/CP → No./Stage; Strength/Magic → Logged/Type; ATB LEVEL → Archive level; CP COST → Index; "Advance crystogenesis" → Enter: Read report; first read = acquisition with "Crystal acquired: …!".
- Proposed: overview is the Crystarium's landing view (returning visitors may skip to the newest stage). Drop the helix, beam, blue capsule and main menu on this screen.

## Other measurements (clips 30–33)
| Moment | Game |
|---|---|
| Party → Datalog | Cards fly off up-right, rightmost first, ~35 ms apart, gone by ~300 ms. Menu column hard-cuts to the Datalog list at ~200 ms. Cloud only 300–700 ms. Backdrop fades in 700–1000 ms. |
| Datalog → Party | Backdrop drops to cloud; cards fly back in from upper right, ~300 ms. |
| Datalog backdrop change | ~480 ms dissolve (preview: 333 ms). |
| Datalog back-out | ~100 ms out to the right, ~100 ms parent in from the left. |
| Crystarium → Party | Cards fade in place, grey→colour, ~300 ms. |
| Shop list | Panel wipes in left→right ~200 ms. |
| Field notice ("You obtain…") | <100 ms in, ~2.4 s hold, ~100 ms out. |

## Change list (build order)
1. P1 Silver rows (light top, dark mid band, white outlined text, black slanted caps; empty rows drawn) for Datalog, Settings, sub-lists. Main menu keeps dark fading bars.
2. P1 Selection = hand only. Remove teal fill, ice stripe, sheen, card glint, selected-card glow ring.
3. P1 Footer: pale sky-blue glass band, ⏱ + ◇ left, dark keycaps right. Dark info band on Party + Crystarium only. Apply the chrome geometry above.
4. P1 Fog layer under the chrome; card fly-off + crystal condense + pull-out into the Crystarium; in-place crossfade out.
5. P1 Party ↔ Datalog: fly-off, hard cut at 200 ms, backdrop after cloud beat.
6. P1 Datalog two columns: months left (chapter list), entries right with LOG ENTRY strip; Enter opens dark entry band. Drop glass card, serif title, blue capsule.
7. P1 Crystarium rebuild to the clip 29 spec above.
8. P2 Type: serif only on wordmark; outlined white menu text; outlined italic numerals; dark keycaps; italic HELP glyph on underline.
9. P2 Backdrop dissolve 480 ms; 100 ms horizontal back-outs.
10. P2 Notice box for new reports / acquired crystals.
11. P2 Acquisition: 6 px beam, node bloom, camera snap on close.
12. P2 Bug: stale HELP line after quiet selections.
13. P3 Sigil: thinner ribbons, hairlines, more transparent shard.
14. P3 Report cover images from build.py for Datalog backdrops; loading capsule for slow reports.

## Bugs found in v2 (fixed in v3)
- `#fog` z-index 35 > `#app` 10, so the chrome disappeared in every cloud pass.
- After closing a report in the Crystarium, `CX.dist` was left at the rush zoom and eased out for ~1 s. Snapped in `closeViewer()`.
- `partySelect(…,{quiet:true})` skipped `help()`, so HELP could describe a different card than the selected one.
