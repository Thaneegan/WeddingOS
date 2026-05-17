"use client";

import { useState, useTransition } from "react";
import { Check, CalendarDays, UsersRound } from "lucide-react";
import { submitPublicRsvp } from "@/app/actions";
import { formatDate } from "@/lib/utils";

type PublicStatus = "ATTENDING" | "DECLINED" | "PENDING";

type EventOption = {
  id: string;
  name: string;
  date: string;
  venueName?: string;
};

type EventResponse = {
  eventId: string;
  status: PublicStatus;
  attendeeCount: number;
  mealChoice: string;
  notes: string;
};

export function PublicRsvpForm({
  token,
  guestName,
  guestStatus,
  mealChoice,
  notes,
  attendeeCount,
  companionNames,
  events,
  eventResponses,
}: {
  token: string;
  guestName: string;
  guestStatus: PublicStatus;
  mealChoice: string;
  notes: string;
  attendeeCount: number;
  companionNames: string[];
  events: EventOption[];
  eventResponses: EventResponse[];
}) {
  const [status, setStatus] = useState<PublicStatus>(guestStatus);
  const [count, setCount] = useState(String(attendeeCount));
  const [companions, setCompanions] = useState(() => {
    const existing = companionNames.length ? companionNames : Array.from({ length: Math.max(0, attendeeCount - 1) }, () => "");
    return existing;
  });
  const [responses, setResponses] = useState<EventResponse[]>(() =>
    events.map((event) => {
      const existing = eventResponses.find((response) => response.eventId === event.id);
      return {
        eventId: event.id,
        status: existing?.status ?? guestStatus,
        attendeeCount: existing?.attendeeCount ?? attendeeCount,
        mealChoice: existing?.mealChoice ?? mealChoice,
        notes: existing?.notes ?? "",
      };
    }),
  );
  const [submitted, setSubmitted] = useState(false);
  const [pending, startTransition] = useTransition();

  const updateCount = (value: string) => {
    const nextCount = Math.max(1, Number(value) || 1);
    setCount(String(nextCount));
    setCompanions((current) => {
      const next = [...current];
      while (next.length < nextCount - 1) next.push("");
      return next.slice(0, Math.max(0, nextCount - 1));
    });
    setResponses((current) => current.map((response) => ({ ...response, attendeeCount: nextCount })));
  };

  const updateResponse = (eventId: string, fields: Partial<EventResponse>) => {
    setResponses((current) => current.map((response) => (response.eventId === eventId ? { ...response, ...fields } : response)));
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        startTransition(async () => {
          await submitPublicRsvp({
            token,
            status,
            mealChoice: String(form.get("mealChoice") ?? "Pending"),
            plusOne: companions.length > 0,
            attendeeCount: Number(count),
            companionNames: companions.map((item) => item.trim()).filter(Boolean),
            notes: String(form.get("notes") ?? ""),
            eventResponses: responses,
          });
          setSubmitted(true);
        });
      }}
      className="w-full max-w-4xl rounded-3xl border border-[#e7dfd3] bg-white p-5 shadow-2xl shadow-black/5 sm:p-7"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#a47742]">Wedding RSVP</p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-[#191714] sm:text-4xl">{guestName}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6f6a61]">Confirm your household count and attendance for each wedding event.</p>
        </div>
        {submitted ? (
          <div className="flex items-center gap-2 rounded-full bg-[#eef7ea] px-4 py-2 text-sm font-semibold text-[#4d7049]">
            <Check size={16} />
            RSVP saved
          </div>
        ) : null}
      </div>

      <div className="mt-6 grid gap-3 lg:grid-cols-3">
        <label className="grid gap-2 text-sm font-semibold text-[#4b463d]">
          Overall response
          <select value={status} onChange={(event) => setStatus(event.target.value as PublicStatus)} className="h-12 rounded-full border border-[#e7dfd3] bg-[#fbfaf8] px-4 text-sm font-semibold">
            <option value="ATTENDING">Attending</option>
            <option value="DECLINED">Declined</option>
            <option value="PENDING">Pending</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-[#4b463d]">
          Total attendees
          <input value={count} onChange={(event) => updateCount(event.target.value)} type="number" min={1} className="h-12 rounded-full border border-[#e7dfd3] bg-[#fbfaf8] px-4 text-sm outline-none focus:border-[#c8a97e]" />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-[#4b463d]">
          Meal choice
          <input name="mealChoice" defaultValue={mealChoice} placeholder="Meal choice" className="h-12 rounded-full border border-[#e7dfd3] bg-[#fbfaf8] px-4 text-sm outline-none focus:border-[#c8a97e]" />
        </label>
      </div>

      {companions.length ? (
        <div className="mt-5 rounded-2xl border border-[#eee7dd] bg-[#fffdf9] p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#191714]">
            <UsersRound size={16} />
            Additional guests
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {companions.map((name, index) => (
              <input
                key={index}
                value={name}
                onChange={(event) => setCompanions((current) => current.map((item, itemIndex) => (itemIndex === index ? event.target.value : item)))}
                placeholder={`Guest ${index + 1} name`}
                className="h-11 rounded-full border border-[#e7dfd3] bg-white px-4 text-sm outline-none focus:border-[#c8a97e]"
              />
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-6 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#191714]">
          <CalendarDays size={16} />
          Event attendance
        </div>
        {events.map((event) => {
          const response = responses.find((item) => item.eventId === event.id);
          if (!response) return null;
          return (
            <article key={event.id} className="grid gap-3 rounded-2xl border border-[#eee7dd] bg-[#fbfaf8] p-4 lg:grid-cols-[1fr_170px_140px_1fr] lg:items-center">
              <div>
                <p className="font-semibold text-[#191714]">{event.name}</p>
                <p className="mt-1 text-sm text-[#6f6a61]">{formatDate(event.date)}{event.venueName ? ` - ${event.venueName}` : ""}</p>
              </div>
              <select value={response.status} onChange={(selectEvent) => updateResponse(event.id, { status: selectEvent.target.value as PublicStatus })} className="h-11 rounded-full border border-[#e7dfd3] bg-white px-3 text-sm font-semibold">
                <option value="ATTENDING">Attending</option>
                <option value="DECLINED">Declined</option>
                <option value="PENDING">Pending</option>
              </select>
              <input value={response.attendeeCount} onChange={(inputEvent) => updateResponse(event.id, { attendeeCount: Math.max(0, Number(inputEvent.target.value) || 0) })} type="number" min={0} className="h-11 rounded-full border border-[#e7dfd3] bg-white px-3 text-sm outline-none focus:border-[#c8a97e]" aria-label={`${event.name} attendee count`} />
              <input value={response.notes} onChange={(inputEvent) => updateResponse(event.id, { notes: inputEvent.target.value })} placeholder="Event notes" className="h-11 rounded-full border border-[#e7dfd3] bg-white px-4 text-sm outline-none focus:border-[#c8a97e]" />
            </article>
          );
        })}
      </div>

      <textarea name="notes" defaultValue={notes} placeholder="Anything else the couple should know?" className="mt-5 min-h-24 w-full rounded-2xl border border-[#e7dfd3] bg-[#fbfaf8] px-4 py-3 text-sm outline-none focus:border-[#c8a97e]" />
      <button disabled={pending} className="mt-5 h-12 w-full rounded-full bg-[#191714] text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60">
        {pending ? "Saving..." : "Submit RSVP"}
      </button>
    </form>
  );
}
