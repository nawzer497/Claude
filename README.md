# The Madras Diaries — website

A rebuild of themadrasdiaries.ca: same Madras kitchen, modern front end.
Static HTML/CSS/JS — no build step, no framework, no database. Open
`index.html` in a browser and it runs.

---

## What's here

```
index.html            Home — hero video, daily deals, signatures, story, hours
menu.html             Full menu with search, dietary filters and two layouts
data/site.js          ← contact details, hours, ordering links
data/deals.js         ← daily deals and limited-time promotions
data/menu.js          ← every dish, price and tag
assets/css/styles.css Design system and all page styles
assets/js/app.js      Hours logic, deals engine, hero video, nav
assets/js/menu.js     Menu search, filters, view modes, scrollspy
assets/img/*.svg      Placeholder artwork and the brand mark
assets/video/         Hero video goes here
```

**The three files in `data/` are the ones you edit.** Everything on the site
reads from them. Each has instructions at the top. You don't need to touch the
HTML to change a price, a deal, or your phone number.

---

## The four things you asked for

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

### 4. New look

Drawn from South Indian visual language rather than generic restaurant
template: banana-leaf green, turmeric, kumkum red and filter-coffee brown on a
rice-batter cream, with the kolam dot lattice as a repeating texture. Section
headings carry their Tamil name. Fraunces for display, Inter for text.

Also in the rebuild: a live **Open now / Closing soon / Closed** badge computed
from your real hours, a sticky Order / Menu / Deals / Call bar on mobile, and
Restaurant schema markup so Google can show your hours, rating and menu link
directly in search results.

---

## Before this goes live

1. **Check every price.** 14 of the 47 dishes were cross-referenced against
   your public DoorDash and directory listings in September 2026 and are marked
   `checked: true` in `data/menu.js`. **The rest are estimates and must be
   confirmed against your till.** Dish descriptions were written for this site
   and should be read through — correct anything that misdescribes a dish.
2. **Set your ordering links** in `data/site.js`. The Uber Eats and Skip fields
   are empty, so those buttons don't render. Add a URL and the button appears.
   The "Order Direct" link currently points at `/order` — point it at your real
   ordering system or remove it.
3. **Confirm your hours** in `data/site.js`. They came from public listings.
4. **Check the email address.** `hello@themadrasdiaries.ca` is a placeholder.
5. **Replace the artwork.** The SVGs in `assets/img/` are abstract placeholders,
   not photographs. Real food photography will do more for this site than any
   other single change — the layout is built for it.
6. **Review the story copy** in `index.html` under `id="story"`. It's written
   from what's publicly known about the restaurant; it should be replaced with
   the actual story.
7. **The guest quotes** in the reviews section are drawn from public review
   summaries and are not attributed to named individuals. Either replace them
   with quotes you have permission to use, or swap the section for a live
   Google reviews widget.

---

## Deploying

It's static files, so anything will host it:

- **Netlify / Cloudflare Pages / Vercel** — drag the folder in, or connect this
  repo. Free tier is plenty.
- **Any web host** — upload the folder to the web root over FTP.

The current site runs on WordPress. If you want to stay on WordPress, this same
HTML and CSS converts into a theme — the markup is clean and the content is
already separated into data files, which map onto custom post types for menu
items and deals.

### Recommended follow-ups

- **Self-host the fonts** instead of loading them from Google Fonts. Faster,
  and it keeps visitor data out of a third party's hands.
- **Add real photography** and swap the SVG placeholders.
- **Add an `og:image`** — a real photo, 1200×630, for link previews. The
  current one points at the placeholder SVG.

---

## Editing quick reference

| To change | Edit |
|---|---|
| Phone, address, email, socials | `data/site.js` |
| Opening hours | `data/site.js` → `hours` |
| Uber Eats / DoorDash / Skip links | `data/site.js` → `ordering` |
| Today's deal, weekly deals | `data/deals.js` → `weekly` |
| A limited-time promotion | `data/deals.js` → `promos` |
| Dish names, prices, descriptions | `data/menu.js` |
| Hide a dish temporarily | `data/menu.js` → add `hidden: true` |
| Colours and fonts | `assets/css/styles.css` → `:root` |

Closing times after midnight are written by counting past 24 — `"26:00"` means
2 AM. The open/closed badge and the hours table both read that correctly.

---

## Browser support

Chrome, Edge, Firefox and Safari, current and previous versions, desktop and
mobile. No JavaScript build step or transpiler. If JavaScript is disabled the
page structure and contact details still render; the menu list and deals do not.
