"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarPlus, FileText, Save, Video } from "lucide-react";
import {
  createInvoiceRecord,
  createPaymentScheduleItem,
  createScheduledCall,
  updateBooking,
  updateContractRecord,
} from "@/app/actions";
import { FileAssetManager } from "@/components/shared/FileAssetManager";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { CoreVendorClient, CoreVendorClientsData } from "@/types/core";

function bookingTone(status?: string) {
  if (status === "Completed" || status === "Confirmed") return "green";
  if (status === "Cancelled") return "rose";
  return "gold";
}

export function VendorClientsClient({ data }: { data: CoreVendorClientsData }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {data.clients.map((client) => (
          <ClientCard key={`${client.recordType}-${client.id}`} client={client} services={data.services} />
        ))}
      </div>
      {!data.clients.length ? (
        <div className="rounded-2xl border border-dashed border-[#e7dfd3] bg-white p-8 text-center text-[#6f6a61]">
          Book a lead from the CRM to create the first client record.
        </div>
      ) : null}
    </div>
  );
}

function ClientCard({ client, services }: { client: CoreVendorClient; services: { id: string; name: string }[] }) {
  const router = useRouter();
  const [draft, setDraft] = useState({
    amount: client.amount?.toString() ?? "",
    status: client.bookingStatus ?? "Confirmed",
    serviceId: client.serviceId ?? "",
    contractStatus: client.contractStatus,
    notes: client.notes,
  });
  const [paymentForm, setPaymentForm] = useState({ label: "Next payment", amount: client.amount?.toString() ?? "", dueDate: "2026-06-30", status: "Planned" });
  const [invoiceForm, setInvoiceForm] = useState({ label: "Client invoice", amount: client.amount?.toString() ?? "", dueDate: "2026-06-30", status: "DRAFT" });
  const [callForm, setCallForm] = useState({ title: "Client planning call", callUrl: "", startsAt: "", durationMinutes: "30" });

  return (
    <article className="rounded-2xl border border-[#e7dfd3] bg-white p-5 luxury-shadow">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">{client.coupleNames}</h2>
          <p className="mt-1 text-sm text-[#6f6a61]">{formatDate(client.weddingDate)}</p>
        </div>
        <StatusBadge tone={bookingTone(client.bookingStatus)}>{client.recordType === "booking" ? client.bookingStatus ?? "Booked" : "Lead"}</StatusBadge>
      </div>

      {client.recordType === "booking" ? (
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            await updateBooking({
              bookingId: client.id,
              fields: {
                amount: draft.amount ? Number(draft.amount) : undefined,
                status: draft.status,
                serviceId: draft.serviceId || null,
                notes: draft.notes || null,
              },
            });
            if (client.contractId) {
              await updateContractRecord({ contractRecordId: client.contractId, fields: { status: draft.contractStatus } });
            }
            router.refresh();
          }}
          className="mt-5 grid gap-3"
        >
          <input value={draft.amount} onChange={(event) => setDraft((item) => ({ ...item, amount: event.target.value }))} inputMode="decimal" className="h-10 rounded-full border border-[#e7dfd3] bg-[#fffdf9] px-3 text-sm" placeholder="Amount" />
          <select value={draft.status} onChange={(event) => setDraft((item) => ({ ...item, status: event.target.value }))} className="h-10 rounded-full border border-[#e7dfd3] bg-[#fffdf9] px-3 text-sm font-semibold">
            <option>Pending</option>
            <option>Confirmed</option>
            <option>Completed</option>
            <option>Cancelled</option>
          </select>
          <select value={draft.serviceId} onChange={(event) => setDraft((item) => ({ ...item, serviceId: event.target.value }))} className="h-10 rounded-full border border-[#e7dfd3] bg-[#fffdf9] px-3 text-sm font-semibold">
            <option value="">No service</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </select>
          <select value={draft.contractStatus} onChange={(event) => setDraft((item) => ({ ...item, contractStatus: event.target.value }))} className="h-10 rounded-full border border-[#e7dfd3] bg-[#fffdf9] px-3 text-sm font-semibold">
            <option>Draft</option>
            <option>Pending</option>
            <option>Signed</option>
          </select>
          <textarea value={draft.notes} onChange={(event) => setDraft((item) => ({ ...item, notes: event.target.value }))} className="min-h-20 rounded-2xl border border-[#e7dfd3] bg-[#fffdf9] px-3 py-2 text-sm" placeholder="Client notes" />
          <button className="flex h-10 items-center justify-center gap-2 rounded-full bg-[#191714] px-4 text-sm font-semibold text-white">
            <Save size={16} />
            Save client
          </button>
        </form>
      ) : (
        <div className="mt-5 space-y-3 text-sm">
          <p>
            <span className="font-semibold">Package:</span> {client.packageName}
          </p>
          <p className="leading-6 text-[#6f6a61]">{client.notes}</p>
          <Link href="/vendor/leads" className="flex h-10 items-center justify-center rounded-full bg-[#191714] text-sm font-semibold text-white">
            Open lead
          </Link>
        </div>
      )}

      {client.recordType === "booking" ? (
        <div className="mt-5 space-y-5">
          <section className="rounded-2xl border border-[#eee7dd] bg-[#fffdf9] p-4">
            <SectionHeader title="Payments" />
            <form
              onSubmit={async (event) => {
                event.preventDefault();
                if (!paymentForm.label.trim() || !paymentForm.amount || !paymentForm.dueDate) return;
                await createPaymentScheduleItem({
                  bookingId: client.id,
                  label: paymentForm.label,
                  amount: Number(paymentForm.amount),
                  dueDate: paymentForm.dueDate,
                  status: paymentForm.status,
                });
                router.refresh();
              }}
              className="grid gap-2"
            >
              <input value={paymentForm.label} onChange={(event) => setPaymentForm((item) => ({ ...item, label: event.target.value }))} className="h-10 rounded-full border border-[#e7dfd3] bg-white px-3 text-sm" />
              <input value={paymentForm.amount} onChange={(event) => setPaymentForm((item) => ({ ...item, amount: event.target.value }))} inputMode="decimal" className="h-10 rounded-full border border-[#e7dfd3] bg-white px-3 text-sm" />
              <input value={paymentForm.dueDate} onChange={(event) => setPaymentForm((item) => ({ ...item, dueDate: event.target.value }))} type="date" className="h-10 rounded-full border border-[#e7dfd3] bg-white px-3 text-sm" />
              <button className="flex h-10 items-center justify-center gap-2 rounded-full border border-[#e7dfd3] bg-white px-3 text-sm font-semibold">
                <CalendarPlus size={15} />
                Add payment
              </button>
            </form>
            <div className="mt-3 space-y-2">
              {client.paymentSchedule.map((item) => (
                <p key={item.id} className="text-sm text-[#6f6a61]">{item.label}: {formatCurrency(item.amount)} due {formatDate(item.dueDate)}</p>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-[#eee7dd] bg-[#fffdf9] p-4">
            <SectionHeader title="Invoices" />
            <form
              onSubmit={async (event) => {
                event.preventDefault();
                if (!invoiceForm.label.trim() || !invoiceForm.amount) return;
                await createInvoiceRecord({
                  bookingId: client.id,
                  weddingId: client.weddingId,
                  vendorBusinessId: client.vendorBusinessId,
                  label: invoiceForm.label,
                  amount: Number(invoiceForm.amount),
                  status: invoiceForm.status as "DRAFT",
                  dueDate: invoiceForm.dueDate || undefined,
                });
                router.refresh();
              }}
              className="grid gap-2"
            >
              <input value={invoiceForm.label} onChange={(event) => setInvoiceForm((item) => ({ ...item, label: event.target.value }))} className="h-10 rounded-full border border-[#e7dfd3] bg-white px-3 text-sm" />
              <input value={invoiceForm.amount} onChange={(event) => setInvoiceForm((item) => ({ ...item, amount: event.target.value }))} inputMode="decimal" className="h-10 rounded-full border border-[#e7dfd3] bg-white px-3 text-sm" />
              <input value={invoiceForm.dueDate} onChange={(event) => setInvoiceForm((item) => ({ ...item, dueDate: event.target.value }))} type="date" className="h-10 rounded-full border border-[#e7dfd3] bg-white px-3 text-sm" />
              <button className="flex h-10 items-center justify-center gap-2 rounded-full border border-[#e7dfd3] bg-white px-3 text-sm font-semibold">
                <FileText size={15} />
                Add invoice
              </button>
            </form>
            <div className="mt-3 space-y-2">
              {client.invoices.map((item) => (
                <p key={item.id} className="text-sm text-[#6f6a61]">{item.label}: {formatCurrency(item.amount)} {item.dueDate ? `due ${formatDate(item.dueDate)}` : ""}</p>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-[#eee7dd] bg-[#fffdf9] p-4">
            <SectionHeader title="Scheduled calls" />
            <form
              onSubmit={async (event) => {
                event.preventDefault();
                if (!callForm.title.trim() || !callForm.callUrl.trim() || !callForm.startsAt) return;
                await createScheduledCall({
                  bookingId: client.id,
                  weddingId: client.weddingId,
                  vendorBusinessId: client.vendorBusinessId,
                  title: callForm.title,
                  callUrl: callForm.callUrl,
                  startsAt: callForm.startsAt,
                  durationMinutes: Number(callForm.durationMinutes) || 30,
                });
                setCallForm({ title: "Client planning call", callUrl: "", startsAt: "", durationMinutes: "30" });
                router.refresh();
              }}
              className="grid gap-2"
            >
              <input value={callForm.title} onChange={(event) => setCallForm((item) => ({ ...item, title: event.target.value }))} className="h-10 rounded-full border border-[#e7dfd3] bg-white px-3 text-sm" />
              <input value={callForm.callUrl} onChange={(event) => setCallForm((item) => ({ ...item, callUrl: event.target.value }))} placeholder="Zoom or Meet URL" className="h-10 rounded-full border border-[#e7dfd3] bg-white px-3 text-sm" />
              <input value={callForm.startsAt} onChange={(event) => setCallForm((item) => ({ ...item, startsAt: event.target.value }))} type="datetime-local" className="h-10 rounded-full border border-[#e7dfd3] bg-white px-3 text-sm" />
              <button className="flex h-10 items-center justify-center gap-2 rounded-full border border-[#e7dfd3] bg-white px-3 text-sm font-semibold">
                <Video size={15} />
                Add call
              </button>
            </form>
            <div className="mt-3 space-y-2">
              {client.scheduledCalls.map((item) => (
                <a key={item.id} href={item.callUrl} target="_blank" rel="noreferrer" className="block text-sm font-semibold text-[#6f6a61]">{item.title}: {formatDate(item.startsAt)}</a>
              ))}
            </div>
          </section>

          <FileAssetManager
            ownerType="BOOKING"
            ownerId={client.id}
            purpose="CONTRACT"
            label="Upload client file"
            description="Attach contracts, invoices, galleries, or working documents to this client booking."
            files={client.files}
          />
        </div>
      ) : null}
    </article>
  );
}
