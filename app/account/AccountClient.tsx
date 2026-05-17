"use client";

import { useActionState, useState } from "react";
import {
  Bell,
  CalendarClock,
  CheckCircle2,
  KeyRound,
  Laptop,
  LockKeyhole,
  LogOut,
  MailCheck,
  ShieldCheck,
  SlidersHorizontal,
  UserRound,
  UsersRound,
} from "lucide-react";
import { formatDate, initials } from "@/lib/utils";
import { changePassword, logout } from "./actions";

type WorkspaceSummary = {
  id: string;
  name: string;
  role: string;
  location: string;
};

function SettingRow({
  title,
  description,
  enabled = true,
}: {
  title: string;
  description: string;
  enabled?: boolean;
}) {
  const [checked, setChecked] = useState(enabled);

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-[#fbfaf8] p-4">
      <div>
        <p className="font-semibold text-[#191714]">{title}</p>
        <p className="mt-1 text-sm leading-5 text-[#6f6a61]">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => setChecked((value) => !value)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${checked ? "bg-[#191714]" : "bg-[#d8d0c4]"}`}
        aria-pressed={checked}
        aria-label={title}
      >
        <span className={`absolute top-1 size-5 rounded-full bg-white transition ${checked ? "left-6" : "left-1"}`} />
      </button>
    </div>
  );
}

function roleLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

export function AccountClient({
  email,
  name,
  createdAt,
  emailVerified,
  activeWorkspace,
  weddingWorkspaces,
  vendorWorkspaces,
}: {
  email: string;
  name?: string | null;
  createdAt: string;
  emailVerified: boolean;
  activeWorkspace: string;
  weddingWorkspaces: WorkspaceSummary[];
  vendorWorkspaces: WorkspaceSummary[];
}) {
  const [state, formAction, pending] = useActionState(changePassword, {});
  const displayName = name || email;
  const allWorkspaces = [
    ...weddingWorkspaces.map((workspace) => ({ ...workspace, type: "Wedding" })),
    ...vendorWorkspaces.map((workspace) => ({ ...workspace, type: "Vendor" })),
  ];

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border border-[#e7dfd3] bg-white luxury-shadow">
        <div className="grid gap-0 lg:grid-cols-[1fr_360px]">
          <div className="p-5 sm:p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex size-20 items-center justify-center rounded-3xl bg-[#191714] font-display text-2xl font-semibold text-white">
                {initials(displayName)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9a7a50]">Account owner</p>
                <h2 className="mt-2 truncate font-display text-3xl font-semibold text-[#191714]">{displayName}</h2>
                <p className="mt-1 text-sm text-[#6f6a61]">{email}</p>
              </div>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-[#fbfaf8] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9a7a50]">Active workspace</p>
                <p className="mt-2 font-semibold text-[#191714]">{activeWorkspace}</p>
              </div>
              <div className="rounded-2xl bg-[#fbfaf8] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9a7a50]">Joined</p>
                <p className="mt-2 font-semibold text-[#191714]">{formatDate(createdAt)}</p>
              </div>
              <div className="rounded-2xl bg-[#fbfaf8] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9a7a50]">Email status</p>
                <p className="mt-2 font-semibold text-[#191714]">{emailVerified ? "Verified" : "Pending verification"}</p>
              </div>
            </div>
          </div>

          <div className="border-t border-[#e7dfd3] bg-[#fbfaf8] p-5 lg:border-l lg:border-t-0">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-[#61735f]" />
              <p className="font-semibold text-[#191714]">Security posture</p>
            </div>
            <div className="mt-4 space-y-3">
              {[
                ["Password enabled", "Credential login is active"],
                [emailVerified ? "Email verified" : "Email verification pending", "Required before sending account invitations"],
                ["Workspace permissions", "Scoped by wedding and vendor membership"],
              ].map(([title, detail]) => (
                <div key={title} className="flex items-center gap-3 rounded-2xl bg-white p-3">
                  <CheckCircle2 size={17} className="text-[#61735f]" />
                  <div>
                    <p className="text-sm font-semibold text-[#191714]">{title}</p>
                    <p className="text-xs text-[#6f6a61]">{detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-[#e7dfd3] bg-white p-5 luxury-shadow">
            <div className="mb-5 flex items-center gap-2">
              <UserRound size={18} className="text-[#9a7a50]" />
              <h2 className="font-display text-2xl font-semibold text-[#191714]">Profile</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-semibold text-[#6f6a61]">
                Display name
                <input value={displayName} readOnly className="mt-2 h-11 w-full rounded-full border border-[#e7dfd3] bg-[#fffdf9] px-4 text-sm text-[#191714]" />
              </label>
              <label className="text-sm font-semibold text-[#6f6a61]">
                Email
                <input value={email} readOnly className="mt-2 h-11 w-full rounded-full border border-[#e7dfd3] bg-[#fffdf9] px-4 text-sm text-[#191714]" />
              </label>
              <label className="text-sm font-semibold text-[#6f6a61]">
                Timezone
                <input value="America/Toronto" readOnly className="mt-2 h-11 w-full rounded-full border border-[#e7dfd3] bg-[#fffdf9] px-4 text-sm text-[#191714]" />
              </label>
              <label className="text-sm font-semibold text-[#6f6a61]">
                Access role
                <input value={allWorkspaces.some((workspace) => workspace.type === "Vendor") ? "Couple and vendor access" : "Couple workspace"} readOnly className="mt-2 h-11 w-full rounded-full border border-[#e7dfd3] bg-[#fffdf9] px-4 text-sm text-[#191714]" />
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-[#e7dfd3] bg-white p-5 luxury-shadow">
            <div className="mb-5 flex items-center gap-2">
              <UsersRound size={18} className="text-[#9a7a50]" />
              <h2 className="font-display text-2xl font-semibold text-[#191714]">Workspace access</h2>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {allWorkspaces.map((workspace) => (
                <article key={`${workspace.type}-${workspace.id}`} className="rounded-2xl border border-[#eee7dd] bg-[#fffdf9] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[#191714]">{workspace.name}</p>
                      <p className="mt-1 text-sm text-[#6f6a61]">{workspace.location}</p>
                    </div>
                    <span className="rounded-full bg-[#f1ece4] px-3 py-1 text-xs font-semibold text-[#6f6a61]">{workspace.type}</span>
                  </div>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#9a7a50]">{roleLabel(workspace.role)}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-[#e7dfd3] bg-white p-5 luxury-shadow">
            <div className="mb-5 flex items-center gap-2">
              <Bell size={18} className="text-[#9a7a50]" />
              <h2 className="font-display text-2xl font-semibold text-[#191714]">Notifications</h2>
            </div>
            <div className="space-y-3">
              <SettingRow title="New messages" description="Send an email when vendors or couples reply in a thread." />
              <SettingRow title="Payment reminders" description="Notify workspace members before deposits and invoices are due." />
              <SettingRow title="RSVP reminders" description="Allow reminder emails for pending guest responses." />
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <form action={formAction} className="rounded-2xl border border-[#e7dfd3] bg-white p-5 luxury-shadow">
            <div className="flex items-center gap-2">
              <KeyRound size={18} className="text-[#9a7a50]" />
              <h2 className="font-display text-2xl font-semibold">Password</h2>
            </div>
            <div className="mt-4 space-y-3">
              <input name="currentPassword" type="password" placeholder="Current password" className="h-11 w-full rounded-full border border-[#e7dfd3] bg-[#fffdf9] px-4 text-sm outline-none focus:border-[#c8a97e]" required />
              <input name="newPassword" type="password" placeholder="New password" className="h-11 w-full rounded-full border border-[#e7dfd3] bg-[#fffdf9] px-4 text-sm outline-none focus:border-[#c8a97e]" required />
              <input name="confirmPassword" type="password" placeholder="Confirm new password" className="h-11 w-full rounded-full border border-[#e7dfd3] bg-[#fffdf9] px-4 text-sm outline-none focus:border-[#c8a97e]" required />
            </div>
            {state?.error ? <p className="mt-3 text-sm font-semibold text-[#93484d]">{state.error}</p> : null}
            {state?.success ? <p className="mt-3 text-sm font-semibold text-[#61735f]">{state.success}</p> : null}
            <button disabled={pending} className="mt-4 h-11 rounded-full bg-[#191714] px-5 text-sm font-semibold text-white disabled:opacity-60">
              {pending ? "Saving" : "Update password"}
            </button>
          </form>

          <section className="rounded-2xl border border-[#e7dfd3] bg-white p-5 luxury-shadow">
            <div className="mb-4 flex items-center gap-2">
              <Laptop size={18} className="text-[#9a7a50]" />
              <h2 className="font-display text-2xl font-semibold text-[#191714]">Session</h2>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-2xl bg-[#fbfaf8] p-4">
                <span className="font-semibold text-[#191714]">Current device</span>
                <span className="text-[#6f6a61]">Current browser</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-[#fbfaf8] p-4">
                <span className="font-semibold text-[#191714]">Access mode</span>
                <span className="text-[#6f6a61]">Invite-only</span>
              </div>
            </div>
            <form action={logout} className="mt-4">
              <button className="flex h-11 items-center gap-2 rounded-full border border-[#e7dfd3] px-4 text-sm font-semibold text-[#93484d]">
                <LogOut size={16} />
                Sign out
              </button>
            </form>
          </section>

          <section className="rounded-2xl border border-[#e7dfd3] bg-white p-5 luxury-shadow">
            <div className="mb-4 flex items-center gap-2">
              <SlidersHorizontal size={18} className="text-[#9a7a50]" />
              <h2 className="font-display text-2xl font-semibold text-[#191714]">Privacy and account controls</h2>
            </div>
            <div className="space-y-3">
              <SettingRow title="Product feedback" description="Allow usage notes to improve workflows." />
              <SettingRow title="Profile discovery" description="Show approved vendor profiles in marketplace search." enabled={false} />
              <SettingRow title="Security emails" description="Always send password and invite notifications." />
            </div>
          </section>

          <section className="rounded-2xl border border-[#e7dfd3] bg-[#191714] p-5 text-white luxury-shadow">
            <div className="flex items-center gap-2">
              <LockKeyhole size={18} />
              <h2 className="font-display text-2xl font-semibold">Account readiness</h2>
            </div>
            <div className="mt-4 space-y-3 text-sm">
              <p className="flex items-center gap-2"><MailCheck size={16} /> Email identity connected</p>
              <p className="flex items-center gap-2"><CalendarClock size={16} /> Workspace activity tracked</p>
              <p className="flex items-center gap-2"><ShieldCheck size={16} /> Role permissions enforced</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
