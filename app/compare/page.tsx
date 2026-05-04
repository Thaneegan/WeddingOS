"use client";

import { MessageSquarePlus, Trash2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageWrapper } from "@/components/animations/PageWrapper";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatCurrency } from "@/lib/utils";
import { useWeddingStore } from "@/store/useWeddingStore";

export default function ComparePage() {
  const vendors = useWeddingStore((state) => state.vendors);
  const comparisonVendorIds = useWeddingStore((state) => state.comparisonVendorIds);
  const removeVendorFromCompare = useWeddingStore((state) => state.removeVendorFromCompare);
  const sendInquiry = useWeddingStore((state) => state.sendInquiry);
  const compared = vendors.filter((vendor) => comparisonVendorIds.includes(vendor.id));

  return (
    <AppLayout>
      <PageWrapper>
        <SectionHeader eyebrow="Couple workspace" title="Vendor comparison" description="Compare saved vendors side by side before requesting quotes or booking." />
        <div className="grid gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {compared.map((vendor) => (
            <article key={vendor.id} className="rounded-2xl border border-[#e7dfd3] bg-white p-4 luxury-shadow">
              <img src={vendor.image} alt={vendor.name} className="h-40 w-full rounded-xl object-cover" />
              <div className="mt-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[#9a7a50]">{vendor.category}</p>
                  <h2 className="mt-1 text-xl font-semibold">{vendor.name}</h2>
                </div>
                <button onClick={() => removeVendorFromCompare(vendor.id)} className="flex size-9 items-center justify-center rounded-full border border-[#e7dfd3]" aria-label="Remove vendor">
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="mt-4 space-y-3 text-sm">
                <CompareRow label="Rating" value={`${vendor.rating} / 5`} />
                <CompareRow label="Price" value={formatCurrency(vendor.startingPrice)} />
                <CompareRow label="Location" value={vendor.location} />
                <CompareRow label="Availability" value={vendor.availability} />
                <CompareRow label="Response" value={vendor.responseTime} />
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#6f6a61]">Match score</span>
                  <StatusBadge tone="dark">{vendor.matchScore}%</StatusBadge>
                </div>
              </div>
              <div className="mt-4 grid gap-2">
                <button onClick={() => sendInquiry(vendor.id)} className="flex h-10 items-center justify-center gap-2 rounded-full bg-[#191714] text-sm font-semibold text-white">
                  <MessageSquarePlus size={15} />
                  Request quote
                </button>
              </div>
            </article>
          ))}
        </div>
        {!compared.length ? (
          <div className="rounded-2xl border border-dashed border-[#e7dfd3] bg-white p-8 text-center text-[#6f6a61]">
            Add vendors from the marketplace to compare options here.
          </div>
        ) : null}
      </PageWrapper>
    </AppLayout>
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
