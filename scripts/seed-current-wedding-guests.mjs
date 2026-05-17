import { PrismaClient, RSVPStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

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

const groupNames = ["Family", "Friends", "Wedding Party", "Extended Family", "Family Friends", "Work Friends"];

const guests = [
  {
    name: "Bobby Smith",
    email: "bobby.smith@gmail.com",
    phone: "6475552101",
    group: "Friends",
    status: RSVPStatus.ATTENDING,
    meal: "Vegetarian",
    companions: ["Priya Smith", "Anika Smith"],
    events: {
      "Mehndi/Sangeet": RSVPStatus.ATTENDING,
      "Wedding ceremony": RSVPStatus.ATTENDING,
      Reception: RSVPStatus.ATTENDING,
    },
  },
  {
    name: "Nimalan Chandrasekara",
    email: "nimalan@gmail.com",
    phone: "6479287357",
    group: "Family",
    status: RSVPStatus.DECLINED,
    meal: "Pending",
    companions: ["Kavitha Chandrasekara"],
    events: {
      "Wedding ceremony": RSVPStatus.DECLINED,
      Reception: RSVPStatus.DECLINED,
    },
  },
  {
    name: "Pretheev Visvakumar",
    email: "pretheev@gmail.com",
    phone: "9054242424",
    group: "Friends",
    status: RSVPStatus.PENDING,
    meal: "Pending",
    companions: [],
    events: {
      "Mehndi/Sangeet": RSVPStatus.PENDING,
      "Wedding ceremony": RSVPStatus.PENDING,
      Reception: RSVPStatus.PENDING,
    },
  },
  {
    name: "Sivananthan Rajaratnam",
    email: "siva.rajaratnam@gmail.com",
    phone: "4165550198",
    group: "Extended Family",
    status: RSVPStatus.ATTENDING,
    meal: "Non-vegetarian",
    companions: ["Malini Rajaratnam"],
    events: {
      "Nalangu or family ceremony": RSVPStatus.ATTENDING,
      "Wedding ceremony": RSVPStatus.ATTENDING,
      Reception: RSVPStatus.ATTENDING,
      "Post-wedding family meal": RSVPStatus.ATTENDING,
    },
  },
  {
    name: "Tharshini Pathmanathan",
    email: "tharshini.path@gmail.com",
    phone: "6475557820",
    group: "Wedding Party",
    status: RSVPStatus.ATTENDING,
    meal: "Vegetarian",
    companions: [],
    events: {
      "Engagement / pre-wedding": RSVPStatus.ATTENDING,
      "Mehndi/Sangeet": RSVPStatus.ATTENDING,
      "Wedding ceremony": RSVPStatus.ATTENDING,
      Reception: RSVPStatus.ATTENDING,
    },
  },
  {
    name: "Kajan Selvarajah",
    email: "kajan.selva@gmail.com",
    phone: "4165553366",
    group: "Wedding Party",
    status: RSVPStatus.ATTENDING,
    meal: "Non-vegetarian",
    companions: ["Mira Selvarajah"],
    events: {
      "Mehndi/Sangeet": RSVPStatus.ATTENDING,
      "Wedding ceremony": RSVPStatus.ATTENDING,
      Reception: RSVPStatus.ATTENDING,
    },
  },
  {
    name: "Abirami Kanagarajah",
    email: "abirami.k@gmail.com",
    phone: "9055554432",
    group: "Family",
    status: RSVPStatus.ATTENDING,
    meal: "Vegetarian",
    companions: ["Suren Kanagarajah", "Aadhavan Kanagarajah"],
    events: {
      "Nalangu or family ceremony": RSVPStatus.ATTENDING,
      "Wedding ceremony": RSVPStatus.ATTENDING,
      Reception: RSVPStatus.ATTENDING,
    },
  },
  {
    name: "Rishi Nadarajah",
    email: "rishi.nadarajah@gmail.com",
    phone: "6475559081",
    group: "Friends",
    status: RSVPStatus.ATTENDING,
    meal: "Non-vegetarian",
    companions: [],
    events: {
      "Mehndi/Sangeet": RSVPStatus.ATTENDING,
      Reception: RSVPStatus.ATTENDING,
    },
  },
  {
    name: "Anjali Thurairajah",
    email: "anjali.thurai@gmail.com",
    phone: "2895556172",
    group: "Work Friends",
    status: RSVPStatus.PENDING,
    meal: "Pending",
    companions: ["Rahul Thurairajah"],
    events: {
      Reception: RSVPStatus.PENDING,
    },
  },
  {
    name: "Viknesh Somasundaram",
    email: "viknesh.soma@gmail.com",
    phone: "4165557721",
    group: "Family Friends",
    status: RSVPStatus.ATTENDING,
    meal: "Vegetarian",
    companions: ["Nithya Somasundaram", "Kavin Somasundaram", "Ila Somasundaram"],
    events: {
      "Wedding ceremony": RSVPStatus.ATTENDING,
      Reception: RSVPStatus.ATTENDING,
    },
  },
  {
    name: "Meera Santhakumar",
    email: "meera.santhakumar@gmail.com",
    phone: "6475556742",
    group: "Extended Family",
    status: RSVPStatus.ATTENDING,
    meal: "Vegan",
    companions: [],
    events: {
      "Nalangu or family ceremony": RSVPStatus.ATTENDING,
      "Wedding ceremony": RSVPStatus.ATTENDING,
      "Post-wedding family meal": RSVPStatus.ATTENDING,
    },
  },
  {
    name: "Arul Yogendran",
    email: "arul.yogendran@gmail.com",
    phone: "9055552388",
    group: "Family Friends",
    status: RSVPStatus.DECLINED,
    meal: "Pending",
    companions: [],
    events: {
      Reception: RSVPStatus.DECLINED,
    },
  },
  {
    name: "Janani Kugathasan",
    email: "janani.kugathasan@gmail.com",
    phone: "4165559820",
    group: "Friends",
    status: RSVPStatus.ATTENDING,
    meal: "Vegetarian",
    companions: ["Naveen Kugathasan"],
    events: {
      "Mehndi/Sangeet": RSVPStatus.ATTENDING,
      Reception: RSVPStatus.ATTENDING,
    },
  },
  {
    name: "Karthik Shanmuganathan",
    email: "karthik.shan@gmail.com",
    phone: "6475556633",
    group: "Work Friends",
    status: RSVPStatus.PENDING,
    meal: "Pending",
    companions: [],
    events: {
      Reception: RSVPStatus.PENDING,
    },
  },
  {
    name: "Yalini Vigneswaran",
    email: "yalini.vignes@gmail.com",
    phone: "9055553370",
    group: "Wedding Party",
    status: RSVPStatus.ATTENDING,
    meal: "Vegetarian",
    companions: [],
    events: {
      "Engagement / pre-wedding": RSVPStatus.ATTENDING,
      "Mehndi/Sangeet": RSVPStatus.ATTENDING,
      "Wedding ceremony": RSVPStatus.ATTENDING,
      Reception: RSVPStatus.ATTENDING,
    },
  },
  {
    name: "Dinesh Balendran",
    email: "dinesh.balendran@gmail.com",
    phone: "4165551180",
    group: "Family",
    status: RSVPStatus.ATTENDING,
    meal: "Non-vegetarian",
    companions: ["Shalini Balendran"],
    events: {
      "Wedding ceremony": RSVPStatus.ATTENDING,
      Reception: RSVPStatus.ATTENDING,
      "Post-wedding family meal": RSVPStatus.ATTENDING,
    },
  },
];

function normalize(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function resolveEvent(eventMap, requestedName) {
  const direct = eventMap.get(normalize(requestedName));
  if (direct) return direct;
  const requested = normalize(requestedName);
  return Array.from(eventMap.values()).find((event) => normalize(event.name).includes(requested) || requested.includes(normalize(event.name)));
}

async function ensureEvents(wedding) {
  const existing = await prisma.weddingEvent.findMany({ where: { weddingId: wedding.id }, orderBy: [{ sortOrder: "asc" }, { date: "asc" }] });
  if (existing.length) return existing;

  const weddingDate = new Date(wedding.date);
  const day = 86_400_000;
  const template = [
    ["Engagement / pre-wedding", "engagement", -120, "18:00"],
    ["Nalangu or family ceremony", "nalangu", -3, "10:00"],
    ["Mehndi/Sangeet", "sangeet", -2, "18:00"],
    ["Wedding ceremony", "ceremony", 0, "09:00"],
    ["Reception", "reception", 0, "18:00"],
    ["Post-wedding family meal", "family_meal", 1, "12:00"],
  ];

  await prisma.weddingEvent.createMany({
    data: template.map(([name, type, offset, startTime], index) => ({
      weddingId: wedding.id,
      name,
      type,
      date: new Date(weddingDate.getTime() + Number(offset) * day),
      startTime,
      location: wedding.location,
      sortOrder: index,
    })),
  });

  return prisma.weddingEvent.findMany({ where: { weddingId: wedding.id }, orderBy: [{ sortOrder: "asc" }, { date: "asc" }] });
}

async function main() {
  const wedding =
    (process.env.WEDDING_ID
      ? await prisma.wedding.findUnique({ where: { id: process.env.WEDDING_ID } })
      : null) ??
    (process.env.WEDDING_SLUG
      ? await prisma.wedding.findUnique({ where: { slug: process.env.WEDDING_SLUG } })
      : null) ??
    (await prisma.wedding.findFirst({ where: { coupleNames: { contains: "Nila", mode: "insensitive" } }, orderBy: { updatedAt: "desc" } })) ??
    (await prisma.wedding.findFirst({ orderBy: { updatedAt: "desc" } }));

  if (!wedding) throw new Error("No wedding found to seed guests for.");

  const events = await ensureEvents(wedding);
  const eventMap = new Map(events.map((event) => [normalize(event.name), event]));

  await prisma.$transaction(async (tx) => {
    await tx.publicRSVPToken.deleteMany({ where: { weddingId: wedding.id } });
    await tx.seatingTable.deleteMany({ where: { weddingId: wedding.id } });
    await tx.guest.deleteMany({ where: { weddingId: wedding.id } });
    await tx.guestGroup.deleteMany({ where: { weddingId: wedding.id } });

    const groups = new Map();
    for (const name of groupNames) {
      const group = await tx.guestGroup.create({ data: { weddingId: wedding.id, name } });
      groups.set(name, group.id);
    }

    let totalAttendees = 0;
    for (const item of guests) {
      totalAttendees += 1 + item.companions.length;
      const guest = await tx.guest.create({
        data: {
          weddingId: wedding.id,
          guestGroupId: groups.get(item.group),
          name: item.name,
          email: item.email,
          phone: item.phone,
          status: item.status,
          plusOne: item.companions.length > 0,
          additionalGuestCount: item.companions.length,
          companionDetails: item.companions.length ? JSON.stringify(item.companions) : null,
          mealChoice: item.meal,
          notes: item.status === RSVPStatus.PENDING ? "Needs RSVP follow-up." : null,
        },
      });

      await tx.guestCompanion.createMany({
        data: item.companions.map((name, index) => ({
          guestId: guest.id,
          name,
          relation: index === 0 ? "Guest" : "Family",
          mealChoice: item.meal === "Pending" ? null : item.meal,
          sortOrder: index,
        })),
      });

      for (const event of events) {
        const status = item.events[event.name] ?? item.events[Object.keys(item.events).find((name) => resolveEvent(eventMap, name)?.id === event.id)] ?? null;
        const invited = Boolean(status);
        await tx.guestEventInvite.create({
          data: {
            guestId: guest.id,
            eventId: event.id,
            invited,
          },
        });
        if (invited) {
          await tx.eventRsvp.create({
            data: {
              guestId: guest.id,
              eventId: event.id,
              status,
              attendeeCount: status === RSVPStatus.ATTENDING ? 1 + item.companions.length : 0,
              mealChoice: status === RSVPStatus.ATTENDING ? item.meal : "Pending",
            },
          });
        }
      }
    }

    await tx.wedding.update({
      where: { id: wedding.id },
      data: { guestCount: totalAttendees },
    });
  });

  console.log(
    JSON.stringify(
      {
        wedding: wedding.coupleNames,
        weddingId: wedding.id,
        events: events.map((event) => event.name),
        mainGuests: guests.length,
        totalAttendees: guests.reduce((sum, guest) => sum + 1 + guest.companions.length, 0),
      },
      null,
      2,
    ),
  );
}

try {
  await main();
} finally {
  await prisma.$disconnect();
}
