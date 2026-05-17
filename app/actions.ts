"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";
import {
  BookingStatus,
  CategoryScope,
  CategoryType,
  ContractStatus,
  FileVisibility,
  FileAssetOwnerType,
  FileAssetPurpose,
  InviteRole,
  InviteStatus,
  InvoiceStatus,
  LeadStage,
  MoneyStatus,
  NotificationStatus,
  NotificationType,
  OpportunityStatus,
  PitchStatus,
  Prisma,
  RSVPStatus,
  SenderRole,
  UserAccountType,
  WorkspaceType,
} from "@prisma/client";
import { assertVendorAccess, assertWeddingAccess, getCurrentUser, getCurrentWeddingContext, getCurrentWorkspace, requireAdmin } from "@/lib/auth";
import { sendTransactionalEmail } from "@/lib/providers/email";
import { createStorageUpload, getStorageReadUrl } from "@/lib/providers/storage";
import { prisma } from "@/lib/prisma";
import { combineDateAndTime, ensureDefaultWeddingEvents, tamilCeremonyChecklist, tamilEventTemplate, tamilFamilyResponsibilities, offsetDate } from "@/lib/weddingEvents";

const optionalDate = z
  .union([z.string().min(1), z.date()])
  .optional()
  .transform((value) => (value ? new Date(value) : undefined));

const moneyToCents = (value: number) => Math.round(value * 100);

function randomToken(bytes = 24) {
  return crypto.randomBytes(bytes).toString("base64url");
}

function tokenHash(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

async function assertMarketplaceVendorVisible(vendorBusinessId: string) {
  const vendor = await prisma.vendorBusiness.findUniqueOrThrow({
    where: { id: vendorBusinessId },
    select: { id: true, approvedAt: true, hiddenAt: true },
  });

  if (!vendor.approvedAt || vendor.hiddenAt) {
    throw new Error("This vendor profile is not currently available in the marketplace.");
  }

  return vendor;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const stageMap: Record<string, LeadStage> = {
  "New Inquiry": LeadStage.NEW_INQUIRY,
  Contacted: LeadStage.CONTACTED,
  "Proposal Sent": LeadStage.PROPOSAL_SENT,
  Negotiating: LeadStage.NEGOTIATING,
  Booked: LeadStage.BOOKED,
  Completed: LeadStage.COMPLETED,
  Lost: LeadStage.LOST,
  NEW_INQUIRY: LeadStage.NEW_INQUIRY,
  CONTACTED: LeadStage.CONTACTED,
  PROPOSAL_SENT: LeadStage.PROPOSAL_SENT,
  NEGOTIATING: LeadStage.NEGOTIATING,
  BOOKED: LeadStage.BOOKED,
  COMPLETED: LeadStage.COMPLETED,
  LOST: LeadStage.LOST,
};

const categoryTypeMap: Record<string, CategoryType> = {
  vendor_service: CategoryType.VENDOR_SERVICE,
  budget: CategoryType.BUDGET,
  task: CategoryType.TASK,
  guest_group: CategoryType.GUEST_GROUP,
  event: CategoryType.EVENT,
  misc: CategoryType.MISC,
  VENDOR_SERVICE: CategoryType.VENDOR_SERVICE,
  BUDGET: CategoryType.BUDGET,
  TASK: CategoryType.TASK,
  GUEST_GROUP: CategoryType.GUEST_GROUP,
  EVENT: CategoryType.EVENT,
  MISC: CategoryType.MISC,
};

const categoryScopeMap: Record<string, CategoryScope> = {
  global: CategoryScope.GLOBAL,
  wedding: CategoryScope.WEDDING,
  vendor_business: CategoryScope.VENDOR_BUSINESS,
  GLOBAL: CategoryScope.GLOBAL,
  WEDDING: CategoryScope.WEDDING,
  VENDOR_BUSINESS: CategoryScope.VENDOR_BUSINESS,
};

const moneyStatusMap: Record<string, MoneyStatus> = {
  PAID: MoneyStatus.PAID,
  DEPOSIT_PAID: MoneyStatus.DEPOSIT_PAID,
  DUE_SOON: MoneyStatus.DUE_SOON,
  PLANNED: MoneyStatus.PLANNED,
  "Paid": MoneyStatus.PAID,
  "Deposit Paid": MoneyStatus.DEPOSIT_PAID,
  "Due Soon": MoneyStatus.DUE_SOON,
  Planned: MoneyStatus.PLANNED,
};

const bookingStatusMap: Record<string, BookingStatus> = {
  PENDING: BookingStatus.PENDING,
  CONFIRMED: BookingStatus.CONFIRMED,
  COMPLETED: BookingStatus.COMPLETED,
  CANCELLED: BookingStatus.CANCELLED,
  Pending: BookingStatus.PENDING,
  Confirmed: BookingStatus.CONFIRMED,
  Completed: BookingStatus.COMPLETED,
  Cancelled: BookingStatus.CANCELLED,
};

const rsvpStatusMap: Record<string, RSVPStatus> = {
  ATTENDING: RSVPStatus.ATTENDING,
  DECLINED: RSVPStatus.DECLINED,
  PENDING: RSVPStatus.PENDING,
  Attending: RSVPStatus.ATTENDING,
  Declined: RSVPStatus.DECLINED,
  Pending: RSVPStatus.PENDING,
};

const contractStatusMap: Record<string, ContractStatus> = {
  SIGNED: ContractStatus.SIGNED,
  PENDING: ContractStatus.PENDING,
  DRAFT: ContractStatus.DRAFT,
  Signed: ContractStatus.SIGNED,
  Pending: ContractStatus.PENDING,
  Draft: ContractStatus.DRAFT,
};

async function assertBookingAccess(bookingId: string) {
  const booking = await prisma.booking.findUniqueOrThrow({
    where: { id: bookingId },
    include: { vendorBusiness: true },
  });

  try {
    await assertWeddingAccess(booking.weddingId);
    return booking;
  } catch {
    await assertVendorAccess(booking.vendorBusinessId);
    return booking;
  }
}

async function assertEventAccess(eventId: string) {
  const event = await prisma.weddingEvent.findUniqueOrThrow({ where: { id: eventId } });
  await assertWeddingAccess(event.weddingId);
  return event;
}

async function assertGuestAccess(guestId: string) {
  const guest = await prisma.guest.findUniqueOrThrow({ where: { id: guestId } });
  await assertWeddingAccess(guest.weddingId);
  return guest;
}

async function assertResponsibilityAccess(responsibilityId: string) {
  const responsibility = await prisma.responsibility.findUniqueOrThrow({ where: { id: responsibilityId } });
  await assertWeddingAccess(responsibility.weddingId);
  return responsibility;
}

async function assertSeatingTableAccess(tableId: string) {
  const table = await prisma.seatingTable.findUniqueOrThrow({ where: { id: tableId } });
  await assertWeddingAccess(table.weddingId);
  return table;
}

async function syncGuestCompanions(guestId: string, companionDetails?: string | null) {
  if (companionDetails === undefined) return;
  let names: string[] = [];
  try {
    const parsed = companionDetails ? JSON.parse(companionDetails) : [];
    names = Array.isArray(parsed) ? parsed.map(String).map((name) => name.trim()).filter(Boolean) : [];
  } catch {
    names = companionDetails
      ? companionDetails
          .split(",")
          .map((name) => name.trim())
          .filter(Boolean)
      : [];
  }

  await prisma.$transaction([
    prisma.guestCompanion.deleteMany({ where: { guestId } }),
    ...names.map((name, index) =>
      prisma.guestCompanion.create({
        data: {
          guestId,
          name,
          sortOrder: index,
        },
      }),
    ),
  ]);
}

async function getFallbackBudgetCategory(weddingId: string, preferredName?: string) {
  const preferred = preferredName
    ? await prisma.category.findFirst({
        where: {
          type: CategoryType.BUDGET,
          archivedAt: null,
          OR: [
            { scope: CategoryScope.GLOBAL, name: { equals: preferredName, mode: "insensitive" } },
            { scope: CategoryScope.WEDDING, ownerWeddingId: weddingId, name: { equals: preferredName, mode: "insensitive" } },
          ],
        },
      })
    : null;

  if (preferred) return preferred;

  return prisma.category.findFirstOrThrow({
    where: {
      type: CategoryType.BUDGET,
      archivedAt: null,
      OR: [
        { scope: CategoryScope.GLOBAL, slug: "budget-miscellaneous" },
        { scope: CategoryScope.GLOBAL, name: "Miscellaneous" },
      ],
    },
  });
}

export async function createInquiry(input: {
  weddingId?: string;
  vendorBusinessId: string;
  serviceId?: string;
  message: string;
}) {
  const payload = z
    .object({
      weddingId: z.string().optional(),
      vendorBusinessId: z.string(),
      serviceId: z.string().optional(),
      message: z.string().min(2).max(2000),
    })
    .parse(input);

  const { user, weddingId: currentWeddingId } = await getCurrentWeddingContext();
  const weddingId = payload.weddingId ?? currentWeddingId;
  await assertWeddingAccess(weddingId);

  const vendor = await prisma.vendorBusiness.findUniqueOrThrow({
    where: { id: payload.vendorBusinessId },
    include: { services: true },
  });
  if (!vendor.approvedAt || vendor.hiddenAt) {
    throw new Error("This vendor profile is not currently available in the marketplace.");
  }
  const service = payload.serviceId
    ? vendor.services.find((item) => item.id === payload.serviceId)
    : vendor.services[0];
  const estimatedValueCents = service?.startingPriceCents ?? vendor.startingPriceCents;

  const result = await prisma.$transaction(async (tx) => {
    const existingInquiry = await tx.inquiry.findFirst({
      where: {
        weddingId,
        vendorBusinessId: vendor.id,
        serviceId: service?.id,
      },
      include: {
        conversation: true,
        lead: true,
      },
      orderBy: { createdAt: "desc" },
    });

    if (existingInquiry) {
      const conversation =
        existingInquiry.conversation ??
        (await tx.conversation.create({
          data: {
            inquiryId: existingInquiry.id,
            weddingId,
            vendorBusinessId: vendor.id,
          },
        }));
      const lead =
        existingInquiry.lead ??
        (await tx.lead.create({
          data: {
            inquiryId: existingInquiry.id,
            stage: LeadStage.NEW_INQUIRY,
            estimatedValueCents,
            lastMessage: payload.message,
          },
        }));
      const duplicateMessage = await tx.message.findFirst({
        where: {
          conversationId: conversation.id,
          senderUserId: user.id,
          senderRole: SenderRole.COUPLE,
          body: payload.message,
        },
        orderBy: { createdAt: "desc" },
      });

      if (!duplicateMessage) {
        await tx.message.create({
          data: {
            conversationId: conversation.id,
            senderUserId: user.id,
            senderRole: SenderRole.COUPLE,
            senderName: user.name,
            body: payload.message,
          },
        });
        await tx.lead.update({
          where: { id: lead.id },
          data: { lastMessage: payload.message },
        });
        await tx.conversation.update({
          where: { id: conversation.id },
          data: { updatedAt: new Date() },
        });
      }

      return { inquiry: existingInquiry, lead, conversation };
    }

    const inquiry = await tx.inquiry.create({
      data: {
        weddingId,
        vendorBusinessId: vendor.id,
        serviceId: service?.id,
        message: payload.message,
      },
    });

    const lead = await tx.lead.create({
      data: {
        inquiryId: inquiry.id,
        stage: LeadStage.NEW_INQUIRY,
        estimatedValueCents,
        lastMessage: payload.message,
      },
    });

    const conversation = await tx.conversation.create({
      data: {
        inquiryId: inquiry.id,
        weddingId,
        vendorBusinessId: vendor.id,
        messages: {
          create: {
            senderUserId: user.id,
            senderRole: SenderRole.COUPLE,
            senderName: user.name,
            body: payload.message,
          },
        },
      },
    });

    return { inquiry, lead, conversation };
  });

  revalidatePath("/dashboard");
  revalidatePath("/marketplace");
  revalidatePath(`/marketplace/${vendor.slug}`);
  revalidatePath("/compare");
  revalidatePath("/messages");
  revalidatePath("/vendor/leads");

  return result;
}

export async function saveVendor(input: { weddingId?: string; vendorBusinessId: string }) {
  const payload = z
    .object({
      weddingId: z.string().optional(),
      vendorBusinessId: z.string(),
    })
    .parse(input);
  const { weddingId: currentWeddingId } = await getCurrentWeddingContext();
  const weddingId = payload.weddingId ?? currentWeddingId;
  await assertWeddingAccess(weddingId);
  await assertMarketplaceVendorVisible(payload.vendorBusinessId);

  const existing = await prisma.savedVendor.findUnique({
    where: {
      weddingId_vendorBusinessId: {
        weddingId,
        vendorBusinessId: payload.vendorBusinessId,
      },
    },
  });

  if (existing) {
    await prisma.savedVendor.delete({ where: { id: existing.id } });
  } else {
    await prisma.savedVendor.create({
      data: {
        weddingId,
        vendorBusinessId: payload.vendorBusinessId,
      },
    });
  }

  revalidatePath("/marketplace");
  revalidatePath("/compare");

  return { saved: !existing };
}

export async function addVendorToCompare(input: { weddingId?: string; vendorBusinessId: string }) {
  const payload = z
    .object({
      weddingId: z.string().optional(),
      vendorBusinessId: z.string(),
    })
    .parse(input);
  const weddingId = payload.weddingId ?? (await getCurrentWeddingContext()).weddingId;
  await assertWeddingAccess(weddingId);
  await assertMarketplaceVendorVisible(payload.vendorBusinessId);

  await prisma.vendorComparisonItem.upsert({
    where: {
      weddingId_vendorBusinessId: {
        weddingId,
        vendorBusinessId: payload.vendorBusinessId,
      },
    },
    update: {},
    create: {
      weddingId,
      vendorBusinessId: payload.vendorBusinessId,
    },
  });

  revalidatePath("/marketplace");
  revalidatePath("/compare");

  return { compared: true };
}

export async function removeVendorFromCompare(input: { weddingId?: string; vendorBusinessId: string }) {
  const payload = z
    .object({
      weddingId: z.string().optional(),
      vendorBusinessId: z.string(),
    })
    .parse(input);
  const { weddingId: currentWeddingId } = await getCurrentWeddingContext();
  const weddingId = payload.weddingId ?? currentWeddingId;
  await assertWeddingAccess(weddingId);

  await prisma.vendorComparisonItem.deleteMany({
    where: {
      weddingId,
      vendorBusinessId: payload.vendorBusinessId,
    },
  });

  revalidatePath("/marketplace");
  revalidatePath("/compare");

  return { compared: false };
}

export async function updateQuoteComparisonNote(input: {
  weddingId?: string;
  vendorBusinessId: string;
  categoryId?: string;
  notes: string;
}) {
  const payload = z
    .object({
      weddingId: z.string().optional(),
      vendorBusinessId: z.string(),
      categoryId: z.string().optional(),
      notes: z.string().max(2000),
    })
    .parse(input);
  const { weddingId: currentWeddingId } = await getCurrentWeddingContext();
  const weddingId = payload.weddingId ?? currentWeddingId;
  await assertWeddingAccess(weddingId);
  await assertMarketplaceVendorVisible(payload.vendorBusinessId);

  const existing = await prisma.quoteComparisonNote.findFirst({
    where: {
      weddingId,
      vendorBusinessId: payload.vendorBusinessId,
      categoryId: payload.categoryId ?? null,
    },
  });
  const note = existing
    ? await prisma.quoteComparisonNote.update({
        where: { id: existing.id },
        data: { notes: payload.notes },
      })
    : await prisma.quoteComparisonNote.create({
        data: {
          weddingId,
          vendorBusinessId: payload.vendorBusinessId,
          categoryId: payload.categoryId,
          notes: payload.notes,
        },
      });

  revalidatePath("/marketplace");
  revalidatePath("/compare");
  return note;
}

export async function sendMessage(input: { conversationId: string; body: string; senderRole?: "couple" | "vendor" }) {
  const payload = z
    .object({
      conversationId: z.string(),
      body: z.string().min(1).max(5000),
      senderRole: z.enum(["couple", "vendor"]).optional(),
    })
    .parse(input);

  const user = await getCurrentUser();
  const senderRole = payload.senderRole === "vendor" ? SenderRole.VENDOR : SenderRole.COUPLE;
  const baseConversation = await prisma.conversation.findUniqueOrThrow({
    where: { id: payload.conversationId },
  });

  if (senderRole === SenderRole.VENDOR) {
    await assertVendorAccess(baseConversation.vendorBusinessId);
  } else {
    await assertWeddingAccess(baseConversation.weddingId);
  }

  const conversation =
    senderRole === SenderRole.VENDOR
      ? await prisma.conversation.findUnique({
          where: { id: payload.conversationId },
          include: {
            inquiry: {
              include: {
                vendorBusiness: true,
              },
            },
          },
        })
      : null;

  const message = await prisma.message.create({
    data: {
      conversationId: payload.conversationId,
      senderUserId: senderRole === SenderRole.COUPLE ? user.id : undefined,
      senderRole,
      senderName: senderRole === SenderRole.VENDOR ? conversation?.inquiry?.vendorBusiness.name ?? "Vendor" : user.name,
      body: payload.body.trim(),
    },
  });

  await prisma.$transaction([
    prisma.conversation.update({
      where: { id: payload.conversationId },
      data: { updatedAt: new Date() },
    }),
    prisma.conversationReadState.upsert({
      where: { conversationId_userId: { conversationId: payload.conversationId, userId: user.id } },
      update: { lastReadAt: new Date() },
      create: { conversationId: payload.conversationId, userId: user.id },
    }),
  ]);
  await prisma.notification.create({
    data: {
      type: NotificationType.MESSAGE_RECEIVED,
      payload: {
        conversationId: payload.conversationId,
        senderRole,
        senderName: message.senderName,
        subject: `New message from ${message.senderName}`,
        template: "message_received",
      },
    },
  });

  revalidatePath("/messages");
  revalidatePath("/vendor/messages");
  revalidatePath("/dashboard");
  revalidatePath("/vendor/dashboard");

  return message;
}

export async function moveLeadStage(input: { leadId: string; stage: string }) {
  const payload = z.object({ leadId: z.string(), stage: z.string() }).parse(input);
  const stage = stageMap[payload.stage];

  if (!stage) {
    throw new Error(`Unsupported lead stage: ${payload.stage}`);
  }

  const existingLead = await prisma.lead.findUniqueOrThrow({
    where: { id: payload.leadId },
    include: {
      inquiry: {
        include: {
          conversation: true,
          vendorBusiness: true,
          wedding: true,
        },
      },
    },
  });
  await assertVendorAccess(existingLead.inquiry.vendorBusinessId);

  const lead = await prisma.lead.update({
    where: { id: payload.leadId },
    data: { stage },
    include: {
      inquiry: {
        include: {
          conversation: true,
          vendorBusiness: true,
          wedding: true,
        },
      },
    },
  });

  if (stage === LeadStage.PROPOSAL_SENT && lead.inquiry.conversation) {
    await prisma.message.create({
      data: {
        conversationId: lead.inquiry.conversation.id,
        senderRole: SenderRole.VENDOR,
        senderName: lead.inquiry.vendorBusiness.name,
        body: `Thanks ${lead.inquiry.wedding.coupleNames} - I have sent over a proposal for your wedding.`,
      },
    });
  }

  revalidatePath("/vendor/leads");
  revalidatePath("/messages");

  return lead;
}

export async function confirmBooking(input: {
  leadId: string;
  packageId?: string;
  amount?: number;
  depositDueDate?: string | Date;
}) {
  const payload = z
    .object({
      leadId: z.string(),
      packageId: z.string().optional(),
      amount: z.number().positive().optional(),
      depositDueDate: optionalDate,
    })
    .parse(input);

  const lead = await prisma.lead.findUniqueOrThrow({
    where: { id: payload.leadId },
    include: {
      inquiry: {
        include: {
          wedding: true,
          vendorBusiness: true,
          service: { include: { category: true } },
          conversation: true,
        },
      },
    },
  });
  await assertVendorAccess(lead.inquiry.vendorBusinessId);

  const amountCents = payload.amount ? moneyToCents(payload.amount) : lead.estimatedValueCents;
  const depositCents = Math.round(amountCents * 0.35);
  const budgetCategory = await getFallbackBudgetCategory(
    lead.inquiry.weddingId,
    lead.inquiry.service?.category.name,
  );

  const result = await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.create({
      data: {
        leadId: lead.id,
        weddingId: lead.inquiry.weddingId,
        vendorBusinessId: lead.inquiry.vendorBusinessId,
        serviceId: payload.packageId ?? lead.inquiry.serviceId,
        amountCents,
        status: "CONFIRMED",
        paymentSchedule: {
          create: {
            label: "Deposit",
            amountCents: depositCents,
            dueDate: payload.depositDueDate ?? new Date(),
            status: MoneyStatus.DEPOSIT_PAID,
          },
        },
        contracts: {
          create: {
            title: `${lead.inquiry.vendorBusiness.name} service agreement`,
            status: "DRAFT",
          },
        },
      },
    });

    await tx.lead.update({
      where: { id: lead.id },
      data: { stage: LeadStage.BOOKED },
    });

    const budgetItem = await tx.budgetItem.create({
      data: {
        weddingId: lead.inquiry.weddingId,
        categoryId: budgetCategory.id,
        label: `${lead.inquiry.vendorBusiness.name} confirmed booking`,
        vendorBusinessId: lead.inquiry.vendorBusinessId,
        amountCents,
        paidCents: depositCents,
        dueDate: payload.depositDueDate ?? new Date(),
        status: MoneyStatus.DEPOSIT_PAID,
      },
    });

    if (lead.inquiry.conversation) {
      await tx.message.create({
        data: {
          conversationId: lead.inquiry.conversation.id,
          senderRole: SenderRole.VENDOR,
          senderName: lead.inquiry.vendorBusiness.name,
          body: `We are confirmed for ${lead.inquiry.wedding.date.toLocaleDateString("en-CA")}. Contract and deposit are tracked in Wedding OS.`,
        },
      });
    }

    return { booking, budgetItem };
  });

  revalidatePath("/dashboard");
  revalidatePath("/budget");
  revalidatePath("/vendor/leads");
  revalidatePath("/vendor/clients");

  return result;
}

