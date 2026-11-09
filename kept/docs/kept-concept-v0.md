# Local AI file manager: concept

Nov 8, 2026 · @Jeremias

## The idea

Don't build a file manager. Give every file a card. Folders stay exactly as they are; a small local model proposes what each file is, and you confirm it with one key.

The "file manager" is then just search and views over those cards, living inside Jere's Place as a new object type, File. Only two things are durable: the file and its card. Everything the AI computes is a cache keyed by the file's content hash, deletable and rebuildable overnight.

Cost follows attention. Every file gets the cheap layers. The expensive model only reads files you touch, star or triage, so a 100k-file disk never costs more than the handful of files you actually care about this week.

## Principles

1. **Never move or rename a file.** Organization lives in cards and links, not in the folder tree. Moving files is how people lose them.
2. **The AI proposes, you confirm.** Machine guesses are visibly separate from what you've confirmed, and confirming is one keystroke.
3. **Cost follows attention.** Cheap layers run on everything; expensive layers run on what you touch.
4. **Cache is disposable, cards are not.** Delete the cache folder and nothing you wrote is lost; it rebuilds from the files.
5. **Plain files all the way down.** Cards are Markdown in the vault. If the app dies, the folders and the cards are still readable.
6. **Local by default.** Nothing leaves the PC unless you ask a cloud model a question about a specific file.
7. **Degrades to folders.** With the indexer off, the plain folder view still works.

## The card

Every file gets an index row; only files that earn it get a card. A card is created the first time the expensive layer reads a file, or the moment you confirm, link or annotate it. That keeps the vault to the files that matter instead of 100k Markdown stubs.

| Layer | Lives in | Holds | If deleted |
| --- | --- | --- | --- |
| File | where it already is | the content | gone (it's yours) |
| Index row | `.fm/index.sqlite` on the PC | hash, path, size, dates, type, extracted text, embedding | rebuilt from the file |
| Card | `Files/` in the Jere's Place vault | what the file is, links, your notes | your confirmed work is lost |

The card is a normal Jere's Place object. Machine guesses sit in a `machine:` block; confirming a field moves it up to the top level. The body is yours.

```markdown
---
type: File
hash: b3:9f1c…e07a
path: D:/Proton Drive/Work/Harbor St./IMG_4412.jpg
kind: photo
captured: 2026-08-14
project: "[[Harbor St. fit-out]]"
machine:
  caption: Open ceiling, electrical conduit run, ladder at left
  tags: [site photo, electrical, ceiling]
  place: Harbor St., NJ
---
# IMG_4412

Conduit before inspection. Send to Daniel if the inspector asks.
```

**Finding files again.** Cards point at files by content hash plus last-known path. A rename or move is found by hash on the next scan. An edit at the same path keeps the card and updates the hash.

## The compute ladder

Every file climbs only as far as it needs to. L0 to L2 feed the disposable index; L3 drafts the card you confirm; L4 runs only when you ask about a file.

&#91;embedded content: compute ladder · 5 layers, 2 destinations\]

## Costs

Only one layer is expensive, and it never runs on everything. Figures are approximate, from typical small open models; measure them on your PC before deciding anything.

| Layer | Model size | RAM while running | Per item, GPU | Per item, CPU | Runs on |
| --- | --- | --- | --- | --- | --- |
| L0 Facts | none | \~0 | under 10 ms | under 10 ms | every file |
| L1 Look (embeddings) | 0.1–0.5 GB | 0.5–1 GB | 10–50 ms | 50–200 ms | every file with content |
| L2 Read (OCR, speech) | 0.1–1.5 GB | 0.5–2 GB | 0.2–1 s a page | 1–5 s a page | images with text, scans, audio |
| L3 Understand (vision-language model, 3–7B) | 2–5 GB | 3–6 GB | 2–6 s | 15–60 s | touched, starred, inbox, watched folders |
| L4 Ask (cloud or large local) | n/a | n/a | seconds | n/a | only when you ask |

**What a backfill of 20,000 photos costs.** L1 takes about 17 minutes. L3 on all of them would take about 22 hours on a decent GPU, or about a week on CPU alone. That gap is the whole reason L3 runs on attention, not on everything.

**Storage.** One embedding is about 3 KB, so 100k files is about 300 MB, or about 75 MB quantized. Extracted text and the full-text index add a few hundred MB. Thumbnails are made lazily and capped.

**Memory.** One model is loaded at a time and unloaded after 2 minutes idle. At rest the indexer is a background process of about 100–200 MB. Indexing runs only when the PC is idle and plugged in, and pauses the moment you need the machine.

## Views

Four views, and the Inbox is the one you live in. Organizing happens by confirming guesses as files arrive, never by sorting folders.

- **Inbox.** New arrivals from Downloads, Screenshots and phone camera uploads, each with the machine's card already drafted. One key accepts, one opens the field to fix, one dismisses (the file stays, it just doesn't get a card). Triage is what triggers L3, so attention pays for itself.
- **Search.** One box. It runs three searches at once: exact words (permit numbers, names), meaning ("blue drawing with a crystal"), and facets (kind, date, place, project, person). A sentence like "site photos from Harbor St. in August with the ceiling open" is rewritten by a small local model into the palette's own syntax, `kind:photo project:"Harbor St." in:2026-08 "ceiling open"`, and shown to you, so you can edit it and learn it.
- **Constellations.** Files that belong together, found by meaning and shared people, places and dates, regardless of folder. The machine proposes a group ("34 files look like one job: Cedar Ave. permit"); accept it and it becomes a Project object every file links to. Files get organized without anything moving. This is where the Crystarium earns its place: projects as rings, files as nodes.
- **Folders.** The plain tree, always there. Each file shows a small mark when it has a card.

