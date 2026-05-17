import { auth } from "@/auth";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

const userInclude = {
  memberships: {
    include: {
      organization: {
        include: {
          vendorBusinesses: true,
        },
      },
    },
  },
  weddingMemberships: {
    include: {
      wedding: true,
    },
  },
  workspacePreference: true,
  waitlistSignup: true,
} as const;

async function getUserById(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: userInclude,
  });
}

async function getLocalFallbackUser() {
  return prisma.user.findUnique({
    where: { email: "maya@weddingos.local" },
    include: userInclude,
  });
}

export async function getCurrentUser() {
  const session = await auth();
  const user = session?.user?.id ? await getUserById(session.user.id) : null;

  if (user) {
    if (user.waitlistSignup?.status === "PENDING" && user.memberships.length === 0 && user.weddingMemberships.length === 0) {
      redirect("/waitlist");
    }

    return user;
  }

  if (env.BETA_MODE !== "true" && env.LOCAL_AUTH_FALLBACK === "true" && env.NODE_ENV !== "production") {
    const fallbackUser = await getLocalFallbackUser();
    if (fallbackUser) return fallbackUser;
  }

  throw new Error("Authenticated user is missing. Sign in or run `npm run prisma:seed` for local seeded fallback.");
}

export async function getCurrentWeddingContext() {
  const user = await getCurrentUser();
  if (user.accountType !== "COUPLE") {
    throw new Error("This account is not a couple account.");
  }
  const preferredWeddingId = user.workspacePreference?.activeWeddingId;
  const weddingMembership =
    (preferredWeddingId ? user.weddingMemberships.find((item) => item.weddingId === preferredWeddingId) : null) ??
    user.weddingMemberships[0];

  if (!weddingMembership) {
    throw new Error("Current user does not belong to a wedding workspace.");
  }

  return {
    user,
    weddingId: weddingMembership.weddingId,
    wedding: weddingMembership.wedding,
    role: weddingMembership.role,
  };
}

export async function assertWeddingAccess(weddingId: string) {
  const user = await getCurrentUser();
  if (user.accountType !== "COUPLE") {
    throw new Error("This account is not a couple account.");
  }
  const membership = user.weddingMemberships.find((item) => item.weddingId === weddingId);

  if (!membership) {
    throw new Error("You do not have access to this wedding workspace.");
  }

  return { user, membership };
}

export const requireWeddingAccess = assertWeddingAccess;

export async function getCurrentVendorContext(vendorBusinessId?: string) {
  const user = await getCurrentUser();
  if (user.accountType !== "VENDOR") {
    throw new Error("This account is not a vendor account.");
  }
  const vendorMemberships = user.memberships.flatMap((membership) =>
    membership.organization.vendorBusinesses.map((vendorBusiness) => ({
      membership,
      vendorBusiness,
    })),
  );
  const preferredVendorBusinessId = user.workspacePreference?.activeVendorBusinessId;
  const selected = vendorBusinessId
    ? vendorMemberships.find((item) => item.vendorBusiness.id === vendorBusinessId)
    : preferredVendorBusinessId
      ? vendorMemberships.find((item) => item.vendorBusiness.id === preferredVendorBusinessId) ?? vendorMemberships[0]
    : vendorMemberships[0];

  if (!selected) {
    throw new Error("Current user does not belong to this vendor workspace.");
  }

  return {
    user,
    organizationId: selected.membership.organizationId,
    role: selected.membership.role,
    vendorBusinessId: selected.vendorBusiness.id,
    vendorBusiness: selected.vendorBusiness,
  };
}

export async function assertVendorAccess(vendorBusinessId: string) {
  return getCurrentVendorContext(vendorBusinessId);
}

export const requireVendorAccess = assertVendorAccess;

export async function getCurrentWorkspace() {
  const user = await getCurrentUser();
  const preference = user.workspacePreference;

  if (user.accountType === "VENDOR" && preference?.activeType === "VENDOR" && preference.activeVendorBusinessId) {
    const vendorContext = await getCurrentVendorContext(preference.activeVendorBusinessId);
    return { type: "vendor" as const, ...vendorContext };
  }

  if (user.accountType === "ADMIN" && preference?.activeType === "ADMIN") {
    const adminMembership = user.memberships.find((item) => item.organization.type === "ADMIN");
    if (adminMembership) {
      return { type: "admin" as const, user, organizationId: adminMembership.organizationId, role: adminMembership.role };
    }
  }

  if (user.accountType === "COUPLE" && preference?.activeWeddingId) {
    const weddingMembership = user.weddingMemberships.find((item) => item.weddingId === preference.activeWeddingId);
    if (weddingMembership) {
      return {
        type: "wedding" as const,
        user,
        weddingId: weddingMembership.weddingId,
        wedding: weddingMembership.wedding,
        role: weddingMembership.role,
      };
    }
  }

  if (user.accountType === "COUPLE" && user.weddingMemberships[0]) {
    const weddingMembership = user.weddingMemberships[0];
    return {
      type: "wedding" as const,
      user,
      weddingId: weddingMembership.weddingId,
      wedding: weddingMembership.wedding,
      role: weddingMembership.role,
    };
  }

  const vendorContext = user.accountType === "VENDOR" ? await getCurrentVendorContext().catch(() => null) : null;
  if (vendorContext) return { type: "vendor" as const, ...vendorContext };

  const adminMembership = user.memberships.find((item) => item.organization.type === "ADMIN");
  if (adminMembership) {
    return { type: "admin" as const, user, organizationId: adminMembership.organizationId, role: adminMembership.role };
  }

  throw new Error("Current user does not belong to a workspace.");
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (user.accountType !== "ADMIN") {
    throw new Error("You do not have platform admin access.");
  }
  const membership = user.memberships.find((item) => item.organization.type === "ADMIN");

  if (!membership) {
    throw new Error("You do not have platform admin access.");
  }

  return { user, membership };
}
