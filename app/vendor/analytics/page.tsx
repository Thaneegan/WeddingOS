"use client";

import dynamic from "next/dynamic";
import { ChartNoAxesCombined, CircleDollarSign, Eye, Percent } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageWrapper } from "@/components/animations/PageWrapper";
import { MetricCard } from "@/components/shared/MetricCard";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { formatCurrency } from "@/lib/utils";

const VendorAnalyticsChart = dynamic(
  () => import("@/components/charts/VendorAnalyticsChart").then((mod) => mod.VendorAnalyticsChart),
  {
    ssr: false,
    loading: () => (
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="h-96 rounded-2xl border border-[#e7dfd3] bg-white p-5 luxury-shadow" />
        <div className="h-96 rounded-2xl border border-[#e7dfd3] bg-white p-5 luxury-shadow" />
      </div>
    ),
  },
);

export default function VendorAnalyticsPage() {
  return (
    <AppLayout mode="vendor">
      <PageWrapper>
        <div className="space-y-6">
          <SectionHeader eyebrow="Vendor portal" title="Analytics" description="Mock vendor analytics for marketplace performance, source attribution, conversion, and revenue." />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Profile views" value="1,460" detail="Last 30 days" icon={Eye} tone="gold" />
            <MetricCard label="Leads received" value="42" detail="+17% month over month" icon={ChartNoAxesCombined} tone="green" />
            <MetricCard label="Conversion rate" value="38%" detail="Quote to booking" icon={Percent} tone="rose" />
            <MetricCard label="Revenue booked" value={formatCurrency(42800)} detail="Current pipeline" icon={CircleDollarSign} tone="ink" />
          </div>
          <VendorAnalyticsChart />
          <section className="rounded-2xl border border-[#e7dfd3] bg-white p-5 luxury-shadow">
            <SectionHeader title="Top portfolio images" />
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=800&q=80",
              ].map((image) => (
                <img key={image} src={image} alt="Portfolio highlight" className="h-48 w-full rounded-2xl object-cover" />
              ))}
            </div>
          </section>
        </div>
      </PageWrapper>
    </AppLayout>
  );
}
