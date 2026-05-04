"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { PageWrapper } from "@/components/animations/PageWrapper";
import { GuestList } from "@/components/couple/GuestList";
import { SectionHeader } from "@/components/shared/SectionHeader";

export default function RSVPPage() {
  return (
    <AppLayout>
      <PageWrapper>
        <SectionHeader eyebrow="Couple workspace" title="RSVP management" description="Manage guests, statuses, meals, plus ones, tables, and reminders." />
        <GuestList />
      </PageWrapper>
    </AppLayout>
  );
}
