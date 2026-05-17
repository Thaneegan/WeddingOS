const instagram = (handle, note = "Live Instagram profile linked for couples to review current posts, reels, and stories.") =>
  `Instagram|https://www.instagram.com/${handle.replace(/^@/, "")}/|${note}`;

const website = (url) => `Website|${url}`;

const defaults = {
  venues: {
    serviceName: "Wedding Venue Package",
    includes: ["Event space", "Venue coordinator", "Ceremony setup", "Reception floor plan"],
    imageKey: "venue",
    price: 1250000,
    tags: ["Venue", "GTA", "Reception"],
  },
  photography: {
    serviceName: "Wedding Photography Coverage",
    includes: ["Lead photographer", "Edited gallery", "Timeline planning", "Print release"],
    imageKey: "photo",
    price: 480000,
    tags: ["Editorial", "Candid", "Wedding"],
  },
  videography: {
    serviceName: "Cinematic Wedding Film",
    includes: ["Highlight film", "Ceremony edit", "Reception coverage", "Licensed music"],
    imageKey: "film",
    price: 520000,
    tags: ["Cinematic", "Documentary", "Social edits"],
  },
  decor: {
    serviceName: "Ceremony and Reception Decor",
    includes: ["Design consultation", "Backdrop or mandap", "Tablescape accents", "Setup and strike"],
    imageKey: "decor",
    price: 620000,
    tags: ["Mandap", "Reception", "Installations"],
  },
  florals: {
    serviceName: "Full Service Florals",
    includes: ["Personal flowers", "Centerpieces", "Ceremony florals", "Delivery and setup"],
    imageKey: "floral",
    price: 420000,
    tags: ["Florals", "Installations", "Romantic"],
  },
  "dj-music": {
    serviceName: "Reception Entertainment",
    includes: ["DJ", "MC support", "Sound system", "Dance floor lighting"],
    imageKey: "music",
    price: 320000,
    tags: ["DJ", "MC", "Dance floor"],
  },
  catering: {
    serviceName: "Wedding Catering Service",
    includes: ["Menu planning", "Dinner service", "Staffing", "Late-night station"],
    imageKey: "catering",
    price: 850000,
    tags: ["South Asian", "Dinner", "Late night"],
  },
  makeup: {
    serviceName: "Bridal Makeup",
    includes: ["Bridal makeup", "Trial option", "Skin prep", "Touch-up kit"],
    imageKey: "beauty",
    price: 95000,
    tags: ["Bridal", "Soft glam", "Mobile"],
  },
  hair: {
    serviceName: "Bridal Hair Styling",
    includes: ["Bridal styling", "Trial option", "Veil placement", "Schedule planning"],
    imageKey: "beauty",
    price: 85000,
    tags: ["Bridal hair", "Updo", "Mobile"],
  },
  "wedding-planner": {
    serviceName: "Planning and Coordination",
    includes: ["Planning calls", "Vendor coordination", "Run of show", "Day-of leadership"],
    imageKey: "planner",
    price: 450000,
    tags: ["Coordination", "Timeline", "Vendor management"],
  },
  transportation: {
    serviceName: "Wedding Transportation",
    includes: ["Chauffeur", "Route planning", "Wedding party transport", "Standby time"],
    imageKey: "transport",
    price: 180000,
    tags: ["Limo", "Shuttle", "GTA routes"],
  },
  "cake-desserts": {
    serviceName: "Wedding Cake and Dessert Table",
    includes: ["Consultation", "Custom cake", "Dessert table", "Delivery"],
    imageKey: "cake",
    price: 140000,
    tags: ["Cake", "Desserts", "Custom"],
  },
  officiant: {
    serviceName: "Wedding Ceremony Officiating",
    includes: ["Legal ceremony", "Script planning", "Rehearsal notes", "Marriage paperwork"],
    imageKey: "venue",
    price: 90000,
    tags: ["Officiant", "Ceremony", "Legal"],
  },
  invitations: {
    serviceName: "Invitation and Stationery Suite",
    includes: ["Invitation design", "RSVP cards", "Day-of signage", "Print coordination"],
    imageKey: "invite",
    price: 120000,
    tags: ["Stationery", "Signage", "Custom"],
  },
};

