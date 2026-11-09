# Kept (local AI file manager): notes

Name: Kept (working name; alternates Sift, Census). Concept, UI concept and skins are in this folder (`kept-concept`, `kept-ui-concept`, `kept-concept-v0`, `skins/`).

Standalone app. Not part of Jere's Place or any second brain.

## Target
Windows 11 desktop, a recent multi-core CPU and 32 GB RAM. GPU not yet decided; it sets how fast the L3 layer is.

## v0.1 (Nov 9, 2026)
- Route A: Python indexer + localhost web UI (127.0.0.1:8787, Host/Origin checked), installed as a Chrome/Edge app. Kept.bat does first-run setup (winget Python 3.12, venv in %LOCALAPPDATA%\Kept\venv).
- L0: walk watched folders (Downloads, Desktop, Documents, Pictures, Proton Drive if found), BLAKE2b hash (sampled over 64 MB), EXIF/GPS/dims, text from PDF/docx/pptx/xlsx/plain. SQLite + FTS5. watchdog events + 15-min rescan.
- L1: fastembed on CPU, 4 threads. CLIP ViT-B/32 for images (query via CLIP text), bge-small for document text. float16 vectors, brute-force cosine in numpy. Models cached in %LOCALAPPDATA%\Kept\models.
- Query: kind/in/when/ext/size/like/is/sort/at/name, quoted phrases, filler words dropped, any-word fallback, rule-based sentence → syntax hint (auto-applied when the sentence alone finds nothing).
- Decision log: decisions.log (pin, unpin, dismiss). Index is disposable.
- UI: one frame, four skins (base/void/pearl/cobalt, T cycles), list/grid, file pane with facts + ladder + nearest, Space preview, keys per the UI doc.
- Tested in the cloud on sample files; L1 tested with synthetic vectors only. The first real run is on the target PC.
- The v0.1 source isn't in this repo yet.

## Next
L2 (Windows OCR, whisper.cpp), L3 + Inbox (local vision model; depends on GPU), groups, then a Tauri wrapper.
