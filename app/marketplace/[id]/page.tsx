import { AppLayout } from "@/components/layout/AppLayout";
import { VendorProfile } from "@/components/vendor/VendorProfile";
import { vendors } from "@/lib/mockData";

export function generateStaticParams() {
  return vendors.map((vendor) => ({ id: vendor.id }));
}

export default async function VendorProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl">
        <VendorProfile vendorId={id} />
      </div>
    </AppLayout>
  );
}
