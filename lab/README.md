# lab

Design explorations for the site. None of this is live yet; the pages will be published under jere.ing/lab/ later. Each folder is one direction, built as standalone HTML pages you can open straight from disk. All of them are original pages inspired by the UI styles of the games they're named after. No game assets are included.

| Folder | What |
|---|---|
| [`marathon/`](marathon/) | The current live direction for jere.ing: type specimen and color map |
| [`uplink/`](uplink/) | Marathon pass 2: an in-world "runner's shell" site and its visual development book. **Now the live front page** (the root `template.html`); the copy here is the concept as it was before going live |
| [`ffxiii/`](ffxiii/) | Final Fantasy XIII-inspired direction: preview, template drop-ins, audit |
| [`mirrors-edge/`](mirrors-edge/) | Mirror's Edge-inspired direction: runner site, vesta 9 in-world site and field guide, preview and template |

## How to open

Every page is a single self-contained HTML file. Open it in a browser. The only network requests are Google Fonts (and, on a few pages, outbound links). Without a connection the pages fall back to system fonts.

## Status

Exploration. The Marathon pages describe what the live site already uses; the other three are alternatives that have not shipped.

## Docs

Each folder has its own README. Design notes live in each folder's `docs/` where they exist: [`ffxiii/docs/`](ffxiii/docs/), [`mirrors-edge/docs/`](mirrors-edge/docs/), [`uplink/docs/`](uplink/docs/). The site-wide plans are in [`../docs/site/`](../docs/site/).

The game reference folders (style books, Marathon style videos) are private reference material kept outside the repo.
