"use server";

import bcrypt from "bcryptjs";
import { InviteRole, InviteStatus, MoneyStatus, UserAccountType, WorkspaceType } from "@prisma/client";
import { signIn } from "@/auth";
import { prisma } from "@/lib/prisma";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function moneyToCents(value: number) {
  return Math.round(value * 100);
}

function addMonths(value: Date, months: number) {
  const date = new Date(value);
  date.setMonth(date.getMonth() + months);
  return date;
}

function passwordRequirementError(value: string) {
  if (value.length < 12) return "Password must be at least 12 characters.";
  if (!/[a-z]/.test(value)) return "Password needs a lowercase letter.";
  if (!/[A-Z]/.test(value)) return "Password needs an uppercase letter.";
  if (!/[0-9]/.test(value)) return "Password needs a number.";
  if (!/[^A-Za-z0-9]/.test(value)) return "Password needs a symbol.";
  return null;
}

export async function signupWithInvite(
  _previousState: { error?: string; invalidInvite?: boolean } | undefined,
  formData: FormData,
) {
  const code = String(formData.get("code") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const partnerName = String(formData.get("partnerName") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const accountType = String(formData.get("accountType") ?? "").trim();
  const waitlistRequested = String(formData.get("waitlistRequested") ?? "") === "true";
  const passwordError = passwordRequirementError(password);

  if (!code || !email || !name || passwordError) {
    return { error: passwordError ?? "Enter an invite code, name, email, and a secure password." };
  }
  if (accountType !== "couple" && accountType !== "vendor") {
    return { error: "Choose Couple or Vendor before creating your account." };
  }
  if (accountType === "couple" && !partnerName) {
    return { error: "Enter your partner's name before creating your account." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "An account already exists for this email. Sign in and ask for a member invite if needed." };
  const existingWaitlistSignup = await prisma.waitlistSignup.findUnique({ where: { email } });
  if (existingWaitlistSignup) {
    return { error: "This email is already on the waitlist. Sign in to view your access status." };
  }

  const invite = await prisma.invite.findUnique({ where: { code } });
  const invalidInvite =
    !invite ||
    invite.status !== InviteStatus.ACTIVE ||
    Boolean(invite.expiresAt && invite.expiresAt < new Date()) ||
    Boolean(invite.email && invite.email.toLowerCase() !== email) ||
    ((invite.role === InviteRole.COUPLE_OWNER || invite.role === InviteRole.WEDDING_MEMBER) && accountType !== "couple") ||
    ((invite.role === InviteRole.VENDOR_OWNER || invite.role === InviteRole.VENDOR_MEMBER) && accountType !== "vendor");

  if (invalidInvite) {
    if (!waitlistRequested) {
      return { invalidInvite: true };
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          name,
          accountType: accountType === "vendor" ? UserAccountType.VENDOR : UserAccountType.COUPLE,
          passwordHash,
          emailVerified: new Date(),
        },
      });

      await tx.waitlistSignup.create({
        data: {
          userId: user.id,
          email,
          name,
          partnerName: accountType === "couple" ? partnerName : null,
          accountType,
          attemptedInviteCode: code,
        },
      });
    });

    await signIn("credentials", {
      email,
      password,
      redirectTo: "/waitlist",
    });

    return {};
  }

  const activeInvite = invite;
  const passwordHash = await bcrypt.hash(password, 10);
  let redirectTo = "/dashboard";

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        name,
        accountType:
          activeInvite.role === InviteRole.ADMIN
            ? UserAccountType.ADMIN
            : accountType === "vendor"
              ? UserAccountType.VENDOR
              : UserAccountType.COUPLE,
        passwordHash,
        emailVerified: new Date(),
      },
    });

    if (activeInvite.role === InviteRole.COUPLE_OWNER) {
      const coupleNames = String(formData.get("coupleNames") ?? "").trim() || `${name} & ${partnerName}`;
      const location = String(formData.get("location") ?? "").trim() || "Toronto, Ontario";
      const style = String(formData.get("style") ?? "").trim() || "Modern luxury";
      const date = String(formData.get("date") ?? "") || new Date(Date.now() + 1000 * 60 * 60 * 24 * 180).toISOString();
      const budget = Number(formData.get("budget") ?? 35000);
      const guestCount = Number(formData.get("guestCount") ?? 100);
      const weddingDate = new Date(date);
      const budgetValue = Number.isFinite(budget) ? budget : 35000;
      const slug = `${slugify(coupleNames)}-${Date.now().toString(36)}`;
      const organization = await tx.organization.create({
        data: {
          name: `${coupleNames} Planning`,
          slug: `${slug}-org`,
          type: "COUPLE",
          memberships: { create: { userId: user.id, role: "OWNER" } },
        },
      });
      const wedding = await tx.wedding.create({
        data: {
          organizationId: organization.id,
          coupleNames,
          slug,
          date: weddingDate,
          location,
          style,
          budgetCents: moneyToCents(budgetValue),
          guestCount: Number.isFinite(guestCount) ? guestCount : 100,
          members: { create: { userId: user.id, role: "OWNER" } },
        },
      });
      const budgetCategories = await Promise.all(
        [
          ["Venue", "#191714", "Building2"],
          ["Catering", "#8a6332", "Utensils"],
          ["Photo + Video", "#61735f", "Camera"],
          ["Decor + Florals", "#93484d", "Sparkles"],
          ["Music + Entertainment", "#c8a97e", "Music"],
          ["Custom Costs", "#61735f", "WalletCards"],
        ].map(([categoryName, color, icon], index) =>
          tx.category.create({
            data: {
              name: categoryName,
              slug: `${slug}-${slugify(categoryName)}`,
              type: "BUDGET",
              scope: "WEDDING",
              ownerWeddingId: wedding.id,
              color,
              icon,
              sortOrder: index,
            },
          }),
        ),
      );
      const taskCategories = await Promise.all(
        [
          ["Planning", "#c8a97e", "ListChecks"],
          ["Vendors", "#191714", "Store"],
          ["Guests", "#61735f", "UsersRound"],
          ["Design", "#93484d", "Sparkles"],
        ].map(([categoryName, color, icon], index) =>
          tx.category.create({
            data: {
              name: categoryName,
              slug: `${slug}-task-${slugify(categoryName)}`,
              type: "TASK",
              scope: "WEDDING",
              ownerWeddingId: wedding.id,
              color,
              icon,
              sortOrder: index,
            },
          }),
        ),
      );
      const budgetByName = new Map(budgetCategories.map((category) => [category.name, category.id]));
      const taskByName = new Map(taskCategories.map((category) => [category.name, category.id]));
      await tx.budgetItem.createMany({
        data: [
          ["Venue target", "Venue", 0.3],
          ["Catering target", "Catering", 0.25],
          ["Photo and video target", "Photo + Video", 0.15],
          ["Decor and florals target", "Decor + Florals", 0.12],
          ["Entertainment target", "Music + Entertainment", 0.06],
          ["Planning reserve", "Custom Costs", 0.03],
        ].map(([label, categoryName, ratio]) => ({
          weddingId: wedding.id,
          categoryId: budgetByName.get(String(categoryName)) ?? budgetCategories[0].id,
          label: String(label),
          amountCents: moneyToCents(budgetValue * Number(ratio)),
          dueDate: addMonths(new Date(), 1),
          status: MoneyStatus.PLANNED,
        })),
      });
      await tx.timelineTask.createMany({
        data: [
          ["Complete wedding profile", "Onboarding", "Planning", new Date(), "High"],
          ["Shortlist venue options", "12 months before", "Vendors", addMonths(weddingDate, -12), "High"],
          ["Request priority vendor quotes", "9 months before", "Vendors", addMonths(weddingDate, -9), "High"],
          ["Finalize guest groups", "6 months before", "Guests", addMonths(weddingDate, -6), "Medium"],
          ["Confirm design direction", "6 months before", "Design", addMonths(weddingDate, -6), "Medium"],
          ["Review payment schedule", "3 months before", "Planning", addMonths(weddingDate, -3), "Medium"],
        ].map(([title, group, categoryName, dueDate, priority]) => ({
          weddingId: wedding.id,
          categoryId: taskByName.get(String(categoryName)),
          title: String(title),
          group: String(group),
          dueDate: dueDate as Date,
          priority: String(priority),
        })),
      });
      await tx.guestGroup.createMany({
        data: ["Family", "Friends", "Wedding party", "Vendor meals"].map((groupName) => ({ weddingId: wedding.id, name: groupName })),
      });
      const vendorCategories = await tx.category.findMany({
        where: { type: "VENDOR_SERVICE", name: { in: ["Venues", "Photography", "Catering", "Decor", "DJ / Music"] } },
      });
      await tx.vendorOpportunity.createMany({
        data: vendorCategories.slice(0, 4).map((category) => ({
          weddingId: wedding.id,
          categoryId: category.id,
          title: `${category.name} needed for ${coupleNames}`,
          description: `Looking for ${category.name.toLowerCase()} support for a ${style} wedding in ${location}.`,
          budgetCents: moneyToCents(budgetValue * 0.1),
          location,
          date: weddingDate,
          guestCount: Number.isFinite(guestCount) ? guestCount : 100,
        })),
      });
      await tx.workspacePreference.create({
        data: {
          userId: user.id,
          activeType: WorkspaceType.WEDDING,
          activeOrganizationId: organization.id,
          activeWeddingId: wedding.id,
        },
      });
      redirectTo = "/onboarding";
    } else if (activeInvite.role === InviteRole.VENDOR_OWNER) {
      const businessName = String(formData.get("businessName") ?? "").trim() || `${name} Weddings`;
      const location = String(formData.get("location") ?? "").trim() || "Toronto, Ontario";
      const serviceName = String(formData.get("serviceName") ?? "").trim() || "Signature Service";
      const about = String(formData.get("about") ?? "").trim() || `${businessName} is accepting wedding inquiries through Wedding OS.`;
      const startingPrice = Number(formData.get("startingPrice") ?? 2500);
      const responseTime = String(formData.get("responseTime") ?? "").trim() || "1 day";
      const socials = String(formData.get("socials") ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      const categoryId = String(formData.get("categoryId") ?? "").trim();
      const slug = `${slugify(businessName)}-${Date.now().toString(36)}`;
      const category =
        (categoryId
          ? await tx.category.findFirst({ where: { id: categoryId, type: "VENDOR_SERVICE", archivedAt: null } })
          : null) ??
        (await tx.category.findFirst({ where: { type: "VENDOR_SERVICE", archivedAt: null }, orderBy: { sortOrder: "asc" } })) ??
        (await tx.category.create({
          data: { name: "Wedding Services", slug: `${slug}-services`, type: "VENDOR_SERVICE", scope: "GLOBAL" },
        }));
      const organization = await tx.organization.create({
        data: {
          name: businessName,
          slug: `${slug}-org`,
          type: "VENDOR",
          memberships: { create: { userId: user.id, role: "OWNER" } },
        },
      });
      const vendorBusiness = await tx.vendorBusiness.create({
        data: {
          organizationId: organization.id,
          name: businessName,
          slug,
          location,
          startingPriceCents: moneyToCents(Number.isFinite(startingPrice) ? startingPrice : 2500),
          about,
          availability: "Accepting inquiries",
          responseTime,
          socials,
          styleTags: [category.name, "Toronto", "Wedding OS vendor"],
          matchScore: 82,
        },
      });
      await tx.vendorService.create({
        data: {
          vendorBusinessId: vendorBusiness.id,
          categoryId: category.id,
          name: serviceName,
          description: about,
          startingPriceCents: vendorBusiness.startingPriceCents,
          includes: [],
        },
      });
      await tx.vendorFaq.createMany({
        data: [
          {
            vendorBusinessId: vendorBusiness.id,
            question: "How do couples request a quote?",
            answer: "Couples can request a quote from your Wedding OS profile and the inquiry appears in your lead pipeline.",
            sortOrder: 0,
          },
          {
            vendorBusinessId: vendorBusiness.id,
            question: "Can packages be customized?",
            answer: "Yes. Add more services, package details, portfolio files, and custom categories from the vendor dashboard.",
            sortOrder: 1,
          },
        ],
      });
      await tx.portfolioItem.createMany({
        data: [
          {
            vendorBusinessId: vendorBusiness.id,
            title: "Portfolio placeholder",
            image: "",
            sortOrder: 0,
          },
        ],
      });
      await tx.workspacePreference.create({
        data: {
          userId: user.id,
          activeType: WorkspaceType.VENDOR,
          activeOrganizationId: organization.id,
          activeVendorBusinessId: vendorBusiness.id,
        },
      });
      redirectTo = "/vendor/dashboard";
    } else if (activeInvite.role === InviteRole.WEDDING_MEMBER && activeInvite.weddingId) {
      const wedding = await tx.wedding.findUniqueOrThrow({ where: { id: activeInvite.weddingId } });
      await tx.membership.create({ data: { userId: user.id, organizationId: wedding.organizationId, role: "MEMBER" } });
      await tx.weddingMember.create({ data: { userId: user.id, weddingId: wedding.id, role: "MEMBER" } });
      await tx.workspacePreference.create({
        data: { userId: user.id, activeType: WorkspaceType.WEDDING, activeOrganizationId: wedding.organizationId, activeWeddingId: wedding.id },
      });
      redirectTo = "/dashboard";
    } else if (activeInvite.role === InviteRole.VENDOR_MEMBER && activeInvite.vendorBusinessId) {
      const vendor = await tx.vendorBusiness.findUniqueOrThrow({ where: { id: activeInvite.vendorBusinessId } });
      await tx.membership.create({ data: { userId: user.id, organizationId: vendor.organizationId, role: "MEMBER" } });
      await tx.workspacePreference.create({
        data: { userId: user.id, activeType: WorkspaceType.VENDOR, activeOrganizationId: vendor.organizationId, activeVendorBusinessId: vendor.id },
      });
      redirectTo = "/vendor/dashboard";
    } else if (activeInvite.role === InviteRole.ADMIN) {
      const organization =
        activeInvite.organizationId
          ? await tx.organization.findUniqueOrThrow({ where: { id: activeInvite.organizationId } })
          : await tx.organization.upsert({
              where: { slug: "wedding-os-admin" },
              update: {},
              create: { name: "Wedding OS Admin", slug: "wedding-os-admin", type: "ADMIN" },
            });
      await tx.membership.create({ data: { userId: user.id, organizationId: organization.id, role: "ADMIN" } });
      await tx.workspacePreference.create({
        data: { userId: user.id, activeType: WorkspaceType.ADMIN, activeOrganizationId: organization.id },
      });
      redirectTo = "/admin";
    } else {
      throw new Error("Invite is missing its target workspace.");
    }

    await tx.invite.update({
      where: { id: activeInvite.id },
      data: { status: InviteStatus.ACCEPTED, acceptedByUserId: user.id, acceptedAt: new Date() },
    });
  });

  await signIn("credentials", {
    email,
    password,
    redirectTo,
  });

  return {};
}
