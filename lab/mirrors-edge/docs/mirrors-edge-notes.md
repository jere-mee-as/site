# JERE.ING — Mirror's Edge pass: build notes

Status: **v1 built as a preview, not live.** Separate from the Marathon and FFXIII passes; which direction ships is decided later.
Reference: a private style book (29 images + CSV), kept outside the repo.

## Files (this folder)
- `preview.html`: opens locally; report links point at https://jere.ing/reports/.
- `template.html`: drop-in `template.html`; keeps `<ol id="list" hidden><!-- LIST --></ol>`, build.py unchanged.
- `runner.html`: the runner site concept (WebGL rooftops).
- `runner-stylebook.html`: the concept doc.
- `city-web-field-guide.html`, `vesta9.html` (current, rev 2), `vesta9-v1.html` (first scrolling version, kept to look back at).

## Runner site concept
- No nav bar. A first-person WebGL rooftop city (hand-written, no libraries). Each report is a rooftop, newest first; route = Drop → 08 … 01 → End.
- **Runner Vision is the navigation**: the red rail at the jump edge (and the landing rail on the next roof) is the only red in the world. Click it / Space / → / swipe left = run. Q / ← / Backspace / swipe right = 180° quick turn = Back. M or tapping the clock = blue top-down map (fast travel). Digits 0–8 jump to a package. Hash routing: `#drop`, `#pkg-05`, `#end`.
- Time trial: clock starts on leaving the drop; splits per roof; best saved in localStorage if the run is clean.
- Frosted slab on the left (bottom sheet on phones) in the roof's zone colour.
- Type: Lexend Exa 100–300 caps, Barlow Condensed 600, Barlow, Noto Sans JP. Zones: book connectomes ultramarine, other connectomes violet, weak ties green, field report orange, Scope yellow, RIO pink. Red reserved for the route.

## In-world website: vesta 9
"What would an average website in this world look like." See `city-web-field-guide.html` and `vesta9.html`.

### v1 (Nov 8, afternoon)
Scrolling luxury-tower landing page: civic ticker, frosted nav, WebGL drone hero, elevator scroll gauge, residences/amenities/safety cams/map/quotes/apply, consent bar, toasts, concierge chat bubble, Quiet List modal, exit intent, red-sticker runner intrusion, generative lobby music (92 bpm, Dmaj9–Bm9–Gmaj9–Asus2).

### Audit (Nov 8, evening)
v1 still obeyed contemporary web habits: long scroll, template section heads, startup hero, centered container, pill buttons, SaaS nav, glassmorphism everywhere, chat bubble, toasts, cookie bar, cards with hover lift, fade-up reveals and count-ups, Material inputs, startup logo, lowercase+period voice, decorative JP, restrained one-accent palette.
Options: A building/elevator (rejected: reads as a game), **B in-world conventions website (chosen)**, C de-habit the scroll page.
Decisions: spoken announcements = **toggle** (default off); fixed screens = **strict**; keep vesta 9 and double down on "pristine surface, thin as paper, the monster shows through."

### Rev 2 (built Nov 8)
- Fixed frame, no scroll. Grid: slab menu (288px) · white stage · comfort record (196px). Phone: top strip + "Floors" overlay, one-line log.
- Slab menu (pause-menu style) takes the floor's colour: Lobby green, Residences sky blue, Amenities orange, Safety ultramarine, District violet, Apply navy, Roof red. Hard cut + two-tone blip between floors. Hash routes `#lobby #residences #amenities #safety #district #apply #roof`; keys 1–6, ←/→ page within a floor.
- Gate replaces cookie bar (Enter / Enter and accept all / Preferences all "Required"); doors open; candidate number assigned.
- Thin paper: `#under` canvas behind white, masked to a cursor "backlight" (≈2% base, ≈17% near cursor). Per floor: resident file grid + lens rings; camera cones over plans; compliance logs; dossier; perimeter + checkpoints + relocation zone; your typed name as a file. A tall figure stands behind every floor.
- White-out redactions (white text, readable on selection); selecting logs it, a second time triggers an announcement.
- Tracking brackets with dwell time on every `[data-t]` element; comfort record logs floors, dwells, concierge characters, cursor leaving, tab away, idle; top dwell is announced back.
- Announcement band with chime; optional speechSynthesis voice (Voice toggle). One announcement has a word that flickers red.
- Concierge = intercom panel on the lobby. Application = 5-step kiosk (name, household keys, floor keypad with 54/33 refused, month, consent with disabled "I do not consent").
- Roof: locked menu entry; intrusion (80s after entry, or 9s on Safety) turns it red; roof page = city from the crown, wind, dossier showing through, runner's note; leaving relocks and the building "notices".
- Idle mode after 60s: drone fullscreen, "Touch to continue".
- Sound per floor: lobby full, safety lowpassed + mains hum, roof music off + wind.

## Not verified in the sandbox
Real fonts (renders used fallbacks), audio and speech voice.