export async function createVendorQuote(input: {
  inquiryId?: string;
  vendorBusinessId: string;
  serviceId?: string;
  amount: number;
  deposit?: number;
  dueDate?: string | Date;
  validUntil?: string | Date;
  notes?: string;
  lineItems?: { label: string; amount?: number; included?: boolean; notes?: string }[];
}) {
  const payload = z
    .object({
      inquiryId: z.string().optional(),
      vendorBusinessId: z.string(),
      serviceId: z.string().optional(),
      amount: z.number().nonnegative(),
      deposit: z.number().nonnegative().optional(),
      dueDate: z.union([z.string(), z.date()]).optional(),
      validUntil: z.union([z.string(), z.date()]).optional(),
      notes: z.string().max(2000).optional(),
      lineItems: z
        .array(
          z.object({
            label: z.string().min(1).max(160),
            amount: z.number().nonnegative().optional(),
            included: z.boolean().optional(),
            notes: z.string().max(500).optional(),
          }),
        )
        .optional(),
    })
    .parse(input);
  await assertVendorAccess(payload.vendorBusinessId);
  const inquiry = payload.inquiryId
    ? await prisma.inquiry.findUniqueOrThrow({ where: { id: payload.inquiryId }, include: { conversation: true, wedding: true, vendorBusiness: true } })
    : null;
  if (inquiry && inquiry.vendorBusinessId !== payload.vendorBusinessId) {
    throw new Error("Quote vendor does not match the inquiry vendor.");
  }

  const quote = await prisma.vendorQuote.create({
    data: {
      inquiryId: payload.inquiryId,
      vendorBusinessId: payload.vendorBusinessId,
      serviceId: payload.serviceId,
      amountCents: moneyToCents(payload.amount),
      depositCents: moneyToCents(payload.deposit ?? payload.amount * 0.35),
      dueDate: payload.dueDate ? new Date(payload.dueDate) : undefined,
      validUntil: payload.validUntil ? new Date(payload.validUntil) : undefined,
      status: "Sent",
      notes: payload.notes,
      lineItems: payload.lineItems?.length
        ? {
            create: payload.lineItems.map((item, index) => ({
              label: item.label,
              amountCents: moneyToCents(item.amount ?? 0),
              included: item.included ?? true,
              notes: item.notes,
              sortOrder: index,
            })),
          }
        : undefined,
    },
  });

  if (inquiry?.conversation) {
    await prisma.message.create({
      data: {
        conversationId: inquiry.conversation.id,
        senderRole: SenderRole.VENDOR,
        senderName: inquiry.vendorBusiness.name,
        body: `I sent a quote for ${moneyToCents(payload.amount) / 100}. Deposit terms and inclusions are now available in your shortlist.`,
      },
    });
  }

  revalidatePath("/messages");
  revalidatePath("/compare");
  revalidatePath("/marketplace");
  revalidatePath("/vendor/leads");
  return quote;
}

export async function updateVendorQuote(input: {
  quoteId: string;
  fields: {
    amount?: number;
    deposit?: number;
    dueDate?: string | Date | null;
    validUntil?: string | Date | null;
    status?: string;
    notes?: string | null;
  };
}) {
  const payload = z
    .object({
      quoteId: z.string(),
      fields: z.object({
        amount: z.number().nonnegative().optional(),
        deposit: z.number().nonnegative().optional(),
        dueDate: z.union([z.string(), z.date()]).nullable().optional(),
        validUntil: z.union([z.string(), z.date()]).nullable().optional(),
        status: z.string().max(40).optional(),
        notes: z.string().max(2000).nullable().optional(),
      }),
    })
    .parse(input);
  const quote = await prisma.vendorQuote.findUniqueOrThrow({ where: { id: payload.quoteId } });
  await assertVendorAccess(quote.vendorBusinessId);
  const updated = await prisma.vendorQuote.update({
    where: { id: payload.quoteId },
    data: {
      amountCents: payload.fields.amount === undefined ? undefined : moneyToCents(payload.fields.amount),
      depositCents: payload.fields.deposit === undefined ? undefined : moneyToCents(payload.fields.deposit),
      dueDate: payload.fields.dueDate === undefined ? undefined : payload.fields.dueDate ? new Date(payload.fields.dueDate) : null,
      validUntil: payload.fields.validUntil === undefined ? undefined : payload.fields.validUntil ? new Date(payload.fields.validUntil) : null,
      status: payload.fields.status,
      notes: payload.fields.notes,
    },
  });

  revalidatePath("/compare");
  revalidatePath("/vendor/leads");
  return updated;
}

export async function acceptVendorQuote(input: { quoteId: string; depositDueDate?: string | Date }) {
  const payload = z.object({ quoteId: z.string(), depositDueDate: optionalDate }).parse(input);
  const quote = await prisma.vendorQuote.findUniqueOrThrow({
    where: { id: payload.quoteId },
    include: {
      inquiry: {
        include: {
          lead: true,
          wedding: true,
          vendorBusiness: true,
          service: { include: { category: true } },
          conversation: true,
        },
      },
      vendorBusiness: true,
      service: { include: { category: true } },
    },
  });
  if (!quote.inquiry) throw new Error("Quote must be attached to an inquiry before it can be accepted.");
  await assertWeddingAccess(quote.inquiry.weddingId);
  if (quote.status.toLowerCase() === "accepted") {
    throw new Error("This quote has already been accepted.");
  }
  const budgetCategory = await getFallbackBudgetCategory(quote.inquiry.weddingId, quote.service?.category.name ?? quote.inquiry.service?.category.name);

  const result = await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.create({
      data: {
        leadId: quote.inquiry?.lead?.id,
        weddingId: quote.inquiry!.weddingId,
        vendorBusinessId: quote.vendorBusinessId,
        serviceId: quote.serviceId ?? quote.inquiry!.serviceId,
        amountCents: quote.amountCents,
        status: BookingStatus.CONFIRMED,
        paymentSchedule: {
          create: {
            label: "Deposit",
            amountCents: quote.depositCents,
            dueDate: payload.depositDueDate ?? new Date(),
            status: MoneyStatus.DUE_SOON,
          },
        },
        contracts: {
          create: {
            title: `${quote.vendorBusiness.name} service agreement`,
            status: ContractStatus.DRAFT,
          },
        },
      },
    });
    if (quote.inquiry?.lead) {
      await tx.lead.update({ where: { id: quote.inquiry.lead.id }, data: { stage: LeadStage.BOOKED } });
    }
    const budgetItem = await tx.budgetItem.create({
      data: {
        weddingId: quote.inquiry!.weddingId,
        categoryId: budgetCategory.id,
        label: `${quote.vendorBusiness.name} accepted quote`,
        vendorBusinessId: quote.vendorBusinessId,
        amountCents: quote.amountCents,
        paidCents: 0,
        dueDate: payload.depositDueDate ?? new Date(),
        status: MoneyStatus.DUE_SOON,
      },
    });
    await tx.vendorQuote.update({ where: { id: quote.id }, data: { status: "Accepted" } });
    if (quote.inquiry?.conversation) {
      await tx.message.create({
        data: {
          conversationId: quote.inquiry.conversation.id,
          senderRole: SenderRole.SYSTEM,
          senderName: "Wedding OS",
          body: `${quote.inquiry.wedding.coupleNames} accepted ${quote.vendorBusiness.name}'s quote. Booking, budget, deposit, and contract records were created.`,
        },
      });
    }
    return { booking, budgetItem };
  });

  revalidatePath("/dashboard");
  revalidatePath("/budget");
  revalidatePath("/compare");
  revalidatePath("/messages");
  revalidatePath("/marketplace");
  revalidatePath("/vendor/leads");
  revalidatePath("/vendor/clients");
  return result;
}

export async function createBudgetItem(input: {
  weddingId?: string;
  eventId?: string;
  categoryId: string;
  label: string;
  amount: number;
  paid?: number;
  dueDate: string | Date;
  vendorBusinessId?: string;
}) {
  const payload = z
    .object({
      weddingId: z.string().optional(),
      eventId: z.string().optional(),
      categoryId: z.string(),
      label: z.string().min(1).max(160),
      amount: z.number().nonnegative(),
      paid: z.number().nonnegative().optional(),
      dueDate: z.union([z.string(), z.date()]),
      vendorBusinessId: z.string().optional(),
    })
    .parse(input);

  const { weddingId: currentWeddingId } = await getCurrentWeddingContext();
  const weddingId = payload.weddingId ?? currentWeddingId;
  await assertWeddingAccess(weddingId);
  if (payload.eventId) {
    const event = await assertEventAccess(payload.eventId);
    if (event.weddingId !== weddingId) throw new Error("Event does not belong to this wedding.");
  }
  const budgetItem = await prisma.budgetItem.create({
    data: {
      weddingId,
      eventId: payload.eventId,
      categoryId: payload.categoryId,
      label: payload.label,
      amountCents: moneyToCents(payload.amount),
      paidCents: moneyToCents(payload.paid ?? 0),
      dueDate: new Date(payload.dueDate),
      vendorBusinessId: payload.vendorBusinessId,
      status: payload.paid ? MoneyStatus.DEPOSIT_PAID : MoneyStatus.PLANNED,
    },
  });

  revalidatePath("/budget");
  revalidatePath("/dashboard");

  return budgetItem;
}

export async function createCategory(input: {
  type: string;
  scope: string;
  ownerId?: string;
  name: string;
  color?: string;
  icon?: string;
  parentCategoryId?: string;
}) {
  const payload = z
    .object({
      type: z.string(),
      scope: z.string(),
      ownerId: z.string().optional(),
      name: z.string().min(2).max(80),
      color: z.string().optional(),
      icon: z.string().optional(),
      parentCategoryId: z.string().optional(),
    })
    .parse(input);

  const { weddingId } = await getCurrentWeddingContext();
  const type = categoryTypeMap[payload.type];
  const scope = categoryScopeMap[payload.scope];

  if (!type || !scope) {
    throw new Error("Unsupported category type or scope.");
  }

  if (scope === CategoryScope.GLOBAL) {
    throw new Error("Global categories are platform-admin managed.");
  }

  const ownerWeddingId = scope === CategoryScope.WEDDING ? payload.ownerId ?? weddingId : undefined;
  const ownerVendorId = scope === CategoryScope.VENDOR_BUSINESS ? payload.ownerId : undefined;

  if (ownerWeddingId) {
    await assertWeddingAccess(ownerWeddingId);
  }

  if (scope === CategoryScope.VENDOR_BUSINESS && !ownerVendorId) {
    throw new Error("Vendor-scoped categories require a vendor business owner ID.");
  }

  if (ownerVendorId) {
    await assertVendorAccess(ownerVendorId);
  }

  const category = await prisma.category.create({
    data: {
      type,
      scope,
      name: payload.name,
      slug: `${slugify(payload.name)}-${Date.now().toString(36)}`,
      ownerWeddingId,
      ownerVendorId,
      color: payload.color,
      icon: payload.icon,
      parentCategoryId: payload.parentCategoryId,
    },
  });

  revalidatePath("/budget");
  revalidatePath("/timeline");
  revalidatePath("/marketplace");
  revalidatePath("/vendor/dashboard");

  return category;
}

export async function archiveCategory(input: { categoryId: string }) {
  const payload = z.object({ categoryId: z.string() }).parse(input);
  const category = await prisma.category.findUniqueOrThrow({ where: { id: payload.categoryId } });

  if (category.scope === CategoryScope.GLOBAL) {
    throw new Error("Global categories cannot be archived by workspace users.");
  }

  if (category.ownerWeddingId) {
    await assertWeddingAccess(category.ownerWeddingId);
  }

  if (category.ownerVendorId) {
    await assertVendorAccess(category.ownerVendorId);
  }

  const updated = await prisma.category.update({
    where: { id: payload.categoryId },
    data: { archivedAt: new Date() },
  });

  revalidatePath("/budget");
  revalidatePath("/timeline");
  revalidatePath("/marketplace");

  return updated;
}

export async function updateCategory(input: {
  categoryId: string;
  fields: { name?: string; color?: string | null; icon?: string | null; sortOrder?: number };
}) {
  const payload = z
    .object({
      categoryId: z.string(),
      fields: z.object({
        name: z.string().min(2).max(80).optional(),
        color: z.string().nullable().optional(),
        icon: z.string().nullable().optional(),
        sortOrder: z.number().int().optional(),
      }),
    })
    .parse(input);
  const category = await prisma.category.findUniqueOrThrow({ where: { id: payload.categoryId } });
  if (category.scope === CategoryScope.GLOBAL) {
    await requireAdmin();
  }
  if (category.ownerWeddingId) await assertWeddingAccess(category.ownerWeddingId);
  if (category.ownerVendorId) await assertVendorAccess(category.ownerVendorId);
  const updated = await prisma.category.update({
    where: { id: category.id },
    data: {
      name: payload.fields.name,
      color: payload.fields.color,
      icon: payload.fields.icon,
      sortOrder: payload.fields.sortOrder,
    },
  });
  revalidatePath("/budget");
  revalidatePath("/timeline");
  revalidatePath("/vendor/dashboard");
  revalidatePath("/admin");
  return updated;
}

export async function createWeddingEvent(input: {
  weddingId?: string;
  name: string;
  type: string;
  date: string | Date;
  startTime?: string;
  endTime?: string;
  location?: string;
  venueName?: string;
  notes?: string;
  sortOrder?: number;
}) {
  const payload = z
    .object({
      weddingId: z.string().optional(),
      name: z.string().min(2).max(120),
      type: z.string().min(2).max(80),
      date: z.union([z.string(), z.date()]),
      startTime: z.string().max(16).optional(),
      endTime: z.string().max(16).optional(),
      location: z.string().max(160).optional(),
      venueName: z.string().max(160).optional(),
      notes: z.string().max(1000).optional(),
      sortOrder: z.number().int().optional(),
    })
    .parse(input);
  const { weddingId: currentWeddingId } = await getCurrentWeddingContext();
  const weddingId = payload.weddingId ?? currentWeddingId;
  await assertWeddingAccess(weddingId);

  const event = await prisma.weddingEvent.create({
    data: {
      weddingId,
      name: payload.name,
      type: payload.type,
      date: new Date(payload.date),
      startTime: payload.startTime,
      endTime: payload.endTime,
      location: payload.location,
      venueName: payload.venueName,
      notes: payload.notes,
      sortOrder: payload.sortOrder ?? 0,
    },
  });

  revalidatePath("/onboarding");
  revalidatePath("/dashboard");
  revalidatePath("/timeline");
  revalidatePath("/budget");
  revalidatePath("/rsvp");
  revalidatePath("/run-sheet");
  return event;
}

export async function updateWeddingEvent(input: {
  eventId: string;
  fields: {
    name?: string;
    type?: string;
    date?: string | Date;
    startTime?: string | null;
    endTime?: string | null;
    location?: string | null;
    venueName?: string | null;
    notes?: string | null;
    sortOrder?: number;
  };
}) {
  const payload = z
    .object({
      eventId: z.string(),
      fields: z.object({
        name: z.string().min(2).max(120).optional(),
        type: z.string().min(2).max(80).optional(),
        date: z.union([z.string(), z.date()]).optional(),
        startTime: z.string().max(16).nullable().optional(),
        endTime: z.string().max(16).nullable().optional(),
        location: z.string().max(160).nullable().optional(),
        venueName: z.string().max(160).nullable().optional(),
        notes: z.string().max(1000).nullable().optional(),
        sortOrder: z.number().int().optional(),
      }),
    })
    .parse(input);
  await assertEventAccess(payload.eventId);
  const event = await prisma.weddingEvent.update({
    where: { id: payload.eventId },
    data: {
      ...payload.fields,
      date: payload.fields.date === undefined ? undefined : new Date(payload.fields.date),
    },
  });

  revalidatePath("/onboarding");
  revalidatePath("/dashboard");
  revalidatePath("/timeline");
  revalidatePath("/budget");
  revalidatePath("/rsvp");
  revalidatePath("/run-sheet");
  return event;
}