const rows = [
  ["One King West Hotel & Residence", "one-king-west", "venues", "Toronto, ON", "onekingwest", "https://www.onekingwest.com/wedding-packages/", ["Historic", "Downtown", "Hotel"]],
  ["Graydon Hall Manor", "graydon-hall-manor", "venues", "Toronto, ON", "graydonhallmanor", "https://www.weddingwire.ca/mansion-weddings/graydon-hall-manor--e9504", ["Estate", "Garden", "Luxury"]],
  ["The Arlington Estate", "the-arlington-estate", "venues", "Vaughan, ON", "thearlingtonestate", "https://ca.linkedin.com/company/thearlingtonestate", ["Estate", "Luxury", "Vaughan"]],
  ["The Guild Inn Estate", "the-guild-inn-estate", "venues", "Scarborough, ON", "guildinnestate", "https://guildinnestate.com/", ["Bluffs", "Estate", "Scarborough"]],
  ["Liberty Grand Entertainment Complex", "liberty-grand", "venues", "Toronto, ON", "libertygrandto", "https://libertygrand.com/", ["Ballroom", "Exhibition Place", "Large weddings"]],

  ["Anuj Captures", "anuj-captures", "photography", "Toronto, ON", "anuj_captures", "https://anujcaptures.com/", ["South Asian", "Sikh", "Editorial"]],
  ["The Wedding Stories", "the-wedding-stories", "photography", "Brampton, ON", "theweddingstories.ca", "https://www.theweddingstories.ca/", ["South Asian", "Tamil", "Luxury"]],
  ["Gulati Photography", "gulati-photography", "photography", "GTA", "gulatiphotography", "https://www.gulatiphotography.com/", ["Photo + video", "Reception", "Destination"]],
  ["Galaxy Weddings Toronto", "galaxy-weddings-toronto", "photography", "Toronto, ON", "galaxyweddingstoronto", "https://www.galaxyweddingstoronto.com/", ["Photo", "Video", "Content creation"]],
  ["Canadian Wedding Photography", "canadian-wedding-photography", "photography", "Toronto, ON", "canadianweddingphotography", "https://www.eventsource.ca/listings/CanadianWeddingPhotography", ["Classic", "GTA", "Wedding albums"]],

  ["Impact Vision Memories", "impact-vision-memories", "videography", "Brampton, ON", "impactvisionmemories", "https://impactvisionstudios.ca/wedding-videographer-gta", ["South Asian", "Tamil", "Cinematic"]],
  ["The Spark Studios", "the-spark-studios", "videography", "Toronto, ON", "thespark.studios", "https://thesparkstudios.ca/", ["South Asian", "Muslim", "Pakistani"]],
  ["Wedding Diary", "wedding-diary", "videography", "Toronto, ON", "weddingdiary", "https://www.eventsource.ca/listings/SuttonPlaceHotelToronto/documents/SPH-Toronto-Vendor%20List%20%281%29_2024-05-24_18-28-16-6421.pdf", ["Photo + video", "Documentary", "GTA"]],
  ["Parallel Weddings", "parallel-weddings", "videography", "GTA", "parallelweddings", "https://www.parallelweddings.ca/", ["South Asian", "Photo + video", "Fusion"]],
  ["Mandegaran Studio", "mandegaran-studio", "videography", "Toronto, ON", "mandegaranstudio.ca", "https://www.instagram.com/mandegaranstudio.ca/", ["Luxury", "Persian", "Editorial"]],

  ["Just Floral Decor", "just-floral-decor", "decor", "GTA", "justfloraldecor", "https://justfloraldecor.com/", ["South Asian", "Garlands", "Ceremony decor"]],
  ["V&T Event Design", "v-and-t-event-design", "decor", "GTA", "vteventdesign", "https://vteventdesign.com/", ["Indian wedding", "Mandap", "Luxury"]],
  ["GTA Event Decor", "gta-event-decor", "decor", "Brampton, ON", "gtaeventdecor", "https://gtaeventdecor.ca/", ["Indian", "Multicultural", "Stage"]],
  ["Bling and Bells", "bling-and-bells", "decor", "Toronto, ON", "blingandbells", "https://blingandbells.com/pages/about-us", ["South Asian", "Rentals", "Decor"]],
  ["Dream Party Decor", "dream-party-decor", "decor", "Mississauga, ON", "dreampartydecor", "https://www.dreampartydecor.com/", ["Mandap", "Mehndi", "Sangeet"]],

  ["Floravue", "floravue", "florals", "Vaughan, ON", "floravue.ca", "https://www.startus.cc/company/floravue", ["Custom", "GTA", "Bridal bouquets"]],
  ["Maya Tsur Floral Design", "maya-tsur-floral-design", "florals", "Toronto, ON", "maya_floral_design", "https://mayatsurfloraldesign.ca/", ["Wedluxe", "Fine art", "Luxury"]],
  ["Sima Flower Designer", "sima-flower-designer", "florals", "Toronto, ON", "simaflowerdesigner", "https://simaflowerdesigner.com/", ["Award-winning", "Event design", "Luxury"]],
  ["Floral Werx", "floral-werx", "florals", "Toronto, ON", "floralwerx", "https://www.floralwerx.com/", ["Decor", "Installations", "GTA"]],
  ["Green Garden Florist", "green-garden-florist", "florals", "Toronto, ON", "green_garden_flower", "https://flufi.me/profile/green_garden_flower", ["Luxury", "Casa Loma", "Custom arrangements"]],

  ["Legendary Sound", "legendary-sound", "dj-music", "Toronto, ON", "legendarysound", "https://legendarysound.ca/", ["DJ", "Lighting", "MC"]],
  ["BBC Soundcrew", "bbc-soundcrew", "dj-music", "Toronto, ON", "bbcsoundcrew", "https://en.wikipedia.org/wiki/BBC_Soundcrew", ["South Asian", "Desi", "Reception"]],
  ["DJ Emporium", "dj-emporium", "dj-music", "Mississauga, ON", "djemporium", "https://www.instagram.com/djemporium/", ["Bollywood", "Punjabi", "Lighting"]],
  ["Empire Entertainment", "empire-entertainment", "dj-music", "GTA", "empireentertainment", "https://www.instagram.com/empireentertainment/", ["MC", "Fusion", "Production"]],
  ["DJ Floh Back Productions", "dj-floh-back-productions", "dj-music", "Toronto, ON", "djflohback", "https://www.instagram.com/djflohback/", ["Tamil", "Gaana", "Top 40"]],

  ["Khazana Catering", "khazana-catering", "catering", "Toronto, ON", "khazanacatering", "https://melaa.ca/category/catering", ["Indian", "Luxury", "South Asian"]],
  ["Punjabi by Nature", "punjabi-by-nature", "catering", "Brampton, ON", "punjabibynature", "https://melaa.ca/category/catering", ["Punjabi", "Live stations", "GTA"]],
  ["India's Taste", "indias-taste", "catering", "Brampton, ON", "indiastaste", "https://melaa.ca/category/catering", ["Indian", "Buffet", "Catering"]],
  ["The Host Fine Indian Cuisine", "the-host-fine-indian-cuisine", "catering", "Toronto, ON", "thehostfineindian", "https://www.thehostrestaurant.com/", ["Indian", "Fine dining", "Events"]],
  ["Avani Asian Indian Bistro", "avani-asian-indian-bistro", "catering", "Mississauga, ON", "avani_asian_indian_bistro", "https://www.avani.ca/", ["Indian", "Asian fusion", "Banquets"]],

  ["BBM Beauty", "bbm-beauty", "makeup", "GTA", "BBMBEAUTY_", "https://www.bbmbeauty.com/", ["Mobile", "Special events", "Bridal"]],
  ["Bridal Beauty", "bridal-beauty", "makeup", "Vaughan, ON", "bridalbeauty.ca", "https://bridalbeauty.ca/", ["Hair + makeup", "Asian bridal", "Mobile"]],
  ["FacesByTess", "faces-by-tess", "makeup", "Toronto, ON", "facesbytess", "https://www.facesbytess.com/", ["Natural glam", "All complexions", "Toronto"]],
  ["Zoya Beauty", "zoya-beauty", "makeup", "Vaughan, ON", "zoyabeauty.ca", "https://zoyabeauty.ca/about", ["South Asian", "Hair + makeup", "Influencer"]],
  ["Makeup by Preksha", "makeup-by-preksha", "makeup", "Toronto, ON", "makeupbypreksha", "https://www.makeupbypreksha.com/", ["South Asian", "Mobile", "Luxury"]],

  ["Hair Master Toronto", "hair-master-toronto", "hair", "Toronto, ON", "hairmastertoronto", "https://www.hairmastertoronto.com/", ["Bridal updos", "Luxury", "GTA"]],
  ["Be Wholehearted Beauty", "be-wholehearted-beauty", "hair", "Toronto, ON", "bewholeheartedbeauty", "https://bewholehearted.ca/", ["Hair specialist", "Bridal", "GTA"]],
  ["Hairluxe Co.", "hairluxe-co", "hair", "Toronto, ON", "hairluxeco", "https://www.hairluxe.ca/", ["Extensions", "Bridal hair", "Salon"]],
  ["Makeup by Lilo Le", "makeup-by-lilo-le", "hair", "Toronto, ON", "makeupbylilole", "https://lilole.ca/", ["Hair + makeup", "Korean beauty", "GTA"]],
  ["Helia Tavakoli Beauty", "helia-tavakoli-beauty", "hair", "Toronto, ON", "HeliaTavakoliBeauty", "https://www.heliatavakolibeauty.com/about-helia-tavakoli", ["Luxury", "Soft glam", "Mobile"]],

  ["Impresario Events", "impresario-events", "wedding-planner", "Toronto, ON", "impresarioevents", "https://livesimplywedding.com/", ["South Asian", "Coordination", "GTA"]],
  ["SAWC Planners", "sawc-planners", "wedding-planner", "Toronto, ON", "sawcplanners", "https://sawcplanners.com/services/", ["Luxury", "South Asian", "Destination"]],
  ["The Vow Company", "the-vow-company", "wedding-planner", "GTA", "thevowcompany.to", "https://www.thevowcompanyto.com/", ["Multicultural", "Indian", "Budget-friendly"]],
  ["Mirza & Co. Weddings", "mirza-and-co-weddings", "wedding-planner", "Vaughan, ON", "mirza_co_weddings", "https://melaa.ca/vendors/mirza-and-co-wedding-planning", ["Muslim", "Nikah", "South Asian"]],
  ["Ever After by Justine", "ever-after-by-justine", "wedding-planner", "Toronto, ON", "everafterbyjustine", "https://www.eventsource.ca/listings/EverAfterbyJustine", ["Planning", "Coordination", "Toronto"]],

  ["GTA Wedding Limo", "gta-wedding-limo", "transportation", "Toronto, ON", "gtaweddinglimo", "https://www.gtaweddinglimo.com/", ["Limo", "Party bus", "Wedding party"]],
  ["Toplink Limo", "toplink-limo", "transportation", "GTA", "toplinklimo", "https://toplinklimo.ca/services/wedding-transportation.aspx", ["Luxury", "Wedding transportation", "Chauffeur"]],
  ["Platinum Rides", "platinum-rides", "transportation", "Toronto, ON", "platinumrides", "https://platinumrides.ca/", ["Limo", "Executive", "Special events"]],
  ["Airfleet Limousine", "airfleet-limousine", "transportation", "Mississauga, ON", "airfleetlimo", "https://www.instagram.com/airfleetlimo/", ["Airport", "Wedding", "Fleet"]],
  ["A Celebrity Limousine", "a-celebrity-limousine", "transportation", "Toronto, ON", "acelebritylimo", "https://www.instagram.com/acelebritylimo/", ["Stretch limo", "Classic", "GTA"]],

  ["Dolce Vita Cakes", "dolce-vita-cakes", "cake-desserts", "GTA", "dolcevita_cakes_by_albina", "https://dolcevitacakes.ca/", ["Luxury cakes", "Custom", "Wedding"]],
  ["Cakin'IT", "cakinit", "cake-desserts", "Toronto, ON", "CakinIt416", "https://www.cakinit.ca/", ["Custom cake", "Dessert table", "GTA"]],
  ["Little Kakery", "little-kakery", "cake-desserts", "Toronto, ON", "littlekakery", "https://littlekakery.com/", ["Custom cakes", "Macarons", "Home bakery"]],
  ["Velvet Lane Cakes", "velvet-lane-cakes", "cake-desserts", "Toronto, ON", "velvetlanecakes", "https://www.velvetlanecakes.com/", ["Wedding cake", "Luxury", "Consultation"]],
  ["Nutmeg Bakeshop", "nutmeg-bakeshop", "cake-desserts", "GTA", "nutmegbakeshop", "https://www.nutmegbakeshop.com/", ["Wedding cakes", "Delivery", "Desserts"]],

  ["Robin Ellingwood Officiant", "robin-ellingwood-officiant", "officiant", "Toronto, ON", "gtaweddingofficiant", "https://www.gtaweddingofficiant.ca/", ["Licensed", "Personal ceremonies", "Toronto"]],
  ["Dearly Beloved Ceremonies", "dearly-beloved-ceremonies", "officiant", "Toronto, ON", "dearlybelovedceremonies", "https://dearlybeloved.ca/", ["Legal ceremony", "Personal", "GTA"]],
  ["MC Hollie", "mc-hollie", "officiant", "Toronto, ON", "multilingualmchollie", "https://www.multilingualmchollie.com/", ["Multilingual", "MC", "Officiant"]],
  ["Toronto City Weddings", "toronto-city-weddings", "officiant", "Toronto, ON", "torontocityweddings", "https://www.torontocityweddings.com/", ["Civil ceremony", "Simple signing", "Toronto"]],
  ["Enduring Promises", "enduring-promises", "officiant", "GTA", "enduringpromises", "https://www.enduringpromises.com/", ["Officiant team", "Custom ceremony", "Ontario"]],

  ["Stephita Wedding Invitations", "stephita-wedding-invitations", "invitations", "Markham, ON", "stephitainvitations", "https://www.stephita.com/", ["South Asian", "Laser cut", "Custom cards"]],
  ["Paper Damsels", "paper-damsels", "invitations", "Mississauga, ON", "paperdamsels", "https://www.paperdamsels.com/", ["Luxury", "Letterpress", "Signage"]],
  ["Paper & Poste", "paper-and-poste", "invitations", "Toronto, ON", "paperandposte", "https://www.paperandposte.ca/", ["Letterpress", "Foil", "Custom"]],
  ["June + Opal Paper Co.", "june-and-opal-paper-co", "invitations", "Pickering, ON", "juneandopal", "https://www.juneandopal.ca/", ["Bespoke", "Stationery", "Day-of details"]],
  ["Studio Oros", "studio-oros", "invitations", "Toronto, ON", "studiooros", "https://www.studiooros.ca/", ["Minimal", "Typography", "Signage"]],
];

export const gtaVendorSeeds = rows.map(([name, slug, serviceSlug, location, handle, sourceUrl, extraTags], index) => {
  const detail = defaults[serviceSlug];
  const rating = Number((4.6 + (index % 4) * 0.1).toFixed(1));
  const reviewsCount = 24 + ((index * 17) % 190);
  const priceOffset = ((index % 5) - 2) * 25000;

  return {
    name,
    slug,
    serviceSlug,
    location,
    rating,
    reviewsCount,
    startingPriceCents: Math.max(65000, detail.price + priceOffset),
    imageKey: detail.imageKey,
    styleTags: [...new Set([...extraTags, ...detail.tags])],
    availability: index % 5 === 0 ? "Limited" : "Available",
    matchScore: 88 + (index % 10),
    responseTime: index % 3 === 0 ? "Within 24 hours" : index % 3 === 1 ? "Same day" : "2 days",
    socials: [instagram(handle), website(sourceUrl)],
    about: `${name} is a GTA wedding vendor profile built from public web and Instagram positioning, with planning-ready package details for couples comparing ${detail.serviceName.toLowerCase()} options.`,
    serviceName: detail.serviceName,
    includes: detail.includes,
    sourceUrl,
  };
});
