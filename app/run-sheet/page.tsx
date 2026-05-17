import { ClipboardList } from "lucide-react";
import { PageWrapper } from "@/components/animations/PageWrapper";
import { RunSheetView } from "@/components/couple/RunSheetView";
import { AppLayout } from "@/components/layout/AppLayout";
import { getRunSheetData } from "@/lib/coreData";

export const dynamic = "force-dynamic";

export default async function RunSheetPage() {
  const data = await getRunSheetData();

  return (
    <AppLayout>
      <PageWrapper>
        <div className="mb-6 print:hidden">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#9a7a50]">
            <ClipboardList size={15} />
            Couple workspace
          </p>
          <h1 className="mt-2 font-display text-4xl font-semibold text-[#191714]">Run sheets</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6f6a61]">
            Mobile-ready event execution views with schedules, vendor arrivals, family contacts, payments, and critical files.
          </p>
        </div>
        <RunSheetView data={data} />
      </PageWrapper>
    </AppLayout>
  );
}
