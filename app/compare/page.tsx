import { AppLayout } from "@/components/layout/AppLayout";
import { PageWrapper } from "@/components/animations/PageWrapper";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { VendorCompareClient } from "@/components/vendor/VendorCompareClient";
import { getCompareData } from "@/lib/coreData";

export const dynamic = "force-dynamic";

export default async function ComparePage() {
  const data = await getCompareData();

  return (
    <AppLayout>
      <PageWrapper>
        <SectionHeader
          eyebrow="Couple workspace"
          title="Quote review"
          description="Review shortlisted vendors, compare quote terms, capture decision notes, and accept the quote that should become a booking."
        />
        <VendorCompareClient vendors={data.vendors} />
      </PageWrapper>
    </AppLayout>
  );
}