Opening any file shows its preview, its card, and its nearest neighbours: the other files most like it, wherever they live.

## Stack

Two pieces: a small local indexer that does the work, and Jere's Place as the face. The browser can't watch folders or run a vision model comfortably, so the indexer is a background process on the PC that serves the page over localhost.

| Part | Choice | Why |
| --- | --- | --- |
| Indexer | Python service, starts with Windows | fastest route to every model below; can be rewritten later |
| Folder watching | `watchdog` (Windows change notifications) | events on create, edit, move |
| Hashing | BLAKE3 | fast enough to hash everything on first scan |
| Index | SQLite with FTS5 + `sqlite-vec` | one file holds words, vectors and facets |
| Embeddings | ONNX Runtime: a SigLIP-class model for images, a small text embedder (nomic or bge class) | small, CPU-friendly |
| OCR | Windows built-in OCR first, PaddleOCR if it isn't good enough | built-in is free and already on the PC |
| Speech | whisper.cpp | voice memos and video audio |
| Understanding | a 3–7B vision-language model through llama.cpp or Ollama | captions, tags, project and people guesses |
| Face | Jere's Place, new File type and Files views | cards already work there |

With the indexer off, Jere's Place still opens the cards as ordinary objects.

## Phone and sync

The PC is the only indexer; the phone feeds it and reads from it. The Fold7 shouldn't spend battery running models.

- **In:** photos and screenshots sync to Proton Drive and land in the PC's Inbox.
- **Out, now:** cards are Markdown in the vault, so they are readable on the phone through Proton Drive as plain text.
- **Out, later:** search from the phone by reaching the indexer over a private network (Tailscale or similar), shown in the launcher's terminal as `find`.

## Build order

Each step is usable on its own, and no step depends on the expensive layer working.

1. **Watch and hash.** Indexer scans the chosen folders, L0 facts, hash cache, exact-word search over names and text. Plain but already better than Explorer search.
2. **Look.** L1 embeddings and meaning search. Benchmark speed and RAM on your PC here.
3. **Read.** L2 OCR on screenshots and scans, transcripts for audio.
4. **Inbox and cards.** Triage view, L3 on touch, File cards written into the vault.
5. **Constellations.** Group proposals, accept into Project objects.
6. **Sentence search.** Natural language rewritten into palette syntax.
7. **Skin pass.** FFXIII treatment, Crystarium as the constellation map.

## Open questions

- [ ] What's in the PC: GPU and its memory, total RAM? This decides whether L3 is seconds or a minute per file.
- [ ] Which folders are in scope: Downloads, Desktop, Proton Drive, work drives?
- [ ] Cards in the Jere's Place vault, or a separate vault? This depends on whether Jere's Place or Capacities becomes the place you write.
- [ ] Do work files (TPC) stay in the same index as personal ones, or a separate one?
- [ ] A name.
