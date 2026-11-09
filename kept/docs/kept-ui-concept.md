# File manager: UI concept

Nov 8, 2026 · @Jeremias

## The idea

One frame that never changes shape; only the query changes. There are no separate screens for Inbox, Folders or Groups: each is a query typed into the same line, and the results, the selected file and the status sit in the same places every time. That stability is what makes it feel calm, and what makes skins cheap.

The interface has one job beyond finding files: showing honestly what the machine guessed versus what you confirmed. Everything else is quiet.

Design rules: flat, no shadows, no rounded cards floating on gradients, hover is a colour change only. One accent per skin, used for exactly three things: the current selection, the primary action, and the layer the indexer is working on.

## In action

Four moments, one per skin. Same frame every time; only the query and the skin change. (Rendered with stand-in fonts, Inter and DejaVu Sans Mono, so type is approximate.)

**1. Morning triage (Base).** The query is `is:new`. Five arrivals, each with a drafted guess. The photo is selected: two facts (filled squares), three guesses (hollow dots, italic), L3 is reading it now, and the nearest files come from Camera, a work folder and the Desktop. A Cedar group proposal waits in the sidebar.

&#91;image: Inbox triage in the Base skin\]

**2. Asking in a sentence (Void).** You typed a sentence; the parsed query sits dim at the right of the line, and Tab would accept it. Results come back as a photo grid, with a bar showing 5 exact matches and 18 by meaning. The selected file is fully confirmed: every dot filled, tags solid.

&#91;image: Sentence search with a photo grid in the Void skin\]

**3. Reviewing a proposed group (Pearl).** The machine noticed 34 files across four folders that belong to one permit job. Each row says why it was included; one stray is unchecked. The right pane becomes the group's summary, and Enter accepts. Nothing moves.

&#91;image: Group review in the Pearl skin\]

**4. A folder is just a query (Cobalt).** `in:Downloads sort:date` gives the classic folder view with month headers. The selected PDF is mid-read: L2 is pulling its text, so the amount field still says "reading…".

&#91;image: Folder view as a query in the Cobalt skin\]

## The frame

Five zones, fixed. At 1440 px the columns are 220 / flexible / 360; below 1100 px the file pane becomes an overlay, and on narrow windows the sidebar collapses to icons.

&#91;embedded content: the frame · 5 zones at 1440 × 900\]

## The query line

The query line is the navigation. It sits across the top, full width between the sidebar and the file pane, and `/` focuses it from anywhere.

- **Results update as you type**, after a 150 ms pause. No search button and no results page.
- **Filters become tokens.** Typing `kind:photo` and a space turns it into a token you can Backspace over as one unit. Plain words stay plain text.
- **Sentences show their translation.** When the line reads like a sentence, the parsed query appears to its right in the dim colour (`→ kind:photo at:"Harbor St." when:2026-08`). Tab accepts it into the line, so you learn the syntax by watching.
- **Autocomplete is the token list.** After a `:` it offers real values from your index (`in:` lists your folders, `group:` your groups) with counts.
- **A kept query is a view.** Ctrl S pins the current query to the sidebar with a name. Inbox, Folders and Groups are pinned views shipped by default; you can reorder or remove them like any other.
- **Clicking a folder, a group or a tag anywhere** just writes that token into the line. The line always shows where you are.

## Results

Two layouts, toggled with V; the choice is remembered per view (photos default to grid, documents to list).

| Layout | Each item shows | Best for |
| --- | --- | --- |
| List | 48 px thumbnail, name, one mono meta line (kind · date · folder), one dim line with the machine's best guess | documents, screenshots, mixed results |
| Grid | square thumbnail, name underneath, nothing else until hover | photos, images, video |

- **Selection** is a 3 px accent bar on the left edge plus a slightly darker row. No outlines, no checkmarks.
- **Ranking is shown, not hidden.** A thin bar under the result count shows how many came from exact text vs meaning, so you know why a file is there.
- **Grouping headers** appear only when the query asks for them (`sort:date` gives month headers, `sort:folder` gives folder headers). Otherwise one flat list.
- **Multi-select** with Shift or Ctrl; the file pane then becomes a bulk pane (confirm all, add to group, export).

## The file pane

The right column, 360 px, shows the selected file top to bottom in the order you'd want to read it:

1. **Preview.** Image, first PDF page, waveform for audio, a few lines of text. Space opens it full-frame; Enter opens it in its own app.
2. **Name and path.** The path is in the mono face and every segment is clickable (it writes `in:` into the query line).
3. **Fields.** Kind, captured, place, group, people, then anything else the machine found. Each row is one line: marker, key, value. Guesses and confirmed values look different (see below).
4. **Caption and tags.** The machine's one-sentence description and its tags, editable in place.
5. **Ladder.** Five short segments, L0 to L4, showing how far this file has been read. A filled segment is done, the accent one is running now, an empty one hasn't run.
6. **Nearest.** Four files most like this one from any folder, each with its folder underneath. This is the row that makes the app feel like it knows your stuff.
7. **Actions.** Pinned to the bottom: Accept (primary), Edit, Group, No card.

