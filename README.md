# The Madras Diaries — website

A rebuild of themadrasdiaries.ca: same Madras kitchen, modern front end, and a
password-protected admin where the restaurant edits everything itself — menu,
colours, wording, hours, deals, photos and video.

Plain HTML, CSS and JavaScript with a small Node server. No framework, no
build step, no database, no npm dependencies.

---

## Running it

The site now has a backend so everything is editable from a password-protected
admin. You need [Node.js](https://nodejs.org) 18 or newer. No npm install —
there are no dependencies.

```bash
node server.js --set-password 'pick-a-strong-one'   # once
node server.js                                       # start it
```

Then open:

- **the site** — http://localhost:3000/
- **the admin** — http://localhost:3000/admin.html

`PORT=8080 node server.js` runs it on another port.

## What's here

```
server.js             The server: sign-in, saving, uploads. No dependencies.
admin.html            The admin console
content/              ← everything the site says, as JSON. The admin writes these.
  site.json             contact details, hours, ordering links
  theme.json            colours, fonts, logo, hero video
  text.json             every heading and paragraph on the home page
  menu.json             all 112 dishes
  deals.json            weekly deals and limited-time promotions
  specials.json         the featured dishes and the rotating plate
  media/                photos and videos you upload
  .auth.json            your password hash — never committed
index.html            Home
menu.html             Full menu
assets/css/styles.css Site design system
assets/css/admin.css  Admin styles
assets/js/content.js  Loads content/*.json and applies the theme
assets/js/app.js      Hours, deals, hero video, specials, the rotating ring
assets/js/menu.js     Menu search, filters, layouts
assets/js/admin.js    The admin console
assets/img/logo.png   Your logo
assets/img/food/      Photography cropped from what you sent
data/defaults.js      GENERATED offline copy — see "Opening it without a server"
tools/build-defaults.js
```

## The admin

Sign in at `/admin.html`. Eight sections:

| Section | What you can change |
|---|---|
| **Brand & colours** | The three logo colours and every shade drawn from them, the logo file, heading and body fonts, the hero video |
| **Words on the site** | Every heading and paragraph — hero, about, deals, specials, visit, and the text that circles the plate |
| **Menu** | All 15 sections and 112 dishes. Add, delete, reorder, set prices (including split prices like "19 / 31"), notes, descriptions, dietary tags and spice level |
| **Deals & promotions** | A standing deal for each day of the week, plus dated promotions with a countdown and a promotional photo |
| **Special section** | The featured dishes — each can show a **photo or a video** — and the rotating plate image |
| **Hours & contact** | Opening times per day, phone, email, address, and every external link |
| **Photos & videos** | Drag-and-drop upload, then pick files from the library anywhere else in the admin |
| **Password** | Change the admin password |

Nothing is written until you press **Save**. **Discard changes** puts everything
back to the last save. Each save keeps the previous version of the file as
`.bak`, so a bad edit can be undone by restoring it on the server.

### About the password

It's stored as a scrypt hash with a random salt in `content/.auth.json` — the
plain password is never written down, and that file is git-ignored. Sign-in is
rate-limited to 10 attempts per 15 minutes. Sessions last 8 hours and are held
in memory, so restarting the server signs everyone out.

**Put it behind HTTPS before it faces the internet.** The session cookie is
HttpOnly and SameSite=Strict, but without TLS the password still crosses the
network in the clear. Any host that terminates TLS for you (Caddy, nginx,
Cloudflare, Railway, Render, Fly) solves this.

## Opening it without a server

Double-clicking `index.html` still works: `fetch` is blocked on `file://`, so
the page falls back to `data/defaults.js`, a bundled snapshot of the content.
It goes stale as soon as you edit anything in the admin. Refresh it with:

```bash
node tools/build-defaults.js
```

On a normal static host (Netlify, Cloudflare Pages, plain FTP) no fallback is
needed — `content/*.json` are just files and the site reads them directly. You
simply can't use the admin there, because nothing can write the files back;
edit the JSON and re-upload, or run `server.js` on a host that allows it.

## What you asked for

### 1. Daily deals and promotions

`data/deals.js` holds two kinds of offer:

- **Weekly** — one standing deal per day of the week. The site works out what
  day it is *in Vancouver* and automatically pins today's deal to the hero
  banner, pre-selects today in the "This week" strip, and labels it Today.
- **Promos** — limited-time offers with a start and end date. They show a live
  countdown and **remove themselves from the site when they expire**, so a
  finished promotion can never sit there looking current.

To change a deal: open `data/deals.js`, edit the text between the quotes, save,
upload. To switch one off without losing it, set `active: false`.

A promotion dated in the future shows "Starts Jan 14" instead of a countdown,
so you can load the whole year in advance and let it publish itself.

### 2. Running video

The hero plays a muted, looping video behind the headline.

Put your file at **`assets/video/hero.mp4`** and it plays. That's the whole
setup — the path is already configured in `data/site.js`.

Specs that work well: 10–20 seconds, 1920×1080, H.264 MP4, **no audio**, under
6 MB. Shoot the griddle, the dosa going long, the parotta being slapped — close
and slow beats wide and busy behind text.

It's built defensively:

- If the file is missing or won't decode, the page falls back to an animated
  still. Nothing breaks and nothing looks empty.
- There's a pause button — some people need that, and it's an accessibility
  requirement for anything that autoplays.
- Visitors with "reduce motion" turned on get the still frame and a play button
  instead of autoplay.
- The video pauses when the tab is in the background, so it doesn't drain phone
  batteries.

`assets/video/hero.webm` currently holds a **generated placeholder loop** — a
warm griddle glow with drifting steam. It exists so you can see the feature
working immediately. Replace it with real footage.

### 3. Better menu view

`menu.html` replaces the PDF download:

- **Search** across dish names, descriptions and tags.
- **Filters** for Guest favourite, Chef's pick, Vegetarian, Vegan,
  Gluten-free and New. They combine — vegan *and* gluten-free gives you the
  three dishes that are both.
- **Two layouts** — cards with descriptions, or a compact list that scans like
  a printed menu. The choice is remembered for the next visit.
- **Spice ratings** as chilli marks, and allergen tags on the dish.
- **Sticky section rail** that highlights where you are as you scroll.
- **Shareable filters** — the URL updates, so `menu.html?diet=vegan` is a link
  you can text someone. The signature dishes on the home page link straight
  into a filtered menu this way.
- **Prints properly** — the toolbar and navigation drop away and you get a
  clean menu on paper.

### 4. The rotating plate

The banana-leaf thali sits inside a ring of text that turns slowly, the way
your current site arcs "Fusion of Spices at Its Best" around the plate — but
set so it stays readable. The phrase is repeated as many times as fit and each
copy is centred in its own slice of the circle, so it can never overlap itself
whatever wording you type. Both the phrase (**Words on the site → Rotating
ring**) and the plate image (**Special section**) are editable. It holds still
for anyone who has "reduce motion" switched on.

The plate was cut out of the screenshot you sent and its background removed.
It's clipped flat at the bottom because the screenshot was — the site fades
that edge out to hide it. **Send me the original plate image and it'll be
perfect.**

### 5. New look

Built from your own identity rather than a generic template. The palette is
taken from the logo — **gold `#C2892C`, terracotta `#BE624E`, slate-blue
`#4A5F7A`** — on a warm off-white, which is also the three-colour system the
printed menu uses. Your headline ("Experience Contemporary Madras Style"), your
strapline ("India's Grill Kitchen") and your own About copy are kept. The
seigaiha wave motif from your site is carried through as a texture, section
headings carry their Tamil name, and the Halal certification gets a visible
badge in the hero and footer. Fraunces for display, Inter for text.

Also in the rebuild: a live **Open now / Closing soon / Closed** badge computed
from your real hours, a sticky Order / Menu / Deals / Call bar on mobile, and
Restaurant schema markup so Google can show your hours, rating and menu link
directly in search results.

---

## Before this goes live

1. **Set your own admin password.** `node server.js --set-password '...'`
2. **Put it behind HTTPS.** See "About the password" above.
3. **Confirm the opening hours.** Three sources still disagree:
   - Your take-out menu PDF says **11:30 AM – 12:00 AM, all days** ← used here
   - Your site footer says 11:00 AM – 12:00 AM all day
   - Google and Yelp say 11:30 AM–12 AM Mon–Wed, to 2 AM Thu–Sat

   Set the right one under **Hours & contact** and fix the listings to match.
4. **Send the original plate image** (the banana-leaf thali). Mine is cut out
   of a screenshot and clipped at the bottom.
5. **Add the rest of your photography.** Four dishes were cropped from what you
   sent and are in the special section. Upload more under **Photos & videos**.
6. **Set the links that have no system behind them** under **Hours & contact**:
   `reservationUrl` (the Reservation button currently dials the restaurant),
   the ordering links, and the newsletter form action.
7. **Check the spice ratings** in the menu — they're my reading of each
   description, not your kitchen's.
8. **Decide on the deals.** The seven weekly deals are worked examples built
   from your real dishes and prices. Edit or switch them off.

### Typos worth fixing on the printed menu and current site

I corrected these on the website; they're still wrong on the source material:

| Printed | Should be |
|---|---|
| Promfret Fry | Pomfret Fry |
| "generous amont of black pepper" | amount |
| "marinated in south indan spiced" | Indian spices |
| "Panner Tikka" | Paneer Tikka |
| "Baltered braised chicken" | Battered |
| "Fusion of Spices at It's Best" | Its |
| "Mildy seasoned rice, saulted vegetables" | Mildly / sautéed |
| "resulting ina flavourful" | in a |

## Issues in the current site this rebuild fixes

Visible in the screenshots of the live site:

- **The sticky header sits on top of body text** as you scroll — headings and
  paragraphs run underneath the dark bar. Here the header reserves its own
  space, and the menu page measures its sticky toolbar so jumping to a category
  never parks the heading underneath it.
- **Large empty vertical gaps** between sections. Spacing here is on a single
  scale that tightens on smaller screens.
- **The arced "Fusion of Spices" text** is hard to read and takes a whole
  screen. That copy is now a normally-set section you can actually read.
- **Three or four competing typefaces.** Two here: Fraunces for display, Inter
  for text.
- **No prices on the Special Menu**, no hours, and no ordering links anywhere.
- **No mobile quick actions** — this build has a sticky Book / Deals /
  Directions / Call bar.

## Hosting it

The site is two halves, and they have different needs:

- **The public pages** are plain files. Any host serves them.
- **The admin** needs Node running with a **disk it can write to**, because
  saving edits means writing `content/*.json` and uploaded media.

So the question is whether you want the admin to work on the live site.

### Option A — a small VPS (recommended)

Full control, a real disk, and the cheapest option that does everything.
Hetzner, DigitalOcean, Vultr, Linode — about $5/month.

```bash
# on the server, as a non-root user
git clone <this repo> /srv/madras && cd /srv/madras
node server.js --set-password 'pick-a-strong-one'

sudo cp deploy/madras.service /etc/systemd/system/
sudo systemctl enable --now madras         # keeps it running and restarts it
```

Then put Caddy in front for automatic HTTPS — `deploy/Caddyfile` is ready,
just change the domain:

```bash
sudo caddy run --config /srv/madras/deploy/Caddyfile
```

Caddy obtains and renews the certificate itself. Nothing else to configure.

### Option B — a platform host (Render, Railway, Fly)

Easiest if you'd rather not touch a server. Connect the repo; `package.json`
tells them to run `node server.js`, and HTTPS is handled for you.

**You must attach a persistent disk mounted at `/app/content`.** Without one
the filesystem is wiped on every deploy and restart, and every edit made in
the admin disappears. This is the single most common way to lose your work —
on Render it's a "Disk", on Railway a "Volume", on Fly a "Volume".

Set these environment variables:

| Variable | Value | Why |
|---|---|---|
| `ADMIN_PASSWORD` | your password | Sets the password on first boot, since you may have no shell. Ignored once a password exists. |
| `TRUST_PROXY` | `1` | So login rate limiting sees real visitor addresses, not the platform's proxy. |
| `NODE_ENV` | `production` | |

Run a **single instance**. Sessions are held in memory, so with two instances
you'd be signed out at random as requests bounce between them.

There's a `Dockerfile` if the host prefers containers.

### Option C — your existing hosting

The site currently runs on WordPress, so you already pay someone. Many shared
hosts (anything with cPanel) have a **"Setup Node.js App"** tool that runs this
perfectly — point it at the folder, set the startup file to `server.js`, and
add the environment variables above. Worth asking your host before paying for
anything new.

### Option D — static only, no admin

Netlify, Cloudflare Pages, GitHub Pages, or plain FTP to any web host. Free,
fast, nothing to maintain. Upload the whole folder.

Everything a visitor sees works, because `content/*.json` are just files the
page fetches. **The admin won't save**, though — there's no server to write
the files. To change something you'd edit the JSON and re-upload it.

A reasonable middle path: host the public site statically, and run the admin
on your own machine (`node server.js`) when you want to make changes, then
upload the updated `content/` folder.

### Whichever you choose

- **Use HTTPS.** Without it the admin password crosses the network in clear
  text. Options A–C all give you it.
- **Back up `content/`.** It is the whole site's content. A nightly copy of
  that one folder is a complete backup.
- **`content/.auth.json` is deliberately not in git.** A fresh deploy has no
  password until you set one, by command or `ADMIN_PASSWORD`.
- **Point the domain at it last**, once you've checked the site and signed
  into the admin on the host's temporary URL.

### Recommended follow-ups

- **Self-host the fonts** instead of loading them from Google Fonts. Faster,
  and it keeps visitor data out of a third party's hands.
- **Add real photography** and swap the SVG placeholders.
- **Add an `og:image`** — a real photo, 1200×630, for link previews. The
  current one points at the placeholder SVG.

---

## Editing quick reference

| To change | Where |
|---|---|
| Colours, fonts, logo | Admin → Brand & colours |
| Any heading or paragraph | Admin → Words on the site |
| Dishes, prices, tags | Admin → Menu |
| Today's deal, weekly deals | Admin → Deals & promotions |
| A limited-time promotion | Admin → Deals & promotions |
| Featured dishes, their photos or videos | Admin → Special section |
| Opening hours | Admin → Hours & contact |
| Phone, address, email, socials | Admin → Hours & contact |
| Ordering and reservation links | Admin → Hours & contact |
| Upload a photo or video | Admin → Photos & videos |
| The admin password | Admin → Password |

Everything above is also editable by hand in `content/*.json` if you'd rather.

Closing times after midnight are written by counting past 24 — `"26:00"` means
2 AM. The open/closed badge and the hours table both read that correctly.

---

## Browser support

Chrome, Edge, Firefox and Safari, current and previous versions, desktop and
mobile. No JavaScript build step or transpiler. If JavaScript is disabled the
page structure and contact details still render; the menu list and deals do not.
