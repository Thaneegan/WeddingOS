import { AppLayout } from "@/components/layout/AppLayout";
import { PageWrapper } from "@/components/animations/PageWrapper";
import { getCurrentUser } from "@/lib/auth";
import { WorkspaceList } from "./WorkspaceList";

export const dynamic = "force-dynamic";

export default async function WorkspacesPage() {
  const user = await getCurrentUser();
  const weddingWorkspaces =
    user.accountType === "COUPLE"
      ? user.weddingMemberships.map((membership) => ({
          id: `wedding-${membership.weddingId}`,
          type: "WEDDING" as const,
          title: membership.wedding.coupleNames,
          subtitle: `${membership.role.toLowerCase()} wedding workspace`,
          organizationId: membership.wedding.organizationId,
          weddingId: membership.weddingId,
        }))
      : [];
  const vendorWorkspaces =
    user.accountType === "VENDOR"
      ? user.memberships.flatMap((membership) =>
          membership.organization.vendorBusinesses.map((vendor) => ({
            id: `vendor-${vendor.id}`,
            type: "VENDOR" as const,
            title: vendor.name,
            subtitle: `${membership.role.toLowerCase()} vendor workspace`,
            organizationId: membership.organizationId,
            vendorBusinessId: vendor.id,
          })),
        )
      : [];
  const adminWorkspaces = user.memberships
    .filter((membership) => user.accountType === "ADMIN" && membership.organization.type === "ADMIN")
    .map((membership) => ({
      id: `admin-${membership.organizationId}`,
      type: "ADMIN" as const,
      title: membership.organization.name,
      subtitle: "Platform admin workspace",
      organizationId: membership.organizationId,
    }));

  return (
    <AppLayout>
      <PageWrapper>
        <WorkspaceList workspaces={[...weddingWorkspaces, ...vendorWorkspaces, ...adminWorkspaces]} />
      </PageWrapper>
    </AppLayout>
  );
}
