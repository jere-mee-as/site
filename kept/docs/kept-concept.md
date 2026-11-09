# File manager: concept

Nov 8, 2026 · @Jeremias

## The idea

A standalone local file manager where every view is a query and nothing ever moves. Files stay where they are. A local AI reads each file once and describes it; you browse by asking, not by walking folders.

The whole design rests on one split. What the machine works out about a file is a cache: keyed by the file's content hash, deletable, rebuildable overnight. What you decide about a file (confirm a guess, fix a field, group files) is yours: small, durable, plain text.

Cost follows attention. Every file gets the cheap layers. The expensive model only reads files you look at, triage or star, so a 100,000-file disk costs about as much as the few hundred files you actually touch.

## Principles

1. **Never move, rename or rewrite a file.** Organizing means describing and grouping, not relocating. Other apps' paths never break.
2. **One surface.** A query line drives everything. Folders, inbox, groups and saved searches are all queries.
3. **The machine proposes, you confirm.** Guesses look different from facts, and confirming is one key.
4. **Cache is disposable, decisions are not.** Delete the index and you lose only time. Your decisions are a plain-text log that rebuilds everything.
5. **Cost follows attention.** Cheap layers on everything, the expensive layer on what you touch.
6. **Local only.** Nothing leaves the machine unless you send one file to a cloud model on purpose.
7. **Degrades to a plain file manager.** With the indexer off, folders, names and dates still work.

## Everything is a query

There is one input at the top of every screen. Type plain words and it searches exact text and meaning at once; add filters to narrow. A sentence like "site photos from August with the ceiling open" is rewritten by a small local model into the syntax below and shown back to you, so you can edit it and learn it.

| You type | Means |
| --- | --- |
| `ceiling open` | words and meaning, everywhere |
| `"response v4"` | exact text, including text read from images and scans |
| `kind:photo` | photo, screenshot, document, audio, video, archive, code |
| `in:Downloads` | under a folder; this alone is the classic folder view |
| `when:2026-08` | captured or created in a range (`when:today`, `when:last-week`) |
| `at:"Harbor St."` | place, from GPS or read from the content |
| `group:Cedar` | a group you made or accepted |
| `like:IMG_4412.jpg` | files nearest in meaning to this one |
| `is:new` | arrived and not yet triaged (the Inbox) |
| `is:guess` | has unconfirmed machine fields |

A query you keep becomes a **view**, pinned in the sidebar. The defaults are just pinned queries: Inbox is `is:new`, Folders is `in:`, Groups is `group:`. Nothing is special-cased.

## What it knows about a file

Two layers, kept apart on purpose. Both live in one hidden app folder, never next to your files, so folders stay clean.

| Layer | Holds | Stored as | If deleted |
| --- | --- | --- | --- |
| Derived | facts, extracted text, embedding, machine caption and tags, thumbnails | SQLite index, keyed by content hash | rebuilt from the files |
| Yours | confirmed fields, corrections, groups, notes, dismissals | an append-only plain-text log, one line per decision | your decisions are lost; back it up |

A decision line looks like this:

```
2026-11-08T21:40 b3:9f1c…e07a confirm group="Harbor St."
2026-11-08T21:40 b3:9f1c…e07a set note="Conduit before inspection"
```

The index is the log replayed over the derived layer. That is why the cache can be thrown away: replay the log and every confirmation comes back.

**Finding files again.** Everything is keyed by content hash plus last-known path. A rename or move is matched by hash on the next scan, so nothing is lost. An edit at the same path keeps its decisions and gets re-derived. An **export** writes sidecar files or embeds tags (EXIF, XMP, PDF metadata) when you want metadata to travel with a file; it is never automatic.

## The compute ladder

Every file climbs only as far as it needs to. L0 to L3 write to the disposable index; anything you confirm or keep goes into your log, which is replayed over the index.

&#91;embedded content: compute ladder · 5 layers, cache and log\]

## Costs

Only one layer is expensive, and it never runs on everything. Figures are approximate, from typical small open models; benchmark on your own machine before deciding anything.

