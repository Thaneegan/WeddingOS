"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, ClipboardList, FileText, FolderOpen, ReceiptText, Search } from "lucide-react";
import { FileAssetManager } from "@/components/shared/FileAssetManager";
import { formatDate } from "@/lib/utils";
import type { CoreDocumentsData } from "@/types/core";

export function DocumentsHub({ data }: { data: CoreDocumentsData }) {
  const [eventFilter, setEventFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [search, setSearch] = useState("");
  const purposeOptions = useMemo(() => Array.from(new Set(data.files.map((file) => file.purpose))).sort(), [data.files]);
  const normalizedSearch = search.trim().toLowerCase();
  const visibleFiles = data.files.filter((file) => {
    if (typeFilter !== "All" && file.purpose !== typeFilter) return false;
    if (eventFilter !== "All" && !(file.ownerType === "EVENT" && file.ownerId === eventFilter)) return false;
    if (normalizedSearch && ![file.fileName, file.purpose, file.ownerType].join(" ").toLowerCase().includes(normalizedSearch)) return false;
    return true;
  });
  const contractCount = data.files.filter((file) => file.purpose === "CONTRACT").length;
  const invoiceCount = data.files.filter((file) => file.purpose === "INVOICE").length;
  const eventLinkedCount = data.files.filter((file) => file.ownerType === "EVENT").length;
  const readinessItems = [
    {
      label: "Contracts",
      value: contractCount,
      detail: contractCount ? "Uploaded for review" : "Upload signed vendor contracts",
      ready: contractCount > 0,
      icon: FileText,
    },
    {
      label: "Invoices",
      value: invoiceCount,
      detail: invoiceCount ? "Tracked in one place" : "Add invoices as vendors send them",
      ready: invoiceCount > 0,
      icon: ReceiptText,
    },
    {
      label: "Event files",
      value: eventLinkedCount,
      detail: eventLinkedCount ? "Linked to event folders" : "Link files to event folders",
      ready: eventLinkedCount > 0,
      icon: FolderOpen,
    },
  ];

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <Metric label="Files" value={data.files.length} />
        <Metric label="Events" value={data.events.length} />
        <Metric label="Vendors linked" value={data.vendors.length} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-[#e7dfd3] bg-white p-5 luxury-shadow">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9a7a50]">Document readiness</p>
              <h2 className="mt-1 font-display text-3xl font-semibold text-[#191714]">Keep event-critical files findable</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6f6a61]">
                Couples come here to find contracts, invoices, menus, floor plans, ceremony notes, and seating files before calls or event week.
              </p>
            </div>
            <Link href="/run-sheet" className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[#e7dfd3] bg-white px-4 text-sm font-semibold text-[#6f6a61] transition hover:-translate-y-0.5 hover:border-[#c8a97e]">
              <ClipboardList size={16} />
              Run sheets
            </Link>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {readinessItems.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => setTypeFilter(item.label === "Contracts" ? "CONTRACT" : item.label === "Invoices" ? "INVOICE" : "All")}
                className="rounded-2xl border border-[#eee7dd] bg-[#fffdf9] p-4 text-left transition hover:-translate-y-0.5 hover:border-[#c8a97e] hover:shadow-md"
              >
                <span className={`flex size-10 items-center justify-center rounded-full ${item.ready ? "bg-[#eef7eb] text-[#61735f]" : "bg-[#fff8ea] text-[#8a6635]"}`}>
                  {item.ready ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                </span>
                <span className="mt-3 block text-xs font-semibold uppercase tracking-[0.14em] text-[#8f7450]">{item.label}</span>
                <span className="mt-1 block text-3xl font-semibold text-[#191714]">{item.value}</span>
                <span className="mt-1 block text-xs text-[#6f6a61]">{item.detail}</span>
              </button>
            ))}
          </div>
        </div>

        <aside className="rounded-2xl border border-[#eadcc6] bg-[#fbf5ec] p-5 luxury-shadow">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9a7a50]">Today&apos;s document work</p>
          <h3 className="mt-2 font-display text-2xl font-semibold text-[#191714]">
            {data.files.length ? "Review and organize latest files" : "Upload your first planning files"}
          </h3>
          <p className="mt-2 text-sm leading-6 text-[#6f6a61]">
            {data.files.length
              ? "Use filters to find files before vendor calls, budget review, RSVP planning, or event run sheet checks."
              : "Start with contracts, invoices, floor plans, menus, and ceremony checklists so the run sheet has a reliable file source."}
          </p>
          <div className="mt-4 space-y-2">
            {data.files.slice(0, 3).map((file) => (
              <div key={file.id} className="rounded-2xl border border-[#e4d7c5] bg-white/80 p-3">
                <p className="truncate text-sm font-semibold text-[#191714]">{file.fileName}</p>
                <p className="mt-1 text-xs text-[#6f6a61]">{file.purpose.replaceAll("_", " ")} - {formatDate(file.createdAt)}</p>
              </div>
            ))}
            {!data.files.length ? (
              <div className="rounded-2xl border border-[#e4d7c5] bg-white/80 p-3 text-sm text-[#6f6a61]">No files uploaded yet.</div>
            ) : null}
          </div>
        </aside>
      </section>

      <section className="rounded-2xl border border-[#e7dfd3] bg-white p-5 luxury-shadow">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9a7a50]">Document center</p>
            <h2 className="mt-2 font-display text-3xl font-semibold">Contracts, invoices, menus, floor plans, and ceremony files</h2>
            <p className="mt-2 text-sm leading-6 text-[#6f6a61]">Upload files to the wedding library now. Event and vendor linking can be refined from each related workspace.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="flex h-11 items-center gap-2 rounded-full border border-[#e7dfd3] bg-white px-4">
              <Search size={16} className="text-[#9a7a50]" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search files"
                className="min-w-0 bg-transparent text-sm outline-none"
              />
            </label>
            <select value={eventFilter} onChange={(event) => setEventFilter(event.target.value)} className="h-11 rounded-full border border-[#e7dfd3] bg-white px-4 text-sm font-semibold">
              <option value="All">All events</option>
              {data.events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name}
                </option>
              ))}
            </select>
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="h-11 rounded-full border border-[#e7dfd3] bg-white px-4 text-sm font-semibold">
              <option value="All">All document types</option>
              {purposeOptions.map((purpose) => (
                <option key={purpose} value={purpose}>
                  {purpose.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-5">
          <FileAssetManager
            ownerType="WEDDING"
            ownerId={data.wedding.id}
            purpose="MISC"
            label="Upload wedding document"
            description="Add contracts, invoices, menus, floor plans, inspiration files, seating charts, or ceremony checklists."
            files={visibleFiles}
          />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.events.map((event) => (
          <button
            key={event.id}
            type="button"
            onClick={() => setEventFilter(event.id)}
            className={`rounded-2xl border bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-[#c8a97e] ${eventFilter === event.id ? "border-[#191714]" : "border-[#e7dfd3]"}`}
          >
            <div className="flex items-start gap-3">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-[#fbf5ec] text-[#9a7a50]">
                <FolderOpen size={18} />
              </div>
              <div>
                <p className="font-semibold text-[#191714]">{event.name}</p>
                <p className="mt-1 text-sm text-[#6f6a61]">{formatDate(event.date)}</p>
                <p className="mt-2 text-sm text-[#6f6a61]">
                  {data.files.filter((file) => file.ownerType === "EVENT" && file.ownerId === event.id).length} linked files
                </p>
              </div>
            </div>
          </button>
        ))}
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-[#e7dfd3] bg-white p-5 luxury-shadow">
      <FileText className="text-[#9a7a50]" size={20} />
      <p className="mt-3 text-sm font-semibold text-[#6f6a61]">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-[#191714]">{value}</p>
    </div>
  );
}
