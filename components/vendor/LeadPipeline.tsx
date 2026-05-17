"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTransition } from "react";
import { ArrowRight, CheckCircle2, FileText, XCircle } from "lucide-react";
import { confirmBooking, createVendorQuote, moveLeadStage } from "@/app/actions";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { CoreLead, CoreLeadStage } from "@/types/core";

const stages: CoreLeadStage[] = ["New Inquiry", "Contacted", "Proposal Sent", "Negotiating", "Booked", "Completed", "Lost"];

export function LeadPipeline({ leads }: { leads: CoreLead[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [quoteLead, setQuoteLead] = useState<CoreLead | null>(null);
  const [quoteDraft, setQuoteDraft] = useState({
    amount: "",
    deposit: "",
    validUntil: "",
    dueDate: "",
    notes: "",
    included: "Planning consultation, event coverage, delivery coordination",
    excluded: "Travel outside the GTA, overtime, printed albums",
  });

  const nextStage = (stage: CoreLeadStage): CoreLeadStage => {
    const index = stages.indexOf(stage);
    return stages[Math.min(stages.length - 2, index + 1)];
  };

  const updateStage = (leadId: string, stage: CoreLeadStage) => {
    startTransition(async () => {
      await moveLeadStage({ leadId, stage });
      router.refresh();
    });
  };

  const bookLead = (leadId: string) => {
    startTransition(async () => {
      await confirmBooking({ leadId });
      router.refresh();
    });
  };

  const sendQuote = () => {
    if (!quoteLead) return;
    const amount = Number(quoteDraft.amount || quoteLead.estimatedValue);
    const deposit = quoteDraft.deposit ? Number(quoteDraft.deposit) : undefined;
    if (!Number.isFinite(amount) || amount <= 0) return;
    const includedItems = quoteDraft.included
      .split("\n")
      .flatMap((line) => line.split(","))
      .map((line) => line.trim())
      .filter(Boolean)
      .map((label) => ({ label, included: true }));
    const excludedItems = quoteDraft.excluded
      .split("\n")
      .flatMap((line) => line.split(","))
      .map((line) => line.trim())
      .filter(Boolean)
      .map((label) => ({ label, included: false }));
    startTransition(async () => {
      await createVendorQuote({
        inquiryId: quoteLead.inquiryId,
        vendorBusinessId: quoteLead.vendorId,
        serviceId: quoteLead.serviceId,
        amount,
        deposit,
        dueDate: quoteDraft.dueDate || undefined,
        validUntil: quoteDraft.validUntil || undefined,
        notes: quoteDraft.notes || undefined,
        lineItems: [...includedItems, ...excludedItems],
      });
      await moveLeadStage({ leadId: quoteLead.id, stage: "Proposal Sent" });
      setQuoteLead(null);
      setQuoteDraft({
        amount: "",
        deposit: "",
        validUntil: "",
        dueDate: "",
        notes: "",
        included: "Planning consultation, event coverage, delivery coordination",
        excluded: "Travel outside the GTA, overtime, printed albums",
      });
      router.refresh();
    });
  };

  return (
    <div>
      <SectionHeader
        title="Lead pipeline"
        description="New quote requests from the couple marketplace land here and can be moved through a vendor CRM workflow."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
        {stages.map((stage) => {
          const stageLeads = leads.filter((lead) => lead.stage === stage);
          return (
            <section key={stage} className="rounded-2xl border border-[#e7dfd3] bg-[#fbfaf8] p-3">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-[#191714]">{stage}</h3>
                <StatusBadge tone={stage === "Booked" ? "green" : stage === "Lost" ? "rose" : "neutral"}>{stageLeads.length}</StatusBadge>
              </div>
              <div className="space-y-3">
                {stageLeads.map((lead) => {
                  return (
                    <article key={lead.id} className="rounded-2xl border border-[#eee7dd] bg-white p-4 shadow-sm">
                      <p className="font-semibold text-[#191714]">{lead.coupleNames}</p>
                      <p className="mt-1 text-sm text-[#6f6a61]">{formatDate(lead.weddingDate)} - {lead.location}</p>
                      <div className="mt-3 space-y-1 text-sm text-[#4b463d]">
                        <p>{lead.guestCount} guests</p>
                        <p>{lead.vendorName || lead.serviceRequested}</p>
                        <p className="font-semibold">{formatCurrency(lead.estimatedValue)}</p>
                      </div>
                      <p className="mt-3 line-clamp-2 text-sm leading-5 text-[#6f6a61]">{lead.lastMessage}</p>
                      <div className="mt-4 grid gap-2">
                        {stage !== "Booked" && stage !== "Completed" && stage !== "Lost" ? (
                          <button
                            type="button"
                            onClick={() => updateStage(lead.id, nextStage(stage))}
                            disabled={pending}
                            className="flex h-9 items-center justify-center gap-2 rounded-full bg-[#191714] text-xs font-semibold text-white"
                          >
                            Move
                            <ArrowRight size={14} />
                          </button>
                        ) : null}
                        {stage !== "Booked" && stage !== "Completed" && stage !== "Lost" ? (
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setQuoteLead(lead);
                                setQuoteDraft((draft) => ({ ...draft, amount: String(lead.estimatedValue || "") }));
                              }}
                              disabled={pending}
                              className="flex h-9 items-center justify-center gap-1 rounded-full border border-[#d8c5aa] bg-[#fbf5ec] text-xs font-semibold text-[#7a582c]"
                            >
                              <FileText size={13} />
                              Send Quote
                            </button>
                            <button
                              type="button"
                              onClick={() => bookLead(lead.id)}
                              disabled={pending}
                              className="flex h-9 items-center justify-center gap-1 rounded-full border border-[#d6e2d2] bg-[#f3f8f1] text-xs font-semibold text-[#42633f]"
                            >
                              <CheckCircle2 size={13} />
                              Book
                            </button>
                          </div>
                        ) : null}
                        {stage !== "Lost" && stage !== "Booked" && stage !== "Completed" ? (
                          <button
                            type="button"
                            onClick={() => updateStage(lead.id, "Lost")}
                            disabled={pending}
                            className="flex h-9 items-center justify-center gap-1 rounded-full border border-[#efd5d4] bg-[#fff5f4] text-xs font-semibold text-[#93484d]"
                          >
                            <XCircle size={13} />
                            Mark Lost
                          </button>
                        ) : null}
                      </div>
                    </article>
                  );
                })}
                {!stageLeads.length ? (
                  <div className="rounded-2xl border border-dashed border-[#e7dfd3] p-4 text-sm text-[#8b8378]">No leads in this stage.</div>
                ) : null}
              </div>
            </section>
          );
        })}
      </div>
      {quoteLead ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-8" onClick={() => setQuoteLead(null)}>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              sendQuote();
            }}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-3xl rounded-3xl border border-[#e7dfd3] bg-white p-5 shadow-2xl sm:p-6"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#a47742]">Vendor quote</p>
                <h3 className="mt-2 font-display text-3xl font-semibold text-[#191714]">{quoteLead.coupleNames}</h3>
                <p className="mt-1 text-sm text-[#6f6a61]">
                  {quoteLead.serviceRequested} - {formatDate(quoteLead.weddingDate)}
                </p>
              </div>
              <button type="button" onClick={() => setQuoteLead(null)} className="h-10 rounded-full border border-[#e7dfd3] px-4 text-sm font-semibold text-[#6f6a61] transition hover:-translate-y-0.5">
                Cancel
              </button>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold text-[#4b463d]">
                Total quote
                <input value={quoteDraft.amount} onChange={(event) => setQuoteDraft((draft) => ({ ...draft, amount: event.target.value }))} inputMode="decimal" className="h-11 rounded-full border border-[#e7dfd3] bg-[#fffdf9] px-4 text-sm outline-none focus:border-[#c8a97e]" />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-[#4b463d]">
                Deposit
                <input value={quoteDraft.deposit} onChange={(event) => setQuoteDraft((draft) => ({ ...draft, deposit: event.target.value }))} inputMode="decimal" placeholder="Defaults to 35%" className="h-11 rounded-full border border-[#e7dfd3] bg-[#fffdf9] px-4 text-sm outline-none focus:border-[#c8a97e]" />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-[#4b463d]">
                Deposit due
                <input value={quoteDraft.dueDate} onChange={(event) => setQuoteDraft((draft) => ({ ...draft, dueDate: event.target.value }))} type="date" className="h-11 rounded-full border border-[#e7dfd3] bg-[#fffdf9] px-4 text-sm outline-none focus:border-[#c8a97e]" />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-[#4b463d]">
                Valid until
                <input value={quoteDraft.validUntil} onChange={(event) => setQuoteDraft((draft) => ({ ...draft, validUntil: event.target.value }))} type="date" className="h-11 rounded-full border border-[#e7dfd3] bg-[#fffdf9] px-4 text-sm outline-none focus:border-[#c8a97e]" />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-[#4b463d]">
                Included items
                <textarea value={quoteDraft.included} onChange={(event) => setQuoteDraft((draft) => ({ ...draft, included: event.target.value }))} className="min-h-28 rounded-2xl border border-[#e7dfd3] bg-[#fffdf9] px-4 py-3 text-sm outline-none focus:border-[#c8a97e]" />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-[#4b463d]">
                Exclusions / terms
                <textarea value={quoteDraft.excluded} onChange={(event) => setQuoteDraft((draft) => ({ ...draft, excluded: event.target.value }))} className="min-h-28 rounded-2xl border border-[#e7dfd3] bg-[#fffdf9] px-4 py-3 text-sm outline-none focus:border-[#c8a97e]" />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-[#4b463d] md:col-span-2">
                Quote note
                <textarea value={quoteDraft.notes} onChange={(event) => setQuoteDraft((draft) => ({ ...draft, notes: event.target.value }))} placeholder="Personalize the proposal message or package context." className="min-h-24 rounded-2xl border border-[#e7dfd3] bg-[#fffdf9] px-4 py-3 text-sm outline-none focus:border-[#c8a97e]" />
              </label>
            </div>
            <button disabled={pending} className="mt-5 h-12 w-full rounded-full bg-[#191714] text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60">
              {pending ? "Sending quote..." : "Send quote and move to proposal"}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
