"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { Megaphone, Plus, Send } from "lucide-react";
import { createVendorOpportunity, sendVendorPitch } from "@/app/actions";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { CoreOpportunitiesData } from "@/types/core";

export function CoupleOpportunitiesClient({ data }: { data: CoreOpportunitiesData }) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    categoryId: data.categories[0]?.id ?? "",
    description: "",
    budget: "",
    location: data.wedding?.location ?? "",
    date: data.wedding?.date.slice(0, 10) ?? "",
    guestCount: data.wedding?.guestCount.toString() ?? "",
  });

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#e7dfd3] bg-white p-5 luxury-shadow">
        <SectionHeader title="Publish vendor need" description="Let approved vendors discover a specific open need and send a pitch into your workspace." />
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            const budget = form.budget ? Number(form.budget) : undefined;
            const guestCount = form.guestCount ? Number(form.guestCount) : undefined;
            if (!form.title.trim() || !form.description.trim()) return;
            await createVendorOpportunity({
              title: form.title,
              description: form.description,
              categoryId: form.categoryId || undefined,
              budget: Number.isFinite(budget) ? budget : undefined,
              location: form.location || undefined,
              date: form.date || undefined,
              guestCount: Number.isFinite(guestCount) ? guestCount : undefined,
            });
            setForm({ title: "", categoryId: data.categories[0]?.id ?? "", description: "", budget: "", location: data.wedding?.location ?? "", date: data.wedding?.date.slice(0, 10) ?? "", guestCount: data.wedding?.guestCount.toString() ?? "" });
            router.refresh();
          }}
          className="grid gap-3 lg:grid-cols-[1fr_220px_160px_160px_auto]"
        >
          <input value={form.title} onChange={(event) => setForm((item) => ({ ...item, title: event.target.value }))} placeholder="Need title" className="h-11 rounded-full border border-[#e7dfd3] bg-[#fffdf9] px-4 text-sm outline-none focus:border-[#c8a97e]" />
          <select value={form.categoryId} onChange={(event) => setForm((item) => ({ ...item, categoryId: event.target.value }))} className="h-11 rounded-full border border-[#e7dfd3] bg-[#fffdf9] px-3 text-sm font-semibold">
            {data.categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <input value={form.budget} onChange={(event) => setForm((item) => ({ ...item, budget: event.target.value }))} placeholder="Budget" inputMode="decimal" className="h-11 rounded-full border border-[#e7dfd3] bg-[#fffdf9] px-4 text-sm outline-none focus:border-[#c8a97e]" />
          <input value={form.date} onChange={(event) => setForm((item) => ({ ...item, date: event.target.value }))} type="date" className="h-11 rounded-full border border-[#e7dfd3] bg-[#fffdf9] px-4 text-sm outline-none focus:border-[#c8a97e]" />
          <button className="flex h-11 items-center justify-center gap-2 rounded-full bg-[#191714] px-5 text-sm font-semibold text-white">
            <Plus size={16} />
            Publish
          </button>
          <input value={form.location} onChange={(event) => setForm((item) => ({ ...item, location: event.target.value }))} placeholder="Location" className="h-11 rounded-full border border-[#e7dfd3] bg-[#fffdf9] px-4 text-sm outline-none focus:border-[#c8a97e]" />
          <input value={form.guestCount} onChange={(event) => setForm((item) => ({ ...item, guestCount: event.target.value }))} placeholder="Guests" inputMode="numeric" className="h-11 rounded-full border border-[#e7dfd3] bg-[#fffdf9] px-4 text-sm outline-none focus:border-[#c8a97e]" />
          <textarea value={form.description} onChange={(event) => setForm((item) => ({ ...item, description: event.target.value }))} placeholder="Describe what you need" className="min-h-24 rounded-2xl border border-[#e7dfd3] bg-[#fffdf9] px-4 py-3 text-sm outline-none focus:border-[#c8a97e] lg:col-span-3" />
        </form>
      </section>
      <OpportunityGrid data={data} mode="couple" />
    </div>
  );
}

