import { AppLayout } from "@/components/layout/AppLayout";
import { VendorProfile } from "@/components/vendor/VendorProfile";
import { getVendorProfileData } from "@/lib/coreData";

export const dynamic = "force-dynamic";

export default async function VendorProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const vendor = await getVendorProfileData(id);

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl">
        <VendorProfile vendor={vendor} />
      </div>
    </AppLayout>
  );
}
