"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarPlus,
  Check,
  CheckCircle2,
  Clock3,
  FileText,
  LinkIcon,
  Paperclip,
  Search,
  Send,
  Upload,
  Video,
  X,
} from "lucide-react";
import { createScheduledCall, deleteScheduledCall, markConversationRead, sendMessage, uploadFileAsset } from "@/app/actions";
import { formatDate, initials } from "@/lib/utils";
import type { CoreConversation, CoreMessage, CoreScheduledCall } from "@/types/core";

const dateFormatter = new Intl.DateTimeFormat("en-CA", { month: "short", day: "numeric", year: "numeric" });
const timeFormatter = new Intl.DateTimeFormat("en-CA", { hour: "numeric", minute: "2-digit" });

type DisplayMessage = CoreMessage & {
  delivery?: "sending" | "failed";
};

function toBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const value = String(reader.result ?? "");
      resolve(value.includes(",") ? value.split(",")[1] : value);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function conversationTitle(mode: "couple" | "vendor", conversation: CoreConversation) {
  return mode === "vendor" ? conversation.coupleName : conversation.vendorName;
}

function conversationUnread(mode: "couple" | "vendor", conversation: CoreConversation) {
  return mode === "vendor" ? conversation.unreadForVendor : conversation.unreadForCouple;
}

function conversationNeedsReply(mode: "couple" | "vendor", conversation: CoreConversation) {
  return conversation.lastMessageFrom !== undefined && conversation.lastMessageFrom !== "system" && conversation.lastMessageFrom !== mode;
}

function conversationWaitingOnThem(mode: "couple" | "vendor", conversation: CoreConversation) {
  return conversation.lastMessageFrom === mode;
}

function dayKey(timestamp: string) {
  return dateFormatter.format(new Date(timestamp));
}

function messageTone(message: CoreMessage, mode: "couple" | "vendor") {
  if (message.sender === "system") return "system";
  return message.sender === mode ? "mine" : "theirs";
}

function nextAction(mode: "couple" | "vendor", conversation: CoreConversation) {
  if (conversationNeedsReply(mode, conversation)) {
    return mode === "couple"
      ? "This vendor is waiting on you. Reply with the missing detail, confirm availability, or schedule a call."
      : "This couple is waiting on you. Reply with next steps, package details, or a quote update.";
  }
  if (conversation.stage === "Proposal Sent") {
    return mode === "couple"
      ? "A proposal is in motion. Review quote terms in your shortlist, then accept or ask follow-up questions here."
      : "Proposal sent. Follow up if the couple has not responded or clarify any package terms.";
  }
  if (conversation.stage === "Booked") {
    return "This vendor is booked. Use this thread for logistics, documents, arrival times, and final confirmations.";
  }
  if (conversationWaitingOnThem(mode, conversation)) {
    return mode === "couple"
      ? "You are waiting on the vendor. If timing matters, send a short follow-up or schedule a call."
      : "You are waiting on the couple. Keep this thread open for their response.";
  }
  return "Use this thread to keep quote details, calls, documents, and decisions in one place.";
}

function quickReplies(mode: "couple" | "vendor", conversation: CoreConversation) {
  if (mode === "vendor") {
    return [
      "Thanks for reaching out. I can confirm availability and send package details shortly.",
      "I can prepare a quote for this date. Are there any must-have services or cultural details I should include?",
      "Would you like to schedule a quick call this week to walk through the package?",
    ];
  }

  if (conversation.stage === "Proposal Sent") {
    return [
      "Thanks for sending the proposal. Can you confirm what is included, what is excluded, and whether there are overtime fees?",
      "Can you hold our date while we review the quote with family?",
      "We are reviewing the quote now. Can we schedule a call to clarify a few details?",
    ];
  }

  if (conversationNeedsReply(mode, conversation)) {
    return [
      "Thanks for the update. We will review and get back to you shortly.",
      "Can you confirm your availability for our event date and share package options?",
      "Can we schedule a quick call to go through details and next steps?",
    ];
  }

  return [
    "Just following up to see if you have an update on availability and pricing.",
    "Can you send your package details, deposit terms, and what is included?",
    "Can we schedule a call this week to discuss fit and next steps?",
  ];
}

