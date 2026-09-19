/* ==========================================================================
   Content loader — The Madras Diaries
   --------------------------------------------------------------------------
   Reads the JSON in content/, applies the saved theme, then loads the page
   scripts. On any HTTP host (including a plain static one) the JSON is just
   a file, so the admin's saves show up straight away.

   Opened straight off disk with file://, fetch is blocked, so the bundled
   copies in data/ are used instead. Those are a snapshot — see README.
   ========================================================================== */
(function () {
  "use strict";

  var DOCS = ["theme", "site", "text", "menu", "deals", "specials"];
  var GLOBAL = { theme: "THEME", site: "SITE", text: "TEXT",
                 menu: "MENU", deals: "DEALS", specials: "SPECIALS" };

  /* Which page scripts to run once the content is in. */
  var scripts = (document.currentScript && document.currentScript.dataset.scripts || "")
    .split(",").map(function (s) { return s.trim(); }).filter(Boolean);

  function applyTheme(theme) {
    if (!theme) return;
    var root = document.documentElement;
    var map = {
      gold: "--gold", goldLight: "--gold-light", goldDeep: "--gold-deep",
      clay: "--clay", clayLight: "--clay-2", clayDeep: "--clay-deep",
      slate: "--slate", slateDeep: "--slate-deep",
      ink: "--ink", cream: "--cream", text: "--text",
    };
    Object.keys(theme.colors || {}).forEach(function (k) {
      if (map[k] && theme.colors[k]) root.style.setProperty(map[k], theme.colors[k]);
    });

    if (theme.fonts) {
      if (theme.fonts.display) root.style.setProperty("--font-display", '"' + theme.fonts.display + '", Georgia, serif');
      if (theme.fonts.body) root.style.setProperty("--font-body", '"' + theme.fonts.body + '", system-ui, sans-serif');
      loadFonts(theme.fonts);
    }

    /* The hero video path lives with the theme; the rest of the site reads it
       off SITE, so put it back where app.js expects it. */
    if (theme.heroVideo && window.SITE) window.SITE.heroVideo = theme.heroVideo;

    document.querySelectorAll("[data-logo]").forEach(function (img) {
      if (theme.logo) img.src = theme.logo;
    });
  }

  function loadFonts(fonts) {
    var families = [fonts.display, fonts.body].filter(Boolean)
      .map(function (f) { return f.replace(/ /g, "+") + ":wght@400..700"; });
    if (!families.length) return;
    var href = "https://fonts.googleapis.com/css2?family=" + families.join("&family=") + "&display=swap";
    var existing = document.getElementById("theme-fonts");
    if (existing && existing.href === href) return;
    var link = existing || document.createElement("link");
    link.id = "theme-fonts";
    link.rel = "stylesheet";
    link.href = href;
    if (!existing) document.head.appendChild(link);
  }

  function runScripts() {
    scripts.reduce(function (chain, src) {
      return chain.then(function () {
        return new Promise(function (resolve) {
          var s = document.createElement("script");
          s.src = src;
          s.onload = s.onerror = resolve;
          document.body.appendChild(s);
        });
      });
    }, Promise.resolve());
  }

  function assign(name, value) {
    if (value != null) window[GLOBAL[name]] = value;
  }

  function start() {
    /* menu.json wraps the list; the page wants the array itself. */
    if (window.MENU && window.MENU.categories) window.MENU = window.MENU.categories;
    applyTheme(window.THEME);
    runScripts();
  }

  /* Fallback globals are already on window from data/*.js if those were
     included; fetch overwrites them when it succeeds. */
  Promise.all(DOCS.map(function (d) {
    return fetch("content/" + d + ".json", { cache: "no-cache" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { assign(d, j); })
      .catch(function () { /* file:// or missing — keep the bundled copy */ });
  })).then(start, start);
})();
