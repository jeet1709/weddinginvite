# Wedding Invite

A self-hosted, animated Hindu wedding invitation: a tap-to-open wax-sealed
envelope with background music, a "#Pyar Dosti Hai" screening card as the
homepage, live falling petals,
scroll-reveal sections, flip cards for each day of celebration, a live
countdown to the muhurtham, and an RSVP that links out to a Google Form (so
responses land in a Google Sheet you already own — no custom backend
needed).

## Quick start

```bash
npm install
npm start
```

Open **http://localhost:3000**.

That's it — this is a static frontend served by a tiny Express server. There's
no database, no `.env`, and no admin login: RSVPs are collected entirely by
your Google Form.

## Editing content

Everything guests see — names, dates, venues, the festivities, the RSVP link,
even the color palette — lives in one file:

```
config/wedding.config.json
```

Edit it and refresh the browser; no restart or rebuild needed. Fields:

| Section | Notes |
|---|---|
| `couple` | `bride`/`groom` name + `parents` line (e.g. "Daughter of ..."), `monogram` (spaces are stripped for the round badges, so "A & S" renders as "A&S"), `hashtag`, `photo` (path under `public/`, e.g. `/assets/roka1.jpeg`) and `photoCaption` |
| `intro` | The opening overlay's text: `tagline`, `subtitle`, `headline`, `tapHint`, `buttonLabel`; plus `musicUrl` — see "The opening screen" and "Homepage & background music" below. Names come from `couple` |
| `branding` | `ganeshLogo` — the Ganesha mark shown in the footer. Line art on a white background works best (the white is blended out automatically) |
| `hero` | `preTitle`, `tagline` — visually hidden (`.sr-only`) text kept for accessibility/SEO; `blessingLine` is shown in the footer |
| `screening` | The "Now Showing" homepage card: `ganeshaArt`, `invocation`, `presentedBy`, `eyebrow`, `title`, `premiereLabel`, `admit`. Set `enabled: false` to hide it |
| `wedding` | `date` (`YYYY-MM-DD`), `time` (24h `HH:MM`) — drives the countdown to the muhurtham; `venueName`/`venueCity`/`address`/`mapQuery` drive the "When & Where" glance and Directions buttons in the countdown band; `countdownLabel` is the text above the countdown |
| `story` | Optional paragraph — leave `""` to hide the section |
| `schedule` | Optional `art` (a 9:16 image shown uncropped on the card front), `artText` (`top`/`bottom` — where the painting's blank band for text is) and `artTone` (`light`/`dark` — that band's colour). Each day of celebration (Haldi, Mehndi, Sangeet, the Wedding, ...) as a flip card. `id` picks the icon (`haldi`, `mehndi`, `sangeet`, `wedding` — anything else falls back to a generic flower icon). `subtitle` and `quote` are the flavour text shown on the card |
| `rsvp` | `googleFormUrl` — your Google Form share link (`forms.gle/...`). Toggle `enabled` to hide the section entirely. `deadline`, `contactName`/`contactPhone` (shown as a "prefer to call?" fallback) |
| `accommodations` | Optional hotel recommendations — omit/empty to hide |
| `registry` | Set `enabled: true` and add `links` to show a registry section |
| `theme` | Hex colors: `primaryColor` (kumkum red), `accentColor` (marigold gold), `deepColor` (the deep maroon bands), `backgroundColor`, `surfaceColor`, `textColor` |

### The opening screen

`public/js/invitation-overlay.js` draws a full-screen "tap to open"
invitation over the site: a beaded toran, falling petals, the couple's
monogram, and a gold-framed envelope sealed with an A&S wax seal. Tapping
the envelope (or "Open Invitation"):

1. presses and melts the seal (0–0.6s)
2. opens the flap (0.45–1.1s)
3. lifts the invitation card — Ganesha, ॥ श्री गणेशाय नमः ॥, the names —
   out of the envelope (0.95–1.75s), then holds a short beat
4. fades and gently scales the overlay away while the homepage fades in
   and settles underneath it (2.25–2.9s), then removes the overlay

Music starts on the tap itself (browsers only allow unmuted audio inside
the gesture). The overlay's text comes from `intro` (`tagline`,
`subtitle`, `headline`, `tapHint`, `buttonLabel`), the names/monogram from
`couple`, and the Ganesha image from `branding.ganeshLogo`. It was adapted
from the standalone `website-integration/` drop-in (kept locally, not in
git).

### Homepage & background music

There's no hero video. Once the envelope opens, the homepage is the
**Now Showing** card (`screening`): the Ganesha painting in a gold arch,
॥ श्री गणेशाय नमः ॥, the parents "present", "#Pyar Dosti Hai" inside a
frame of blinking marquee bulbs, "Starring" the couple, the festivities as
"Now Showing" tiles (from `schedule`), and the wedding as a "Grand
Premiere" ticket (from `wedding` and `rsvp.deadline`) that links to RSVP.

