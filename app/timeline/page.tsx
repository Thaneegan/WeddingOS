import { AppLayout } from "@/components/layout/AppLayout";
import { PageWrapper } from "@/components/animations/PageWrapper";
import { CategoryManager } from "@/components/shared/CategoryManager";
import { TimelineList } from "@/components/couple/TimelineList";
import { getTimelineData } from "@/lib/coreData";

export const dynamic = "force-dynamic";

export default async function TimelinePage() {
  const data = await getTimelineData();

  return (
    <AppLayout>
      <PageWrapper>
        <div className="space-y-6">
          <TimelineList data={data} />
          <details>
            <summary className="inline-flex cursor-pointer list-none rounded-full border border-[#e7dfd3] bg-white px-4 py-2 text-sm font-semibold text-[#6f6a61] transition hover:-translate-y-0.5 hover:border-[#c8a97e]">
              Advanced task categories
            </summary>
            <div className="mt-4">
              <CategoryManager
                type="task"
                title="Manage task categories"
                description="Create private planning categories for ceremonies, family logistics, outfit deadlines, travel, or any workflow your wedding needs."
                categories={data.categories}
              />
            </div>
          </details>
        </div>
      </PageWrapper>
    </AppLayout>
  );
}
