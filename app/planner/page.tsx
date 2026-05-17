import { AppLayout } from "@/components/layout/AppLayout";
import { PageWrapper } from "@/components/animations/PageWrapper";
import { PlannerClient } from "@/components/couple/PlannerClient";
import { getPlannerData } from "@/lib/coreData";

export const dynamic = "force-dynamic";

export default async function PlannerPage() {
  const data = await getPlannerData();

  return (
    <AppLayout>
      <PageWrapper>
        <PlannerClient data={data} />
      </PageWrapper>
    </AppLayout>
  );
}
