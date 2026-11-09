# FFXIII footage notes (measured Nov 7, 2026)

Measured from two private reference videos (a game-UI reel, 8.5 min at 1440p60, and the opening film, 6.5 min at 4K). The videos are reference only and aren't in this repo.

## Measured timings
| Thing | In the game | v1 build |
|---|---|---|
| Cursor step between menu items | ~117ms glide, no overshoot | 320ms spring with overshoot |
| Menu screen change | ~333ms. Horizontal slides plus crossfade; list bars build in one after another | ~550ms. Blur and brighten, plus a battle-style callout |
| Title → first menu | ~730ms crossfade. Clouds and bars fade up over the title | ~900ms+. Letterbox bars, bloom, blur |
| Party → Crystarium | ~1.1s. Cards fly off (~400ms), ~300ms of pure drifting cloud, then the Crystarium condenses out of the fog | (no equivalent) |
| Leaving the menu | Content desaturates, blurs and fades to grey over ~600ms | — |
| Menu cloud drift | 0.9–3% of screen width per second, leftward; the Crystarium idles at ~3.8%/s | ~0.8%/s |
| Opening-film cloud flythrough | 4–10% of screen width per second | — |

## Look
- **Title:** a light flare sweeps across the wordmark on black. Black fades to white (~1.2s). The emblem bleeds in like watercolor (~1.3s). The menu fades in ~2s after that. Then the screen is still: 75% of frames are identical to the previous one. No letterbox bars.
- **Menu backdrop:** mid-grey smoky clouds with a pale blue sky band along the top edge. Not white-on-white.
- **Particles:** hexagonal violet bokeh, only on events (acquiring a Crystarium node, with a vertical light beam). No constant mote snow in menus.
- **Datalog:** a full-bleed image behind the list that changes with the entry.
- **Party screen:** six tall portrait cards. The selected one is in colour and the rest are desaturated.
- **Light in the opening film:** a hard cut to pure white, held ~0.6s, then the image bleeds through. The logo comes out of an overexposed bloom that slowly cools.
- **Callouts:** big italic banners appear only in battle or field contexts, never between menu screens.
- **Shattering:** nothing in either video shatters.
