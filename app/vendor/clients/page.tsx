"use client";

import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageWrapper } from "@/components/animations/PageWrapper";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatDate } from "@/lib/utils";
import { useWeddingStore } from "@/store/useWeddingStore";

export default function VendorClientsPage() {
  const clients = useWeddingStore((state) => state.clientRecords);

  return (
    <AppLayout mode="vendor">
      <PageWrapper>
        <SectionHeader eyebrow="Vendor portal" title="Client management" description="Client cards centralize package, payment, contract, notes, and conversation access." />
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {clients.map((client) => (
            <article key={client.id} className="rounded-2xl border border-[#e7dfd3] bg-white p-5 luxury-shadow">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">{client.coupleNames}</h2>
                  <p className="mt-1 text-sm text-[#6f6a61]">{formatDate(client.weddingDate)}</p>
                </div>
                <StatusBadge tone={client.contractStatus === "Signed" ? "green" : "gold"}>{client.contractStatus}</StatusBadge>
              </div>
              <div className="mt-5 space-y-3 text-sm">
                <p><span className="font-semibold">Package:</span> {client.packageName}</p>
                <p><span className="font-semibold">Payment:</span> {client.paymentStatus}</p>
                <p className="leading-6 text-[#6f6a61]">{client.notes}</p>
              </div>
              <Link href="/vendor/messages" className="mt-5 flex h-10 items-center justify-center rounded-full bg-[#191714] text-sm font-semibold text-white">
                Messages
              </Link>
            </article>
          ))}
        </div>
      </PageWrapper>
    </AppLayout>
  );
}
