# Wedding Invite

A self-hosted, animated Hindu wedding invitation: a tap-to-open wax-sealed
envelope with background music, a homepage video, live falling petals,
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
| `intro` | The opening screen: `eyebrow` (small tracked line above the names), `joiner` (the italic word between the names, e.g. "weds"), `tapHint`, and `musicUrl` — see "Homepage video & background music" below. The names themselves come from `couple` |
| `branding` | `ganeshLogo` — the Ganesha mark shown in the footer. Line art on a white background works best (the white is blended out automatically) |
| `hero` | `videoUrl` — the homepage video, see below. `preTitle`, `tagline`, `blessingLine` (shown in the footer) still exist as text but are visually hidden (`.sr-only`) in the hero itself now that the video carries that information; they remain for accessibility/SEO |
| `wedding` | `date` (`YYYY-MM-DD`), `time` (24h `HH:MM`) — drives the countdown to the muhurtham; `venueName`/`venueCity`/`address`/`mapQuery` drive the "When & Where" glance and Directions buttons in the countdown band; `countdownLabel` is the text above the countdown |
| `story` | Optional paragraph — leave `""` to hide the section |
| `schedule` | Each day of celebration (Haldi, Mehndi, Sangeet, the Wedding, ...) as a flip card. `id` picks the icon (`haldi`, `mehndi`, `sangeet`, `wedding` — anything else falls back to a generic flower icon). `subtitle` and `quote` are the flavour text shown on the card |
| `rsvp` | `googleFormUrl` — your Google Form share link (`forms.gle/...`). Toggle `enabled` to hide the section entirely. `deadline`, `contactName`/`contactPhone` (shown as a "prefer to call?" fallback) |
| `accommodations` | Optional hotel recommendations — omit/empty to hide |
| `registry` | Set `enabled: true` and add `links` to show a registry section |
| `theme` | Hex colors: `primaryColor` (kumkum red), `accentColor` (marigold gold), `deepColor` (the deep maroon bands), `backgroundColor`, `surfaceColor`, `textColor` |

### The opening screen

The invitation opens on a full-bleed **X-fold envelope** — four triangular
flaps meeting at a wax seal, drawn entirely in CSS/SVG. The mechanic is
modelled on how a real envelope actually opens, not an abstract dissolve:
only the top flap moves. The bottom/left/right folds are the fixed pocket
and never animate. Tapping runs:

1. **The seal cracks** and releases (`.env-seal`, ~0–0.5s).
2. **The top flap lifts open** on a real 3D hinge along its own base
   (`.env-flap-top-wrap`, `rotateX`, `transform-origin: 50% 0%`), rotating
   up and away from the viewer like a letter actually being opened
   (~0.2–1.5s). `backface-visibility: hidden` means it simply isn't there
   once it's rotated past 90°, revealing the pocket underneath.
3. **A spark of light races along each of the four crease lines** at the
   same moment, from the seal out to each corner (`.env-spark-tl/tr/bl/br`,
   ~0.1–1.2s) — light traveling the actual fold geometry, forming a bright
   X for a moment, rather than a glow blooming from nowhere.
4. **The envelope dissolves** (~1.6–2.2s), cross-fading directly into the
   invitation already sitting beneath it.

Every light element here is a small, thin shape — a 2px-wide streak, a
hairline — never a large gradient that needs to be clipped to a shape. That
matters: a large blurred or transformed element clipped by `clip-path` (or
even a plain ancestor `overflow: hidden`) has a genuine Chromium rendering
bug where the clip silently stops being honoured once `devicePixelRatio` is
2 or 3 — i.e. on the large majority of real phones. It renders correctly at
DPR 1, which is exactly the trap: it looks fine on a standard desktop
screenshot and breaks on the retina display it's actually viewed on. Small
shapes never trigger it, which is part of why this version is built the way
it is rather than as a single large glowing blob.

`#introScreen` itself (not just `.envelope`) has its own near-black
background at `z-index: 1000` over the full viewport — its own fade and the
site content's reveal are triggered on the same timer in `setupEnvelope()`
in `public/js/main.js`, specifically to avoid a dead black gap between "the
envelope's gone" and "the screen's gone."

Reduced-motion users skip straight to the revealed invitation.

### Homepage video & background music

The hero is the invitation video (`hero.videoUrl`) and nothing else —
`public/assets/media/wedding-invite.mp4` already carries the names, date,
time and venue as a finished animated card, so there's no separate arch,
card, or duplicate text sitting on top of it. That text still exists in the
DOM as `.sr-only` elements (`#heroPreTitle`, the names, `#heroTagline`,
`#heroDate`) purely for accessibility and SEO, since a video's on-screen
text isn't readable by either.

The video runs **full width, at its own aspect ratio, with zero cropping** —
deliberately not `object-fit: cover`. A 9:16 portrait video can't fill a wide
desktop viewport edge-to-edge *and* stay uncropped at the same time; those
are mutually exclusive once the container's proportions don't match the
source. This site picks "show the whole video" over "fill the screen
exactly": width is 100%, height follows from `aspect-ratio: 9/16`, so on a
wide desktop screen the hero simply runs taller than one viewport (you
scroll a little further to clear it) rather than having the top or bottom of
the video cut off. `aspect-ratio` also reserves the correct height
immediately, before the video's own metadata loads, so there's no layout
jump once it does.

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

Leave either `videoUrl` or `musicUrl` as `""` to disable that feature
without touching any other code — the hero section and the mute button
both hide themselves gracefully when there's nothing to show.

### Where the images live

| File in `public/assets/` | Used for |
|---|---|
| `wedding-ganesh-logo.jpg` | Ganesha mark in the footer (`branding.ganeshLogo`) |
| `roka1.jpeg` | The framed couple photo in "Our Story" (`couple.photo`) |
| `media/wedding-invite.mp4` | The homepage hero video (`hero.videoUrl`) |
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
publishes `dist/`, so updating the live invite is just

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