export function MessageHub({
  mode,
  conversations,
  messages,
  scheduledCalls = [],
}: {
  mode: "couple" | "vendor";
  conversations: CoreConversation[];
  messages: CoreMessage[];
  scheduledCalls?: CoreScheduledCall[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const firstUnread = conversations.find((conversation) => conversationUnread(mode, conversation) > 0);
  const [selectedId, setSelectedId] = useState(firstUnread?.id ?? conversations[0]?.id ?? "");
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "needs-reply" | "unread" | "scheduled">("all");
  const [showCallForm, setShowCallForm] = useState(false);
  const [showAttachForm, setShowAttachForm] = useState(false);
  const [optimisticMessages, setOptimisticMessages] = useState<DisplayMessage[]>([]);
  const [attachmentStatus, setAttachmentStatus] = useState("");
  const [error, setError] = useState("");
  const [callForm, setCallForm] = useState({ title: "Wedding consultation", callUrl: "", startsAt: "", durationMinutes: "30" });

  const selected = conversations.find((item) => item.id === selectedId) ?? conversations[0];
  const selectedUnread = selected ? conversationUnread(mode, selected) : 0;
  const needsReplyCount = conversations.filter((conversation) => conversationNeedsReply(mode, conversation)).length;
  const unreadCount = conversations.reduce((sum, conversation) => sum + conversationUnread(mode, conversation), 0);
  const scheduledCount = new Set(scheduledCalls.map((call) => call.conversationId)).size;

  const conversationMessages = useMemo(
    () =>
      [
        ...messages.filter((message) => message.conversationId === selected?.id),
        ...optimisticMessages.filter((message) => message.conversationId === selected?.id),
      ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
    [messages, optimisticMessages, selected?.id],
  );
  const conversationCalls = useMemo(
    () => scheduledCalls.filter((call) => call.conversationId === selected?.id),
    [scheduledCalls, selected?.id],
  );
  const filteredConversations = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return conversations.filter((conversation) => {
      const title = conversationTitle(mode, conversation);
      const matchesQuery = normalized
        ? `${title} ${conversation.vendorName} ${conversation.coupleName} ${conversation.serviceName ?? ""} ${conversation.lastMessage ?? ""}`.toLowerCase().includes(normalized)
        : true;
      const matchesFilter =
        filter === "all" ||
        (filter === "needs-reply" && conversationNeedsReply(mode, conversation)) ||
        (filter === "unread" && conversationUnread(mode, conversation) > 0) ||
        (filter === "scheduled" && scheduledCalls.some((call) => call.conversationId === conversation.id));

      return matchesQuery && matchesFilter;
    });
  }, [conversations, filter, mode, query, scheduledCalls]);

  const groupedMessages = useMemo(() => {
    const groups: { day: string; items: DisplayMessage[] }[] = [];

    conversationMessages.forEach((message) => {
      const key = dayKey(message.timestamp);
      const existing = groups.at(-1);
      if (existing?.day === key) {
        existing.items.push(message);
      } else {
        groups.push({ day: key, items: [message] });
      }
    });

    return groups;
  }, [conversationMessages]);

  useEffect(() => {
    if (!selected?.id || selectedUnread === 0) return;

    startTransition(async () => {
      await markConversationRead({ conversationId: selected.id });
      router.refresh();
    });
  }, [router, selected?.id, selectedUnread]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "hidden") return;
      startTransition(() => {
        router.refresh();
      });
    }, 7000);

    return () => window.clearInterval(intervalId);
  }, [router, startTransition]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [conversationMessages.length, selected?.id]);

  const submit = (text = draft) => {
    if (!selected || !text.trim()) return;
    const body = text.trim();
    const tempId = `optimistic-${Date.now()}`;
    const optimisticMessage: DisplayMessage = {
      id: tempId,
      conversationId: selected.id,
      sender: mode,
      senderName: mode === "vendor" ? selected.vendorName : "You",
      body,
      timestamp: new Date().toISOString(),
      delivery: "sending",
    };

    setOptimisticMessages((items) => [...items, optimisticMessage]);
    setDraft("");
    setError("");
    startTransition(async () => {
      try {
        await sendMessage({ conversationId: selected.id, body, senderRole: mode });
        router.refresh();
        window.setTimeout(() => {
          setOptimisticMessages((items) => items.filter((item) => item.id !== tempId));
        }, 900);
      } catch (sendError) {
        setOptimisticMessages((items) => items.map((item) => (item.id === tempId ? { ...item, delivery: "failed" } : item)));
        setError(sendError instanceof Error ? sendError.message : "Message could not be sent.");
      }
    });
  };

  const addCall = () => {
    if (!selected || !callForm.title.trim() || !callForm.callUrl.trim() || !callForm.startsAt) {
      setError("Add a title, meeting link, and date before scheduling a call.");
      return;
    }

    setError("");
    startTransition(async () => {
      try {
        await createScheduledCall({
          conversationId: selected.id,
          vendorBusinessId: selected.vendorId,
          title: callForm.title,
          callUrl: callForm.callUrl,
          startsAt: callForm.startsAt,
          durationMinutes: Number(callForm.durationMinutes) || 30,
        });
        setCallForm({ title: "Wedding consultation", callUrl: "", startsAt: "", durationMinutes: "30" });
        setShowCallForm(false);
        router.refresh();
      } catch (callError) {
        setError(callError instanceof Error ? callError.message : "Call could not be scheduled.");
      }
    });
  };

  const uploadAttachment = async (form: HTMLFormElement) => {
    if (!selected) return;
    const file = new FormData(form).get("file");
    if (!(file instanceof File) || !file.name) return;

    setAttachmentStatus("");
    setError("");
    startTransition(async () => {
      try {
        const bytesBase64 = await toBase64(file);
        await uploadFileAsset({
          ownerType: mode === "vendor" ? "VENDOR_BUSINESS" : "WEDDING",
          ownerId: mode === "vendor" ? selected.vendorId : selected.weddingId,
          purpose: "MISC",
          fileName: file.name,
          mimeType: file.type || "application/octet-stream",
          sizeBytes: file.size,
          bytesBase64,
          visibility: "WORKSPACE",
        });
        await sendMessage({
          conversationId: selected.id,
          body: `Shared file: ${file.name}`,
          senderRole: mode,
        });
        form.reset();
        setAttachmentStatus(`${file.name} uploaded and shared`);
        router.refresh();
      } catch (uploadError) {
        setError(uploadError instanceof Error ? uploadError.message : "Attachment could not be uploaded.");
      }
    });
  };

  if (!selected) {
    return (
      <div className="rounded-2xl border border-dashed border-[#e7dfd3] bg-white p-8 text-center text-[#6f6a61]">
        No conversations yet. Request a quote from the marketplace to start one.
      </div>
    );
  }

  return (
    <section className="grid min-h-[720px] overflow-hidden rounded-2xl border border-[#e7dfd3] bg-white luxury-shadow lg:grid-cols-[360px_1fr]">
      <aside className="border-b border-[#e7dfd3] bg-[#fbfaf8] p-4 lg:border-b-0 lg:border-r">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="font-display text-2xl font-semibold text-[#191714]">Inbox</p>
            <p className="mt-1 text-sm text-[#777065]">{conversations.length} active conversations</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="rounded-full bg-[#191714] px-3 py-1 text-xs font-semibold text-white">
              {unreadCount} unread
            </div>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setFilter("needs-reply")}
            className={`rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 ${filter === "needs-reply" ? "border-[#191714] bg-[#191714] text-white" : "border-[#e7dfd3] bg-white text-[#191714]"}`}
          >
            <p className="text-lg font-semibold">{needsReplyCount}</p>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] opacity-70">Reply</p>
          </button>
          <button
            type="button"
            onClick={() => setFilter("unread")}
            className={`rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 ${filter === "unread" ? "border-[#191714] bg-[#191714] text-white" : "border-[#e7dfd3] bg-white text-[#191714]"}`}
          >
            <p className="text-lg font-semibold">{unreadCount}</p>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] opacity-70">Unread</p>
          </button>
          <button
            type="button"
            onClick={() => setFilter("scheduled")}
            className={`rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 ${filter === "scheduled" ? "border-[#191714] bg-[#191714] text-white" : "border-[#e7dfd3] bg-white text-[#191714]"}`}
          >
            <p className="text-lg font-semibold">{scheduledCount}</p>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] opacity-70">Calls</p>
          </button>
        </div>

        <div className="mb-3 flex h-11 items-center gap-2 rounded-full border border-[#e7dfd3] bg-white px-3">
          <Search size={16} className="shrink-0 text-[#9a7a50]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search conversations"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#777065]"
          />
          {query ? (
            <button type="button" onClick={() => setQuery("")} aria-label="Clear conversation search">
              <X size={15} />
            </button>
          ) : null}
        </div>

        <div className="mb-4 grid grid-cols-4 gap-2">
          {(["all", "needs-reply", "unread", "scheduled"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={`h-9 rounded-full text-xs font-semibold capitalize ${filter === item ? "bg-[#191714] text-white" : "border border-[#e7dfd3] bg-white text-[#6f6a61]"}`}
            >
              {item === "needs-reply" ? "Reply" : item}
            </button>
          ))}
        </div>

        <div className="mb-4 lg:hidden">
          <select
            value={selected.id}
            onChange={(event) => setSelectedId(event.target.value)}
            className="h-11 w-full rounded-full border border-[#e7dfd3] bg-white px-4 text-sm font-semibold"
          >
            {filteredConversations.map((conversation) => (
              <option key={conversation.id} value={conversation.id}>
                {conversationTitle(mode, conversation)}
              </option>
            ))}
          </select>
        </div>

        <div className="hidden max-h-[560px] space-y-2 overflow-y-auto pr-1 lg:block">
          {filteredConversations.map((conversation) => {
            const active = conversation.id === selected.id;
            const unread = conversationUnread(mode, conversation);
            return (
              <button
                type="button"
                key={conversation.id}
                onClick={() => setSelectedId(conversation.id)}
                className={`w-full rounded-2xl p-4 text-left transition ${active ? "bg-white luxury-shadow" : "hover:bg-white"}`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#191714] text-sm font-bold text-white">
                    {initials(conversationTitle(mode, conversation))}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate font-semibold text-[#191714]">{conversationTitle(mode, conversation)}</p>
                      {unread ? <span className="rounded-full bg-[#c8a97e] px-2 py-0.5 text-xs font-bold text-[#191714]">{unread}</span> : null}
                    </div>
                    <p className="mt-1 truncate text-sm text-[#6f6a61]">{conversation.lastMessage ?? "No messages yet"}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-[#777065]">
                      {conversationNeedsReply(mode, conversation) ? <span className="rounded-full bg-[#fff4f3] px-2 py-1 text-[#93484d]">Needs reply</span> : null}
                      {conversationWaitingOnThem(mode, conversation) ? <span className="rounded-full bg-[#fbf5ec] px-2 py-1 text-[#8a6332]">Waiting</span> : null}
                      {conversation.stage ? <span className="rounded-full bg-[#f1ece4] px-2 py-1">{conversation.stage}</span> : null}
                      {conversation.lastMessageAt ? <span>{formatDate(conversation.lastMessageAt)}</span> : null}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
          {!filteredConversations.length ? (
            <div className="rounded-2xl border border-dashed border-[#e7dfd3] bg-white p-5 text-sm text-[#6f6a61]">
              No conversations match this view.
            </div>
          ) : null}
        </div>
      </aside>

      <div className="flex min-h-[580px] flex-col">
        <header className="border-b border-[#e7dfd3] bg-white p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-display text-2xl font-semibold text-[#191714]">{conversationTitle(mode, selected)}</p>
              <p className="mt-1 text-sm text-[#6f6a61]">
                {selected.serviceName ?? "Wedding inquiry"} {selected.stage ? `- ${selected.stage}` : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {conversationNeedsReply(mode, selected) ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#fff4f3] px-3 py-1 text-xs font-semibold text-[#93484d]">
                  <Clock3 size={13} />
                  Needs your reply
                </span>
              ) : null}
              {selected.stage ? <span className="rounded-full bg-[#fbf5ec] px-3 py-1 text-xs font-semibold text-[#7a582c]">{selected.stage}</span> : null}
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-[#eee7dd] bg-[#fffdf9] p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9a7a50]">Recommended next action</p>
                <p className="mt-1 text-sm leading-6 text-[#4b463d]">{nextAction(mode, selected)}</p>
              </div>
              {mode === "couple" && selected.stage === "Proposal Sent" ? (
                <a href="/compare" className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#191714] px-4 text-sm font-semibold text-white transition hover:-translate-y-0.5">
                  <CheckCircle2 size={15} />
                  Review quote
                </a>
              ) : null}
            </div>
          </div>

          {conversationCalls.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {conversationCalls.map((call) => (
                <div key={call.id} className="flex items-center gap-2 rounded-full border border-[#e7dfd3] bg-[#fffdf9] px-3 py-2 text-xs font-semibold text-[#6f6a61]">
                  <LinkIcon size={13} />
                  <a href={call.callUrl} target="_blank" rel="noreferrer" className="text-[#191714]">
                    {call.title} - {formatDate(call.startsAt)}
                  </a>
                  <button
                    type="button"
                    onClick={() =>
                      startTransition(async () => {
                        await deleteScheduledCall({ scheduledCallId: call.id });
                        router.refresh();
                      })
                    }
                    className="text-[#93484d]"
                    aria-label={`Delete call ${call.title}`}
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </header>

        {showCallForm ? (
          <div className="border-b border-[#e7dfd3] bg-[#fbfaf8] p-4">
            <div className="grid gap-3 lg:grid-cols-[1fr_1fr_190px_110px_auto]">
              <input
                value={callForm.title}
                onChange={(event) => setCallForm((form) => ({ ...form, title: event.target.value }))}
                placeholder="Call title"
                className="h-10 rounded-full border border-[#e7dfd3] bg-white px-3 text-sm outline-none focus:border-[#c8a97e]"
              />
              <input
                value={callForm.callUrl}
                onChange={(event) => setCallForm((form) => ({ ...form, callUrl: event.target.value }))}
                placeholder="Zoom or Google Meet URL"
                className="h-10 rounded-full border border-[#e7dfd3] bg-white px-3 text-sm outline-none focus:border-[#c8a97e]"
              />
              <input
                value={callForm.startsAt}
                onChange={(event) => setCallForm((form) => ({ ...form, startsAt: event.target.value }))}
                type="datetime-local"
                className="h-10 rounded-full border border-[#e7dfd3] bg-white px-3 text-sm outline-none focus:border-[#c8a97e]"
              />
              <input
                value={callForm.durationMinutes}
                onChange={(event) => setCallForm((form) => ({ ...form, durationMinutes: event.target.value }))}
                inputMode="numeric"
                aria-label="Duration in minutes"
                className="h-10 rounded-full border border-[#e7dfd3] bg-white px-3 text-sm outline-none focus:border-[#c8a97e]"
              />
              <button type="button" onClick={addCall} className="flex h-10 items-center justify-center gap-2 rounded-full bg-[#191714] px-4 text-sm font-semibold text-white">
                <Video size={16} />
                Add call
              </button>
            </div>
          </div>
        ) : null}

        {showAttachForm ? (
          <div className="border-b border-[#e7dfd3] bg-[#fbfaf8] p-4">
            <form
              className="flex flex-col gap-3 sm:flex-row sm:items-center"
              onSubmit={(event) => {
                event.preventDefault();
                void uploadAttachment(event.currentTarget);
              }}
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[#191714]">Share a file in this thread</p>
                <p className="mt-1 text-xs text-[#777065]">Stored against the {mode === "vendor" ? "vendor workspace" : "wedding workspace"} and posted to the conversation.</p>
              </div>
              <input name="file" type="file" className="max-w-full rounded-full border border-[#e7dfd3] bg-white px-3 py-2 text-sm" required />
              <button disabled={isPending} className="flex h-10 items-center justify-center gap-2 rounded-full bg-[#191714] px-4 text-sm font-semibold text-white disabled:opacity-60">
                <Upload size={16} />
                Upload
              </button>
            </form>
            {attachmentStatus ? <p className="mt-3 text-sm font-semibold text-[#61735f]">{attachmentStatus}</p> : null}
          </div>
        ) : null}

        <div className="flex-1 space-y-6 overflow-y-auto bg-[#fffdf9] p-4">
          {groupedMessages.map((group) => (
            <div key={group.day} className="space-y-4">
              <div className="flex justify-center">
                <span className="rounded-full border border-[#e7dfd3] bg-white px-3 py-1 text-xs font-semibold text-[#777065]">{group.day}</span>
              </div>
              {group.items.map((message) => {
                const tone = messageTone(message, mode);
                if (tone === "system") {
                  return (
                    <div key={message.id} className="flex justify-center">
                      <div className="max-w-[88%] rounded-full border border-[#e7dfd3] bg-white px-4 py-2 text-center text-sm text-[#6f6a61]">{message.body}</div>
                    </div>
                  );
                }

                return (
                  <div key={message.id} className={`flex ${tone === "mine" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[86%] rounded-2xl px-4 py-3 sm:max-w-[72%] ${tone === "mine" ? "bg-[#191714] text-white" : "border border-[#e7dfd3] bg-white text-[#191714]"}`}>
                      <p className="text-sm font-semibold opacity-80">{message.senderName}</p>
                      <p className="mt-1 whitespace-pre-wrap leading-6">{message.body}</p>
                      <p className="mt-2 text-xs opacity-65">
                        {timeFormatter.format(new Date(message.timestamp))}
                        {message.delivery === "sending" ? " - sending" : ""}
                        {message.delivery === "failed" ? " - failed" : ""}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <footer className="border-t border-[#e7dfd3] bg-white p-4">
          <div className="mb-3 rounded-2xl border border-[#eee7dd] bg-[#fffdf9] p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#9a7a50]">Quick replies</p>
            <div className="flex flex-wrap gap-2">
              {quickReplies(mode, selected).map((reply) => (
                <button
                  key={reply}
                  type="button"
                  onClick={() => setDraft(reply)}
                  className="rounded-full border border-[#e7dfd3] bg-white px-3 py-2 text-left text-xs font-semibold leading-5 text-[#6f6a61] transition hover:-translate-y-0.5 hover:border-[#c8a97e] hover:text-[#191714]"
                >
                  {reply.length > 70 ? `${reply.slice(0, 70)}...` : reply}
                </button>
              ))}
            </div>
          </div>
          <div className="mb-3 flex flex-wrap gap-2">
            {mode === "vendor" ? (
              <button type="button" onClick={() => void submit("Here is a quote summary attached in Wedding OS.")} className="flex h-9 items-center gap-2 rounded-full border border-[#e7dfd3] px-3 text-xs font-semibold text-[#6f6a61] transition hover:-translate-y-0.5">
                <FileText size={14} />
                Send Quote
              </button>
            ) : (
              <button type="button" onClick={() => setDraft("Can you send your package details, deposit terms, and what is included?")} className="flex h-9 items-center gap-2 rounded-full border border-[#e7dfd3] px-3 text-xs font-semibold text-[#6f6a61] transition hover:-translate-y-0.5">
                <FileText size={14} />
                Ask for details
              </button>
            )}
            <button type="button" onClick={() => setShowCallForm(true)} className="flex h-9 items-center gap-2 rounded-full border border-[#e7dfd3] px-3 text-xs font-semibold text-[#6f6a61] transition hover:-translate-y-0.5">
              <Video size={14} />
              Schedule Call
            </button>
            <button type="button" onClick={() => setShowAttachForm((value) => !value)} className="flex h-9 items-center gap-2 rounded-full border border-[#e7dfd3] px-3 text-xs font-semibold text-[#6f6a61] transition hover:-translate-y-0.5">
              <Paperclip size={14} />
              Attach
            </button>
            <button type="button" onClick={() => void submit(mode === "vendor" ? "The contract is ready to review in Wedding OS." : "Can you share the contract or next document we should review?")} className="flex h-9 items-center gap-2 rounded-full border border-[#e7dfd3] px-3 text-xs font-semibold text-[#6f6a61] transition hover:-translate-y-0.5">
              <CalendarPlus size={14} />
              {mode === "vendor" ? "Share Contract" : "Ask for contract"}
            </button>
          </div>
          {error ? <p className="mb-3 rounded-xl bg-[#f8eeee] px-3 py-2 text-sm font-medium text-[#93484d]">{error}</p> : null}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
            className="flex items-end gap-2"
          >
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  submit();
                }
              }}
              placeholder="Write a message..."
              rows={2}
              className="max-h-32 min-h-12 min-w-0 flex-1 resize-none rounded-2xl border border-[#e7dfd3] bg-[#fbfaf8] px-4 py-3 outline-none focus:border-[#c8a97e]"
            />
            <button
              disabled={isPending || !draft.trim()}
              className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#191714] text-white disabled:cursor-not-allowed disabled:bg-[#cfc7bb]"
              aria-label="Send message"
            >
              {isPending ? <Check size={18} /> : <Send size={18} />}
            </button>
          </form>
        </footer>
      </div>
    </section>
  );
}
