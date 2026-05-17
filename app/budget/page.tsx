import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageWrapper } from "@/components/animations/PageWrapper";
import { BudgetOverview } from "@/components/couple/BudgetOverview";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { CategoryManager } from "@/components/shared/CategoryManager";
import { getBudgetData } from "@/lib/coreData";
import { formatDate, initials } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function BudgetPage() {
  const data = await getBudgetData();
  const workspace = {
    title: `${data.wedding.couple}'s Wedding`,
    subtitle: `${data.wedding.location} · ${formatDate(data.wedding.date)}`,
    initials: initials(data.wedding.couple),
    weddingDate: data.wedding.date,
  };

  return (
    <AppLayout workspace={workspace}>
      <PageWrapper>
        <SectionHeader
          eyebrow="Couple workspace"
          title="Budget tracker"
          description="Track committed spend, deposits, upcoming payments, and vendor-linked expenses."
          action={
            <Link href="/templates" className="inline-flex h-10 items-center rounded-full border border-[#d8c5aa] bg-[#fbf5ec] px-4 text-sm font-semibold text-[#7a582c] transition hover:bg-[#f4eadb]">
              Budget templates
            </Link>
          }
        />
        <div className="space-y-6">
          <BudgetOverview
            data={data}
            taxonomySlot={
              <CategoryManager
                type="budget"
                title="Budget categories"
                description="Add private categories for cultural events, attire details, family logistics, or any non-standard cost bucket."
                allowBudgetStarter
                categories={data.categories}
                compact
              />
            }
          />
        </div>
      </PageWrapper>
    </AppLayout>
  );
}