export async function deleteWeddingEvent(input: { eventId: string }) {
  const payload = z.object({ eventId: z.string() }).parse(input);
  await assertEventAccess(payload.eventId);
  await prisma.weddingEvent.delete({ where: { id: payload.eventId } });

  revalidatePath("/onboarding");
  revalidatePath("/dashboard");
  revalidatePath("/timeline");
  revalidatePath("/budget");
  revalidatePath("/rsvp");
  revalidatePath("/run-sheet");
  return { deleted: true };
}

export async function applyTamilWeddingTemplate(input: { weddingId?: string; templateKey?: string }) {
  const payload = z.object({ weddingId: z.string().optional(), templateKey: z.string().optional() }).parse(input);
  const { weddingId: currentWeddingId } = await getCurrentWeddingContext();
  const weddingId = payload.weddingId ?? currentWeddingId;
  await assertWeddingAccess(weddingId);
  const wedding = await prisma.wedding.findUniqueOrThrow({ where: { id: weddingId } });

  const events = await ensureDefaultWeddingEvents(weddingId);
  const ceremonyEvent = events.find((event) => event.type === "CEREMONY") ?? events[0];
  const receptionEvent = events.find((event) => event.type === "RECEPTION") ?? events.at(-1);

  await prisma.$transaction(async (tx) => {
    const ceremonyTaskCategory =
      (await tx.category.findFirst({
        where: {
          type: CategoryType.TASK,
          archivedAt: null,
          OR: [
            { scope: CategoryScope.WEDDING, ownerWeddingId: weddingId, name: { equals: "Tamil Ceremony", mode: "insensitive" } },
            { scope: CategoryScope.GLOBAL, name: { equals: "Tamil Ceremony", mode: "insensitive" } },
          ],
        },
      })) ??
      (await tx.category.create({
        data: {
          name: "Tamil Ceremony",
          slug: `tamil-ceremony-${weddingId}`,
          type: CategoryType.TASK,
          scope: CategoryScope.WEDDING,
          ownerWeddingId: weddingId,
          color: "#9f4a52",
          icon: "Gem",
        },
      }));

    for (const [index, title] of tamilCeremonyChecklist.entries()) {
      const existing = await tx.timelineTask.findFirst({ where: { weddingId, title } });
      if (!existing) {
        await tx.timelineTask.create({
          data: {
            weddingId,
            eventId: ceremonyEvent?.id,
            categoryId: ceremonyTaskCategory.id,
            title,
            group: "Tamil Ceremony Checklist",
            dueDate: ceremonyEvent ? offsetDate(ceremonyEvent.date, -14) : wedding.date,
            priority: index < 3 ? "High" : "Medium",
          },
        });
      }
    }

    for (const title of tamilFamilyResponsibilities) {
      const existing = await tx.responsibility.findFirst({ where: { weddingId, title } });
      if (!existing) {
        await tx.responsibility.create({
          data: {
            weddingId,
            eventId: title.includes("Food") ? receptionEvent?.id : ceremonyEvent?.id,
            title,
            dueDate: ceremonyEvent ? offsetDate(ceremonyEvent.date, -30) : wedding.date,
            status: "Open",
          },
        });
      }
    }

    for (const event of events) {
      const existingBlock = await tx.eventTimelineBlock.findFirst({ where: { weddingId, eventId: event.id } });
      if (!existingBlock) {
        await tx.eventTimelineBlock.create({
          data: {
            weddingId,
            eventId: event.id,
            title: `${event.name} begins`,
            startsAt: combineDateAndTime(event.date, event.startTime),
            endsAt: event.endTime ? combineDateAndTime(event.date, event.endTime) : undefined,
            location: event.venueName ?? event.location ?? wedding.location,
            ownerName: "Family lead",
            sortOrder: event.sortOrder,
          },
        });
      }
    }

    const vendorCategories = await tx.category.findMany({
      where: {
        type: CategoryType.VENDOR_SERVICE,
        archivedAt: null,
        name: { in: ["Venues", "Photography", "Videography", "Catering", "Decor", "Florals", "DJ / Music", "Makeup", "Hair", "Transportation"] },
      },
    });

    for (const category of vendorCategories) {
      const existingNeed = await tx.eventVendorNeed.findFirst({ where: { weddingId, categoryId: category.id } });
      if (!existingNeed) {
        await tx.eventVendorNeed.create({
          data: {
            weddingId,
            eventId: category.name === "Catering" || category.name === "DJ / Music" ? receptionEvent?.id : ceremonyEvent?.id,
            categoryId: category.id,
            title: `${category.name} for Tamil wedding events`,
            budgetCents: Math.round(wedding.budgetCents * 0.1),
            status: "Needed",
            notes: "Created from the Tamil GTA wedding template.",
          },
        });
      }
    }
  });

  revalidatePath("/dashboard");
  revalidatePath("/timeline");
  revalidatePath("/run-sheet");
  revalidatePath("/budget");
  revalidatePath("/opportunities");
  return { applied: true };
}

export async function updateEventRsvp(input: {
  guestId: string;
  eventId: string;
  status: string;
  attendeeCount?: number;
  mealChoice?: string;
  notes?: string | null;
  invited?: boolean;
}) {
  const payload = z
    .object({
      guestId: z.string(),
      eventId: z.string(),
      status: z.string(),
      attendeeCount: z.number().int().min(0).max(30).optional(),
      mealChoice: z.string().max(120).optional(),
      notes: z.string().max(1000).nullable().optional(),
      invited: z.boolean().optional(),
    })
    .parse(input);
  const [guest, event] = await Promise.all([assertGuestAccess(payload.guestId), assertEventAccess(payload.eventId)]);
  if (guest.weddingId !== event.weddingId) throw new Error("Guest and event must belong to the same wedding.");
  const status = rsvpStatusMap[payload.status];
  if (!status) throw new Error(`Unsupported RSVP status: ${payload.status}`);

  const result = await prisma.$transaction(async (tx) => {
    if (payload.invited !== undefined) {
      await tx.guestEventInvite.upsert({
        where: { guestId_eventId: { guestId: payload.guestId, eventId: payload.eventId } },
        create: { guestId: payload.guestId, eventId: payload.eventId, invited: payload.invited },
        update: { invited: payload.invited },
      });
    }

    return tx.eventRsvp.upsert({
      where: { guestId_eventId: { guestId: payload.guestId, eventId: payload.eventId } },
      create: {
        guestId: payload.guestId,
        eventId: payload.eventId,
        status,
        attendeeCount: payload.attendeeCount ?? guest.additionalGuestCount + 1,
        mealChoice: payload.mealChoice ?? guest.mealChoice,
        notes: payload.notes,
      },
      update: {
        status,
        attendeeCount: payload.attendeeCount,
        mealChoice: payload.mealChoice,
        notes: payload.notes,
      },
    });
  });

  revalidatePath("/rsvp");
  revalidatePath("/rsvp");
  return result;
}

export async function createEventRsvp(input: Parameters<typeof updateEventRsvp>[0]) {
  return updateEventRsvp(input);
}

export async function createResponsibility(input: {
  weddingId?: string;
  eventId?: string;
  title: string;
  assignedName?: string;
  assignedEmail?: string;
  dueDate: string | Date;
  status?: string;
  notes?: string;
}) {
  const payload = z
    .object({
      weddingId: z.string().optional(),
      eventId: z.string().optional(),
      title: z.string().min(2).max(160),
      assignedName: z.string().max(120).optional(),
      assignedEmail: z.string().email().optional().or(z.literal("")),
      dueDate: z.union([z.string(), z.date()]),
      status: z.string().max(40).optional(),
      notes: z.string().max(1000).optional(),
    })
    .parse(input);
  const { weddingId: currentWeddingId } = await getCurrentWeddingContext();
  const weddingId = payload.weddingId ?? currentWeddingId;
  await assertWeddingAccess(weddingId);
  if (payload.eventId) {
    const event = await assertEventAccess(payload.eventId);
    if (event.weddingId !== weddingId) throw new Error("Event does not belong to this wedding.");
  }

  const responsibility = await prisma.responsibility.create({
    data: {
      weddingId,
      eventId: payload.eventId,
      title: payload.title,
      assignedName: payload.assignedName,
      assignedEmail: payload.assignedEmail || undefined,
      dueDate: new Date(payload.dueDate),
      status: payload.status ?? "Open",
      notes: payload.notes,
    },
  });

  revalidatePath("/timeline");
  revalidatePath("/run-sheet");
  revalidatePath("/dashboard");
  return responsibility;
}

export async function updateResponsibility(input: {
  responsibilityId: string;
  fields: {
    eventId?: string | null;
    title?: string;
    assignedName?: string | null;
    assignedEmail?: string | null;
    dueDate?: string | Date;
    status?: string;
    notes?: string | null;
  };
}) {
  const payload = z
    .object({
      responsibilityId: z.string(),
      fields: z.object({
        eventId: z.string().nullable().optional(),
        title: z.string().min(2).max(160).optional(),
        assignedName: z.string().max(120).nullable().optional(),
        assignedEmail: z.string().email().nullable().optional().or(z.literal("")),
        dueDate: z.union([z.string(), z.date()]).optional(),
        status: z.string().max(40).optional(),
        notes: z.string().max(1000).nullable().optional(),
      }),
    })
    .parse(input);
  const existing = await assertResponsibilityAccess(payload.responsibilityId);
  if (payload.fields.eventId) {
    const event = await assertEventAccess(payload.fields.eventId);
    if (event.weddingId !== existing.weddingId) throw new Error("Event does not belong to this wedding.");
  }

  const responsibility = await prisma.responsibility.update({
    where: { id: payload.responsibilityId },
    data: {
      eventId: payload.fields.eventId,
      title: payload.fields.title,
      assignedName: payload.fields.assignedName,
      assignedEmail: payload.fields.assignedEmail || undefined,
      dueDate: payload.fields.dueDate === undefined ? undefined : new Date(payload.fields.dueDate),
      status: payload.fields.status,
      notes: payload.fields.notes,
    },
  });

  revalidatePath("/timeline");
  revalidatePath("/run-sheet");
  revalidatePath("/dashboard");
  return responsibility;
}

export async function deleteResponsibility(input: { responsibilityId: string }) {
  const payload = z.object({ responsibilityId: z.string() }).parse(input);
  await assertResponsibilityAccess(payload.responsibilityId);
  await prisma.responsibility.delete({ where: { id: payload.responsibilityId } });

  revalidatePath("/timeline");
  revalidatePath("/run-sheet");
  revalidatePath("/dashboard");
  return { deleted: true };
}

export async function createEventTimelineBlock(input: {
  weddingId?: string;
  eventId: string;
  title: string;
  startsAt: string | Date;
  endsAt?: string | Date;
  location?: string;
  ownerName?: string;
  notes?: string;
  sortOrder?: number;
}) {
  const payload = z
    .object({
      weddingId: z.string().optional(),
      eventId: z.string(),
      title: z.string().min(2).max(160),
      startsAt: z.union([z.string(), z.date()]),
      endsAt: z.union([z.string(), z.date()]).optional(),
      location: z.string().max(160).optional(),
      ownerName: z.string().max(120).optional(),
      notes: z.string().max(1000).optional(),
      sortOrder: z.number().int().optional(),
    })
    .parse(input);
  const event = await assertEventAccess(payload.eventId);
  const { weddingId: currentWeddingId } = await getCurrentWeddingContext();
  const weddingId = payload.weddingId ?? currentWeddingId;
  if (event.weddingId !== weddingId) throw new Error("Event does not belong to this wedding.");

  const block = await prisma.eventTimelineBlock.create({
    data: {
      weddingId,
      eventId: payload.eventId,
      title: payload.title,
      startsAt: new Date(payload.startsAt),
      endsAt: payload.endsAt ? new Date(payload.endsAt) : undefined,
      location: payload.location,
      ownerName: payload.ownerName,
      notes: payload.notes,
      sortOrder: payload.sortOrder ?? 0,
    },
  });

  revalidatePath("/timeline");
  revalidatePath("/run-sheet");
  return block;
}

export async function updateEventTimelineBlock(input: {
  blockId: string;
  fields: {
    eventId?: string;
    title?: string;
    startsAt?: string | Date;
    endsAt?: string | Date | null;
    location?: string | null;
    ownerName?: string | null;
    notes?: string | null;
    sortOrder?: number;
  };
}) {
  const payload = z
    .object({
      blockId: z.string(),
      fields: z.object({
        eventId: z.string().optional(),
        title: z.string().min(2).max(160).optional(),
        startsAt: z.union([z.string(), z.date()]).optional(),
        endsAt: z.union([z.string(), z.date()]).nullable().optional(),
        location: z.string().max(160).nullable().optional(),
        ownerName: z.string().max(120).nullable().optional(),
        notes: z.string().max(1000).nullable().optional(),
        sortOrder: z.number().int().optional(),
      }),
    })
    .parse(input);
  const existing = await prisma.eventTimelineBlock.findUniqueOrThrow({ where: { id: payload.blockId } });
  await assertWeddingAccess(existing.weddingId);
  if (payload.fields.eventId) {
    const event = await assertEventAccess(payload.fields.eventId);
    if (event.weddingId !== existing.weddingId) throw new Error("Event does not belong to this wedding.");
  }

  const block = await prisma.eventTimelineBlock.update({
    where: { id: payload.blockId },
    data: {
      eventId: payload.fields.eventId,
      title: payload.fields.title,
      startsAt: payload.fields.startsAt === undefined ? undefined : new Date(payload.fields.startsAt),
      endsAt: payload.fields.endsAt === undefined ? undefined : payload.fields.endsAt ? new Date(payload.fields.endsAt) : null,
      location: payload.fields.location,
      ownerName: payload.fields.ownerName,
      notes: payload.fields.notes,
      sortOrder: payload.fields.sortOrder,
    },
  });

  revalidatePath("/timeline");
  revalidatePath("/run-sheet");
  return block;
}

export async function deleteEventTimelineBlock(input: { blockId: string }) {
  const payload = z.object({ blockId: z.string() }).parse(input);
  const existing = await prisma.eventTimelineBlock.findUniqueOrThrow({ where: { id: payload.blockId } });
  await assertWeddingAccess(existing.weddingId);
  await prisma.eventTimelineBlock.delete({ where: { id: payload.blockId } });

  revalidatePath("/timeline");
  revalidatePath("/run-sheet");
  return { deleted: true };
}

export async function updateGuest(input: {
  guestId: string;
  fields: {
    name?: string;
    email?: string;
    phone?: string;
    group?: string;
    status?: "ATTENDING" | "DECLINED" | "PENDING";
    plusOne?: boolean;
    additionalGuestCount?: number;
    companionDetails?: string | null;
    mealChoice?: string;
    tableNumber?: number | null;
    notes?: string | null;
  };
}) {
  const payload = z
    .object({
      guestId: z.string(),
      fields: z.object({
        name: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        group: z.string().max(80).optional(),
        status: z.enum(["ATTENDING", "DECLINED", "PENDING"]).optional(),
        plusOne: z.boolean().optional(),
        additionalGuestCount: z.number().int().min(0).max(20).optional(),
        companionDetails: z.string().max(1000).nullable().optional(),
        mealChoice: z.string().optional(),
        tableNumber: z.number().int().nullable().optional(),
        notes: z.string().nullable().optional(),
      }),
    })
    .parse(input);

  const existingGuest = await prisma.guest.findUniqueOrThrow({ where: { id: payload.guestId } });
  await assertWeddingAccess(existingGuest.weddingId);
  const groupName = payload.fields.group?.trim();
  const guestGroupId = groupName
    ? (
        (await prisma.guestGroup.findFirst({
          where: { weddingId: existingGuest.weddingId, name: { equals: groupName, mode: "insensitive" } },
          select: { id: true },
        })) ??
        (await prisma.guestGroup.create({
          data: {
            id: `manual-${existingGuest.weddingId}-${groupName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
            weddingId: existingGuest.weddingId,
            name: groupName,
          },
          select: { id: true },
        }))
      ).id
    : undefined;

  const guest = await prisma.guest.update({
    where: { id: payload.guestId },
    data: {
      name: payload.fields.name,
      email: payload.fields.email,
      phone: payload.fields.phone,
      guestGroup: guestGroupId ? { connect: { id: guestGroupId } } : undefined,
      status: payload.fields.status,
      plusOne: payload.fields.additionalGuestCount === undefined ? payload.fields.plusOne : payload.fields.additionalGuestCount > 0,
      additionalGuestCount: payload.fields.additionalGuestCount,
      companionDetails: payload.fields.companionDetails,
      mealChoice: payload.fields.mealChoice,
      tableNumber: payload.fields.tableNumber,
      notes: payload.fields.notes,
    },
  });

  await syncGuestCompanions(guest.id, payload.fields.companionDetails);

  revalidatePath("/rsvp");
  revalidatePath("/rsvp");

  return guest;
}

export async function createGuest(input: {
  weddingId?: string;
  name: string;
  email?: string;
  phone?: string;
  group?: string;
}) {
  const payload = z
    .object({
      weddingId: z.string().optional(),
      name: z.string().min(2).max(120),
      email: z.string().email().optional().or(z.literal("")),
      phone: z.string().max(40).optional().or(z.literal("")),
      group: z.string().max(80).optional().or(z.literal("")),
    })
    .parse(input);
  const { weddingId: currentWeddingId } = await getCurrentWeddingContext();
  const weddingId = payload.weddingId ?? currentWeddingId;
  await assertWeddingAccess(weddingId);
  const groupName = payload.group?.trim() || "Ungrouped";

  const guest = await prisma.$transaction(async (tx) => {
    const group =
      (await tx.guestGroup.findFirst({
        where: { weddingId, name: { equals: groupName, mode: "insensitive" } },
        select: { id: true },
      })) ??
      (await tx.guestGroup.create({
        data: {
          id: `manual-${weddingId}-${groupName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
          weddingId,
          name: groupName,
        },
        select: { id: true },
      }));

    return tx.guest.create({
      data: {
        weddingId,
        guestGroupId: group.id,
        name: payload.name,
        email: payload.email || undefined,
        phone: payload.phone || undefined,
        status: "PENDING",
        mealChoice: "Pending",
      },
    });
  });

  await prisma.eventRsvp.createMany({
    data: (await ensureDefaultWeddingEvents(weddingId)).map((event) => ({
      guestId: guest.id,
      eventId: event.id,
      status: RSVPStatus.PENDING,
      attendeeCount: 1,
      mealChoice: "Pending",
    })),
    skipDuplicates: true,
  });

  revalidatePath("/rsvp");
  revalidatePath("/dashboard");

  return guest;
}

export async function createGuestGroup(input: { weddingId?: string; name: string }) {
  const payload = z.object({ weddingId: z.string().optional(), name: z.string().min(2).max(80) }).parse(input);
  const { weddingId: currentWeddingId } = await getCurrentWeddingContext();
  const weddingId = payload.weddingId ?? currentWeddingId;
  await assertWeddingAccess(weddingId);
  const normalizedName = payload.name.trim();
  const existingGroups = await prisma.guestGroup.findMany({ where: { weddingId }, select: { name: true } });
  if (existingGroups.some((group) => group.name.trim().toLowerCase() === normalizedName.toLowerCase())) {
    throw new Error("A guest group with this name already exists.");
  }
  const group = await prisma.guestGroup.create({
    data: {
      weddingId,
      name: normalizedName,
    },
  });

  revalidatePath("/rsvp");
  return group;
}

