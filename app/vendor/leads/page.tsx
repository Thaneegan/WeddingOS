"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { PageWrapper } from "@/components/animations/PageWrapper";
import { LeadPipeline } from "@/components/vendor/LeadPipeline";

export default function VendorLeadsPage() {
  return (
    <AppLayout mode="vendor">
      <PageWrapper>
        <LeadPipeline />
      </PageWrapper>
    </AppLayout>
  );
}
