/* ==========================================================================
   DAILY DEALS & PROMOTIONS — The Madras Diaries
   --------------------------------------------------------------------------
   This is the file you'll edit most often. Two kinds of offer live here:

   1. WEEKLY  — a standing deal that repeats every week on the same day.
                The site automatically shows today's deal in the hero banner
                and pre-selects today in the "This Week" strip.

   2. PROMOS  — a limited-time promotion with a start and end date. It shows
                a live countdown and disappears on its own when it expires,
                so nothing stale is ever left on the site.

   Dates are YYYY-MM-DD. Times are 24-hour ("17:00" = 5 PM).
   To switch a deal off without deleting it, set  active: false.
   ========================================================================== */

window.DEALS = {

  /* ---- 1. WEEKLY DEALS --------------------------------------------------
     One entry per day. Leave a day as null if there's no deal that day.   */
  weekly: {

    sun: {
      active: true,
      tag:    "Family Sunday",
      title:  "Sunday Sadhya Platter",
      detail: "A full banana-leaf spread for two — rice, sambar, rasam, three poriyals, payasam and appalam.",
      price:  "$44 for two",
      times:  "12:00 PM – 4:00 PM",
      terms:  "Dine-in only. While quantities last.",
    },

    mon: {
      active: true,
      tag:    "Meatless Monday",
      title:  "Any Two Veg Dosas + Filter Coffee",
      detail: "Pick any two from the vegetarian dosa list and finish with two tumblers of degree filter coffee.",
      price:  "$29",
      times:  "All day",
      terms:  "Dine-in and takeout. Not combinable with other offers.",
    },

    tue: {
      active: true,
      tag:    "Tiffin Tuesday",
      title:  "Idli–Vada Combo, Half Price After 9 PM",
      detail: "Two idli, one medu vada, sambar and a duo of chutneys — the way Madras eats after the late show.",
      price:  "50% off",
      times:  "9:00 PM – close",
      terms:  "Dine-in only.",
    },

    wed: {
      active: true,
      tag:    "Biryani Wednesday",
      title:  "Dindigul Lamb Biryani + Raita",
      detail: "Our Thambi Vilas lamb biryani, seeraga samba rice, with onion raita and brinjal gravy on the house.",
      price:  "$5 off",
      times:  "All day",
      terms:  "One per guest. Dine-in, takeout and direct online orders.",
    },

    thu: {
      active: true,
      tag:    "Indo-Chinese Thursday",
      title:  "Gobi Manchurian — Buy One, Get One",
      detail: "The crackling, chilli-slicked gobi that started it all. Order one, the second is on us.",
      price:  "BOGO",
      times:  "5:00 PM – close",
      terms:  "Dine-in only. Second plate of equal or lesser value.",
    },

    fri: {
      active: true,
      tag:    "Late Night",
      title:  "Midnight Dosa Hour",
      detail: "Every dosa on the menu, made to order, straight off the iron — long after the rest of Kingsway has closed.",
      price:  "$3 off every dosa",
      times:  "11:00 PM – 2:00 AM",
      terms:  "Dine-in and takeout.",
    },

    sat: {
      active: true,
      tag:    "Chettinad Saturday",
      title:  "Chettinad Feast for Four",
      detail: "Lamb chettinadu, chettinadu fish curry, pepper chicken, parotta, rice and dessert.",
      price:  "$119 for four",
      times:  "5:00 PM – close",
      terms:  "Dine-in. Reservations recommended.",
    },
  },

  /* ---- 2. LIMITED-TIME PROMOTIONS ---------------------------------------
     These sit above the weekly deals and show a countdown. Delete an entry
     or set active:false once it's over — expired promos hide themselves.  */
  promos: [
    {
      active: true,
      tag:    "Festival Special",
      title:  "Pongal Buffet",
      detail: "Ven pongal, sakkarai pongal, sugarcane, vadai and the full harvest table — served all afternoon.",
      price:  "$22 per person",
      start:  "2027-01-14",
      end:    "2027-01-18",
      cta:    { label: "Reserve a table", url: "tel:+16047078177" },
    },
    {
      active: true,
      tag:    "New",
      title:  "Order Direct, Skip the Commission",
      detail: "Order through us instead of a delivery app and take 10% off your first order with code MADRAS10.",
      price:  "10% off",
      start:  "2026-09-01",
      end:    "2026-12-31",
      cta:    { label: "Order direct", url: "https://themadrasdiaries.ca/order" },
    },
  ],
};
