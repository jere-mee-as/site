# JERE.ING "Uplink" concept (Marathon pass 2): notes, Nov 8 2026

Status: concept. Meant to replace the v3 Marathon site eventually; not live.
Files: `../index.html` (the site; report links resolve to https://jere.ing/reports/) and `../stylebook.html` (the visual development book).

## Decisions (Nov 8)
- Fiction: **uplink**. The site is the runner's own shell in the hangar between runs. **Hijack** (site as a corporate billboard network with content pirated into the gaps) is parked for a future pass.
- Fixed stage: 1600×900, scaled and letterboxed; portrait screens get a composed 720×1280 handheld layout. No page scroll.
- 3D: limited. One object per screen, either lit (low-res, 4×4 ordered dither in 2–4 inks) or drawn (wireframe schematic).
- Sound: on. Synthesized Web Audio (tick, move, thump, confirm, back, crackle, swell, carrier, buzz, hangar hum, comms static and carrier).
- Languages: Japanese for the shell co-labels and the genetics corp; Chinese for the agri-corp.
- Style book format: out-of-world "art blast" boards (13 boards, lime credit strip).
- "Regular navigation = cringe." Navigation is gear: slots on the shell, spatial arrows, controller prompts.

## Shell schematic (Nov 8, evening; head rebuilt same night)
The shell screen's centrepiece is a wireframe bust of the runner shell instead of the dithered core:
- White triangle mesh (front 72%, back faces 8.5%); orange key light from the left in camera space with a per-triangle dithered edge; orange "cortex cradle" lattice behind the skull; blue rig (#3d6bff, schematic only): bones, joint rings with axis ticks, filled optics.
- Callouts in Kode Mono on carbon slugs, auto-slotted so they don't overlap.
- Resolves top-down on entry; one scan band in the signal colour every 7.5s (so Paint recolours it); slow turn, draggable.
- The first version (deformed sphere) read as a "light bulb on a stick"; rebuilt as a slice-lofted head with real face proportions: head height 1 (chin 0, crown 1), eyes at 0.5, brow 0.54, nose base 0.26, mouth 0.165; profile curves for front, back, width, superellipse exponents per height; nose, sockets, brow, lips, chin, cheekbones as features; cupped ear flaps from brow to nose base behind the jaw hinge; neck leaning into a raised trapezius. ~5.1k tris (LON 46).
- Drawn from scratch; not a copy of any cover or character.
- Style book board 12 "Schematic layer" documents it; L-10 reads "one object: lit or drawn".

## Mapping
Vault = Reports (stash grid; item size = file size; DC-02 field report quarantined, hold X to override) · Comms = Song (tune a dial to the daily lock frequency) · Salvage = Are.na channels as crates (live fetch when available) · Cipher = Babel · Paint = Color generator (applying a colorway changes the site's signal colour) · Scan = Culture as a point-cloud zone with the 8 cores as anomalies · Diagnostics = terminal (/ or Y).

## Type
Started from the locked v3 set: Hubot Sans, Archivo 125/900 for cropped giants only, Kode Mono, JetBrains Mono, Doto, EB Garamond italic. Added DotGothic16 (JP), ZCOOL QingKe HuangYou (CN), Saira Stencil One (crates); Workbench as a signage candidate.

## Not done / next
Hijack pass. Real fonts not verified in the sandbox. Song-of-day and Are.na images only work when hosted. Possible: schematic on the boot screen, a full-screen schematic view, cheek/jaw planes and eyelids for more facial definition.