export async function updateGuestGroup(input: { guestGroupId: string; name: string }) {
  const payload = z.object({ guestGroupId: z.string(), name: z.string().min(2).max(80) }).parse(input);
  const existing = await prisma.guestGroup.findUniqueOrThrow({ where: { id: payload.guestGroupId } });
  await assertWeddingAccess(existing.weddingId);
  const normalizedName = payload.name.trim();
  const existingGroups = await prisma.guestGroup.findMany({ where: { weddingId: existing.weddingId }, select: { id: true, name: true } });
  if (existingGroups.some((group) => group.id !== existing.id && group.name.trim().toLowerCase() === normalizedName.toLowerCase())) {
    throw new Error("A guest group with this name already exists.");
  }
  const group = await prisma.guestGroup.update({
    where: { id: payload.guestGroupId },
    data: { name: normalizedName },
  });

  revalidatePath("/rsvp");
  return group;
}

export async function deleteGuestGroup(input: { guestGroupId: string }) {
  const payload = z.object({ guestGroupId: z.string() }).parse(input);
  const existing = await prisma.guestGroup.findUniqueOrThrow({ where: { id: payload.guestGroupId } });
  await assertWeddingAccess(existing.weddingId);
  await prisma.$transaction([
    prisma.guest.updateMany({
      where: { guestGroupId: payload.guestGroupId },
      data: { guestGroupId: null },
    }),
    prisma.guestGroup.delete({ where: { id: payload.guestGroupId } }),
  ]);

  revalidatePath("/rsvp");
  return { deleted: true };
}

export async function deleteGuest(input: { guestId: string }) {
  const payload = z.object({ guestId: z.string() }).parse(input);
  const existing = await prisma.guest.findUniqueOrThrow({ where: { id: payload.guestId } });
  await assertWeddingAccess(existing.weddingId);
  await prisma.guest.delete({ where: { id: payload.guestId } });

  revalidatePath("/rsvp");
  revalidatePath("/dashboard");
  return { deleted: true };
}

export async function updateBudgetItem(input: {
  budgetItemId: string;
  fields: {
    categoryId?: string;
    label?: string;
    amount?: number;
    paid?: number;
    dueDate?: string | Date;
    status?: string;
    vendorBusinessId?: string | null;
    eventId?: string | null;
  };
}) {
  const payload = z
    .object({
      budgetItemId: z.string(),
      fields: z.object({
        categoryId: z.string().optional(),
        label: z.string().min(1).max(160).optional(),
        amount: z.number().nonnegative().optional(),
        paid: z.number().nonnegative().optional(),
        dueDate: z.union([z.string(), z.date()]).optional(),
        status: z.string().optional(),
        vendorBusinessId: z.string().nullable().optional(),
        eventId: z.string().nullable().optional(),
      }),
    })
    .parse(input);
  const existing = await prisma.budgetItem.findUniqueOrThrow({ where: { id: payload.budgetItemId } });
  await assertWeddingAccess(existing.weddingId);
  if (payload.fields.eventId) {
    const event = await assertEventAccess(payload.fields.eventId);
    if (event.weddingId !== existing.weddingId) throw new Error("Event does not belong to this wedding.");
  }
  const status = payload.fields.status ? moneyStatusMap[payload.fields.status] : undefined;
  if (payload.fields.status && !status) throw new Error(`Unsupported money status: ${payload.fields.status}`);

  const budgetItem = await prisma.budgetItem.update({
    where: { id: payload.budgetItemId },
    data: {
      categoryId: payload.fields.categoryId,
      label: payload.fields.label,
      amountCents: payload.fields.amount === undefined ? undefined : moneyToCents(payload.fields.amount),
      paidCents: payload.fields.paid === undefined ? undefined : moneyToCents(payload.fields.paid),
      dueDate: payload.fields.dueDate === undefined ? undefined : new Date(payload.fields.dueDate),
      status,
      vendorBusinessId: payload.fields.vendorBusinessId,
      eventId: payload.fields.eventId,
    },
  });

  revalidatePath("/budget");
  revalidatePath("/dashboard");
  return budgetItem;
}

export async function deleteBudgetItem(input: { budgetItemId: string }) {
  const payload = z.object({ budgetItemId: z.string() }).parse(input);
  const existing = await prisma.budgetItem.findUniqueOrThrow({ where: { id: payload.budgetItemId } });
  await assertWeddingAccess(existing.weddingId);
  await prisma.budgetItem.delete({ where: { id: payload.budgetItemId } });

  revalidatePath("/budget");
  revalidatePath("/dashboard");
  return { deleted: true };
}

export async function createPaymentScheduleItem(input: {
  bookingId?: string;
  budgetItemId?: string;
  label: string;
  amount: number;
  dueDate: string | Date;
  status?: string;
}) {
  const payload = z
    .object({
      bookingId: z.string().optional(),
      budgetItemId: z.string().optional(),
      label: z.string().min(1).max(120),
      amount: z.number().nonnegative(),
      dueDate: z.union([z.string(), z.date()]),
      status: z.string().optional(),
    })
    .parse(input);
  if (!payload.bookingId && !payload.budgetItemId) throw new Error("Payment schedule item requires a booking or budget item.");
  if (payload.bookingId) await assertBookingAccess(payload.bookingId);
  if (payload.budgetItemId) {
    const budgetItem = await prisma.budgetItem.findUniqueOrThrow({ where: { id: payload.budgetItemId } });
    await assertWeddingAccess(budgetItem.weddingId);
  }
  const status = payload.status ? moneyStatusMap[payload.status] : MoneyStatus.PLANNED;
  if (!status) throw new Error(`Unsupported money status: ${payload.status}`);
  const item = await prisma.paymentScheduleItem.create({
    data: {
      bookingId: payload.bookingId,
      budgetItemId: payload.budgetItemId,
      label: payload.label,
      amountCents: moneyToCents(payload.amount),
      dueDate: new Date(payload.dueDate),
      status,
    },
  });

  revalidatePath("/vendor/clients");
  revalidatePath("/budget");
  return item;
}

export async function updatePaymentScheduleItem(input: {
  paymentScheduleItemId: string;
  fields: { label?: string; amount?: number; dueDate?: string | Date; status?: string };
}) {
  const payload = z
    .object({
      paymentScheduleItemId: z.string(),
      fields: z.object({
        label: z.string().min(1).max(120).optional(),
        amount: z.number().nonnegative().optional(),
        dueDate: z.union([z.string(), z.date()]).optional(),
        status: z.string().optional(),
      }),
    })
    .parse(input);
  const existing = await prisma.paymentScheduleItem.findUniqueOrThrow({
    where: { id: payload.paymentScheduleItemId },
  });
  if (existing.bookingId) {
    await assertBookingAccess(existing.bookingId);
  } else if (existing.budgetItemId) {
    const budgetItem = await prisma.budgetItem.findUniqueOrThrow({ where: { id: existing.budgetItemId } });
    await assertWeddingAccess(budgetItem.weddingId);
  } else {
    throw new Error("Payment schedule item is not attached to an accessible record.");
  }
  const status = payload.fields.status ? moneyStatusMap[payload.fields.status] : undefined;
  if (payload.fields.status && !status) throw new Error(`Unsupported money status: ${payload.fields.status}`);
  const item = await prisma.paymentScheduleItem.update({
    where: { id: payload.paymentScheduleItemId },
    data: {
      label: payload.fields.label,
      amountCents: payload.fields.amount === undefined ? undefined : moneyToCents(payload.fields.amount),
      dueDate: payload.fields.dueDate === undefined ? undefined : new Date(payload.fields.dueDate),
      status,
    },
  });

  revalidatePath("/vendor/clients");
  revalidatePath("/budget");
  return item;
}

export async function deletePaymentScheduleItem(input: { paymentScheduleItemId: string }) {
  const payload = z.object({ paymentScheduleItemId: z.string() }).parse(input);
  const existing = await prisma.paymentScheduleItem.findUniqueOrThrow({
    where: { id: payload.paymentScheduleItemId },
  });
  if (existing.bookingId) {
    await assertBookingAccess(existing.bookingId);
  } else if (existing.budgetItemId) {
    const budgetItem = await prisma.budgetItem.findUniqueOrThrow({ where: { id: existing.budgetItemId } });
    await assertWeddingAccess(budgetItem.weddingId);
  } else {
    throw new Error("Payment schedule item is not attached to an accessible record.");
  }
  await prisma.paymentScheduleItem.delete({ where: { id: payload.paymentScheduleItemId } });

  revalidatePath("/vendor/clients");
  revalidatePath("/budget");
  return { deleted: true };
}

export async function createPaymentReminder(input: { paymentScheduleItemId: string; reminderDaysBefore: number }) {
  const payload = z
    .object({
      paymentScheduleItemId: z.string(),
      reminderDaysBefore: z.number().int().min(0).max(365),
    })
    .parse(input);
  const existing = await prisma.paymentScheduleItem.findUniqueOrThrow({ where: { id: payload.paymentScheduleItemId } });
  if (existing.bookingId) {
    await assertBookingAccess(existing.bookingId);
  } else if (existing.budgetItemId) {
    const budgetItem = await prisma.budgetItem.findUniqueOrThrow({ where: { id: existing.budgetItemId } });
    await assertWeddingAccess(budgetItem.weddingId);
  }
  const reminder = await prisma.paymentScheduleItem.update({
    where: { id: payload.paymentScheduleItemId },
    data: { reminderDaysBefore: payload.reminderDaysBefore, reminderDismissedAt: null },
  });

  revalidatePath("/budget");
  revalidatePath("/dashboard");
  revalidatePath("/run-sheet");
  return reminder;
}

export async function dismissPaymentReminder(input: { paymentScheduleItemId: string }) {
  const payload = z.object({ paymentScheduleItemId: z.string() }).parse(input);
  const existing = await prisma.paymentScheduleItem.findUniqueOrThrow({ where: { id: payload.paymentScheduleItemId } });
  if (existing.bookingId) {
    await assertBookingAccess(existing.bookingId);
  } else if (existing.budgetItemId) {
    const budgetItem = await prisma.budgetItem.findUniqueOrThrow({ where: { id: existing.budgetItemId } });
    await assertWeddingAccess(budgetItem.weddingId);
  }
  const reminder = await prisma.paymentScheduleItem.update({
    where: { id: payload.paymentScheduleItemId },
    data: { reminderDismissedAt: new Date() },
  });

  revalidatePath("/budget");
  revalidatePath("/dashboard");
  revalidatePath("/run-sheet");
  return reminder;
}

export async function createSeatingTable(input: {
  weddingId?: string;
  eventId?: string;
  name: string;
  capacity: number;
  sortOrder?: number;
}) {
  const payload = z
    .object({
      weddingId: z.string().optional(),
      eventId: z.string().optional(),
      name: z.string().min(1).max(80),
      capacity: z.number().int().min(1).max(100),
      sortOrder: z.number().int().optional(),
    })
    .parse(input);
  const { weddingId: currentWeddingId } = await getCurrentWeddingContext();
  const weddingId = payload.weddingId ?? currentWeddingId;
  await assertWeddingAccess(weddingId);
  if (payload.eventId) {
    const event = await assertEventAccess(payload.eventId);
    if (event.weddingId !== weddingId) throw new Error("Event does not belong to this wedding.");
  }
  const table = await prisma.seatingTable.create({
    data: {
      weddingId,
      eventId: payload.eventId,
      name: payload.name,
      capacity: payload.capacity,
      sortOrder: payload.sortOrder ?? 0,
    },
  });

  revalidatePath("/rsvp");
  revalidatePath("/rsvp");
  return table;
}

export async function updateSeatingTable(input: {
  tableId: string;
  fields: { eventId?: string | null; name?: string; capacity?: number; sortOrder?: number };
}) {
  const payload = z
    .object({
      tableId: z.string(),
      fields: z.object({
        eventId: z.string().nullable().optional(),
        name: z.string().min(1).max(80).optional(),
        capacity: z.number().int().min(1).max(100).optional(),
        sortOrder: z.number().int().optional(),
      }),
    })
    .parse(input);
  const existing = await assertSeatingTableAccess(payload.tableId);
  if (payload.fields.eventId) {
    const event = await assertEventAccess(payload.fields.eventId);
    if (event.weddingId !== existing.weddingId) throw new Error("Event does not belong to this wedding.");
  }
  const table = await prisma.seatingTable.update({
    where: { id: payload.tableId },
    data: payload.fields,
  });

  revalidatePath("/rsvp");
  revalidatePath("/rsvp");
  return table;
}

export async function deleteSeatingTable(input: { tableId: string }) {
  const payload = z.object({ tableId: z.string() }).parse(input);
  await assertSeatingTableAccess(payload.tableId);
  await prisma.seatingTable.delete({ where: { id: payload.tableId } });

  revalidatePath("/rsvp");
  revalidatePath("/rsvp");
  return { deleted: true };
}

export async function assignGuestToTable(input: {
  tableId: string;
  guestId?: string;
  companionId?: string;
  seatLabel?: string;
}) {
  const payload = z
    .object({
      tableId: z.string(),
      guestId: z.string().optional(),
      companionId: z.string().optional(),
      seatLabel: z.string().max(40).optional(),
    })
    .parse(input);
  if (!payload.guestId && !payload.companionId) throw new Error("Select a guest or additional guest to assign.");
  const table = await assertSeatingTableAccess(payload.tableId);
  if (payload.guestId) {
    const guest = await assertGuestAccess(payload.guestId);
    if (guest.weddingId !== table.weddingId) throw new Error("Guest does not belong to this wedding.");
  }
  if (payload.companionId) {
    const companion = await prisma.guestCompanion.findUniqueOrThrow({ where: { id: payload.companionId }, include: { guest: true } });
    await assertWeddingAccess(companion.guest.weddingId);
    if (companion.guest.weddingId !== table.weddingId) throw new Error("Additional guest does not belong to this wedding.");
  }
  const assignment = await prisma.seatingAssignment.create({
    data: {
      tableId: payload.tableId,
      guestId: payload.guestId,
      companionId: payload.companionId,
      seatLabel: payload.seatLabel,
    },
  });

  if (payload.guestId) {
    const numericTable = Number(table.name.replace(/[^0-9]/g, ""));
    if (Number.isFinite(numericTable) && numericTable > 0) {
      await prisma.guest.update({ where: { id: payload.guestId }, data: { tableNumber: numericTable } });
    }
  }

  revalidatePath("/rsvp");
  revalidatePath("/rsvp");
  return assignment;
}

export async function removeGuestFromTable(input: { assignmentId: string }) {
  const payload = z.object({ assignmentId: z.string() }).parse(input);
  const assignment = await prisma.seatingAssignment.findUniqueOrThrow({
    where: { id: payload.assignmentId },
    include: { table: true },
  });
  await assertWeddingAccess(assignment.table.weddingId);
  await prisma.seatingAssignment.delete({ where: { id: payload.assignmentId } });

  revalidatePath("/rsvp");
  revalidatePath("/rsvp");
  return { deleted: true };
}

export async function completeTask(input: { taskId: string; completed: boolean }) {
  const payload = z.object({ taskId: z.string(), completed: z.boolean() }).parse(input);

  const existingTask = await prisma.timelineTask.findUniqueOrThrow({ where: { id: payload.taskId } });
  await assertWeddingAccess(existingTask.weddingId);

  const task = await prisma.timelineTask.update({
    where: { id: payload.taskId },
    data: { completed: payload.completed },
  });

  revalidatePath("/timeline");
  revalidatePath("/dashboard");

  return task;
}

export async function createTimelineTask(input: {
  weddingId?: string;
  eventId?: string;
  categoryId?: string;
  title: string;
  group: string;
  dueDate: string | Date;
  priority?: string;
  relatedVendorId?: string;
}) {
  const payload = z
    .object({
      weddingId: z.string().optional(),
      eventId: z.string().optional(),
      categoryId: z.string().optional(),
      title: z.string().min(1).max(160),
      group: z.string().min(1).max(80),
      dueDate: z.union([z.string(), z.date()]),
      priority: z.string().max(40).optional(),
      relatedVendorId: z.string().optional(),
    })
    .parse(input);
  const { weddingId: currentWeddingId } = await getCurrentWeddingContext();
  const weddingId = payload.weddingId ?? currentWeddingId;
  await assertWeddingAccess(weddingId);
  if (payload.eventId) {
    const event = await assertEventAccess(payload.eventId);
    if (event.weddingId !== weddingId) throw new Error("Event does not belong to this wedding.");
  }
  const task = await prisma.timelineTask.create({
    data: {
      weddingId,
      eventId: payload.eventId,
      categoryId: payload.categoryId,
      title: payload.title,
      group: payload.group,
      dueDate: new Date(payload.dueDate),
      priority: payload.priority ?? "Medium",
      relatedVendorId: payload.relatedVendorId,
    },
  });

  revalidatePath("/timeline");
  revalidatePath("/dashboard");
  return task;
}

