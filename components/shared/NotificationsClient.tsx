"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { processNotificationQueue } from "@/app/actions";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatDate } from "@/lib/utils";
import type { CoreNotificationsData } from "@/types/core";

export function NotificationsClient({ data }: { data: CoreNotificationsData }) {
  const router = useRouter();
  const [status, setStatus] = useState("");

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#e7dfd3] bg-white p-4 luxury-shadow">
          <p className="text-sm font-semibold text-[#6f6a61]">Queued</p>
          <p className="mt-2 font-display text-3xl font-semibold">{data.queuedCount}</p>
        </div>
        <div className="rounded-2xl border border-[#e7dfd3] bg-white p-4 luxury-shadow">
          <p className="text-sm font-semibold text-[#6f6a61]">Failed</p>
          <p className="mt-2 font-display text-3xl font-semibold">{data.failedCount}</p>
        </div>
        <div className="rounded-2xl border border-[#e7dfd3] bg-white p-4 luxury-shadow">
          <p className="text-sm font-semibold text-[#6f6a61]">Recent events</p>
          <p className="mt-2 font-display text-3xl font-semibold">{data.notifications.length}</p>
        </div>
      </div>

      <section className="rounded-2xl border border-[#e7dfd3] bg-white p-5 luxury-shadow">
        <SectionHeader
          title="Notification queue"
          description="Resend-backed transactional emails are visible here before and after processing."
          action={
            <button
              onClick={async () => {
                try {
                  const result = await processNotificationQueue({ limit: 20 });
                  setStatus(`Processed ${result.processed} queued notifications.`);
                  router.refresh();
                } catch (error) {
                  setStatus(error instanceof Error ? error.message : "Notification processing failed.");
                }
              }}
              className="flex h-10 items-center gap-2 rounded-full bg-[#191714] px-4 text-sm font-semibold text-white"
            >
              <RefreshCw size={16} />
              Process queue
            </button>
          }
        />
        {status ? <p className="mb-4 rounded-2xl border border-[#eee7dd] bg-[#fffdf9] p-3 text-sm font-semibold text-[#6f6a61]">{status}</p> : null}
        <div className="overflow-hidden rounded-2xl border border-[#eee7dd]">
          {data.notifications.map((item) => (
            <article key={item.id} className="grid gap-3 border-b border-[#eee7dd] p-4 last:border-0 lg:grid-cols-[1fr_160px_140px_180px] lg:items-center">
              <div className="min-w-0">
                <p className="font-semibold">{item.subject ?? item.type}</p>
                <p className="mt-1 truncate text-sm text-[#6f6a61]">{item.recipient ?? "No recipient"} - {item.template ?? item.type}</p>
                {item.error ? <p className="mt-1 text-sm font-semibold text-[#93484d]">{item.error}</p> : null}
              </div>
              <StatusBadge tone={item.status === "Sent" ? "green" : item.status === "Failed" ? "rose" : "gold"}>{item.status}</StatusBadge>
              <p className="text-sm font-semibold text-[#6f6a61]">{item.provider}</p>
              <p className="text-sm text-[#6f6a61]">{formatDate(item.sentAt ?? item.createdAt)}</p>
            </article>
          ))}
          {!data.notifications.length ? <p className="p-4 text-sm text-[#6f6a61]">No notifications queued yet.</p> : null}
        </div>
      </section>
    </div>
  );
}
