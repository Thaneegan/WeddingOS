import { CategoryScope, CategoryType, LeadStage, OpportunityStatus, SenderRole } from "@prisma/client";
import { getCurrentUser, getCurrentVendorContext, getCurrentWeddingContext } from "@/lib/auth";
import { appPublicUrl, env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { ensureDefaultWeddingEvents } from "@/lib/weddingEvents";
import {
  budgetItems,
  categories,
  clientRecords,
  conversations,
  guests,
  leads,
  messages,
  timelineTasks,
  vendors,
  weddingDetails,
} from "@/lib/fallbackData";
import type {
  CoreCategory,
  CoreBudgetData,
  CoreConversation,
  CoreDashboardData,
  CoreAIPlan,
  CoreAdminData,
  CoreDocumentsData,
  CoreEventTimelineBlock,
  CoreFileAsset,
  CoreOpportunitiesData,
  CorePlannerData,
  CoreRSVPData,
  CoreResponsibility,
  CoreRunSheetData,
  CoreSeatingData,
  CoreScheduledCall,
  CoreLead,
  CoreLeadStage,
  CoreMessage,
  CoreNotificationsData,
  CoreTimelineData,
  CoreVendorAnalyticsData,
  CoreVendorCard,
  CoreVendorClientsData,
  CoreVendorDashboardData,
  CoreVendorProfile,
  CoreVendorQuote,
  CoreWeddingEvent,
} from "@/types/core";

const centsToDollars = (value: number) => Math.round(value) / 100;

const leadStageLabels: Record<LeadStage, CoreLeadStage> = {
  NEW_INQUIRY: "New Inquiry",
  CONTACTED: "Contacted",
  PROPOSAL_SENT: "Proposal Sent",
  NEGOTIATING: "Negotiating",
  BOOKED: "Booked",
  COMPLETED: "Completed",
  LOST: "Lost",
};

const senderLabels: Record<SenderRole, CoreMessage["sender"]> = {
  COUPLE: "couple",
  VENDOR: "vendor",
  SYSTEM: "system",
};

const rsvpLabels = {
  ATTENDING: "Attending",
  DECLINED: "Declined",
  PENDING: "Pending",
} as const;

function normalizeGuestGroupName(name: string) {
  return name.trim().toLowerCase();
}

async function mergeDuplicateGuestGroups(weddingId: string) {
  const groups = await prisma.guestGroup.findMany({
    where: { weddingId },
    include: { _count: { select: { guests: true } } },
  });
  const groupsByName = new Map<string, typeof groups>();

  for (const group of groups) {
    const normalizedName = normalizeGuestGroupName(group.name);
    groupsByName.set(normalizedName, [...(groupsByName.get(normalizedName) ?? []), group]);
  }

  for (const duplicates of groupsByName.values()) {
    if (duplicates.length < 2) continue;
    const [canonical, ...extras] = duplicates.sort((a, b) => {
      if (b._count.guests !== a._count.guests) return b._count.guests - a._count.guests;
      return a.id.localeCompare(b.id);
    });
    const extraIds = extras.map((group) => group.id);
    await prisma.$transaction([
      prisma.guest.updateMany({
        where: { guestGroupId: { in: extraIds } },
        data: { guestGroupId: canonical.id },
      }),
      prisma.guestGroup.deleteMany({ where: { id: { in: extraIds } } }),
    ]);
  }
}

const categoryTypeLabels: Record<CategoryType, CoreCategory["type"]> = {
  VENDOR_SERVICE: "vendor_service",
  BUDGET: "budget",
  TASK: "task",
  GUEST_GROUP: "guest_group",
  EVENT: "event",
  MISC: "misc",
};

const categoryScopeLabels: Record<CategoryScope, CoreCategory["scope"]> = {
  GLOBAL: "global",
  WEDDING: "wedding",
  VENDOR_BUSINESS: "vendor_business",
};

function isDatabaseUnavailableError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  return (
    message.includes("Can't reach database server") ||
    message.includes("Timed out fetching a new connection") ||
    message.includes("Environment variable not found: DATABASE_URL") ||
    message.includes("P1000") ||
    message.includes("P1001") ||
    message.includes("P1002") ||
    message.includes("P1003") ||
    message.includes("P1012")
  );
}

function dbUnavailable(error: unknown) {
  if (!isDatabaseUnavailableError(error)) {
    throw error;
  }

  if (env.BETA_MODE === "true" || process.env.NODE_ENV === "production") {
    throw error;
  }

  console.warn("Using local fallback data because the database is unavailable.", error);
}

function fallbackVendorToCard(vendor: (typeof vendors)[number]): CoreVendorCard {
  return {
    id: vendor.id,
    slug: vendor.id,
    name: vendor.name,
    category: vendor.category,
    location: vendor.location,
    rating: vendor.rating,
    reviewsCount: vendor.reviewsCount,
    startingPrice: vendor.startingPrice,
    image: vendor.image,
    styleTags: vendor.styleTags,
    availability: vendor.availability,
    matchScore: vendor.matchScore,
    responseTime: vendor.responseTime,
  };
}

function vendorQuoteToCore(quote: {
  id: string;
  inquiryId: string | null;
  vendorBusinessId: string;
  serviceId: string | null;
  amountCents: number;
  depositCents: number;
  dueDate: Date | null;
  validUntil: Date | null;
  status: string;
  notes: string | null;
  lineItems?: {
    id: string;
    label: string;
    amountCents: number;
    included: boolean;
    notes: string | null;
  }[];
}): CoreVendorQuote {
  return {
    id: quote.id,
    inquiryId: quote.inquiryId ?? undefined,
    vendorId: quote.vendorBusinessId,
    serviceId: quote.serviceId ?? undefined,
    amount: centsToDollars(quote.amountCents),
    deposit: centsToDollars(quote.depositCents),
    dueDate: quote.dueDate?.toISOString(),
    validUntil: quote.validUntil?.toISOString(),
    status: quote.status,
    notes: quote.notes ?? undefined,
    lineItems:
      quote.lineItems?.map((lineItem) => ({
        id: lineItem.id,
        label: lineItem.label,
        amount: centsToDollars(lineItem.amountCents),
        included: lineItem.included,
        notes: lineItem.notes ?? undefined,
      })) ?? [],
  };
}

function fallbackCategoryToCore(category: (typeof categories)[number]): CoreCategory {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    type: category.type,
    scope: category.scope,
    color: category.color,
    icon: category.icon,
  };
}

function categoryToCore(category: {
  id: string;
  name: string;
  slug: string;
  type: CategoryType;
  scope: CategoryScope;
  color: string | null;
  icon: string | null;
  archivedAt?: Date | null;
}): CoreCategory {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    type: categoryTypeLabels[category.type],
    scope: categoryScopeLabels[category.scope],
    color: category.color ?? undefined,
    icon: category.icon ?? undefined,
    archivedAt: category.archivedAt?.toISOString(),
  };
}

function weddingEventToCore(event: {
  id: string;
  name: string;
  type: string;
  date: Date;
  startTime: string | null;
  endTime: string | null;
  location: string | null;
  venueName: string | null;
  notes: string | null;
  sortOrder: number;
}): CoreWeddingEvent {
  return {
    id: event.id,
    name: event.name,
    type: event.type,
    date: event.date.toISOString(),
    startTime: event.startTime ?? undefined,
    endTime: event.endTime ?? undefined,
    location: event.location ?? undefined,
    venueName: event.venueName ?? undefined,
    notes: event.notes ?? undefined,
    sortOrder: event.sortOrder,
  };
}

async function getCoreWeddingEvents(weddingId: string) {
  return (await ensureDefaultWeddingEvents(weddingId)).map(weddingEventToCore);
}

function weddingToCore(wedding: {
  id: string;
  coupleNames: string;
  date: Date;
  location: string;
  style: string;
  budgetCents: number;
  guestCount: number;
}) {
  return {
    id: wedding.id,
    couple: wedding.coupleNames,
    date: wedding.date.toISOString(),
    location: wedding.location,
    style: wedding.style,
    budget: centsToDollars(wedding.budgetCents),
    guestCount: wedding.guestCount,
  };
}

function vendorBusinessToCard(vendor: Awaited<ReturnType<typeof prisma.vendorBusiness.findMany>>[number] & {
  services?: { category: { id: string; name: string } }[];
}): CoreVendorCard {
  const primaryService = vendor.services?.[0];

  return {
    id: vendor.id,
    slug: vendor.slug,
    name: vendor.name,
    category: primaryService?.category.name ?? "Vendor",
    categoryId: primaryService?.category.id,
    location: vendor.location,
    rating: vendor.rating,
    reviewsCount: vendor.reviewsCount,
    startingPrice: centsToDollars(vendor.startingPriceCents),
    image: vendor.image ?? "",
    styleTags: vendor.styleTags,
    availability: vendor.availability,
    matchScore: vendor.matchScore,
    responseTime: vendor.responseTime,
  };
}

