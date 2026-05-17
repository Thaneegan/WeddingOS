"use client";

import { useRouter } from "next/navigation";
import { Building2, Gem, Shield, Store } from "lucide-react";
import { switchWorkspace } from "@/app/actions";

type WorkspaceItem = {
  id: string;
  type: "WEDDING" | "VENDOR" | "ADMIN";
  title: string;
  subtitle: string;
  organizationId?: string;
  weddingId?: string;
  vendorBusinessId?: string;
};

export function WorkspaceList({ workspaces }: { workspaces: WorkspaceItem[] }) {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9a7a50]">Workspace switcher</p>
        <h1 className="mt-2 font-display text-4xl font-semibold">Choose where you want to work.</h1>
      </div>
      <div className="grid gap-4">
        {workspaces.map((workspace) => {
          const Icon = workspace.type === "WEDDING" ? Gem : workspace.type === "VENDOR" ? Store : Shield;
          return (
            <button
              key={workspace.id}
              onClick={async () => {
                await switchWorkspace({
                  type: workspace.type,
                  organizationId: workspace.organizationId,
                  weddingId: workspace.weddingId,
                  vendorBusinessId: workspace.vendorBusinessId,
                });
                router.push(workspace.type === "VENDOR" ? "/vendor/dashboard" : workspace.type === "ADMIN" ? "/admin" : "/dashboard");
                router.refresh();
              }}
              className="flex items-center gap-4 rounded-2xl border border-[#e7dfd3] bg-white p-5 text-left luxury-shadow hover:border-[#c8a97e]"
            >
              <span className="flex size-12 items-center justify-center rounded-2xl bg-[#fbf5ec] text-[#9a7a50]">
                <Icon size={20} />
              </span>
              <span className="min-w-0">
                <span className="block truncate font-display text-2xl font-semibold">{workspace.title}</span>
                <span className="mt-1 block text-sm text-[#6f6a61]">{workspace.subtitle}</span>
              </span>
              <Building2 className="ml-auto text-[#c8a97e]" size={18} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
