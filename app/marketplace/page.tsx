import { AppLayout } from "@/components/layout/AppLayout";
import { PageWrapper } from "@/components/animations/PageWrapper";
import { MarketplaceClient } from "@/components/vendor/MarketplaceClient";
import { getMarketplaceData } from "@/lib/coreData";

export const dynamic = "force-dynamic";

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const data = await getMarketplaceData();
  const { q = "" } = await searchParams;

  return (
    <AppLayout>
      <PageWrapper>
        <MarketplaceClient
          key={q}
          vendors={data.vendors}
          categories={data.categories}
          savedVendorIds={data.savedVendorIds}
          comparisonVendorIds={data.comparisonVendorIds}
          wedding={data.wedding}
          initialQuery={q}
        />
      </PageWrapper>
    </AppLayout>
  );
}
