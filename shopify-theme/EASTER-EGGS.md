# Chirp'n3rd Online — easter eggs

Everything hidden in the storefront, as of 2026-08-16. Every interactive one below was
exercised against the live theme markup on 2026-08-16 (clock, Setup tab, bird triple-click,
Konami, IM slang, IM formatting, keywords, Help, 404 bird, Pictures viewer). The two audio
sequences (Sign On modem + voice, add-to-cart chirp) need a real click, so verify by ear. Source: `assets/chirpn.js`,
`assets/chirpn-windows.js`, `sections/main-cart.liquid`, `sections/header.liquid`.

## Sign On (home page, once per session)

- **Sign On** plays a real 56k modem handshake (16 s). Steps light up along it:
  Clutch In → Grabbing 3rd → CHIRP. Then a voice says **"Welcome! You've got merch."**
  and the tire chirp fires. Skip / Esc kills it instantly.
- The greeting in the status bar uses the screen name you picked (ChirpFan2K3 /
  SlammedCivicGuy / Guest).

## Keyword bar (type it, hit Go)

| Keyword | What happens |
|---|---|
| `CHIRP` | tire chirp + "Keyword CHIRP: you're already here, baby." |
| `3RD` / `THIRD` | tire chirp + "Third gear located. Send it." |
| `VTEC` | tire chirp + toast "VTEC just kicked in. Yo." |
| `AOL` | toast "You've Got Merch. Welcome back to 1999." |
| `HONDA` | "We know. We love them too." |
| `SEAN` | toast from Sean1n3rd: "i do the send its." |
| `PAUL` | toast from ChirpnPaul: "me and sean make this stuff between oil changes." |
| `GARAGE` / `THE GARAGE` | jumps to the Channels page |
| `MERCH` | Merch Center |
| `CART` / `CHECKOUT` | cart |
| `PICS` / `PICTURES` | You've Got Pictures |
| `HELP` | opens Help Topics → How To Chirp 3rd |
| `ABOUT` | Help Topics → About |
| `KEYWORDS` | Help Topics → Keywords (lists only MERCH, GARAGE, CART, CHIRP, HELP — the rest stay secret) |

Anything else in the bar is a normal search.

## The IM window (home page)

- The reply box is real. Type these and Chirp'n3rd answers in character:
  `a/s/l` (or `asl`), `brb`, `lol`, `sup`, `yo`, `u up?`
- Anything else you type runs a store search.
- Empty reply + Send It → straight to the merch.
- The **A A B I U** formatting buttons actually format the conversation
  (size up/down, bold, italic, underline).
- **Idle 3 minutes** (no mouse/keys/scroll) → auto-response toast: "Auto response from ChirpnPaul: wrenching. brb." Fires once per page load.

## Keyboard

- **Konami code** (↑↑↓↓←→←→ B A) → screen shakes like a burnout, tire chirp,
  toast "CHIRP'N 3RD! You found the burnout button. Tires are billable."
- **← →** on You've Got Pictures step through photos. **Esc** closes Help / sign-on / menus.

## Clicks

- **Triple-click the helmet bird** in the toolbar → it does a spin (victory lap).
- **Click the clock** in the status bar → "It's always 3rd gear somewhere."
- **Buddy List → Setup tab** → toast "Settings are wherever Sean left them."
- **404 page → click the bird 3 times** → tire chirp + "Auto response from TheBird:
  out chirping 3rd. the page u want prob never existed."
- **Click a photo** in You've Got Pictures → next photo. Swipe works on phones.

## Cart

- Cart total of exactly **$19.99** → "Exactly one monthly AOL subscription. Respect."
- Add to cart → tire chirp + "You've Got Merch." toast, and the status bar says
  "Added to cart. Keyword: CHECKOUT".

## Help Topics window

- **How To Chirp 3rd** — six steps, ending "Buy the shirt so people know."
  Fine print: "Chirp'n3rd is not your lawyer, your mechanic, or your mom."
- **Keywords** — partial list on purpose. "There are others. We're not going to tell you."
- **About** — version 3.0 · "1,000 Free Hours. No CD Required."

## Windows

- Every window minimizes to a **tray** at the bottom, like a real desktop; X hides it,
  tray button brings it back. Window menu has Restore All / Arrange.
- Home page above 1180 px is a real overlapping desktop — windows drag by the title bar.

## Copy jokes that aren't interactive but people notice

- Status bar tips rotate: "Tip: 3rd gear is right there. Send it." / "Keyword: CHIRP"
- Footer: "1,000 Free Hours Of Chirp'n3rd. No CD Required." · "Printed on demand. Shipped by birds."
- Product page: "On the shelf, ships in 2-5 days" / sold out = "Sold out. Sorry bud."
  / impossible variant = "That combo does not exist. Yet."
- Contact form: "Reminder: Chirp'n3rd will never ask for your password, only your compression numbers."
- Password page: "Members only for now. Chirp'n3rd opens soon."

## Adding one

Keywords live in the `KEYWORDS` map in `assets/chirpn.js`. IM replies in `SLANG`.
Keep them short, in Paul + Sean's voice, and don't list new ones in Help → Keywords.
