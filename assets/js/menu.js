/* ==========================================================================
   Menu view — search, dietary filters, card/list modes, category scrollspy.
   Reads window.MENU from data/menu.js. Filter state lives in the URL so a
   link to "the vegan menu" is something you can actually text someone.
   ========================================================================== */
(function () {
  "use strict";

  var MENU = window.MENU || [];
  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var root = $("[data-menu-root]");
  if (!root) return;

  var TAG_LABELS = {
    veg:     "Vegetarian",
    vegan:   "Vegan",
    gf:      "Gluten-free",
    nuts:    "Contains nuts",
    popular: "Guest favourite",
    chef:    "Chef’s pick",
    new:     "New",
  };

  /* Only these appear as filter buttons. */
  var FILTERS = ["popular", "chef", "veg", "vegan", "gf", "new"];

  var state = {
    query: "",
    tags: [],
    view: localStorage.getItem("md-menu-view") || "cards",
  };

  /* The printed menu writes 18 and 2.5, not 18.00 — match it, and keep
     whole dollars consistent with split prices like "$19 / 31". */
  function money(n) {
    return "$" + (Number.isInteger(n) ? n : n.toFixed(2));
  }

  function heatMarks(level) {
    if (!level) return "";
    var pips = "";
    for (var i = 1; i <= 3; i++) {
      pips += '<span class="' + (i <= level ? "on" : "") + '">' +
        '<svg width="11" height="11" viewBox="0 0 12 12" fill="#A8232F" aria-hidden="true">' +
        '<path d="M6 1.5c1 1 .5 2 .2 2.4C8 3.6 9.6 5 9.6 7.1 9.6 9.3 8 11 6 11S2.4 9.3 2.4 7.1c0-2.4 2.2-3.4 3.6-5.6z"/></svg></span>';
    }
    var words = ["", "Mild", "Medium", "Hot"][level];
    return '<span class="heat" title="' + words + '"><span class="visually-hidden">Spice: ' + words + "</span>" + pips + "</span>";
  }

  function badges(item) {
    return (item.tags || []).filter(function (t) { return TAG_LABELS[t]; })
      .map(function (t) { return '<span class="badge badge--' + t + '">' + TAG_LABELS[t] + "</span>"; })
      .join("");
  }

  function dishHTML(item) {
    var haystack = (item.name + " " + (item.desc || "") + " " + (item.note || "") + " " +
                    (item.tags || []).join(" ")).toLowerCase();
    /* priceText covers split prices like "19 / 31" (half / whole) */
    var price = item.priceText ? "$" + item.priceText : money(item.price);
    return '<article class="dish" data-dish data-search="' + haystack.replace(/"/g, "") +
      '" data-tags="' + (item.tags || []).join(" ") + '">' +
      '<div class="dish__top">' +
        '<h3 class="dish__name">' + item.name + "</h3>" +
        '<span class="dish__dots" aria-hidden="true"></span>' +
        '<span class="dish__price">' + price + "</span>" +
      "</div>" +
      (item.note ? '<p class="dish__note">' + item.note + "</p>" : "") +
      (item.desc ? '<p class="dish__desc">' + item.desc + "</p>" : "") +
      '<div class="dish__tags">' + badges(item) + heatMarks(item.heat) + "</div>" +
    "</article>";
  }

  function render() {
    root.innerHTML = MENU.map(function (cat) {
      var items = (cat.items || []).filter(function (i) { return !i.hidden; });
      if (!items.length) return "";
      return '<section class="menu-cat" id="cat-' + cat.id + '" data-cat="' + cat.id + '">' +
        '<header class="menu-cat__head">' +
          "<h2>" + cat.name + (cat.tamil ? ' <span class="tamil" lang="ta">' + cat.tamil + "</span>" : "") + "</h2>" +
          (cat.blurb ? "<p>" + cat.blurb + "</p>" : "") +
        "</header>" +
        '<div class="menu-grid">' + items.map(dishHTML).join("") + "</div>" +
      "</section>";
    }).join("") + '<div class="menu-empty" data-empty hidden>' +
      "<h3>Nothing matches that</h3>" +
      "<p>Try a different word, or clear the filters to see all " + countAll() + " dishes.</p>" +
      '<p style="margin-top:1rem"><button class="btn btn--ghost btn--sm" data-clear-all>Clear search and filters</button></p>' +
    "</div>";
  }

  function countAll() {
    return MENU.reduce(function (n, c) {
      return n + (c.items || []).filter(function (i) { return !i.hidden; }).length;
    }, 0);
  }

  function renderRail() {
    var rail = $("[data-cat-rail]");
    if (!rail) return;
    rail.innerHTML = MENU.map(function (c) {
      return '<a href="#cat-' + c.id + '" data-rail="' + c.id + '">' + c.name + "</a>";
    }).join("");
  }

  function renderFilters() {
    var host = $("[data-filters]");
    if (!host) return;
    host.innerHTML = FILTERS.map(function (t) {
      return '<button type="button" class="chip" data-filter="' + t + '" aria-pressed="false">' +
        TAG_LABELS[t] + "</button>";
    }).join("");
  }

  /* ------------------------------------------------------------- filtering */
  function apply() {
    var q = state.query.trim().toLowerCase();
    var shown = 0;

    $$("[data-cat]", root).forEach(function (section) {
      var visibleInCat = 0;
      $$("[data-dish]", section).forEach(function (dish) {
        var matchesQuery = !q || dish.dataset.search.indexOf(q) !== -1;
        var dishTags = dish.dataset.tags.split(" ");
        var matchesTags = state.tags.every(function (t) { return dishTags.indexOf(t) !== -1; });
        var show = matchesQuery && matchesTags;
        dish.hidden = !show;
        if (show) visibleInCat++;
      });
      section.hidden = visibleInCat === 0;
      shown += visibleInCat;
    });

    var empty = $("[data-empty]", root);
    if (empty) empty.hidden = shown !== 0;

    var counter = $("[data-count]");
    if (counter) {
      var total = countAll();
      counter.textContent = shown === total
        ? total + " dishes"
        : "Showing " + shown + " of " + total + " dishes";
    }
    var clear = $("[data-clear]");
    if (clear) clear.hidden = !q && !state.tags.length;

    var clearSearch = $("[data-search-clear]");
    if (clearSearch) clearSearch.hidden = !state.query;

    syncURL();
  }

  function syncURL() {
    var params = new URLSearchParams();
    if (state.query) params.set("q", state.query);
    if (state.tags.length) params.set("diet", state.tags.join(","));
    var qs = params.toString();
    history.replaceState(null, "", qs ? "?" + qs + location.hash : location.pathname + location.hash);
  }

  function readURL() {
    var params = new URLSearchParams(location.search);
    state.query = params.get("q") || "";
    var diet = params.get("diet");
    state.tags = diet ? diet.split(",").filter(function (t) { return FILTERS.indexOf(t) !== -1; }) : [];
  }

  function setView(view) {
    state.view = view;
    root.classList.toggle("menu-list", view === "list");
    $$("[data-view]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.view === view));
    });
    try { localStorage.setItem("md-menu-view", view); } catch (e) { /* private mode */ }
  }

  /* ------------------------------------------------------------- scrollspy */
  /* The toolbar's height changes with viewport (filters wrap, rail wraps), so
     measure it and let scroll-margin follow — otherwise jumping to a category
     parks its heading underneath the sticky bar. */
  function syncToolbarOffset() {
    var bar = $(".menu-toolbar");
    if (!bar) return;
    document.documentElement.style.setProperty("--toolbar-h", bar.offsetHeight + "px");
  }

  function initSpy() {
    var links = $$("[data-rail]");
    if (!links.length || !("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = entry.target.dataset.cat;
        links.forEach(function (a) { a.classList.toggle("is-current", a.dataset.rail === id); });
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    $$("[data-cat]", root).forEach(function (s) { io.observe(s); });
  }


  /* --------------------------------------------------------------- schema
     The menu is rendered from data/menu.js, so its structured data is built
     from the same source rather than hand-maintained alongside it — edit a
     price in one place and what search engines see changes with it. */
  function injectSchema() {
    var schema = {
      "@context": "https://schema.org",
      "@type": "Menu",
      "name": "The Madras Diaries menu",
      "inLanguage": "en-CA",
      "hasMenuSection": MENU.map(function (cat) {
        return {
          "@type": "MenuSection",
          "name": cat.name,
          "description": cat.blurb || undefined,
          "hasMenuItem": (cat.items || []).filter(function (i) { return !i.hidden; })
            .map(function (item) {
              var suitable = [];
              if ((item.tags || []).indexOf("vegan") !== -1) suitable.push("https://schema.org/VeganDiet");
              else if ((item.tags || []).indexOf("veg") !== -1) suitable.push("https://schema.org/VegetarianDiet");
              if ((item.tags || []).indexOf("gf") !== -1) suitable.push("https://schema.org/GlutenFreeDiet");
              return {
                "@type": "MenuItem",
                "name": item.name,
                "description": [item.note, item.desc].filter(Boolean).join(" \u2014 ") || undefined,
                "suitableForDiet": suitable.length ? suitable : undefined,
                "offers": { "@type": "Offer", "price": item.price.toFixed(2), "priceCurrency": "CAD" }
              };
            })
        };
      })
    };
    var tag = document.createElement("script");
    tag.type = "application/ld+json";
    tag.textContent = JSON.stringify(schema);
    document.head.appendChild(tag);
  }

  /* ------------------------------------------------------------------ wire */
  function init() {
    readURL();
    render();
    renderRail();
    renderFilters();
    setView(state.view);

    var input = $("[data-search]");
    if (input) {
      input.value = state.query;
      var t;
      input.addEventListener("input", function () {
        clearTimeout(t);
        t = setTimeout(function () { state.query = input.value; apply(); }, 120);
      });
      input.addEventListener("keydown", function (e) {
        if (e.key === "Escape") { input.value = ""; state.query = ""; apply(); }
      });
    }

    var clearBtn = $("[data-search-clear]");
    if (clearBtn) clearBtn.addEventListener("click", function () {
      state.query = "";
      if (input) { input.value = ""; input.focus(); }
      apply();
    });

    document.addEventListener("click", function (e) {
      var chip = e.target.closest("[data-filter]");
      if (chip) {
        var tag = chip.dataset.filter;
        var i = state.tags.indexOf(tag);
        if (i === -1) state.tags.push(tag); else state.tags.splice(i, 1);
        chip.setAttribute("aria-pressed", String(i === -1));
        apply();
        return;
      }
      var viewBtn = e.target.closest("[data-view]");
      if (viewBtn) { setView(viewBtn.dataset.view); return; }

      if (e.target.closest("[data-clear], [data-clear-all]")) {
        state.query = "";
        state.tags = [];
        if (input) input.value = "";
        $$("[data-filter]").forEach(function (c) { c.setAttribute("aria-pressed", "false"); });
        apply();
      }
    });

    /* Reflect filters that arrived via the URL */
    state.tags.forEach(function (t) {
      var chip = $('[data-filter="' + t + '"]');
      if (chip) chip.setAttribute("aria-pressed", "true");
    });

    apply();
    syncToolbarOffset();
    window.addEventListener("resize", syncToolbarOffset);
    if (window.ResizeObserver) {
      var bar = $(".menu-toolbar");
      if (bar) new ResizeObserver(syncToolbarOffset).observe(bar);
    }
    initSpy();
    injectSchema();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
