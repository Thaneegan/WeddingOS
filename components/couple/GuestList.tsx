"use client";

import { useMemo, useState } from "react";
import { Mail, Plus, Send } from "lucide-react";
import { MetricCard } from "@/components/shared/MetricCard";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useWeddingStore } from "@/store/useWeddingStore";
import type { RSVPStatus } from "@/types";

const filters: ("All" | RSVPStatus)[] = ["All", "Attending", "Declined", "Pending"];

export function GuestList() {
  const guests = useWeddingStore((state) => state.guests);
  const updateRSVPGuest = useWeddingStore((state) => state.updateRSVPGuest);
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");

  const filteredGuests = useMemo(
    () => (filter === "All" ? guests : guests.filter((guest) => guest.status === filter)),
    [filter, guests],
  );

  const attending = guests.filter((guest) => guest.status === "Attending").length;
  const declined = guests.filter((guest) => guest.status === "Declined").length;
  const pending = guests.filter((guest) => guest.status === "Pending").length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Invited" value={`${guests.length}`} detail="Guest records" icon={Mail} tone="ink" />
        <MetricCard label="Attending" value={`${attending}`} detail="Confirmed yes" icon={Mail} tone="green" />
        <MetricCard label="Declined" value={`${declined}`} detail="Unable to attend" icon={Mail} tone="rose" />
        <MetricCard label="Pending" value={`${pending}`} detail="Reminder needed" icon={Mail} tone="gold" />
      </div>

      <section className="rounded-2xl border border-[#e7dfd3] bg-white p-5 luxury-shadow">
        <SectionHeader
          title="Guest management"
          description="Mock RSVP tools for filtering, updating statuses, meal tracking, tables, and reminders."
          action={
            <div className="flex flex-wrap gap-2">
              <button className="flex h-10 items-center gap-2 rounded-full border border-[#e7dfd3] px-4 text-sm font-semibold text-[#6f6a61]">
                <Plus size={16} />
                Add guest
              </button>
              <button className="flex h-10 items-center gap-2 rounded-full bg-[#191714] px-4 text-sm font-semibold text-white">
                <Send size={16} />
                Send reminder
              </button>
            </div>
          }
        />
        <div className="mb-4 flex flex-wrap gap-2">
          {filters.map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${filter === item ? "bg-[#191714] text-white" : "border border-[#e7dfd3] bg-white text-[#6f6a61]"}`}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="grid gap-3">
          {filteredGuests.slice(0, 18).map((guest) => (
            <article key={guest.id} className="grid gap-3 rounded-2xl border border-[#eee7dd] bg-[#fffdf9] p-4 lg:grid-cols-[1.2fr_1fr_150px_130px_130px] lg:items-center">
              <div>
                <p className="font-semibold">{guest.name}</p>
                <p className="mt-1 text-sm text-[#6f6a61]">{guest.email}</p>
              </div>
              <p className="text-sm text-[#6f6a61]">{guest.group}</p>
              <select
                value={guest.status}
                onChange={(event) => updateRSVPGuest(guest.id, { status: event.target.value as RSVPStatus })}
                className="h-10 rounded-full border border-[#e7dfd3] bg-white px-3 text-sm font-semibold"
              >
                <option>Attending</option>
                <option>Declined</option>
                <option>Pending</option>
              </select>
              <StatusBadge tone={guest.status === "Attending" ? "green" : guest.status === "Declined" ? "rose" : "gold"}>{guest.status}</StatusBadge>
              <p className="text-sm text-[#6f6a61]">Table {guest.tableNumber ?? "TBD"}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