export function VendorOpportunitiesClient({ data }: { data: CoreOpportunitiesData }) {
  const router = useRouter();
  const [pitchById, setPitchById] = useState<Record<string, string>>({});

  return (
    <OpportunityGrid
      data={data}
      mode="vendor"
      actionFor={(opportunity) =>
        opportunity.pitchedByCurrentVendor ? (
          <StatusBadge tone="green">Pitch sent</StatusBadge>
        ) : (
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              const message = pitchById[opportunity.id]?.trim();
              if (!message || !data.vendorBusinessId) return;
              await sendVendorPitch({ opportunityId: opportunity.id, vendorBusinessId: data.vendorBusinessId, message });
              setPitchById((values) => ({ ...values, [opportunity.id]: "" }));
              router.refresh();
            }}
            className="mt-4 space-y-2"
          >
            <textarea
              value={pitchById[opportunity.id] ?? ""}
              onChange={(event) => setPitchById((values) => ({ ...values, [opportunity.id]: event.target.value }))}
              placeholder="Pitch this couple"
              className="h-24 w-full rounded-2xl border border-[#e7dfd3] bg-white px-4 py-3 text-sm outline-none focus:border-[#c8a97e]"
            />
            <button className="flex h-10 items-center gap-2 rounded-full bg-[#191714] px-4 text-sm font-semibold text-white">
              <Send size={16} />
              Send pitch
            </button>
          </form>
        )
      }
    />
  );
}

function OpportunityGrid({
  data,
  mode,
  actionFor,
}: {
  data: CoreOpportunitiesData;
  mode: "couple" | "vendor";
  actionFor?: (opportunity: CoreOpportunitiesData["opportunities"][number]) => ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[#e7dfd3] bg-white p-5 luxury-shadow">
      <SectionHeader
        title={mode === "couple" ? "Published vendor needs" : "Open couple opportunities"}
        description={mode === "couple" ? "Track pitches vendors send against your open needs." : "Find couples looking for your category and start a shared conversation."}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {data.opportunities.length ? (
          data.opportunities.map((opportunity) => (
            <article key={opportunity.id} className="rounded-2xl border border-[#eee7dd] bg-[#fffdf9] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="flex items-center gap-2 font-semibold text-[#191714]">
                    <Megaphone size={17} className="text-[#9a7a50]" />
                    {opportunity.title}
                  </p>
                  <p className="mt-1 text-sm text-[#6f6a61]">{opportunity.weddingName}</p>
                </div>
                <StatusBadge tone={opportunity.status === "Open" ? "gold" : "green"}>{opportunity.status}</StatusBadge>
              </div>
              <p className="mt-3 text-sm leading-6 text-[#6f6a61]">{opportunity.description}</p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-[#6f6a61]">
                {opportunity.category ? <span className="rounded-full border border-[#e7dfd3] px-3 py-1">{opportunity.category}</span> : null}
                {opportunity.budget ? <span className="rounded-full border border-[#e7dfd3] px-3 py-1">{formatCurrency(opportunity.budget)}</span> : null}
                {opportunity.location ? <span className="rounded-full border border-[#e7dfd3] px-3 py-1">{opportunity.location}</span> : null}
                {opportunity.date ? <span className="rounded-full border border-[#e7dfd3] px-3 py-1">{formatDate(opportunity.date)}</span> : null}
                {opportunity.guestCount ? <span className="rounded-full border border-[#e7dfd3] px-3 py-1">{opportunity.guestCount} guests</span> : null}
                <span className="rounded-full border border-[#e7dfd3] px-3 py-1">{opportunity.pitchCount} pitches</span>
              </div>
              {mode === "couple" ? (
                <Link href="/messages" className="mt-4 inline-flex h-10 items-center rounded-full border border-[#e7dfd3] px-4 text-sm font-semibold text-[#6f6a61]">
                  Review conversations
                </Link>
              ) : (
                actionFor?.(opportunity)
              )}
            </article>
          ))
        ) : (
          <p className="rounded-2xl bg-[#faf7f1] p-4 text-sm text-[#6f6a61] lg:col-span-2">
            {mode === "couple" ? "No vendor needs published yet." : "No open couple opportunities are available yet."}
          </p>
        )}
      </div>
    </section>
  );
}
