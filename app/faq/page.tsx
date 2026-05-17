import Link from "next/link";
import { ArrowRight, CalendarDays, CircleDollarSign, ClipboardList, HelpCircle, Search, ShieldCheck, UsersRound } from "lucide-react";
import { PageWrapper } from "@/components/animations/PageWrapper";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { getCurrentWorkspace } from "@/lib/auth";

export const dynamic = "force-dynamic";

const flowSteps = [
  {
    title: "Set up the wedding",
    description: "Start with the onboarding guide. Add the couple details, events, guest estimate, budget, venue status, and vendor needs.",
    href: "/onboarding",
    action: "Open setup guide",
    icon: CalendarDays,
  },
  {
    title: "Build guests and RSVPs",
    description: "Add guests, group families, send RSVP links, collect event-specific responses, and prepare seating.",
    href: "/rsvp",
    action: "Manage guest list",
    icon: UsersRound,
  },
  {
    title: "Find vendors and request quotes",
    description: "Use Vendors & Quotes to search, save, compare, request quotes, and keep vendor conversations in one thread.",
    href: "/marketplace",
    action: "Find vendors",
    icon: Search,
  },
  {
    title: "Accept quotes and track budget",
    description: "Review quote terms in the shortlist, accept the right vendor, and let Wedding OS create the booking, budget item, deposit, and contract draft.",
    href: "/compare",
    action: "Review shortlist",
    icon: CircleDollarSign,
  },
  {
    title: "Prepare timeline and documents",
    description: "Use Timeline for planning tasks, family responsibilities, ceremony checklists, and event run blocks. Store contracts, menus, floor plans, and invoices in Documents.",
    href: "/timeline",
    action: "Open timeline",
    icon: ClipboardList,
  },
  {
    title: "Run each event",
    description: "Before each event, open Run Sheets for schedule blocks, vendor arrivals, family contacts, documents, and payment reminders.",
    href: "/run-sheet",
    action: "Open run sheets",
    icon: ShieldCheck,
  },
];

const faqs = [
  {
    question: "Where should I start after signing up?",
    answer: "Start on Dashboard, then open the setup guide. The dashboard planning journey shows the next best section based on your current wedding data.",
  },
  {
    question: "What is the difference between Vendors & Quotes, Compare, and Messages?",
    answer: "Vendors & Quotes is where you discover vendors. Compare is where you review shortlisted vendors and quote terms side by side. Messages is where every vendor conversation stays connected to the inquiry or booking.",
  },
  {
    question: "When should I use Run Sheets?",
    answer: "Use Run Sheets for any event that needs a day-of plan, not only the wedding ceremony. A Tamil wedding can have separate run sheets for nalangu, mehndi, ceremony, reception, and family meals.",
  },
  {
    question: "How do budget numbers stay updated?",
    answer: "Budget items can be planned manually, created from accepted vendor quotes, or linked to bookings. The budget visualizations let you switch between committed spend and all planned spend.",
  },
  {
    question: "Can I customize categories?",
    answer: "Yes. Couples can create private wedding categories for budget, timeline, guest groups, and other planning needs. Vendors can create service categories for their own business profile.",
  },
  {
    question: "How is my data separated from other couples or vendors?",
    answer: "Wedding data is scoped to the signed-in user's wedding workspace. Vendor data is scoped to the vendor business workspace. Shared data only appears when an inquiry, booking, or conversation connects both sides.",
  },
];

