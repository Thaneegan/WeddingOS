import { redirect } from "next/navigation";
import { CategoryScope, CategoryType } from "@prisma/client";
import { PageWrapper } from "@/components/animations/PageWrapper";
import { OnboardingWizard } from "@/components/couple/OnboardingWizard";
import { AppLayout } from "@/components/layout/AppLayout";
import { getCurrentWorkspace, getCurrentWeddingContext } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function dateInputValue(value: Date) {
  return value.toISOString().slice(0, 10);
}

export default async function OnboardingPage() {
  const workspace = await getCurrentWorkspace();
  if (workspace.type === "vendor") redirect("/vendor/dashboard");
  if (workspace.type === "admin") redirect("/admin");

  const { wedding } = await getCurrentWeddingContext();
  const [vendorCategories, savedVendorNeeds, eventRows] = await Promise.all([
    prisma.category.findMany({
      where: {
        type: CategoryType.VENDOR_SERVICE,
        scope: CategoryScope.GLOBAL,
        archivedAt: null,
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true },
    }),
    prisma.vendorOpportunity.findMany({
      where: {
        weddingId: wedding.id,
        categoryId: { not: null },
        OR: [{ title: { startsWith: "Setup need:" } }, { status: "OPEN" }],
      },
      select: { categoryId: true },
    }),
    prisma.weddingEvent.findMany({
      where: { weddingId: wedding.id },
      select: { type: true },
    }),
  ]);
  const savedVendorCategoryIds = Array.from(new Set(savedVendorNeeds.map((need) => need.categoryId).filter((id): id is string => Boolean(id))));

  return (
    <AppLayout>
      <PageWrapper>
        <OnboardingWizard
          initialWedding={{
            coupleNames: wedding.coupleNames,
            weddingDate: dateInputValue(wedding.date),
            location: wedding.location,
            style: wedding.style,
            budget: wedding.budgetCents / 100,
            guestCount: wedding.guestCount,
          }}
          vendorCategories={vendorCategories}
          initialVendorCategoryIds={savedVendorCategoryIds}
          initialEventTypes={eventRows.map((event) => event.type)}
        />
      </PageWrapper>
    </AppLayout>
  );
}
