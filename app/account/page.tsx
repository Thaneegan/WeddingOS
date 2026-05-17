import { AppLayout } from "@/components/layout/AppLayout";
import { PageWrapper } from "@/components/animations/PageWrapper";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { getCurrentUser } from "@/lib/auth";
import { AccountClient } from "./AccountClient";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await getCurrentUser();
  const weddingWorkspaces = user.weddingMemberships.map((membership) => ({
    id: membership.weddingId,
    name: membership.wedding.coupleNames,
    role: membership.role,
    location: membership.wedding.location,
  }));
  const vendorWorkspaces = user.memberships.flatMap((membership) =>
    membership.organization.vendorBusinesses.map((vendorBusiness) => ({
      id: vendorBusiness.id,
      name: vendorBusiness.name,
      role: membership.role,
      location: vendorBusiness.location,
    })),
  );
  const activeWorkspace =
    user.workspacePreference?.activeType === "VENDOR"
      ? vendorWorkspaces.find((workspace) => workspace.id === user.workspacePreference?.activeVendorBusinessId)?.name
      : weddingWorkspaces.find((workspace) => workspace.id === user.workspacePreference?.activeWeddingId)?.name;

  return (
    <AppLayout>
      <PageWrapper>
        <SectionHeader eyebrow="Account" title="Profile and security" description="Manage identity, access, workspace preferences, and account controls." />
        <AccountClient
          email={user.email}
          name={user.name}
          createdAt={user.createdAt.toISOString()}
          emailVerified={Boolean(user.emailVerified)}
          activeWorkspace={activeWorkspace ?? "Default workspace"}
          weddingWorkspaces={weddingWorkspaces}
          vendorWorkspaces={vendorWorkspaces}
        />
      </PageWrapper>
    </AppLayout>
  );
}
