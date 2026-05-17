import { AppLayout } from "@/components/layout/AppLayout";
import { PageWrapper } from "@/components/animations/PageWrapper";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { MessageHub } from "@/components/shared/MessageHub";
import { getMessagesData } from "@/lib/coreData";

export const dynamic = "force-dynamic";

export default async function VendorMessagesPage() {
  const data = await getMessagesData("vendor");

  return (
    <AppLayout mode="vendor">
      <PageWrapper>
        <SectionHeader eyebrow="Vendor portal" title="Messages" description="Vendor-side communication reads and writes to the same shared store as the couple inbox." />
        <MessageHub mode="vendor" conversations={data.conversations} messages={data.messages} scheduledCalls={data.scheduledCalls} />
      </PageWrapper>
    </AppLayout>
  );
}
