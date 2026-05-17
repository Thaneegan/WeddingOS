"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, Armchair, CheckCircle2, ClipboardList, Plus, Table2, Trash2, UsersRound } from "lucide-react";
import { assignGuestToTable, createSeatingTable, removeGuestFromTable } from "@/app/actions";
import { formatDate } from "@/lib/utils";
import type { CoreSeatingData } from "@/types/core";

export function SeatingPlanner({ data }: { data: CoreSeatingData }) {
  const router = useRouter();
  const [eventId, setEventId] = useState(data.events[0]?.id ?? "");
  const [tableName, setTableName] = useState("");
  const [capacity, setCapacity] = useState("10");
  const [selectedGuest, setSelectedGuest] = useState("");
  const [selectedTable, setSelectedTable] = useState("");
  const selectedEvent = data.events.find((event) => event.id === eventId);
  const eventTables = data.tables.filter((table) => (eventId ? table.eventId === eventId : !table.eventId));
  const eventGuestStatus = (guest: CoreSeatingData["guests"][number]) => {
    if (!eventId) return guest.status;
    return guest.eventRsvps?.find((item) => item.eventId === eventId)?.status ?? guest.status;
  };
  const eventInvitedGuests = data.guests.filter((guest) => !eventId || !guest.eventRsvps?.length || guest.eventRsvps.some((item) => item.eventId === eventId && item.invited));
  const attendingGuests = eventInvitedGuests.filter((guest) => eventGuestStatus(guest) === "Attending");
  const assignableGuests = useMemo(
    () =>
      attendingGuests.flatMap((guest) => [
        { id: `guest:${guest.id}`, label: guest.name },
        ...(guest.companions ?? []).map((companion) => ({ id: `companion:${companion.id}`, label: `${companion.name} (${guest.name})` })),
      ]),
    [attendingGuests],
  );
  const assignedIds = new Set(
    eventTables.flatMap((table) =>
      table.assignments.map((assignment) => assignment.guestId ? `guest:${assignment.guestId}` : assignment.companionId ? `companion:${assignment.companionId}` : ""),
    ),
  );
  const unassigned = assignableGuests.filter((guest) => !assignedIds.has(guest.id));
  const assignedCount = assignableGuests.length - unassigned.length;
  const totalCapacity = eventTables.reduce((sum, table) => sum + table.capacity, 0);
  const openSeats = Math.max(0, totalCapacity - assignedCount);
  const overCapacityTables = eventTables.filter((table) => table.assignments.length > table.capacity);
  const readiness =
    !eventTables.length ? "Create tables for this event first"
      : overCapacityTables.length ? "Fix over-capacity tables"
        : unassigned.length ? "Assign remaining attendees"
          : "Seating is ready for this event";

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#e7dfd3] bg-white p-5 luxury-shadow">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9a7a50]">Seating workspace</p>
            <h2 className="mt-2 font-display text-3xl font-semibold">Assign attendees to event tables</h2>
            <p className="mt-2 text-sm leading-6 text-[#6f6a61]">
              Choose an event, create tables, assign confirmed attendees, and catch capacity issues before the run sheet is finalized.
            </p>
          </div>
          <label className="space-y-1">
            <span className="pl-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#8f7450]">Event</span>
            <select value={eventId} onChange={(event) => setEventId(event.target.value)} className="h-11 min-w-72 cursor-pointer rounded-full border border-[#e7dfd3] bg-white px-4 text-sm font-semibold">
              {data.events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name} - {formatDate(event.date)}
                </option>
              ))}
              <option value="">Unassigned event</option>
            </select>
          </label>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-[#eee7dd] bg-[#fffdf9] p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-sm font-semibold text-[#191714]">{readiness}</p>
                <p className="mt-1 text-sm text-[#6f6a61]">
                  {selectedEvent ? `${selectedEvent.name} seating for ${formatDate(selectedEvent.date)}` : "General seating not tied to a specific event."}
                </p>
              </div>
              <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${unassigned.length || overCapacityTables.length ? "bg-[#fff8ea] text-[#8a6635]" : "bg-[#eef7eb] text-[#61735f]"}`}>
                {unassigned.length || overCapacityTables.length ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
                {assignedCount}/{assignableGuests.length} seated
              </span>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#ece3d6]">
              <div className="h-full rounded-full bg-[#191714]" style={{ width: `${assignableGuests.length ? Math.min(100, Math.round((assignedCount / assignableGuests.length) * 100)) : 0}%` }} />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-4">
              {[
                { label: "Tables", value: eventTables.length, icon: Table2 },
                { label: "Capacity", value: totalCapacity, icon: Armchair },
                { label: "Open seats", value: openSeats, icon: CheckCircle2 },
                { label: "Unassigned", value: unassigned.length, icon: UsersRound },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-[#eee7dd] bg-white p-3">
                  <item.icon size={17} className="text-[#9a7a50]" />
                  <p className="mt-2 text-2xl font-semibold text-[#191714]">{item.value}</p>
                  <p className="text-xs text-[#6f6a61]">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <aside className="rounded-2xl border border-[#eadcc6] bg-[#fbf5ec] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9a7a50]">Next action</p>
            <h3 className="mt-2 font-display text-2xl font-semibold text-[#191714]">
              {!eventTables.length ? "Create your first table" : unassigned.length ? "Seat the remaining attendees" : overCapacityTables.length ? "Move guests from full tables" : "Review the run sheet"}
            </h3>
            <p className="mt-2 text-sm leading-6 text-[#6f6a61]">
              {!eventTables.length
                ? "Start with family tables, wedding party, VIPs, then fill general tables."
                : unassigned.length
                  ? "Use the assignment form below. Only confirmed attendees for the selected event are shown."
                  : overCapacityTables.length
                    ? "Over-capacity tables can create day-of confusion. Reassign guests before printing."
                    : "Seating is ready to be checked from the event run sheet."}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Link href="/rsvp" className="inline-flex h-10 items-center justify-center rounded-full border border-[#d9cbb8] bg-white text-sm font-semibold text-[#6f6a61] transition hover:-translate-y-0.5 hover:border-[#c8a97e]">
                Guest list
              </Link>
              <Link href="/run-sheet" className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[#d9cbb8] bg-white text-sm font-semibold text-[#6f6a61] transition hover:-translate-y-0.5 hover:border-[#c8a97e]">
                <ClipboardList size={15} />
                Run sheet
              </Link>
            </div>
          </aside>
        </div>

        <form
          onSubmit={async (event) => {
            event.preventDefault();
            const parsedCapacity = Number(capacity);
            if (!tableName.trim() || !Number.isFinite(parsedCapacity)) return;
            await createSeatingTable({ eventId: eventId || undefined, name: tableName, capacity: parsedCapacity });
            setTableName("");
            setCapacity("10");
            router.refresh();
          }}
          className="mt-5 grid gap-3 rounded-2xl border border-[#eee7dd] bg-[#fffdf9] p-4 md:grid-cols-[1fr_140px_auto]"
        >
          <input value={tableName} onChange={(event) => setTableName(event.target.value)} placeholder="Table name, e.g. Table 1 or Family Head Table" className="h-11 rounded-full border border-[#e7dfd3] bg-white px-4 text-sm" />
          <input value={capacity} onChange={(event) => setCapacity(event.target.value)} inputMode="numeric" placeholder="Capacity" className="h-11 rounded-full border border-[#e7dfd3] bg-white px-4 text-sm" />
          <button className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#191714] px-5 text-sm font-semibold text-white">
            <Plus size={16} />
            Add table
          </button>
        </form>

        <form
          onSubmit={async (event) => {
            event.preventDefault();
            if (!selectedTable || !selectedGuest) return;
            const [kind, id] = selectedGuest.split(":");
            await assignGuestToTable({
              tableId: selectedTable,
              guestId: kind === "guest" ? id : undefined,
              companionId: kind === "companion" ? id : undefined,
            });
            setSelectedGuest("");
            router.refresh();
          }}
          className="mt-4 grid gap-3 rounded-2xl border border-[#eee7dd] bg-white p-4 md:grid-cols-[1fr_1fr_auto]"
        >
          <select value={selectedTable} onChange={(event) => setSelectedTable(event.target.value)} className="h-11 rounded-full border border-[#e7dfd3] bg-white px-4 text-sm font-semibold">
            <option value="">Select table</option>
            {eventTables.map((table) => (
              <option key={table.id} value={table.id}>
                {table.name}
              </option>
            ))}
          </select>
          <select value={selectedGuest} onChange={(event) => setSelectedGuest(event.target.value)} className="h-11 rounded-full border border-[#e7dfd3] bg-white px-4 text-sm font-semibold">
            <option value="">Select guest</option>
            {unassigned.map((guest) => (
              <option key={guest.id} value={guest.id}>
                {guest.label}
              </option>
            ))}
          </select>
          <button className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#e7dfd3] px-5 text-sm font-semibold text-[#6f6a61] transition hover:-translate-y-0.5 hover:border-[#c8a97e]">
            Assign
          </button>
        </form>
      </section>

      {unassigned.length ? (
        <section className="rounded-2xl border border-[#eadcc6] bg-[#fbf5ec] p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="font-semibold text-[#191714]">{unassigned.length} attendee{unassigned.length === 1 ? "" : "s"} still need a table for this event.</p>
              <p className="mt-1 text-sm text-[#6f6a61]">Assign them before finalizing run sheets, place cards, and day-of seating displays.</p>
            </div>
            <div className="flex max-w-3xl flex-wrap gap-2">
              {unassigned.slice(0, 10).map((guest) => (
                <span key={guest.id} className="rounded-full border border-[#e0d2bd] bg-white px-3 py-1 text-xs font-semibold text-[#6f6a61]">
                  {guest.label}
                </span>
              ))}
              {unassigned.length > 10 ? <span className="rounded-full bg-[#191714] px-3 py-1 text-xs font-semibold text-white">+{unassigned.length - 10} more</span> : null}
            </div>
          </div>
        </section>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-3">
        {eventTables.map((table) => {
          const overCapacity = table.assignments.length > table.capacity;
          return (
            <article key={table.id} className={`rounded-2xl border bg-white p-4 luxury-shadow transition hover:-translate-y-0.5 ${overCapacity ? "border-[#e4aaaa]" : "border-[#e7dfd3] hover:border-[#c8a97e]"}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="flex items-center gap-2 font-semibold text-[#191714]">
                    <Armchair size={17} className="text-[#9a7a50]" />
                    {table.name}
                  </p>
                  <p className="mt-1 text-sm text-[#6f6a61]">{table.assignments.length} / {table.capacity} seats assigned</p>
                  <div className="mt-2 h-2 w-44 overflow-hidden rounded-full bg-[#ece3d6]">
                    <div
                      className={`h-full rounded-full ${overCapacity ? "bg-[#93484d]" : "bg-[#191714]"}`}
                      style={{ width: `${table.capacity ? Math.min(100, Math.round((table.assignments.length / table.capacity) * 100)) : 0}%` }}
                    />
                  </div>
                </div>
                {overCapacity ? <AlertTriangle className="text-[#93484d]" size={20} /> : null}
              </div>
              <div className="mt-4 space-y-2">
                {table.assignments.length ? (
                  table.assignments.map((assignment) => (
                    <div key={assignment.id} className="flex items-center justify-between gap-3 rounded-xl border border-[#eee7dd] bg-[#fffdf9] p-3">
                      <span className="text-sm font-semibold text-[#191714]">{assignment.guestName ?? assignment.companionName}</span>
                      <button
                        type="button"
                        onClick={async () => {
                          await removeGuestFromTable({ assignmentId: assignment.id });
                          router.refresh();
                        }}
                        className="flex size-9 items-center justify-center rounded-full border border-[#e7dfd3] text-[#93484d]"
                        aria-label="Remove seating assignment"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="rounded-xl border border-dashed border-[#e7dfd3] p-3 text-sm text-[#6f6a61]">No guests assigned yet.</p>
                )}
              </div>
            </article>
          );
        })}
      </section>

      {!eventTables.length ? (
        <section className="rounded-2xl border border-dashed border-[#e7dfd3] bg-white p-5 text-center">
          <Armchair className="mx-auto text-[#9a7a50]" size={24} />
          <p className="mt-3 font-semibold text-[#191714]">No tables created for this event yet.</p>
          <p className="mt-1 text-sm text-[#6f6a61]">Use the table form above to create tables before assigning attendees.</p>
        </section>
      ) : null}
    </div>
  );
}