export default async function FAQPage() {
  const workspace = await getCurrentWorkspace();
  const mode = workspace.type === "vendor" ? "vendor" : "couple";

  return (
    <AppLayout mode={mode}>
      <PageWrapper>
        <div className="space-y-8">
          <section className="overflow-hidden rounded-3xl border border-[#e7dfd3] bg-white luxury-shadow">
            <div className="grid gap-0 xl:grid-cols-[1fr_520px]">
              <div className="p-6 sm:p-8">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-[#191714] text-white">
                  <HelpCircle size={22} />
                </div>
                <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-[#9a7a50]">Help center</p>
                <h1 className="mt-2 font-display text-4xl font-semibold text-[#191714] sm:text-5xl">How Wedding OS works</h1>
                <p className="mt-4 max-w-3xl text-base leading-7 text-[#6f6a61]">
                  Use this guide when you are unsure what to do next. The platform follows a natural wedding planning order: setup, guests, vendors, budget, schedule, documents, and event execution.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href="/dashboard" className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#191714] px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5">
                    Go to dashboard
                    <ArrowRight size={15} />
                  </Link>
                  <Link href="/onboarding" className="inline-flex h-11 items-center justify-center rounded-full border border-[#d8c5aa] px-5 text-sm font-semibold text-[#7a582c] transition hover:-translate-y-0.5">
                    Open setup guide
                  </Link>
                </div>
              </div>
              <ScreenshotFrame title="Dashboard journey" eyebrow="First screen" />
            </div>
          </section>

          <section className="rounded-3xl border border-[#e7dfd3] bg-white p-5 luxury-shadow sm:p-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9a7a50]">Planning flow</p>
                <h2 className="mt-2 font-display text-3xl font-semibold text-[#191714]">Follow this order when planning</h2>
              </div>
              <StatusBadge tone="gold">6 core steps</StatusBadge>
            </div>
            <div className="mt-5 grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
              {flowSteps.map((step, index) => (
                <FlowCard key={step.href} step={step} index={index + 1} />
              ))}
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <VisualGuide
              eyebrow="Screenshot guide"
              title="Request and accept a vendor quote"
              description="Search vendors, request a quote, continue in Messages, then accept the quote from the shortlist when terms are clear."
              visual="quote"
            />
            <VisualGuide
              eyebrow="Screenshot guide"
              title="Prepare guests and run sheets"
              description="Guest management feeds RSVP status, seating, meal planning, and event-specific run sheets."
              visual="guests"
            />
          </section>

          <section className="rounded-3xl border border-[#e7dfd3] bg-white p-5 luxury-shadow sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9a7a50]">FAQ</p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-[#191714]">Common questions</h2>
            <div className="mt-5 grid gap-3 lg:grid-cols-2">
              {faqs.map((faq) => (
                <article key={faq.question} className="rounded-2xl border border-[#eee7dd] bg-[#fffdf9] p-5">
                  <h3 className="text-lg font-semibold text-[#191714]">{faq.question}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#6f6a61]">{faq.answer}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      </PageWrapper>
    </AppLayout>
  );
}

function FlowCard({ step, index }: { step: (typeof flowSteps)[number]; index: number }) {
  const Icon = step.icon;
  return (
    <Link href={step.href} className="group rounded-2xl border border-[#eee7dd] bg-[#fffdf9] p-5 transition hover:-translate-y-0.5 hover:border-[#d8c5aa] hover:shadow-lg">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-full bg-[#191714] text-sm font-semibold text-white">{index}</div>
          <div className="flex size-9 items-center justify-center rounded-full bg-[#fbf5ec] text-[#9a7a50]">
            <Icon size={17} />
          </div>
        </div>
        <ArrowRight size={16} className="text-[#9a7a50] transition group-hover:translate-x-1" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-[#191714]">{step.title}</h3>
      <p className="mt-2 min-h-20 text-sm leading-6 text-[#6f6a61]">{step.description}</p>
      <p className="mt-4 text-sm font-semibold text-[#8a6332]">{step.action}</p>
    </Link>
  );
}

function ScreenshotFrame({ title, eyebrow }: { title: string; eyebrow: string }) {
  return (
    <div className="border-t border-[#e7dfd3] bg-[#fbf5ec] p-5 xl:border-l xl:border-t-0">
      <div className="rounded-[1.5rem] border border-[#e0d2be] bg-white p-4 shadow-2xl shadow-black/5">
        <div className="flex items-center gap-2 border-b border-[#eee7dd] pb-3">
          <span className="size-3 rounded-full bg-[#e56b64]" />
          <span className="size-3 rounded-full bg-[#e6bd67]" />
          <span className="size-3 rounded-full bg-[#76a56f]" />
          <p className="ml-auto text-xs font-semibold uppercase tracking-[0.14em] text-[#9a7a50]">{eyebrow}</p>
        </div>
        <div className="mt-4 rounded-2xl bg-[#191714] p-4 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">{title}</p>
          <p className="mt-2 font-display text-3xl font-semibold">Know exactly what to do next</p>
          <div className="mt-4 grid gap-2">
            {["Set up the wedding", "Find and compare vendors", "Run each event"].map((item, index) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl bg-white/10 p-3">
                <span className="flex size-8 items-center justify-center rounded-full bg-white text-sm font-semibold text-[#191714]">{index + 1}</span>
                <span className="text-sm font-semibold">{item}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {["Budget", "Guests", "Tasks"].map((item) => (
            <div key={item} className="rounded-2xl border border-[#eee7dd] bg-[#fffdf9] p-3">
              <p className="text-xs text-[#777065]">{item}</p>
              <div className="mt-2 h-2 rounded-full bg-[#efe8dd]">
                <div className="h-full w-2/3 rounded-full bg-[#c8a97e]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function VisualGuide({
  eyebrow,
  title,
  description,
  visual,
}: {
  eyebrow: string;
  title: string;
  description: string;
  visual: "quote" | "guests";
}) {
  return (
    <article className="overflow-hidden rounded-3xl border border-[#e7dfd3] bg-white luxury-shadow">
      <div className="p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9a7a50]">{eyebrow}</p>
        <h2 className="mt-2 font-display text-3xl font-semibold text-[#191714]">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-[#6f6a61]">{description}</p>
      </div>
      <div className="border-t border-[#eee7dd] bg-[#fbfaf8] p-5">
        {visual === "quote" ? <QuoteScreenshot /> : <GuestScreenshot />}
      </div>
    </article>
  );
}

function QuoteScreenshot() {
  return (
    <div className="rounded-2xl border border-[#e0d2be] bg-white p-4">
      <div className="grid gap-3 md:grid-cols-[1fr_1fr]">
        <div className="rounded-2xl bg-[#191714] p-4 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/60">Vendor profile</p>
          <h3 className="mt-3 text-2xl font-semibold">Anjali Artistry Bridal</h3>
          <p className="mt-2 text-sm text-white/70">Tamil Bridal Beauty - Toronto</p>
          <button className="mt-4 h-10 w-full rounded-full bg-white text-sm font-semibold text-[#191714]">Request Quote</button>
        </div>
        <div className="rounded-2xl border border-[#eadcc6] bg-[#fbf5ec] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9a7a50]">Quote received</p>
          <div className="mt-3 space-y-2 text-sm">
            <GuideRow label="Total" value="$3,200" />
            <GuideRow label="Deposit" value="$1,120" />
            <GuideRow label="Status" value="Sent" />
          </div>
          <button className="mt-4 h-10 w-full rounded-full bg-[#191714] text-sm font-semibold text-white">Accept quote</button>
        </div>
      </div>
      <div className="mt-3 rounded-2xl border border-[#eee7dd] bg-[#fffdf9] p-3 text-sm text-[#6f6a61]">
        After acceptance, booking, budget, deposit, contract, and messages update automatically.
      </div>
    </div>
  );
}

function GuestScreenshot() {
  return (
    <div className="rounded-2xl border border-[#e0d2be] bg-white p-4">
      <div className="grid gap-2 sm:grid-cols-4">
        {[
          ["Invited", "120"],
          ["Attending", "84"],
          ["Declined", "8"],
          ["Pending", "28"],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-[#eee7dd] bg-[#fffdf9] p-3">
            <p className="text-xs text-[#777065]">{label}</p>
            <p className="mt-1 text-2xl font-semibold">{value}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 overflow-hidden rounded-2xl border border-[#eee7dd]">
        <div className="grid grid-cols-[1.2fr_0.8fr_0.7fr_0.8fr] bg-[#fbf5ec] px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#9a7a50]">
          <span>Guest</span>
          <span>Group</span>
          <span>RSVP</span>
          <span>Event</span>
        </div>
        {[
          ["Nimalan C.", "Family", "Pending", "Reception"],
          ["Pretheev V.", "Friends", "Attending", "Ceremony"],
        ].map((row) => (
          <div key={row.join("-")} className="grid grid-cols-[1.2fr_0.8fr_0.7fr_0.8fr] border-t border-[#eee7dd] px-3 py-3 text-sm text-[#4b463d]">
            {row.map((cell) => (
              <span key={cell}>{cell}</span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function GuideRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[#e7dfd3] pb-2">
      <span className="text-[#6f6a61]">{label}</span>
      <span className="font-semibold text-[#191714]">{value}</span>
    </div>
  );
}
