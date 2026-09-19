/* ==========================================================================
   SITE SETTINGS — The Madras Diaries
   --------------------------------------------------------------------------
   Edit this file to change contact info, hours and ordering links.
   No build step, no coding knowledge needed: change the text between the
   quotes, save, upload. Keep the commas and quotes exactly where they are.
   ========================================================================== */

window.SITE = {

  name: "The Madras Diaries",
  tagline: "Madras on a banana leaf, served till late on Kingsway.",

  /* ---- Contact ---------------------------------------------------------- */
  phone:        "(604) 707-8177",
  phoneDial:    "+16047078177",          // used by the "Call" button
  email:        "hello@themadrasdiaries.ca",
  address:      "1097 Kingsway",
  addressLine2: "Vancouver, BC V5V 3C7",
  mapsUrl:      "https://www.google.com/maps/search/?api=1&query=1097+Kingsway+Vancouver+BC",

  /* ---- Social ----------------------------------------------------------- */
  social: {
    instagram: "https://www.instagram.com/themadrasdiaries/",
    facebook:  "https://www.facebook.com/themadrasdiaries/",
  },

  /* ---- Ordering partners ------------------------------------------------
     Set a link to "" (empty) to hide that button everywhere on the site.  */
  ordering: {
    direct:   { label: "Order Direct",  url: "https://themadrasdiaries.ca/order", note: "Best price — no commission" },
    uberEats: { label: "Uber Eats",     url: "" },
    doordash: { label: "DoorDash",      url: "https://www.doordash.com/store/the-madras-diaries-vancouver-28955122/" },
    skip:     { label: "SkipTheDishes", url: "" },
  },

  reservationUrl: "",   // e.g. an OpenTable/Resy link. Empty = show "Call to book" instead.

  /* ---- Social proof (update after checking your listings) ---------------- */
  rating:      "4.5",
  reviewCount: "707",

  /* ---- Opening hours ----------------------------------------------------
     24-hour clock. For a closing time AFTER midnight, keep counting up:
       2:00 AM  ->  "26:00"
       1:00 AM  ->  "25:00"
     Set a day to null to show it as Closed, e.g.  mon: null,
     The "Open now / Closed" badge on the site is calculated from this.     */
  hours: {
    sun: { open: "12:00", close: "24:00" },
    mon: { open: "11:30", close: "24:00" },
    tue: { open: "11:30", close: "24:00" },
    wed: { open: "11:30", close: "24:00" },
    thu: { open: "11:30", close: "26:00" },
    fri: { open: "11:30", close: "26:00" },
    sat: { open: "12:00", close: "26:00" },
  },

  /* Shown under the hours table. Good spot for holiday notices. */
  hoursNote: "Kitchen takes last orders 30 minutes before close.",

  /* ---- Hero video -------------------------------------------------------
     Drop your video at the path below and it plays automatically, muted and
     looping, behind the headline. If the file is missing the site falls back
     to an animated still — nothing breaks.
     Recommended: 10–20s, 1920x1080, H.264 MP4, no audio, under 6 MB.       */
  heroVideo: {
    mp4:    "assets/video/hero.mp4",
    webm:   "assets/video/hero.webm",   // optional, smaller on Chrome/Firefox
    poster: "assets/img/hero-poster.svg",
  },
};
