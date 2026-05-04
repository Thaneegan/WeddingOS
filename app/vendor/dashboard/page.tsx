"use client";

import Link from "next/link";
import { CalendarDays, ChartNoAxesCombined, CircleDollarSign, Eye, Inbox, Percent, Timer, UsersRound } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageWrapper } from "@/components/animations/PageWrapper";
import { MetricCard } from "@/components/shared/MetricCard";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useWeddingStore } from "@/store/useWeddingStore";

export default function VendorDashboardPage() {
  const leads = useWeddingStore((state) => state.leads);
  const clientRecords = useWeddingStore((state) => state.clientRecords);
  const newLeads = leads.filter((lead) => lead.stage === "New Inquiry").length;
  const activeClients = clientRecords.length;
  const bookedRevenue = leads.filter((lead) => lead.stage === "Booked").reduce((sum, lead) => sum + lead.estimatedValue, 0);

  return (
    <AppLayout mode="vendor">
      <PageWrapper>
        <div className="space-y-6">
          <SectionHeader eyebrow="Vendor portal" title="Golden Lens Photography" description="A vendor operating system for profile performance, lead follow-up, client management, and bookings." />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Profile views" value="1,460" detail="+14% this month" icon={Eye} tone="gold" />
            <MetricCard label="New leads" value={`${newLeads}`} detail="Needs response" icon={Inbox} tone="rose" />
            <MetricCard label="Active clients" value={`${activeClients}`} detail="Across 2026 weddings" icon={UsersRound} tone="green" />
            <MetricCard label="Upcoming weddings" value="4" detail="Next 90 days" icon={CalendarDays} tone="ink" />
            <MetricCard label="Monthly revenue" value={formatCurrency(bookedRevenue + 18400)} detail="Booked and pending" icon={CircleDollarSign} tone="gold" />
            <MetricCard label="Response rate" value="94%" detail="Marketplace benchmark" icon={Timer} tone="green" />
            <MetricCard label="Conversion" value="38%" detail="Quote to booking" icon={Percent} tone="rose" />
            <MetricCard label="Profile score" value="86%" detail="Add more galleries" icon={ChartNoAxesCombined} tone="ink" />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
            <section className="rounded-2xl border border-[#e7dfd3] bg-white p-5 luxury-shadow">
              <SectionHeader title="Recent inquiries" action={<Link href="/vendor/leads" className="rounded-full bg-[#191714] px-4 py-2 text-sm font-semibold text-white">Open pipeline</Link>} />
              <div className="space-y-3">
                {leads.slice(0, 5).map((lead) => (
                  <article key={lead.id} className="grid gap-3 rounded-2xl border border-[#eee7dd] p-4 md:grid-cols-[1fr_120px_120px] md:items-center">
                    <div>
                      <p className="font-semibold">{lead.coupleNames}</p>
                      <p className="mt-1 text-sm text-[#6f6a61]">{lead.lastMessage}</p>
                    </div>
                    <StatusBadge tone={lead.stage === "Booked" ? "green" : lead.stage === "Lost" ? "rose" : "gold"}>{lead.stage}</StatusBadge>
                    <p className="text-sm font-semibold">{formatCurrency(lead.estimatedValue)}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-[#e7dfd3] bg-white p-5 luxury-shadow">
              <SectionHeader title="Upcoming event schedule" />
              <div className="space-y-3">
                {clientRecords.slice(0, 4).map((client) => (
                  <article key={client.id} className="rounded-2xl bg-[#faf7f1] p-4">
                    <p className="font-semibold">{client.coupleNames}</p>
                    <p className="mt-1 text-sm text-[#6f6a61]">{formatDate(client.weddingDate)} - {client.packageName}</p>
                  </article>
                ))}
              </div>
              <div className="mt-5 rounded-2xl border border-[#eadcc6] bg-[#fbf5ec] p-4">
                <p className="font-semibold">Improve profile</p>
                <p className="mt-1 text-sm leading-6 text-[#6f6a61]">Add two more South Asian fusion galleries to improve match quality for Toronto couples.</p>
              </div>
            </section>
          </div>
        </div>
      </PageWrapper>
    </AppLayout>
  );
}