function vendorAvailabilityPreview(vendor: {
  id?: string;
  slug?: string;
  availability: string;
  responseTime: string;
  availabilitySlots?: { date: Date; status: string; note: string | null }[];
}) {
  if (vendor.availabilitySlots?.length) {
    return vendor.availabilitySlots
      .slice()
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map((slot) => ({
        date: slot.date.toISOString(),
        label: slot.date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
        status: slot.status,
        note: slot.note ?? undefined,
      }));
  }

  const dates = [
    { date: "2026-06-20", label: "Sat, Jun 20", note: "Early summer" },
    { date: "2026-07-04", label: "Sat, Jul 4", note: "Prime Saturday" },
    { date: "2026-07-18", label: "Sat, Jul 18", note: "Arjun & Maya's date" },
    { date: "2026-08-01", label: "Sat, Aug 1", note: "Long weekend" },
    { date: "2026-08-15", label: "Sat, Aug 15", note: "High demand" },
    { date: "2026-09-05", label: "Sat, Sep 5", note: "Late summer" },
  ];
  const stableKey = vendor.slug ?? vendor.id ?? vendor.availability;
  const seed = stableKey.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const bookedIndex = seed % dates.length;
  const limitedIndex = (seed + 2) % dates.length;

  return dates.map((item, index) => {
    let status = "Available";

    if (vendor.availability === "Waitlist") {
      status = index % 2 === 0 ? "Waitlist" : "Booked";
    } else if (vendor.availability === "Limited") {
      status = index === bookedIndex ? "Booked" : index === limitedIndex || item.date === "2026-07-18" ? "Limited" : "Available";
    } else {
      status = index === bookedIndex ? "Booked" : index === limitedIndex ? "Limited" : "Available";
    }

    if (item.date === "2026-07-18") {
      status = vendor.availability;
    }

    return {
      ...item,
      status,
    };
  });
}

function fileAssetToCore(file: {
  id: string;
  ownerType: string;
  ownerId: string;
  purpose: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  provider: string;
  visibility: string;
  createdAt: Date;
  uploadedBy?: { name: string } | null;
}): CoreFileAsset {
  return {
    id: file.id,
    ownerType: file.ownerType,
    ownerId: file.ownerId,
    purpose: file.purpose,
    fileName: file.fileName,
    mimeType: file.mimeType,
    sizeBytes: file.sizeBytes,
    provider: file.provider,
    visibility: file.visibility,
    createdAt: file.createdAt.toISOString(),
    uploadedBy: file.uploadedBy?.name,
  };
}

function scheduledCallToCore(call: {
  id: string;
  conversationId: string | null;
  bookingId: string | null;
  vendorBusinessId: string | null;
  title: string;
  callUrl: string;
  startsAt: Date;
  durationMinutes: number;
  notes: string | null;
}): CoreScheduledCall {
  return {
    id: call.id,
    conversationId: call.conversationId ?? undefined,
    bookingId: call.bookingId ?? undefined,
    vendorBusinessId: call.vendorBusinessId ?? undefined,
    title: call.title,
    callUrl: call.callUrl,
    startsAt: call.startsAt.toISOString(),
    durationMinutes: call.durationMinutes,
    notes: call.notes ?? undefined,
  };
}

function responsibilityToCore(item: {
  id: string;
  eventId: string | null;
  event?: { name: string } | null;
  title: string;
  assignedName: string | null;
  assignedEmail: string | null;
  dueDate: Date;
  status: string;
  notes: string | null;
}): CoreResponsibility {
  return {
    id: item.id,
    eventId: item.eventId ?? undefined,
    eventName: item.event?.name,
    title: item.title,
    assignedName: item.assignedName ?? undefined,
    assignedEmail: item.assignedEmail ?? undefined,
    dueDate: item.dueDate.toISOString(),
    status: item.status,
    notes: item.notes ?? undefined,
  };
}

function eventTimelineBlockToCore(item: {
  id: string;
  eventId: string;
  event: { name: string };
  title: string;
  startsAt: Date;
  endsAt: Date | null;
  location: string | null;
  ownerName: string | null;
  notes: string | null;
  sortOrder: number;
}): CoreEventTimelineBlock {
  return {
    id: item.id,
    eventId: item.eventId,
    eventName: item.event.name,
    title: item.title,
    startsAt: item.startsAt.toISOString(),
    endsAt: item.endsAt?.toISOString(),
    location: item.location ?? undefined,
    ownerName: item.ownerName ?? undefined,
    notes: item.notes ?? undefined,
    sortOrder: item.sortOrder,
  };
}

function removeConsecutiveDuplicateMessages(messages: CoreMessage[]) {
  return messages.reduce<CoreMessage[]>((unique, message) => {
    const previous = unique.at(-1);
    if (
      previous &&
      previous.conversationId === message.conversationId &&
      previous.sender === message.sender &&
      previous.senderName === message.senderName &&
      previous.body.trim() === message.body.trim()
    ) {
      return unique;
    }

    unique.push(message);
    return unique;
  }, []);
}

