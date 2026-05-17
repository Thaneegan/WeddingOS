import { AppLayout } from "@/components/layout/AppLayout";
import { PageWrapper } from "@/components/animations/PageWrapper";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { MessageHub } from "@/components/shared/MessageHub";
import { getMessagesData } from "@/lib/coreData";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const data = await getMessagesData("couple");

  return (
    <AppLayout>
      <PageWrapper>
        <SectionHeader
          eyebrow="Couple workspace"
          title="Messages"
          description="Clear vendor follow-ups, review quote questions, schedule calls, and keep every planning decision tied to the right vendor."
        />
        <MessageHub mode="couple" conversations={data.conversations} messages={data.messages} scheduledCalls={data.scheduledCalls} />
      </PageWrapper>
    </AppLayout>
  );
}
