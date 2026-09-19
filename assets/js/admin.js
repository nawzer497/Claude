/* ==========================================================================
   Admin — The Madras Diaries
   Loads the JSON documents from the server, renders an editor for each, and
   PUTs them back. Nothing is written until you press Save.
   ========================================================================== */
(function () {
  "use strict";

  var DOCS = ["theme", "site", "text", "menu", "deals", "specials"];
  var data = {};        /* the saved state, as last read from the server */
  var draft = {};       /* what the editor is changing */
  var dirty = false;
  var currentTab = "brand";

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  var DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var TAGS = { veg: "Vegetarian", vegan: "Vegan", gf: "Gluten-free", nuts: "Contains nuts",
               popular: "Guest favourite", chef: "Chef's pick", new: "New" };

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  var clone = function (o) { return JSON.parse(JSON.stringify(o)); };

  /* ------------------------------------------------------------------ api */
  function api(path, opts) {
    return fetch(path, Object.assign({ credentials: "same-origin" }, opts))
      .then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (body) {
          if (!r.ok) throw new Error(body.error || ("Request failed (" + r.status + ")"));
          return body;
        });
      });
  }

  /* ---------------------------------------------------------------- state */
  function markDirty(on) {
    dirty = on !== false;
    $("#save").disabled = !dirty;
    $("#revert").disabled = !dirty;
    setMsg(dirty ? "Unsaved changes" : "No unsaved changes", dirty ? "warn" : "");
  }
  function setMsg(text, kind) {
    var el = $("#save-msg");
    el.textContent = text;
    if (kind) el.setAttribute("data-kind", kind); else el.removeAttribute("data-kind");
  }

  /* Set a nested value like "colors.gold" on the draft. */
  function setPath(obj, path, value) {
    var parts = path.split("."), o = obj;
    for (var i = 0; i < parts.length - 1; i++) {
      if (o[parts[i]] == null || typeof o[parts[i]] !== "object") o[parts[i]] = {};
      o = o[parts[i]];
    }
    o[parts[parts.length - 1]] = value;
  }
  function getPath(obj, path) {
    return path.split(".").reduce(function (o, k) { return o == null ? o : o[k]; }, obj);
  }

  /* Any input carrying data-doc + data-path writes straight into the draft. */
  document.addEventListener("input", function (e) {
    var el = e.target.closest("[data-doc][data-path]");
    if (!el) return;
    var value = el.type === "checkbox" ? el.checked
              : el.type === "number" ? (el.value === "" ? null : Number(el.value))
              : el.value;
    setPath(draft[el.dataset.doc], el.dataset.path, value);
    /* Keep a paired colour swatch and hex field in step. */
    if (el.dataset.pair) {
      var mate = $('[data-pair="' + el.dataset.pair + '"]:not([data-self="' + el.dataset.self + '"])');
      if (mate && mate.value !== el.value) mate.value = el.value;
    }
    markDirty(true);
  });

  /* ------------------------------------------------------------- field UI */
  function field(doc, path, label, opts) {
    opts = opts || {};
    var v = getPath(draft[doc], path);
    var common = 'data-doc="' + doc + '" data-path="' + esc(path) + '"';
    var input;
    if (opts.type === "textarea") {
      input = '<textarea ' + common + (opts.rows ? ' rows="' + opts.rows + '"' : "") + '>' + esc(v) + "</textarea>";
    } else if (opts.type === "select") {
      input = "<select " + common + ">" + opts.options.map(function (o) {
        return '<option value="' + esc(o[0]) + '"' + (String(v) === String(o[0]) ? " selected" : "") + ">" + esc(o[1]) + "</option>";
      }).join("") + "</select>";
    } else if (opts.type === "color") {
      var id = doc + "-" + path.replace(/\W/g, "-");
      input = '<div class="color-row">' +
        '<input type="color" value="' + esc(v) + '" ' + common + ' data-pair="' + id + '" data-self="a">' +
        '<input type="text" value="' + esc(v) + '" ' + common + ' data-pair="' + id + '" data-self="b" spellcheck="false">' +
      "</div>";
    } else {
      input = '<input type="' + (opts.type || "text") + '" value="' + esc(v) + '" ' + common +
              (opts.placeholder ? ' placeholder="' + esc(opts.placeholder) + '"' : "") + ">";
    }
    return '<label class="f"><span>' + esc(label) + "</span>" + input +
           (opts.hint ? '<p class="hint">' + esc(opts.hint) + "</p>" : "") + "</label>";
  }

  /* ------------------------------------------------------------- 1. BRAND */
  function paneBrand() {
    var c = draft.theme.colors;
    var swatches = [
      ["gold", "Gold — buttons, headings"], ["goldLight", "Gold light — accents on dark"],
      ["goldDeep", "Gold deep"], ["clay", "Terracotta — primary accent"],
      ["clayLight", "Terracotta light (hover)"], ["clayDeep", "Terracotta deep"],
      ["slate", "Slate blue"], ["slateDeep", "Slate deep"],
      ["ink", "Ink — dark sections"], ["cream", "Cream — page background"],
      ["text", "Body text"],
    ].filter(function (p) { return c[p[0]] !== undefined; });

    return '<div class="card"><h3>Colours</h3>' +
      '<p class="hint" style="margin:-.5rem 0 1rem">These are the three colours from your logo. Changing one updates the whole site.</p>' +
      '<div class="grid grid--3">' + swatches.map(function (p) {
        return field("theme", "colors." + p[0], p[1], { type: "color" });
      }).join("") + "</div></div>" +

      '<div class="card"><h3>Logo</h3><div class="grid grid--2">' +
        '<div><img class="thumb" src="' + esc(draft.theme.logo) + '" alt="" style="object-fit:contain;background:#fff"></div>' +
        "<div>" + field("theme", "logo", "Logo image path", { hint: "Upload a new one under Photos & videos, then paste its path here." }) +
        mediaPicker("theme", "logo") + "</div>" +
      "</div></div>" +

      '<div class="card"><h3>Fonts</h3><div class="grid grid--2">' +
        field("theme", "fonts.display", "Headings font", { type: "select", options: [
          ["Fraunces", "Fraunces (serif)"], ["Playfair Display", "Playfair Display (serif)"],
          ["Cormorant Garamond", "Cormorant Garamond (serif)"], ["Poppins", "Poppins (sans)"]] }) +
        field("theme", "fonts.body", "Body font", { type: "select", options: [
          ["Inter", "Inter"], ["Poppins", "Poppins"], ["Work Sans", "Work Sans"], ["Lato", "Lato"]] }) +
      "</div></div>" +

      '<div class="card"><h3>Hero video</h3>' +
      '<p class="hint" style="margin:-.5rem 0 1rem">The looping video behind the headline. Leave blank to show the still image instead.</p>' +
      '<div class="grid grid--2">' +
        field("theme", "heroVideo.mp4", "MP4 file", { hint: "Best compatibility — needed for iPhone and Safari." }) +
        field("theme", "heroVideo.webm", "WebM file", { hint: "Optional. Smaller on Chrome and Firefox." }) +
      "</div>" + mediaPicker("theme", "heroVideo.mp4", "video") + "</div>";
  }

  /* -------------------------------------------------------------- 2. TEXT */
  function paneText() {
    var t = draft.text;
    var groups = [
      ["Hero", [["heroTitleA", "Headline, first part"], ["heroTitleEm", "Headline, highlighted word"],
                ["heroTitleB", "Headline, last part"], ["heroLede", "Headline paragraph", "textarea"]]],
      ["Rotating ring", [["ringText", "Text that circles the plate", "textarea"]]],
      ["About", [["aboutEyebrow", "Small label above the heading"], ["aboutTitle", "Heading"],
                 ["aboutLede", "Opening paragraph", "textarea"], ["aboutBody1", "Second paragraph", "textarea"],
                 ["aboutBody2", "Third paragraph", "textarea"]]],
      ["Signature dishes", [["signaturesEyebrow", "Small label"], ["signaturesTitle", "Heading"]]],
      ["Deals section", [["dealsEyebrow", "Small label"], ["dealsTitle", "Heading"], ["dealsLede", "Intro", "textarea"]]],
      ["Special section", [["specialsEyebrow", "Small label"], ["specialsTitle", "Heading"], ["specialsLede", "Intro", "textarea"]]],
      ["Visit", [["visitTitle", "Heading"], ["visitLede", "Intro", "textarea"]]],
    ];
    return groups.map(function (g) {
      return '<div class="card"><h3>' + esc(g[0]) + '</h3><div class="grid">' +
        g[1].filter(function (f) { return t[f[0]] !== undefined; })
            .map(function (f) { return field("text", f[0], f[1], { type: f[2] }); }).join("") +
      "</div></div>";
    }).join("");
  }

  /* -------------------------------------------------------------- 3. MENU */
  function paneMenu() {
    var cats = draft.menu.categories;
    return '<div class="card"><h3>Menu</h3>' +
      '<p class="hint">Drag isn\'t needed — use the arrows to reorder. Changes are saved only when you press Save.</p>' +
      '<p style="margin-top:.9rem"><button class="btn btn--sm" data-act="cat-add">+ Add a section</button></p></div>' +
      cats.map(function (cat, ci) {
        return '<details class="cat"' + (ci === 0 ? " open" : "") + '><summary>' + esc(cat.name) +
          '<span class="count">' + cat.items.length + " dishes</span></summary><div>" +
          '<div class="grid grid--3" style="margin-bottom:.9rem">' +
            field("menu", "categories." + ci + ".name", "Section name") +
            field("menu", "categories." + ci + ".tamil", "Tamil name") +
            field("menu", "categories." + ci + ".id", "URL id", { hint: "Letters and dashes only." }) +
          "</div>" +
          field("menu", "categories." + ci + ".blurb", "Section intro", { type: "textarea", rows: 2 }) +
          '<div style="display:flex;gap:.3rem;margin:.8rem 0">' +
            '<button class="btn btn--sm" data-act="cat-up" data-ci="' + ci + '">↑ Move up</button>' +
            '<button class="btn btn--sm" data-act="cat-down" data-ci="' + ci + '">↓ Move down</button>' +
            '<button class="btn btn--sm btn--danger" data-act="cat-del" data-ci="' + ci + '">Delete section</button>' +
          "</div><hr style='border:0;border-top:1px solid var(--a-line);margin:.9rem 0'>" +
          cat.items.map(function (it, ii) { return itemRow(ci, ii, it); }).join("") +
          '<button class="btn btn--sm" data-act="item-add" data-ci="' + ci + '">+ Add a dish</button>' +
        "</div></details>";
      }).join("");
  }

  function itemRow(ci, ii, it) {
    var base = "categories." + ci + ".items." + ii;
    var tags = it.tags || [];
    return '<div class="row" data-collapsed="true"><div class="row__head">' +
      '<strong>' + esc(it.name || "(untitled)") + "</strong>" +
      '<span class="hint">' + esc(it.priceText ? "$" + it.priceText : "$" + (it.price != null ? it.price : "")) + "</span>" +
      '<span class="row__tools">' +
        '<button class="btn btn--sm" data-act="item-toggle">Edit</button>' +
        '<button class="btn btn--sm" data-act="item-up" data-ci="' + ci + '" data-ii="' + ii + '">↑</button>' +
        '<button class="btn btn--sm" data-act="item-down" data-ci="' + ci + '" data-ii="' + ii + '">↓</button>' +
        '<button class="btn btn--sm btn--danger" data-act="item-del" data-ci="' + ci + '" data-ii="' + ii + '">Delete</button>' +
      "</span></div>" +
      '<div class="row__body">' +
        '<div class="grid grid--3">' +
          field("menu", base + ".name", "Dish name") +
          field("menu", base + ".price", "Price (number)", { type: "number", hint: "Used for sorting and Google." }) +
          field("menu", base + ".priceText", "Shown instead (optional)", { placeholder: "19 / 31" }) +
        "</div>" +
        field("menu", base + ".note", "Small note under the name", { placeholder: "Lamb or Chicken" }) +
        field("menu", base + ".desc", "Description", { type: "textarea", rows: 2 }) +
        '<div class="grid grid--2" style="margin-top:.9rem">' +
          '<div><span style="display:block;font-size:.78rem;font-weight:600;color:var(--a-muted);margin-bottom:.3rem">Tags</span>' +
            Object.keys(TAGS).map(function (t) {
              return '<label style="display:inline-flex;align-items:center;gap:.3rem;margin:0 .7rem .35rem 0;font-size:.85rem">' +
                '<input type="checkbox" data-act="tag" data-ci="' + ci + '" data-ii="' + ii + '" value="' + t + '"' +
                (tags.indexOf(t) !== -1 ? " checked" : "") + "> " + esc(TAGS[t]) + "</label>";
            }).join("") + "</div>" +
          field("menu", base + ".heat", "Spice (0–3)", { type: "select", options: [
            ["", "Not spicy"], ["1", "1 — mild"], ["2", "2 — medium"], ["3", "3 — hot"]] }) +
        "</div>" +
      "</div></div>";
  }

  /* ------------------------------------------------------------- 4. DEALS */
  function paneDeals() {
    var w = draft.deals.weekly, promos = draft.deals.promos || [];
    return '<div class="card"><h3>Weekly deals</h3>' +
      '<p class="hint">One standing deal per day. The site works out what day it is and shows today\'s automatically.</p></div>' +
      DAY_KEYS.map(function (k, i) {
        var d = w[k] || {};
        return '<div class="row"><div class="row__head"><strong>' + DAY_NAMES[i] + "</strong>" +
          '<label style="font-size:.85rem;display:flex;align-items:center;gap:.35rem">' +
            '<input type="checkbox" data-doc="deals" data-path="weekly.' + k + '.active"' +
            (d.active ? " checked" : "") + "> Running</label>" +
          '<span class="row__tools"><button class="btn btn--sm" data-act="item-toggle">Edit</button></span></div>' +
          '<div class="row__body"><div class="grid grid--2">' +
            field("deals", "weekly." + k + ".tag", "Badge") +
            field("deals", "weekly." + k + ".title", "Deal name") +
            field("deals", "weekly." + k + ".price", "Price or saving", { placeholder: "$26 or 50% off" }) +
            field("deals", "weekly." + k + ".times", "When", { placeholder: "5:00 PM – close" }) +
          "</div>" +
          field("deals", "weekly." + k + ".detail", "Description", { type: "textarea", rows: 2 }) +
          field("deals", "weekly." + k + ".terms", "Small print") +
        "</div></div>";
      }).join("") +

      '<div class="card" style="margin-top:1.5rem"><h3>Limited-time promotions</h3>' +
      '<p class="hint">These show a countdown and disappear on their own once the end date passes.</p>' +
      '<p style="margin-top:.9rem"><button class="btn btn--sm" data-act="promo-add">+ Add a promotion</button></p></div>' +
      promos.map(function (p, i) {
        return '<div class="row"><div class="row__head"><strong>' + esc(p.title || "(untitled)") + "</strong>" +
          '<label style="font-size:.85rem;display:flex;align-items:center;gap:.35rem">' +
            '<input type="checkbox" data-doc="deals" data-path="promos.' + i + '.active"' +
            (p.active ? " checked" : "") + "> Running</label>" +
          '<span class="row__tools"><button class="btn btn--sm" data-act="item-toggle">Edit</button>' +
          '<button class="btn btn--sm btn--danger" data-act="promo-del" data-i="' + i + '">Delete</button></span></div>' +
          '<div class="row__body"><div class="grid grid--2">' +
            field("deals", "promos." + i + ".tag", "Badge") +
            field("deals", "promos." + i + ".title", "Promotion name") +
            field("deals", "promos." + i + ".price", "Price or saving") +
            field("deals", "promos." + i + ".start", "Starts", { type: "date" }) +
            field("deals", "promos." + i + ".end", "Ends", { type: "date" }) +
            field("deals", "promos." + i + ".cta.label", "Button text") +
            field("deals", "promos." + i + ".cta.url", "Button link") +
          "</div>" + field("deals", "promos." + i + ".detail", "Description", { type: "textarea", rows: 2 }) +
          '<div class="grid grid--2" style="margin-top:.9rem">' +
            field("deals", "promos." + i + ".image", "Promotional photo") +
            '<div><img class="thumb" src="' + esc(p.image || "") + '" alt="" onerror="this.style.visibility=\'hidden\'"></div>' +
          "</div>" + mediaPicker("deals", "promos." + i + ".image") +
        "</div></div>";
      }).join("");
  }

  /* ---------------------------------------------------------- 5. SPECIALS */
  function paneSpecials() {
    var items = draft.specials.items || [];
    return '<div class="card"><h3>The special section</h3>' +
      '<p class="hint">The four featured dishes on the home page. Each can show a photo or a video.</p>' +
      '<p style="margin-top:.9rem"><button class="btn btn--sm" data-act="special-add">+ Add a feature</button></p></div>' +
      items.map(function (s, i) {
        var isVid = s.type === "video";
        return '<div class="row"><div class="row__head"><strong>' + esc(s.title || "(untitled)") + "</strong>" +
          '<span class="hint">' + (isVid ? "video" : "photo") + "</span>" +
          '<span class="row__tools"><button class="btn btn--sm" data-act="item-toggle">Edit</button>' +
          '<button class="btn btn--sm" data-act="special-up" data-i="' + i + '">↑</button>' +
          '<button class="btn btn--sm" data-act="special-down" data-i="' + i + '">↓</button>' +
          '<button class="btn btn--sm btn--danger" data-act="special-del" data-i="' + i + '">Delete</button></span></div>' +
          '<div class="row__body"><div class="grid grid--2">' +
            field("specials", "items." + i + ".title", "Dish name") +
            field("specials", "items." + i + ".price", "Price") +
            field("specials", "items." + i + ".badge", "Badge") +
            field("specials", "items." + i + ".type", "Media type", { type: "select",
              options: [["image", "Photo"], ["video", "Video"]] }) +
          "</div>" +
          field("specials", "items." + i + ".desc", "Description", { type: "textarea", rows: 2 }) +
          '<div class="grid grid--2" style="margin-top:.9rem">' +
            field("specials", "items." + i + ".media", "Photo or video file") +
            "<div>" + (isVid
              ? '<video class="thumb" src="' + esc(s.media) + '" muted playsinline></video>'
              : '<img class="thumb" src="' + esc(s.media) + '" alt="" onerror="this.style.visibility=\'hidden\'">') + "</div>" +
          "</div>" + mediaPicker("specials", "items." + i + ".media") +
        "</div></div>";
      }).join("") +
      '<div class="card" style="margin-top:1.5rem"><h3>Rotating plate</h3>' +
        '<div class="grid grid--2">' +
          field("specials", "plateImage", "Plate image", { hint: "The banana-leaf plate that rotates. A PNG with a transparent background works best." }) +
          '<div><img class="thumb" src="' + esc(draft.specials.plateImage || "") + '" alt="" style="object-fit:contain"></div>' +
        "</div>" + mediaPicker("specials", "plateImage") + "</div>";
  }

  /* ------------------------------------------------------------- 6. HOURS */
  function paneHours() {
    var s = draft.site;
    return '<div class="card"><h3>Opening hours</h3>' +
      '<p class="hint">24-hour clock. For a closing time after midnight keep counting up — 2:00 AM is 26:00. Leave both blank to show the day as closed.</p>' +
      '<div class="grid" style="margin-top:1rem">' + DAY_KEYS.map(function (k, i) {
        return '<div style="display:grid;grid-template-columns:120px 1fr 1fr;gap:.6rem;align-items:end">' +
          '<span style="font-size:.85rem;font-weight:600;padding-bottom:.6rem">' + DAY_NAMES[i] + "</span>" +
          field("site", "hours." + k + ".open", "Opens", { placeholder: "11:30" }) +
          field("site", "hours." + k + ".close", "Closes", { placeholder: "24:00" }) +
        "</div>";
      }).join("") + "</div>" +
      field("site", "hoursNote", "Note under the hours") + "</div>" +

      '<div class="card"><h3>Contact</h3><div class="grid grid--2">' +
        field("site", "name", "Restaurant name") +
        field("site", "strapline", "Strapline") +
        field("site", "phone", "Phone (as shown)") +
        field("site", "phoneDial", "Phone (for the call button)", { hint: "Include the country code: +1604..." }) +
        field("site", "email", "Email", { type: "email" }) +
        field("site", "address", "Street address") +
        field("site", "addressLine2", "City and postcode") +
        field("site", "mapsUrl", "Google Maps link") +
      "</div></div>" +

      '<div class="card"><h3>Links</h3><div class="grid grid--2">' +
        field("site", "reservationUrl", "Reservation system", { hint: "Empty means the Reservation buttons dial the restaurant." }) +
        field("site", "newsletterUrl", "Newsletter form action", { hint: "From Mailchimp or similar. Empty hides the sign-up form." }) +
        field("site", "ordering.direct.url", "Order Direct link") +
        field("site", "ordering.uberEats.url", "Uber Eats link") +
        field("site", "ordering.doordash.url", "DoorDash link") +
        field("site", "ordering.skip.url", "SkipTheDishes link") +
        field("site", "social.instagram", "Instagram") +
        field("site", "social.facebook", "Facebook") +
      "</div><p class=\"hint\">An empty link hides that button everywhere on the site.</p></div>" +

      '<div class="card"><h3>Kitchen</h3><div class="grid grid--2">' +
        '<label class="f"><span>Halal certified</span><label style="display:flex;align-items:center;gap:.4rem">' +
          '<input type="checkbox" data-doc="site" data-path="halal"' + (s.halal ? " checked" : "") +
          "> Show the Halal badge</label></label>" +
        field("site", "rating", "Average rating") +
        field("site", "reviewCount", "Number of reviews") +
      "</div></div>";
  }

  /* ------------------------------------------------------------- 7. MEDIA */
  function paneMedia() {
    return '<div class="card"><h3>Upload</h3>' +
      '<div class="drop" id="drop"><p><strong>Drop photos or videos here</strong></p>' +
      '<p class="hint">JPG, PNG, WebP, GIF, SVG, MP4 or WebM. Up to 60&nbsp;MB each.</p>' +
      '<p style="margin-top:.8rem"><button class="btn" type="button" id="pick">Choose files</button></p>' +
      '<input type="file" id="file" multiple accept="image/*,video/mp4,video/webm" hidden></div>' +
      '<p class="hint" id="upload-status" style="margin-top:.7rem"></p></div>' +
      '<div class="card"><h3>Library</h3><div class="media-grid" id="library"><p class="hint">Loading…</p></div></div>';
  }

  function mediaPicker(doc, path, kind) {
    return '<p style="margin-top:.5rem"><button class="btn btn--sm" data-act="pick-media" ' +
      'data-target-doc="' + doc + '" data-target-path="' + esc(path) + '" data-kind="' + (kind || "any") + '">' +
      "Choose from library</button></p>";
  }

  /* ----------------------------------------------------------- 8. ACCOUNT */
  function paneAccount() {
    return '<div class="card"><h3>Change the admin password</h3>' +
      '<div class="grid grid--2" style="max-width:520px">' +
        '<label class="f"><span>Current password</span><input type="password" id="pw-current" autocomplete="current-password"></label>' +
        '<label class="f"><span>New password</span><input type="password" id="pw-next" autocomplete="new-password"></label>' +
      "</div>" +
      '<p class="hint">At least 8 characters. Everyone signed in stays signed in until the server restarts.</p>' +
      '<p style="margin-top:1rem"><button class="btn btn--primary" id="pw-save">Change password</button> ' +
      '<span id="pw-msg" class="hint"></span></p></div>' +
      '<div class="card"><h3>How saving works</h3>' +
      '<p class="hint">Save writes the JSON files in <code>content/</code> on the server. The previous version of each file is kept as <code>.bak</code>, so a bad edit can be undone by restoring it.</p></div>';
  }

  /* ------------------------------------------------------------- rendering */
  var PANES = {
    brand:    { title: "Brand & colours", intro: "Your logo colours, fonts and the hero video.", render: paneBrand },
    text:     { title: "Words on the site", intro: "Every heading and paragraph on the home page.", render: paneText },
    menu:     { title: "Menu", intro: "All sections and dishes, with prices, tags and spice levels.", render: paneMenu },
    deals:    { title: "Deals & promotions", intro: "A standing deal for each day, plus limited-time promotions with a countdown.", render: paneDeals },
    specials: { title: "Special section", intro: "The featured dishes, their photos or videos, and the rotating plate.", render: paneSpecials },
    hours:    { title: "Hours & contact", intro: "Opening times, contact details and every external link.", render: paneHours },
    media:    { title: "Photos & videos", intro: "Upload images and video, then use them anywhere on the site.", render: paneMedia },
    account:  { title: "Password", intro: "Change the password used to sign in here.", render: paneAccount },
  };

  function renderPane(tab) {
    currentTab = tab;
    var p = PANES[tab];
    $("#pane-title").textContent = p.title;
    $("#pane-intro").textContent = p.intro;
    $("#pane").innerHTML = p.render();
    $$("#tabs button").forEach(function (b) {
      b.setAttribute("aria-current", String(b.dataset.tab === tab));
    });
    if (tab === "media") initMedia();
    window.scrollTo(0, 0);
  }

  /* ---------------------------------------------------------------- clicks */
  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-act]");
    if (!btn) return;
    var act = btn.dataset.act;
    var ci = +btn.dataset.ci, ii = +btn.dataset.ii, i = +btn.dataset.i;
    var cats = draft.menu && draft.menu.categories;

    if (act === "item-toggle") {
      e.preventDefault();
      var row = btn.closest(".row");
      row.dataset.collapsed = row.dataset.collapsed === "true" ? "false" : "true";
      btn.textContent = row.dataset.collapsed === "true" ? "Edit" : "Close";
      return;
    }

    var move = function (arr, from, to) {
      if (to < 0 || to >= arr.length) return false;
      arr.splice(to, 0, arr.splice(from, 1)[0]);
      return true;
    };

    if (act === "cat-add") {
      cats.push({ id: "section-" + (cats.length + 1), name: "New section", tamil: "", blurb: "", items: [] });
    } else if (act === "cat-del") {
      if (!confirm('Delete "' + cats[ci].name + '" and all ' + cats[ci].items.length + " dishes in it?")) return;
      cats.splice(ci, 1);
    } else if (act === "cat-up") { if (!move(cats, ci, ci - 1)) return; }
    else if (act === "cat-down") { if (!move(cats, ci, ci + 1)) return; }
    else if (act === "item-add") { cats[ci].items.push({ name: "New dish", price: 0, desc: "" }); }
    else if (act === "item-del") {
      if (!confirm('Delete "' + cats[ci].items[ii].name + '"?')) return;
      cats[ci].items.splice(ii, 1);
    }
    else if (act === "item-up") { if (!move(cats[ci].items, ii, ii - 1)) return; }
    else if (act === "item-down") { if (!move(cats[ci].items, ii, ii + 1)) return; }
    else if (act === "promo-add") {
      var today = new Date().toISOString().slice(0, 10);
      draft.deals.promos.push({ active: true, tag: "New", title: "New promotion", detail: "",
        price: "", start: today, end: today, cta: { label: "", url: "" } });
    }
    else if (act === "promo-del") {
      if (!confirm("Delete this promotion?")) return;
      draft.deals.promos.splice(i, 1);
    }
    else if (act === "special-add") {
      draft.specials.items.push({ title: "New feature", price: "", badge: "", desc: "", media: "", type: "image" });
    }
    else if (act === "special-del") {
      if (!confirm("Delete this feature?")) return;
      draft.specials.items.splice(i, 1);
    }
    else if (act === "special-up") { if (!move(draft.specials.items, i, i - 1)) return; }
    else if (act === "special-down") { if (!move(draft.specials.items, i, i + 1)) return; }
    else if (act === "pick-media") {
      e.preventDefault();
      openLibrary(btn.dataset.targetDoc, btn.dataset.targetPath, btn.dataset.kind);
      return;
    }
    else { return; }

    e.preventDefault();
    markDirty(true);
    renderPane(currentTab);
  });

  /* Tag checkboxes maintain an array, so they're handled apart from data-path. */
  document.addEventListener("change", function (e) {
    var cb = e.target.closest('[data-act="tag"]');
    if (!cb) return;
    var it = draft.menu.categories[+cb.dataset.ci].items[+cb.dataset.ii];
    it.tags = it.tags || [];
    var at = it.tags.indexOf(cb.value);
    if (cb.checked && at === -1) it.tags.push(cb.value);
    if (!cb.checked && at !== -1) it.tags.splice(at, 1);
    markDirty(true);
  });

  /* ---------------------------------------------------------------- media */
  function initMedia() {
    var input = $("#file"), drop = $("#drop");
    $("#pick").addEventListener("click", function () { input.click(); });
    input.addEventListener("change", function () { upload(input.files); });
    ["dragenter", "dragover"].forEach(function (ev) {
      drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add("is-over"); });
    });
    ["dragleave", "drop"].forEach(function (ev) {
      drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove("is-over"); });
    });
    drop.addEventListener("drop", function (e) { upload(e.dataTransfer.files); });
    loadLibrary();
  }

  function upload(files) {
    var list = Array.prototype.slice.call(files || []);
    if (!list.length) return;
    var status = $("#upload-status"), done = 0, failed = [];
    status.textContent = "Uploading 0 of " + list.length + "…";

    list.reduce(function (chain, file) {
      return chain.then(function () {
        return api("/api/media", {
          method: "POST",
          headers: { "Content-Type": file.type, "X-Filename": file.name },
          body: file,
        }).then(function () { done++; })
          .catch(function (err) { failed.push(file.name + ": " + err.message); });
      }).then(function () {
        status.textContent = "Uploading " + (done + failed.length) + " of " + list.length + "…";
      });
    }, Promise.resolve()).then(function () {
      status.textContent = done + " uploaded" + (failed.length ? ", " + failed.length + " failed — " + failed.join("; ") : ".");
      loadLibrary();
    });
  }

  function loadLibrary() {
    return api("/api/media").then(function (r) {
      var host = $("#library");
      if (!host) return r.files;
      host.innerHTML = r.files.length ? r.files.map(mediaTile).join("")
        : '<p class="hint">Nothing uploaded yet.</p>';
      return r.files;
    });
  }

  function mediaTile(p) {
    var isVid = /\.(mp4|webm)$/i.test(p);
    return '<div class="media-item">' +
      (isVid ? '<video src="' + esc(p) + '" muted playsinline></video>'
             : '<img src="' + esc(p) + '" alt="" loading="lazy">') +
      '<button type="button" data-copy="' + esc(p) + '">copy</button>' +
      "<span>" + esc(p.replace("content/media/", "")) + "</span></div>";
  }

  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-copy]");
    if (!b) return;
    navigator.clipboard && navigator.clipboard.writeText(b.dataset.copy);
    b.textContent = "copied";
    setTimeout(function () { b.textContent = "copy"; }, 1200);
  });

  /* A tiny picker so a field can take a file without retyping its path. */
  function openLibrary(doc, path, kind) {
    loadLibrary().then(function (files) {
      var pool = files.concat(defaultMedia());
      if (kind === "video") pool = pool.filter(function (f) { return /\.(mp4|webm)$/i.test(f); });
      if (!pool.length) { alert("No files yet. Upload some under Photos & videos."); return; }
      var pick = prompt("Paste or pick a file path:\n\n" + pool.join("\n"), getPath(draft[doc], path) || pool[0]);
      if (pick == null) return;
      setPath(draft[doc], path, pick.trim());
      markDirty(true);
      renderPane(currentTab);
    });
  }

  /* Files that ship with the site, so they show up alongside uploads. */
  function defaultMedia() {
    return ["assets/img/logo.png", "assets/img/food/plate-banana-leaf.png",
            "assets/img/food/chicken-banana-leaf.jpg", "assets/img/food/grilled-fish.jpg",
            "assets/img/food/biryani-pot.jpg", "assets/img/food/uthappam.jpg",
            "assets/video/hero.webm"];
  }

  /* ----------------------------------------------------------------- save */
  function save() {
    var changed = DOCS.filter(function (d) {
      return JSON.stringify(draft[d]) !== JSON.stringify(data[d]);
    });
    if (!changed.length) { markDirty(false); return; }
    setMsg("Saving…", "");
    $("#save").disabled = true;

    Promise.all(changed.map(function (d) {
      return api("/api/content/" + d, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft[d]),
      });
    })).then(function () {
      changed.forEach(function (d) { data[d] = clone(draft[d]); });
      markDirty(false);
      setMsg("Saved — " + changed.join(", "), "ok");
    }).catch(function (err) {
      $("#save").disabled = false;
      setMsg(err.message, "err");
    });
  }

  /* ----------------------------------------------------------------- boot */
  function loadAll() {
    return Promise.all(DOCS.map(function (d) {
      return api("/api/content/" + d).then(function (j) { data[d] = j; });
    })).then(function () {
      draft = {};
      DOCS.forEach(function (d) { draft[d] = clone(data[d]); });
    });
  }

  function showAdmin() {
    $("#login-view").hidden = true;
    $("#admin-view").hidden = false;
    loadAll().then(function () {
      renderPane("brand");
      markDirty(false);
    }).catch(function (e) {
      $("#pane").innerHTML = '<div class="banner banner--err">Could not load the content: ' + esc(e.message) + "</div>";
    });
  }

  function showLogin(message) {
    $("#admin-view").hidden = true;
    $("#login-view").hidden = false;
    if (message) { $("#login-error").hidden = false; $("#login-error").textContent = message; }
  }

  $("#login-form").addEventListener("submit", function (e) {
    e.preventDefault();
    $("#login-error").hidden = true;
    api("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: $("#login-password").value }),
    }).then(showAdmin)
      .catch(function (err) {
        $("#login-error").hidden = false;
        $("#login-error").textContent = err.message;
        $("#login-password").select();
      });
  });

  $("#logout").addEventListener("click", function () {
    if (dirty && !confirm("You have unsaved changes. Sign out anyway?")) return;
    api("/api/logout", { method: "POST" }).then(function () { location.reload(); });
  });

  $("#save").addEventListener("click", save);
  $("#revert").addEventListener("click", function () {
    if (!confirm("Discard every change since your last save?")) return;
    DOCS.forEach(function (d) { draft[d] = clone(data[d]); });
    markDirty(false);
    renderPane(currentTab);
  });

  $("#tabs").addEventListener("click", function (e) {
    var b = e.target.closest("[data-tab]");
    if (b) renderPane(b.dataset.tab);
  });

  /* Password change lives outside the draft/save cycle. */
  document.addEventListener("click", function (e) {
    if (!e.target.closest("#pw-save")) return;
    var msg = $("#pw-msg");
    api("/api/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ current: $("#pw-current").value, next: $("#pw-next").value }),
    }).then(function () {
      msg.textContent = "Password changed.";
      msg.style.color = "var(--a-green)";
      $("#pw-current").value = $("#pw-next").value = "";
    }).catch(function (err) {
      msg.textContent = err.message;
      msg.style.color = "var(--a-red)";
    });
  });

  window.addEventListener("beforeunload", function (e) {
    if (dirty) { e.preventDefault(); e.returnValue = ""; }
  });

  api("/api/session").then(function (s) {
    if (s.authenticated) showAdmin();
    else showLogin(s.configured ? "" : "No admin password is set yet. On the server run:  node server.js --set-password 'your-password'");
  }).catch(function () {
    showLogin("Can't reach the server. Start it with:  node server.js");
  });
})();