| Layer | Model size | RAM while running | Per item, GPU | Per item, CPU | Runs on |
| --- | --- | --- | --- | --- | --- |
| L0 Facts | none | \~0 | under 10 ms | under 10 ms | every file |
| L1 Look | 0.1–0.5 GB | 0.5–1 GB | 10–50 ms | 50–200 ms | every file with content |
| L2 Read | 0.1–1.5 GB | 0.5–2 GB | 0.2–1 s a page | 1–5 s a page | images with text, scans, audio |
| L3 Understand | 2–5 GB (3–7B model) | 3–6 GB | 2–6 s | 15–60 s | files you touch or triage |
| L4 Ask | cloud or large local | n/a | seconds | n/a | only when you ask |

**A 20,000-photo backfill.** L1 takes about 17 minutes. L3 on all of them would take about 22 hours on a decent GPU or about a week on CPU, which is why L3 runs on attention instead.

**Storage.** An embedding is about 3 KB, so 100k files is about 300 MB, or about 75 MB quantized. Extracted text adds a few hundred MB. Thumbnails are made on view and capped.

**Memory.** One model loaded at a time, unloaded after 2 minutes idle. At rest the indexer uses about 100–200 MB. Heavy work runs only when the machine is idle and plugged in, and yields the moment you need it.

## Screens

One frame: query line on top, pinned views on the left, results in the middle, the selected file on the right, indexer status along the bottom. The [skins canvas](https://claude.ai/artifact/FQLGRmaSxvXdLFLsbmPSHx) shows it in four looks.

- **Results.** Whatever the query returns, as a list or a grid. Folders are just `in:` results, so the old tree is still there.
- **Inbox** (`is:new`). New arrivals with the machine's description already drafted. A accepts, E edits a field, X dismisses. Triage is what triggers L3.
- **File.** Preview, every field marked confirmed or guessed, how far up the ladder it has gone, and the nearest files by meaning from any folder.
- **Groups.** The machine notices files that belong together ("34 files share an address and October dates") and proposes a group. Accept it and `group:Cedar` exists. Files get organized without anything moving.

Everything works from the keyboard: `/` focuses the query, J and K move, Enter opens the file in its own app, Esc steps back.

## Stack

Two processes: an indexer that does the work in the background, and the app window you look at. They talk over localhost, so the app can be rebuilt or reskinned without touching the index.

| Part | Choice | Why |
| --- | --- | --- |
| App | Tauri (web UI in a native window) | small, native file access, the skins are just CSS |
| Indexer | Python service, starts with the OS | fastest route to every model below; can be ported later |
| Folder watching | `watchdog` (OS change notifications) | create, edit and move events |
| Hashing | BLAKE3 | fast enough to hash everything on first scan |
| Index | SQLite with FTS5 + `sqlite-vec` | words, vectors and facets in one file |
| Embeddings | ONNX Runtime: a SigLIP-class image model, a small text embedder (nomic or bge class) | small, CPU-friendly |
| OCR | Windows built-in OCR first, PaddleOCR if needed | built-in is free and already installed |
| Speech | whisper.cpp | voice memos and video audio |
| Understanding | 3–7B vision-language model via llama.cpp or Ollama | captions, tags, group guesses |
| Query rewriting | the same small model, text only | sentence → query syntax |

## Build order

Each step is usable on its own, and none depends on the expensive layer working.

1. **Scan and query.** Watch folders, hash, L0 facts, the query line with `in:`, `kind:`, `when:` and exact text on names. Already a faster file finder.
2. **Look.** L1 embeddings and meaning search, `like:`. Benchmark speed and RAM here.
3. **Read.** L2 OCR and transcripts, so exact text reaches inside images, scans and audio.
4. **Inbox and the decision log.** Triage, L3 on touch, confirm and edit, log replay.
5. **Groups.** Proposals, accept into `group:`.
6. **Sentences.** Plain-language queries rewritten into syntax.
7. **Skins and export.** The looks on the canvas, sidecar and EXIF/XMP export.

## Open questions

- [ ] What's in the PC: GPU and its memory, total RAM? This decides whether L3 is seconds or a minute per file.
- [ ] Which folders are watched by default: Downloads, Desktop, Pictures, Proton Drive, work drives?
- [ ] Work and personal in one index, or two?
- [ ] Windows only, or Mac and Linux too?
- [ ] A name.
