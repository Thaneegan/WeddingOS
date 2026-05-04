"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { PageWrapper } from "@/components/animations/PageWrapper";
import { TimelineList } from "@/components/couple/TimelineList";

export default function TimelinePage() {
  return (
    <AppLayout>
      <PageWrapper>
        <TimelineList />
      </PageWrapper>
    </AppLayout>
  );
}
