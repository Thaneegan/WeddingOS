"use client";

import { Building2, CircleDollarSign, ClipboardList, Store, Tags, UsersRound } from "lucide-react";
import { MetricCard } from "@/components/shared/MetricCard";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { formatCurrency } from "@/lib/utils";
import type { CoreAdminData } from "@/types/core";

export function AdminMetricsClient({ data }: { data: CoreAdminData }) {
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Optional admin" title="Platform metrics" description="A database-backed admin snapshot for marketplace supply, planning demand, and category customization." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Vendors" value={data.vendors.toLocaleString("en-CA")} detail="Vendor businesses" icon={Store} tone="gold" />
        <MetricCard label="Projected GMV" value={formatCurrency(data.projectedGMV)} detail="Modeled first 12 months" icon={CircleDollarSign} tone="ink" />
        <MetricCard label="Users" value={data.users.toLocaleString("en-CA")} detail={`${data.weddings} wedding workspace${data.weddings === 1 ? "" : "s"}`} icon={UsersRound} tone="green" />
        <MetricCard label="Categories" value={data.categories.toLocaleString("en-CA")} detail={`${data.customCategories} custom categories`} icon={Building2} tone="rose" />
        <MetricCard label="Inquiries" value={data.inquiries.toLocaleString("en-CA")} detail="Quote requests" icon={ClipboardList} tone="gold" />
        <MetricCard label="Bookings" value={data.bookings.toLocaleString("en-CA")} detail="Confirmed vendor relationships" icon={Tags} tone="green" />
        <MetricCard label="Booked revenue" value={formatCurrency(data.bookedRevenue)} detail="Tracked obligations only" icon={CircleDollarSign} tone="ink" />
        <MetricCard label="Customization" value={`${data.customCategories}`} detail="Private taxonomy records" icon={Tags} tone="rose" />
      </div>
    </div>
  );
}
