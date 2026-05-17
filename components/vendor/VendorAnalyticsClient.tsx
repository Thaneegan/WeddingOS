"use client";

import { ChartNoAxesCombined, CircleDollarSign, Eye, Percent } from "lucide-react";
import { VendorAnalyticsChart } from "@/components/charts/VendorAnalyticsChart";
import { ImagePlaceholder } from "@/components/shared/ImagePlaceholder";
import { MetricCard } from "@/components/shared/MetricCard";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { formatCurrency } from "@/lib/utils";
import type { CoreVendorAnalyticsData } from "@/types/core";

export function VendorAnalyticsClient({ data }: { data: CoreVendorAnalyticsData }) {
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Vendor portal" title="Analytics" description="Marketplace performance, source attribution, conversion, and booked revenue computed from vendor records." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Profile views" value={data.profileViews.toLocaleString("en-CA")} detail="Projected from profile activity" icon={Eye} tone="gold" />
        <MetricCard label="Leads received" value={`${data.leadsReceived}`} detail="CRM records" icon={ChartNoAxesCombined} tone="green" />
        <MetricCard label="Conversion rate" value={`${data.conversionRate}%`} detail="Lead to booking" icon={Percent} tone="rose" />
        <MetricCard label="Revenue booked" value={formatCurrency(data.revenueBooked)} detail="Confirmed bookings" icon={CircleDollarSign} tone="ink" />
      </div>
      <VendorAnalyticsChart views={data.views} sources={data.sources} />
      <section className="rounded-2xl border border-[#e7dfd3] bg-white p-5 luxury-shadow">
        <SectionHeader title="Top portfolio images" />
        <div className="grid gap-4 sm:grid-cols-3">
          {data.topImages.filter(Boolean).map((image) => (
            <img key={image} src={image} alt="Portfolio highlight" className="h-48 w-full rounded-2xl object-cover" />
          ))}
          {!data.topImages.filter(Boolean).length ? <ImagePlaceholder label="Portfolio" className="h-48 w-full rounded-2xl" /> : null}
        </div>
      </section>
    </div>
  );
}