export async function completeCoupleOnboarding(input: {
  coupleNames: string;
  weddingDate: string | Date;
  location: string;
  style: string;
  budget: number;
  guestCount: number;
  venueName?: string;
  venueStatus?: string;
  ceremonyDate?: string | Date;
  receptionDate?: string | Date;
  eventTypes?: string[];
  vendorCategoryIds: string[];
  priorities: string[];
  settings: {
    culturalEvents?: boolean;
    familyCollaborators?: boolean;
    publicRsvp?: boolean;
    vendorPitches?: boolean;
  };
}) {
  const payload = z
    .object({
      coupleNames: z.string().min(2).max(120),
      weddingDate: z.union([z.string(), z.date()]),
      location: z.string().min(2).max(120),
      style: z.string().min(2).max(160),
      budget: z.number().nonnegative(),
      guestCount: z.number().int().nonnegative(),
      venueName: z.string().max(160).optional(),
      venueStatus: z.string().max(80).optional(),
      ceremonyDate: z.union([z.string(), z.date()]).optional(),
      receptionDate: z.union([z.string(), z.date()]).optional(),
      eventTypes: z.array(z.string()).optional(),
      vendorCategoryIds: z.array(z.string()).max(20),
      priorities: z.array(z.string()).max(12),
      settings: z.object({
        culturalEvents: z.boolean().optional(),
        familyCollaborators: z.boolean().optional(),
        publicRsvp: z.boolean().optional(),
        vendorPitches: z.boolean().optional(),
      }),
    })
    .parse(input);
  const { weddingId } = await getCurrentWeddingContext();

  const weddingDate = new Date(payload.weddingDate);
  const ceremonyDate = payload.ceremonyDate ? new Date(payload.ceremonyDate) : weddingDate;
  const receptionDate = payload.receptionDate ? new Date(payload.receptionDate) : weddingDate;

  await prisma.$transaction(async (tx) => {
    const wedding = await tx.wedding.update({
      where: { id: weddingId },
      data: {
        coupleNames: payload.coupleNames,
        date: weddingDate,
        location: payload.location,
        style: payload.style,
        budgetCents: moneyToCents(payload.budget),
        guestCount: payload.guestCount,
      },
    });

    const planningCategory =
      (await tx.category.findFirst({
        where: {
          type: CategoryType.TASK,
          archivedAt: null,
          OR: [
            { scope: CategoryScope.WEDDING, ownerWeddingId: weddingId, name: { equals: "Planning", mode: "insensitive" } },
            { scope: CategoryScope.GLOBAL, name: { equals: "Planning", mode: "insensitive" } },
          ],
        },
      })) ??
      (await tx.category.create({
        data: {
          name: "Planning",
          slug: `setup-planning-${weddingId}`,
          type: CategoryType.TASK,
          scope: CategoryScope.WEDDING,
          ownerWeddingId: weddingId,
          color: "#c8a97e",
          icon: "ListChecks",
        },
      }));

    await tx.timelineTask.deleteMany({
      where: {
        weddingId,
        title: { startsWith: "Setup:" },
      },
    });

    const taskRows = [
      {
        title: "Setup: Confirm wedding details",
        group: "Onboarding",
        dueDate: new Date(),
        priority: "High",
      },
      {
        title: `Setup: Venue ${payload.venueName ? `- ${payload.venueName}` : "shortlist"}`,
        group: "Venue",
        dueDate: ceremonyDate,
        priority: payload.venueStatus === "Booked" ? "Medium" : "High",
      },
      {
        title: "Setup: Build vendor shortlist",
        group: "Vendors",
        dueDate: new Date(),
        priority: "High",
      },
      {
        title: "Setup: Confirm guest list structure",
        group: "Guests",
        dueDate: new Date(),
        priority: "Medium",
      },
      ...payload.priorities.map((priority) => ({
        title: `Setup: ${priority}`,
        group: "Priorities",
        dueDate: new Date(),
        priority: "Medium",
      })),
      ...(payload.settings.publicRsvp
        ? [
            {
              title: "Setup: Prepare public RSVP link",
              group: "Guests",
              dueDate: new Date(),
              priority: "Medium",
            },
          ]
        : []),
      ...(payload.settings.familyCollaborators
        ? [
            {
              title: "Setup: Invite family collaborators",
              group: "Planning",
              dueDate: new Date(),
              priority: "Low",
            },
          ]
        : []),
      ...(payload.settings.culturalEvents
        ? [
            {
              title: "Setup: Add cultural event schedule",
              group: "Timeline",
              dueDate: receptionDate,
              priority: "Medium",
            },
          ]
        : []),
    ];

    await tx.timelineTask.createMany({
      data: taskRows.map((task) => ({
        weddingId,
        categoryId: planningCategory.id,
        ...task,
      })),
    });

    await tx.vendorOpportunity.deleteMany({
      where: {
        weddingId,
        title: { startsWith: "Setup need:" },
      },
    });

    if (payload.vendorCategoryIds.length) {
      const vendorCategories = await tx.category.findMany({
        where: {
          id: { in: payload.vendorCategoryIds },
          type: CategoryType.VENDOR_SERVICE,
          archivedAt: null,
        },
      });

      await tx.vendorOpportunity.createMany({
        data: vendorCategories.map((category) => ({
          weddingId,
          categoryId: category.id,
          title: `Setup need: ${category.name}`,
          description: `Looking for ${category.name.toLowerCase()} vendors for ${wedding.coupleNames}'s ${wedding.style} wedding in ${wedding.location}. Venue status: ${payload.venueStatus || "Not set"}.`,
          budgetCents: moneyToCents(Math.max(payload.budget * 0.1, 0)),
          location: wedding.location,
          date: wedding.date,
          guestCount: wedding.guestCount,
        })),
      });

      const eventRows = await tx.weddingEvent.findMany({ where: { weddingId } });
      const targetEvent =
        eventRows.find((event) => event.type === "CEREMONY") ??
        eventRows.find((event) => event.type === "RECEPTION") ??
        null;

      for (const category of vendorCategories) {
        const existingNeed = await tx.eventVendorNeed.findFirst({ where: { weddingId, categoryId: category.id } });
        if (!existingNeed) {
          await tx.eventVendorNeed.create({
            data: {
              weddingId,
              eventId: targetEvent?.id,
              categoryId: category.id,
              title: `Setup need: ${category.name}`,
              budgetCents: moneyToCents(Math.max(payload.budget * 0.1, 0)),
              status: "Needed",
              notes: "Created during workspace setup.",
            },
          });
        }
      }
    }
  });

  const eventRows = await ensureDefaultWeddingEvents(weddingId);
  await prisma.$transaction(
    eventRows.map((event) => {
      const template = tamilEventTemplate.find((item) => item.type === event.type);
      const eventDate =
        event.type === "CEREMONY"
          ? ceremonyDate
          : event.type === "RECEPTION"
            ? receptionDate
            : template
              ? offsetDate(weddingDate, template.offsetDays)
              : event.date;

      return prisma.weddingEvent.update({
        where: { id: event.id },
        data: {
          date: eventDate,
          location: payload.location,
          venueName: payload.venueName || undefined,
        },
      });
    }),
  );

  revalidatePath("/dashboard");
  revalidatePath("/timeline");
  revalidatePath("/opportunities");
  revalidatePath("/planner");
  revalidatePath("/budget");

  return { completed: true };
}

export async function updateTimelineTask(input: {
  taskId: string;
  fields: {
    eventId?: string | null;
    categoryId?: string | null;
    title?: string;
    group?: string;
    dueDate?: string | Date;
    priority?: string;
    relatedVendorId?: string | null;
    completed?: boolean;
  };
}) {
  const payload = z
    .object({
      taskId: z.string(),
      fields: z.object({
        eventId: z.string().nullable().optional(),
        categoryId: z.string().nullable().optional(),
        title: z.string().min(1).max(160).optional(),
        group: z.string().min(1).max(80).optional(),
        dueDate: z.union([z.string(), z.date()]).optional(),
        priority: z.string().max(40).optional(),
        relatedVendorId: z.string().nullable().optional(),
        completed: z.boolean().optional(),
      }),
    })
    .parse(input);
  const existing = await prisma.timelineTask.findUniqueOrThrow({ where: { id: payload.taskId } });
  await assertWeddingAccess(existing.weddingId);
  if (payload.fields.eventId) {
    const event = await assertEventAccess(payload.fields.eventId);
    if (event.weddingId !== existing.weddingId) throw new Error("Event does not belong to this wedding.");
  }
  const task = await prisma.timelineTask.update({
    where: { id: payload.taskId },
    data: {
      eventId: payload.fields.eventId,
      categoryId: payload.fields.categoryId,
      title: payload.fields.title,
      group: payload.fields.group,
      dueDate: payload.fields.dueDate === undefined ? undefined : new Date(payload.fields.dueDate),
      priority: payload.fields.priority,
      relatedVendorId: payload.fields.relatedVendorId,
      completed: payload.fields.completed,
    },
  });

  revalidatePath("/timeline");
  revalidatePath("/dashboard");
  return task;
}

export async function deleteTimelineTask(input: { taskId: string }) {
  const payload = z.object({ taskId: z.string() }).parse(input);
  const existing = await prisma.timelineTask.findUniqueOrThrow({ where: { id: payload.taskId } });
  await assertWeddingAccess(existing.weddingId);
  await prisma.timelineTask.delete({ where: { id: payload.taskId } });

  revalidatePath("/timeline");
  revalidatePath("/dashboard");
  return { deleted: true };
}

export async function generatePlannerSnapshot(input: { weddingId?: string }) {
  const payload = z.object({ weddingId: z.string().optional() }).parse(input);
  const { weddingId: currentWeddingId } = await getCurrentWeddingContext();
  const weddingId = payload.weddingId ?? currentWeddingId;
  await assertWeddingAccess(weddingId);

  const wedding = await prisma.wedding.findUniqueOrThrow({
    where: { id: weddingId },
    include: {
      budgetItems: { include: { category: true } },
      tasks: true,
      savedVendors: { include: { vendorBusiness: true } },
    },
  });

  const spentCents = wedding.budgetItems.reduce((sum, item) => sum + item.amountCents, 0);
  const openTasks = wedding.tasks.filter((task) => !task.completed).slice(0, 4);

  const snapshot = await prisma.plannerSnapshot.create({
    data: {
      weddingId,
      prompt: `Plan a ${wedding.style} wedding in ${wedding.location} for ${wedding.guestCount} guests under ${wedding.budgetCents / 100}.`,
      result: {
        budget: {
          targetCents: wedding.budgetCents,
          committedCents: spentCents,
          projectedRemainingCents: wedding.budgetCents - spentCents,
        },
        recommendedVendors: wedding.savedVendors.map((item) => item.vendorBusiness.slug),
        timelineSuggestions: openTasks.map((task) => `Complete next: ${task.title}`),
        insights: [
          "Prioritize vendors with date-sensitive availability.",
          "Use custom categories for cultural events, family logistics, or non-standard vendor needs.",
        ],
        riskFlags: openTasks.length ? ["Open timeline tasks could affect vendor coordination."] : [],
      },
    },
  });

  revalidatePath("/planner");

  return snapshot;
}

export async function updateVendorBusiness(input: {
  vendorBusinessId: string;
  fields: {
    name?: string;
    location?: string;
    startingPrice?: number;
    image?: string | null;
    gallery?: string[];
    styleTags?: string[];
    availability?: string;
    responseTime?: string;
    socials?: string[];
    about?: string;
  };
}) {
  const payload = z
    .object({
      vendorBusinessId: z.string(),
      fields: z.object({
        name: z.string().min(2).max(120).optional(),
        location: z.string().min(2).max(120).optional(),
        startingPrice: z.number().nonnegative().optional(),
        image: z.string().url().nullable().optional(),
        gallery: z.array(z.string().url()).optional(),
        styleTags: z.array(z.string().min(1).max(40)).optional(),
        availability: z.string().max(80).optional(),
        responseTime: z.string().max(80).optional(),
        socials: z.array(z.string().min(1).max(120)).optional(),
        about: z.string().min(1).max(4000).optional(),
      }),
    })
    .parse(input);
  await assertVendorAccess(payload.vendorBusinessId);
  const vendor = await prisma.vendorBusiness.update({
    where: { id: payload.vendorBusinessId },
    data: {
      name: payload.fields.name,
      location: payload.fields.location,
      startingPriceCents: payload.fields.startingPrice === undefined ? undefined : moneyToCents(payload.fields.startingPrice),
      image: payload.fields.image,
      gallery: payload.fields.gallery,
      styleTags: payload.fields.styleTags,
      availability: payload.fields.availability,
      responseTime: payload.fields.responseTime,
      socials: payload.fields.socials,
      about: payload.fields.about,
    },
  });

  revalidatePath("/vendor/dashboard");
  revalidatePath("/marketplace");
  revalidatePath(`/marketplace/${vendor.slug}`);
  return vendor;
}

export async function createVendorService(input: {
  vendorBusinessId: string;
  categoryId: string;
  name: string;
  description: string;
  startingPrice: number;
  includes: string[];
}) {
  const payload = z
    .object({
      vendorBusinessId: z.string(),
      categoryId: z.string(),
      name: z.string().min(2).max(120),
      description: z.string().min(1).max(2000),
      startingPrice: z.number().nonnegative(),
      includes: z.array(z.string().min(1).max(160)).default([]),
    })
    .parse(input);
  await assertVendorAccess(payload.vendorBusinessId);
  const service = await prisma.vendorService.create({
    data: {
      vendorBusinessId: payload.vendorBusinessId,
      categoryId: payload.categoryId,
      name: payload.name,
      description: payload.description,
      startingPriceCents: moneyToCents(payload.startingPrice),
      includes: payload.includes,
    },
  });

  revalidatePath("/vendor/dashboard");
  revalidatePath("/marketplace");
  return service;
}

export async function updateVendorService(input: {
  serviceId: string;
  fields: {
    categoryId?: string;
    name?: string;
    description?: string;
    startingPrice?: number;
    includes?: string[];
  };
}) {
  const payload = z
    .object({
      serviceId: z.string(),
      fields: z.object({
        categoryId: z.string().optional(),
        name: z.string().min(2).max(120).optional(),
        description: z.string().min(1).max(2000).optional(),
        startingPrice: z.number().nonnegative().optional(),
        includes: z.array(z.string().min(1).max(160)).optional(),
      }),
    })
    .parse(input);
  const existing = await prisma.vendorService.findUniqueOrThrow({ where: { id: payload.serviceId } });
  await assertVendorAccess(existing.vendorBusinessId);
  const service = await prisma.vendorService.update({
    where: { id: payload.serviceId },
    data: {
      categoryId: payload.fields.categoryId,
      name: payload.fields.name,
      description: payload.fields.description,
      startingPriceCents: payload.fields.startingPrice === undefined ? undefined : moneyToCents(payload.fields.startingPrice),
      includes: payload.fields.includes,
    },
  });

  revalidatePath("/vendor/dashboard");
  revalidatePath("/marketplace");
  return service;
}

export async function deleteVendorService(input: { serviceId: string }) {
  const payload = z.object({ serviceId: z.string() }).parse(input);
  const existing = await prisma.vendorService.findUniqueOrThrow({
    where: { id: payload.serviceId },
    include: { _count: { select: { inquiries: true, bookings: true } } },
  });
  await assertVendorAccess(existing.vendorBusinessId);
  if (existing._count.inquiries || existing._count.bookings) {
    throw new Error("Services linked to inquiries or bookings cannot be deleted.");
  }
  await prisma.vendorService.delete({ where: { id: payload.serviceId } });

  revalidatePath("/vendor/dashboard");
  revalidatePath("/marketplace");
  return { deleted: true };
}

export async function createPortfolioItem(input: { vendorBusinessId: string; title: string; image: string; sortOrder?: number }) {
  const payload = z
    .object({
      vendorBusinessId: z.string(),
      title: z.string().min(1).max(160),
      image: z.string().url(),
      sortOrder: z.number().int().optional(),
    })
    .parse(input);
  await assertVendorAccess(payload.vendorBusinessId);
  const item = await prisma.portfolioItem.create({ data: payload });
  revalidatePath("/vendor/dashboard");
  revalidatePath("/marketplace");
  return item;
}

export async function updatePortfolioItem(input: { portfolioItemId: string; fields: { title?: string; image?: string; sortOrder?: number } }) {
  const payload = z
    .object({
      portfolioItemId: z.string(),
      fields: z.object({
        title: z.string().min(1).max(160).optional(),
        image: z.string().url().optional(),
        sortOrder: z.number().int().optional(),
      }),
    })
    .parse(input);
  const existing = await prisma.portfolioItem.findUniqueOrThrow({ where: { id: payload.portfolioItemId } });
  await assertVendorAccess(existing.vendorBusinessId);
  const item = await prisma.portfolioItem.update({ where: { id: existing.id }, data: payload.fields });
  revalidatePath("/vendor/dashboard");
  revalidatePath("/marketplace");
  return item;
}

export async function deletePortfolioItem(input: { portfolioItemId: string }) {
  const payload = z.object({ portfolioItemId: z.string() }).parse(input);
  const existing = await prisma.portfolioItem.findUniqueOrThrow({ where: { id: payload.portfolioItemId } });
  await assertVendorAccess(existing.vendorBusinessId);
  await prisma.portfolioItem.delete({ where: { id: existing.id } });
  revalidatePath("/vendor/dashboard");
  revalidatePath("/marketplace");
  return { deleted: true };
}

export async function createPastWedding(input: { vendorBusinessId: string; coupleNames: string; venue: string; style: string; image: string }) {
  const payload = z
    .object({
      vendorBusinessId: z.string(),
      coupleNames: z.string().min(1).max(160),
      venue: z.string().min(1).max(160),
      style: z.string().min(1).max(160),
      image: z.string().url(),
    })
    .parse(input);
  await assertVendorAccess(payload.vendorBusinessId);
  const item = await prisma.pastWedding.create({ data: payload });
  revalidatePath("/vendor/dashboard");
  revalidatePath("/marketplace");
  return item;
}

export async function updatePastWedding(input: { pastWeddingId: string; fields: { coupleNames?: string; venue?: string; style?: string; image?: string } }) {
  const payload = z
    .object({
      pastWeddingId: z.string(),
      fields: z.object({
        coupleNames: z.string().min(1).max(160).optional(),
        venue: z.string().min(1).max(160).optional(),
        style: z.string().min(1).max(160).optional(),
        image: z.string().url().optional(),
      }),
    })
    .parse(input);
  const existing = await prisma.pastWedding.findUniqueOrThrow({ where: { id: payload.pastWeddingId } });
  await assertVendorAccess(existing.vendorBusinessId);
  const item = await prisma.pastWedding.update({ where: { id: existing.id }, data: payload.fields });
  revalidatePath("/vendor/dashboard");
  revalidatePath("/marketplace");
  return item;
}

export async function deletePastWedding(input: { pastWeddingId: string }) {
  const payload = z.object({ pastWeddingId: z.string() }).parse(input);
  const existing = await prisma.pastWedding.findUniqueOrThrow({ where: { id: payload.pastWeddingId } });
  await assertVendorAccess(existing.vendorBusinessId);
  await prisma.pastWedding.delete({ where: { id: existing.id } });
  revalidatePath("/vendor/dashboard");
  revalidatePath("/marketplace");
  return { deleted: true };
}

export async function createReviewRecord(input: { vendorBusinessId: string; author: string; rating: number; body: string }) {
  const payload = z
    .object({
      vendorBusinessId: z.string(),
      author: z.string().min(1).max(120),
      rating: z.number().int().min(1).max(5),
      body: z.string().min(1).max(2000),
    })
    .parse(input);
  await assertVendorAccess(payload.vendorBusinessId);
  const review = await prisma.review.create({ data: payload });
  await prisma.vendorBusiness.update({
    where: { id: payload.vendorBusinessId },
    data: {
      reviewsCount: { increment: 1 },
    },
  });
  revalidatePath("/vendor/dashboard");
  revalidatePath("/marketplace");
  return review;
}

export async function updateReviewRecord(input: { reviewId: string; fields: { author?: string; rating?: number; body?: string } }) {
  const payload = z
    .object({
      reviewId: z.string(),
      fields: z.object({
        author: z.string().min(1).max(120).optional(),
        rating: z.number().int().min(1).max(5).optional(),
        body: z.string().min(1).max(2000).optional(),
      }),
    })
    .parse(input);
  const existing = await prisma.review.findUniqueOrThrow({ where: { id: payload.reviewId } });
  await assertVendorAccess(existing.vendorBusinessId);
  const review = await prisma.review.update({ where: { id: existing.id }, data: payload.fields });
  revalidatePath("/vendor/dashboard");
  revalidatePath("/marketplace");
  return review;
}

