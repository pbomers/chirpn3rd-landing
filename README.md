# Chirp'n 3rd — Landing Page

Interactive landing page for **Chirp'n 3rd Motorsports**. Throw it in third, break the tires loose, chirp 'em.

Vanilla HTML/CSS/JS — no framework, no build step. The site lives in [`web/`](web/).

## Local dev

```bash
node server.js
# → http://localhost:5173
```

`server.js` is a tiny static file server that serves `web/`.

## Deploy (Vercel)

Zero-config. `vercel.json` rewrites all routes into `web/`, so importing this repo and hitting **Deploy** just works — no build command, no output directory to set.

## Store

The Shopify theme is in [`shopify-theme/`](shopify-theme/). How Sean adds, prices and
removes products, and how the buddy list maps to collections: [`shopify-theme/OPERATIONS.md`](shopify-theme/OPERATIONS.md).

## Notes

- The **Shop** button and social links are placeholders until the Printful storefront goes live.
- Sound: the tire chirp uses a real licensed clip (`web/assets/sfx/chirp.wav`); a Web Audio synth is the fallback. Credits in `web/assets/sfx/CREDITS.txt`.
