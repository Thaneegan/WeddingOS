import { AdminMetricsClient } from "@/components/admin/AdminMetricsClient";
import { AdminBetaPanel } from "@/components/admin/AdminBetaPanel";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageWrapper } from "@/components/animations/PageWrapper";
import { getBetaReadinessData } from "@/lib/betaReadiness";
import { requireAdmin } from "@/lib/auth";
import { getAdminData } from "@/lib/coreData";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin();
  const [data, betaData] = await Promise.all([getAdminData(), getBetaReadinessData()]);

  return (
    <AppLayout>
      <PageWrapper>
        <div className="space-y-8">
          <AdminMetricsClient data={data} />
          <AdminBetaPanel data={betaData} />
        </div>
      </PageWrapper>
    </AppLayout>
  );
}