export async function deleteReviewRecord(input: { reviewId: string }) {
  const payload = z.object({ reviewId: z.string() }).parse(input);
  const existing = await prisma.review.findUniqueOrThrow({ where: { id: payload.reviewId } });
  await assertVendorAccess(existing.vendorBusinessId);
  await prisma.review.delete({ where: { id: existing.id } });
  await prisma.vendorBusiness.update({
    where: { id: existing.vendorBusinessId },
    data: { reviewsCount: { decrement: 1 } },
  });
  revalidatePath("/vendor/dashboard");
  revalidatePath("/marketplace");
  return { deleted: true };
}

export async function createVendorFaq(input: { vendorBusinessId: string; question: string; answer: string; sortOrder?: number }) {
  const payload = z
    .object({
      vendorBusinessId: z.string(),
      question: z.string().min(1).max(240),
      answer: z.string().min(1).max(2000),
      sortOrder: z.number().int().optional(),
    })
    .parse(input);
  await assertVendorAccess(payload.vendorBusinessId);
  const faq = await prisma.vendorFaq.create({ data: payload });
  revalidatePath("/vendor/dashboard");
  revalidatePath("/marketplace");
  return faq;
}

export async function updateVendorFaq(input: { faqId: string; fields: { question?: string; answer?: string; sortOrder?: number } }) {
  const payload = z
    .object({
      faqId: z.string(),
      fields: z.object({
        question: z.string().min(1).max(240).optional(),
        answer: z.string().min(1).max(2000).optional(),
        sortOrder: z.number().int().optional(),
      }),
    })
    .parse(input);
  const existing = await prisma.vendorFaq.findUniqueOrThrow({ where: { id: payload.faqId } });
  await assertVendorAccess(existing.vendorBusinessId);
  const faq = await prisma.vendorFaq.update({ where: { id: existing.id }, data: payload.fields });
  revalidatePath("/vendor/dashboard");
  revalidatePath("/marketplace");
  return faq;
}

export async function deleteVendorFaq(input: { faqId: string }) {
  const payload = z.object({ faqId: z.string() }).parse(input);
  const existing = await prisma.vendorFaq.findUniqueOrThrow({ where: { id: payload.faqId } });
  await assertVendorAccess(existing.vendorBusinessId);
  await prisma.vendorFaq.delete({ where: { id: existing.id } });
  revalidatePath("/vendor/dashboard");
  revalidatePath("/marketplace");
  return { deleted: true };
}

export async function updateVendorVisibility(input: { vendorBusinessId: string; visible: boolean }) {
  const payload = z.object({ vendorBusinessId: z.string(), visible: z.boolean() }).parse(input);
  await assertVendorAccess(payload.vendorBusinessId);
  const vendor = await prisma.vendorBusiness.update({
    where: { id: payload.vendorBusinessId },
    data: {
      approvedAt: payload.visible ? new Date() : undefined,
      hiddenAt: payload.visible ? null : new Date(),
    },
  });
  revalidatePath("/vendor/dashboard");
  revalidatePath("/marketplace");
  return vendor;
}

export async function createVendorAvailabilitySlot(input: {
  vendorBusinessId: string;
  date: string | Date;
  status: string;
  note?: string;
}) {
  const payload = z
    .object({
      vendorBusinessId: z.string(),
      date: z.union([z.string(), z.date()]),
      status: z.string().min(2).max(40),
      note: z.string().max(500).optional(),
    })
    .parse(input);
  await assertVendorAccess(payload.vendorBusinessId);
  const slotDate = new Date(payload.date);
  slotDate.setHours(0, 0, 0, 0);
  const slot = await prisma.vendorAvailabilitySlot.upsert({
    where: { vendorBusinessId_date: { vendorBusinessId: payload.vendorBusinessId, date: slotDate } },
    create: {
      vendorBusinessId: payload.vendorBusinessId,
      date: slotDate,
      status: payload.status,
      note: payload.note,
    },
    update: {
      status: payload.status,
      note: payload.note,
    },
  });

  revalidatePath("/vendor/dashboard");
  revalidatePath("/marketplace");
  return slot;
}

export async function updateVendorAvailabilitySlot(input: {
  slotId: string;
  fields: { date?: string | Date; status?: string; note?: string | null };
}) {
  const payload = z
    .object({
      slotId: z.string(),
      fields: z.object({
        date: z.union([z.string(), z.date()]).optional(),
        status: z.string().min(2).max(40).optional(),
        note: z.string().max(500).nullable().optional(),
      }),
    })
    .parse(input);
  const existing = await prisma.vendorAvailabilitySlot.findUniqueOrThrow({ where: { id: payload.slotId } });
  await assertVendorAccess(existing.vendorBusinessId);
  const date = payload.fields.date ? new Date(payload.fields.date) : undefined;
  date?.setHours(0, 0, 0, 0);
  const slot = await prisma.vendorAvailabilitySlot.update({
    where: { id: payload.slotId },
    data: {
      date,
      status: payload.fields.status,
      note: payload.fields.note,
    },
  });

  revalidatePath("/vendor/dashboard");
  revalidatePath("/marketplace");
  return slot;
}

export async function updateBooking(input: {
  bookingId: string;
  fields: { amount?: number; status?: string; serviceId?: string | null; notes?: string | null };
}) {
  const payload = z
    .object({
      bookingId: z.string(),
      fields: z.object({
        amount: z.number().nonnegative().optional(),
        status: z.string().optional(),
        serviceId: z.string().nullable().optional(),
        notes: z.string().max(2000).nullable().optional(),
      }),
    })
    .parse(input);
  await assertBookingAccess(payload.bookingId);
  const status = payload.fields.status ? bookingStatusMap[payload.fields.status] : undefined;
  if (payload.fields.status && !status) throw new Error(`Unsupported booking status: ${payload.fields.status}`);
  const booking = await prisma.booking.update({
    where: { id: payload.bookingId },
    data: {
      amountCents: payload.fields.amount === undefined ? undefined : moneyToCents(payload.fields.amount),
      status,
      serviceId: payload.fields.serviceId,
      notes: payload.fields.notes,
    },
  });

  revalidatePath("/vendor/clients");
  revalidatePath("/dashboard");
  return booking;
}

export async function updateContractRecord(input: {
  contractRecordId: string;
  fields: { title?: string; status?: string; fileUrl?: string | null };
}) {
  const payload = z
    .object({
      contractRecordId: z.string(),
      fields: z.object({
        title: z.string().min(1).max(160).optional(),
        status: z.string().optional(),
        fileUrl: z.string().url().nullable().optional(),
      }),
    })
    .parse(input);
  const existing = await prisma.contractRecord.findUniqueOrThrow({ where: { id: payload.contractRecordId } });
  await assertBookingAccess(existing.bookingId);
  const status = payload.fields.status ? contractStatusMap[payload.fields.status] : undefined;
  if (payload.fields.status && !status) throw new Error(`Unsupported contract status: ${payload.fields.status}`);
  const contract = await prisma.contractRecord.update({
    where: { id: payload.contractRecordId },
    data: {
      title: payload.fields.title,
      status,
      fileUrl: payload.fields.fileUrl,
    },
  });

  revalidatePath("/vendor/clients");
  return contract;
}

export async function createFileAsset(input: {
  ownerType: string;
  ownerId: string;
  purpose: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  url?: string;
}) {
  const payload = z
    .object({
      ownerType: z.nativeEnum(FileAssetOwnerType),
      ownerId: z.string(),
      purpose: z.nativeEnum(FileAssetPurpose),
      fileName: z.string().min(1).max(240),
      mimeType: z.string().min(1).max(120),
      sizeBytes: z.number().int().nonnegative(),
      url: z.string().url().optional(),
    })
    .parse(input);
  if (payload.ownerType === FileAssetOwnerType.WEDDING) {
    await assertWeddingAccess(payload.ownerId);
  } else if (payload.ownerType === FileAssetOwnerType.EVENT) {
    await assertEventAccess(payload.ownerId);
  } else if (payload.ownerType === FileAssetOwnerType.VENDOR_BUSINESS) {
    await assertVendorAccess(payload.ownerId);
  } else if (payload.ownerType === FileAssetOwnerType.BOOKING) {
    await assertBookingAccess(payload.ownerId);
  } else {
    await getCurrentUser();
  }
  const asset = await prisma.fileAsset.create({ data: payload });

  return asset;
}

export async function queueNotification(input: {
  recipientUserId?: string;
  type: string;
  payload: Record<string, unknown>;
}) {
  const payload = z
    .object({
      recipientUserId: z.string().optional(),
      type: z.nativeEnum(NotificationType),
      payload: z.record(z.string(), z.unknown()),
    })
    .parse(input);
  await getCurrentUser();
  const notification = await prisma.notification.create({
    data: {
      recipientUserId: payload.recipientUserId,
      type: payload.type,
      payload: payload.payload as Prisma.InputJsonValue,
    },
  });

  return notification;
}

export async function createCoupleWorkspace(input: {
  coupleNames: string;
  date: string | Date;
  location: string;
  style: string;
  budget: number;
  guestCount: number;
}) {
  const payload = z
    .object({
      coupleNames: z.string().min(2).max(120),
      date: z.union([z.string(), z.date()]),
      location: z.string().min(2).max(120),
      style: z.string().min(2).max(240),
      budget: z.number().nonnegative(),
      guestCount: z.number().int().nonnegative(),
    })
    .parse(input);
  const user = await getCurrentUser();
  if (user.accountType !== UserAccountType.COUPLE) {
    throw new Error("Only couple accounts can create wedding workspaces.");
  }
  const slugBase = slugify(payload.coupleNames);
  const slug = `${slugBase}-${Date.now().toString(36)}`;
  const result = await prisma.$transaction(async (tx) => {
    const organization = await tx.organization.create({
      data: {
        name: `${payload.coupleNames} Planning`,
        slug: `${slug}-org`,
        type: "COUPLE",
        memberships: { create: { userId: user.id, role: "OWNER" } },
      },
    });
    const wedding = await tx.wedding.create({
      data: {
        organizationId: organization.id,
        coupleNames: payload.coupleNames,
        slug,
        date: new Date(payload.date),
        location: payload.location,
        style: payload.style,
        budgetCents: moneyToCents(payload.budget),
        guestCount: payload.guestCount,
        members: { create: { userId: user.id, role: "OWNER" } },
      },
    });
    const planningCategory = await tx.category.create({
      data: {
        name: "Planning",
        slug: `${slug}-planning`,
        type: "TASK",
        scope: "WEDDING",
        ownerWeddingId: wedding.id,
        color: "#c8a97e",
        icon: "ListChecks",
      },
    });
    await tx.timelineTask.create({
      data: {
        weddingId: wedding.id,
        categoryId: planningCategory.id,
        title: "Complete wedding profile",
        group: "Onboarding",
        dueDate: new Date(),
        priority: "High",
      },
    });
    await tx.weddingEvent.createMany({
      data: tamilEventTemplate.map((event, index) => {
        const eventDate = offsetDate(new Date(payload.date), event.offsetDays);
        return {
          weddingId: wedding.id,
          name: event.name,
          type: event.type,
          date: eventDate,
          startTime: event.startTime,
          endTime: event.endTime,
          location: payload.location,
          sortOrder: index,
        };
      }),
    });

    return { organization, wedding };
  });

  revalidatePath("/dashboard");
  return result;
}

export async function createVendorWorkspace(input: {
  businessName: string;
  location: string;
  categoryId: string;
  serviceName: string;
  startingPrice: number;
  about: string;
}) {
  const payload = z
    .object({
      businessName: z.string().min(2).max(120),
      location: z.string().min(2).max(120),
      categoryId: z.string(),
      serviceName: z.string().min(2).max(120),
      startingPrice: z.number().nonnegative(),
      about: z.string().min(2).max(4000),
    })
    .parse(input);
  const user = await getCurrentUser();
  if (user.accountType !== UserAccountType.VENDOR) {
    throw new Error("Only vendor accounts can create vendor workspaces.");
  }
  const slug = `${slugify(payload.businessName)}-${Date.now().toString(36)}`;
  const result = await prisma.$transaction(async (tx) => {
    const organization = await tx.organization.create({
      data: {
        name: payload.businessName,
        slug: `${slug}-org`,
        type: "VENDOR",
        memberships: { create: { userId: user.id, role: "OWNER" } },
      },
    });
    const vendorBusiness = await tx.vendorBusiness.create({
      data: {
        organizationId: organization.id,
        name: payload.businessName,
        slug,
        location: payload.location,
        startingPriceCents: moneyToCents(payload.startingPrice),
        about: payload.about,
      },
    });
    const service = await tx.vendorService.create({
      data: {
        vendorBusinessId: vendorBusiness.id,
        categoryId: payload.categoryId,
        name: payload.serviceName,
        description: `${payload.businessName} ${payload.serviceName} service.`,
        startingPriceCents: moneyToCents(payload.startingPrice),
        includes: [],
      },
    });

    return { organization, vendorBusiness, service };
  });

  revalidatePath("/vendor/dashboard");
  revalidatePath("/marketplace");
  return result;
}

export async function createInvite(input: {
  email?: string;
  role: keyof typeof InviteRole;
  organizationId?: string;
  weddingId?: string;
  vendorBusinessId?: string;
  expiresAt?: string | Date;
}) {
  const payload = z
    .object({
      email: z.string().email().optional(),
      role: z.nativeEnum(InviteRole),
      organizationId: z.string().optional(),
      weddingId: z.string().optional(),
      vendorBusinessId: z.string().optional(),
      expiresAt: optionalDate,
    })
    .parse(input);
  const { user } = await requireAdmin();
  const code = randomToken(18);
  const invite = await prisma.invite.create({
    data: {
      code,
      email: payload.email?.toLowerCase(),
      role: payload.role,
      organizationId: payload.organizationId,
      weddingId: payload.weddingId,
      vendorBusinessId: payload.vendorBusinessId,
      expiresAt: payload.expiresAt,
      createdByUserId: user.id,
    },
  });

  if (payload.email) {
    await queueNotification({
      recipientUserId: undefined,
      type: "SYSTEM",
      payload: {
        template: "invite",
        subject: "Your Wedding OS invitation",
        to: payload.email,
        code,
        role: payload.role,
      },
    });
  }

  revalidatePath("/admin");
  return invite;
}

export async function revokeInvite(input: { inviteId: string }) {
  const payload = z.object({ inviteId: z.string() }).parse(input);
  await requireAdmin();
  const invite = await prisma.invite.update({
    where: { id: payload.inviteId },
    data: { status: InviteStatus.REVOKED },
  });

  revalidatePath("/admin");
  return invite;
}

export async function acceptInvite(input: { code: string }) {
  const payload = z.object({ code: z.string().min(8) }).parse(input);
  const user = await getCurrentUser();
  const invite = await prisma.invite.findUniqueOrThrow({ where: { code: payload.code } });
  if (invite.status !== InviteStatus.ACTIVE) throw new Error("Invite is not active.");
  if (invite.expiresAt && invite.expiresAt < new Date()) throw new Error("Invite has expired.");
  if (invite.email && invite.email.toLowerCase() !== user.email.toLowerCase()) throw new Error("Invite email does not match this account.");
  if ((invite.role === InviteRole.COUPLE_OWNER || invite.role === InviteRole.WEDDING_MEMBER) && user.accountType !== UserAccountType.COUPLE) {
    throw new Error("This invite requires a couple account.");
  }
  if ((invite.role === InviteRole.VENDOR_OWNER || invite.role === InviteRole.VENDOR_MEMBER) && user.accountType !== UserAccountType.VENDOR) {
    throw new Error("This invite requires a vendor account.");
  }
  if (invite.role === InviteRole.ADMIN && user.accountType !== UserAccountType.ADMIN) {
    throw new Error("This invite requires an admin account.");
  }

  if (invite.organizationId) {
    await prisma.membership.upsert({
      where: { userId_organizationId: { userId: user.id, organizationId: invite.organizationId } },
      update: {},
      create: { userId: user.id, organizationId: invite.organizationId, role: invite.role.includes("OWNER") ? "OWNER" : "MEMBER" },
    });
  }

  if (invite.weddingId) {
    await prisma.weddingMember.upsert({
      where: { weddingId_userId: { weddingId: invite.weddingId, userId: user.id } },
      update: {},
      create: { weddingId: invite.weddingId, userId: user.id, role: invite.role === InviteRole.WEDDING_MEMBER ? "MEMBER" : "OWNER" },
    });
  }

  const accepted = await prisma.invite.update({
    where: { id: invite.id },
    data: { status: InviteStatus.ACCEPTED, acceptedByUserId: user.id, acceptedAt: new Date() },
  });

  revalidatePath("/workspaces");
  return accepted;
}

export async function switchWorkspace(input: {
  type: "WEDDING" | "VENDOR" | "ADMIN";
  weddingId?: string;
  vendorBusinessId?: string;
  organizationId?: string;
}) {
  const payload = z
    .object({
      type: z.nativeEnum(WorkspaceType),
      weddingId: z.string().optional(),
      vendorBusinessId: z.string().optional(),
      organizationId: z.string().optional(),
    })
    .parse(input);
  const user = await getCurrentUser();

  if (payload.type === WorkspaceType.WEDDING) {
    if (!payload.weddingId) throw new Error("Wedding workspace ID is required.");
    const access = await assertWeddingAccess(payload.weddingId);
    await prisma.workspacePreference.upsert({
      where: { userId: user.id },
      update: {
        activeType: WorkspaceType.WEDDING,
        activeWeddingId: payload.weddingId,
        activeOrganizationId: access.membership.weddingId ? access.membership.wedding.organizationId : payload.organizationId,
        activeVendorBusinessId: null,
      },
      create: {
        userId: user.id,
        activeType: WorkspaceType.WEDDING,
        activeWeddingId: payload.weddingId,
        activeOrganizationId: access.membership.wedding.organizationId,
      },
    });
  } else if (payload.type === WorkspaceType.VENDOR) {
    if (!payload.vendorBusinessId) throw new Error("Vendor workspace ID is required.");
    const access = await assertVendorAccess(payload.vendorBusinessId);
    await prisma.workspacePreference.upsert({
      where: { userId: user.id },
      update: {
        activeType: WorkspaceType.VENDOR,
        activeVendorBusinessId: payload.vendorBusinessId,
        activeOrganizationId: access.organizationId,
        activeWeddingId: null,
      },
      create: {
        userId: user.id,
        activeType: WorkspaceType.VENDOR,
        activeVendorBusinessId: payload.vendorBusinessId,
        activeOrganizationId: access.organizationId,
      },
    });
  } else {
    const admin = await requireAdmin();
    await prisma.workspacePreference.upsert({
      where: { userId: user.id },
      update: {
        activeType: WorkspaceType.ADMIN,
        activeOrganizationId: admin.membership.organizationId,
        activeWeddingId: null,
        activeVendorBusinessId: null,
      },
      create: {
        userId: user.id,
        activeType: WorkspaceType.ADMIN,
        activeOrganizationId: admin.membership.organizationId,
      },
    });
  }

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/vendor/dashboard");
  revalidatePath("/workspaces");
  return { switched: true };
}

export async function updatePassword(input: { currentPassword: string; newPassword: string }) {
  const payload = z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(8).max(120) }).parse(input);
  const user = await getCurrentUser();
  const row = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
  if (!row.passwordHash || !(await bcrypt.compare(payload.currentPassword, row.passwordHash))) {
    throw new Error("Current password is incorrect.");
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(payload.newPassword, 10) },
  });
  return { updated: true };
}

