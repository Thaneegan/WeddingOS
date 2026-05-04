"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { PageWrapper } from "@/components/animations/PageWrapper";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { MessageHub } from "@/components/shared/MessageHub";

export default function MessagesPage() {
  return (
    <AppLayout>
      <PageWrapper>
        <SectionHeader eyebrow="Couple workspace" title="Messages" description="The same shared conversation data appears on both couple and vendor portals." />
        <MessageHub mode="couple" />
      </PageWrapper>
    </AppLayout>
  );
}
