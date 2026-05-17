"use client";

import Link from "next/link";
import { ArrowUpRight, LayoutGrid } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export type HeatmapItem = {
  label: string;
  amount: number;
  committedAmount?: number;
  plannedAmount?: number;
  committedPercent?: number;
  percent?: number;
  note?: string;
  tone?: "ink" | "gold" | "green" | "rose" | "sand";
};

const toneClasses = {
  ink: "bg-[#191714] text-white",
  gold: "bg-[#c8a97e] text-[#191714]",
  green: "bg-[#61735f] text-white",
  rose: "bg-[#93484d] text-white",
  sand: "bg-[#efe6d8] text-[#191714]",
};

const templateItems: HeatmapItem[] = [
  { label: "Venue", amount: 10500, percent: 30, note: "Space, ceremony, staffing", tone: "ink" },
  { label: "Catering", amount: 8750, percent: 25, note: "Dinner, late-night, bar", tone: "gold" },
  { label: "Photo + Video", amount: 5250, percent: 15, note: "Coverage and edits", tone: "green" },
  { label: "Decor + Florals", amount: 4200, percent: 12, note: "Mandap, tables, installs", tone: "rose" },
  { label: "Music", amount: 2100, percent: 6, note: "DJ, sound, ceremony", tone: "sand" },
  { label: "Beauty", amount: 1750, percent: 5, note: "Makeup and hair", tone: "sand" },
  { label: "Attire", amount: 1400, percent: 4, note: "Outfits and styling", tone: "sand" },
  { label: "Logistics", amount: 1050, percent: 3, note: "Transport, stationery, misc.", tone: "sand" },
];

function normalizedItems(items: HeatmapItem[] | undefined, totalBudget = 35000, useTemplateFallback: boolean) {
  const source = items?.length ? items : useTemplateFallback ? templateItems : [];

  return source
    .map((item, index) => ({
      ...item,
      percent: item.percent ?? Math.round((item.amount / Math.max(totalBudget, 1)) * 100),
      tone: item.tone ?? (["ink", "gold", "green", "rose", "sand"] as const)[index % 5],
    }))
    .sort((a, b) => b.amount - a.amount);
}

function withFocusParam(baseHref: string, paramName: string, label: string) {
  const separator = baseHref.includes("?") ? "&" : "?";
  return `${baseHref}${separator}${paramName}=${encodeURIComponent(label)}`;
}

export function WeddingBudgetHeatmap({
  title = "Wedding budget heatmap",
  description = "A one-glance view of where the largest wedding costs usually sit.",
  totalBudget = 35000,
  items,
  mode = "template",
  templateHrefBase = "/templates",
  actualHrefBase = "/budget",
  templateParamName = "focus",
  actualParamName = "category",
  itemActionLabel,
  actualSummaryLabel = "Committed",
}: {
  title?: string;
  description?: string;
  totalBudget?: number;
  items?: HeatmapItem[];
  mode?: "template" | "actual";
  templateHrefBase?: string;
  actualHrefBase?: string;
  templateParamName?: string;
  actualParamName?: string;
  itemActionLabel?: string;
  actualSummaryLabel?: string;
}) {
  const cells = normalizedItems(items, totalBudget, mode === "template");
  const committed = cells.reduce((sum, item) => sum + item.amount, 0);

  return (
    <section className="rounded-2xl border border-[#e7dfd3] bg-white p-5 luxury-shadow">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#9a7a50]">
            <LayoutGrid size={15} />
            {mode === "actual" ? "Actual spend" : "Template"}
          </div>
          <h2 className="mt-2 font-display text-2xl font-semibold text-[#191714]">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6f6a61]">{description}</p>
        </div>
        <div className="rounded-2xl bg-[#fbfaf8] px-4 py-3 text-right">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9a7a50]">{mode === "actual" ? actualSummaryLabel : "Typical budget"}</p>
          <p className="mt-1 text-xl font-semibold text-[#191714]">{formatCurrency(mode === "actual" ? committed : totalBudget)}</p>
        </div>
      </div>

      {cells.length ? (
        <div className="grid auto-rows-[minmax(168px,auto)] grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
          {cells.map((item, index) => {
          const large = index === 0 || item.amount / Math.max(committed, totalBudget) > 0.22;
          const wide = index < 2 || item.amount / Math.max(committed, totalBudget) > 0.16;
          const href =
            mode === "actual"
              ? withFocusParam(actualHrefBase, actualParamName, item.label)
              : withFocusParam(templateHrefBase, templateParamName, item.label);
          const actionLabel = itemActionLabel ?? `View ${item.label} details`;

          return (
            <Link
              key={item.label}
              href={href}
              aria-label={actionLabel}
              title={actionLabel}
              className={`${toneClasses[item.tone ?? "sand"]} ${wide ? "md:col-span-2" : ""} ${large ? "md:row-span-2" : ""} group flex min-h-[168px] min-w-0 cursor-pointer flex-col justify-between overflow-hidden rounded-2xl p-4 transition duration-200 hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c8a97e]`}
            >
              <div className="flex min-h-0 items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-lg font-semibold leading-6">{item.label}</p>
                  {item.note ? <p className="mt-1 line-clamp-2 text-sm leading-5 opacity-80">{item.note}</p> : null}
                </div>
                <ArrowUpRight size={16} className="shrink-0 opacity-70 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
              </div>
              <div className="mt-4 min-w-0">
                <p className="truncate text-2xl font-semibold leading-8 tracking-tight">{formatCurrency(item.amount)}</p>
                <p className="mt-1 text-sm font-semibold leading-5 opacity-80">
                  {item.percent}% of {mode === "actual" ? "budget" : "typical"}
                </p>
              </div>
            </Link>
          );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[#e1d6c7] bg-[#fffdf9] p-6 text-sm leading-6 text-[#6f6a61]">
          No committed budget items yet. Add expenses below or book vendors to build this heatmap from your own wedding data.
        </div>
      )}
    </section>
  );
}

export const weddingBudgetTemplateItems = templateItems;
