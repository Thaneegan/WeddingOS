"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AlertTriangle, CalendarClock, CheckCircle2, Clock3, Download, FileText, ListChecks, MapPin, Phone, Printer, Table2, UsersRound, WalletCards, type LucideIcon } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { CoreRunSheetData } from "@/types/core";

export function RunSheetView({ data }: { data: CoreRunSheetData }) {
  const [selectedEventId, setSelectedEventId] = useState("All");
  const today = useMemo(() => {
    const value = new Date();
    value.setHours(0, 0, 0, 0);
    return value;
  }, []);

  const sortedEvents = useMemo(
    () => [...data.events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.sortOrder - b.sortOrder),
    [data.events],
  );
  const visibleEvents = selectedEventId === "All" ? sortedEvents : sortedEvents.filter((event) => event.id === selectedEventId);
  const nextEvent = sortedEvents.find((event) => new Date(event.date) >= today) ?? sortedEvents[0];
  const selectedEvent = selectedEventId === "All" ? nextEvent : sortedEvents.find((event) => event.id === selectedEventId);
  const visibleEventIds = new Set(visibleEvents.map((event) => event.id));
  const visibleBlocks = data.timelineBlocks.filter((block) => visibleEventIds.has(block.eventId));
  const visibleResponsibilities = data.responsibilities.filter((item) => item.eventId && visibleEventIds.has(item.eventId));
  const visibleFiles = selectedEventId === "All" ? data.files : data.files.filter((file) => file.ownerType === "EVENT" && file.ownerId === selectedEventId);
  const eventIdsWithBlocks = new Set(data.timelineBlocks.map((block) => block.eventId));
  const eventsMissingSchedule = sortedEvents.filter((event) => !eventIdsWithBlocks.has(event.id));
  const scheduleBlocksWithoutOwner = data.timelineBlocks.filter((block) => !block.ownerName);
  const visibleBlocksWithoutOwner = visibleBlocks.filter((block) => !block.ownerName);
  const openResponsibilities = data.responsibilities.filter((item) => item.status !== "Done");
  const visibleOpenResponsibilities = visibleResponsibilities.filter((item) => item.status !== "Done");
  const duePayments = data.paymentSchedule.filter((payment) => {
    const dueDate = new Date(payment.dueDate);
    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / 86_400_000);
    return payment.status !== "Paid" && daysUntilDue <= 14;
  });
  const selectedPacketReady = visibleEvents.length > 0 && visibleBlocks.length > 0 && visibleBlocksWithoutOwner.length === 0 && visibleOpenResponsibilities.length === 0;
  const eventPacketItems = [
    {
      label: "Schedule blocks",
      value: visibleBlocks.length,
      ready: visibleBlocks.length > 0,
      detail: visibleBlocks.length ? "Timing is documented" : "Add timing in Timeline",
      icon: Clock3,
      href: "/timeline",
    },
    {
      label: "Block owners",
      value: Math.max(0, visibleBlocks.length - visibleBlocksWithoutOwner.length),
      ready: visibleBlocks.length > 0 && visibleBlocksWithoutOwner.length === 0,
      detail: visibleBlocksWithoutOwner.length ? `${visibleBlocksWithoutOwner.length} owner gaps` : "Every block has an owner",
      icon: UsersRound,
      href: "/timeline",
    },
    {
      label: "Family contacts",
      value: visibleResponsibilities.length,
      ready: visibleResponsibilities.length > 0 && visibleOpenResponsibilities.length === 0,
      detail: visibleOpenResponsibilities.length ? `${visibleOpenResponsibilities.length} open items` : "Contacts ready",
      icon: Phone,
      href: "/timeline",
    },
    {
      label: "Event files",
      value: visibleFiles.length,
      ready: visibleFiles.length > 0,
      detail: visibleFiles.length ? "Files attached" : "Attach files in Documents",
      icon: FileText,
      href: "/documents",
    },
  ];
  const readinessItems = [
    {
      label: "Schedules built",
      value: `${sortedEvents.length - eventsMissingSchedule.length}/${sortedEvents.length}`,
      ready: eventsMissingSchedule.length === 0,
      detail: eventsMissingSchedule.length ? `${eventsMissingSchedule.length} event${eventsMissingSchedule.length === 1 ? "" : "s"} missing blocks` : "Every event has a schedule",
      href: "/timeline",
    },
    {
      label: "Owners assigned",
      value: `${Math.max(0, data.timelineBlocks.length - scheduleBlocksWithoutOwner.length)}/${data.timelineBlocks.length}`,
      ready: scheduleBlocksWithoutOwner.length === 0,
      detail: scheduleBlocksWithoutOwner.length ? `${scheduleBlocksWithoutOwner.length} schedule block${scheduleBlocksWithoutOwner.length === 1 ? "" : "s"} need owners` : "All schedule blocks have owners",
      href: "/timeline",
    },
    {
      label: "Family tasks",
      value: `${openResponsibilities.length}`,
      ready: openResponsibilities.length === 0,
      detail: openResponsibilities.length ? "Open responsibilities remain" : "Responsibilities are closed",
      href: "/timeline",
    },
    {
      label: "Payments due",
      value: `${duePayments.length}`,
      ready: duePayments.length === 0,
      detail: duePayments.length ? "Due within 14 days or overdue" : "No urgent payment reminders",
      href: "/budget",
    },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-[#e7dfd3] bg-[#191714] p-6 text-white luxury-shadow md:p-8 print:border-0 print:bg-white print:text-black print:shadow-none">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#d6b783]">Event run sheets</p>
            <h1 className="mt-3 font-display text-5xl font-semibold">{data.wedding.couple}</h1>
            <p className="mt-2 text-white/70 print:text-black">
              {nextEvent ? `Next: ${nextEvent.name} - ${formatDate(nextEvent.date)}` : `${data.wedding.location} - ${formatDate(data.wedding.date)}`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 print:hidden">
            <Link href="/timeline" className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/20 px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/10">
              <ListChecks size={16} />
              Edit schedule
            </Link>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-[#191714] transition hover:-translate-y-0.5"
            >
              <Printer size={16} />
              Print / save PDF
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 print:hidden xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-[#e7dfd3] bg-white p-5 luxury-shadow">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9a7a50]">Operations readiness</p>
              <h2 className="mt-1 font-display text-3xl font-semibold text-[#191714]">Make every event executable</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6f6a61]">
                Run sheets are the day-of source of truth for timelines, owners, vendor arrivals, payments, and critical documents.
              </p>
            </div>
            <Link href="/documents" className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[#e7dfd3] bg-white px-4 text-sm font-semibold text-[#6f6a61] transition hover:-translate-y-0.5 hover:border-[#c8a97e]">
              <FileText size={16} />
              Documents
            </Link>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {readinessItems.map((item) => (
              <Link key={item.label} href={item.href} className="rounded-2xl border border-[#eee7dd] bg-[#fffdf9] p-4 transition hover:-translate-y-0.5 hover:border-[#c8a97e] hover:shadow-md">
                <span className={`flex size-9 items-center justify-center rounded-full ${item.ready ? "bg-[#eef7eb] text-[#61735f]" : "bg-[#fff4f3] text-[#93484d]"}`}>
                  {item.ready ? <CheckCircle2 size={17} /> : <AlertTriangle size={17} />}
                </span>
                <span className="mt-3 block text-xs font-semibold uppercase tracking-[0.14em] text-[#8f7450]">{item.label}</span>
                <span className="mt-1 block text-3xl font-semibold text-[#191714]">{item.value}</span>
                <span className="mt-1 block text-xs text-[#6f6a61]">{item.detail}</span>
              </Link>
            ))}
          </div>
        </div>

        <aside className="rounded-2xl border border-[#eadcc6] bg-[#fbf5ec] p-5 luxury-shadow">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9a7a50]">Event focus</p>
          <h2 className="mt-1 font-display text-3xl font-semibold text-[#191714]">{selectedEvent?.name ?? "No event selected"}</h2>
          <p className="mt-2 text-sm leading-6 text-[#6f6a61]">
            {selectedEvent
              ? `${formatDate(selectedEvent.date)}${selectedEvent.startTime ? ` at ${selectedEvent.startTime}` : ""}${selectedEvent.venueName ? ` - ${selectedEvent.venueName}` : ""}`
              : "Add event dates in onboarding to start building event-specific run sheets."}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link href="/rsvp#seating" className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[#d9cbb8] bg-white text-sm font-semibold text-[#6f6a61] transition hover:-translate-y-0.5 hover:border-[#c8a97e]">
              <Table2 size={15} />
              Seating
            </Link>
            <Link href="/budget" className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[#d9cbb8] bg-white text-sm font-semibold text-[#6f6a61] transition hover:-translate-y-0.5 hover:border-[#c8a97e]">
              <WalletCards size={15} />
              Payments
            </Link>
          </div>
        </aside>
      </section>

      <section className="rounded-2xl border border-[#e7dfd3] bg-white p-4 print:hidden">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedEventId("All")}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition hover:-translate-y-0.5 ${selectedEventId === "All" ? "border-[#191714] bg-[#191714] text-white" : "border-[#e7dfd3] bg-white text-[#6f6a61] hover:border-[#c8a97e]"}`}
          >
            All events
          </button>
          {sortedEvents.map((event) => (
            <button
              key={event.id}
              type="button"
              onClick={() => setSelectedEventId(event.id)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition hover:-translate-y-0.5 ${selectedEventId === event.id ? "border-[#191714] bg-[#191714] text-white" : "border-[#e7dfd3] bg-white text-[#6f6a61] hover:border-[#c8a97e]"}`}
            >
              {event.name}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-[#e7dfd3] bg-white p-5 luxury-shadow print:hidden">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9a7a50]">Event packet</p>
            <h2 className="mt-1 font-display text-3xl font-semibold text-[#191714]">
              {selectedPacketReady ? "Ready to print and use" : "Needs setup before event day"}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6f6a61]">
              {selectedEventId === "All"
                ? "This checks every visible event. Choose one event above when you want a focused packet for a vendor call or event day."
                : "This checks the selected event only, so you can prepare one clean packet for that event."}
            </p>
          </div>
          <span className={`inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold ${selectedPacketReady ? "bg-[#eef7eb] text-[#61735f]" : "bg-[#fff8ea] text-[#8a6635]"}`}>
            {selectedPacketReady ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            {selectedPacketReady ? "Packet ready" : "Setup needed"}
          </span>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {eventPacketItems.map((item) => (
            <Link key={item.label} href={item.href} className="rounded-2xl border border-[#eee7dd] bg-[#fffdf9] p-4 transition hover:-translate-y-0.5 hover:border-[#c8a97e] hover:shadow-md">
              <span className={`flex size-10 items-center justify-center rounded-full ${item.ready ? "bg-[#eef7eb] text-[#61735f]" : "bg-[#fff4f3] text-[#93484d]"}`}>
                <item.icon size={18} />
              </span>
              <span className="mt-3 block text-xs font-semibold uppercase tracking-[0.14em] text-[#8f7450]">{item.label}</span>
              <span className="mt-1 block text-3xl font-semibold text-[#191714]">{item.value}</span>
              <span className="mt-1 block text-xs text-[#6f6a61]">{item.detail}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-4">
          {visibleEvents.map((event) => {
            const blocks = data.timelineBlocks.filter((block) => block.eventId === event.id);
            const responsibilities = data.responsibilities.filter((item) => item.eventId === event.id);
            return (
              <article key={event.id} className="rounded-2xl border border-[#e7dfd3] bg-white p-5 luxury-shadow print:break-inside-avoid">
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="font-display text-3xl font-semibold text-[#191714]">{event.name}</h2>
                    <p className="mt-1 text-sm text-[#6f6a61]">{formatDate(event.date)}{event.startTime ? ` - ${event.startTime}` : ""}{event.venueName ? ` - ${event.venueName}` : ""}</p>
                    {event.location ? (
                      <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-[#8f7450]">
                        <MapPin size={13} />
                        {event.location}
                      </p>
                    ) : null}
                  </div>
                  <CalendarClock className="text-[#9a7a50]" size={22} />
                </div>
                <div className="mt-5 space-y-3">
                  {blocks.length ? (
                    blocks.map((block) => (
                      <div key={block.id} className="grid gap-3 rounded-2xl border border-[#eee7dd] bg-[#fffdf9] p-4 md:grid-cols-[120px_1fr_180px]">
                        <p className="text-sm font-semibold text-[#9a7a50]">{new Date(block.startsAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</p>
                        <div>
                          <p className="font-semibold text-[#191714]">{block.title}</p>
                          {block.notes ? <p className="mt-1 text-sm text-[#6f6a61]">{block.notes}</p> : null}
                        </div>
                        <p className={`text-sm ${block.ownerName ? "text-[#6f6a61]" : "font-semibold text-[#93484d]"}`}>{block.ownerName ?? block.location ?? "Owner TBD"}</p>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-[#e7dfd3] p-4">
                      <p className="text-sm font-semibold text-[#191714]">No schedule blocks yet.</p>
                      <p className="mt-1 text-sm text-[#6f6a61]">Add event timing, handoffs, vendor arrivals, and family owner notes from Timeline.</p>
                      <Link href="/timeline" className="mt-3 inline-flex rounded-full border border-[#e7dfd3] px-4 py-2 text-xs font-semibold text-[#6f6a61] print:hidden">
                        Add schedule blocks
                      </Link>
                    </div>
                  )}
                </div>
                {responsibilities.length ? (
                  <div className="mt-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9a7a50]">Family contacts</p>
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      {responsibilities.map((item) => (
                        <div key={item.id} className="rounded-xl border border-[#eee7dd] bg-white p-3">
                          <p className="font-semibold text-[#191714]">{item.title}</p>
                          <p className="mt-1 text-sm text-[#6f6a61]">{item.assignedName ?? "Unassigned"}{item.assignedEmail ? ` - ${item.assignedEmail}` : ""}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>

        <aside className="space-y-4">
          <Panel icon={Phone} title="Vendor contacts">
            {data.bookedVendors.length ? (
              data.bookedVendors.map((vendor) => (
                <div key={vendor.id} className="rounded-xl border border-[#eee7dd] bg-[#fffdf9] p-3">
                  <p className="font-semibold text-[#191714]">{vendor.name}</p>
                  <p className="mt-1 text-sm text-[#6f6a61]">{vendor.category} - {vendor.responseTime}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-[#6f6a61]">Booked vendors will appear here.</p>
            )}
          </Panel>
          <Panel icon={WalletCards} title="Payment reminders">
            {(duePayments.length ? duePayments : data.paymentSchedule).slice(0, 6).map((payment) => (
              <div key={payment.id} className="rounded-xl border border-[#eee7dd] bg-[#fffdf9] p-3">
                <p className="font-semibold text-[#191714]">{payment.label}</p>
                <p className="mt-1 text-sm text-[#6f6a61]">{formatCurrency(payment.amount)} due {formatDate(payment.dueDate)}</p>
              </div>
            ))}
            {!data.paymentSchedule.length ? <p className="text-sm text-[#6f6a61]">No payment reminders yet.</p> : null}
          </Panel>
          <Panel icon={FileText} title="Critical documents">
            {(visibleFiles.length ? visibleFiles : data.files).slice(0, 6).map((file) => (
              <div key={file.id} className="flex items-center justify-between gap-3 rounded-xl border border-[#eee7dd] bg-[#fffdf9] p-3">
                <span className="truncate text-sm font-semibold text-[#191714]">{file.fileName}</span>
                <Download size={15} className="shrink-0 text-[#9a7a50]" />
              </div>
            ))}
            {!data.files.length ? <p className="text-sm text-[#6f6a61]">Upload contracts, floor plans, and checklists in Documents.</p> : null}
          </Panel>
        </aside>
      </section>
    </div>
  );
}

function Panel({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-[#e7dfd3] bg-white p-5 luxury-shadow print:break-inside-avoid">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="text-[#9a7a50]" size={18} />
        <h2 className="font-display text-2xl font-semibold text-[#191714]">{title}</h2>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
