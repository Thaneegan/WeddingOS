"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bot, CheckCircle2, ClipboardList, DollarSign, MessageSquare, Sparkles, TriangleAlert } from "lucide-react";
import { generatePlannerSnapshot } from "@/app/actions";
import { MetricCard } from "@/components/shared/MetricCard";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { VendorCard } from "@/components/vendor/VendorCard";
import { formatCurrency } from "@/lib/utils";
import type { CorePlannerData } from "@/types/core";

export function PlannerClient({ data }: { data: CorePlannerData }) {
  const router = useRouter();
  const { wedding, plan, recommendedVendors } = data;
  const latestPlanDate = plan ? new Date(plan.generatedAt).toLocaleString("en-CA") : null;

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Planning assistant"
        title="Review the next best planning moves"
        description="Generate a structured planning snapshot from your current wedding details, budget, vendors, guests, and timeline."
      />
      <section className="overflow-hidden rounded-3xl border border-[#e7dfd3] bg-white luxury-shadow">
        <div className="grid gap-0 lg:grid-cols-[1fr_420px]">
          <div className="p-5 sm:p-7">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-[#191714] text-white">
              <Bot size={22} />
            </div>
            <h2 className="mt-5 font-display text-4xl font-semibold">
              Plan a modern luxury Toronto wedding for {wedding.guestCount} guests under {formatCurrency(wedding.budget)}.
            </h2>
            <p className="mt-4 leading-7 text-[#6f6a61]">
              Use this when you need a planning reset: budget guidance, timeline moves, vendor categories to prioritize, cost-saving ideas, and risk flags.
            </p>
            <button
              onClick={async () => {
                await generatePlannerSnapshot({ weddingId: wedding.id });
                router.refresh();
              }}
              className="mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-[#191714] px-6 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <Sparkles size={17} />
              {plan ? "Refresh planning snapshot" : "Generate planning snapshot"}
            </button>
          </div>
          <div className="bg-[#fbf5ec] p-5 sm:p-7">
            <div className="grid gap-4">
              <MetricCard label="Budget" value={formatCurrency(wedding.budget)} detail="Target ceiling" icon={Sparkles} tone="gold" />
              <MetricCard label="Guest count" value={`${wedding.guestCount}`} detail="RSVP-sensitive planning" icon={CheckCircle2} tone="green" />
              <MetricCard label="Last snapshot" value={latestPlanDate ? "Saved" : "None"} detail={latestPlanDate ?? "Generate one to start"} icon={Bot} tone="ink" />
            </div>
          </div>
        </div>
      </section>

      {plan ? (
        <div className="space-y-6">
          <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl border border-[#e7dfd3] bg-white p-5 luxury-shadow">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9a7a50]">Planner review queue</p>
              <h2 className="mt-1 font-display text-3xl font-semibold text-[#191714]">Turn the snapshot into action</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6f6a61]">
                The planner should inform decisions, not silently change your wedding. Review each recommendation, then create or update records yourself.
              </p>
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <PlannerAction href="/budget" icon={DollarSign} title="Review budget" detail="Compare suggested allocation against committed and planned spend." />
                <PlannerAction href="/timeline" icon={ClipboardList} title="Update tasks" detail="Turn timeline suggestions into real assigned tasks." />
                <PlannerAction href="/marketplace" icon={MessageSquare} title="Find vendors" detail="Use recommendations to request quotes or compare options." />
              </div>
            </div>
            <aside className="rounded-2xl border border-[#efd5d4] bg-[#fff5f4] p-5 luxury-shadow">
              <div className="flex items-center gap-2 text-[#93484d]">
                <TriangleAlert size={18} />
                <p className="text-xs font-semibold uppercase tracking-[0.18em]">Highest risk</p>
              </div>
              <h3 className="mt-3 font-display text-2xl font-semibold text-[#191714]">{plan.riskFlags[0] ?? "No risk flags found"}</h3>
              <p className="mt-2 text-sm leading-6 text-[#6f6a61]">
                Start with the highest-risk item, then review the rest of the snapshot below.
              </p>
            </aside>
          </section>

          <section className="rounded-2xl border border-[#e7dfd3] bg-white p-5 luxury-shadow">
            <SectionHeader title="Suggested budget breakdown" description={`Generated ${new Date(plan.generatedAt).toLocaleString("en-CA")}`} />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {plan.budgetBreakdown.map((item) => (
                <article key={`${item.category}-${item.amount}`} className="rounded-2xl border border-[#eee7dd] bg-[#fffdf9] p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold">{item.category}</p>
                    <p className="font-semibold text-[#9a7a50]">{formatCurrency(item.amount)}</p>
                  </div>
                  <div className="mt-3">
                    <ProgressBar value={item.amount} max={wedding.budget} />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[#6f6a61]">{item.note}</p>
                </article>
              ))}
            </div>
          </section>

          <section>
            <SectionHeader title="Recommended vendors" description="Matched from the same marketplace used in the couple flow." />
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {recommendedVendors.map((vendor) => (
                <VendorCard vendor={vendor} key={vendor.id} actionsEnabled={false} />
              ))}
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-3">
            <PlanList title="Timeline suggestions" items={plan.timelineSuggestions} />
            <PlanList title="Cost-saving insights" items={plan.insights} />
            <section className="rounded-2xl border border-[#efd5d4] bg-[#fff5f4] p-5">
              <div className="flex items-center gap-2 text-[#93484d]">
                <TriangleAlert size={18} />
                <h3 className="font-semibold">Risk flags</h3>
              </div>
              <div className="mt-4 space-y-3">
                {plan.riskFlags.map((item) => (
                  <p key={item} className="rounded-xl bg-white/70 p-3 text-sm leading-6 text-[#6f6a61]">
                    {item}
                  </p>
                ))}
              </div>
            </section>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PlanList({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="rounded-2xl border border-[#e7dfd3] bg-white p-5 luxury-shadow">
      <h3 className="font-semibold">{title}</h3>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <p key={item} className="rounded-xl bg-[#faf7f1] p-3 text-sm leading-6 text-[#6f6a61]">
            {item}
          </p>
        ))}
      </div>
    </section>
  );
}

function PlannerAction({ href, icon: Icon, title, detail }: { href: string; icon: typeof DollarSign; title: string; detail: string }) {
  return (
    <Link href={href} className="rounded-2xl border border-[#eee7dd] bg-[#fffdf9] p-4 transition hover:-translate-y-0.5 hover:border-[#c8a97e] hover:shadow-md">
      <span className="flex size-10 items-center justify-center rounded-full bg-[#191714] text-white">
        <Icon size={17} />
      </span>
      <span className="mt-3 block font-semibold text-[#191714]">{title}</span>
      <span className="mt-1 block text-sm leading-6 text-[#6f6a61]">{detail}</span>
    </Link>
  );
}