export async function requestPasswordReset(input: { email: string }) {
  const payload = z.object({ email: z.string().email() }).parse(input);
  const user = await prisma.user.findUnique({ where: { email: payload.email.toLowerCase() } });
  if (!user) return { queued: true };
  const token = randomToken();
  await prisma.passwordResetToken.create({
    data: {
      email: user.email,
      tokenHash: tokenHash(token),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
    },
  });
  await queueNotification({
    recipientUserId: user.id,
    type: "SYSTEM",
    payload: { template: "password_reset", token },
  });
  return { queued: true };
}

export async function resetPassword(input: { token: string; newPassword: string }) {
  const payload = z.object({ token: z.string().min(12), newPassword: z.string().min(8).max(120) }).parse(input);
  const row = await prisma.passwordResetToken.findUniqueOrThrow({ where: { tokenHash: tokenHash(payload.token) } });
  if (row.usedAt) throw new Error("Reset token has already been used.");
  if (row.expiresAt < new Date()) throw new Error("Reset token has expired.");
  await prisma.$transaction([
    prisma.user.update({
      where: { email: row.email },
      data: { passwordHash: await bcrypt.hash(payload.newPassword, 10) },
    }),
    prisma.passwordResetToken.update({
      where: { id: row.id },
      data: { usedAt: new Date() },
    }),
  ]);
  return { reset: true };
}

function parseCsvRows(csv: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];
    const nextChar = csv[index + 1];
    if (char === "\"" && inQuotes && nextChar === "\"") {
      cell += "\"";
      index += 1;
    } else if (char === "\"") {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(cell.trim());
      cell = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") index += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function normalizeCsvHeader(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export async function importGuestsCsv(input: { weddingId?: string; csv: string; duplicateMode?: "overwrite" | "create" | "skip" }) {
  const payload = z
    .object({
      weddingId: z.string().optional(),
      csv: z.string().min(1),
      duplicateMode: z.enum(["overwrite", "create", "skip"]).optional(),
    })
    .parse(input);
  const { weddingId: currentWeddingId } = await getCurrentWeddingContext();
  const weddingId = payload.weddingId ?? currentWeddingId;
  await assertWeddingAccess(weddingId);
  const rows = parseCsvRows(payload.csv);
  if (rows.length < 2) throw new Error("CSV needs a header row and at least one guest row.");
  const headers = rows[0];
  const headerIndex = new Map(headers.map((header, index) => [normalizeCsvHeader(header), index]));
  const getCell = (row: string[], names: string[]) => {
    for (const name of names) {
      const index = headerIndex.get(normalizeCsvHeader(name));
      if (index !== undefined) return row[index]?.trim() ?? "";
    }
    return "";
  };
  const requiredHeaders = ["Guest", "# of Attendees", "Group", "RSVP"];
  const missingHeaders = requiredHeaders.filter((header) => !headerIndex.has(normalizeCsvHeader(header)));
  if (missingHeaders.length) throw new Error(`Missing required columns: ${missingHeaders.join(", ")}.`);

  const existingGuests = await prisma.guest.findMany({ where: { weddingId }, select: { id: true, name: true } });
  const existingGroups = await prisma.guestGroup.findMany({ where: { weddingId }, select: { id: true, name: true } });
  const existingByName = new Map(existingGuests.map((guest) => [guest.name.trim().toLowerCase(), guest]));
  const existingGroupByName = new Map(existingGroups.map((group) => [group.name.trim().toLowerCase(), group]));
  const seenImportNames = new Set<string>();
  let imported = 0;
  let updated = 0;
  let skipped = 0;

  await prisma.$transaction(async (tx) => {
    for (const [rowIndex, row] of rows.slice(1).entries()) {
      if (!row.some(Boolean)) continue;
      const rowNumber = rowIndex + 2;
      const name = getCell(row, ["Guest", "Name"]);
      const email = getCell(row, ["Email"]);
      const phone = getCell(row, ["Phone"]);
      const group = getCell(row, ["Group", "Guest Group"]);
      const status = getCell(row, ["RSVP", "Status"]);
      const mealChoice = getCell(row, ["Meal", "Meal Choice"]);
      const attendeeCount = getCell(row, ["# of Attendees", "Attendee Count", "Additional Guest Count"]);
      const companionDetails = getCell(row, ["Subguest names", "Companion Details"]);
      const tableNumber = getCell(row, ["Table", "Table Number"]);
      const notes = getCell(row, ["Notes"]);

      if (!name) throw new Error(`Row ${rowNumber}: Guest is required.`);
      if (!group) throw new Error(`Row ${rowNumber}: Group is required.`);
      if (!status) throw new Error(`Row ${rowNumber}: RSVP is required.`);
      const normalizedStatus = status.toLowerCase();
      if (!["attending", "declined", "pending"].includes(normalizedStatus)) {
        throw new Error(`Row ${rowNumber}: RSVP must be Attending, Declined, or Pending.`);
      }
      const parsedAttendeeCount = Number(attendeeCount);
      if (!Number.isInteger(parsedAttendeeCount) || parsedAttendeeCount < 1) {
        throw new Error(`Row ${rowNumber}: # of Attendees must be a whole number of 1 or more.`);
      }

      const groupName = group?.trim() || "Ungrouped";
      const existingGroup = existingGroupByName.get(groupName.toLowerCase());
      if (!existingGroup) {
        throw new Error(`Row ${rowNumber}: Group must match an existing group. Add "${groupName}" before importing.`);
      }
      const parsedAdditionalGuests = Math.max(0, parsedAttendeeCount - 1);
      const parsedTable = tableNumber ? Number(tableNumber) : undefined;

      const normalizedGuestName = name.trim().toLowerCase();
      if (seenImportNames.has(normalizedGuestName)) {
        if (payload.duplicateMode === "skip") {
          skipped += 1;
          continue;
        }
        if (!payload.duplicateMode) {
          throw new Error(`Duplicate guest name in CSV: ${name}. Choose how to handle duplicate guest rows before importing.`);
        }
      }
      seenImportNames.add(normalizedGuestName);

      const existingGuest = existingByName.get(normalizedGuestName);
      if (existingGuest && payload.duplicateMode === "skip") {
        skipped += 1;
        continue;
      }
      if (existingGuest && !payload.duplicateMode) {
        throw new Error(`Guest already exists: ${name}. Choose how to handle potential duplicates before importing.`);
      }

      const sharedGuestData = {
        name,
        email: email || undefined,
        phone: phone || undefined,
        status: normalizedStatus === "attending" ? "ATTENDING" : normalizedStatus === "declined" ? "DECLINED" : "PENDING",
        mealChoice: mealChoice || "Pending",
        plusOne: parsedAdditionalGuests > 0,
        additionalGuestCount: parsedAdditionalGuests,
        companionDetails: companionDetails || undefined,
        tableNumber: Number.isFinite(parsedTable) ? parsedTable : undefined,
        notes: notes || undefined,
      } as const;

      if (existingGuest && payload.duplicateMode === "overwrite") {
        await tx.guest.update({
          where: { id: existingGuest.id },
          data: {
            ...sharedGuestData,
            guestGroup: { connect: { id: existingGroup.id } },
          },
        });
        updated += 1;
      } else {
        await tx.guest.create({
          data: {
            ...sharedGuestData,
            weddingId,
            guestGroupId: existingGroup.id,
          },
        });
        imported += 1;
      }
    }
  });
  revalidatePath("/rsvp");
  revalidatePath("/dashboard");
  return { imported, updated, skipped };
}

export async function exportGuestsCsv(input: { weddingId?: string }) {
  const payload = z.object({ weddingId: z.string().optional() }).parse(input);
  const { weddingId: currentWeddingId } = await getCurrentWeddingContext();
  const weddingId = payload.weddingId ?? currentWeddingId;
  await assertWeddingAccess(weddingId);
  const guests = await prisma.guest.findMany({ where: { weddingId }, include: { guestGroup: true }, orderBy: { name: "asc" } });
  const header = "Name,Email,Phone,Group,Status,Meal Choice,Additional Guest Count,Companion Details,Table,Notes";
  const lines = guests.map((guest) =>
    [
      guest.name,
      guest.email ?? "",
      guest.phone ?? "",
      guest.guestGroup?.name ?? "",
      guest.status,
      guest.mealChoice,
      guest.additionalGuestCount,
      guest.companionDetails ?? "",
      guest.tableNumber ?? "",
      guest.notes ?? "",
    ]
      .map((value) => `"${String(value).replaceAll("\"", "\"\"")}"`)
      .join(","),
  );
  return [header, ...lines].join("\n");
}

async function getOrCreateActiveRsvpTokenForGuest(input: {
  guestId: string;
  weddingId: string;
  expiresInDays?: number;
}) {
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * (input.expiresInDays ?? 30));
  const existingTokens = await prisma.publicRSVPToken.findMany({
    where: {
      guestId: input.guestId,
      usedAt: null,
    },
    orderBy: { createdAt: "desc" },
  });

  if (existingTokens.length) {
    const [tokenToKeep, ...duplicates] = existingTokens;

    if (duplicates.length) {
      await prisma.publicRSVPToken.deleteMany({
        where: { id: { in: duplicates.map((token) => token.id) } },
      });
    }

    const token = await prisma.publicRSVPToken.update({
      where: { id: tokenToKeep.id },
      data: { expiresAt },
    });

    return { token, created: false, removedDuplicates: duplicates.length };
  }

  try {
    const token = await prisma.publicRSVPToken.create({
      data: {
        weddingId: input.weddingId,
        guestId: input.guestId,
        token: randomToken(20),
        expiresAt,
      },
    });

    return { token, created: true, removedDuplicates: 0 };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const token = await prisma.publicRSVPToken.findFirstOrThrow({
        where: {
          guestId: input.guestId,
          usedAt: null,
        },
        orderBy: { createdAt: "desc" },
      });
      return { token, created: false, removedDuplicates: 0 };
    }

    throw error;
  }
}

export async function sendRsvpReminder(input: { guestId: string }) {
  const payload = z.object({ guestId: z.string() }).parse(input);
  const guest = await prisma.guest.findUniqueOrThrow({ where: { id: payload.guestId }, include: { wedding: true } });
  await assertWeddingAccess(guest.weddingId);
  if (!guest.email) throw new Error("Guest does not have an email address.");
  const { token, created, removedDuplicates } = await getOrCreateActiveRsvpTokenForGuest({
    guestId: guest.id,
    weddingId: guest.weddingId,
  });
  await queueNotification({
    type: "RSVP_REMINDER",
    payload: {
      to: guest.email,
      guestName: guest.name,
      wedding: guest.wedding.coupleNames,
      token: token.token,
    },
  });
  revalidatePath("/rsvp");
  return { queued: true, created, reused: !created, removedDuplicates };
}

export async function sendRsvpLinks(input: {
  guestIds: string[];
  message?: string;
  expiresInDays?: number;
  sendEmail?: boolean;
}) {
  const payload = z
    .object({
      guestIds: z.array(z.string()).min(1).max(300),
      message: z.string().trim().max(1000).optional(),
      expiresInDays: z.number().int().positive().max(365).optional(),
      sendEmail: z.boolean().optional(),
    })
    .parse(input);

  const { weddingId } = await getCurrentWeddingContext();
  await assertWeddingAccess(weddingId);

  const guests = await prisma.guest.findMany({
    where: { id: { in: payload.guestIds }, weddingId },
    include: { wedding: true },
    orderBy: { name: "asc" },
  });

  if (!guests.length) throw new Error("Select at least one guest to create RSVP links.");

  const shouldSendEmail = payload.sendEmail ?? true;
  let emailed = 0;
  let created = 0;
  let reused = 0;
  let removedDuplicates = 0;

  for (const guest of guests) {
    const tokenResult = await getOrCreateActiveRsvpTokenForGuest({
      guestId: guest.id,
      weddingId,
      expiresInDays: payload.expiresInDays,
    });
    if (tokenResult.created) created += 1;
    else reused += 1;
    removedDuplicates += tokenResult.removedDuplicates;

    if (shouldSendEmail && guest.email) {
      emailed += 1;
      await queueNotification({
        type: "RSVP_REMINDER",
        payload: {
          to: guest.email,
          guestName: guest.name,
          wedding: guest.wedding.coupleNames,
          token: tokenResult.token.token,
          message: payload.message,
        },
      });
    }
  }

  revalidatePath("/rsvp");
  return { total: guests.length, created, reused, emailed, skippedEmail: guests.length - emailed, removedDuplicates };
}

export async function createPublicRsvpToken(input: { guestId: string; expiresInDays?: number }) {
  const payload = z.object({ guestId: z.string(), expiresInDays: z.number().int().positive().max(365).optional() }).parse(input);
  const guest = await prisma.guest.findUniqueOrThrow({ where: { id: payload.guestId }, include: { wedding: true } });
  await assertWeddingAccess(guest.weddingId);
  const { token } = await getOrCreateActiveRsvpTokenForGuest({
    guestId: guest.id,
    weddingId: guest.weddingId,
    expiresInDays: payload.expiresInDays,
  });
  revalidatePath("/rsvp");
  return token;
}

export async function deletePublicRsvpToken(input: { publicRsvpTokenId: string }) {
  const payload = z.object({ publicRsvpTokenId: z.string() }).parse(input);
  const row = await prisma.publicRSVPToken.findUniqueOrThrow({ where: { id: payload.publicRsvpTokenId } });
  await assertWeddingAccess(row.weddingId);
  await prisma.publicRSVPToken.delete({ where: { id: row.id } });
  revalidatePath("/rsvp");
  return { deleted: true };
}

export async function submitPublicRsvp(input: {
  token: string;
  status: "ATTENDING" | "DECLINED" | "PENDING";
  mealChoice?: string;
  plusOne?: boolean;
  attendeeCount?: number;
  companionNames?: string[];
  notes?: string;
  eventResponses?: {
    eventId: string;
    status: "ATTENDING" | "DECLINED" | "PENDING";
    attendeeCount?: number;
    mealChoice?: string;
    notes?: string;
  }[];
}) {
  const payload = z
    .object({
      token: z.string(),
      status: z.enum(["ATTENDING", "DECLINED", "PENDING"]),
      mealChoice: z.string().optional(),
      plusOne: z.boolean().optional(),
      attendeeCount: z.number().int().nonnegative().optional(),
      companionNames: z.array(z.string().max(120)).optional(),
      notes: z.string().optional(),
      eventResponses: z
        .array(
          z.object({
            eventId: z.string(),
            status: z.enum(["ATTENDING", "DECLINED", "PENDING"]),
            attendeeCount: z.number().int().nonnegative().optional(),
            mealChoice: z.string().optional(),
            notes: z.string().max(1000).optional(),
          }),
        )
        .optional(),
    })
    .parse(input);
  const tokenRow = await prisma.publicRSVPToken.findUniqueOrThrow({ where: { token: payload.token } });
  if (tokenRow.expiresAt && tokenRow.expiresAt < new Date()) throw new Error("RSVP link has expired.");
  if (!tokenRow.guestId) throw new Error("RSVP link is not attached to a guest.");
  const companionNames = payload.companionNames?.map((name) => name.trim()).filter(Boolean) ?? [];
  const attendeeCount = Math.max(1, payload.attendeeCount ?? companionNames.length + 1);
  const additionalGuestCount = Math.max(0, attendeeCount - 1);
  const eventIds = payload.eventResponses?.map((response) => response.eventId) ?? [];
  const validEvents = eventIds.length
    ? await prisma.weddingEvent.findMany({
        where: { weddingId: tokenRow.weddingId, id: { in: eventIds } },
        select: { id: true },
      })
    : [];
  const validEventIds = new Set(validEvents.map((event) => event.id));

  await prisma.$transaction(async (tx) => {
    await tx.guest.update({
      where: { id: tokenRow.guestId! },
      data: {
        status: payload.status,
        mealChoice: payload.mealChoice,
        plusOne: additionalGuestCount > 0,
        additionalGuestCount,
        companionDetails: JSON.stringify(companionNames),
        notes: payload.notes,
      },
    });
    for (const response of payload.eventResponses ?? []) {
      if (!validEventIds.has(response.eventId)) continue;
      await tx.eventRsvp.upsert({
        where: { guestId_eventId: { guestId: tokenRow.guestId!, eventId: response.eventId } },
        create: {
          guestId: tokenRow.guestId!,
          eventId: response.eventId,
          status: response.status,
          attendeeCount: response.attendeeCount ?? attendeeCount,
          mealChoice: response.mealChoice ?? payload.mealChoice ?? "Pending",
          notes: response.notes,
        },
        update: {
          status: response.status,
          attendeeCount: response.attendeeCount ?? attendeeCount,
          mealChoice: response.mealChoice ?? payload.mealChoice ?? "Pending",
          notes: response.notes,
        },
      });
    }
    await tx.publicRSVPToken.update({ where: { id: tokenRow.id }, data: { usedAt: new Date() } });
  });
  await syncGuestCompanions(tokenRow.guestId, JSON.stringify(companionNames));
  revalidatePath("/rsvp");
  return { submitted: true };
}

export async function createInvoiceRecord(input: {
  weddingId?: string;
  vendorBusinessId?: string;
  bookingId?: string;
  budgetItemId?: string;
  label: string;
  amount: number;
  status?: keyof typeof InvoiceStatus;
  dueDate?: string | Date;
}) {
  const payload = z
    .object({
      weddingId: z.string().optional(),
      vendorBusinessId: z.string().optional(),
      bookingId: z.string().optional(),
      budgetItemId: z.string().optional(),
      label: z.string().min(1).max(160),
      amount: z.number().nonnegative(),
      status: z.nativeEnum(InvoiceStatus).optional(),
      dueDate: optionalDate,
    })
    .parse(input);
  const booking = payload.bookingId ? await prisma.booking.findUniqueOrThrow({ where: { id: payload.bookingId } }) : null;
  const weddingId = payload.weddingId ?? booking?.weddingId ?? (await getCurrentWeddingContext()).weddingId;
  if (payload.bookingId) {
    await assertBookingAccess(payload.bookingId);
  } else {
    await assertWeddingAccess(weddingId);
  }
  if (payload.vendorBusinessId) await assertVendorAccess(payload.vendorBusinessId).catch(() => undefined);
  const invoice = await prisma.invoiceRecord.create({
    data: {
      weddingId,
      vendorBusinessId: payload.vendorBusinessId,
      bookingId: payload.bookingId,
      budgetItemId: payload.budgetItemId,
      label: payload.label,
      amountCents: moneyToCents(payload.amount),
      status: payload.status ?? InvoiceStatus.DRAFT,
      dueDate: payload.dueDate,
    },
  });
  revalidatePath("/budget");
  revalidatePath("/vendor/clients");
  return invoice;
}

