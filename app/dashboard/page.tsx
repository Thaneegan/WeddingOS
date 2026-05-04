"use client";

import Link from "next/link";
import { Bot, CalendarDays, CircleDollarSign, Clock3, Inbox, ListChecks, UsersRound } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageWrapper } from "@/components/animations/PageWrapper";
import { MetricCard } from "@/components/shared/MetricCard";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useWeddingStore } from "@/store/useWeddingStore";

export default function DashboardPage() {
  const wedding = useWeddingStore((state) => state.wedding);
  const budgetItems = useWeddingStore((state) => state.budgetItems);
  const bookedVendorIds = useWeddingStore((state) => state.bookedVendorIds);
  const vendors = useWeddingStore((state) => state.vendors);
  const messages = useWeddingStore((state) => state.messages);
  const conversations = useWeddingStore((state) => state.conversations);
  const tasks = useWeddingStore((state) => state.tasks);
  const leads = useWeddingStore((state) => state.leads);
  const spent = budgetItems.filter((item) => item.status !== "Planned").reduce((sum, item) => sum + item.amount, 0);
  const tasksRemaining = tasks.filter((task) => !task.completed).length;
  const pendingResponses = leads.filter((lead) => lead.coupleNames === wedding.couple && lead.stage !== "Booked").length;
  const bookedVendors = vendors.filter((vendor) => bookedVendorIds.includes(vendor.id));
  const recentMessages = [...messages].slice(-4).reverse();
  const upcomingTasks = tasks.filter((task) => !task.completed).slice(0, 5);
  const daysLeft = Math.max(0, Math.ceil((new Date(wedding.date).getTime() - new Date("2026-05-04").getTime()) / 86400000));

  return (
    <AppLayout>
      <PageWrapper>
        <div className="space-y-6">
          <section className="overflow-hidden rounded-3xl border border-[#e7dfd3] bg-white luxury-shadow">
            <div className="grid gap-0 lg:grid-cols-[1fr_360px]">
              <div className="p-5 sm:p-7">
                <StatusBadge tone="gold">{wedding.style}</StatusBadge>
                <h1 className="mt-4 font-display text-4xl font-semibold sm:text-5xl">{wedding.couple} Wedding</h1>
                <p className="mt-3 text-[#6f6a61]">{formatDate(wedding.date)} - {wedding.location}</p>
                <div className="mt-6 max-w-xl">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-semibold">Budget committed</span>
                    <span>{formatCurrency(spent)} / {formatCurrency(wedding.budget)}</span>
                  </div>
                  <ProgressBar value={spent} max={wedding.budget} />
                </div>
              </div>
              <div className="relative min-h-56 bg-[#efe8dd]">
                <img
                  src="https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=900&q=80"
                  alt="Wedding table"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
                <div className="absolute bottom-5 left-5 text-white">
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-white/70">Countdown</p>
                  <p className="font-display text-5xl font-semibold">{daysLeft}</p>
                  <p className="text-sm font-semibold">days to wedding</p>
                </div>
              </div>
            </div>
          </section>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <MetricCard label="Budget spent" value={formatCurrency(spent)} detail={`of ${formatCurrency(wedding.budget)}`} icon={CircleDollarSign} tone="gold" />
            <MetricCard label="Guests invited" value={`${wedding.guestCount}`} detail="50 RSVP records loaded" icon={UsersRound} tone="green" />
            <MetricCard label="Vendors booked" value={`${bookedVendorIds.length}`} detail="Synced from CRM bookings" icon={CalendarDays} tone="ink" />
            <MetricCard label="Tasks remaining" value={`${tasksRemaining}`} detail="Across planning timeline" icon={ListChecks} tone="rose" />
            <MetricCard label="Pending responses" value={`${pendingResponses}`} detail="Open quote workflows" icon={Inbox} tone="gold" />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
            <section className="rounded-2xl border border-[#e7dfd3] bg-white p-5 luxury-shadow">
              <SectionHeader title="Confirmed vendors" action={<Link href="/marketplace" className="rounded-full bg-[#191714] px-4 py-2 text-sm font-semibold text-white">Find vendors</Link>} />
              <div className="grid gap-3 md:grid-cols-3">
                {bookedVendors.map((vendor) => (
                  <article key={vendor.id} className="rounded-2xl border border-[#eee7dd] p-4">
                    <img src={vendor.image} alt={vendor.name} className="h-28 w-full rounded-xl object-cover" />
                    <p className="mt-3 font-semibold">{vendor.name}</p>
                    <p className="mt-1 text-sm text-[#6f6a61]">{vendor.category}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-[#e7dfd3] bg-white p-5 luxury-shadow">
              <SectionHeader title="Recommended next action" />
              <div className="rounded-2xl bg-[#fbf5ec] p-5">
                <div className="flex size-11 items-center justify-center rounded-full bg-[#c8a97e] text-[#191714]">
                  <Clock3 size={20} />
                </div>
                <h3 className="mt-4 text-xl font-semibold">Book photography this week</h3>
                <p className="mt-2 text-sm leading-6 text-[#6f6a61]">
                  Golden Lens is a 96% match and your timeline still has photography open for a prime July date.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href="/marketplace/golden-lens-photography" className="rounded-full bg-[#191714] px-4 py-2 text-sm font-semibold text-white">Open vendor</Link>
                  <Link href="/planner" className="inline-flex items-center gap-2 rounded-full border border-[#d8c5aa] px-4 py-2 text-sm font-semibold text-[#7a582c]">
                    <Bot size={15} />
                    Generate plan
                  </Link>
                </div>
              </div>
            </section>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <section className="rounded-2xl border border-[#e7dfd3] bg-white p-5 luxury-shadow">
              <SectionHeader title="Recent messages" action={<Link href="/messages" className="text-sm font-semibold text-[#9a7a50]">Open inbox</Link>} />
              <div className="space-y-3">
                {recentMessages.map((message) => {
                  const conversation = conversations.find((item) => item.id === message.conversationId);
                  return (
                    <article key={message.id} className="rounded-2xl border border-[#eee7dd] p-4">
                      <p className="text-sm font-semibold">{conversation?.vendorName ?? message.senderName}</p>
                      <p className="mt-1 line-clamp-2 text-sm leading-6 text-[#6f6a61]">{message.body}</p>
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="rounded-2xl border border-[#e7dfd3] bg-white p-5 luxury-shadow">
              <SectionHeader title="Upcoming tasks" action={<Link href="/timeline" className="text-sm font-semibold text-[#9a7a50]">Open timeline</Link>} />
              <div className="space-y-3">
                {upcomingTasks.map((task) => (
                  <article key={task.id} className="flex items-center justify-between gap-3 rounded-2xl border border-[#eee7dd] p-4">
                    <div>
                      <p className="font-semibold">{task.title}</p>
                      <p className="mt-1 text-sm text-[#6f6a61]">{formatDate(task.dueDate)}</p>
                    </div>
                    <StatusBadge tone={task.priority === "High" ? "rose" : "gold"}>{task.priority}</StatusBadge>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </div>
      </PageWrapper>
    </AppLayout>
  );
}
