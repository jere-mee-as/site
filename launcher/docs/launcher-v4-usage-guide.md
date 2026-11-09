# JRL Launcher v4: usage guide

Nov 9, 2026 · @Jeremias

JRL Launcher v4.0 is the runner's handheld: six rooms, one carbon strip on top, one prompt bar at the bottom, and every option typed into a terminal. This guide covers the v4.0 preview; the phone build waits for the GitHub account.

## First run

- **On a computer:** open the preview. It frames itself as the Fold7 cover screen (412×915). The buttons above it switch to the unfolded screen (984×1092) or fill the window.
- **On the phone:** open the same link. It runs full screen.
- **Example data:** without the Android shell, a mock bridge supplies about 75 apps, a week of calendar events, a playing song and unread counts. Nothing you tap opens a real app; launches show a stand-in screen, and Back (Esc) returns.
- **Boot:** the first visit plays the boot log. Tap **\[enter\] tap here** (or press Enter) to come in. Later visits play a short intro, then drop you on the Shell. Change this with `set boot smart|always|off`.
- **Fonts:** the faces load from Google Fonts. Offline, you'll see fallback fonts until the phone build bundles them.

## The screen

Every room has the same frame: a carbon strip on top, the room in the middle, a carbon prompt bar at the bottom.

| Part | What it shows | What you can do |
| --- | --- | --- |
| System strip (top) | JRL block, room name in English and Japanese, Wi-Fi, cell, battery, the time. On the Shell the time is replaced by the date as `2026.313` (year.day of year), because the big clock is right there. Unfolded, it also shows the wordmark and the colony day. | Tap **SND** at the right end to turn sound on or off. |
| The room | One of six rooms. The room sets the colour; nothing scrolls. | Depends on the room (below). |
| Prompt bar (bottom) | `jere@jrl-h:~$`, the last command, and an A–Z ruler under it. When you enter a room, two gesture hints show at its right for 2 seconds. | **Tap** it for the terminal. **Slide** along it to launch an app. |
| Arrivals | When a notification arrives, the top strip turns lime for 3 seconds: `INCOMING // WHATSAPP 04`. | Nothing; it goes back by itself. Counts live in the Inbox. |

Every tap types its command into the prompt bar (`open gmail`, `go music`, `back`), so the bar is a running record of what you just did.

## The Shell (home)

The Shell is where you land: the time, one line of what's happening, the planet panel with four readouts, and your 16 slots.

- **Clock:** **hold** it to feel the time as vibration (long pulses for the hour, short for tens of minutes). **Double-tap** it to lock the phone. The colon blinks every second; the bar under it fills over the minute.
- **The one line:** whatever matters soonest. An event less than 30 minutes away wins, then the song that's playing, then the next event. Tap it to open Agenda or Music. When it shows a song, ◀◀ ❚❚ ▶▶ control playback right there.
- **The planet (Tau Ceti IV):** lit by the real time of day. Noon faces you; midnight is a thin lit edge. Lights on the night side are in your signal colour. The small moon beside it shows tonight's real phase. The line under it reads `Light 74% · moon waxing gibbous 61%`.
- **The four readouts** beside the planet: **Agenda** (countdown to the next event), **Music** (song position, with its own play/pause button), **Inbox** (total unread), **Colony** (population). Tap one and its room grows out of it.
- **The 16 slots:** each slot has a number, the app's glyph, its three-letter code (PHN, GML, WHT…) and a coloured edge in the app's own colour. A black tag in the corner is its unread count. Slots never move unless you move them.
- **Corner brackets** stay on the slot you opened last, so you can see where you were.
- **Empty slot:** tap it and Apps opens in assign mode; pick an app to put it there.
- **Kits (folders):** slots marked `K/MUSIC`, `K/AI`… Tap a kit to open it as a panel; tap its name to rename it; **Ungroup** puts its apps back in slots.

## Opening an app

There are four ways in, fastest first. The app starts on your tap; the flash-card burst plays over Android's own loading time.

1. **Tap a slot** on the Shell. One tap.
2. **Slide along the prompt bar.** Put your thumb on the bar and slide: it becomes an A–Z ruler, and the screen fills with the apps under that letter, the one you use most nearest your thumb. Lift on the bar to open the highlighted one. Slide up into the list to pick another, or past the top of the list to cancel. A plain tap on the bar opens the terminal instead.
3. **Apps room.** Swipe up on the Shell. Your most-used apps sit at the top as tiles sized by how often you open them; everything else is the A–Z table below, in pages.
4. **Terminal.** Tap the bar and type `open spotify` (or just `spotify`). `find sp` filters Apps live; Enter opens the top match.

## The rooms

Six rooms, each in its own colour. Back (the Android back gesture, or Esc) always returns to the Shell; from Agenda to Colony, swipe sideways to step between them.

| Room | Colour | How to get there | What's in it |
| --- | --- | --- | --- |
| 00 Shell | Fog | Home, Back | Clock, one line, planet + readouts, 16 slots |
| 01 Apps | White, pink | Swipe up on the Shell | Most-used tiles, then every app A–Z in pages. Swipe sideways or tap the page tabs (A–C, D–G…) to turn pages; swipe down to go back. Hold any row for its file. |
| 02 Agenda | Bone, orange | Tap the Agenda readout | Countdown to the next event, a 7-day strip (one bar per event), then your next events across days. Tap an event to open it in your calendar; **+N more** opens the calendar app. |
| 03 Music | Orange, blue | Tap the Music readout | Album art in a ring that fills as the song plays, timecode, title, transport keys, a dot equalizer. Tap the art to see it uncoloured; tap the app name at the top to open the player. |
| 04 Inbox | Lavender | Tap the Inbox readout | Unread total, the top five apps by unread (tap one to open it), **Shade** to pull down Android's notifications, and the handheld's own log. |
| 05 Colony | Carbon, teal | Tap the Colony readout | The colony grid (tap it to feed), its stats, life support with real battery, the genome, and device readouts. Tap Life support to change it. |

