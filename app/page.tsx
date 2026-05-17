"use client";

import Link from "next/link";
import { motion, type Variants, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Bot,
  CalendarCheck,
  CheckCircle2,
  CircleDollarSign,
  FileText,
  Gem,
  LayoutTemplate,
  MessageSquareText,
  Search,
  ShieldCheck,
  Store,
  UsersRound,
} from "lucide-react";
import { AnimatedText } from "@/components/animations/AnimatedText";
import { WeddingBudgetHeatmap, weddingBudgetTemplateItems } from "@/components/shared/WeddingBudgetHeatmap";

const scatteredTools = ["Instagram DMs", "Email threads", "Spreadsheets", "Vendor websites", "Payment reminders", "Calendar links"];

const platformModules = [
  { title: "Marketplace", body: "Find venues, decor, food, photo, video, beauty, music, and cultural vendors.", icon: Search },
  { title: "Messages", body: "Keep every inquiry, quote, call link, document, and vendor reply in one shared thread.", icon: MessageSquareText },
  { title: "Budget", body: "Track committed spend, invoices, deposits, payment schedules, and custom categories.", icon: CircleDollarSign },
  { title: "RSVP", body: "Manage guest groups, plus-ones, meal choices, tables, reminders, and public RSVP links.", icon: UsersRound },
  { title: "Timeline", body: "Turn templates into tasks, assign vendors, and keep month-by-month planning clear.", icon: CalendarCheck },
  { title: "AI Planner", body: "Generate structured planning snapshots from real wedding context before taking action.", icon: Bot },
];

const coupleFlow = ["Create wedding workspace", "Set budget and guest estimate", "Shortlist vendors", "Request quote", "Book team", "Track the plan"];
const vendorFlow = ["Create business profile", "Publish services", "Receive inquiries", "Manage lead stages", "Book clients", "Review analytics"];
const heroSignals = ["Plan", "Book", "Message", "Budget", "RSVP", "Timeline"];
const smoothEase: [number, number, number, number] = [0.22, 1, 0.36, 1];

const heroContainer: Variants = {
  hidden: { opacity: 1 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.55 },
  },
};

