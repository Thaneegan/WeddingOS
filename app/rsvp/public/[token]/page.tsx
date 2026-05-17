import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ensureDefaultWeddingEvents } from "@/lib/weddingEvents";
import { PublicRsvpForm } from "./PublicRsvpForm";

export const dynamic = "force-dynamic";

export default async function PublicRsvpPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const row = await prisma.publicRSVPToken.findUnique({
    where: { token },
    include: {
      guest: {
        include: {
          companions: { orderBy: { sortOrder: "asc" } },
          eventRsvps: true,
          eventInvites: true,
        },
      },
      wedding: true,
    },
  });

  if (!row || !row.guest || (row.expiresAt && row.expiresAt < new Date())) notFound();
  const events = await ensureDefaultWeddingEvents(row.weddingId);
  const invitedEventIds = new Set(row.guest.eventInvites.filter((invite) => invite.invited).map((invite) => invite.eventId));
  const visibleEvents = row.guest.eventInvites.length ? events.filter((event) => invitedEventIds.has(event.id)) : events;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FAF9F7] px-4 py-10">
      <PublicRsvpForm
        token={token}
        guestName={row.guest.name}
        guestStatus={row.guest.status}
        mealChoice={row.guest.mealChoice}
        notes={row.guest.notes ?? ""}
        attendeeCount={Math.max(1, row.guest.additionalGuestCount + 1)}
        companionNames={row.guest.companions.map((companion) => companion.name)}
        events={visibleEvents.map((event) => ({
          id: event.id,
          name: event.name,
          date: event.date.toISOString(),
          venueName: event.venueName ?? event.location ?? "",
        }))}
        eventResponses={row.guest.eventRsvps.map((response) => ({
          eventId: response.eventId,
          status: response.status,
          attendeeCount: response.attendeeCount,
          mealChoice: response.mealChoice,
          notes: response.notes ?? "",
        }))}
      />
    </main>
  );
}
