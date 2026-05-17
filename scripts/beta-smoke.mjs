import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString =
  process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5433/wedding_os?schema=public";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString, connectionTimeoutMillis: 1500, idleTimeoutMillis: 1000, max: 5 }),
});

const rollbackToken = "ROLLBACK_BETA_SMOKE";
let summary = null;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

try {
  await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUniqueOrThrow({ where: { email: "maya@weddingos.local" } });
    const vendorUser = await tx.user.findUniqueOrThrow({ where: { email: "golden@weddingos.local" } });
    const wedding = await tx.wedding.findUniqueOrThrow({ where: { slug: "arjun-maya" } });
    const vendor = await tx.vendorBusiness.findUniqueOrThrow({ where: { slug: "golden-lens-photography" } });
    const conversation = await tx.conversation.findFirstOrThrow({ where: { weddingId: wedding.id, vendorBusinessId: vendor.id } });
    const category = await tx.category.findFirstOrThrow({ where: { type: "VENDOR_SERVICE" } });
    const budgetItem = await tx.budgetItem.findFirstOrThrow({ where: { weddingId: wedding.id } });

    const invite = await tx.invite.create({
      data: {
        code: `BETA-SMOKE-${Date.now()}`,
        role: "COUPLE_OWNER",
        createdByUserId: user.id,
      },
    });
    const readState = await tx.conversationReadState.create({
      data: { conversationId: conversation.id, userId: user.id },
    });
    const opportunity = await tx.vendorOpportunity.create({
      data: {
        weddingId: wedding.id,
        categoryId: category.id,
        title: "[Smoke] Need a specialty vendor",
        description: "Testing opportunity workflow.",
        budgetCents: 100000,
      },
    });
    const pitch = await tx.vendorPitch.create({
      data: {
        opportunityId: opportunity.id,
        vendorBusinessId: vendor.id,
        senderUserId: vendorUser.id,
        message: "[Smoke] Vendor pitch.",
      },
    });
    const invoice = await tx.invoiceRecord.create({
      data: {
        weddingId: wedding.id,
        vendorBusinessId: vendor.id,
        budgetItemId: budgetItem.id,
        label: "[Smoke] Invoice",
        amountCents: 100000,
      },
    });
    const payment = await tx.paymentScheduleItem.create({
      data: {
        budgetItemId: budgetItem.id,
        label: "[Smoke] Budget payment",
        amountCents: 50000,
        dueDate: new Date(),
      },
    });
    const call = await tx.scheduledCall.create({
      data: {
        conversationId: conversation.id,
        weddingId: wedding.id,
        vendorBusinessId: vendor.id,
        title: "[Smoke] Consultation",
        callUrl: "https://meet.google.com/smoke-test",
        startsAt: new Date(),
      },
    });
    const guest = await tx.guest.findFirstOrThrow({ where: { weddingId: wedding.id } });
    const token = await tx.publicRSVPToken.create({
      data: {
        weddingId: wedding.id,
        guestId: guest.id,
        token: `rsvp-${Date.now()}`,
      },
    });
    const asset = await tx.fileAsset.create({
      data: {
        ownerType: "WEDDING",
        ownerId: wedding.id,
        purpose: "INSPIRATION",
        fileName: "smoke.txt",
        mimeType: "text/plain",
        sizeBytes: 5,
        provider: "database",
        uploadedByUserId: user.id,
        storageKey: "smoke/key.txt",
      },
    });
    const notification = await tx.notification.create({
      data: {
        recipientUserId: user.id,
        type: "SYSTEM",
        payload: { to: user.email, subject: "[Smoke] Notification", template: "smoke" },
      },
    });
    const profileView = await tx.profileViewEvent.create({
      data: {
        vendorBusinessId: vendor.id,
        viewerUserId: user.id,
        weddingId: wedding.id,
        source: "smoke",
      },
    });

    assert(invite.status === "ACTIVE", "Invite creation failed.");
    assert(readState.userId === user.id, "Read state failed.");
    assert(pitch.opportunityId === opportunity.id, "Pitch creation failed.");
    assert(invoice.amountCents === 100000, "Invoice creation failed.");
    assert(payment.budgetItemId === budgetItem.id, "Budget payment schedule failed.");
    assert(call.conversationId === conversation.id, "Scheduled call failed.");
    assert(token.guestId === guest.id, "Public RSVP token failed.");
    assert(asset.storageKey, "File asset metadata failed.");
    assert(notification.status === "QUEUED", "Notification queue failed.");
    assert(profileView.source === "smoke", "Profile view event failed.");

    summary = {
      invite: invite.code,
      opportunityId: opportunity.id,
      pitchId: pitch.id,
      invoiceId: invoice.id,
      paymentId: payment.id,
      callId: call.id,
      tokenId: token.id,
      assetId: asset.id,
      notificationId: notification.id,
      profileViewId: profileView.id,
    };

    throw new Error(rollbackToken);
  });
} catch (error) {
  if (error instanceof Error && error.message === rollbackToken && summary) {
    console.log(JSON.stringify({ ok: true, rolledBack: true, summary }, null, 2));
  } else {
    console.error(error);
    process.exitCode = 1;
  }
} finally {
  await prisma.$disconnect();
}
