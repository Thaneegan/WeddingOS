import { AppLayout } from "@/components/layout/AppLayout";
import { PageWrapper } from "@/components/animations/PageWrapper";
import { GuestList } from "@/components/couple/GuestList";
import { SeatingPlanner } from "@/components/couple/SeatingPlanner";
import { getRSVPData, getSeatingData } from "@/lib/coreData";

export const dynamic = "force-dynamic";

export default async function RSVPPage() {
  const [rsvpData, seatingData] = await Promise.all([getRSVPData(), getSeatingData()]);

  return (
    <AppLayout>
      <PageWrapper>
        <GuestList data={rsvpData} />
        <section id="seating" className="mt-8 scroll-mt-24">
          <div className="mb-4 rounded-2xl border border-[#e7dfd3] bg-[#fbf5ec] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9a7a50]">Guest management subfeature</p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-[#191714]">Seating</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6f6a61]">
              Seat confirmed attendees after guest records and event RSVPs are ready. Seating stays here so guest list, RSVP status,
              attendee counts, and table assignments are managed from one place.
            </p>
          </div>
          <SeatingPlanner data={seatingData} />
        </section>
      </PageWrapper>
    </AppLayout>
  );
}
