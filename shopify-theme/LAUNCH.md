# Chirp'n3rd — launch checklist

State as of 2026-08-16 after the pre-launch audit. Theme is done and live at https://chirpn3rd.com
behind the storefront password. What's left is data and admin.

## Blockers (nothing ships until these are true)

- [ ] **Products polished** (Sean). 20 of 23 live products are still raw Printful: cost-plus prices with
      odd cents (CH3RD tee "from $12.03" ≈ zero margin), per-size price ladders, spec-sheet
      descriptions, unpolished titles. Use `catalog/polish-plan.json` — it has the title, house price and
      brand-voice description for each. House prices: tees $28 · lids $26 · posters $22 · stickers $5,
      flat per category, no size surcharges. Rules in `OPERATIONS.md`.
- [ ] **Shopify plan** chosen (Settings → Plan). Trial ended 2026-08-16.
- [ ] **Shopify Payments** completed (Settings → Payments → Complete setup). Nothing can be bought until then.
- [ ] **sendit@chirpn3rd.com** actually receives mail (Cloudflare Email Routing forward). It is printed
      in Terms of Service and Contact information.
- [ ] **One real test order** end to end (card → Printful order → shipping email).
- [ ] **Password off** (Online Store → Preferences). Last step.

## Should-do before sharing the link

- [ ] Fill or stock **Posters** and **Shift Knobs** — both currently show offline / SOON on the home page.
- [ ] Decide on the **"Free sticker in every bag"** promise (home page, two places). Printful does not
      add stickers; either it's a manual thing you do, or the line goes.
- [ ] Add a **size chart** to apparel descriptions (Printful has one per blank).
- [ ] Footer menu: Shopify's default "Search" link duplicates the Find button — remove in
      Online Store → Navigation → Footer menu, or keep.
- [ ] Theme settings: Instagram / YouTube URLs (Customize → Theme settings → Social).
- [ ] Tell Sean 11 of his Flickr photos are on /pages/pictures.

## Nice-to-have (from the audit, not blocking)

- Real human recording of "Welcome! You've got merch." to replace the neural voice (`assets/welcome.m4a`).
- Buddy screen names could hint their category (hover title or grey label).
- Home desktop layout: half-empty at 1440+, buddy list far down between 861–1179px.
- Policy pages scroll inside a 70vh box instead of the page.
- `templates/gift_card.liquid` doesn't exist (only matters if you sell gift cards).
- Classic customer-account templates are unstyled (unused — store uses Shopify hosted accounts).
- Pictures viewer serves 1600px JPEGs with no srcset.
- Menubar wraps to two lines below ~360px.

## Done in the audit pass (for the record)

Focus/inert/Tab-trap on Sign On + Help · skip link · button contrast · headings · alt text ·
variant photo swap · sold-out marks · cart Check Out placement/size · qty timer · status count ·
compare-at on cards · Reload button · Sign Off logs out · IM Send It · Merch Center naming ·
copy corrections (business days, returns, pitch) · empty categories offline · meta description ·
noindex search/cart/password · Product JSON-LD · og:image dims · watermark 357→145 KB.
