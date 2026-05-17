import { AppLayout } from "@/components/layout/AppLayout";
import { PageWrapper } from "@/components/animations/PageWrapper";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { CoupleOpportunitiesClient } from "@/components/vendor/OpportunitiesClient";
import { getCoupleOpportunitiesData } from "@/lib/coreData";

export const dynamic = "force-dynamic";

export default async function OpportunitiesPage() {
  const data = await getCoupleOpportunitiesData();

  return (
    <AppLayout>
      <PageWrapper>
        <SectionHeader
          eyebrow="Couple workspace"
          title="Vendor opportunities"
          description="Publish specific vendor needs so relevant businesses can pitch into your planning workspace."
        />
        <CoupleOpportunitiesClient data={data} />
      </PageWrapper>
    </AppLayout>
  );
}
