"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Mail, Plus, Send, XCircle } from "lucide-react";
import { createInvite, processNotificationQueue, revokeInvite } from "@/app/actions";
import { SectionHeader } from "@/components/shared/SectionHeader";

type BetaReadinessData = {
  checks: { label: string; ok: boolean; detail: string }[];
  activeInvites: { id: string; code: string; email: string | null; role: string; createdAt: Date }[];
  waitlistSignups: { id: string; email: string; name: string; partnerName: string | null; accountType: string; attemptedInviteCode: string | null; createdAt: Date }[];
  queuedNotifications: number;
};

const inviteRoles = ["COUPLE_OWNER", "VENDOR_OWNER", "WEDDING_MEMBER", "VENDOR_MEMBER", "ADMIN"] as const;
type InviteRoleValue = (typeof inviteRoles)[number];

export function AdminBetaPanel({ data }: { data: BetaReadinessData }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<InviteRoleValue>("COUPLE_OWNER");

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#e7dfd3] bg-white p-5 luxury-shadow">
        <SectionHeader eyebrow="System readiness" title="Readiness checklist" description="Run this before sharing access through a secure tunnel." />
        <div className="grid gap-3 md:grid-cols-2">
          {data.checks.map((check) => (
            <div key={check.label} className="flex gap-3 rounded-2xl border border-[#eee7dd] bg-[#fffdf9] p-4">
              {check.ok ? <CheckCircle2 className="mt-0.5 text-[#61735f]" size={20} /> : <XCircle className="mt-0.5 text-[#93484d]" size={20} />}
              <div>
                <p className="font-semibold">{check.label}</p>
                <p className="mt-1 text-sm text-[#6f6a61]">{check.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-[#e7dfd3] bg-white p-5 luxury-shadow">
        <SectionHeader
          eyebrow="Access requests"
          title="Waitlist"
          description="Review completed signups that are waiting for an active invitation."
        />
        <div className="grid gap-3">
          {data.waitlistSignups.length ? (
            data.waitlistSignups.map((signup) => (
              <div key={signup.id} className="grid gap-2 rounded-2xl border border-[#eee7dd] bg-[#fffdf9] p-4 md:grid-cols-[1fr_160px_180px] md:items-center">
                <div>
                  <p className="font-semibold text-[#191714]">
                    {signup.accountType === "couple" && signup.partnerName ? `${signup.name} & ${signup.partnerName}` : signup.name}
                  </p>
                  <p className="mt-1 text-sm text-[#6f6a61]">{signup.email}</p>
                  {signup.attemptedInviteCode ? <p className="mt-1 font-mono text-xs text-[#9a7a50]">Tried {signup.attemptedInviteCode}</p> : null}
                </div>
                <p className="text-sm font-semibold capitalize">{signup.accountType}</p>
                <button
                  onClick={async () => {
                    await createInvite({ email: signup.email, role: signup.accountType === "vendor" ? "VENDOR_OWNER" : "COUPLE_OWNER" });
                    router.refresh();
                  }}
                  className="h-10 rounded-full bg-[#191714] px-4 text-sm font-semibold text-white"
                >
                  Create invite
                </button>
              </div>
            ))
          ) : (
            <p className="rounded-2xl bg-[#fffdf9] p-4 text-sm font-semibold text-[#6f6a61]">No pending access requests.</p>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-[#e7dfd3] bg-white p-5 luxury-shadow">
        <SectionHeader
          eyebrow="Invite-only access"
          title="Invitations"
          description="Create scoped invite codes for couples, vendors, members, and admins."
          action={
            <button
              onClick={async () => {
                await processNotificationQueue({ limit: 10 });
                router.refresh();
              }}
              className="flex h-10 items-center gap-2 rounded-full bg-[#191714] px-4 text-sm font-semibold text-white"
            >
              <Send size={16} />
              Process {data.queuedNotifications} queued
            </button>
          }
        />
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            await createInvite({ email: email || undefined, role });
            setEmail("");
            router.refresh();
          }}
          className="mb-5 grid gap-3 md:grid-cols-[1fr_220px_auto]"
        >
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Optional recipient email"
            type="email"
            className="h-11 rounded-full border border-[#e7dfd3] bg-[#fbfaf8] px-4 text-sm outline-none focus:border-[#c8a97e]"
          />
          <select value={role} onChange={(event) => setRole(event.target.value as InviteRoleValue)} className="h-11 rounded-full border border-[#e7dfd3] bg-[#fbfaf8] px-3 text-sm font-semibold">
            {inviteRoles.map((item) => (
              <option key={item} value={item}>{item.replaceAll("_", " ")}</option>
            ))}
          </select>
          <button className="flex h-11 items-center justify-center gap-2 rounded-full bg-[#191714] px-5 text-sm font-semibold text-white">
            <Plus size={16} />
            Create invite
          </button>
        </form>
        <div className="grid gap-3">
          {data.activeInvites.map((invite) => (
            <div key={invite.id} className="grid gap-2 rounded-2xl border border-[#eee7dd] bg-[#fffdf9] p-4 md:grid-cols-[1fr_170px_180px_auto] md:items-center">
              <div>
                <p className="font-mono text-sm font-semibold">{invite.code}</p>
                <p className="mt-1 text-sm text-[#6f6a61]">{invite.email ?? "Any email"}</p>
              </div>
              <p className="text-sm font-semibold">{invite.role.replaceAll("_", " ")}</p>
              <a className="flex items-center gap-2 text-sm font-semibold text-[#9a7a50]" href={`/signup?code=${invite.code}`}>
                <Mail size={15} />
                Signup link
              </a>
              <button
                onClick={async () => {
                  await revokeInvite({ inviteId: invite.id });
                  router.refresh();
                }}
                className="h-10 rounded-full border border-[#efd5d4] px-4 text-sm font-semibold text-[#93484d]"
              >
                Revoke
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
