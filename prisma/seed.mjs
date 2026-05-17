import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { gtaVendorSeeds } from "./gta-vendor-seeds.mjs";

const connectionString =
  process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5433/wedding_os?schema=public";

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString,
    connectionTimeoutMillis: 1500,
    idleTimeoutMillis: 1000,
    max: 5,
  }),
});

const images = {
  venue: "https://images.unsplash.com/photo-1519167758481-83f29c7c65c5?auto=format&fit=crop&w=1200&q=80",
  photo: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
  film: "https://images.unsplash.com/photo-1523438885200-e635ba2c371e?auto=format&fit=crop&w=1200&q=80",
  floral: "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=1200&q=80",
  decor: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=80",
  music: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80",
  catering: "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1200&q=80",
  beauty: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80",
  cake: "https://images.unsplash.com/photo-1535254973040-607b474cb50d?auto=format&fit=crop&w=1200&q=80",
  planner: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80",
  transport: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
  invite: "https://images.unsplash.com/photo-1518133835878-5a93cc3f89e5?auto=format&fit=crop&w=1200&q=80",
};

const globalCategories = [
  ["Venues", "venues", "VENDOR_SERVICE", "#8a6332", "Building2"],
  ["Photography", "photography", "VENDOR_SERVICE", "#9a7a50", "Camera"],
  ["Videography", "videography", "VENDOR_SERVICE", "#61735f", "Video"],
  ["Decor", "decor", "VENDOR_SERVICE", "#b66f72", "Sparkles"],
  ["Florals", "florals", "VENDOR_SERVICE", "#61735f", "Flower2"],
  ["DJ / Music", "dj-music", "VENDOR_SERVICE", "#191714", "Music"],
  ["Catering", "catering", "VENDOR_SERVICE", "#8a6332", "Utensils"],
  ["Makeup", "makeup", "VENDOR_SERVICE", "#b66f72", "Brush"],
  ["Hair", "hair", "VENDOR_SERVICE", "#b66f72", "Scissors"],
  ["Wedding Planner", "wedding-planner", "VENDOR_SERVICE", "#9a7a50", "CalendarCheck"],
  ["Transportation", "transportation", "VENDOR_SERVICE", "#61735f", "Car"],
  ["Cake / Desserts", "cake-desserts", "VENDOR_SERVICE", "#c8a97e", "Cake"],
  ["Officiant", "officiant", "VENDOR_SERVICE", "#191714", "ScrollText"],
  ["Invitations", "invitations", "VENDOR_SERVICE", "#9a7a50", "Mail"],
  ["Venue", "budget-venue", "BUDGET", "#8a6332", "Building2"],
  ["Catering", "budget-catering", "BUDGET", "#8a6332", "Utensils"],
  ["Photography", "budget-photography", "BUDGET", "#9a7a50", "Camera"],
  ["Videography", "budget-videography", "BUDGET", "#61735f", "Video"],
  ["Decor", "budget-decor", "BUDGET", "#b66f72", "Sparkles"],
  ["Florals", "budget-florals", "BUDGET", "#61735f", "Flower2"],
  ["Music", "budget-music", "BUDGET", "#191714", "Music"],
  ["Transportation", "budget-transportation", "BUDGET", "#61735f", "Car"],
  ["Cake", "budget-cake", "BUDGET", "#c8a97e", "Cake"],
  ["Miscellaneous", "budget-miscellaneous", "BUDGET", "#6f6a61", "MoreHorizontal"],
  ["Planning", "task-planning", "TASK", "#9a7a50", "ListChecks"],
  ["Vendor Follow-up", "task-vendor-follow-up", "TASK", "#61735f", "Inbox"],
  ["Family Logistics", "task-family-logistics", "TASK", "#b66f72", "UsersRound"],
];

