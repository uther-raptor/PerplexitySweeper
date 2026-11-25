# PerplexitySweeper

A retro Minesweeper parody about AI safety. Attempt to safely navigate the singularity; your only guide is the log-perplexity of the models around you.

- Mines are "lethal models" from real AI labs, with made-up future model names.
- Safe cells show a log-perplexity score: about 0.97 with nothing nearby, about 0.65 when surrounded.
- The game is rigged in several ways to be nearly unwinnable.
- Losing offers a last-ditch chess defense against an engine that upgrades its pieces every turn.

The game is a single self-contained `public/index.html` with no build step. Open it in a browser, or deploy with Cloudflare Workers: `wrangler.jsonc` serves the `public/` folder as static assets, so `npx wrangler deploy` (or a Workers Git build) publishes it.

Lab logos come from [LobeHub Icons](https://github.com/lobehub/lobe-icons) and belong to their respective owners. This is an unaffiliated parody.

## Extinction tracking and privacy

When a player reaches the final fade to black, the browser records it in local storage and the Worker (`src/index.js`) records a keyed hash of their IP address, so reloading only shows the "Extinction is forever" screen.

- Only an HMAC-SHA-256 of the IP is stored, keyed with a random secret that is generated inside the Durable Object and never leaves it. The raw IP is never stored or logged by the app.
- Entries expire after 30 days and a daily alarm deletes them.
- Nothing else about the player is collected or shared.
- The page says this in a short notice, and its "Forget me" link deletes the caller's entry and local flag.

Endpoints: `GET /api/status`, `POST /api/extinct`, `POST /api/forget`.

## Chess engine

The last-ditch chess game is played by [Fairy-Stockfish](https://github.com/fairy-stockfish/fairy-stockfish.wasm) (`public/engine/`, GPL-3.0, see `public/engine/Copying.txt`), configured with a custom variant whose four extra pieces match the game's rules. It needs `SharedArrayBuffer`, so `public/_headers` makes the site cross-origin isolated. Where that isn't available (for example inside a Claude artifact) a small built-in engine with a forced-mate search plays instead.
