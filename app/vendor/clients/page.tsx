import { AppLayout } from "@/components/layout/AppLayout";
import { PageWrapper } from "@/components/animations/PageWrapper";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { VendorClientsClient } from "@/components/vendor/VendorClientsClient";
import { getVendorClientsData } from "@/lib/coreData";

export const dynamic = "force-dynamic";

export default async function VendorClientsPage() {
  const data = await getVendorClientsData();

  return (
    <AppLayout mode="vendor">
      <PageWrapper>
        <SectionHeader
          eyebrow="Vendor portal"
          title="Client management"
          description="Manage booking amount, service, contract status, invoices, payment rows, notes, files, and scheduled calls."
        />
        <VendorClientsClient data={data} />
      </PageWrapper>
    </AppLayout>
  );
}
