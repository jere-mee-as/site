# JRL Launcher v3.0 vs Uplink: style audit (Nov 8, 2026)

Compared the launcher v3.0 preview (`../previews/v3.0.html`) with the Uplink site (`../../lab/uplink/index.html`) and its style book (`../../lab/uplink/stylebook.html`: ten laws, palette proportions, rooms). Rendered both in Playwright at 412×915 and 984×1092 (launcher) / 1600×900 and 720×1280 handheld (Uplink). No console errors in either.

## Already aligned (keep)
- Token palette, the locked type set (Hubot Sans, Kode Mono, JetBrains Mono, Doto, Archivo giant, EB Garamond).
- 30fps grid, hard cuts, stepped grow, launch burst, haptic waveform.
- Cut-corner panels, rulers, coordinate tags, reticle.
- Options as commands (`set`), no settings screen.
- Signal view: dithered duotone art in a tick ring is the closest thing to Uplink in the launcher.

## Gaps, by law
| # | Law | Launcher today | To match Uplink |
|---|---|---|---|
| 1 | L-08 Color by place, no theme switch | 17 palettes, radical/utility, register toggle. Console field is blue, which Uplink reserves for burst cards and alerts. | Fog shell; one hue per room, only inside that room. Palettes collapse into Paint colorways that recolor the signal (selection) colour only. |
| 2 | Palette proportion (fog 40 / carbon 22 / bulkhead 14 / white 8 / lime 6 / hues 1.5 each) | Hue fields fill 70–90% of the screen; lime on tags, unread edges, EQ, colony, comms bars, play key, strip. | Lime marks the selected thing and the prompt only. Unread = a pink/teal edge band, colony cells in teal, bars in ink. |
| 3 | L-03 Gear, not menus | 16 small tiles with grey monogram squircles under a giant clock; 2025 home-screen grid. | Slots as Uplink cards: number, JP co-label, Hubot 300 name, Kode count line, invented pictogram, coloured edge swatch. Fewer, bigger, named. |
| 4 | L-10 One object | Console has none (colony wallpaper is flat). Bio, Schedule, Comms none. | One lit/dithered or wireframe object per view. |
| 5 | L-01 No scroll / L-02 compose | Manifest, Schedule, Bio scroll. | Paged by letter (scrub strip), day tabs that cut the list, Bio composed to fit. |
| 6 | Tag + huge word + slogan | Views open on a lime chip tag; no title, no slogan. | `SLOT 02 通信` tag, Hubot 300 room word, Hubot 200 slogan, one cropped Archivo giant per view. |
| 7 | L-04 Focus brackets | Press-invert only; no persistent selection. | Corner brackets snap to the selected slot/row; the hold bar under the brackets is the "hold for program file" timer. |
| 8 | Chrome | One lime strip at the bottom carries terminal, scrub, status. | Black system strip on top (id block, breadcrumb + JP, Doto clock, date, SND meter), black prompt bar at bottom, lime status line only for messages. |
| 9 | Type as texture | No JP co-labels, no 7px serials, Doto clock at 800 weight. | DotGothic16 co-labels, serial texture, Doto 300 for the big clock, Kode 700 for stats. |
| 10 | Surfaces | Dark cut-corner slabs everywhere. | White cards on fog with 1px outline, chevron ground, hatch for empty slots, hazard stripe for uninstall; carbon slabs only for the object panel, inspector and terminal. |
| 11 | Motion | Grow + burst present. | Add block resolve (6 steps) for panels, one row per tick for lists, the ~270ms card burst on room change. |
| 12 | Hangar window | — | Optional: the in-world ad window loop in the unfolded column. |

The answers to the audit's open questions became `jrl-launcher-v4-plan.md`.
