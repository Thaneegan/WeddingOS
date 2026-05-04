"use client";

import { Bot, CheckCircle2, Sparkles, TriangleAlert } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageWrapper } from "@/components/animations/PageWrapper";
import { MetricCard } from "@/components/shared/MetricCard";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { VendorCard } from "@/components/vendor/VendorCard";
import { formatCurrency } from "@/lib/utils";
import { useWeddingStore } from "@/store/useWeddingStore";

export default function PlannerPage() {
  const wedding = useWeddingStore((state) => state.wedding);
  const aiPlan = useWeddingStore((state) => state.aiPlan);
  const generateAIPlan = useWeddingStore((state) => state.generateAIPlan);
  const vendors = useWeddingStore((state) => state.vendors);
  const recommendedVendors = vendors.filter((vendor) => aiPlan?.recommendedVendors.includes(vendor.id));

  return (
    <AppLayout>
      <PageWrapper>
        <div className="space-y-6">
          <SectionHeader
            eyebrow="AI wedding planner"
            title="Generate a connected planning strategy"
            description="Mock AI logic uses the wedding budget, timeline, RSVP pressure, and marketplace vendors to produce a polished plan."
          />
          <section className="overflow-hidden rounded-3xl border border-[#e7dfd3] bg-white luxury-shadow">
            <div className="grid gap-0 lg:grid-cols-[1fr_420px]">
              <div className="p-5 sm:p-7">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-[#191714] text-white">
                  <Bot size={22} />
                </div>
                <h2 className="mt-5 font-display text-4xl font-semibold">Plan a modern luxury Toronto wedding for 120 guests under $35,000.</h2>
                <p className="mt-4 leading-7 text-[#6f6a61]">
                  The demo generator returns realistic budget recommendations, timeline moves, vendor matches, cost-saving insights, and risk flags.
                </p>
                <button
                  onClick={generateAIPlan}
                  className="mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-[#191714] px-6 text-sm font-semibold text-white"
                >
                  <Sparkles size={17} />
                  Generate Wedding Plan
                </button>
              </div>
              <div className="bg-[#fbf5ec] p-5 sm:p-7">
                <div className="grid gap-4">
                  <MetricCard label="Budget" value={formatCurrency(wedding.budget)} detail="Target ceiling" icon={Sparkles} tone="gold" />
                  <MetricCard label="Guest count" value={`${wedding.guestCount}`} detail="RSVP-sensitive planning" icon={CheckCircle2} tone="green" />
                </div>
              </div>
            </div>
          </section>

          {aiPlan ? (
            <div className="space-y-6">
              <section className="rounded-2xl border border-[#e7dfd3] bg-white p-5 luxury-shadow">
                <SectionHeader title="Suggested budget breakdown" />
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {aiPlan.budgetBreakdown.map((item) => (
                    <article key={item.category} className="rounded-2xl border border-[#eee7dd] bg-[#fffdf9] p-4">
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
                    <VendorCard vendor={vendor} key={vendor.id} />
                  ))}
                </div>
              </section>

              <div className="grid gap-6 lg:grid-cols-3">
                <PlanList title="Timeline suggestions" items={aiPlan.timelineSuggestions} />
                <PlanList title="Cost-saving insights" items={aiPlan.insights} />
                <section className="rounded-2xl border border-[#efd5d4] bg-[#fff5f4] p-5">
                  <div className="flex items-center gap-2 text-[#93484d]">
                    <TriangleAlert size={18} />
                    <h3 className="font-semibold">Risk flags</h3>
                  </div>
                  <div className="mt-4 space-y-3">
                    {aiPlan.riskFlags.map((item) => (
                      <p key={item} className="rounded-xl bg-white/70 p-3 text-sm leading-6 text-[#6f6a61]">{item}</p>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          ) : null}
        </div>
      </PageWrapper>
    </AppLayout>
  );
}

function PlanList({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="rounded-2xl border border-[#e7dfd3] bg-white p-5 luxury-shadow">
      <h3 className="font-semibold">{title}</h3>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <p key={item} className="rounded-xl bg-[#faf7f1] p-3 text-sm leading-6 text-[#6f6a61]">{item}</p>
        ))}
      </div>
    </section>
  );
}
