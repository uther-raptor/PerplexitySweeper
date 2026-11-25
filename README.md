# PerplexitySweeper

A retro Minesweeper parody about AI safety. Attempt to safely navigate the singularity; your only guide is the log-perplexity of the models around you.

- Mines are "lethal models" from real AI labs, with made-up future model names.
- Safe cells show a log-perplexity score: about 0.97 with nothing nearby, about 0.65 when surrounded.
- The game is rigged in several ways to be nearly unwinnable.
- Losing offers a last-ditch chess defense against an engine that upgrades its pieces every turn.

The game is a single self-contained `public/index.html` with no build step. Open it in a browser, or deploy with Cloudflare Workers: `wrangler.jsonc` serves the `public/` folder as static assets, so `npx wrangler deploy` (or a Workers Git build) publishes it.

Lab logos come from [LobeHub Icons](https://github.com/lobehub/lobe-icons) and belong to their respective owners. This is an unaffiliated parody.
