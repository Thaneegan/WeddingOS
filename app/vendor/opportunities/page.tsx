import { AppLayout } from "@/components/layout/AppLayout";
import { PageWrapper } from "@/components/animations/PageWrapper";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { VendorOpportunitiesClient } from "@/components/vendor/OpportunitiesClient";
import { getVendorOpportunitiesData } from "@/lib/coreData";

export const dynamic = "force-dynamic";

export default async function VendorOpportunitiesPage() {
  const data = await getVendorOpportunitiesData();

  return (
    <AppLayout mode="vendor">
      <PageWrapper>
        <SectionHeader
          eyebrow="Vendor workspace"
          title="Couple opportunities"
          description="Browse opt-in couples looking for vendor help and send a pitch that starts a shared conversation."
        />
        <VendorOpportunitiesClient data={data} />
      </PageWrapper>
    </AppLayout>
  );
}