const baseVendorSeeds = [
  {
    name: "Golden Lens Photography",
    slug: "golden-lens-photography",
    serviceSlug: "photography",
    location: "Toronto, ON",
    rating: 4.9,
    reviewsCount: 148,
    startingPriceCents: 520000,
    image: images.photo,
    styleTags: ["Editorial", "Candid", "South Asian"],
    availability: "Available",
    matchScore: 96,
    responseTime: "2 hours",
    socials: ["Instagram", "Pinterest", "Website"],
    about:
      "A Toronto photography studio known for warm editorial storytelling, multi-day South Asian celebrations, and calm day-of direction.",
    serviceName: "Signature Story",
    includes: ["10 hours coverage", "Two photographers", "Online gallery", "Engagement session"],
  },
  {
    name: "Ivory Bloom Florals",
    slug: "ivory-bloom-florals",
    serviceSlug: "florals",
    location: "Mississauga, ON",
    rating: 4.8,
    reviewsCount: 91,
    startingPriceCents: 340000,
    image: images.floral,
    styleTags: ["Lush", "Neutral", "Romantic"],
    availability: "Limited",
    matchScore: 91,
    responseTime: "5 hours",
    socials: ["Instagram", "Website"],
    about: "Floral design studio creating layered ceremony arches, reception tablescapes, and personal flowers.",
    serviceName: "Full Floral Design",
    includes: ["Bouquets", "Centerpieces", "Candles", "Installations"],
  },
  {
    name: "Maison Etoile Venue",
    slug: "maison-etoile-venue",
    serviceSlug: "venues",
    location: "Toronto, ON",
    rating: 4.9,
    reviewsCount: 207,
    startingPriceCents: 950000,
    image: images.venue,
    styleTags: ["Luxury", "Ballroom", "Downtown"],
    availability: "Available",
    matchScore: 94,
    responseTime: "1 day",
    socials: ["Instagram", "Website"],
    about: "A refined downtown venue with a grand ballroom, private terrace, and strong vendor operations team.",
    serviceName: "Saturday Prime",
    includes: ["Ballroom", "Terrace", "Suite", "Event captain"],
  },
  {
    name: "DJ Nova Events",
    slug: "dj-nova-events",
    serviceSlug: "dj-music",
    location: "Brampton, ON",
    rating: 4.7,
    reviewsCount: 122,
    startingPriceCents: 260000,
    image: images.music,
    styleTags: ["Bollywood", "Top 40", "Baraat"],
    availability: "Available",
    matchScore: 93,
    responseTime: "4 hours",
    socials: ["Instagram", "TikTok", "Website"],
    about: "High-energy DJ and MC team specializing in fusion receptions and packed dance floors.",
    serviceName: "Reception Party",
    includes: ["Sound system", "Wireless mics", "Lighting", "Planning call"],
  },
  {
    name: "Saffron & Sage Catering",
    slug: "saffron-sage-catering",
    serviceSlug: "catering",
    location: "Scarborough, ON",
    rating: 4.8,
    reviewsCount: 184,
    startingPriceCents: 820000,
    image: images.catering,
    styleTags: ["South Asian", "Family style", "Late night"],
    availability: "Limited",
    matchScore: 97,
    responseTime: "1 day",
    socials: ["Instagram", "Website"],
    about: "Full-service catering with South Asian menus, plated service, and late-night stations.",
    serviceName: "Fusion Dinner",
    includes: ["Cocktail bites", "Dinner", "Staffing", "Late-night chai"],
  },
  {
    name: "Luxe Mandap Decor",
    slug: "luxe-mandap-decor",
    serviceSlug: "decor",
    location: "Vaughan, ON",
    rating: 4.9,
    reviewsCount: 113,
    startingPriceCents: 680000,
    image: images.decor,
    styleTags: ["Mandap", "Draping", "Modern"],
    availability: "Available",
    matchScore: 95,
    responseTime: "6 hours",
    socials: ["Instagram", "Website"],
    about: "Mandap, stage, lighting, and reception decor with modern materials and precise installation teams.",
    serviceName: "Modern Mandap",
    includes: ["Mandap", "Draping", "Aisle", "Setup and strike"],
  },
  {
    name: "Jaffna Jasmine Events",
    slug: "jaffna-jasmine-events",
    serviceSlug: "wedding-planner",
    location: "Markham, ON",
    rating: 4.8,
    reviewsCount: 74,
    startingPriceCents: 420000,
    image: images.planner,
    styleTags: ["Tamil", "South Asian", "Multi-day"],
    availability: "Available",
    matchScore: 94,
    responseTime: "3 hours",
    socials: ["Instagram", "Website"],
    about:
      "Tamil Canadian planning team coordinating Hindu, Christian, and fusion wedding weekends across the GTA.",
    serviceName: "Tamil Wedding Coordination",
    includes: ["Family run-of-show", "Vendor coordination", "Ceremony logistics", "Reception timeline"],
  },
  {
    name: "Kumaran Kalyana Catering",
    slug: "kumaran-kalyana-catering",
    serviceSlug: "catering",
    location: "Scarborough, ON",
    rating: 4.9,
    reviewsCount: 132,
    startingPriceCents: 760000,
    image: images.catering,
    styleTags: ["Tamil", "Sri Lankan", "Vegetarian"],
    availability: "Limited",
    matchScore: 96,
    responseTime: "4 hours",
    socials: ["Instagram", "Website"],
    about:
      "Tamil and Sri Lankan catering with banana leaf service, vegetarian menus, hopper stations, and late-night short eats.",
    serviceName: "Tamil Feast Service",
    includes: ["Ceremony breakfast", "Lunch service", "Short eats", "Staffing"],
  },
  {
    name: "Scarborough Nadaswaram Collective",
    slug: "scarborough-nadaswaram-collective",
    serviceSlug: "dj-music",
    location: "Scarborough, ON",
    rating: 4.9,
    reviewsCount: 58,
    startingPriceCents: 180000,
    image: images.music,
    styleTags: ["Nadaswaram", "Thavil", "Ceremony"],
    availability: "Available",
    matchScore: 92,
    responseTime: "1 day",
    socials: ["Instagram", "YouTube"],
    about:
      "Traditional nadaswaram and thavil musicians for Tamil Hindu ceremonies, entrances, and temple wedding moments.",
    serviceName: "Ceremony Music Ensemble",
    includes: ["Nadaswaram", "Thavil", "Processional music", "Ceremony cues"],
  },
  {
    name: "Anjali Artistry Bridal",
    slug: "anjali-artistry-bridal",
    serviceSlug: "makeup",
    location: "Mississauga, ON",
    rating: 4.8,
    reviewsCount: 89,
    startingPriceCents: 220000,
    image: images.beauty,
    styleTags: ["Tamil bride", "Hair and makeup", "Jewelry setting"],
    availability: "Available",
    matchScore: 93,
    responseTime: "2 hours",
    socials: ["Instagram", "TikTok", "Website"],
    about:
      "Bridal beauty studio experienced with Tamil bridal draping, jewelry placement, long-wear makeup, and early morning ceremonies.",
    serviceName: "Tamil Bridal Beauty",
    includes: ["Makeup", "Hair styling", "Saree draping", "Jewelry setting"],
  },
  {
    name: "Kolam & Co Decor",
    slug: "kolam-and-co-decor",
    serviceSlug: "decor",
    location: "Brampton, ON",
    rating: 4.7,
    reviewsCount: 66,
    startingPriceCents: 540000,
    image: images.decor,
    styleTags: ["Kolam", "Mandap", "Temple-inspired"],
    availability: "Available",
    matchScore: 91,
    responseTime: "6 hours",
    socials: ["Instagram", "Website"],
    about:
      "Tamil decor studio designing mandaps, kolam-inspired aisle details, stage backdrops, and reception installations.",
    serviceName: "Kolam Ceremony Design",
    includes: ["Mandap", "Kolam aisle", "Stage backdrop", "Setup and strike"],
  },
  {
    name: "Marutham Florals",
    slug: "marutham-florals",
    serviceSlug: "florals",
    location: "Ajax, ON",
    rating: 4.8,
    reviewsCount: 47,
    startingPriceCents: 310000,
    image: images.floral,
    styleTags: ["Jasmine", "Garlands", "South Asian"],
    availability: "Limited",
    matchScore: 90,
    responseTime: "5 hours",
    socials: ["Instagram"],
    about:
      "Tamil floral studio specializing in jasmine accents, ceremony garlands, reception centerpieces, and family florals.",
    serviceName: "Garlands and Florals",
    includes: ["Wedding garlands", "Bouquets", "Centerpieces", "Family flowers"],
  },
  {
    name: "Velvet Veedu Films",
    slug: "velvet-veedu-films",
    serviceSlug: "videography",
    location: "Toronto, ON",
    rating: 4.9,
    reviewsCount: 81,
    startingPriceCents: 480000,
    image: images.film,
    styleTags: ["Tamil", "Cinematic", "Documentary"],
    availability: "Available",
    matchScore: 94,
    responseTime: "3 hours",
    socials: ["Instagram", "Vimeo", "Website"],
    about:
      "Tamil Canadian wedding filmmakers capturing temple ceremonies, speeches, dance floors, and multi-day family stories.",
    serviceName: "Cinematic Wedding Film",
    includes: ["Highlight film", "Full ceremony edit", "Drone coverage", "Audio capture"],
  },
  {
    name: "Kovil Street Sweets",
    slug: "kovil-street-sweets",
    serviceSlug: "cake-desserts",
    location: "Scarborough, ON",
    rating: 4.7,
    reviewsCount: 53,
    startingPriceCents: 140000,
    image: images.cake,
    styleTags: ["Tamil sweets", "Dessert table", "Eggless"],
    availability: "Available",
    matchScore: 88,
    responseTime: "1 day",
    socials: ["Instagram", "Website"],
    about:
      "Dessert studio offering eggless cakes, Tamil sweets, payasam cups, and late-night dessert tables.",
    serviceName: "Tamil Dessert Table",
    includes: ["Eggless cake", "Tamil sweets", "Payasam cups", "Display styling"],
  },
  {
    name: "Tamil Pearls Invitations",
    slug: "tamil-pearls-invitations",
    serviceSlug: "invitations",
    location: "Richmond Hill, ON",
    rating: 4.8,
    reviewsCount: 39,
    startingPriceCents: 95000,
    image: images.invite,
    styleTags: ["Tamil typography", "Bilingual", "Stationery"],
    availability: "Available",
    matchScore: 89,
    responseTime: "4 hours",
    socials: ["Instagram", "Website"],
    about:
      "Stationery designer creating Tamil-English invitations, ceremony cards, seating charts, and day-of signage.",
    serviceName: "Bilingual Invitation Suite",
    includes: ["Tamil-English invite", "RSVP card", "Seating chart", "Day-of signage"],
  },
  {
    name: "Northern Tamil Ceremonies",
    slug: "northern-tamil-ceremonies",
    serviceSlug: "officiant",
    location: "Toronto, ON",
    rating: 4.9,
    reviewsCount: 44,
    startingPriceCents: 120000,
    image: images.venue,
    styleTags: ["Tamil Hindu", "Ceremony guidance", "Bilingual"],
    availability: "Available",
    matchScore: 92,
    responseTime: "1 day",
    socials: ["Website"],
    about:
      "Ceremony guidance and officiant coordination for Tamil Hindu and bilingual wedding ceremonies in Ontario.",
    serviceName: "Tamil Ceremony Guidance",
    includes: ["Ceremony planning", "Bilingual guidance", "Family briefing", "Ritual checklist"],
  },
  {
    name: "Eelam Elite DJ",
    slug: "eelam-elite-dj",
    serviceSlug: "dj-music",
    location: "Markham, ON",
    rating: 4.8,
    reviewsCount: 97,
    startingPriceCents: 280000,
    image: images.music,
    styleTags: ["Tamil hits", "Gaana", "Bollywood"],
    availability: "Limited",
    matchScore: 95,
    responseTime: "2 hours",
    socials: ["Instagram", "TikTok", "Website"],
    about:
      "Tamil Canadian DJ and MC team mixing Tamil hits, gaana, Bollywood, Top 40, and reception programming.",
    serviceName: "Tamil Fusion Reception",
    includes: ["DJ", "MC", "Dance floor lighting", "Family entrance mixes"],
  },
  {
    name: "Maple Lanka Limos",
    slug: "maple-lanka-limos",
    serviceSlug: "transportation",
    location: "Pickering, ON",
    rating: 4.6,
    reviewsCount: 41,
    startingPriceCents: 160000,
    image: images.transport,
    styleTags: ["GTA routes", "Family logistics", "Luxury fleet"],
    availability: "Available",
    matchScore: 87,
    responseTime: "6 hours",
    socials: ["Website"],
    about:
      "Transportation team coordinating wedding party vehicles, family shuttles, and temple-to-reception routes across the GTA.",
    serviceName: "Wedding Day Transport",
    includes: ["Wedding party SUV", "Family shuttle", "Route planning", "Standby time"],
  },
];

