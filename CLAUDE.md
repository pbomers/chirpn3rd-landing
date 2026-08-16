# Chirp'n3rd — notes for Claude (and humans)

This repo is the Chirp'n3rd storefront: a Shopify theme that looks like a 1999 AOL desktop.
Owners: Paul Bomers + Sean Newton. Fulfilment: Printful. Store: **https://chirpn3rd.com**
(Shopify store handle `hduc6n-nk`, live theme id `157749575835`, theme name "Chirpn3rd Online").

## Read these first
- `shopify-theme/LAUNCH.md` — what is still open before the password comes off.
- `shopify-theme/OPERATIONS.md` — how products, collections, prices and shipping work.
- `shopify-theme/EASTER-EGGS.md` — every hidden thing in the storefront (don't break them).
- `shopify-theme/audit-2026-08-16.json` — the full pre-launch audit (119 findings, what was fixed, what wasn't).

## Brand rules
- The brand is written **Chirp'n3rd** — with the apostrophe — in all copy. URLs/handles drop it (`chirpn3rd`).
- Voice is Paul + Sean talking: short, dry, car-guy. Never Printful boilerplate, never marketing-speak.
- The design is deliberately Windows 95 / AOL 5.0: 11px Verdana, square bevels, teal desktop `#17444d`,
  navy title bars, orange `#f26a1b` for the one action that matters. Do not "modernise" it. No rounded
  corners, no soft shadows, no gradients that didn't exist in 1999.
- The mascot is the hand-drawn chickadee in a **thick racing helmet** (OG BURD). Sources:
  `web/assets/ogburd-bird.png` (white), `shopify-theme/assets/ogburd-black.png` (black).
- Motto: Have Fun. Shift Hard.

## Where things live
- `shopify-theme/` — the live theme. Sections use `{% render 'window' %}` for every window.
  Behaviour in `assets/chirpn.js` (store) and `assets/chirpn-windows.js` (window manager, sign-on).
  Design system in `assets/chirpn.css`.
- `web/` — the Vercel-hosted landing/mockup (new.chirpn3rd.com). Not the store.
- `catalog/polish-plan.json` — title / price / collection / description for the launch products.
- **Print-ready art is NOT in this repo on purpose** (the repo is public). Masters live locally in
  `print-files/` and in Printful's file library. Never commit them.

## Working on the theme
```bash
cd shopify-theme
./sync.sh            # pull Customize edits from live -> theme check -> push live -> git push
./sync.sh --pull     # after someone used Customize: just capture those edits into git
```
- Two people + two Claudes share one live theme. **Always run `./sync.sh` instead of a bare
  `shopify theme push`** — a bare push overwrites whatever was changed in Customize (templates/*.json,
  sections/*-group.json, settings_data.json) with git's older copy.
- `git pull` before you start. Commit to `main`; the repo is public on GitHub. Vercel auto-deploys
  `web/` from `main`. Never edit code in Shopify's online code editor.
- `shopify theme dev` currently 404s (the CLI resolves the shop to chirpn3rd.com). To QA locally,
  fetch live HTML with the storefront password cookie and serve it, or use `?preview_theme_id=`.
- Storefront password is a shared gate code, not a personal credential; the CLI takes it via
  `--store-password`. Take it off in Shopify admin (Online Store → Preferences) at launch.

## Hard rules
- **Never delete anything in Printful** — products, templates, files. Ever. Choosing what to sync is fine.
- **US shipping only** for now, by design. Printful's synced flat-rate profile is the shipping setup.
- Don't rename collection handles (`tees`, `hoodies`, `lids`, `shift-knobs`, `new-drops`, `posters`,
  `race-days`, `accessories`, `stickers`) — the buddy list and channels are wired to them.
- Don't list new keywords in Help → Keywords; the partial list is the joke.
- Shopify storefront rate-limits `/cart/shipping_rates.json` hard; probe gently.

## Contact
Customer email in policies is `sendit@chirpn3rd.com`. Owner email is Paul's.
