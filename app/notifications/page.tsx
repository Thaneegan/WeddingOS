import { AppLayout } from "@/components/layout/AppLayout";
import { PageWrapper } from "@/components/animations/PageWrapper";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { NotificationsClient } from "@/components/shared/NotificationsClient";
import { getNotificationsData } from "@/lib/coreData";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const data = await getNotificationsData();

  return (
    <AppLayout>
      <PageWrapper>
        <SectionHeader eyebrow="Operations" title="Notifications" description="Review queued, sent, and failed transactional emails for RSVP reminders, messages, invites, and account events." />
        <NotificationsClient data={data} />
      </PageWrapper>
    </AppLayout>
  );
}
