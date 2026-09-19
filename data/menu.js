/* ==========================================================================
   MENU — The Madras Diaries
   --------------------------------------------------------------------------
   HOW TO EDIT
     • Each item needs a "name" and "price". Everything else is optional.
     • "tags" drive the filter buttons on the menu page. Valid tags:
           "veg"      vegetarian
           "vegan"    fully plant-based
           "gf"       gluten-free
           "nuts"     contains nuts
           "popular"  shows a "Guest favourite" badge
           "chef"     shows a "Chef's pick" badge
           "new"      shows a "New" badge
     • "heat" is 0–3 chillies. Leave it out for anything not spicy.
     • Set  hidden: true  to pull an item off the site without deleting it
       (useful when something is out of season).

   PRICE CHECK
     Items flagged  checked: true  were cross-referenced against the public
     DoorDash / listing prices in Sept 2026. Everything else is carried over
     at an estimated price and should be confirmed against the till before
     this site goes live. See README.md.
   ========================================================================== */

window.MENU = [

  /* ---------------------------------------------------------------- DOSAI */
  {
    id: "dosai",
    name: "Dosai",
    tamil: "தோசை",
    blurb: "Batter ground in-house and rested overnight, poured on iron that has never seen soap. The reason most people find us.",
    items: [
      { name: "Madras Masala Dosa", price: 14.00, checked: true, tags: ["veg", "popular"], heat: 1,
        desc: "Crisp golden crepe folded over spiced potato, with sambar and a duo of chutneys." },
      { name: "Mysore Masala Dosa", price: 15.49, checked: true, tags: ["veg"], heat: 2,
        desc: "Smeared inside with fiery red garlic chutney before the potato goes in." },
      { name: "Ghee Roast Dosa", price: 15.00, tags: ["veg", "chef"],
        desc: "Paper-thin, rolled tall, glossy with nutty ghee. Nothing to hide behind." },
      { name: "Podi Dosa", price: 14.00, tags: ["veg"], heat: 2,
        desc: "Dusted with gunpowder — roasted lentils, red chilli, sesame — and a slick of sesame oil." },
      { name: "Onion Rava Dosa", price: 15.00, tags: ["veg"], heat: 1,
        desc: "Lacy semolina dosa, shot through with onion, green chilli and curry leaf." },
      { name: "Pondicherry Mutton Dosa", price: 18.00, tags: ["popular", "chef"], heat: 2,
        desc: "Slow-cooked mutton kothu pressed into the dosa as it crisps. The dish guests come back for." },
      { name: "Kal Dosa with Chicken Curry", price: 15.00, checked: true, heat: 2,
        desc: "Thick, soft griddle dosa served with a bowl of country-style chicken curry." },
      { name: "Pepper Chicken Kal Dosa", price: 17.00, checked: true, heat: 3,
        desc: "Thick dosa topped with spicy chutney and black pepper chicken." },
      { name: "Egg Dosa", price: 14.00, checked: true,
        desc: "Fresh egg cracked and spread across the dosa on the iron." },
      { name: "Vegetable Uthappam", price: 14.00, checked: true, tags: ["veg"], heat: 1,
        desc: "Thick, pillowy dosa pressed with spicy chutney and vegetables." },
      { name: "Plain Dosa", price: 11.00, tags: ["veg", "vegan"],
        desc: "Just batter, heat and time. Sambar and chutneys alongside." },
    ],
  },

  /* --------------------------------------------------------------- TIFFIN */
  {
    id: "tiffin",
    name: "Tiffin",
    tamil: "டிஃபன்",
    blurb: "Steamed, soaked and fermented. The small plates a Madras morning is actually built on — served here until close.",
    items: [
      { name: "Thattu Idli (Rameswaram Style)", price: 12.49, checked: true, tags: ["veg", "vegan", "popular"],
        desc: "Flat, feather-light idli soaked in sambar and dusted with podi." },
      { name: "Idly with Sambar", price: 10.00, tags: ["veg", "vegan", "popular"],
        desc: "Two steamed rice cakes, hot sambar, coconut and tomato chutney." },
      { name: "Medu Vada", price: 9.00, tags: ["veg", "vegan"],
        desc: "Urad dal doughnuts, crunched outside, cloud-soft in the middle." },
      { name: "Sambar Vada", price: 11.00, tags: ["veg", "vegan"],
        desc: "Medu vada drowned in sambar, with onion and coriander." },
      { name: "Ven Pongal", price: 12.00, tags: ["veg"],
        desc: "Rice and moong dal with cracked pepper, cumin, cashew and a lot of ghee." },
      { name: "Theatre Samosa", price: 8.00, checked: true, tags: ["veg"], heat: 1,
        desc: "The squat, over-stuffed samosa sold outside Madras cinemas at interval." },
      { name: "Paneer Tikka", price: 16.00, tags: ["veg", "gf", "popular"], heat: 1,
        desc: "Charred paneer, capsicum and onion off the skewer with mint chutney." },
    ],
  },

  /* --------------------------------------------------------- INDO-CHINESE */
  {
    id: "indo-chinese",
    name: "Indo-Chinese",
    tamil: "இண்டோ-சைனீஸ்",
    blurb: "The wok side of the kitchen. Loud, glossy, garlicky — Madras street Chinese, not takeout Chinese.",
    items: [
      { name: "Gobi Manchurian", price: 15.00, checked: true, tags: ["veg", "popular"], heat: 2,
        desc: "Cauliflower fried hard, then tossed in a sticky chilli-garlic glaze." },
      { name: "Chilli Chicken", price: 18.00, checked: true, tags: ["popular"], heat: 3,
        desc: "Boneless chicken, capsicum, onion and a serious count of green chillies." },
      { name: "Paneer 65", price: 16.00, tags: ["veg"], heat: 2,
        desc: "Curry-leaf-crackled paneer in the Madras 65 marinade." },
      { name: "Chicken Fried Rice", price: 19.00, checked: true, heat: 1,
        desc: "High-heat wok rice with egg, spring onion and shredded chicken." },
      { name: "Schezwan Chicken Fried Rice", price: 20.00, checked: true, heat: 3,
        desc: "The same, turned up — house schezwan paste, extra garlic." },
      { name: "Shrimp Fried Rice", price: 20.00, checked: true, heat: 1,
        desc: "Wok-tossed with shrimp, egg and spring onion." },
      { name: "Veg Hakka Noodles", price: 16.00, checked: false, tags: ["veg", "vegan"], heat: 1,
        desc: "Hand-tossed noodles with julienned vegetables and dark soy." },
    ],
  },

  /* ------------------------------------------------------- BIRYANI & RICE */
  {
    id: "biryani",
    name: "Biryani",
    tamil: "பிரியாணி",
    blurb: "Seeraga samba rice, sealed pots, no shortcuts. Every biryani comes with onion raita and brinjal gravy.",
    items: [
      { name: "Thambi Vilas Lamb Biryani", price: 23.00, tags: ["chef", "popular"], heat: 2,
        desc: "Dindigul style — tender lamb, short-grain seeraga samba, mint and a hard dum seal." },
      { name: "Ambur Chicken Biryani", price: 20.00, heat: 2,
        desc: "Ambur's soaked-chilli paste, bone-in chicken, rice that stays separate to the last grain." },
      { name: "Ghee Roast Chicken Biryani", price: 21.00, heat: 2,
        desc: "Chicken roasted in ghee and masala before it meets the rice." },
      { name: "Vegetable Biryani", price: 18.00, tags: ["veg"], heat: 1,
        desc: "Seasonal vegetables, whole spice and saffron, layered and sealed." },
      { name: "Prawn Biryani", price: 24.00, heat: 2,
        desc: "Coastal style, with a green masala that leans on coriander and coconut." },
      { name: "Curd Rice", price: 10.00, tags: ["veg", "gf"],
        desc: "Set curd, tempered mustard and curry leaf. The full stop to any Madras meal." },
    ],
  },

  /* ------------------------------------------------------ CURRIES & COAST */
  {
    id: "curries",
    name: "From the Coast",
    tamil: "கறி",
    blurb: "Chettinad and the Coromandel — where the spice list gets long and the coconut milk comes in late.",
    items: [
      { name: "Lamb Chettinadu", price: 20.00, checked: true, tags: ["gf", "chef"], heat: 3,
        desc: "Stone-ground chettinad masala, star anise and stone flower, cooked down slow." },
      { name: "Chettinadu Fish Curry", price: 21.00, tags: ["gf"], heat: 3,
        desc: "Boneless fish in an old blend of spices finished with coconut milk." },
      { name: "Chicken Curry", price: 18.00, tags: ["gf"], heat: 2,
        desc: "The everyday country curry — shallots, tomato, gingelly oil." },
      { name: "Lamb Vindaloo", price: 21.00, tags: ["gf"], heat: 3,
        desc: "Goan-Portuguese heat and vinegar sharpness, slow-braised." },
      { name: "Kadai Paneer", price: 18.00, tags: ["veg", "gf"], heat: 2,
        desc: "Paneer and peppers in a coarse-ground kadai masala." },
      { name: "Sambar & Rasam Bowl", price: 9.00, tags: ["veg", "vegan", "gf"], heat: 1,
        desc: "A bowl of each, with steamed rice. Simple and restorative." },
    ],
  },

  /* ---------------------------------------------------- BREADS & SWEETS */
  {
    id: "breads",
    name: "Breads & Sweets",
    tamil: "ரொட்டி & இனிப்பு",
    blurb: "Parotta slapped flaky on the counter, and the sweets that end every celebration back home.",
    items: [
      { name: "Kerala Parotta (2 pc)", price: 8.00, tags: ["veg"],
        desc: "Layered, slapped and shredded flaky at the pass." },
      { name: "Kothu Parotta — Chicken", price: 18.00, tags: ["popular"], heat: 2,
        desc: "Parotta chopped on the griddle with egg, chicken and salna. Listen for it." },
      { name: "Appam (2 pc)", price: 9.00, tags: ["veg", "vegan", "gf"],
        desc: "Lacy-edged rice hoppers with soft coconut centres." },
      { name: "Gulab Jamun (2 pc)", price: 7.00, tags: ["veg"],
        desc: "Warm, soaked in cardamom syrup." },
      { name: "Payasam", price: 7.00, tags: ["veg", "nuts", "gf"],
        desc: "Semiya payasam with cashew, raisin and a thread of saffron." },
    ],
  },

  /* ---------------------------------------------------------------- DRINKS */
  {
    id: "drinks",
    name: "Drinks",
    tamil: "பானங்கள்",
    blurb: "Pulled high between two tumblers, the way it's meant to be.",
    items: [
      { name: "Degree Filter Coffee", price: 5.00, tags: ["veg", "gf", "popular"],
        desc: "Chicory-blend decoction, pulled long in steel. Sweet unless you say otherwise." },
      { name: "Masala Chai", price: 4.50, tags: ["veg", "gf"],
        desc: "Boiled properly, with ginger and cardamom." },
      { name: "Rose Milk", price: 6.00, tags: ["veg", "gf"],
        desc: "Chilled, pink, unapologetically sweet." },
      { name: "Mango Lassi", price: 7.00, tags: ["veg", "gf"],
        desc: "Thick, with alphonso pulp." },
      { name: "Fresh Lime Soda", price: 5.00, tags: ["veg", "vegan", "gf"],
        desc: "Sweet, salted or both." },
    ],
  },
];