const vendorSeeds = [
  ...baseVendorSeeds,
  ...gtaVendorSeeds.map((vendor) => ({
    ...vendor,
    image: images[vendor.imageKey] ?? images.venue,
  })),
];

async function main() {
  await prisma.message.deleteMany();
  await prisma.conversationReadState.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.fileAsset.deleteMany();
  await prisma.contractRecord.deleteMany();
  await prisma.paymentScheduleItem.deleteMany();
  await prisma.invoiceRecord.deleteMany();
  await prisma.scheduledCall.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.inquiry.deleteMany();
  await prisma.vendorPitch.deleteMany();
  await prisma.vendorOpportunity.deleteMany();
  await prisma.profileViewEvent.deleteMany();
  await prisma.vendorComparisonItem.deleteMany();
  await prisma.savedVendor.deleteMany();
  await prisma.plannerSnapshot.deleteMany();
  await prisma.publicRSVPToken.deleteMany();
  await prisma.timelineTask.deleteMany();
  await prisma.guest.deleteMany();
  await prisma.guestGroup.deleteMany();
  await prisma.budgetItem.deleteMany();
  await prisma.review.deleteMany();
  await prisma.vendorFaq.deleteMany();
  await prisma.pastWedding.deleteMany();
  await prisma.portfolioItem.deleteMany();
  await prisma.vendorService.deleteMany();
  await prisma.category.deleteMany();
  await prisma.invite.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.emailVerificationToken.deleteMany();
  await prisma.workspacePreference.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.weddingMember.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.wedding.deleteMany();
  await prisma.vendorBusiness.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.user.deleteMany();

  const coupleUser = await prisma.user.create({
    data: {
      email: "maya@weddingos.local",
      name: "Maya Patel",
      accountType: "COUPLE",
      passwordHash: await bcrypt.hash("weddingos-local", 10),
    },
  });

  const vendorUser = await prisma.user.create({
    data: {
      email: "golden@weddingos.local",
      name: "Golden Lens Owner",
      accountType: "VENDOR",
      passwordHash: await bcrypt.hash("weddingos-local", 10),
    },
  });

  const adminUser = await prisma.user.create({
    data: {
      email: "admin@weddingos.local",
      name: "Wedding OS Admin",
      accountType: "ADMIN",
      passwordHash: await bcrypt.hash("weddingos-local", 10),
    },
  });

  const adminOrg = await prisma.organization.create({
    data: {
      name: "Wedding OS Admin",
      slug: "wedding-os-admin",
      type: "ADMIN",
      memberships: { create: { userId: adminUser.id, role: "ADMIN" } },
    },
  });

  const coupleOrg = await prisma.organization.create({
    data: {
      name: "Arjun & Maya Planning",
      slug: "arjun-maya-planning",
      type: "COUPLE",
      memberships: { create: { userId: coupleUser.id, role: "OWNER" } },
    },
  });

  const wedding = await prisma.wedding.create({
    data: {
      organizationId: coupleOrg.id,
      coupleNames: "Arjun & Maya",
      slug: "arjun-maya",
      date: new Date("2026-07-18T16:00:00.000Z"),
      location: "Toronto, Ontario",
      style: "Modern luxury, elegant, South Asian fusion",
      budgetCents: 3500000,
      guestCount: 120,
      members: { create: { userId: coupleUser.id, role: "OWNER" } },
    },
  });

  await prisma.workspacePreference.create({
    data: {
      userId: coupleUser.id,
      activeType: "WEDDING",
      activeOrganizationId: coupleOrg.id,
      activeWeddingId: wedding.id,
    },
  });

  const categories = new Map();
  for (const [name, slug, type, color, icon] of globalCategories) {
    const category = await prisma.category.create({
      data: { name, slug, type, scope: "GLOBAL", color, icon },
    });
    categories.set(slug, category);
  }

  const customBudgetCategory = await prisma.category.create({
    data: {
      name: "Cultural Events",
      slug: "arjun-maya-cultural-events",
      type: "BUDGET",
      scope: "WEDDING",
      ownerWeddingId: wedding.id,
      color: "#b66f72",
      icon: "Sparkles",
      sortOrder: 1,
    },
  });

  const vendorBusinesses = new Map();
  const services = new Map();
  let goldenLensOrg = null;
  let goldenLensVendor = null;
  for (const vendorSeed of vendorSeeds) {
    const org = await prisma.organization.create({
      data: {
        name: vendorSeed.name,
        slug: `${vendorSeed.slug}-org`,
        type: "VENDOR",
      },
    });

    if (vendorSeed.slug === "golden-lens-photography") {
      goldenLensOrg = org;
      await prisma.membership.create({
        data: {
          userId: vendorUser.id,
          organizationId: org.id,
          role: "OWNER",
        },
      });
    }

    const vendor = await prisma.vendorBusiness.create({
      data: {
        organizationId: org.id,
        name: vendorSeed.name,
        slug: vendorSeed.slug,
        location: vendorSeed.location,
        rating: vendorSeed.rating,
        reviewsCount: vendorSeed.reviewsCount,
        startingPriceCents: vendorSeed.startingPriceCents,
        image: vendorSeed.image,
        gallery: [vendorSeed.image, images.venue, images.decor],
        styleTags: vendorSeed.styleTags,
        availability: vendorSeed.availability,
        matchScore: vendorSeed.matchScore,
        responseTime: vendorSeed.responseTime,
        socials: vendorSeed.socials,
        about: vendorSeed.about,
        approvedAt: new Date(),
      },
    });

    const service = await prisma.vendorService.create({
      data: {
        vendorBusinessId: vendor.id,
        categoryId: categories.get(vendorSeed.serviceSlug).id,
        name: vendorSeed.serviceName,
        description: `${vendorSeed.name} ${vendorSeed.serviceName.toLowerCase()} package.`,
        startingPriceCents: vendorSeed.startingPriceCents,
        includes: vendorSeed.includes,
      },
    });

    await prisma.portfolioItem.create({
      data: {
        vendorBusinessId: vendor.id,
        title: `${vendorSeed.name} portfolio highlight`,
        image: vendorSeed.image,
      },
    });

    await prisma.vendorFaq.createMany({
      data: [
        {
          vendorBusinessId: vendor.id,
          question: "How do quote requests work?",
          answer: "Couples request a quote and the inquiry appears in the vendor CRM with a shared conversation.",
          sortOrder: 1,
        },
        {
          vendorBusinessId: vendor.id,
          question: "Can services use custom categories?",
          answer: "Yes. Vendor-specific service categories can be added without waiting on platform taxonomy changes.",
          sortOrder: 2,
        },
      ],
    });

    vendorBusinesses.set(vendorSeed.slug, vendor);
    if (vendorSeed.slug === "golden-lens-photography") {
      goldenLensVendor = vendor;
    }
    services.set(vendorSeed.slug, service);
  }

  if (goldenLensOrg && goldenLensVendor) {
    await prisma.workspacePreference.create({
      data: {
        userId: vendorUser.id,
        activeType: "VENDOR",
        activeOrganizationId: goldenLensOrg.id,
        activeVendorBusinessId: goldenLensVendor.id,
      },
    });
  }

  const goldenLens = vendorBusinesses.get("golden-lens-photography");
  const goldenService = services.get("golden-lens-photography");

  await prisma.review.createMany({
    data: [
      {
        vendorBusinessId: goldenLens.id,
        author: "Priya & Daniel",
        rating: 5,
        body: "They captured every important family moment without making the day feel staged.",
      },
      {
        vendorBusinessId: goldenLens.id,
        author: "Elena & Mark",
        rating: 5,
        body: "Elegant, organized, and fast with previews. The gallery felt like a magazine spread.",
      },
    ],
  });

  await prisma.pastWedding.create({
    data: {
      vendorBusinessId: goldenLens.id,
      coupleNames: "Priya & Daniel",
      venue: "Graydon Hall Manor",
      style: "Garden reception",
      image: images.venue,
    },
  });

  const inquiry = await prisma.inquiry.create({
    data: {
      weddingId: wedding.id,
      vendorBusinessId: goldenLens.id,
      serviceId: goldenService.id,
      message:
        "Hi Golden Lens Photography, we are planning a modern luxury Toronto wedding for 120 guests. Could you send a quote and availability for July 18, 2026?",
    },
  });

  const conversation = await prisma.conversation.create({
    data: {
      inquiryId: inquiry.id,
      weddingId: wedding.id,
      vendorBusinessId: goldenLens.id,
      messages: {
        create: [
          {
            senderUserId: coupleUser.id,
            senderRole: "COUPLE",
            senderName: "Maya",
            body: inquiry.message,
          },
          {
            senderRole: "VENDOR",
            senderName: "Golden Lens Photography",
            body: "Thanks Arjun & Maya - I can send a proposal today and hold July 18 while you review.",
          },
        ],
      },
    },
  });

  await prisma.lead.create({
    data: {
      inquiryId: inquiry.id,
      stage: "NEW_INQUIRY",
      estimatedValueCents: goldenService.startingPriceCents,
      lastMessage: "Thanks Arjun & Maya - I can send a proposal today and hold July 18 while you review.",
    },
  });

  const budgetRows = [
    ["budget-venue", "Maison Etoile venue deposit", "maison-etoile-venue", 800000, 500000, "DEPOSIT_PAID"],
    ["budget-catering", "Saffron & Sage dinner service", "saffron-sage-catering", 720000, 350000, "DEPOSIT_PAID"],
    ["budget-decor", "Luxe Mandap ceremony decor", "luxe-mandap-decor", 480000, 250000, "DEPOSIT_PAID"],
    [customBudgetCategory.slug, "Sangeet decor and rentals", null, 180000, 0, "PLANNED"],
  ];

  for (const [categorySlug, label, vendorSlug, amountCents, paidCents, status] of budgetRows) {
    const category = categories.get(categorySlug) ?? customBudgetCategory;
    await prisma.budgetItem.create({
      data: {
        weddingId: wedding.id,
        categoryId: category.id,
        label,
        vendorBusinessId: vendorSlug ? vendorBusinesses.get(vendorSlug)?.id : null,
        amountCents,
        paidCents,
        dueDate: new Date("2026-06-15T12:00:00.000Z"),
        status,
      },
    });
  }

  const guestGroup = await prisma.guestGroup.create({
    data: { weddingId: wedding.id, name: "Patel family" },
  });

  await prisma.guest.createMany({
    data: Array.from({ length: 24 }, (_, index) => ({
      weddingId: wedding.id,
      guestGroupId: guestGroup.id,
      name: `Wedding Guest ${index + 1}`,
      email: `guest${index + 1}@example.com`,
      phone: `416-555-${1000 + index}`,
      status: index % 5 === 0 ? "PENDING" : index % 7 === 0 ? "DECLINED" : "ATTENDING",
      plusOne: index % 4 === 0,
      additionalGuestCount: index % 4 === 0 ? 1 : 0,
      companionDetails: index % 4 === 0 ? "Partner / spouse" : null,
      mealChoice: index % 3 === 0 ? "Vegetarian" : "Pending",
      tableNumber: index % 8 === 0 ? null : (index % 10) + 1,
    })),
  });

  await prisma.timelineTask.createMany({
    data: [
      {
        weddingId: wedding.id,
        categoryId: categories.get("task-vendor-follow-up").id,
        title: "Hire photographer",
        group: "12 months before",
        dueDate: new Date("2025-09-01T12:00:00.000Z"),
        completed: false,
        relatedVendorId: goldenLens.id,
        priority: "High",
      },
      {
        weddingId: wedding.id,
        categoryId: categories.get("task-planning").id,
        title: "Finalize guest list",
        group: "9 months before",
        dueDate: new Date("2025-11-01T12:00:00.000Z"),
        completed: false,
        priority: "High",
      },
      {
        weddingId: wedding.id,
        categoryId: categories.get("task-family-logistics").id,
        title: "Confirm family arrival schedule",
        group: "Wedding week",
        dueDate: new Date("2026-07-13T12:00:00.000Z"),
        completed: false,
        priority: "Medium",
      },
    ],
  });

  await prisma.savedVendor.createMany({
    data: ["golden-lens-photography", "ivory-bloom-florals", "dj-nova-events"].map((slug) => ({
      weddingId: wedding.id,
      vendorBusinessId: vendorBusinesses.get(slug).id,
    })),
  });

  await prisma.vendorComparisonItem.createMany({
    data: ["golden-lens-photography", "ivory-bloom-florals", "maison-etoile-venue"].map((slug) => ({
      weddingId: wedding.id,
      vendorBusinessId: vendorBusinesses.get(slug).id,
    })),
  });

  await prisma.plannerSnapshot.create({
    data: {
      weddingId: wedding.id,
      prompt: "Plan a modern luxury Toronto wedding for 120 guests under $35,000.",
      result: {
        insights: [
          "Photography and venue are currently your highest-impact booking decisions.",
          "Book makeup and transportation next based on your timeline.",
        ],
        riskFlags: ["Photography is not yet booked for a prime July date."],
        recommendedVendors: ["golden-lens-photography", "dj-nova-events"],
      },
    },
  });

  await prisma.vendorOpportunity.create({
    data: {
      weddingId: wedding.id,
      categoryId: categories.get("florals").id,
      title: "Reception floral installation",
      description: "Looking for a floral team that can handle ceremony garlands, reception centerpieces, and a modern champagne palette.",
      budgetCents: 450000,
      location: "Toronto, Ontario",
      date: wedding.date,
      guestCount: wedding.guestCount,
    },
  });

  await prisma.invite.createMany({
    data: [
      {
        code: "COUPLE-BETA-ARJUN",
        role: "COUPLE_OWNER",
        createdByUserId: adminUser.id,
      },
      {
        code: "VENDOR-BETA-GOLDEN",
        role: "VENDOR_OWNER",
        createdByUserId: adminUser.id,
      },
      {
        code: "ADMIN-BETA-LOCAL",
        role: "ADMIN",
        organizationId: adminOrg.id,
        createdByUserId: adminUser.id,
      },
    ],
  });

  console.log(`Seeded Wedding OS local data. Conversation: ${conversation.id}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
