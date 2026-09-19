/* ==========================================================================
   The Madras Diaries — site behaviour
   Plain ES modules-free JS so it runs from a file:// preview or any host.
   ========================================================================== */
(function () {
  "use strict";

  var SITE     = window.SITE  || {};
  var DEALS    = window.DEALS || { weekly: {}, promos: [] };
  var TEXT     = window.TEXT  || {};
  var SPECIALS = window.SPECIALS || { items: [] };

  var DAY_KEYS  = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  var DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var DAY_LONG  = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var TZ = "America/Vancouver";

  var $  = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------------- time */

  /* The restaurant's clock, not the visitor's — someone browsing from
     Toronto should still see the correct "Open now". */
  function restaurantNow() {
    try {
      return new Date(new Date().toLocaleString("en-US", { timeZone: TZ }));
    } catch (e) {
      return new Date();
    }
  }

  function toMinutes(hhmm) {
    var p = String(hhmm).split(":");
    return parseInt(p[0], 10) * 60 + parseInt(p[1] || "0", 10);
  }

  /* "26:00" -> "2:00 AM", "24:00" -> "12:00 AM" */
  function formatTime(hhmm) {
    var total = toMinutes(hhmm) % 1440;
    var h = Math.floor(total / 60), m = total % 60;
    var ampm = h >= 12 ? "PM" : "AM";
    var h12 = h % 12 === 0 ? 12 : h % 12;
    return h12 + ":" + (m < 10 ? "0" : "") + m + " " + ampm;
  }

  function hoursFor(dayIndex) {
    return (SITE.hours || {})[DAY_KEYS[dayIndex]] || null;
  }

  /* Returns {state, label, detail}. Handles closing times past midnight by
     also checking whether yesterday's service is still running. */
  function openState() {
    var now = restaurantNow();
    var today = now.getDay();
    var mins = now.getHours() * 60 + now.getMinutes();

    for (var back = 0; back <= 1; back++) {
      var idx = (today - back + 7) % 7;
      var h = hoursFor(idx);
      if (!h) continue;
      var open = toMinutes(h.open);
      var close = toMinutes(h.close);
      var cursor = mins + back * 1440;
      if (cursor >= open && cursor < close) {
        var left = close - cursor;
        if (left <= 60) {
          return { state: "closing", label: "Closing soon", detail: "Last orders — closes at " + formatTime(h.close) };
        }
        return { state: "open", label: "Open now", detail: "Until " + formatTime(h.close) };
      }
    }

    /* Closed: find the next service that starts. */
    for (var f = 0; f <= 7; f++) {
      var nIdx = (today + f) % 7;
      var nh = hoursFor(nIdx);
      if (!nh) continue;
      if (f === 0 && mins >= toMinutes(nh.open)) continue;
      var when = f === 0 ? "today" : f === 1 ? "tomorrow" : DAY_LONG[nIdx];
      return { state: "closed", label: "Closed", detail: "Opens " + when + " at " + formatTime(nh.open) };
    }
    return { state: "closed", label: "Closed", detail: "" };
  }

  function renderStatus() {
    var s = openState();
    $$("[data-status]").forEach(function (el) {
      el.setAttribute("data-state", s.state);
      var dot = $(".status__dot", el);
      if (!dot) {
        dot = document.createElement("span");
        dot.className = "status__dot";
        el.appendChild(dot);
      }
      var text = $(".status__text", el);
      if (!text) {
        text = document.createElement("span");
        text.className = "status__text";
        el.appendChild(text);
      }
      text.textContent = s.detail ? s.label + " · " + s.detail : s.label;
    });
  }

  function renderHoursTable() {
    var table = $("[data-hours-table]");
    if (!table) return;
    var todayIdx = restaurantNow().getDay();
    var rows = "";
    /* Show the week starting Monday — how people read a restaurant's hours. */
    var order = [1, 2, 3, 4, 5, 6, 0];
    order.forEach(function (i) {
      var h = hoursFor(i);
      var value = h ? formatTime(h.open) + " – " + formatTime(h.close) : "Closed";
      rows += '<tr data-today="' + (i === todayIdx) + '">' +
                "<th scope=\"row\">" + DAY_LONG[i] + "</th>" +
                "<td>" + value + "</td></tr>";
    });
    table.innerHTML = "<tbody>" + rows + "</tbody>";
  }

  /* --------------------------------------------------------------- header */
  function initHeader() {
    var header = $(".site-header");
    if (!header) return;
    var hero = $(".hero");
    var toggle = $(".nav-toggle");
    var nav = $("#primary-nav");

    function sync() {
      var threshold = hero ? hero.offsetHeight - 120 : 20;
      var over = hero && window.scrollY < threshold;
      header.setAttribute("data-mode", over ? "over" : "solid");
    }
    sync();
    window.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);

    if (toggle && nav) {
      toggle.addEventListener("click", function () {
        var open = toggle.getAttribute("aria-expanded") === "true";
        toggle.setAttribute("aria-expanded", String(!open));
        nav.setAttribute("data-open", String(!open));
      });
      nav.addEventListener("click", function (e) {
        if (e.target.closest("a")) {
          toggle.setAttribute("aria-expanded", "false");
          nav.setAttribute("data-open", "false");
        }
      });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
          toggle.setAttribute("aria-expanded", "false");
          nav.setAttribute("data-open", "false");
          toggle.focus();
        }
      });
    }
  }

  /* ----------------------------------------------------------- hero video */
  function initHeroVideo() {
    var media = $("[data-hero-media]");
    if (!media) return;
    var cfg = SITE.heroVideo || {};
    var poster = cfg.poster || "assets/img/hero-poster.svg";

    var still = document.createElement("img");
    still.src = poster;
    still.alt = "";
    still.setAttribute("aria-hidden", "true");
    media.appendChild(still);

    if (!cfg.mp4 && !cfg.webm) return;

    var btn = $("[data-video-toggle]");
    var video = document.createElement("video");
    video.muted = true;          /* required for autoplay */
    video.defaultMuted = true;
    video.loop = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    video.setAttribute("aria-hidden", "true");
    video.setAttribute("tabindex", "-1");
    video.preload = "metadata";
    video.poster = poster;
    video.style.opacity = "0";
    video.style.transition = "opacity .8s ease";

    [["webm", "video/webm"], ["mp4", "video/mp4"]].forEach(function (pair) {
      if (!cfg[pair[0]]) return;
      var src = document.createElement("source");
      src.src = cfg[pair[0]];
      src.type = pair[1];
      video.appendChild(src);
    });

    var failed = false;
    function giveUp() {
      if (failed) return;
      failed = true;
      if (video.parentNode) video.parentNode.removeChild(video);
      if (btn) btn.hidden = true;
    }

    /* No file uploaded yet, wrong codec, data-saver on — all end up here and
       the animated poster carries the page instead. */
    video.addEventListener("error", giveUp, true);
    $$("source", video).forEach(function (s) { s.addEventListener("error", giveUp); });

    video.addEventListener("loadeddata", function () {
      if (failed) return;
      video.style.opacity = "1";
      still.style.opacity = "0";
    });

    media.appendChild(video);

    function setBtn(playing) {
      if (!btn) return;
      btn.setAttribute("aria-label", playing ? "Pause background video" : "Play background video");
      btn.setAttribute("data-playing", String(playing));
      btn.innerHTML = playing
        ? '<svg width="14" height="16" viewBox="0 0 14 16" fill="currentColor" aria-hidden="true"><rect x="1" y="1" width="4" height="14" rx="1"/><rect x="9" y="1" width="4" height="14" rx="1"/></svg>'
        : '<svg width="14" height="16" viewBox="0 0 14 16" fill="currentColor" aria-hidden="true"><path d="M2 1.5v13l11-6.5z"/></svg>';
    }

    function play() {
      var p = video.play();
      if (p && p.catch) p.catch(function () { setBtn(false); });
      setBtn(true);
    }
    function pause() { video.pause(); setBtn(false); }

    if (btn) {
      btn.hidden = false;
      setBtn(!reduceMotion);
      btn.addEventListener("click", function () {
        if (video.paused) play(); else pause();
      });
    }

    /* Honour "reduce motion": load the frame, don't animate it unasked. */
    if (reduceMotion) { video.load(); setBtn(false); } else { play(); }

    /* Don't burn a phone battery decoding video in a background tab. */
    document.addEventListener("visibilitychange", function () {
      if (failed || reduceMotion) return;
      if (document.hidden) video.pause();
      else if (btn && btn.getAttribute("data-playing") === "true") play();
    });
  }

  /* ---------------------------------------------------------------- deals */
  function todayIndex() { return restaurantNow().getDay(); }

  function parseDate(str) {
    var p = String(str).split("-");
    return new Date(+p[0], +p[1] - 1, +p[2]);
  }

  function startOfToday() {
    var n = restaurantNow();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate());
  }

  function activePromos() {
    var today = startOfToday();
    return (DEALS.promos || []).filter(function (p) {
      if (!p.active) return false;
      var end = parseDate(p.end);
      end.setHours(23, 59, 59, 999);
      return end >= today;
    });
  }

  function countdownText(promo) {
    var now = restaurantNow();
    var start = parseDate(promo.start);
    if (start > now) {
      return "Starts " + start.toLocaleDateString("en-CA", { month: "short", day: "numeric" });
    }
    var end = parseDate(promo.end);
    end.setHours(23, 59, 59, 999);
    var ms = end - now;
    if (ms <= 0) return "Ending today";
    var days = Math.floor(ms / 86400000);
    var hrs = Math.floor((ms % 86400000) / 3600000);
    var mins = Math.floor((ms % 3600000) / 60000);
    if (days >= 1) return "Ends in <b>" + days + "d " + hrs + "h</b>";
    return "Ends in <b>" + hrs + "h " + mins + "m</b>";
  }

  function renderPromos() {
    var host = $("[data-promos]");
    if (!host) return;
    var list = activePromos();
    if (!list.length) { host.innerHTML = ""; host.hidden = true; return; }
    host.hidden = false;
    host.innerHTML = list.map(function (p) {
      var cta = p.cta && p.cta.url
        ? '<a class="btn btn--gold btn--sm" href="' + p.cta.url + '">' + p.cta.label + "</a>"
        : "";
      return '<article class="promo">' +
        '<span class="badge">' + p.tag + "</span>" +
        "<h3>" + p.title + "</h3>" +
        "<p>" + p.detail + "</p>" +
        '<div class="promo__foot">' +
          '<span class="promo__price">' + p.price + "</span>" +
          '<span class="countdown" data-countdown>' + countdownText(p) + "</span>" +
          cta +
        "</div></article>";
    }).join("");

    /* Keep the countdowns honest without a per-second repaint. */
    var nodes = $$("[data-countdown]", host);
    setInterval(function () {
      nodes.forEach(function (n, i) { if (list[i]) n.innerHTML = countdownText(list[i]); });
    }, 30000);
  }

  function dealFor(dayIndex) {
    var d = (DEALS.weekly || {})[DAY_KEYS[dayIndex]];
    return d && d.active ? d : null;
  }

  function renderDealPanel(dayIndex) {
    var panel = $("[data-deal-panel]");
    if (!panel) return;
    var deal = dealFor(dayIndex);
    var isToday = dayIndex === todayIndex();

    if (!deal) {
      panel.setAttribute("data-empty", "true");
      panel.innerHTML = '<div class="deal-panel__body">' +
        '<span class="eyebrow eyebrow--dark">' + DAY_LONG[dayIndex] + "</span>" +
        "<h3>No standing deal this day</h3>" +
        "<p>The full menu is on, all the way to close. " +
        '<a class="link-arrow" href="menu.html">See the menu</a></p></div>';
      return;
    }

    panel.setAttribute("data-empty", "false");
    panel.innerHTML =
      '<div class="deal-panel__body">' +
        '<span class="eyebrow eyebrow--dark">' + (isToday ? "Today · " : "") + DAY_LONG[dayIndex] + " · " + deal.tag + "</span>" +
        "<h3>" + deal.title + "</h3>" +
        "<p>" + deal.detail + "</p>" +
        '<dl class="deal-panel__meta">' +
          "<div><dt>When</dt><dd>" + deal.times + "</dd></div>" +
          (deal.terms ? "<div><dt>Good to know</dt><dd>" + deal.terms + "</dd></div>" : "") +
        "</dl>" +
      "</div>" +
      '<div class="deal-panel__price"><b>' + deal.price + "</b><span>" + DAY_SHORT[dayIndex] + " only</span></div>";
  }

  function renderDayStrip() {
    var strip = $("[data-day-strip]");
    if (!strip) return;
    var today = todayIndex();
    /* Start the strip at today so the current deal is the first thing you see. */
    var order = [];
    for (var i = 0; i < 7; i++) order.push((today + i) % 7);

    strip.innerHTML = order.map(function (idx) {
      var deal = dealFor(idx);
      return '<button type="button" class="day-btn" role="tab" ' +
        'data-day="' + idx + '" data-today="' + (idx === today) + '" ' +
        'aria-selected="' + (idx === today) + '" ' +
        'tabindex="' + (idx === today ? "0" : "-1") + '" ' +
        'aria-controls="deal-panel" id="day-tab-' + idx + '">' +
        '<span class="day-btn__day">' + DAY_SHORT[idx] + "</span>" +
        '<span class="day-btn__tag">' + (deal ? deal.tag : "Full menu") + "</span>" +
      "</button>";
    }).join("");

    function select(idx) {
      $$(".day-btn", strip).forEach(function (b) {
        var on = +b.dataset.day === idx;
        b.setAttribute("aria-selected", String(on));
        b.setAttribute("tabindex", on ? "0" : "-1");
      });
      var panel = $("[data-deal-panel]");
      if (panel) panel.setAttribute("aria-labelledby", "day-tab-" + idx);
      renderDealPanel(idx);
    }

    strip.addEventListener("click", function (e) {
      var btn = e.target.closest(".day-btn");
      if (btn) select(+btn.dataset.day);
    });

    strip.addEventListener("keydown", function (e) {
      var keys = { ArrowRight: 1, ArrowLeft: -1 };
      if (!(e.key in keys)) return;
      e.preventDefault();
      var btns = $$(".day-btn", strip);
      var cur = btns.findIndex(function (b) { return b.getAttribute("aria-selected") === "true"; });
      var next = btns[(cur + keys[e.key] + btns.length) % btns.length];
      next.focus();
      select(+next.dataset.day);
    });

    var panel0 = $("[data-deal-panel]");
    if (panel0) panel0.setAttribute("aria-labelledby", "day-tab-" + today);
    renderDealPanel(today);
  }

  /* Today's deal, surfaced in the hero */
  function renderHeroDeal() {
    var host = $("[data-hero-deal]");
    if (!host) return;
    var deal = dealFor(todayIndex());
    if (!deal) { host.hidden = true; return; }
    host.hidden = false;
    host.innerHTML =
      '<span class="badge">Today · ' + deal.tag + "</span>" +
      "<strong>" + deal.title + "</strong>" +
      "<span>" + deal.price + " · " + deal.times + "</span>" +
      '<a class="link-arrow" href="#deals">All this week’s deals</a>';
  }

  /* ------------------------------------------------------ contact details */
  function renderSiteDetails() {
    $$("[data-site]").forEach(function (el) {
      var key = el.getAttribute("data-site");
      var value = key.split(".").reduce(function (o, k) { return o && o[k]; }, SITE);
      if (value == null || value === "") return;
      /* A link gets the value as its href; anything else gets it as text.
         Keeps social icons from printing their own URLs as a caption. */
      if (el.tagName === "A") {
        if (key === "email") { el.href = "mailto:" + value; el.textContent = value; }
        else if (/^(https?:|tel:|mailto:|\/|#)/.test(value)) el.href = value;
        else el.textContent = value;
      } else {
        el.textContent = value;
      }
    });

    /* Telephone links */
    $$('[data-tel]').forEach(function (a) {
      if (SITE.phoneDial) a.href = "tel:" + SITE.phoneDial;
      if (a.hasAttribute("data-tel-text")) a.textContent = SITE.phone;
    });

    /* Ordering buttons — a partner with no link set simply doesn't render. */
    $$("[data-order-links]").forEach(function (host) {
      var o = SITE.ordering || {};
      var html = Object.keys(o).map(function (k) {
        var p = o[k];
        if (!p || !p.url) return "";
        var primary = k === "direct";
        return '<a class="btn ' + (primary ? "btn--primary" : "btn--ghost") + '" href="' + p.url +
          '" target="_blank" rel="noopener"><span>' + p.label + "</span>" +
          (p.note ? "<small>" + p.note + "</small>" : "") + "</a>";
      }).join("");
      host.innerHTML = html || '<a class="btn btn--primary" data-tel href="#">Call to order</a>';
      if (!html && SITE.phoneDial) $("[data-tel]", host).href = "tel:" + SITE.phoneDial;
    });

    /* Booking */
    /* Booking. Without a reservation system the buttons dial the restaurant;
       only those marked data-reserve-text are relabelled, so the header's
       "Reservation" button keeps its name. */
    $$("[data-reserve]").forEach(function (a) {
      if (SITE.reservationUrl) {
        a.href = SITE.reservationUrl;
        a.target = "_blank";
        a.rel = "noopener";
      } else {
        a.href = "tel:" + (SITE.phoneDial || "");
        if (a.hasAttribute("data-reserve-text")) a.textContent = "Call to book";
        else a.title = "Call " + (SITE.phone || "") + " to book";
      }
    });

    /* Halal badge — only shown when the kitchen is certified. */
    if (SITE.halal) $$("[data-halal]").forEach(function (el) { el.hidden = false; });

    /* Newsletter: the form only appears once a provider URL is configured,
       otherwise visitors get a mailto link that actually works. */
    var nlForm = $("[data-newsletter]");
    var nlFallback = $("[data-newsletter-fallback]");
    if (nlForm && SITE.newsletterUrl) {
      nlForm.action = SITE.newsletterUrl;
      nlForm.method = "post";
      nlForm.target = "_blank";
      nlForm.hidden = false;
      if (nlFallback) nlFallback.hidden = true;
    }

    var year = $("[data-year]");
    if (year) year.textContent = new Date().getFullYear();
  }

  /* --------------------------------------------------------------- reveal */
  function initReveal() {
    var items = $$("[data-reveal]");
    if (!items.length) return;
    if (reduceMotion || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
  }


  /* ----------------------------------------------------------------- copy */
  /* Every heading and paragraph carrying data-text is filled from text.json,
     so wording is editable in the admin without touching the markup. */
  function renderText() {
    $$("[data-text]").forEach(function (el) {
      var v = TEXT[el.getAttribute("data-text")];
      if (v != null && v !== "") el.textContent = v;
    });
  }

  /* ------------------------------------------------------------- specials */
  function renderSpecials() {
    var host = $("[data-specials]");
    if (!host) return;
    var items = SPECIALS.items || [];
    if (!items.length) { host.innerHTML = ""; return; }

    host.innerHTML = items.map(function (s) {
      var media = !s.media ? ""
        : s.type === "video"
          ? '<video src="' + s.media + '" muted loop playsinline preload="metadata" aria-hidden="true"></video>'
          : '<img src="' + s.media + '" alt="' + (s.title || "") + '" loading="lazy">';
      return '<article class="special">' +
        '<div class="special__media">' + media +
          (s.badge ? '<span class="special__badge">' + s.badge + "</span>" : "") +
        "</div>" +
        '<div class="special__body">' +
          "<h3>" + (s.title || "") + "</h3>" +
          (s.desc ? "<p>" + s.desc + "</p>" : "") +
          (s.price ? '<span class="special__price">' + s.price + "</span>" : "") +
        "</div></article>";
    }).join("");

    /* Videos here are decoration, so only play them while they're on screen. */
    var vids = $$("video", host);
    if (vids.length && "IntersectionObserver" in window && !reduceMotion) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) en.target.play().catch(function () {});
          else en.target.pause();
        });
      }, { threshold: 0.25 });
      vids.forEach(function (v) { io.observe(v); });
    }

    var plate = $("[data-plate]");
    if (plate && SPECIALS.plateImage) plate.src = SPECIALS.plateImage;
  }

  /* The ring text is repeated until it fills the circle, so any wording the
     owner types still reads as a continuous band. */
  function renderRing() {
    var text = $("[data-ring]");
    var path = document.getElementById("ring-path");
    if (!text || !path || !path.getTotalLength) return;

    var phrase = (TEXT.ringText || "Fusion of Spices at its Best")
      .trim().replace(/[\u00b7\s]+$/, "");
    var circumference = path.getTotalLength();
    var NS = "http://www.w3.org/2000/svg";

    function run(offsetPercent, content) {
      var tp = document.createElementNS(NS, "textPath");
      tp.setAttribute("href", "#ring-path");
      tp.setAttribute("startOffset", offsetPercent + "%");
      tp.textContent = content;
      text.appendChild(tp);
      return tp;
    }

    /* Measure one copy, then place as many as fit with room to spare. Each
       copy is centred on its own slice of the circle, so two runs can never
       land on top of each other however the font renders. */
    text.textContent = "";
    var probe = run(50, phrase);
    var one = probe.getComputedTextLength();
    text.textContent = "";
    if (!one) { run(50, phrase); return; }

    var copies = Math.max(1, Math.floor(circumference / (one * 1.15)));
    for (var i = 0; i < copies; i++) {
      /* Centre each copy inside its own slice, so none straddles the point
         where the path closes. */
      run(+(((i + 0.5) / copies) * 100).toFixed(4), phrase);
    }
  }



  /* ------------------------------------------------------------------ go */
  function init() {
    renderText();
    renderSiteDetails();
    renderStatus();
    renderHoursTable();
    initHeader();
    initHeroVideo();
    renderHeroDeal();
    renderPromos();
    renderDayStrip();
    renderSpecials();
    renderRing();
    initReveal();
    setInterval(renderStatus, 60000);   /* keep "Open now" true as time passes */
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  window.MD = { openState: openState, formatTime: formatTime, restaurantNow: restaurantNow };
})();
