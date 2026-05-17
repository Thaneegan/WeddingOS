import { AppLayout } from "@/components/layout/AppLayout";
import { PageWrapper } from "@/components/animations/PageWrapper";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { WeddingBudgetHeatmap, weddingBudgetTemplateItems } from "@/components/shared/WeddingBudgetHeatmap";
import { CalendarDays, CheckCircle2, CircleDollarSign, ClipboardList, Sparkles, UsersRound } from "lucide-react";

const templateCards = [
  {
    title: "Modern South Asian fusion",
    description: "Budget, vendor, timeline, and guest planning structure for a multi-event Toronto wedding.",
    icon: Sparkles,
    tags: ["Mandap", "Reception", "Late-night food"],
  },
  {
    title: "Venue-first planning",
    description: "Prioritizes date availability, venue requirements, minimum spend, guest flow, and floor plans.",
    icon: CalendarDays,
    tags: ["Venue", "Catering", "Layout"],
  },
  {
    title: "Budget control",
    description: "Default cost buckets, payment schedule, invoice tracking, and deposit reminders.",
    icon: CircleDollarSign,
    tags: ["Deposits", "Invoices", "Categories"],
  },
  {
    title: "Guest operations",
    description: "RSVP groups, meal choices, table assignments, public RSVP links, and reminders.",
    icon: UsersRound,
    tags: ["RSVP", "Meals", "Tables"],
  },
];

const checklist = [
  "Create wedding workspace and planning team",
  "Set budget categories and starting allocation",
  "Add guest groups, meal choices, and RSVP defaults",
  "Publish vendor needs for missing categories",
  "Build quote request shortlists from marketplace",
  "Create timeline tasks from 12 months out to wedding day",
  "Track contracts, deposits, invoices, and scheduled calls",
  "Review planner snapshot before adding new tasks or spend",
];

export const dynamic = "force-dynamic";

export default function TemplatesPage() {
  return (
    <AppLayout>
      <PageWrapper>
        <SectionHeader
          eyebrow="Templates"
          title="Wedding planning templates"
          description="Reusable planning structures for budgets, timelines, guests, vendors, and documents. Use these as starting points, then customize categories for each wedding."
        />

        <div className="space-y-6">
          <WeddingBudgetHeatmap
            title="Typical wedding spend map"
            description="A quick planning baseline for where the biggest decisions usually sit before custom categories and vendor quotes refine the numbers."
            totalBudget={35000}
            items={weddingBudgetTemplateItems}
          />

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {templateCards.map((card) => {
              const Icon = card.icon;
              return (
                <article key={card.title} className="rounded-2xl border border-[#e7dfd3] bg-white p-5 luxury-shadow">
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-[#fbf5ec] text-[#9a7a50]">
                    <Icon size={19} />
                  </div>
                  <h3 className="mt-4 font-display text-xl font-semibold text-[#191714]">{card.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#6f6a61]">{card.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {card.tags.map((tag) => (
                      <span key={tag} className="rounded-full border border-[#e7dfd3] bg-[#fffdf9] px-3 py-1 text-xs font-semibold text-[#6f6a61]">
                        {tag}
                      </span>
                    ))}
                  </div>
                </article>
              );
            })}
          </section>

          <section className="rounded-2xl border border-[#e7dfd3] bg-white p-5 luxury-shadow">
            <div className="mb-5 flex items-center gap-2">
              <ClipboardList size={19} className="text-[#9a7a50]" />
              <h2 className="font-display text-2xl font-semibold text-[#191714]">Launch-ready planning checklist</h2>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {checklist.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl bg-[#fbfaf8] p-4">
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-[#61735f]" />
                  <p className="text-sm font-medium leading-6 text-[#4b463d]">{item}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </PageWrapper>
    </AppLayout>
  );
}