Background music (`intro.musicUrl`,
`public/assets/media/jashn-e-bahaara.mp3`) starts on the same tap gesture
that opens the envelope — calling `.play()` synchronously inside that click
handler is what lets browsers allow audio to start unmuted without a
separate permission prompt. The `<audio>` element and the mute button
(`#muteToggle`) deliberately live **outside** `#introScreen` in the DOM:
that element is removed entirely once the intro finishes, and anything
nested inside it would be deleted right along with it — silently killing
both the music and the only control that could silence it. Both are direct
children of `<body>` instead, so they persist and the mute button stays
reachable (fixed position, fades in once the invitation is revealed) as you
scroll the rest of the site.

Leave `musicUrl` as `""` to disable the music; the mute button hides itself.

### Where the images live

| File in `public/assets/` | Used for |
|---|---|
| `wedding-ganesh-logo.jpg` | Ganesha mark in the footer (`branding.ganeshLogo`) |
| `roka1.jpeg` | The framed couple photo in "Our Story" (`couple.photo`) |
| `ganesha-painting.jpg` | Ganesha painting at the top of the Now Showing card (`screening.ganeshaArt`) |
| `scenes/*.jpg` | Caricature scenes on the festivity card fronts (`schedule[].art`) |
| `media/jashn-e-bahaara.mp3` | Background music (`intro.musicUrl`) |

The remaining homepage ornament — the red damask ground, the falling petals,
the rose sprays and gold hairlines on the opening envelope — is drawn in
CSS/SVG rather than exported as images, which keeps it crisp at any size,
recolours with the `theme` palette, and adds nothing to page weight.

`HomepageBackground.jpg` and `Shiv-Parvati-Vivah.jpeg` are kept as **design
references only** and are not loaded by the page. (The homepage background
carries another couple's names, so it is recreated in code rather than used
as a backdrop.)

### Why a link instead of an embedded form?

Google Forms embedded in an iframe can hit a "sign in to your Google Account"
wall on many phones — Safari, Firefox, and increasingly Chrome all restrict
the third-party cookies Google's sign-in flow relies on inside an iframe, even
when the form itself doesn't require sign-in. A plain link that opens the form
in its own tab sidesteps that entirely and works everywhere, so that's what
this invite uses.

### Viewing RSVPs

Open your Google Form in Google Forms and click the **Responses** tab (or the
linked Google Sheet) — that's your guest list, live, with no server to
maintain.

## Sharing with guests

- **Same wifi network** (e.g. testing with family in the house): find your
  machine's local IP (`ipconfig getifaddr en0` on macOS) and share
  `http://<your-ip>:3000` — e.g. `http://192.168.1.9:3000`. Anyone on the
  same network can open it.
- **Quick temporary link**: a tunnel tool like `ngrok http 3000` exposes your
  local server on a temporary public URL — handy for a quick test share, but
  it only works while your computer is on and the tunnel is running.
- **Anyone, anywhere, permanently — deploy it** (recommended for the real
  invite link). See below.

### Deploying for a permanent public link

The site has no database or server-side secrets — RSVPs go straight to your
Google Form — so it deploys as a plain **static site**. `npm run build`
assembles everything (`public/` + `config/`, minus the two reference-only
images) into `dist/`; that folder is the entire deployable site.

```bash
npm run build
```

Then upload `dist/` to any free static host:

- **Netlify Drop** (fastest, no signup required to get a link): go to
  <https://app.netlify.com/drop> and drag the `dist/` folder in. You get a
  public URL immediately — claim it with a free Netlify account afterward so
  it doesn't get recycled for inactivity.
- **Vercel / Cloudflare Pages / GitHub Pages**: same idea — point any of
  these at the `dist/` folder (or run their CLI's deploy command against it).

**This repo is already wired to GitHub Pages** via
`.github/workflows/deploy.yml`: every push to `main` runs `npm run build` and
publishes `dist/`. The live site is hosted from the **`pyar-dosti-hai`** branch (the workflow there deploys on every push to it; `main` keeps the earlier video version). Updating the live invite is just

```bash
git add -A && git commit -m "Update details" && git push
```

Live at **https://jeet1709.github.io/weddinginvite/**.

If you deploy somewhere without CI instead (e.g. Netlify Drop), remember a
static deploy is a snapshot: re-run `npm run build` and re-upload `dist/`
after each content change. Only `npm start` reads the config fresh on every
request.

## Project structure

```
config/wedding.config.json   # all editable content
public/                      # frontend (HTML/CSS/vanilla JS, no build step)
server/index.js              # static file server (no database, no secrets)
```