export async function updateInvoiceRecord(input: {
  invoiceRecordId: string;
  fields: { label?: string; amount?: number; status?: keyof typeof InvoiceStatus; dueDate?: string | Date | null };
}) {
  const payload = z
    .object({
      invoiceRecordId: z.string(),
      fields: z.object({
        label: z.string().min(1).max(160).optional(),
        amount: z.number().nonnegative().optional(),
        status: z.nativeEnum(InvoiceStatus).optional(),
        dueDate: z.union([z.string(), z.date()]).nullable().optional(),
      }),
    })
    .parse(input);
  const existing = await prisma.invoiceRecord.findUniqueOrThrow({ where: { id: payload.invoiceRecordId } });
  await assertWeddingAccess(existing.weddingId);
  const invoice = await prisma.invoiceRecord.update({
    where: { id: existing.id },
    data: {
      label: payload.fields.label,
      amountCents: payload.fields.amount === undefined ? undefined : moneyToCents(payload.fields.amount),
      status: payload.fields.status,
      dueDate: payload.fields.dueDate === undefined ? undefined : payload.fields.dueDate ? new Date(payload.fields.dueDate) : null,
    },
  });
  revalidatePath("/budget");
  revalidatePath("/vendor/clients");
  return invoice;
}

export async function deleteInvoiceRecord(input: { invoiceRecordId: string }) {
  const payload = z.object({ invoiceRecordId: z.string() }).parse(input);
  const existing = await prisma.invoiceRecord.findUniqueOrThrow({ where: { id: payload.invoiceRecordId } });
  await assertWeddingAccess(existing.weddingId);
  await prisma.invoiceRecord.delete({ where: { id: existing.id } });
  revalidatePath("/budget");
  revalidatePath("/vendor/clients");
  return { deleted: true };
}

export async function createScheduledCall(input: {
  conversationId?: string;
  weddingId?: string;
  vendorBusinessId?: string;
  bookingId?: string;
  title: string;
  callUrl: string;
  startsAt: string | Date;
  durationMinutes?: number;
  notes?: string;
}) {
  const payload = z
    .object({
      conversationId: z.string().optional(),
      weddingId: z.string().optional(),
      vendorBusinessId: z.string().optional(),
      bookingId: z.string().optional(),
      title: z.string().min(1).max(160),
      callUrl: z.string().url(),
      startsAt: z.union([z.string(), z.date()]),
      durationMinutes: z.number().int().positive().optional(),
      notes: z.string().max(1000).optional(),
    })
    .parse(input);
  const source = payload.bookingId
    ? await prisma.booking.findUniqueOrThrow({ where: { id: payload.bookingId } })
    : payload.conversationId
      ? await prisma.conversation.findUniqueOrThrow({ where: { id: payload.conversationId } })
      : null;
  const weddingId = payload.weddingId ?? source?.weddingId ?? (await getCurrentWeddingContext()).weddingId;
  const vendorBusinessId = payload.vendorBusinessId ?? source?.vendorBusinessId;
  if (payload.bookingId) {
    await assertBookingAccess(payload.bookingId);
  } else {
    try {
      await assertWeddingAccess(weddingId);
    } catch {
      if (!vendorBusinessId) throw new Error("Scheduled call is not attached to an accessible vendor.");
      await assertVendorAccess(vendorBusinessId);
    }
  }
  const call = await prisma.scheduledCall.create({
    data: {
      conversationId: payload.conversationId,
      weddingId,
      vendorBusinessId,
      bookingId: payload.bookingId,
      title: payload.title,
      callUrl: payload.callUrl,
      startsAt: new Date(payload.startsAt),
      durationMinutes: payload.durationMinutes ?? 30,
      notes: payload.notes,
    },
  });
  revalidatePath("/messages");
  revalidatePath("/vendor/messages");
  revalidatePath("/vendor/clients");
  return call;
}

export async function updateScheduledCall(input: {
  scheduledCallId: string;
  fields: { title?: string; callUrl?: string; startsAt?: string | Date; durationMinutes?: number; notes?: string | null };
}) {
  const payload = z
    .object({
      scheduledCallId: z.string(),
      fields: z.object({
        title: z.string().min(1).max(160).optional(),
        callUrl: z.string().url().optional(),
        startsAt: z.union([z.string(), z.date()]).optional(),
        durationMinutes: z.number().int().positive().optional(),
        notes: z.string().max(1000).nullable().optional(),
      }),
    })
    .parse(input);
  const existing = await prisma.scheduledCall.findUniqueOrThrow({ where: { id: payload.scheduledCallId } });
  if (existing.bookingId) {
    await assertBookingAccess(existing.bookingId);
  } else {
    try {
      await assertWeddingAccess(existing.weddingId);
    } catch {
      if (!existing.vendorBusinessId) throw new Error("Scheduled call is not attached to an accessible vendor.");
      await assertVendorAccess(existing.vendorBusinessId);
    }
  }
  const call = await prisma.scheduledCall.update({
    where: { id: existing.id },
    data: {
      title: payload.fields.title,
      callUrl: payload.fields.callUrl,
      startsAt: payload.fields.startsAt === undefined ? undefined : new Date(payload.fields.startsAt),
      durationMinutes: payload.fields.durationMinutes,
      notes: payload.fields.notes,
    },
  });
  revalidatePath("/messages");
  revalidatePath("/vendor/messages");
  revalidatePath("/vendor/clients");
  return call;
}

export async function deleteScheduledCall(input: { scheduledCallId: string }) {
  const payload = z.object({ scheduledCallId: z.string() }).parse(input);
  const existing = await prisma.scheduledCall.findUniqueOrThrow({ where: { id: payload.scheduledCallId } });
  if (existing.bookingId) {
    await assertBookingAccess(existing.bookingId);
  } else {
    try {
      await assertWeddingAccess(existing.weddingId);
    } catch {
      if (!existing.vendorBusinessId) throw new Error("Scheduled call is not attached to an accessible vendor.");
      await assertVendorAccess(existing.vendorBusinessId);
    }
  }
  await prisma.scheduledCall.delete({ where: { id: existing.id } });
  revalidatePath("/messages");
  revalidatePath("/vendor/messages");
  revalidatePath("/vendor/clients");
  return { deleted: true };
}

export async function createVendorOpportunity(input: {
  weddingId?: string;
  categoryId?: string;
  title: string;
  description: string;
  budget?: number;
  location?: string;
  date?: string | Date;
  guestCount?: number;
}) {
  const payload = z
    .object({
      weddingId: z.string().optional(),
      categoryId: z.string().optional(),
      title: z.string().min(2).max(160),
      description: z.string().min(2).max(2000),
      budget: z.number().nonnegative().optional(),
      location: z.string().max(120).optional(),
      date: optionalDate,
      guestCount: z.number().int().nonnegative().optional(),
    })
    .parse(input);
  const { weddingId: currentWeddingId } = await getCurrentWeddingContext();
  const weddingId = payload.weddingId ?? currentWeddingId;
  await assertWeddingAccess(weddingId);
  const opportunity = await prisma.vendorOpportunity.create({
    data: {
      weddingId,
      categoryId: payload.categoryId,
      title: payload.title,
      description: payload.description,
      budgetCents: payload.budget === undefined ? undefined : moneyToCents(payload.budget),
      location: payload.location,
      date: payload.date,
      guestCount: payload.guestCount,
    },
  });
  revalidatePath("/marketplace");
  revalidatePath("/opportunities");
  revalidatePath("/vendor/opportunities");
  return opportunity;
}

export async function updateVendorOpportunity(input: {
  opportunityId: string;
  fields: { title?: string; description?: string; status?: keyof typeof OpportunityStatus; budget?: number; location?: string; date?: string | Date | null; guestCount?: number };
}) {
  const payload = z
    .object({
      opportunityId: z.string(),
      fields: z.object({
        title: z.string().min(2).max(160).optional(),
        description: z.string().min(2).max(2000).optional(),
        status: z.nativeEnum(OpportunityStatus).optional(),
        budget: z.number().nonnegative().optional(),
        location: z.string().max(120).optional(),
        date: z.union([z.string(), z.date()]).nullable().optional(),
        guestCount: z.number().int().nonnegative().optional(),
      }),
    })
    .parse(input);
  const existing = await prisma.vendorOpportunity.findUniqueOrThrow({ where: { id: payload.opportunityId } });
  await assertWeddingAccess(existing.weddingId);
  const opportunity = await prisma.vendorOpportunity.update({
    where: { id: existing.id },
    data: {
      title: payload.fields.title,
      description: payload.fields.description,
      status: payload.fields.status,
      budgetCents: payload.fields.budget === undefined ? undefined : moneyToCents(payload.fields.budget),
      location: payload.fields.location,
      date: payload.fields.date === undefined ? undefined : payload.fields.date ? new Date(payload.fields.date) : null,
      guestCount: payload.fields.guestCount,
    },
  });
  return opportunity;
}

export async function sendVendorPitch(input: { opportunityId: string; vendorBusinessId?: string; message: string }) {
  const payload = z.object({ opportunityId: z.string(), vendorBusinessId: z.string().optional(), message: z.string().min(2).max(2000) }).parse(input);
  const vendorContext = await getCurrentWorkspace();
  const vendorBusinessId = payload.vendorBusinessId ?? (vendorContext.type === "vendor" ? vendorContext.vendorBusinessId : undefined);
  if (!vendorBusinessId) throw new Error("Vendor workspace is required to send a pitch.");
  await assertVendorAccess(vendorBusinessId);
  const opportunity = await prisma.vendorOpportunity.findUniqueOrThrow({ where: { id: payload.opportunityId }, include: { wedding: true } });
  const vendor = await prisma.vendorBusiness.findUniqueOrThrow({ where: { id: vendorBusinessId } });
  const result = await prisma.$transaction(async (tx) => {
    const pitch = await tx.vendorPitch.upsert({
      where: { opportunityId_vendorBusinessId: { opportunityId: opportunity.id, vendorBusinessId } },
      update: { message: payload.message, status: PitchStatus.SENT },
      create: {
        opportunityId: opportunity.id,
        vendorBusinessId,
        senderUserId: vendorContext.user.id,
        message: payload.message,
      },
    });
    const conversation = await tx.conversation.create({
      data: {
        weddingId: opportunity.weddingId,
        vendorBusinessId,
        messages: {
          create: {
            senderRole: SenderRole.VENDOR,
            senderName: vendor.name,
            body: payload.message,
          },
        },
      },
    });
    await tx.vendorOpportunity.update({ where: { id: opportunity.id }, data: { status: OpportunityStatus.PITCHED } });
    return { pitch, conversation };
  });
  revalidatePath("/opportunities");
  revalidatePath("/messages");
  revalidatePath("/vendor/messages");
  revalidatePath("/vendor/opportunities");
  return result;
}

export async function uploadFileAsset(input: {
  ownerType: keyof typeof FileAssetOwnerType;
  ownerId: string;
  purpose: keyof typeof FileAssetPurpose;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  bytesBase64?: string;
  visibility?: keyof typeof FileVisibility;
}) {
  const payload = z
    .object({
      ownerType: z.nativeEnum(FileAssetOwnerType),
      ownerId: z.string(),
      purpose: z.nativeEnum(FileAssetPurpose),
      fileName: z.string().min(1).max(240),
      mimeType: z.string().min(1).max(120),
      sizeBytes: z.number().int().nonnegative(),
      bytesBase64: z.string().optional(),
      visibility: z.nativeEnum(FileVisibility).optional(),
    })
    .parse(input);
  const user = await getCurrentUser();
  if (payload.ownerType === FileAssetOwnerType.WEDDING) await assertWeddingAccess(payload.ownerId);
  if (payload.ownerType === FileAssetOwnerType.EVENT) await assertEventAccess(payload.ownerId);
  if (payload.ownerType === FileAssetOwnerType.VENDOR_BUSINESS) await assertVendorAccess(payload.ownerId);
  if (payload.ownerType === FileAssetOwnerType.BOOKING) await assertBookingAccess(payload.ownerId);
  const bytes = payload.bytesBase64 ? Buffer.from(payload.bytesBase64, "base64") : undefined;
  const storage = await createStorageUpload({
    ownerType: payload.ownerType,
    ownerId: payload.ownerId,
    purpose: payload.purpose,
    fileName: payload.fileName,
    mimeType: payload.mimeType,
    bytes,
  });
  const asset = await prisma.fileAsset.create({
    data: {
      ownerType: payload.ownerType,
      ownerId: payload.ownerId,
      purpose: payload.purpose,
      fileName: payload.fileName,
      mimeType: payload.mimeType,
      sizeBytes: payload.sizeBytes,
      visibility: payload.visibility ?? FileVisibility.PRIVATE,
      provider: storage.provider,
      storageKey: storage.storageKey,
      checksum: storage.checksum,
      url: storage.url,
      uploadedByUserId: user.id,
    },
  });
  revalidatePath("/budget");
  revalidatePath("/documents");
  revalidatePath("/run-sheet");
  revalidatePath("/vendor/dashboard");
  revalidatePath("/vendor/clients");
  return asset;
}

export async function getSignedFileUrl(input: { fileAssetId: string }) {
  const payload = z.object({ fileAssetId: z.string() }).parse(input);
  const asset = await prisma.fileAsset.findUniqueOrThrow({ where: { id: payload.fileAssetId } });
  if (asset.ownerType === FileAssetOwnerType.WEDDING) await assertWeddingAccess(asset.ownerId);
  if (asset.ownerType === FileAssetOwnerType.EVENT) await assertEventAccess(asset.ownerId);
  if (asset.ownerType === FileAssetOwnerType.VENDOR_BUSINESS) await assertVendorAccess(asset.ownerId);
  if (asset.ownerType === FileAssetOwnerType.BOOKING) await assertBookingAccess(asset.ownerId);
  return { url: getStorageReadUrl(asset), provider: asset.provider };
}

export async function deleteFileAsset(input: { fileAssetId: string }) {
  const payload = z.object({ fileAssetId: z.string() }).parse(input);
  const asset = await prisma.fileAsset.findUniqueOrThrow({ where: { id: payload.fileAssetId } });
  if (asset.ownerType === FileAssetOwnerType.WEDDING) await assertWeddingAccess(asset.ownerId);
  if (asset.ownerType === FileAssetOwnerType.EVENT) await assertEventAccess(asset.ownerId);
  if (asset.ownerType === FileAssetOwnerType.VENDOR_BUSINESS) await assertVendorAccess(asset.ownerId);
  if (asset.ownerType === FileAssetOwnerType.BOOKING) await assertBookingAccess(asset.ownerId);
  await prisma.fileAsset.delete({ where: { id: asset.id } });
  revalidatePath("/budget");
  revalidatePath("/documents");
  revalidatePath("/run-sheet");
  revalidatePath("/vendor/dashboard");
  revalidatePath("/vendor/clients");
  return { deleted: true };
}

export async function markConversationRead(input: { conversationId: string }) {
  const payload = z.object({ conversationId: z.string() }).parse(input);
  const user = await getCurrentUser();
  const conversation = await prisma.conversation.findUniqueOrThrow({ where: { id: payload.conversationId } });
  try {
    await assertWeddingAccess(conversation.weddingId);
  } catch {
    await assertVendorAccess(conversation.vendorBusinessId);
  }
  await prisma.conversationReadState.upsert({
    where: { conversationId_userId: { conversationId: conversation.id, userId: user.id } },
    update: { lastReadAt: new Date() },
    create: { conversationId: conversation.id, userId: user.id },
  });
  revalidatePath("/messages");
  revalidatePath("/vendor/messages");
  return { read: true };
}

export async function queueEmailNotification(input: {
  recipientUserId?: string;
  to?: string;
  type: keyof typeof NotificationType;
  subject: string;
  template: string;
  payload: Record<string, unknown>;
}) {
  const payload = z
    .object({
      recipientUserId: z.string().optional(),
      to: z.string().email().optional(),
      type: z.nativeEnum(NotificationType),
      subject: z.string().min(1).max(200),
      template: z.string().min(1).max(80),
      payload: z.record(z.string(), z.unknown()),
    })
    .parse(input);
  await getCurrentUser();
  const notification = await prisma.notification.create({
    data: {
      recipientUserId: payload.recipientUserId,
      type: payload.type,
      payload: {
        ...payload.payload,
        to: payload.to,
        subject: payload.subject,
        template: payload.template,
      },
    },
  });
  return notification;
}

export async function processNotificationQueue(input: { limit?: number } = {}) {
  const payload = z.object({ limit: z.number().int().positive().max(50).optional() }).parse(input);
  await requireAdmin();
  const rows = await prisma.notification.findMany({
    where: { status: NotificationStatus.QUEUED },
    include: { recipientUser: true },
    orderBy: { createdAt: "asc" },
    take: payload.limit ?? 10,
  });
  const results = [];
  for (const row of rows) {
    const rowPayload = row.payload as Record<string, unknown>;
    const to = typeof rowPayload.to === "string" ? rowPayload.to : row.recipientUser?.email;
    const subject = typeof rowPayload.subject === "string" ? rowPayload.subject : `Wedding OS ${row.type.toLowerCase().replaceAll("_", " ")}`;
    const template = typeof rowPayload.template === "string" ? rowPayload.template : row.type.toLowerCase();
    if (!to) {
      await prisma.notification.update({
        where: { id: row.id },
        data: { status: NotificationStatus.FAILED, error: "Missing recipient email." },
      });
      results.push({ id: row.id, ok: false });
      continue;
    }
    try {
      const sent = await sendTransactionalEmail({ to, subject, template, payload: rowPayload });
      await prisma.notification.update({
        where: { id: row.id },
        data: {
          status: NotificationStatus.SENT,
          sentAt: new Date(),
          provider: sent.provider,
          providerMessageId: sent.providerMessageId,
        },
      });
      results.push({ id: row.id, ok: true, provider: sent.provider });
    } catch (error) {
      await prisma.notification.update({
        where: { id: row.id },
        data: { status: NotificationStatus.FAILED, error: error instanceof Error ? error.message : "Unknown email failure." },
      });
      results.push({ id: row.id, ok: false });
    }
  }
  revalidatePath("/admin");
  return { processed: results.length, results };
}

export async function recordProfileView(input: { vendorBusinessId: string; weddingId?: string; source?: string }) {
  const payload = z.object({ vendorBusinessId: z.string(), weddingId: z.string().optional(), source: z.string().optional() }).parse(input);
  const user = await getCurrentUser().catch(() => null);
  if (payload.weddingId) await assertWeddingAccess(payload.weddingId);
  const event = await prisma.profileViewEvent.create({
    data: {
      vendorBusinessId: payload.vendorBusinessId,
      weddingId: payload.weddingId,
      viewerUserId: user?.id,
      source: payload.source,
    },
  });
  return event;
}

export async function updateVendorModeration(input: { vendorBusinessId: string; approved?: boolean; hidden?: boolean }) {
  const payload = z.object({ vendorBusinessId: z.string(), approved: z.boolean().optional(), hidden: z.boolean().optional() }).parse(input);
  await requireAdmin();
  const vendor = await prisma.vendorBusiness.update({
    where: { id: payload.vendorBusinessId },
    data: {
      approvedAt: payload.approved === undefined ? undefined : payload.approved ? new Date() : null,
      hiddenAt: payload.hidden === undefined ? undefined : payload.hidden ? new Date() : null,
    },
  });
  revalidatePath("/marketplace");
  revalidatePath("/admin");
  return vendor;
}
