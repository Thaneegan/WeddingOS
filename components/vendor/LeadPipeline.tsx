"use client";

import { ArrowRight, CheckCircle2, FileText, XCircle } from "lucide-react";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useWeddingStore } from "@/store/useWeddingStore";
import type { LeadStage } from "@/types";

const stages: LeadStage[] = ["New Inquiry", "Contacted", "Proposal Sent", "Negotiating", "Booked", "Completed", "Lost"];

export function LeadPipeline() {
  const leads = useWeddingStore((state) => state.leads);
  const vendors = useWeddingStore((state) => state.vendors);
  const moveLeadStage = useWeddingStore((state) => state.moveLeadStage);
  const sendProposal = useWeddingStore((state) => state.sendProposal);
  const bookVendor = useWeddingStore((state) => state.bookVendor);

  const nextStage = (stage: LeadStage): LeadStage => {
    const index = stages.indexOf(stage);
    return stages[Math.min(stages.length - 2, index + 1)];
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
                  const vendor = vendors.find((item) => item.id === lead.vendorId);
                  return (
                    <article key={lead.id} className="rounded-2xl border border-[#eee7dd] bg-white p-4 shadow-sm">
                      <p className="font-semibold text-[#191714]">{lead.coupleNames}</p>
                      <p className="mt-1 text-sm text-[#6f6a61]">{formatDate(lead.weddingDate)} - {lead.location}</p>
                      <div className="mt-3 space-y-1 text-sm text-[#4b463d]">
                        <p>{lead.guestCount} guests</p>
                        <p>{vendor?.name ?? lead.serviceRequested}</p>
                        <p className="font-semibold">{formatCurrency(lead.estimatedValue)}</p>
                      </div>
                      <p className="mt-3 line-clamp-2 text-sm leading-5 text-[#6f6a61]">{lead.lastMessage}</p>
                      <div className="mt-4 grid gap-2">
                        {stage !== "Booked" && stage !== "Completed" && stage !== "Lost" ? (
                          <button
                            type="button"
                            onClick={() => moveLeadStage(lead.id, nextStage(stage))}
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
                              onClick={() => sendProposal(lead.id)}
                              className="flex h-9 items-center justify-center gap-1 rounded-full border border-[#d8c5aa] bg-[#fbf5ec] text-xs font-semibold text-[#7a582c]"
                            >
                              <FileText size={13} />
                              Proposal
                            </button>
                            <button
                              type="button"
                              onClick={() => bookVendor(lead.id)}
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
                            onClick={() => moveLeadStage(lead.id, "Lost")}
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
    </div>
  );
}
