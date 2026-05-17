import Link from "next/link";
import { redirect } from "next/navigation";
import { Bot, CalendarDays, CheckCircle2, CircleDollarSign, Clock3, Inbox, ListChecks, Search, Settings2, ShieldCheck, UsersRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageWrapper } from "@/components/animations/PageWrapper";
import { ImagePlaceholder } from "@/components/shared/ImagePlaceholder";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { getCurrentWorkspace } from "@/lib/auth";
import { formatCurrency, formatDate, initials } from "@/lib/utils";
import { getDashboardData } from "@/lib/coreData";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const workspace = await getCurrentWorkspace();
  if (workspace.type === "vendor") redirect("/vendor/dashboard");
  if (workspace.type === "admin") redirect("/admin");

  const data = await getDashboardData();
  const { wedding } = data;
  const layoutWorkspace = {
    title: `${wedding.couple}'s Wedding`,
    subtitle: `${wedding.location} · ${formatDate(wedding.date)}`,
    initials: initials(wedding.couple),
    weddingDate: wedding.date,
  };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysLeft = Math.max(0, Math.ceil((new Date(wedding.date).getTime() - today.getTime()) / 86400000));
  const journeySteps = getPlanningJourney({
    daysLeft,
    budget: wedding.budget,
    spent: data.spent,
    guestCount: wedding.guestCount,
    bookedVendorCount: data.bookedVendorCount,
    tasksRemaining: data.tasksRemaining,
    pendingResponses: data.pendingResponses,
    hasNextEvent: Boolean(data.nextEvent),
  });
  const completedSteps = journeySteps.filter((step) => step.status === "complete").length;
  const journeyProgress = Math.round((completedSteps / journeySteps.length) * 100);

  return (
    <AppLayout workspace={layoutWorkspace}>
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
                    <span>{formatCurrency(data.spent)} / {formatCurrency(wedding.budget)}</span>
                  </div>
                  <ProgressBar value={data.spent} max={wedding.budget} />
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
            <DashboardMetric label="Budget spent" value={formatCurrency(data.spent)} detail={`of ${formatCurrency(wedding.budget)}`} icon={CircleDollarSign} tone="gold" />
            <DashboardMetric label="Guests invited" value={`${wedding.guestCount}`} detail="Guest records loaded" icon={UsersRound} tone="green" />
            <DashboardMetric label="Vendors booked" value={`${data.bookedVendorCount}`} detail="Synced from CRM bookings" icon={CalendarDays} tone="ink" />
            <DashboardMetric label="Tasks remaining" value={`${data.tasksRemaining}`} detail="Across planning timeline" icon={ListChecks} tone="rose" />
            <DashboardMetric label="Pending responses" value={`${data.pendingResponses}`} detail="Open quote workflows" icon={Inbox} tone="gold" />
          </div>

          <section className="rounded-2xl border border-[#e7dfd3] bg-white p-5 luxury-shadow">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9a7a50]">Planning journey</p>
                <h2 className="mt-2 font-display text-3xl font-semibold text-[#191714]">Know exactly what to do next</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6f6a61]">
                  Wedding OS is organized in the same order couples plan: set the foundation, build the guest list, find vendors, confirm budget, prepare the schedule, then run the wedding day.
                </p>
              </div>
              <div className="rounded-2xl bg-[#fbf5ec] px-5 py-4 text-right">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9a7a50]">Progress</p>
                <p className="mt-1 font-display text-4xl font-semibold text-[#191714]">{journeyProgress}%</p>
              </div>
            </div>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#efe8dd]">
              <div className="h-full rounded-full bg-[#191714]" style={{ width: `${journeyProgress}%` }} />
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {journeySteps.map((step, index) => (
                <JourneyStep key={step.href} step={step} index={index + 1} />
              ))}
            </div>
          </section>

          {data.nextEvent ? (
            <section className="rounded-2xl border border-[#e7dfd3] bg-white p-5 luxury-shadow">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9a7a50]">Next event</p>
                  <h2 className="mt-2 font-display text-3xl font-semibold text-[#191714]">{data.nextEvent.name}</h2>
                  <p className="mt-1 text-sm text-[#6f6a61]">
                    {formatDate(data.nextEvent.date)}
                    {data.nextEvent.startTime ? ` - ${data.nextEvent.startTime}` : ""}
                    {data.nextEvent.venueName ? ` - ${data.nextEvent.venueName}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href="/run-sheet" className="rounded-full bg-[#191714] px-4 py-2 text-sm font-semibold text-white">Open run sheet</Link>
                  <Link href="/timeline" className="rounded-full border border-[#d8c5aa] px-4 py-2 text-sm font-semibold text-[#7a582c]">Manage schedule</Link>
                </div>
              </div>
            </section>
          ) : null}

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_420px]">
            <section className="rounded-2xl border border-[#e7dfd3] bg-white p-5 luxury-shadow">
              <SectionHeader title="Confirmed vendors" action={<Link href="/marketplace" className="rounded-full bg-[#191714] px-4 py-2 text-sm font-semibold text-white">Find vendors</Link>} />
              <div className="grid gap-3 md:grid-cols-3">
                {data.bookedVendors.length ? (
                  data.bookedVendors.map((vendor) => (
                    <article key={vendor.id} className="rounded-2xl border border-[#eee7dd] p-4">
                      {vendor.image ? (
                        <img src={vendor.image} alt={vendor.name} className="h-28 w-full rounded-xl object-cover" />
                      ) : (
                        <ImagePlaceholder label={vendor.name} className="h-28 w-full rounded-xl" />
                      )}
                      <p className="mt-3 font-semibold">{vendor.name}</p>
                      <p className="mt-1 text-sm text-[#6f6a61]">{vendor.category}</p>
                    </article>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-[#e7dfd3] p-5 text-sm text-[#6f6a61]">No DB bookings yet. Book a lead from the vendor pipeline to populate this section.</div>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-[#e7dfd3] bg-white p-5 luxury-shadow">
              <SectionHeader title="Recommended next action" />
              <div className="rounded-2xl bg-[#fbf5ec] p-5">
                <div className="flex size-11 items-center justify-center rounded-full bg-[#c8a97e] text-[#191714]">
                  <Clock3 size={20} />
                </div>
                <h3 className="mt-4 text-xl font-semibold">Review your wedding setup</h3>
                <p className="mt-2 text-sm leading-6 text-[#6f6a61]">
                  Keep your wedding details, venue status, vendor needs, guest count, budget, and planning settings aligned before making more bookings.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href="/onboarding" className="inline-flex items-center gap-2 rounded-full bg-[#191714] px-4 py-2 text-sm font-semibold text-white">
                    <Settings2 size={15} />
                    Open setup guide
                  </Link>
                  <Link href="/planner" className="inline-flex items-center gap-2 rounded-full border border-[#d8c5aa] px-4 py-2 text-sm font-semibold text-[#7a582c]">
                    <Bot size={15} />
                    Generate plan
                  </Link>
                </div>
              </div>
            </section>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <section className="rounded-2xl border border-[#e7dfd3] bg-white p-5 luxury-shadow">
              <SectionHeader title="Recent messages" action={<Link href="/messages" className="text-sm font-semibold text-[#9a7a50]">Open inbox</Link>} />
              <div className="space-y-3">
                {data.recentMessages.map((message) => (
                  <article key={message.id} className="rounded-2xl border border-[#eee7dd] p-4">
                    <p className="text-sm font-semibold">{message.vendorName ?? message.senderName}</p>
                    <p className="mt-1 line-clamp-2 text-sm leading-6 text-[#6f6a61]">{message.body}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-[#e7dfd3] bg-white p-5 luxury-shadow">
              <SectionHeader title="Upcoming tasks" action={<Link href="/timeline" className="text-sm font-semibold text-[#9a7a50]">Open timeline</Link>} />
              <div className="space-y-3">
                {data.upcomingTasks.map((task) => (
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

type JourneyStatus = "complete" | "active" | "upcoming";

type JourneyStepItem = {
  title: string;
  detail: string;
  href: string;
  action: string;
  icon: LucideIcon;
  status: JourneyStatus;
};

function getPlanningJourney({
  daysLeft,
  budget,
  spent,
  guestCount,
  bookedVendorCount,
  tasksRemaining,
  pendingResponses,
  hasNextEvent,
}: {
  daysLeft: number;
  budget: number;
  spent: number;
  guestCount: number;
  bookedVendorCount: number;
  tasksRemaining: number;
  pendingResponses: number;
  hasNextEvent: boolean;
}): JourneyStepItem[] {
  const hasBudget = budget > 0;
  const vendorStatus: JourneyStatus = bookedVendorCount > 0 ? "complete" : pendingResponses > 0 ? "active" : "upcoming";
  const budgetStatus: JourneyStatus = spent > 0 ? "active" : hasBudget ? "complete" : "upcoming";
  const taskStatus: JourneyStatus = tasksRemaining === 0 ? "complete" : tasksRemaining <= 6 ? "active" : "upcoming";
  const weddingDayStatus: JourneyStatus = daysLeft <= 14 ? "active" : hasNextEvent ? "upcoming" : "upcoming";

  return [
    {
      title: "Set up the wedding",
      detail: "Confirm dates, events, budget, venue status, and core preferences.",
      href: "/onboarding",
      action: "Open setup guide",
      icon: Settings2,
      status: hasBudget && hasNextEvent ? "complete" : "active",
    },
    {
      title: "Build the guest list",
      detail: `${guestCount || 0} guests tracked. Manage groups, RSVPs, meals, and seating inputs.`,
      href: "/rsvp",
      action: "Manage guests",
      icon: UsersRound,
      status: guestCount > 0 ? "complete" : "active",
    },
    {
      title: "Find and compare vendors",
      detail: pendingResponses > 0 ? `${pendingResponses} quote workflow${pendingResponses === 1 ? "" : "s"} open.` : "Shortlist vendors, request quotes, and compare terms.",
      href: "/marketplace",
      action: "Find vendors",
      icon: Search,
      status: vendorStatus,
    },
    {
      title: "Control the budget",
      detail: `${formatCurrency(spent)} committed against ${formatCurrency(budget)}.`,
      href: "/budget",
      action: "Review budget",
      icon: CircleDollarSign,
      status: budgetStatus,
    },
    {
      title: "Prepare the schedule",
      detail: `${tasksRemaining} task${tasksRemaining === 1 ? "" : "s"} remaining across planning, family responsibilities, and day-of timing.`,
      href: "/timeline",
      action: "Open timeline",
      icon: ListChecks,
      status: taskStatus,
    },
    {
      title: "Run each event",
      detail: daysLeft <= 14 ? "Event mode: review run sheets, documents, seating, and vendor arrivals." : "Run sheets and documents become the source of truth for each wedding event.",
      href: "/run-sheet",
      action: "Open run sheets",
      icon: ShieldCheck,
      status: weddingDayStatus,
    },
  ];
}

function JourneyStep({ step, index }: { step: JourneyStepItem; index: number }) {
  const Icon = step.icon;
  const statusStyles = {
    complete: "border-[#d6e2d2] bg-[#f4f8f2]",
    active: "border-[#d8c5aa] bg-[#fbf5ec]",
    upcoming: "border-[#eee7dd] bg-[#fffdf9]",
  };
  const badgeStyles = {
    complete: "bg-[#61735f] text-white",
    active: "bg-[#191714] text-white",
    upcoming: "bg-[#efe8dd] text-[#6f6a61]",
  };

  return (
    <Link
      href={step.href}
      className={`group rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-lg ${statusStyles[step.status]}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`flex size-9 items-center justify-center rounded-full text-sm font-semibold ${badgeStyles[step.status]}`}>
            {step.status === "complete" ? <CheckCircle2 size={17} /> : index}
          </div>
          <div className="flex size-9 items-center justify-center rounded-full bg-white text-[#9a7a50]">
            <Icon size={17} />
          </div>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold capitalize text-[#6f6a61]">{step.status}</span>
      </div>
      <h3 className="mt-4 text-lg font-semibold text-[#191714]">{step.title}</h3>
      <p className="mt-2 min-h-12 text-sm leading-6 text-[#6f6a61]">{step.detail}</p>
      <p className="mt-4 text-sm font-semibold text-[#8a6332] group-hover:text-[#191714]">{step.action}</p>
    </Link>
  );
}

function DashboardMetric({
  label,
  value,
  detail,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  tone: "gold" | "green" | "rose" | "ink";
}) {
  const tones = {
    gold: "bg-[#fbf5ec] text-[#8a6332]",
    green: "bg-[#f1f6ef] text-[#42633f]",
    rose: "bg-[#fff4f3] text-[#93484d]",
    ink: "bg-[#191714] text-white",
  };

  return (
    <div className="rounded-2xl border border-[#ebe4d8] bg-white p-4 luxury-shadow">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[#777065]">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-[#191714]">{value}</p>
          <p className="mt-1 text-sm text-[#777065]">{detail}</p>
        </div>
        <div className={`flex size-10 items-center justify-center rounded-full ${tones[tone]}`}>
          <Icon size={18} strokeWidth={2} />
        </div>
      </div>
    </div>
  );
}