export async function getMarketplaceData() {
  try {
    const { weddingId } = await getCurrentWeddingContext();
    const [vendorRows, categoryRows, wedding] = await Promise.all([
      prisma.vendorBusiness.findMany({
        where: {
          approvedAt: { not: null },
          hiddenAt: null,
        },
        orderBy: [{ matchScore: "desc" }, { name: "asc" }],
        include: {
          services: {
            take: 1,
            include: { category: true },
          },
          availabilitySlots: {
            orderBy: { date: "asc" },
            take: 8,
          },
          inquiries: {
            where: { weddingId },
            select: { id: true },
            take: 1,
          },
          vendorQuotes: {
            where: { inquiry: { weddingId } },
            include: { lineItems: { orderBy: { sortOrder: "asc" } } },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      }),
      prisma.category.findMany({
        where: {
          type: CategoryType.VENDOR_SERVICE,
          archivedAt: null,
          OR: [{ scope: CategoryScope.GLOBAL }, { scope: CategoryScope.VENDOR_BUSINESS }],
        },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      }),
      prisma.wedding.findUnique({
        where: { id: weddingId },
        include: {
          savedVendors: true,
          comparisonItems: true,
        },
      }),
    ]);

    return {
      vendors: vendorRows.map((vendor) => ({
        ...vendorBusinessToCard(vendor),
        existingInquiry: Boolean(vendor.inquiries?.length),
        quotes: vendor.vendorQuotes.map(vendorQuoteToCore),
      })),
      categories: categoryRows.map(categoryToCore),
      savedVendorIds: wedding?.savedVendors.map((item) => item.vendorBusinessId) ?? [],
      comparisonVendorIds: wedding?.comparisonItems.map((item) => item.vendorBusinessId) ?? [],
      wedding: wedding
        ? {
            id: wedding.id,
            couple: wedding.coupleNames,
            date: wedding.date.toISOString(),
            location: wedding.location,
            style: wedding.style,
            budget: centsToDollars(wedding.budgetCents),
            guestCount: wedding.guestCount,
          }
        : undefined,
      source: "database" as const,
    };
  } catch (error) {
    dbUnavailable(error);

    return {
      vendors: vendors.map(fallbackVendorToCard),
      categories: categories.filter((item) => item.type === "vendor_service").map(fallbackCategoryToCore),
      savedVendorIds: ["golden-lens-photography", "ivory-bloom-florals", "velvet-hour-films"],
      comparisonVendorIds: ["golden-lens-photography", "ivory-bloom-florals", "velvet-hour-films"],
      wedding: undefined,
      source: "fallback" as const,
    };
  }
}

export async function getVendorProfileData(slug: string): Promise<CoreVendorProfile | null> {
  try {
    const { weddingId, wedding } = await getCurrentWeddingContext();
    const vendor = await prisma.vendorBusiness.findUnique({
      where: { slug },
      include: {
        services: {
          include: { category: true },
          orderBy: { startingPriceCents: "asc" },
        },
        reviews: { orderBy: { createdAt: "desc" } },
        pastWeddings: true,
        portfolioItems: { orderBy: { sortOrder: "asc" } },
        faqs: { orderBy: { sortOrder: "asc" } },
        availabilitySlots: {
          orderBy: { date: "asc" },
          take: 12,
        },
        vendorQuotes: {
          where: { inquiry: { weddingId } },
          include: { lineItems: { orderBy: { sortOrder: "asc" } } },
          orderBy: { createdAt: "desc" },
          take: 3,
        },
        inquiries: {
          where: { weddingId },
          take: 1,
        },
      },
    });

    if (!vendor) return null;
    if (!vendor.approvedAt || vendor.hiddenAt) return null;

    const [savedVendor, comparisonItem] = await Promise.all([
      prisma.savedVendor.findUnique({
        where: {
          weddingId_vendorBusinessId: {
            weddingId,
            vendorBusinessId: vendor.id,
          },
        },
      }),
      prisma.vendorComparisonItem.findUnique({
        where: {
          weddingId_vendorBusinessId: {
            weddingId,
            vendorBusinessId: vendor.id,
          },
        },
      }),
    ]);

    return {
      ...vendorBusinessToCard(vendor),
      wedding: {
        id: wedding.id,
        couple: wedding.coupleNames,
        date: wedding.date.toISOString(),
        location: wedding.location,
        style: wedding.style,
        budget: centsToDollars(wedding.budgetCents),
        guestCount: wedding.guestCount,
      },
      saved: Boolean(savedVendor),
      compared: Boolean(comparisonItem),
      gallery: vendor.portfolioItems.length
        ? vendor.portfolioItems.map((item) => item.image)
        : vendor.gallery.length
          ? vendor.gallery
          : [vendor.image ?? ""],
      socials: vendor.socials,
      about: vendor.about,
      availabilityPreview: vendorAvailabilityPreview(vendor),
      quotes: vendor.vendorQuotes.map(vendorQuoteToCore),
      services: vendor.services.map((service) => ({
        id: service.id,
        name: service.name,
        price: centsToDollars(service.startingPriceCents),
        description: service.description,
        includes: Array.isArray(service.includes) ? service.includes.map(String) : [],
        category: service.category.name,
      })),
      reviews: vendor.reviews.map((review) => ({
        id: review.id,
        author: review.author,
        rating: review.rating,
        date: review.createdAt.toISOString(),
        body: review.body,
      })),
      pastWeddings: vendor.pastWeddings.map((wedding) => ({
        id: wedding.id,
        couple: wedding.coupleNames,
        venue: wedding.venue,
        style: wedding.style,
        image: wedding.image,
      })),
      faqs: vendor.faqs.length
        ? vendor.faqs.map((faq) => ({ question: faq.question, answer: faq.answer }))
        : [
            { question: "How do quote requests work?", answer: "Couples request a quote and the vendor receives a lead in the CRM pipeline." },
            { question: "Can services use custom categories?", answer: "Yes. Vendor-specific service categories can be added without changing platform defaults." },
          ],
      existingInquiry: vendor.inquiries.length > 0,
    };
  } catch (error) {
    dbUnavailable(error);
    const vendor = vendors.find((item) => item.id === slug);
    if (!vendor) return null;

    return {
      ...fallbackVendorToCard(vendor),
      wedding: {
        id: "local-wedding",
        couple: weddingDetails.couple,
        date: weddingDetails.date,
        location: weddingDetails.location,
        style: weddingDetails.style,
        budget: weddingDetails.budget,
        guestCount: weddingDetails.guestCount,
      },
      saved: false,
      compared: false,
      gallery: vendor.gallery,
      socials: vendor.socials,
      about: vendor.about,
      availabilityPreview: vendorAvailabilityPreview(vendor),
      services: vendor.packages.map((item) => ({
        id: item.name,
        name: item.name,
        price: item.price,
        description: item.description,
        includes: item.includes,
        category: vendor.category,
      })),
      reviews: vendor.reviews.map((review) => ({ ...review, date: review.date })),
      pastWeddings: vendor.pastWeddings.map((wedding) => ({
        id: wedding.id,
        couple: wedding.couple,
        venue: wedding.venue,
        style: wedding.style,
        image: wedding.image,
      })),
      faqs: vendor.faqs,
      existingInquiry: leads.some((lead) => lead.vendorId === vendor.id && lead.coupleNames === weddingDetails.couple),
    };
  }
}

export async function getMessagesData(mode: "couple" | "vendor" = "couple") {
  try {
    const user = await getCurrentUser();
    const where =
      mode === "vendor"
        ? { vendorBusinessId: (await getCurrentVendorContext()).vendorBusinessId }
        : { weddingId: (await getCurrentWeddingContext()).weddingId };
    const rows = await prisma.conversation.findMany({
      where,
      include: {
        messages: { orderBy: { createdAt: "asc" } },
        readStates: true,
        scheduledCalls: { orderBy: { startsAt: "asc" } },
        inquiry: {
          include: {
            vendorBusiness: true,
            wedding: true,
            service: true,
            lead: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const conversationRows: CoreConversation[] = rows.map((conversation) => {
      const readState = conversation.readStates.find((state) => state.userId === user.id);
      const lastReadAt = readState?.lastReadAt;
      const unreadForCouple = conversation.messages.filter(
        (message) => message.senderRole !== SenderRole.COUPLE && (!lastReadAt || message.createdAt > lastReadAt),
      ).length;
      const unreadForVendor = conversation.messages.filter(
        (message) => message.senderRole !== SenderRole.VENDOR && (!lastReadAt || message.createdAt > lastReadAt),
      ).length;
      const lastMessage = conversation.messages.at(-1);

      return {
        id: conversation.id,
        weddingId: conversation.weddingId,
        vendorId: conversation.vendorBusinessId,
        vendorName: conversation.inquiry?.vendorBusiness.name ?? "Vendor",
        coupleName: conversation.inquiry?.wedding.coupleNames ?? "Couple",
        unreadForCouple,
        unreadForVendor,
        lastMessage: lastMessage?.body,
        lastMessageFrom: lastMessage ? senderLabels[lastMessage.senderRole] : undefined,
        lastMessageAt: lastMessage?.createdAt.toISOString() ?? conversation.updatedAt.toISOString(),
        stage: conversation.inquiry?.lead ? leadStageLabels[conversation.inquiry.lead.stage] : undefined,
        serviceName: conversation.inquiry?.service?.name,
        weddingDate: conversation.inquiry?.wedding.date.toISOString(),
      };
    });
    const messageRows: CoreMessage[] = rows.flatMap((conversation) =>
      removeConsecutiveDuplicateMessages(
        conversation.messages.map((message) => ({
          id: message.id,
          conversationId: conversation.id,
          sender: senderLabels[message.senderRole],
          senderName: message.senderName,
          body: message.body,
          timestamp: message.createdAt.toISOString(),
        })),
      ),
    );

    return {
      conversations: conversationRows,
      messages: messageRows,
      scheduledCalls: rows.flatMap((conversation) => conversation.scheduledCalls.map(scheduledCallToCore)),
      source: "database" as const,
    };
  } catch (error) {
    dbUnavailable(error);
    return {
      conversations: conversations.map((conversation) => ({
        ...conversation,
        weddingId: "demo-wedding",
      })),
      messages,
      scheduledCalls: [],
      source: "fallback" as const,
    };
  }
}

export async function getVendorLeadsData() {
  try {
    const { vendorBusinessId } = await getCurrentVendorContext();
    const leadRows = await prisma.lead.findMany({
      where: {
        inquiry: { vendorBusinessId },
      },
      include: {
        inquiry: {
          include: {
            wedding: true,
            vendorBusiness: true,
            service: { include: { category: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const mapped: CoreLead[] = leadRows.map((lead) => ({
      id: lead.id,
      inquiryId: lead.inquiryId,
      serviceId: lead.inquiry.serviceId ?? undefined,
      vendorId: lead.inquiry.vendorBusinessId,
      vendorName: lead.inquiry.vendorBusiness.name,
      coupleNames: lead.inquiry.wedding.coupleNames,
      weddingDate: lead.inquiry.wedding.date.toISOString(),
      budget: centsToDollars(lead.inquiry.wedding.budgetCents),
      location: lead.inquiry.wedding.location,
      guestCount: lead.inquiry.wedding.guestCount,
      serviceRequested: lead.inquiry.service?.category.name ?? lead.inquiry.vendorBusiness.name,
      lastMessage: lead.lastMessage,
      stage: leadStageLabels[lead.stage],
      estimatedValue: centsToDollars(lead.estimatedValueCents),
      createdAt: lead.createdAt.toISOString(),
    }));

    return { leads: mapped, source: "database" as const };
  } catch (error) {
    dbUnavailable(error);
    return {
      leads: leads.map((lead) => ({
        ...lead,
        vendorName: vendors.find((vendor) => vendor.id === lead.vendorId)?.name ?? lead.serviceRequested,
      })) as CoreLead[],
      source: "fallback" as const,
    };
  }
}

export async function getDashboardData(): Promise<CoreDashboardData> {
  try {
    const { weddingId } = await getCurrentWeddingContext();
    const wedding = await prisma.wedding.findUniqueOrThrow({
      where: { id: weddingId },
      include: {
        budgetItems: true,
        bookings: {
          include: {
            vendorBusiness: {
              include: {
                services: {
                  take: 1,
                  include: { category: true },
                },
              },
            },
          },
        },
        inquiries: { include: { lead: true } },
        tasks: { orderBy: { dueDate: "asc" } },
      },
    });

    const [conversationData, events] = await Promise.all([getMessagesData(), getCoreWeddingEvents(weddingId)]);
    const spent = centsToDollars(
      wedding.budgetItems
        .filter((item) => item.status !== "PLANNED")
        .reduce((sum, item) => sum + item.amountCents, 0),
    );
    const bookedVendors = wedding.bookings.map((booking) => vendorBusinessToCard(booking.vendorBusiness));

    return {
      wedding: {
        id: wedding.id,
        couple: wedding.coupleNames,
        date: wedding.date.toISOString(),
        location: wedding.location,
        style: wedding.style,
        budget: centsToDollars(wedding.budgetCents),
        guestCount: wedding.guestCount,
      },
      spent,
      committedBudgetItems: wedding.budgetItems.filter((item) => item.status !== "PLANNED").length,
      bookedVendors,
      bookedVendorCount: bookedVendors.length,
      tasksRemaining: wedding.tasks.filter((task) => !task.completed).length,
      pendingResponses: wedding.inquiries.filter((inquiry) => inquiry.lead?.stage !== LeadStage.BOOKED).length,
      nextEvent: events.find((event) => new Date(event.date) >= new Date()) ?? events.at(-1),
      recentMessages: conversationData.messages.slice(-4).reverse().map((message) => ({
        ...message,
        vendorName: conversationData.conversations.find((item) => item.id === message.conversationId)?.vendorName,
      })),
      upcomingTasks: wedding.tasks
        .filter((task) => !task.completed)
        .slice(0, 5)
        .map((task) => ({
          id: task.id,
          title: task.title,
          dueDate: task.dueDate.toISOString(),
          priority: task.priority,
        })),
    };
  } catch (error) {
    dbUnavailable(error);
    const spent = budgetItems.filter((item) => item.status !== "Planned").reduce((sum, item) => sum + item.amount, 0);
    const bookedVendorIds = ["maison-etoile-venue", "saffron-sage-catering", "luxe-mandap-decor"];
    const bookedVendors = vendors.filter((vendor) => bookedVendorIds.includes(vendor.id)).map(fallbackVendorToCard);

    return {
      wedding: {
        id: "local-wedding",
        couple: weddingDetails.couple,
        date: weddingDetails.date,
        location: weddingDetails.location,
        style: weddingDetails.style,
        budget: weddingDetails.budget,
        guestCount: weddingDetails.guestCount,
      },
      spent,
      committedBudgetItems: budgetItems.filter((item) => item.status !== "Planned").length,
      bookedVendors,
      bookedVendorCount: bookedVendors.length,
      tasksRemaining: timelineTasks.filter((task) => !task.completed).length,
      pendingResponses: leads.filter((lead) => lead.coupleNames === weddingDetails.couple && lead.stage !== "Booked").length,
      nextEvent: undefined,
      recentMessages: messages.slice(-4).reverse(),
      upcomingTasks: timelineTasks
        .filter((task) => !task.completed)
        .slice(0, 5)
        .map((task) => ({
          id: task.id,
          title: task.title,
          dueDate: task.dueDate,
          priority: task.priority,
        })),
    };
  }
}

export async function getBudgetData(): Promise<CoreBudgetData> {
  try {
    const { weddingId } = await getCurrentWeddingContext();
    const [wedding, categoryRows, events] = await Promise.all([
      prisma.wedding.findUniqueOrThrow({
        where: { id: weddingId },
        include: {
          budgetItems: {
            include: {
              category: true,
              event: true,
            },
            orderBy: [{ dueDate: "asc" }, { label: "asc" }],
          },
          bookings: {
            include: {
              vendorBusiness: { select: { id: true, name: true } },
              service: { select: { name: true } },
            },
          },
        },
      }),
      prisma.category.findMany({
        where: {
          type: CategoryType.BUDGET,
          archivedAt: null,
          OR: [{ scope: CategoryScope.GLOBAL }, { scope: CategoryScope.WEDDING, ownerWeddingId: weddingId }],
        },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      }),
      getCoreWeddingEvents(weddingId),
    ]);

    const budgetItemIds = wedding.budgetItems.map((item) => item.id);
    const bookingIds = wedding.bookings.map((booking) => booking.id);
    const paymentScheduleWhere = [
      ...(budgetItemIds.length ? [{ budgetItemId: { in: budgetItemIds } }] : []),
      ...(bookingIds.length ? [{ bookingId: { in: bookingIds } }] : []),
    ];
    const [paymentScheduleRows, invoiceRows, fileRows] = await Promise.all([
      paymentScheduleWhere.length
        ? prisma.paymentScheduleItem.findMany({
            where: {
              OR: paymentScheduleWhere,
            },
            orderBy: [{ dueDate: "asc" }, { label: "asc" }],
          })
        : [],
      budgetItemIds.length
        ? prisma.invoiceRecord.findMany({
            where: { budgetItemId: { in: budgetItemIds } },
            orderBy: [{ dueDate: "asc" }, { label: "asc" }],
          })
        : [],
      prisma.fileAsset.findMany({
        where: { ownerType: "WEDDING", ownerId: weddingId },
        include: { uploadedBy: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const vendorIds = wedding.budgetItems
      .map((item) => item.vendorBusinessId)
      .filter((id): id is string => Boolean(id));
    const vendorsById = vendorIds.length
      ? new Map(
          (
            await prisma.vendorBusiness.findMany({
              where: { id: { in: vendorIds } },
              select: { id: true, name: true },
            })
          ).map((vendor) => [vendor.id, vendor.name]),
        )
      : new Map<string, string>();
    const budgetItemById = new Map(wedding.budgetItems.map((item) => [item.id, item]));
    const bookingById = new Map(wedding.bookings.map((booking) => [booking.id, booking]));

    return {
      wedding: {
        id: wedding.id,
        couple: wedding.coupleNames,
        date: wedding.date.toISOString(),
        location: wedding.location,
        style: wedding.style,
        budget: centsToDollars(wedding.budgetCents),
        guestCount: wedding.guestCount,
      },
      items: wedding.budgetItems.map((item) => ({
        id: item.id,
        eventId: item.eventId ?? undefined,
        eventName: item.event?.name,
        categoryId: item.categoryId,
        category: item.category.name,
        label: item.label,
        vendorId: item.vendorBusinessId ?? undefined,
        vendorName: item.vendorBusinessId ? vendorsById.get(item.vendorBusinessId) : undefined,
        amount: centsToDollars(item.amountCents),
        paid: centsToDollars(item.paidCents),
        dueDate: item.dueDate.toISOString(),
        status: item.status
          .toLowerCase()
          .split("_")
          .map((part) => part[0].toUpperCase() + part.slice(1))
          .join(" "),
      })),
      events,
      categories: categoryRows.map(categoryToCore),
      paymentSchedule: paymentScheduleRows.map((item) => ({
        id: item.id,
        bookingId: item.bookingId ?? undefined,
        budgetItemId: item.budgetItemId ?? undefined,
        label: item.label,
        sourceLabel: item.budgetItemId
          ? budgetItemById.get(item.budgetItemId)?.label
          : item.bookingId
            ? bookingById.get(item.bookingId)?.service?.name ?? bookingById.get(item.bookingId)?.vendorBusiness.name
            : undefined,
        vendorName: item.budgetItemId
          ? budgetItemById.get(item.budgetItemId)?.vendorBusinessId
            ? vendorsById.get(budgetItemById.get(item.budgetItemId)!.vendorBusinessId!)
            : undefined
          : item.bookingId
            ? bookingById.get(item.bookingId)?.vendorBusiness.name
            : undefined,
        totalAmount: item.budgetItemId
          ? centsToDollars(budgetItemById.get(item.budgetItemId)?.amountCents ?? 0)
          : item.bookingId
            ? centsToDollars(bookingById.get(item.bookingId)?.amountCents ?? 0)
            : undefined,
        paidAmount: item.budgetItemId
          ? centsToDollars(budgetItemById.get(item.budgetItemId)?.paidCents ?? 0)
          : undefined,
        amount: centsToDollars(item.amountCents),
        dueDate: item.dueDate.toISOString(),
        status: moneyStatusLabel(item.status),
        reminderDaysBefore: item.reminderDaysBefore ?? undefined,
        reminderDismissedAt: item.reminderDismissedAt?.toISOString(),
      })),
      invoices: invoiceRows.map((invoice) => ({
        id: invoice.id,
        bookingId: invoice.bookingId ?? undefined,
        budgetItemId: invoice.budgetItemId ?? undefined,
        label: invoice.label,
        amount: centsToDollars(invoice.amountCents),
        status: moneyStatusLabel(invoice.status),
        dueDate: invoice.dueDate?.toISOString(),
      })),
      files: fileRows.map(fileAssetToCore),
    };
  } catch (error) {
    dbUnavailable(error);
    return {
      wedding: {
        id: "local-wedding",
        couple: weddingDetails.couple,
        date: weddingDetails.date,
        location: weddingDetails.location,
        style: weddingDetails.style,
        budget: weddingDetails.budget,
        guestCount: weddingDetails.guestCount,
      },
      events: [],
      items: budgetItems.map((item) => ({
        id: item.id,
        categoryId: item.category,
        category: item.category,
        label: item.label,
        vendorId: item.vendorId,
        amount: item.amount,
        paid: item.paid,
        dueDate: item.dueDate,
        status: item.status,
      })),
      categories: categories.filter((item) => item.type === "budget").map(fallbackCategoryToCore),
      paymentSchedule: [],
      invoices: [],
      files: [],
    };
  }
}

export async function getTimelineData(): Promise<CoreTimelineData> {
  try {
    const { weddingId } = await getCurrentWeddingContext();
    const [taskRows, categoryRows, events, responsibilityRows, timelineBlockRows] = await Promise.all([
      prisma.timelineTask.findMany({
        where: { weddingId },
        include: { category: true, event: true },
        orderBy: [{ dueDate: "asc" }, { title: "asc" }],
      }),
      prisma.category.findMany({
        where: {
          type: CategoryType.TASK,
          archivedAt: null,
          OR: [{ scope: CategoryScope.GLOBAL }, { scope: CategoryScope.WEDDING, ownerWeddingId: weddingId }],
        },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      }),
      getCoreWeddingEvents(weddingId),
      prisma.responsibility.findMany({
        where: { weddingId },
        include: { event: true },
        orderBy: [{ dueDate: "asc" }, { title: "asc" }],
      }),
      prisma.eventTimelineBlock.findMany({
        where: { weddingId },
        include: { event: true },
        orderBy: [{ startsAt: "asc" }, { sortOrder: "asc" }],
      }),
    ]);
    const eventIds = events.map((event) => event.id);
    const [
      guestCount,
      eventInviteCount,
      budgetItemCount,
      bookingCount,
      inquiryCount,
      savedVendorCount,
      comparisonItemCount,
      vendorNeedCount,
      vendorQuoteCount,
      documentCount,
      seatingTableCount,
      seatingAssignmentCount,
    ] = await Promise.all([
      prisma.guest.count({ where: { weddingId } }),
      eventIds.length ? prisma.guestEventInvite.count({ where: { eventId: { in: eventIds }, invited: true } }) : Promise.resolve(0),
      prisma.budgetItem.count({ where: { weddingId } }),
      prisma.booking.count({ where: { weddingId } }),
      prisma.inquiry.count({ where: { weddingId } }),
      prisma.savedVendor.count({ where: { weddingId } }),
      prisma.vendorComparisonItem.count({ where: { weddingId } }),
      prisma.eventVendorNeed.count({ where: { weddingId } }),
      prisma.vendorQuote.count({ where: { inquiry: { weddingId } } }),
      prisma.fileAsset.count({ where: { ownerId: { in: [weddingId, ...eventIds] } } }),
      prisma.seatingTable.count({ where: { weddingId } }),
      eventIds.length
        ? prisma.seatingAssignment.count({
            where: { table: { weddingId } },
          })
        : Promise.resolve(0),
    ]);
    const vendorIds = taskRows
      .map((task) => task.relatedVendorId)
      .filter((id): id is string => Boolean(id));
    const vendorsById = vendorIds.length
      ? new Map(
          (
            await prisma.vendorBusiness.findMany({
              where: { id: { in: vendorIds } },
              select: { id: true, name: true },
            })
          ).map((vendor) => [vendor.id, vendor.name]),
        )
      : new Map<string, string>();

    return {
      events,
      tasks: taskRows.map((task) => ({
        id: task.id,
        title: task.title,
        group: task.group,
        dueDate: task.dueDate.toISOString(),
        completed: task.completed,
        eventId: task.eventId ?? undefined,
        eventName: task.event?.name,
        categoryId: task.categoryId ?? undefined,
        category: task.category?.name,
        relatedVendorId: task.relatedVendorId ?? undefined,
        relatedVendorName: task.relatedVendorId ? vendorsById.get(task.relatedVendorId) : undefined,
        priority: task.priority,
      })),
      categories: categoryRows.map(categoryToCore),
      responsibilities: responsibilityRows.map(responsibilityToCore),
      timelineBlocks: timelineBlockRows.map(eventTimelineBlockToCore),
      featureSummary: {
        guests: guestCount,
        eventInvites: eventInviteCount,
        budgetItems: budgetItemCount,
        bookedVendors: bookingCount,
        inquiries: inquiryCount,
        savedVendors: savedVendorCount,
        comparisonItems: comparisonItemCount,
        vendorNeeds: vendorNeedCount,
        vendorQuotes: vendorQuoteCount,
        documents: documentCount,
        seatingTables: seatingTableCount,
        seatingAssignments: seatingAssignmentCount,
        runSheetBlocks: timelineBlockRows.length,
        responsibilities: responsibilityRows.length,
        events: events.length,
      },
    };
  } catch (error) {
    dbUnavailable(error);
    return {
      events: [],
      tasks: timelineTasks.map((task) => ({
        id: task.id,
        title: task.title,
        group: task.group,
        dueDate: task.dueDate,
        completed: task.completed,
        relatedVendorId: task.relatedVendorId,
        relatedVendorName: vendors.find((vendor) => vendor.id === task.relatedVendorId)?.name,
        priority: task.priority,
      })),
      categories: categories.filter((item) => item.type === "task").map(fallbackCategoryToCore),
      responsibilities: [],
      timelineBlocks: [],
      featureSummary: {
        guests: guests.length,
        eventInvites: 0,
        budgetItems: budgetItems.length,
        bookedVendors: 0,
        inquiries: 0,
        savedVendors: 0,
        comparisonItems: 0,
        vendorNeeds: 0,
        vendorQuotes: 0,
        documents: 0,
        seatingTables: 0,
        seatingAssignments: 0,
        runSheetBlocks: 0,
        responsibilities: 0,
        events: 0,
      },
    };
  }
}

export async function getCompareData() {
  try {
    const { weddingId } = await getCurrentWeddingContext();
    const comparisonRows = await prisma.vendorComparisonItem.findMany({
      where: { weddingId },
      include: {
        vendorBusiness: {
          include: {
            services: {
              take: 1,
              include: { category: true },
            },
            inquiries: {
              where: { weddingId },
              select: { id: true },
              take: 1,
            },
            vendorQuotes: {
              where: { inquiry: { weddingId } },
              include: { lineItems: { orderBy: { sortOrder: "asc" } } },
              orderBy: { createdAt: "desc" },
              take: 1,
            },
            quoteComparisonNotes: {
              where: { weddingId, categoryId: null },
              take: 1,
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return {
      vendors: comparisonRows.map((item) => ({
        ...vendorBusinessToCard(item.vendorBusiness),
        existingInquiry: Boolean(item.vendorBusiness.inquiries?.length),
        quotes: item.vendorBusiness.vendorQuotes.map(vendorQuoteToCore),
        comparisonNote: item.vendorBusiness.quoteComparisonNotes[0]?.notes,
      })),
      source: "database" as const,
    };
  } catch (error) {
    dbUnavailable(error);
    const comparisonVendorIds = ["golden-lens-photography", "ivory-bloom-florals", "velvet-hour-films"];

    return {
      vendors: vendors.filter((vendor) => comparisonVendorIds.includes(vendor.id)).map(fallbackVendorToCard),
      source: "fallback" as const,
    };
  }
}

export async function getRSVPData(): Promise<CoreRSVPData> {
  try {
    const { weddingId } = await getCurrentWeddingContext();
    await mergeDuplicateGuestGroups(weddingId);
    const [guestRows, groupRows, tokenRows, events] = await Promise.all([
      prisma.guest.findMany({
        where: { weddingId },
        include: {
          guestGroup: true,
          companions: { orderBy: { sortOrder: "asc" } },
          eventRsvps: { include: { event: true } },
          eventInvites: { include: { event: true } },
        },
        orderBy: [{ name: "asc" }],
      }),
      prisma.guestGroup.findMany({
        where: { weddingId },
        include: { _count: { select: { guests: true } } },
        orderBy: { name: "asc" },
      }),
      prisma.publicRSVPToken.findMany({
        where: { weddingId },
        include: { guest: true },
        orderBy: { createdAt: "desc" },
      }),
      getCoreWeddingEvents(weddingId),
    ]);

    return {
      events,
      guests: guestRows.map((guest) => ({
        id: guest.id,
        name: guest.name,
        email: guest.email ?? undefined,
        phone: guest.phone ?? undefined,
        group: guest.guestGroup?.name ?? "Ungrouped",
        status: rsvpLabels[guest.status],
        plusOne: guest.plusOne,
        additionalGuestCount: guest.additionalGuestCount,
        companionDetails: guest.companionDetails ?? undefined,
        mealChoice: guest.mealChoice,
        tableNumber: guest.tableNumber ?? undefined,
        notes: guest.notes ?? undefined,
        companions: guest.companions.map((companion) => ({
          id: companion.id,
          name: companion.name,
          relation: companion.relation ?? undefined,
          mealChoice: companion.mealChoice ?? undefined,
          notes: companion.notes ?? undefined,
        })),
        eventRsvps: events.map((event) => {
          const rsvp = guest.eventRsvps.find((item) => item.eventId === event.id);
          const invite = guest.eventInvites.find((item) => item.eventId === event.id);

          return {
            eventId: event.id,
            eventName: event.name,
            invited: invite?.invited ?? true,
            status: rsvp ? rsvpLabels[rsvp.status] : rsvpLabels[guest.status],
            attendeeCount: rsvp?.attendeeCount ?? guest.additionalGuestCount + 1,
            mealChoice: rsvp?.mealChoice ?? guest.mealChoice,
            notes: rsvp?.notes ?? undefined,
          };
        }),
      })),
      groups: groupRows.map((group) => ({
        id: group.id,
        name: group.name,
        guestCount: group._count.guests,
      })),
      publicTokens: tokenRows.map((token) => ({
        id: token.id,
        guestId: token.guestId ?? undefined,
        guestName: token.guest?.name,
        token: token.token,
        url: `${appPublicUrl}/rsvp/public/${token.token}`,
        expiresAt: token.expiresAt?.toISOString(),
        usedAt: token.usedAt?.toISOString(),
        createdAt: token.createdAt.toISOString(),
      })),
    };
  } catch (error) {
    dbUnavailable(error);
    return {
      events: [],
      guests: guests.map((guest) => ({
        ...guest,
        additionalGuestCount: guest.additionalGuestCount ?? (guest.plusOne ? 1 : 0),
        companionDetails: guest.companionDetails,
      })),
      groups: Array.from(new Set(guests.map((guest) => guest.group))).map((name) => ({
        id: name,
        name,
        guestCount: guests.filter((guest) => guest.group === name).length,
      })),
      publicTokens: [],
    };
  }
}

export async function getRunSheetData(): Promise<CoreRunSheetData> {
  try {
    const { weddingId } = await getCurrentWeddingContext();
    const events = await getCoreWeddingEvents(weddingId);
    const [wedding, blockRows, responsibilityRows, bookingRows, paymentRows, fileRows] = await Promise.all([
      prisma.wedding.findUniqueOrThrow({ where: { id: weddingId } }),
      prisma.eventTimelineBlock.findMany({
        where: { weddingId },
        include: { event: true },
        orderBy: [{ startsAt: "asc" }, { sortOrder: "asc" }],
      }),
      prisma.responsibility.findMany({
        where: { weddingId },
        include: { event: true },
        orderBy: [{ dueDate: "asc" }, { title: "asc" }],
      }),
      prisma.booking.findMany({
        where: { weddingId },
        include: {
          vendorBusiness: {
            include: {
              services: { take: 1, include: { category: true } },
            },
          },
        },
        orderBy: { bookedAt: "desc" },
      }),
      prisma.paymentScheduleItem.findMany({
        where: {
          OR: [
            { booking: { weddingId } },
            { budgetItem: { weddingId } },
          ],
        },
        orderBy: { dueDate: "asc" },
      }),
      prisma.fileAsset.findMany({
        where: {
          OR: [
            { ownerType: "WEDDING", ownerId: weddingId },
            { ownerType: "EVENT", ownerId: { in: events.map((event) => event.id) } },
          ],
        },
        include: { uploadedBy: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return {
      wedding: weddingToCore(wedding),
      events,
      timelineBlocks: blockRows.map(eventTimelineBlockToCore),
      responsibilities: responsibilityRows.map(responsibilityToCore),
      bookedVendors: bookingRows.map((booking) => vendorBusinessToCard(booking.vendorBusiness)),
      paymentSchedule: paymentRows.map((item) => ({
        id: item.id,
        bookingId: item.bookingId ?? undefined,
        budgetItemId: item.budgetItemId ?? undefined,
        label: item.label,
        amount: centsToDollars(item.amountCents),
        dueDate: item.dueDate.toISOString(),
        status: moneyStatusLabel(item.status),
        reminderDaysBefore: item.reminderDaysBefore ?? undefined,
        reminderDismissedAt: item.reminderDismissedAt?.toISOString(),
      })),
      files: fileRows.map(fileAssetToCore),
    };
  } catch (error) {
    dbUnavailable(error);
    return {
      wedding: {
        id: "local-wedding",
        couple: weddingDetails.couple,
        date: weddingDetails.date,
        location: weddingDetails.location,
        style: weddingDetails.style,
        budget: weddingDetails.budget,
        guestCount: weddingDetails.guestCount,
      },
      events: [],
      timelineBlocks: [],
      responsibilities: [],
      bookedVendors: [],
      paymentSchedule: [],
      files: [],
    };
  }
}

export async function getDocumentsData(): Promise<CoreDocumentsData> {
  try {
    const { weddingId } = await getCurrentWeddingContext();
    const events = await getCoreWeddingEvents(weddingId);
    const eventIds = events.map((event) => event.id);
    const [wedding, bookingRows] = await Promise.all([
      prisma.wedding.findUniqueOrThrow({ where: { id: weddingId } }),
      prisma.booking.findMany({
        where: { weddingId },
        include: { vendorBusiness: { select: { id: true, name: true } } },
      }),
    ]);
    const bookingIds = bookingRows.map((booking) => booking.id);
    const fileRows = await prisma.fileAsset.findMany({
      where: {
        OR: [
          { ownerType: "WEDDING", ownerId: weddingId },
          { ownerType: "EVENT", ownerId: { in: eventIds } },
          { ownerType: "BOOKING", ownerId: { in: bookingIds } },
        ],
      },
      include: { uploadedBy: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });

    return {
      wedding: weddingToCore(wedding),
      events,
      vendors: bookingRows.map((booking) => booking.vendorBusiness),
      files: fileRows.map(fileAssetToCore),
    };
  } catch (error) {
    dbUnavailable(error);
    return {
      wedding: {
        id: "local-wedding",
        couple: weddingDetails.couple,
        date: weddingDetails.date,
        location: weddingDetails.location,
        style: weddingDetails.style,
        budget: weddingDetails.budget,
        guestCount: weddingDetails.guestCount,
      },
      events: [],
      vendors: [],
      files: [],
    };
  }
}

export async function getSeatingData(): Promise<CoreSeatingData> {
  try {
    const { weddingId } = await getCurrentWeddingContext();
    const [wedding, events, guestRows, tableRows] = await Promise.all([
      prisma.wedding.findUniqueOrThrow({ where: { id: weddingId } }),
      getCoreWeddingEvents(weddingId),
      prisma.guest.findMany({
        where: { weddingId },
        include: {
          guestGroup: true,
          companions: { orderBy: { sortOrder: "asc" } },
          eventRsvps: { include: { event: true } },
          eventInvites: { include: { event: true } },
        },
        orderBy: { name: "asc" },
      }),
      prisma.seatingTable.findMany({
        where: { weddingId },
        include: {
          event: true,
          assignments: {
            include: { guest: true, companion: true },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      }),
    ]);

    return {
      wedding: weddingToCore(wedding),
      events,
      guests: guestRows.map((guest) => ({
        id: guest.id,
        name: guest.name,
        email: guest.email ?? undefined,
        phone: guest.phone ?? undefined,
        group: guest.guestGroup?.name ?? "Ungrouped",
        status: rsvpLabels[guest.status],
        plusOne: guest.plusOne,
        additionalGuestCount: guest.additionalGuestCount,
        companionDetails: guest.companionDetails ?? undefined,
        mealChoice: guest.mealChoice,
        tableNumber: guest.tableNumber ?? undefined,
        notes: guest.notes ?? undefined,
        companions: guest.companions.map((companion) => ({
          id: companion.id,
          name: companion.name,
          relation: companion.relation ?? undefined,
          mealChoice: companion.mealChoice ?? undefined,
          notes: companion.notes ?? undefined,
        })),
        eventRsvps: events.map((event) => {
          const rsvp = guest.eventRsvps.find((item) => item.eventId === event.id);
          const invite = guest.eventInvites.find((item) => item.eventId === event.id);

          return {
            eventId: event.id,
            eventName: event.name,
            invited: invite?.invited ?? true,
            status: rsvp ? rsvpLabels[rsvp.status] : rsvpLabels[guest.status],
            attendeeCount: rsvp?.attendeeCount ?? guest.additionalGuestCount + 1,
            mealChoice: rsvp?.mealChoice ?? guest.mealChoice,
            notes: rsvp?.notes ?? undefined,
          };
        }),
      })),
      tables: tableRows.map((table) => ({
        id: table.id,
        eventId: table.eventId ?? undefined,
        eventName: table.event?.name,
        name: table.name,
        capacity: table.capacity,
        sortOrder: table.sortOrder,
        assignments: table.assignments.map((assignment) => ({
          id: assignment.id,
          guestId: assignment.guestId ?? undefined,
          guestName: assignment.guest?.name,
          companionId: assignment.companionId ?? undefined,
          companionName: assignment.companion?.name,
          seatLabel: assignment.seatLabel ?? undefined,
        })),
      })),
    };
  } catch (error) {
    dbUnavailable(error);
    return {
      wedding: {
        id: "local-wedding",
        couple: weddingDetails.couple,
        date: weddingDetails.date,
        location: weddingDetails.location,
        style: weddingDetails.style,
        budget: weddingDetails.budget,
        guestCount: weddingDetails.guestCount,
      },
      events: [],
      guests: [],
      tables: [],
    };
  }
}

export async function getCoupleOpportunitiesData(): Promise<CoreOpportunitiesData> {
  try {
    const { weddingId, wedding } = await getCurrentWeddingContext();
    const [opportunityRows, categoryRows] = await Promise.all([
      prisma.vendorOpportunity.findMany({
        where: { weddingId },
        include: {
          category: true,
          wedding: true,
          pitches: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.category.findMany({
        where: {
          type: CategoryType.VENDOR_SERVICE,
          archivedAt: null,
          OR: [{ scope: CategoryScope.GLOBAL }, { scope: CategoryScope.WEDDING, ownerWeddingId: weddingId }],
        },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      }),
    ]);

    return {
      wedding: {
        id: wedding.id,
        couple: wedding.coupleNames,
        date: wedding.date.toISOString(),
        location: wedding.location,
        style: wedding.style,
        budget: centsToDollars(wedding.budgetCents),
        guestCount: wedding.guestCount,
      },
      categories: categoryRows.map(categoryToCore),
      opportunities: opportunityRows.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        categoryId: item.categoryId ?? undefined,
        category: item.category?.name,
        budget: item.budgetCents === null ? undefined : centsToDollars(item.budgetCents),
        location: item.location ?? undefined,
        date: item.date?.toISOString(),
        guestCount: item.guestCount ?? undefined,
        status: moneyStatusLabel(item.status),
        weddingName: item.wedding.coupleNames,
        pitchCount: item.pitches.length,
      })),
    };
  } catch (error) {
    dbUnavailable(error);
    return { categories: categories.filter((item) => item.type === "vendor_service").map(fallbackCategoryToCore), opportunities: [] };
  }
}

export async function getVendorOpportunitiesData(): Promise<CoreOpportunitiesData> {
  try {
    const { vendorBusinessId } = await getCurrentVendorContext();
    const [opportunityRows, categoryRows] = await Promise.all([
      prisma.vendorOpportunity.findMany({
        where: { status: { in: [OpportunityStatus.OPEN, OpportunityStatus.PITCHED] } },
        include: {
          category: true,
          wedding: true,
          pitches: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.category.findMany({
        where: {
          type: CategoryType.VENDOR_SERVICE,
          archivedAt: null,
          OR: [{ scope: CategoryScope.GLOBAL }, { scope: CategoryScope.VENDOR_BUSINESS, ownerVendorId: vendorBusinessId }],
        },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      }),
    ]);

    return {
      vendorBusinessId,
      categories: categoryRows.map(categoryToCore),
      opportunities: opportunityRows.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        categoryId: item.categoryId ?? undefined,
        category: item.category?.name,
        budget: item.budgetCents === null ? undefined : centsToDollars(item.budgetCents),
        location: item.location ?? undefined,
        date: item.date?.toISOString(),
        guestCount: item.guestCount ?? undefined,
        status: moneyStatusLabel(item.status),
        weddingName: item.wedding.coupleNames,
        pitchCount: item.pitches.length,
        pitchedByCurrentVendor: item.pitches.some((pitch) => pitch.vendorBusinessId === vendorBusinessId),
      })),
    };
  } catch (error) {
    dbUnavailable(error);
    return { categories: categories.filter((item) => item.type === "vendor_service").map(fallbackCategoryToCore), opportunities: [] };
  }
}

function normalizePlannerResult(value: unknown): CoreAIPlan | undefined {
  if (!value || typeof value !== "object") return undefined;
  const result = value as {
    budgetBreakdown?: CoreAIPlan["budgetBreakdown"];
    budget?: { targetCents?: number; committedCents?: number; projectedRemainingCents?: number };
    recommendedVendors?: string[];
    timelineSuggestions?: string[];
    insights?: string[];
    riskFlags?: string[];
  };

  return {
    generatedAt: new Date().toISOString(),
    budgetBreakdown:
      result.budgetBreakdown ??
      [
        {
          category: "Committed",
          amount: centsToDollars(result.budget?.committedCents ?? 0),
          note: "Current committed spend from budget and bookings.",
        },
        {
          category: "Remaining",
          amount: centsToDollars(result.budget?.projectedRemainingCents ?? 0),
          note: "Estimated budget room after committed expenses.",
        },
      ],
    recommendedVendors: result.recommendedVendors ?? [],
    timelineSuggestions: result.timelineSuggestions ?? [],
    insights: result.insights ?? [],
    riskFlags: result.riskFlags ?? [],
  };
}

export async function getPlannerData(): Promise<CorePlannerData> {
  try {
    const { weddingId } = await getCurrentWeddingContext();
    const wedding = await prisma.wedding.findUniqueOrThrow({
      where: { id: weddingId },
      include: {
        plannerSnapshots: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });
    const snapshot = wedding.plannerSnapshots[0];
    const normalized = normalizePlannerResult(snapshot?.result);
    const recommendedSlugs = normalized?.recommendedVendors ?? [];
    const recommendedVendors = recommendedSlugs.length
      ? await prisma.vendorBusiness.findMany({
          where: { slug: { in: recommendedSlugs } },
          include: {
            services: {
              take: 1,
              include: { category: true },
            },
          },
        })
      : [];

    return {
      wedding: {
        id: wedding.id,
        couple: wedding.coupleNames,
        date: wedding.date.toISOString(),
        location: wedding.location,
        style: wedding.style,
        budget: centsToDollars(wedding.budgetCents),
        guestCount: wedding.guestCount,
      },
      plan: normalized
        ? {
            ...normalized,
            id: snapshot?.id,
            generatedAt: snapshot?.createdAt.toISOString() ?? normalized.generatedAt,
          }
        : undefined,
      recommendedVendors: recommendedVendors.map(vendorBusinessToCard),
    };
  } catch (error) {
    dbUnavailable(error);
    return {
      wedding: {
        id: "local-wedding",
        couple: weddingDetails.couple,
        date: weddingDetails.date,
        location: weddingDetails.location,
        style: weddingDetails.style,
        budget: weddingDetails.budget,
        guestCount: weddingDetails.guestCount,
      },
      plan: undefined,
      recommendedVendors: [],
    };
  }
}

function moneyStatusLabel(value?: string | null) {
  if (!value) return "Invoice Due";
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

export async function getVendorClientsData(): Promise<CoreVendorClientsData> {
  try {
    const { vendorBusinessId } = await getCurrentVendorContext();
    const [bookings, leadRows, serviceRows] = await Promise.all([
      prisma.booking.findMany({
        where: { vendorBusinessId },
        include: {
          wedding: true,
          service: true,
          paymentSchedule: { orderBy: { dueDate: "asc" } },
          contracts: { orderBy: { createdAt: "desc" } },
          invoiceRecords: { orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }] },
          scheduledCalls: { orderBy: { startsAt: "asc" } },
        },
        orderBy: { bookedAt: "desc" },
      }),
      prisma.lead.findMany({
        where: {
          inquiry: { vendorBusinessId },
          stage: { not: LeadStage.LOST },
        },
        include: {
          inquiry: {
            include: {
              wedding: true,
              service: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.vendorService.findMany({
        where: { vendorBusinessId },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
    ]);
    const bookedLeadIds = new Set(bookings.map((booking) => booking.leadId).filter(Boolean));
    const bookingIds = bookings.map((booking) => booking.id);
    const fileRows = bookingIds.length
      ? await prisma.fileAsset.findMany({
          where: { ownerType: "BOOKING", ownerId: { in: bookingIds } },
          include: { uploadedBy: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
        })
      : [];
    const filesByBookingId = fileRows.reduce<Map<string, CoreFileAsset[]>>((acc, file) => {
      const existing = acc.get(file.ownerId) ?? [];
      existing.push(fileAssetToCore(file));
      acc.set(file.ownerId, existing);
      return acc;
    }, new Map());
    const bookingClients = bookings.map((booking) => ({
      id: booking.id,
      recordType: "booking" as const,
      vendorBusinessId: booking.vendorBusinessId,
      weddingId: booking.weddingId,
      serviceId: booking.serviceId ?? undefined,
      coupleNames: booking.wedding.coupleNames,
      weddingDate: booking.wedding.date.toISOString(),
      packageName: booking.service?.name ?? "Confirmed package",
      amount: centsToDollars(booking.amountCents),
      bookingStatus: moneyStatusLabel(booking.status),
      paymentStatus: moneyStatusLabel(booking.paymentSchedule[0]?.status),
      contractStatus: moneyStatusLabel(booking.contracts[0]?.status),
      notes: booking.notes ?? `Confirmed booking for ${formatShortMoney(centsToDollars(booking.amountCents))}.`,
      contractId: booking.contracts[0]?.id,
      paymentSchedule: booking.paymentSchedule.map((item) => ({
        id: item.id,
        bookingId: item.bookingId ?? undefined,
        budgetItemId: item.budgetItemId ?? undefined,
        label: item.label,
        amount: centsToDollars(item.amountCents),
        dueDate: item.dueDate.toISOString(),
        status: moneyStatusLabel(item.status),
      })),
      invoices: booking.invoiceRecords.map((invoice) => ({
        id: invoice.id,
        bookingId: invoice.bookingId ?? undefined,
        budgetItemId: invoice.budgetItemId ?? undefined,
        label: invoice.label,
        amount: centsToDollars(invoice.amountCents),
        status: moneyStatusLabel(invoice.status),
        dueDate: invoice.dueDate?.toISOString(),
      })),
      files: filesByBookingId.get(booking.id) ?? [],
      scheduledCalls: booking.scheduledCalls.map(scheduledCallToCore),
    }));
    const leadClients = leadRows
      .filter((lead) => !bookedLeadIds.has(lead.id))
      .map((lead) => ({
        id: lead.id,
        recordType: "lead" as const,
        vendorBusinessId: lead.inquiry.vendorBusinessId,
        weddingId: lead.inquiry.weddingId,
        serviceId: lead.inquiry.serviceId ?? undefined,
        coupleNames: lead.inquiry.wedding.coupleNames,
        weddingDate: lead.inquiry.wedding.date.toISOString(),
        packageName: lead.inquiry.service?.name ?? "Quote request",
        amount: centsToDollars(lead.estimatedValueCents),
        bookingStatus: moneyStatusLabel(lead.stage),
        paymentStatus: "Invoice Due",
        contractStatus: lead.stage === LeadStage.PROPOSAL_SENT ? "Pending" : "Draft",
        notes: lead.lastMessage,
        paymentSchedule: [],
        invoices: [],
        files: [],
        scheduledCalls: [],
      }));

    return { clients: [...bookingClients, ...leadClients], services: serviceRows };
  } catch (error) {
    dbUnavailable(error);
    return {
      clients: clientRecords.map((client) => ({
        ...client,
        recordType: "lead",
        paymentSchedule: [],
        invoices: [],
        files: [],
        scheduledCalls: [],
      })),
      services: [],
    };
  }
}

function formatShortMoney(value: number) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(value);
}

export async function getVendorAnalyticsData(): Promise<CoreVendorAnalyticsData> {
  try {
    const { vendorBusinessId, vendorBusiness } = await getCurrentVendorContext();
    const [leadRows, bookings, portfolio] = await Promise.all([
      prisma.lead.findMany({
        where: { inquiry: { vendorBusinessId } },
        include: { inquiry: true },
      }),
      prisma.booking.findMany({ where: { vendorBusinessId } }),
      prisma.portfolioItem.findMany({
        where: { vendorBusinessId },
        orderBy: { sortOrder: "asc" },
        take: 3,
      }),
    ]);
    const bookedCount = bookings.length;
    const leadsReceived = leadRows.length;
    const revenueBooked = centsToDollars(bookings.reduce((sum, booking) => sum + booking.amountCents, 0));
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    const views = monthNames.map((month, index) => ({
      month,
      views: Math.max(320, vendorBusiness.reviewsCount * 6 + index * 90 + vendorBusiness.matchScore),
      leads: Math.max(1, Math.round((leadsReceived + index + 2) * (index + 1) * 0.35)),
    }));

    return {
      profileViews: views.at(-1)?.views ?? 0,
      leadsReceived,
      conversionRate: leadsReceived ? Math.round((bookedCount / leadsReceived) * 100) : 0,
      revenueBooked,
      views,
      sources: [
        { name: "Marketplace", value: Math.max(35, leadsReceived * 8) },
        { name: "Profile", value: Math.max(22, vendorBusiness.matchScore - 70) },
        { name: "Referrals", value: 15 },
        { name: "Social", value: 10 },
      ],
      topImages: portfolio.map((item) => item.image).concat(vendorBusiness.image ? [vendorBusiness.image] : []).slice(0, 3),
    };
  } catch (error) {
    dbUnavailable(error);
    return {
      profileViews: 1460,
      leadsReceived: 42,
      conversionRate: 38,
      revenueBooked: 42800,
      views: [
        { month: "Jan", views: 820, leads: 18 },
        { month: "Feb", views: 930, leads: 23 },
        { month: "Mar", views: 1120, leads: 31 },
        { month: "Apr", views: 1280, leads: 36 },
        { month: "May", views: 1460, leads: 42 },
        { month: "Jun", views: 1610, leads: 45 },
      ],
      sources: [
        { name: "Marketplace", value: 48 },
        { name: "Profile", value: 27 },
        { name: "Referrals", value: 15 },
        { name: "Social", value: 10 },
      ],
      topImages: vendors.slice(0, 3).map((vendor) => vendor.image),
    };
  }
}

export async function getVendorDashboardData(): Promise<CoreVendorDashboardData> {
  try {
    const { vendorBusinessId, vendorBusiness } = await getCurrentVendorContext();
    const [leadData, clientData, analyticsData, categoryRows, serviceRows, portfolioRows, pastWeddingRows, reviewRows, faqRows, fileRows, availabilityRows] = await Promise.all([
      getVendorLeadsData(),
      getVendorClientsData(),
      getVendorAnalyticsData(),
      prisma.category.findMany({
        where: {
          type: CategoryType.VENDOR_SERVICE,
          archivedAt: null,
          OR: [{ scope: CategoryScope.GLOBAL }, { scope: CategoryScope.VENDOR_BUSINESS, ownerVendorId: vendorBusinessId }],
        },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      }),
      prisma.vendorService.findMany({
        where: { vendorBusinessId },
        include: {
          category: true,
          _count: { select: { inquiries: true, bookings: true } },
        },
        orderBy: { name: "asc" },
      }),
      prisma.portfolioItem.findMany({ where: { vendorBusinessId }, orderBy: [{ sortOrder: "asc" }, { title: "asc" }] }),
      prisma.pastWedding.findMany({ where: { vendorBusinessId }, orderBy: { coupleNames: "asc" } }),
      prisma.review.findMany({ where: { vendorBusinessId }, orderBy: { createdAt: "desc" } }),
      prisma.vendorFaq.findMany({ where: { vendorBusinessId }, orderBy: [{ sortOrder: "asc" }, { question: "asc" }] }),
      prisma.fileAsset.findMany({
        where: { ownerType: "VENDOR_BUSINESS", ownerId: vendorBusinessId },
        include: { uploadedBy: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.vendorAvailabilitySlot.findMany({
        where: { vendorBusinessId },
        orderBy: { date: "asc" },
        take: 24,
      }),
    ]);

    const bookedLeads = leadData.leads.filter((lead) => lead.stage === "Booked");

    return {
      vendor: {
        id: vendorBusinessId,
        name: vendorBusiness.name,
        location: vendorBusiness.location,
        startingPrice: centsToDollars(vendorBusiness.startingPriceCents),
        image: vendorBusiness.image ?? "",
        gallery: vendorBusiness.gallery,
        styleTags: vendorBusiness.styleTags,
        availability: vendorBusiness.availability,
        responseTime: vendorBusiness.responseTime,
        socials: vendorBusiness.socials,
        about: vendorBusiness.about,
        visible: Boolean(vendorBusiness.approvedAt && !vendorBusiness.hiddenAt),
      },
      profileViews: analyticsData.profileViews,
      newLeads: leadData.leads.filter((lead) => lead.stage === "New Inquiry").length,
      activeClients: clientData.clients.length,
      upcomingWeddings: clientData.clients.filter((client) => new Date(client.weddingDate) >= new Date()).length,
      monthlyRevenue: analyticsData.revenueBooked || bookedLeads.reduce((sum, lead) => sum + lead.estimatedValue, 0),
      responseRate: 94,
      conversionRate: analyticsData.conversionRate,
      profileScore: Math.min(98, Math.max(72, vendorBusiness.matchScore - 8)),
      recentLeads: leadData.leads.slice(0, 5),
      upcomingClients: clientData.clients.slice(0, 4),
      availabilitySlots: availabilityRows.map((slot) => ({
        id: slot.id,
        date: slot.date.toISOString(),
        label: slot.date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
        status: slot.status,
        note: slot.note ?? undefined,
      })),
      categories: categoryRows.map(categoryToCore),
      services: serviceRows.map((service) => ({
        id: service.id,
        name: service.name,
        categoryId: service.categoryId,
        category: service.category.name,
        startingPrice: centsToDollars(service.startingPriceCents),
        description: service.description,
        includes: Array.isArray(service.includes) ? service.includes.map(String) : [],
        linkedRecords: service._count.inquiries + service._count.bookings,
      })),
      portfolioItems: portfolioRows.map((item) => ({
        id: item.id,
        title: item.title,
        image: item.image,
        sortOrder: item.sortOrder,
      })),
      pastWeddings: pastWeddingRows.map((item) => ({
        id: item.id,
        coupleNames: item.coupleNames,
        venue: item.venue,
        style: item.style,
        image: item.image,
      })),
      reviews: reviewRows.map((item) => ({
        id: item.id,
        author: item.author,
        rating: item.rating,
        body: item.body,
        createdAt: item.createdAt.toISOString(),
      })),
      faqs: faqRows.map((item) => ({
        id: item.id,
        question: item.question,
        answer: item.answer,
        sortOrder: item.sortOrder,
      })),
      files: fileRows.map(fileAssetToCore),
    };
  } catch (error) {
    dbUnavailable(error);
    const newLeads = leads.filter((lead) => lead.stage === "New Inquiry").length;
    const bookedRevenue = leads.filter((lead) => lead.stage === "Booked").reduce((sum, lead) => sum + lead.estimatedValue, 0);

    return {
      vendor: {
        id: "golden-lens-photography",
        name: "Golden Lens Photography",
        location: "Toronto, Ontario",
        startingPrice: 4200,
        image: "",
        gallery: [],
        styleTags: ["Editorial", "South Asian fusion", "Documentary"],
        availability: "Available",
        responseTime: "2 hours",
        socials: ["instagram.com/goldenlens"],
        about: "Editorial wedding photography for modern Toronto celebrations.",
        visible: true,
      },
      profileViews: 1460,
      newLeads,
      activeClients: clientRecords.length,
      upcomingWeddings: 4,
      monthlyRevenue: bookedRevenue + 18400,
      responseRate: 94,
      conversionRate: 38,
      profileScore: 86,
      recentLeads: leads.slice(0, 5).map((lead) => ({
        ...lead,
        vendorName: "Golden Lens Photography",
      })),
      upcomingClients: clientRecords.slice(0, 4).map((client) => ({
        ...client,
        recordType: "lead" as const,
        paymentSchedule: [],
        invoices: [],
        files: [],
        scheduledCalls: [],
      })),
      categories: categories.filter((item) => item.type === "vendor_service").map(fallbackCategoryToCore),
      availabilitySlots: [],
      services: [],
      portfolioItems: [],
      pastWeddings: [],
      reviews: [],
      faqs: [],
      files: [],
    };
  }
}

export async function getAdminData(): Promise<CoreAdminData> {
  try {
    const [
      usersCount,
      weddingsCount,
      vendorsCount,
      categoriesCount,
      customCategoriesCount,
      inquiriesCount,
      bookings,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.wedding.count(),
      prisma.vendorBusiness.count(),
      prisma.category.count({ where: { archivedAt: null } }),
      prisma.category.count({
        where: {
          archivedAt: null,
          scope: { in: [CategoryScope.WEDDING, CategoryScope.VENDOR_BUSINESS] },
        },
      }),
      prisma.inquiry.count(),
      prisma.booking.findMany({ select: { amountCents: true } }),
    ]);
    const bookedRevenue = centsToDollars(bookings.reduce((sum, booking) => sum + booking.amountCents, 0));

    return {
      users: usersCount,
      weddings: weddingsCount,
      vendors: vendorsCount,
      categories: categoriesCount,
      customCategories: customCategoriesCount,
      inquiries: inquiriesCount,
      bookings: bookings.length,
      bookedRevenue,
      projectedGMV: Math.max(2400000, bookedRevenue * 24),
    };
  } catch (error) {
    dbUnavailable(error);
    return {
      users: 1280,
      weddings: 320,
      vendors: 500,
      categories: 12,
      customCategories: 0,
      inquiries: 0,
      bookings: 0,
      bookedRevenue: 0,
      projectedGMV: 2400000,
    };
  }
}

export async function getNotificationsData(): Promise<CoreNotificationsData> {
  try {
    const rows = await prisma.notification.findMany({
      include: { recipientUser: { select: { email: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take: 80,
    });

    return {
      notifications: rows.map((item) => {
        const payload = item.payload as Record<string, unknown>;
        return {
          id: item.id,
          type: moneyStatusLabel(item.type),
          status: moneyStatusLabel(item.status),
          provider: item.provider,
          recipient:
            typeof payload.to === "string"
              ? payload.to
              : item.recipientUser
                ? `${item.recipientUser.name} <${item.recipientUser.email}>`
                : undefined,
          subject: typeof payload.subject === "string" ? payload.subject : undefined,
          template: typeof payload.template === "string" ? payload.template : undefined,
          error: item.error ?? undefined,
          createdAt: item.createdAt.toISOString(),
          sentAt: item.sentAt?.toISOString(),
        };
      }),
      queuedCount: rows.filter((item) => item.status === "QUEUED").length,
      failedCount: rows.filter((item) => item.status === "FAILED").length,
    };
  } catch (error) {
    dbUnavailable(error);
    return { notifications: [], queuedCount: 0, failedCount: 0 };
  }
}