## Inbox and groups

**Inbox** is the view `is:new`, and it is where the app is used day to day. It works like a queue, not a folder:

- New arrivals land at the top with the machine's description already drafted.
- A accepts every guess and moves to the next file. E jumps into the first guessed field. X dismisses (the file stays, it just leaves the inbox).
- The sidebar count goes down as you work. At zero the pane shows only "Inbox clear" and the time.
- Triage is what triggers the expensive layer, so the inbox is also how you spend compute.

**Groups** appear in two places. Proposals sit in the sidebar under the views as small blocks: a name, one line saying why ("34 files share an address and October dates"), and Accept / Review. Review opens the proposed files as results so you can deselect strays before accepting. An accepted group is just a `group:` token from then on, and it shows as a field on every file in it.

## Guess vs confirmed

This is the one visual distinction the whole UI is built around, so it is carried by three cues at once and never by colour alone.

|  | Guess (machine) | Confirmed (you) | Fact (read from the file) |
| --- | --- | --- | --- |
| Marker | hollow dot | filled dot | small square |
| Text | dim colour, italic | full ink, upright | full ink, upright |
| Tag chips | dashed border | solid border | n/a |
| On hover | shows where it came from ("caption from L3", "place from GPS") | shows when you confirmed it | shows the source field (EXIF, PDF metadata) |

Confirming flips the marker and the text in one frame. Nothing animates; the change itself is the feedback. The query `is:guess` finds every file that still has hollow dots.

## Keyboard

Every action has a key, and the status line shows the keys that apply right now. The mouse works everywhere too.

| Key | Action |
| --- | --- |
| / | Focus the query line |
| Tab | Accept the parsed query |
| J / K | Next / previous result |
| Enter | Open in its own app |
| Space | Full-frame preview |
| A | Accept all guesses on this file |
| E | Edit the first guessed field |
| G | Add to a group |
| X | Dismiss from the inbox |
| L | Find files like this one (`like:`) |
| V | List / grid |
| Ctrl S | Pin this query as a view |
| 1–9 | Jump to pinned view |
| Esc | Clear the query, then step back |

## Motion and sound

Almost none, on purpose. A file manager is opened dozens of times a day; anything that moves gets old by the second week.

- **Results swap instantly.** No fades between queries.
- **Thumbnails resolve in place**: a flat block in the skin's thumb colour, then the image in one cut when it loads.
- **The ladder is the only thing that moves.** The running segment pulses slowly while a layer works on the selected file, so you can see the machine is busy without a spinner.
- **Inbox counts tick down** by one per accept, no animation.
- **Sound is off by default.** A skin may define a two-sound set (accept, dismiss); nothing plays on hover or navigation.
- **Reduced motion** stops the ladder pulse; nothing else needs changing.

## Skins

A skin is a small file of tokens, and nothing else: no layout, no extra components. Because the frame never changes, those tokens are enough to change the whole feel. The [skins canvas](https://claude.ai/artifact/FQLGRmaSxvXdLFLsbmPSHx) shows the four below on the same Inbox moment.

**Tokens:** `bg`, `panel`, `line`, `ink`, `dim`, `accent`, `accentInk`, `select`, `thumb` ×3, `font`, `mono`, `radius`, and an optional two-sound set.

| Skin | Ground | Accent | Type | Corners | Feel |
| --- | --- | --- | --- | --- | --- |
| Base | off-white #f3f3f1 | orange #ff4d00 | Geist + Geist Mono | 3 px | the plain default |
| Void | near-black #0a0a0b | lime #c2ff16 | JetBrains Mono throughout | square | terminal, quiet at night |
| Pearl | pale grey-blue #e9ecef | ice #8fe6f0 | Saira | 10 px | soft, game-menu calm |
| Cobalt | blue #0400f5, full-bleed | lime #c2ff16 | Space Grotesk + Kode Mono | square | loud, poster-like |

Rules every skin must pass: body text at 4.5:1 against its own ground, `dim` text included; the accent never carries small text; guess vs confirmed stays legible without colour.

## Open questions

- [ ] Is the file pane always visible, or does it slide in only when a file is selected (more room for grids)?
- [ ] Which skin is the default on first launch?
- [ ] Should the skin follow time of day (Void at night), or stay fixed?
- [ ] Does the app replace Explorer's role (open on file-system links), or live beside it?
