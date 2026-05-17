import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { gtaVendorSeeds } from "../prisma/gta-vendor-seeds.mjs";

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

async function upsertVendor(seed) {
  const category = await prisma.category.findFirst({
    where: { slug: seed.serviceSlug, type: "VENDOR_SERVICE" },
  });

  if (!category) {
    throw new Error(`Missing category ${seed.serviceSlug}`);
  }

  const organization = await prisma.organization.upsert({
    where: { slug: `${seed.slug}-org` },
    create: {
      name: seed.name,
      slug: `${seed.slug}-org`,
      type: "VENDOR",
    },
    update: { name: seed.name, type: "VENDOR" },
  });

  const image = images[seed.imageKey] ?? images.venue;
  const vendor = await prisma.vendorBusiness.upsert({
    where: { slug: seed.slug },
    create: {
      organizationId: organization.id,
      name: seed.name,
      slug: seed.slug,
      location: seed.location,
      rating: seed.rating,
      reviewsCount: seed.reviewsCount,
      startingPriceCents: seed.startingPriceCents,
      image,
      gallery: [image],
      styleTags: seed.styleTags,
      availability: seed.availability,
      matchScore: seed.matchScore,
      responseTime: seed.responseTime,
      socials: seed.socials,
      about: seed.about,
      approvedAt: new Date(),
    },
    update: {
      name: seed.name,
      location: seed.location,
      rating: seed.rating,
      reviewsCount: seed.reviewsCount,
      startingPriceCents: seed.startingPriceCents,
      image,
      gallery: [image],
      styleTags: seed.styleTags,
      availability: seed.availability,
      matchScore: seed.matchScore,
      responseTime: seed.responseTime,
      socials: seed.socials,
      about: seed.about,
      approvedAt: new Date(),
      hiddenAt: null,
    },
  });

  const existingService = await prisma.vendorService.findFirst({
    where: { vendorBusinessId: vendor.id, name: seed.serviceName },
  });

  if (existingService) {
    await prisma.vendorService.update({
      where: { id: existingService.id },
      data: {
        categoryId: category.id,
        description: `${seed.name} ${seed.serviceName.toLowerCase()} package.`,
        startingPriceCents: seed.startingPriceCents,
        includes: seed.includes,
      },
    });
  } else {
    await prisma.vendorService.create({
      data: {
        vendorBusinessId: vendor.id,
        categoryId: category.id,
        name: seed.serviceName,
        description: `${seed.name} ${seed.serviceName.toLowerCase()} package.`,
        startingPriceCents: seed.startingPriceCents,
        includes: seed.includes,
      },
    });
  }

  const existingPortfolio = await prisma.portfolioItem.findFirst({
    where: { vendorBusinessId: vendor.id, title: `${seed.name} profile highlight` },
  });

  if (!existingPortfolio) {
    await prisma.portfolioItem.create({
      data: {
        vendorBusinessId: vendor.id,
        title: `${seed.name} profile highlight`,
        image,
      },
    });
  }

  const faqCount = await prisma.vendorFaq.count({ where: { vendorBusinessId: vendor.id } });
  if (faqCount === 0) {
    await prisma.vendorFaq.createMany({
      data: [
        {
          vendorBusinessId: vendor.id,
          question: "How current is this profile?",
          answer: "This profile is built from public web and Instagram-facing information, then enriched with planning-ready package details.",
          sortOrder: 1,
        },
        {
          vendorBusinessId: vendor.id,
          question: "Can I request exact pricing?",
          answer: "Yes. Send a quote request to start a conversation and confirm availability, scope, and current pricing.",
          sortOrder: 2,
        },
      ],
    });
  }
}

async function main() {
  for (const seed of gtaVendorSeeds) {
    await upsertVendor(seed);
  }

  console.log(`Seeded ${gtaVendorSeeds.length} GTA vendor profiles without resetting existing data.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
