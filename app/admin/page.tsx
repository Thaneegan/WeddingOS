"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { PageWrapper } from "@/components/animations/PageWrapper";
import { MetricCard } from "@/components/shared/MetricCard";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { Building2, CircleDollarSign, Store, UsersRound } from "lucide-react";

export default function AdminPage() {
  return (
    <AppLayout>
      <PageWrapper>
        <SectionHeader eyebrow="Optional admin" title="Platform metrics" description="A lightweight investor-facing admin snapshot for the marketplace business." />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Vendor waitlist" value="500+" detail="Across Ontario" icon={Store} tone="gold" />
          <MetricCard label="Projected GMV" value="$2.4M" detail="First 12 months" icon={CircleDollarSign} tone="ink" />
          <MetricCard label="Couple signups" value="1,280" detail="Mock demand" icon={UsersRound} tone="green" />
          <MetricCard label="Categories" value="12" detail="Marketplace breadth" icon={Building2} tone="rose" />
        </div>
      </PageWrapper>
    </AppLayout>
  );
}