const heroItem: Variants = {
  hidden: { opacity: 0, y: 24, filter: "blur(10px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.72, ease: smoothEase } },
};

export default function Home() {
  const reduceMotion = useReducedMotion();

  return (
    <main className="bg-[#FAF9F7] text-[#191714]">
      {!reduceMotion ? (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ delay: 1.05, duration: 0.55, ease: "easeOut" }}
          className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-[#191714]"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.55, ease: smoothEase }}
            className="flex items-center gap-4 text-white"
          >
            <span className="flex size-14 items-center justify-center rounded-2xl bg-white text-[#191714]">
              <Gem size={24} />
            </span>
            <span className="font-display text-3xl font-semibold">Wedding OS</span>
          </motion.div>
        </motion.div>
      ) : null}

      <section className="relative min-h-[100svh] overflow-hidden">
        <motion.img
          src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1800&q=85"
          alt="Wedding couple walking through a celebration"
          className="absolute inset-0 h-full w-full object-cover"
          initial={reduceMotion ? false : { scale: 1.08, opacity: 0.72 }}
          animate={reduceMotion ? undefined : { scale: 1, opacity: 1 }}
          transition={{ duration: 1.8, ease: smoothEase }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#191714]/92 via-[#191714]/50 to-[#191714]/20" />
        <motion.div
          className="absolute inset-x-0 top-0 h-px bg-white/40"
          initial={reduceMotion ? false : { scaleX: 0, transformOrigin: "left" }}
          animate={reduceMotion ? undefined : { scaleX: 1 }}
          transition={{ delay: 0.95, duration: 1.1, ease: smoothEase }}
        />

        <motion.nav
          initial={reduceMotion ? false : { opacity: 0, y: -18 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.65, ease: smoothEase }}
          className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-4 py-5 text-white sm:px-6 lg:px-8"
        >
          <Link href="/" className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-white text-[#191714]">
              <Gem size={20} />
            </span>
            <div>
              <p className="font-display text-xl font-semibold leading-none">Wedding OS</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/70">Planning and vendor platform</p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/login" className="hidden rounded-full px-4 py-2 text-sm font-semibold text-white hover:bg-white/12 sm:inline-flex">
              Sign in
            </Link>
            <Link href="/signup" className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#191714]">
              Get started
            </Link>
          </div>
        </motion.nav>

        <div className="relative z-10 mx-auto flex min-h-[calc(100svh-84px)] max-w-7xl items-center px-4 pb-14 sm:px-6 lg:px-8">
          <motion.div
            variants={reduceMotion ? undefined : heroContainer}
            initial={reduceMotion ? false : "hidden"}
            animate={reduceMotion ? undefined : "show"}
            className="max-w-4xl"
          >
            <motion.p variants={heroItem} className="mb-5 text-sm font-semibold uppercase tracking-[0.22em] text-white/78">
              Wedding OS
            </motion.p>
            <motion.div variants={heroItem}>
              <h1 className="font-display text-5xl font-semibold leading-[0.98] text-white sm:text-6xl lg:text-7xl">
                <AnimatedText text="One operating system for weddings." />
              </h1>
            </motion.div>
            <motion.p variants={heroItem} className="mt-7 max-w-2xl text-2xl font-semibold leading-9 text-white sm:text-3xl">
              Plan the wedding. Book the team. Manage everything.
            </motion.p>
            <motion.p variants={heroItem} className="mt-5 max-w-xl text-base leading-7 text-white/78 sm:text-lg">
              Wedding OS brings couples, vendors, messages, budgets, RSVPs, timelines, documents, and bookings into one connected workspace.
            </motion.p>
            <motion.div variants={heroItem} className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link href="/signup" className="flex h-12 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-[#191714]">
                Join with invite
                <ArrowRight size={17} />
              </Link>
              <Link href="/login" className="flex h-12 items-center justify-center rounded-full border border-white/35 px-6 text-sm font-semibold text-white backdrop-blur hover:bg-white/10">
                Sign in
              </Link>
            </motion.div>
            <motion.div variants={heroItem} className="mt-10 flex flex-wrap gap-3">
              {heroSignals.map((signal, index) => (
                <motion.span
                  key={signal}
                  initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                  animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                  transition={{ delay: 1.1 + index * 0.08, duration: 0.45 }}
                  className="rounded-full border border-white/20 bg-white/12 px-3.5 py-2 text-sm font-semibold text-white backdrop-blur"
                >
                  {signal}
                </motion.span>
              ))}
            </motion.div>
          </motion.div>
        </div>

        {!reduceMotion ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.6, duration: 0.5 }}
            className="absolute bottom-5 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/70 sm:flex"
          >
            <span>Explore</span>
            <motion.span
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              className="h-8 w-px bg-white/55"
            />
          </motion.div>
        ) : null}
      </section>

      <section className="border-y border-[#e7dfd3] bg-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9a7a50]">For both sides</p>
            <h2 className="mt-3 font-display text-4xl font-semibold">Couples get planning depth. Vendors get a real client pipeline.</h2>
          </div>
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            <AudienceCard
              title="For couples"
              icon={UsersRound}
              description="Build the wedding workspace, invite collaborators, compare vendors, request quotes, manage RSVPs, track payments, and keep every message in context."
              items={coupleFlow}
              href="/signup"
              cta="Start couple onboarding"
            />
            <AudienceCard
              title="For vendors"
              icon={Store}
              description="Publish a profile, manage incoming inquiries, move leads through a CRM, message couples, schedule calls, track booked clients, and see analytics."
              items={vendorFlow}
              href="/signup"
              cta="Start vendor onboarding"
            />
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.85fr_1fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9a7a50]">Why it exists</p>
              <h2 className="mt-3 font-display text-4xl font-semibold">Weddings are managed across too many disconnected places.</h2>
              <p className="mt-4 leading-7 text-[#6f6a61]">
                Couples and vendors usually coordinate through social media, email, spreadsheets, calendars, payment apps, and separate vendor websites. Wedding OS gives both sides one shared system of record.
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
                  <p className="mt-2 text-sm leading-6 text-[#6f6a61]">Useful alone, messy when every wedding decision depends on all of them.</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9a7a50]">Platform modules</p>
            <h2 className="mt-3 font-display text-4xl font-semibold">The operational tools a wedding needs in one place.</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {platformModules.map((module) => {
              const Icon = module.icon;
              return (
                <article key={module.title} className="rounded-2xl border border-[#e7dfd3] bg-white p-5 luxury-shadow">
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-[#fbf5ec] text-[#9a7a50]">
                    <Icon size={19} />
                  </div>
                  <h3 className="mt-4 font-display text-xl font-semibold text-[#191714]">{module.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#6f6a61]">{module.body}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-[#e7dfd3] bg-[#fffdf9] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <WeddingBudgetHeatmap
            title="Understand the wedding at a glance"
            description="Templates show how major wedding decisions usually affect spend, then each couple can customize categories for their own culture, priorities, and vendors."
            items={weddingBudgetTemplateItems}
            templateHrefBase="/signup?intent=budget-template"
            itemActionLabel="Join to customize this template"
          />
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-3">
          {[
            { title: "Private workspace access", body: "Invite-based accounts keep couples, vendors, members, and admins scoped to the right workspace.", icon: ShieldCheck },
            { title: "Custom categories", body: "Couples and vendors can create their own budget, task, guest, and service categories.", icon: LayoutTemplate },
            { title: "Tracking-only payments", body: "Invoices, deposits, contracts, and schedules are tracked without moving real money.", icon: FileText },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="rounded-2xl border border-[#e7dfd3] bg-white p-5 luxury-shadow">
                <Icon size={22} className="text-[#9a7a50]" />
                <h3 className="mt-4 font-display text-xl font-semibold text-[#191714]">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#6f6a61]">{item.body}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="bg-[#191714] px-4 py-16 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["14+", "vendor categories"],
              ["2", "connected portals"],
              ["1", "shared conversation hub"],
              ["0", "real payments moved"],
            ].map(([value, label]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/8 p-6">
                <p className="font-display text-4xl font-semibold">{value}</p>
                <p className="mt-2 text-sm font-medium uppercase tracking-[0.16em] text-white/62">{label}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-4xl font-semibold">Ready to enter Wedding OS?</h2>
              <p className="mt-3 max-w-2xl text-white/70">Join with an invite code or sign in to continue planning, selling, and coordinating.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/signup" className="flex h-12 items-center justify-center rounded-full bg-[#c8a97e] px-6 text-sm font-semibold text-[#191714]">
                Get started
              </Link>
              <Link href="/login" className="flex h-12 items-center justify-center rounded-full border border-white/25 px-6 text-sm font-semibold text-white">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function AudienceCard({
  title,
  icon: Icon,
  description,
  items,
  href,
  cta,
}: {
  title: string;
  icon: typeof Gem;
  description: string;
  items: string[];
  href: string;
  cta: string;
}) {
  return (
    <article className="rounded-3xl border border-[#e7dfd3] bg-[#FAF9F7] p-5">
      <div className="flex items-start gap-4">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-[#191714] text-white">
          <Icon size={20} />
        </div>
        <div>
          <h3 className="font-display text-2xl font-semibold">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-[#6f6a61]">{description}</p>
        </div>
      </div>
      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <p key={item} className="flex items-center gap-2 rounded-2xl bg-white p-3 text-sm font-semibold text-[#4b463d]">
            <CheckCircle2 size={15} className="text-[#61735f]" />
            {item}
          </p>
        ))}
      </div>
      <Link href={href} className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-[#191714] px-5 text-sm font-semibold text-white">
        {cta}
        <ArrowRight size={16} />
      </Link>
    </article>
  );
}