The terminal is the seventh room: tap the prompt bar.

## Program file: hold to edit

Hold any app (a slot, a tile in Apps, a row, an Inbox row) for about half a second. Corner brackets snap onto it and a bar fills under them; when it's full, the app's file opens in the app's own colour.

The file shows how often you've opened the app, when you last did, its unread count and its slot. Every action is a command line you tap:

| Line | What it does |
| --- | --- |
| `open gmail` | Opens the app |
| `pin gmail` / `unpin gmail` | Puts it in the first empty slot, or clears its slot |
| `move gmail -1` / `+1` | Swaps it with the slot before or after |
| `kit gmail` | Puts it in an existing kit or a new one (you name the new kit right away) |
| `unkit gmail` | Takes it out of its kit |
| `hide gmail` / `unhide gmail` | Hides it from Apps; `ls -a` in the terminal shows hidden apps |
| `info gmail` | Android's App info page |
| `uninstall gmail` | Android's uninstall dialog (behind the yellow hazard stripe) |

Close, or Back, returns to where you were. Holding a kit opens it with its name ready to rename.

## The terminal and settings

Tap the prompt bar and the terminal slides up. There is no settings screen: every option is a `set` command. Type `help` for every command, `set` for every option.

**Everyday commands**

- `open NAME` (or just the name), `find TEXT`, `ls` (all apps), `ls -a` (with hidden ones)
- `go music`, `go 3`, `home`, `back`; rooms are shell, apps, agenda, music, inbox, colony
- `pin NAME [slot]`, `unpin NAME`, `hide NAME`, `info NAME`, `uninstall NAME`
- `play`, `next`, `np` (now playing), `cal` (calendar), `shade`, `lock`, `time` (feel the time), `battery`
- `colony`, `feed`, `update` (fetch a new UI), `reboot` (replay the boot), `version`

**Options** (`set KEY VALUE` changes one; `set KEY` explains it)

| Option | Values (default first) | What it changes |
| --- | --- | --- |
| `paint` | stock, rose, hazard, dust, somatic, scan; or next, prev, random | The signal colour: what marks the selected thing and the prompt. Rooms keep their colours. |
| `icons` | glyph, app, pixel, code | Glyph = a pictogram for the kind of app (mail, music, money…). App = real icons. Pixel = real icons in hard pixels. Code = text only. |
| `slots` | grid, list | The 16 slots as a 4×4 grid or a two-column list with names |
| `labels` | code, name | Grid slots show the three-letter code or the name |
| `sound` | off, on | The synth. Also the SND chip, or M on a keyboard |
| `haptics` | on, off | Ticks, clicks and the launch vibration |
| `life` | auto, full, low | Life support (below) |
| `launch` | burst, cut | Flash-card burst or a plain cut when an app opens |
| `boot` | smart, always, off | When the boot log plays |
| `bars` | off, on | Android's own status and nav bars; off = the system strip replaces them |

**Root:** `root` (or `su`, `~`) sweeps the screen and drops into a fullscreen root terminal full of toys: `top`, `scan`, `ping`, `weather`, `decrypt`, `roll`, `8ball`, `colonysay`, `rain`, `morse`, `synth`, `snake`, and 28 achievements to find. They're jokes with fake output; nothing there touches the phone. `exit` leaves.

## Cheat sheet

| Where | Touch | Keyboard (preview) | Result |
| --- | --- | --- | --- |
| Anywhere | Back gesture | Esc | Close the top layer, then return to the Shell |
| Prompt bar | Tap | / or \` | Terminal |
| Prompt bar | Slide, lift on the bar | — | Open the highlighted app |
| Prompt bar | Slide, then up past the list | — | Cancel |
| Shell | Swipe up | ↑ | Apps |
| Shell | Swipe down | — | Android notification shade |
| Shell | Tap a readout | — | Grow into that room |
| Clock | Hold | — | Feel the time as vibration |
| Clock | Double-tap | — | Lock the phone |
| Any app | Tap | — | Open it |
| Any app | Hold | — | Program file |
| Apps | Swipe sideways | ← → | Turn the page |
| Apps | Swipe down | Esc | Back to the Shell |
| Agenda to Colony | Swipe sideways | ← → | Next or previous room |
| Any room | — | 1–6 | Jump to that room |
| Any room | — | Tab | The `set` table |
| Any room | SND chip | M | Sound on or off |
| Terminal | — | `~` | Root terminal |

## Night, power, sound and the colony

- **Night (00:00–06:00 Eastern):** every room goes carbon and cuts stop flashing. The colony sleeps. It switches back on its own at 06:00.
- **Life support:** **auto** (default) drops to **low** under 20% battery when not charging, on power saver, data saver or reduced motion. Low slows the background bursts, freezes the planet and the equalizer, and swaps the launch burst for a cut. Force it with `set life full` or `set life low`.
- **Sound:** off by default. Turn it on with the SND chip or `set sound on`. Only actions make sound; touching nothing is silent. **Haptics** are on by default (`set haptics off`).
- **The colony:** a small Life-like organism that lives in the handheld. It's fed when you come back after 10+ minutes away, on every 5th app launch, and when you tap its grid in the Colony room. It dozes after 2 minutes idle, sleeps at night, and dies after 30 days unfed. Day 001 was 2026-11-07, shared with the website.

**Preview limits:** the apps, calendar, music and notifications are example data until the Android shell is built (it waits for the GitHub account). Locking, the notification shade, App info and uninstall show stand-ins. Fonts need a connection.
