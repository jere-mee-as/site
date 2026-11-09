# Kept

Kept (working name) is a local AI file manager for Windows. Every view is a query, and nothing ever moves: files stay where they are, a local model describes each one once, and you browse by asking instead of walking folders. What the machine works out is a disposable cache; what you decide is a small plain-text log.

| Path | What |
|---|---|
| `docs/kept-concept.md` / `.html` | The concept: principles, query syntax, the compute ladder (L0–L4), costs, stack, build order |
| `docs/kept-ui-concept.md` / `.html` | The UI concept: one frame, keyboard model, inbox triage, skins |
| `docs/kept-concept-v0.md` / `.html` | The first version of the concept, kept for comparison |
| `docs/skins/skin-base.html` … `skin-cobalt.html` | The four skins (Base, Void, Pearl, Cobalt) rendered as static 1440×900 mockups of Inbox triage |
| `docs/kept-notes.md` | Build notes for v0.1 (Python indexer + localhost UI) |

The sample files in the mockups are made up.

## How to run

Nothing to run from this repo yet: the v0.1 source (Python indexer, localhost UI, `Kept.bat` first-run setup) is to be added. Open the docs and skins pages in a browser.

## Status

v0.1 built and tested in the cloud on sample files; its first real run is on the target PC. Next: L2 (OCR, transcripts), L3 + Inbox (local vision model), groups, then a Tauri wrapper. Some diagrams and screenshots from the original concept docs didn't survive the export; the skins pages stand in for the screenshots.
