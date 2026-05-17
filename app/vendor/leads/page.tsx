import { redirect } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageWrapper } from "@/components/animations/PageWrapper";
import { LeadPipeline } from "@/components/vendor/LeadPipeline";
import { getVendorLeadsData } from "@/lib/coreData";

export const dynamic = "force-dynamic";

export default async function VendorLeadsPage() {
  let data;
  try {
    data = await getVendorLeadsData();
  } catch (error) {
    if (error instanceof Error && error.message.includes("not a vendor account")) redirect("/dashboard");
    throw error;
  }

  return (
    <AppLayout mode="vendor">
      <PageWrapper>
        <LeadPipeline leads={data.leads} />
      </PageWrapper>
    </AppLayout>
  );
}
