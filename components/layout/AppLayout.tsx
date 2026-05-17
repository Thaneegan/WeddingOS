import type { ReactNode } from "react";
import { getCurrentWorkspace } from "@/lib/auth";
import { formatDate, initials } from "@/lib/utils";
import { MobileNav } from "./MobileNav";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export type WorkspaceChrome = {
  title?: string;
  subtitle?: string;
  initials?: string;
  weddingDate?: string;
};

async function getActiveWorkspaceChrome(): Promise<WorkspaceChrome> {
  const current = await getCurrentWorkspace();

  if (current.type === "wedding") {
    return {
      title: `${current.wedding.coupleNames}'s Wedding`,
      subtitle: `${current.wedding.location} · ${formatDate(current.wedding.date.toISOString())}`,
      initials: initials(current.wedding.coupleNames),
      weddingDate: current.wedding.date.toISOString(),
    };
  }

  if (current.type === "vendor") {
    return {
      title: current.vendorBusiness.name,
      subtitle: current.vendorBusiness.location,
      initials: initials(current.vendorBusiness.name),
    };
  }

  return {
    title: "Platform admin",
    subtitle: "Admin workspace",
    initials: "AD",
  };
}

export async function AppLayout({
  children,
  mode = "couple",
  workspace,
}: {
  children: ReactNode;
  mode?: "couple" | "vendor";
  workspace?: WorkspaceChrome;
}) {
  const resolvedWorkspace = workspace ?? (await getActiveWorkspaceChrome());

  return (
    <div className="min-h-screen bg-[#FAF9F7]">
      <Sidebar mode={mode} workspace={resolvedWorkspace} />
      <div className="min-h-screen lg:pl-72">
        <Topbar mode={mode} workspace={resolvedWorkspace} />
        <main className="px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:pb-10">{children}</main>
      </div>
      <MobileNav mode={mode} />
    </div>
  );
}
