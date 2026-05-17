import { FileText } from "lucide-react";
import { PageWrapper } from "@/components/animations/PageWrapper";
import { DocumentsHub } from "@/components/couple/DocumentsHub";
import { AppLayout } from "@/components/layout/AppLayout";
import { getDocumentsData } from "@/lib/coreData";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const data = await getDocumentsData();

  return (
    <AppLayout>
      <PageWrapper>
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#9a7a50]">
              <FileText size={15} />
              Couple workspace
            </p>
            <h1 className="mt-2 font-display text-4xl font-semibold text-[#191714]">Documents</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6f6a61]">
              Central library for contracts, invoices, menus, floor plans, ceremony checklists, inspiration, and seating files.
            </p>
          </div>
        </div>
        <DocumentsHub data={data} />
      </PageWrapper>
    </AppLayout>
  );
}
