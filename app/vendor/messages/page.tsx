"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { PageWrapper } from "@/components/animations/PageWrapper";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { MessageHub } from "@/components/shared/MessageHub";

export default function VendorMessagesPage() {
  return (
    <AppLayout mode="vendor">
      <PageWrapper>
        <SectionHeader eyebrow="Vendor portal" title="Messages" description="Vendor-side communication reads and writes to the same shared store as the couple inbox." />
        <MessageHub mode="vendor" />
      </PageWrapper>
    </AppLayout>
  );
}
