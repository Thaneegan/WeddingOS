import { redirect } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageWrapper } from "@/components/animations/PageWrapper";
import { VendorDashboardClient } from "@/components/vendor/VendorDashboardClient";
import { getVendorDashboardData } from "@/lib/coreData";

export const dynamic = "force-dynamic";

export default async function VendorDashboardPage() {
  let data;
  try {
    data = await getVendorDashboardData();
  } catch (error) {
    if (error instanceof Error && error.message.includes("not a vendor account")) redirect("/dashboard");
    throw error;
  }

  return (
    <AppLayout mode="vendor">
      <PageWrapper>
        <VendorDashboardClient data={data} />
      </PageWrapper>
    </AppLayout>
  );
}
