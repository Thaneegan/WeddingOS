import { AppLayout } from "@/components/layout/AppLayout";
import { PageWrapper } from "@/components/animations/PageWrapper";
import { VendorAnalyticsClient } from "@/components/vendor/VendorAnalyticsClient";
import { getVendorAnalyticsData } from "@/lib/coreData";

export const dynamic = "force-dynamic";

export default async function VendorAnalyticsPage() {
  const data = await getVendorAnalyticsData();

  return (
    <AppLayout mode="vendor">
      <PageWrapper>
        <VendorAnalyticsClient data={data} />
      </PageWrapper>
    </AppLayout>
  );
}
