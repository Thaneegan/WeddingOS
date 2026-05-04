"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { PageWrapper } from "@/components/animations/PageWrapper";
import { BudgetOverview } from "@/components/couple/BudgetOverview";
import { SectionHeader } from "@/components/shared/SectionHeader";

export default function BudgetPage() {
  return (
    <AppLayout>
      <PageWrapper>
        <SectionHeader eyebrow="Couple workspace" title="Budget tracker" description="Track committed spend, deposits, upcoming payments, and vendor-linked expenses." />
        <BudgetOverview />
      </PageWrapper>
    </AppLayout>
  );
}
