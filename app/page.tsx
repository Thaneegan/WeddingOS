"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CalendarCheck,
  ChartNoAxesCombined,
  CircleDollarSign,
  Gem,
  Inbox,
  MessageSquareText,
  Search,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { AnimatedText } from "@/components/animations/AnimatedText";
import { VendorCard } from "@/components/vendor/VendorCard";
import { vendors } from "@/lib/mockData";

const scatteredTools = ["Instagram DMs", "Email", "Spreadsheets", "Vendor websites", "Payment apps", "Calendar links"];
const coupleFeatures = [
  { title: "RSVP management", icon: UsersRound },
  { title: "Budget tracking", icon: CircleDollarSign },
  { title: "Vendor marketplace", icon: Search },
  { title: "Timeline", icon: CalendarCheck },
  { title: "Messaging", icon: MessageSquareText },
];
const vendorFeatures = [
  { title: "Profile storefront", icon: Gem },
  { title: "Lead pipeline", icon: Inbox },
  { title: "Client CRM", icon: UsersRound },
  { title: "Analytics", icon: ChartNoAxesCombined },
  { title: "Shared messages", icon: MessageSquareText },
];

export default function Home() {
  return (
    <main className="bg-[#FAF9F7] text-[#191714]">
      <section className="relative flex min-h-[86vh] items-end overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
        <img
          src="https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1800&q=85"
          alt="Elegant wedding reception"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#191714]/90 via-[#191714]/45 to-[#191714]/15" />
        <nav className="absolute left-4 right-4 top-4 z-10 mx-auto flex max-w-7xl items-center justify-between rounded-full border border-white/20 bg-white/12 px-4 py-3 text-white backdrop-blur sm:left-6 sm:right-6 lg:left-8 lg:right-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-full bg-white text-[#191714]">
              <Gem size={17} />
            </span>
            <span className="font-display text-xl font-semibold">Wedding OS</span>
          </Link>
          <div className="hidden items-center gap-2 md:flex">
            <Link href="/marketplace" className="rounded-full px-4 py-2 text-sm font-semibold hover:bg-white/15">Marketplace</Link>
            <Link href="/vendor/dashboard" className="rounded-full px-4 py-2 text-sm font-semibold hover:bg-white/15">Vendors</Link>
          </div>
        </nav>

        <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-8 pb-8 lg:grid-cols-[1fr_420px] lg:items-end">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur">
              <Sparkles size={16} />
              Investor demo - frontend only
            </p>
            <h1 className="max-w-4xl font-display text-5xl font-semibold leading-[0.98] text-white sm:text-6xl lg:text-7xl">
              <AnimatedText text="The Operating System for Modern Weddings" />
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/86 sm:text-xl">
              Plan the wedding. Book the team. Manage everything.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href="/dashboard" className="flex h-12 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-[#191714]">
                Start Planning
                <ArrowRight size={17} />
              </Link>
              <Link href="/marketplace" className="flex h-12 items-center justify-center rounded-full border border-white/35 px-6 text-sm font-semibold text-white backdrop-blur hover:bg-white/10">
                Explore Vendors
              </Link>
              <Link href="/vendor/dashboard" className="flex h-12 items-center justify-center rounded-full border border-white/35 px-6 text-sm font-semibold text-white backdrop-blur hover:bg-white/10">
                Vendor Portal
              </Link>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="rounded-3xl border border-white/20 bg-white/13 p-4 text-white backdrop-blur"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70">Live demo flow</p>
            <div className="mt-4 space-y-3">
              {["Request quote", "Vendor lead created", "Message thread synced", "Budget updates after booking"].map((item, index) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl bg-white/12 p-3">
                  <span className="flex size-8 items-center justify-center rounded-full bg-white text-sm font-bold text-[#191714]">{index + 1}</span>
                  <span className="font-medium">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9a7a50]">The problem</p>
              <h2 className="mt-3 font-display text-4xl font-semibold">Wedding planning is scattered across too many tools.</h2>
              <p className="mt-4 leading-7 text-[#6f6a61]">
                Couples and vendors coordinate through disconnected inboxes, social profiles, spreadsheets, calendars, and payment tools. Wedding OS brings the operational layer into one product.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {scatteredTools.map((tool, index) => (
                <motion.div
                  key={tool}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.04 }}
                  className="rounded-2xl border border-[#e7dfd3] bg-white p-5 luxury-shadow"
                >
                  <p className="font-semibold">{tool}</p>
                  <p className="mt-2 text-sm leading-6 text-[#6f6a61]">A useful tool alone, but fragmented in the full planning workflow.</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[#e7dfd3] bg-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9a7a50]">The solution</p>
            <h2 className="mt-3 font-display text-4xl font-semibold">One platform for planning, booking, messaging, budget, timeline, and vendor CRM.</h2>
          </div>
          <div className="mt-9 grid gap-5 md:grid-cols-2">
            <FeatureGroup title="Couples" items={coupleFeatures} />
            <FeatureGroup title="Vendors" items={vendorFeatures} />
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9a7a50]">Marketplace preview</p>
              <h2 className="mt-3 font-display text-4xl font-semibold">Premium Toronto vendors, ready to quote.</h2>
            </div>
            <Link href="/marketplace" className="inline-flex h-11 items-center justify-center rounded-full bg-[#191714] px-5 text-sm font-semibold text-white">
              Open marketplace
            </Link>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {vendors.slice(0, 3).map((vendor) => (
              <VendorCard vendor={vendor} key={vendor.id} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#191714] px-4 py-16 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["500+", "vendor waitlist"],
              ["$2.4M", "projected GMV"],
              ["12", "vendor categories"],
              ["1", "unified platform"],
            ].map(([value, label]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/8 p-6">
                <p className="font-display text-4xl font-semibold">{value}</p>
                <p className="mt-2 text-sm font-medium uppercase tracking-[0.16em] text-white/62">{label}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-4xl font-semibold">Run the connected investor demo.</h2>
              <p className="mt-3 max-w-2xl text-white/70">Start as the couple, request a quote, move the vendor lead, book the vendor, and generate the AI plan.</p>
            </div>
            <Link href="/dashboard" className="flex h-12 items-center justify-center rounded-full bg-[#c8a97e] px-6 text-sm font-semibold text-[#191714]">
              Start demo
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function FeatureGroup({ title, items }: { title: string; items: { title: string; icon: typeof Gem }[] }) {
  return (
    <div className="rounded-3xl border border-[#e7dfd3] bg-[#FAF9F7] p-5">
      <h3 className="font-display text-2xl font-semibold">{title}</h3>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="flex items-center gap-3 rounded-2xl bg-white p-4">
              <span className="flex size-10 items-center justify-center rounded-full bg-[#fbf5ec] text-[#9a7a50]">
                <Icon size={18} />
              </span>
              <span className="font-semibold">{item.title}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
