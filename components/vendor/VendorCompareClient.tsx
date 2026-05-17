"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { AlertCircle, CalendarDays, CheckCircle2, Clock3, MessageSquarePlus, Save, ShieldCheck, StickyNote, Trash2 } from "lucide-react";
import { acceptVendorQuote, createInquiry, removeVendorFromCompare, updateQuoteComparisonNote } from "@/app/actions";
import { ImagePlaceholder } from "@/components/shared/ImagePlaceholder";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { CoreVendorCard, CoreVendorQuote } from "@/types/core";

export function VendorCompareClient({ vendors, embedded = false }: { vendors: CoreVendorCard[]; embedded?: boolean }) {
  const router = useRouter();
  const [acceptingQuote, setAcceptingQuote] = useState<{ vendor: CoreVendorCard; quote: CoreVendorQuote } | null>(null);
  const [depositDueDate, setDepositDueDate] = useState("");
  const [reviewFilter, setReviewFilter] = useState<"all" | "needs-decision" | "waiting" | "accepted">("all");
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>(() =>
    Object.fromEntries(vendors.map((vendor) => [vendor.id, vendor.comparisonNote ?? ""])),
  );
  const [savingNoteId, setSavingNoteId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const quoteStats = useMemo(() => {
    const quoted = vendors.filter((vendor) => vendor.quotes?.[0]);
    const accepted = vendors.filter((vendor) => vendor.quotes?.[0]?.status.toLowerCase() === "accepted");
    const needsDecision = vendors.filter((vendor) => {
      const quote = vendor.quotes?.[0];
      return quote && quote.status.toLowerCase() !== "accepted";
    });
    const waiting = vendors.filter((vendor) => vendor.existingInquiry && !vendor.quotes?.[0]);
    const lowestQuote = quoted.reduce<CoreVendorQuote | null>((lowest, vendor) => {
      const quote = vendor.quotes?.[0];
      if (!quote) return lowest;
      return !lowest || quote.amount < lowest.amount ? quote : lowest;
    }, null);

    return {
      quoted: quoted.length,
      accepted: accepted.length,
      needsDecision: needsDecision.length,
      waiting: waiting.length,
      lowestQuote,
    };
  }, [vendors]);
  const visibleVendors = useMemo(
    () =>
      vendors.filter((vendor) => {
        const quote = vendor.quotes?.[0];
        if (reviewFilter === "needs-decision") return Boolean(quote && quote.status.toLowerCase() !== "accepted");
        if (reviewFilter === "waiting") return vendor.existingInquiry && !quote;
        if (reviewFilter === "accepted") return quote?.status.toLowerCase() === "accepted";
        return true;
      }),
    [reviewFilter, vendors],
  );

  if (!vendors.length) {
    return (
      <div className="rounded-2xl border border-dashed border-[#e7dfd3] bg-white p-8 text-center text-[#6f6a61]">
        Add vendors from the marketplace to compare options here.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {!embedded ? (
        <section className="rounded-2xl border border-[#e7dfd3] bg-white p-5 luxury-shadow">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9a7a50]">Decision queue</p>
              <h2 className="mt-2 font-display text-3xl font-semibold text-[#191714]">What needs a quote decision?</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6f6a61]">
                Compare the numbers, review what is included and excluded, write down family feedback, then accept the quote only when the terms are clear.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <QuoteMetric label="Quoted" value={quoteStats.quoted} />
              <QuoteMetric label="Decide" value={quoteStats.needsDecision} />
              <QuoteMetric label="Waiting" value={quoteStats.waiting} />
              <QuoteMetric label="Booked" value={quoteStats.accepted} />
            </div>
          </div>
          <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_340px]">
            <div className="rounded-2xl border border-[#eee7dd] bg-[#fffdf9] p-4">
              <p className="text-sm font-semibold text-[#191714]">Quote review checklist</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {["Total cost and deposit", "Included deliverables", "Exclusions and overtime", "Valid-until date", "Availability", "Family decision notes"].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm text-[#6f6a61]">
                    <CheckCircle2 size={15} className="text-[#61735f]" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-[#eadcc6] bg-[#fbf5ec] p-4">
              <p className="text-sm font-semibold text-[#191714]">Current lowest quote</p>
              <p className="mt-2 font-display text-3xl font-semibold text-[#191714]">
                {quoteStats.lowestQuote ? formatCurrency(quoteStats.lowestQuote.amount) : "No quotes yet"}
              </p>
              <p className="mt-1 text-sm text-[#6f6a61]">
                {quoteStats.lowestQuote ? `Deposit ${formatCurrency(quoteStats.lowestQuote.deposit)}` : "Request quotes from shortlisted vendors to compare real terms."}
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {[
          ["all", "All"],
          ["needs-decision", "Needs decision"],
          ["waiting", "Waiting for quote"],
          ["accepted", "Accepted"],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setReviewFilter(value as typeof reviewFilter)}
            className={`h-10 rounded-full px-4 text-sm font-semibold transition hover:-translate-y-0.5 ${reviewFilter === value ? "bg-[#191714] text-white" : "border border-[#e7dfd3] bg-white text-[#6f6a61]"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {visibleVendors.length ? (
        <div className={embedded ? "grid gap-5 md:grid-cols-2 xl:grid-cols-3" : "grid gap-4 lg:grid-cols-3 xl:grid-cols-4"}>
      {visibleVendors.map((vendor) => (
        <article key={vendor.id} className="rounded-2xl border border-[#e7dfd3] bg-white p-4 luxury-shadow">
          {(() => {
            const quote = vendor.quotes?.[0];
            const quoteAccepted = quote?.status.toLowerCase() === "accepted";
            const quoteNeedsDecision = quote && !quoteAccepted;
            return (
              <>
          {vendor.image ? (
            <img src={vendor.image} alt={vendor.name} className="h-40 w-full rounded-xl object-cover" />
          ) : (
            <ImagePlaceholder label={vendor.name} className="h-40 w-full rounded-xl" />
          )}
          <div className="mt-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[#9a7a50]">{vendor.category}</p>
              <h2 className="mt-1 text-xl font-semibold">{vendor.name}</h2>
              <div className="mt-2">
                {quoteAccepted ? (
                  <StatusBadge tone="green">Booked</StatusBadge>
                ) : quoteNeedsDecision ? (
                  <StatusBadge tone="gold">Needs decision</StatusBadge>
                ) : vendor.existingInquiry ? (
                  <StatusBadge tone="neutral">Waiting for quote</StatusBadge>
                ) : (
                  <StatusBadge tone="rose">Quote not requested</StatusBadge>
                )}
              </div>
            </div>
            <button
              onClick={async () => {
                await removeVendorFromCompare({ vendorBusinessId: vendor.id });
                router.refresh();
              }}
              className="flex size-9 items-center justify-center rounded-full border border-[#e7dfd3]"
              aria-label="Remove vendor"
            >
              <Trash2 size={16} />
            </button>
          </div>
          <div className="mt-4 space-y-3 text-sm">
            {quote ? (
              <div className="rounded-2xl border border-[#eadcc6] bg-[#fbf5ec] p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9a7a50]">Quote received</p>
                  <StatusBadge tone={quoteAccepted ? "green" : "gold"}>{quote.status}</StatusBadge>
                </div>
                <div className="mt-2 grid gap-2">
                  <CompareRow label="Quoted total" value={formatCurrency(quote.amount)} />
                  <CompareRow label="Deposit" value={formatCurrency(quote.deposit)} />
                  {quote.validUntil ? <CompareRow label="Valid until" value={formatDate(quote.validUntil)} /> : null}
                </div>
                {quote.notes ? <p className="mt-3 text-xs leading-5 text-[#6f6a61]">{quote.notes}</p> : null}
                {quote.lineItems.length ? (
                  <div className="mt-3 grid gap-2">
                    <QuoteLineGroup title="Included" items={quote.lineItems.filter((lineItem) => lineItem.included).slice(0, 4)} />
                    <QuoteLineGroup title="Excluded / terms" items={quote.lineItems.filter((lineItem) => !lineItem.included).slice(0, 4)} />
                  </div>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    setAcceptingQuote({ vendor, quote });
                    setDepositDueDate(quote.dueDate ? quote.dueDate.slice(0, 10) : "");
                  }}
                  disabled={quoteAccepted}
                  className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-full bg-[#191714] text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#2b2822] disabled:cursor-not-allowed disabled:bg-[#bfb6aa]"
                >
                  <ShieldCheck size={15} />
                  {quoteAccepted ? "Quote accepted" : "Accept quote"}
                </button>
              </div>
            ) : null}
            {!quote && vendor.existingInquiry ? (
              <div className="rounded-2xl border border-[#eadcc6] bg-[#fbf5ec] p-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#7a582c]">
                  <Clock3 size={15} />
                  Waiting for quote
                </div>
                <p className="mt-2 text-xs leading-5 text-[#6f6a61]">The inquiry is open. Follow up in Messages if timing matters or if you need package details before deciding.</p>
                <button
                  type="button"
                  onClick={() => router.push("/messages")}
                  className="mt-3 flex h-9 w-full items-center justify-center rounded-full border border-[#d8c5aa] bg-white text-xs font-semibold text-[#7a582c] transition hover:-translate-y-0.5"
                >
                  Follow up in messages
                </button>
              </div>
            ) : null}
            {!quote && !vendor.existingInquiry ? (
              <div className="rounded-2xl border border-[#efd5d4] bg-[#fff5f4] p-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#93484d]">
                  <AlertCircle size={15} />
                  Quote not requested
                </div>
                <p className="mt-2 text-xs leading-5 text-[#6f6a61]">Request a quote before making a decision so pricing, deposit, and inclusions can be compared fairly.</p>
              </div>
            ) : null}
            <CompareRow label="Rating" value={`${vendor.rating} / 5`} />
            <CompareRow label="Price" value={formatCurrency(vendor.startingPrice)} />
            <CompareRow label="Location" value={vendor.location} />
            <CompareRow label="Availability" value={vendor.availability} />
            <CompareRow label="Response" value={vendor.responseTime} />
            <div className="flex items-center justify-between gap-2">
              <span className="text-[#6f6a61]">Match score</span>
              <StatusBadge tone="dark">{vendor.matchScore}%</StatusBadge>
            </div>
            <div className="rounded-2xl border border-[#eee7dd] bg-[#fffdf9] p-3">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#9a7a50]">
                <StickyNote size={14} />
                Decision notes
              </div>
              <textarea
                value={noteDrafts[vendor.id] ?? ""}
                onChange={(event) => setNoteDrafts((drafts) => ({ ...drafts, [vendor.id]: event.target.value }))}
                placeholder="Add fit, concerns, family feedback, or negotiation notes."
                maxLength={2000}
                className="min-h-24 w-full resize-none rounded-2xl border border-[#e7dfd3] bg-white px-3 py-2 text-sm outline-none transition focus:border-[#c8a97e]"
              />
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="text-xs text-[#8b8378]">{(noteDrafts[vendor.id] ?? "").length}/2000</span>
                <button
                  type="button"
                  onClick={async () => {
                    setSavingNoteId(vendor.id);
                    await updateQuoteComparisonNote({
                      vendorBusinessId: vendor.id,
                      notes: noteDrafts[vendor.id] ?? "",
                    });
                    setSavingNoteId(null);
                    router.refresh();
                  }}
                  disabled={savingNoteId === vendor.id}
                  className="flex h-9 items-center justify-center gap-2 rounded-full border border-[#d8c5aa] bg-[#fbf5ec] px-4 text-xs font-semibold text-[#7a582c] transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60"
                >
                  <Save size={13} />
                  {savingNoteId === vendor.id ? "Saving" : "Save note"}
                </button>
              </div>
            </div>
          </div>
          <div className="mt-4 grid gap-2">
            <button
              onClick={async () => {
                if (vendor.existingInquiry) return;
                await createInquiry({
                  vendorBusinessId: vendor.id,
                  message: `Hi ${vendor.name}, could you send a quote and availability for our wedding?`,
                });
                router.refresh();
              }}
              disabled={vendor.existingInquiry}
              className="flex h-10 items-center justify-center gap-2 rounded-full bg-[#191714] text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#cfc7bb]"
            >
              {vendor.existingInquiry ? <CheckCircle2 size={15} /> : <MessageSquarePlus size={15} />}
              {vendor.existingInquiry ? "Quote requested" : "Request quote"}
            </button>
            {vendor.existingInquiry ? (
              <button
                type="button"
                onClick={() => router.push("/messages")}
                className="flex h-10 items-center justify-center rounded-full border border-[#d8c5aa] bg-[#fbf5ec] text-sm font-semibold text-[#7a582c]"
              >
                Open messages
              </button>
            ) : null}
          </div>
              </>
            );
          })()}
        </article>
      ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[#e7dfd3] bg-white p-8 text-center text-[#6f6a61]">
          No vendors match this quote review filter.
        </div>
      )}
      {acceptingQuote ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-8" onClick={() => setAcceptingQuote(null)}>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              startTransition(async () => {
                await acceptVendorQuote({
                  quoteId: acceptingQuote.quote.id,
                  depositDueDate: depositDueDate || undefined,
                });
                setAcceptingQuote(null);
                router.refresh();
              });
            }}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-2xl rounded-3xl border border-[#e7dfd3] bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#a47742]">Confirm booking</p>
                <h3 className="mt-2 font-display text-3xl font-semibold text-[#191714]">{acceptingQuote.vendor.name}</h3>
                <p className="mt-2 text-sm leading-6 text-[#6f6a61]">
                  Accepting this quote creates a confirmed booking, budget item, deposit schedule, draft contract, and conversation update.
                </p>
              </div>
              <button type="button" onClick={() => setAcceptingQuote(null)} className="h-10 rounded-full border border-[#e7dfd3] px-4 text-sm font-semibold text-[#6f6a61] transition hover:-translate-y-0.5">
                Cancel
              </button>
            </div>
            <div className="mt-5 grid gap-3 rounded-2xl border border-[#eee7dd] bg-[#fffdf9] p-4 sm:grid-cols-2">
              <CompareRow label="Quoted total" value={formatCurrency(acceptingQuote.quote.amount)} />
              <CompareRow label="Deposit" value={formatCurrency(acceptingQuote.quote.deposit)} />
              <label className="grid gap-2 text-sm font-semibold text-[#4b463d] sm:col-span-2">
                Deposit due date
                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9a7a50]" size={16} />
                  <input
                    type="date"
                    value={depositDueDate}
                    onChange={(event) => setDepositDueDate(event.target.value)}
                    className="h-11 w-full rounded-full border border-[#e7dfd3] bg-white pl-11 pr-4 text-sm outline-none focus:border-[#c8a97e]"
                  />
                </div>
              </label>
            </div>
            <button disabled={pending} className="mt-5 h-12 w-full rounded-full bg-[#191714] text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60">
              {pending ? "Creating booking..." : "Accept quote and create booking"}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function QuoteMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-[#eee7dd] bg-[#fffdf9] px-4 py-3 text-center">
      <p className="font-display text-3xl font-semibold text-[#191714]">{value}</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#9a7a50]">{label}</p>
    </div>
  );
}

function QuoteLineGroup({ title, items }: { title: string; items: CoreVendorQuote["lineItems"] }) {
  if (!items.length) return null;

  return (
    <div className="rounded-xl bg-white/70 p-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9a7a50]">{title}</p>
      <div className="mt-1 space-y-1">
        {items.map((lineItem) => (
          <p key={lineItem.id} className="text-xs leading-5 text-[#6f6a61]">
            {lineItem.label}
            {lineItem.amount ? ` (${formatCurrency(lineItem.amount)})` : ""}
          </p>
        ))}
      </div>
    </div>
  );
}

function CompareRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-[#eee7dd] pb-2">
      <span className="text-[#6f6a61]">{label}</span>
      <span className="text-right font-semibold">{value}</span>
    </div>
  );
}
