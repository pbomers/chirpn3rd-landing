# Chirp'n3rd Online — running the store

For Sean (and future us). How products get from Printful onto the site, how the
site decides what shows where, and what to check when something doesn't appear.

Store admin: `https://admin.shopify.com/store/hduc6n-nk`
Storefront: **https://chirpn3rd.com** (primary; `hduc6n-nk.myshopify.com` redirects there). Theme lives in `shopify-theme/`.

## How the site is wired

The theme never lists products by hand. Everything on the storefront is driven by
**Shopify collections**, matched by handle:

| Storefront | Collection handle | Buddy screen name |
|---|---|---|
| Tees | `tees` | xX_FreshTees_Xx |
| Hoodies | `hoodies` | HoodieHooligan |
| Lids | `lids` | LidLord99 |
| Shift Knobs | `shift-knobs` | ShiftKnobKid |
| New Drops | `new-drops` | NewDropz2K26 |
| Posters | `posters` | WallStance |
| Race Days | `race-days` | TrackDayThugz |
| Accessories | `accessories` | PaddockGoodz |
| Stickers | `stickers` | StickerBomber |

- The **buddy list** and the **channel grid** on the home page each point at these
  handles. Clicking a buddy opens that collection.
- **Merch Center** = `/collections/all` (every published product, automatic).
- **Featured / New Drops** window on the home page pulls from `new-drops`.
- A product page shows an **"Also In …"** window from the first collection the
  product is in that has more than one product.
- An empty collection still renders, with "Nothing in this channel yet." Fine for a
  week, not for launch.

Rules that follow from this:

1. **Don't rename or delete these collections.** Renaming the *title* is fine
   (that's what shows on screen). Changing the *handle* breaks the buddy.
2. Adding a brand-new category means: create the collection in Shopify, then add a
   buddy + channel block in Customize (Home page → Buddy List / Channels).
3. Products not in any collection still show in Merch Center and search, but no
   buddy leads to them.

## Adding a product (Printful → Shopify)

1. **Printful → Stores → Chirp'n3rd (Shopify) → Add product.**
   Pick the blank, upload the print file (finals live in `print-files/`), place it,
   pick colors and sizes, generate mockups.
2. **Push to store.** Printful creates the Shopify product with its own title,
   a cost-plus price, and a boilerplate description.
3. **Shopify → Products → open it** and fix the three things Printful gets wrong:
   - **Title** — plain product name, no "Unisex" or blank model junk in the title.
   - **Price** — house prices, not Printful's suggested ones:
     tees **$28** · lids **$26** · posters **$22** · stickers **$5**
     (hoodies / joggers / zips: round to the nearest dollar over cost, keep the
     whole category the same price)
   - **Description** — brand voice. `catalog/polish-plan.json` has copy for every
     product in the launch set. Reuse it; don't paste Printful's spec sheet.
4. Still on the product: **Collections** → add it to exactly one category
   collection, plus `new-drops` if it's new this drop.
5. Check **Sales channels** shows *Online Store*. If it says "unavailable", it
   won't render anywhere no matter what else is right.
6. **Save.** It's on the site immediately. Reload the collection page.

Printful's Shopify app keeps stock, images and variants in sync after that. Title,
price and description are yours; Printful won't overwrite them.

## Removing a product

Two very different things:

- **Take it off the site, keep the design** — Shopify → product → *Sales channels*
  → uncheck Online Store (or set status to Draft). Printful still has it; nothing to
  redo later.
- **Kill it** — delete in **Printful first**, then in Shopify. Deleting only in
  Shopify leaves an orphan in Printful that will re-push at some point.

Never delete a product that has open orders.

## Prices

House prices are per category, flat, no per-color surcharges. If Printful raises a
blank cost, decide once for the whole category. Use Printful's bulk price editor
(Store → Products → select all → Edit prices) only for a category-wide change,
then confirm in Shopify.

## When a product doesn't show up

Work down the list; it's always one of these:

1. **Not published to Online Store** — Sales channels on the product.
2. **Not in the collection** — check the product's Collections box, and check the
   collection's conditions if it's an automated one.
3. **Ghost publish** — Printful says "synced", Shopify has no such product. Happened
   to 11 posters in Aug 2026. Fix: Printful → the product → *Sync* / re-push. If
   Printful thinks it's already synced, edit the product (any change) and push again.
4. **Wrong collection handle** — the collection exists but its handle isn't in the
   table above (e.g. `posters-1`). Fix the handle, not the theme.
5. **New collection, no buddy** — see rule 2 above.

## Shipping

Printful's app pushed its own shipping profile into Shopify. It's flat rates that
match Printful's published table (US tee $4.75 / express $9.99, hat $4.49, etc).
**US only for now** — there is no international zone, so non-US addresses get no rate
at checkout by design. Mixed carts sum the categories' rates. Don't create a second profile; if rates look
wrong, fix them in **Settings → Shipping → the Printful profile**. Live carrier
rates need Shopify Advanced (or Grow + $20/mo) — not worth it at this size.

## What lives where

- `shopify-theme/` — the theme. Push with `shopify theme push` from that folder.
- `catalog/polish-plan.json` — title / price / collection / description for the launch set.
- `docs/catalog/catalog.json` — the 101-product triage (63 in, 38 out) and why (local only, not in git).
- `print-files/` — final print-ready art.
- `mockups/`, `web/` — the mockup site and teaser, not the store.
