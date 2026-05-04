"use client";

import { useMemo, useState } from "react";
import { CalendarPlus, FileText, Send, Video } from "lucide-react";
import { initials } from "@/lib/utils";
import { useWeddingStore } from "@/store/useWeddingStore";

export function MessageHub({ mode }: { mode: "couple" | "vendor" }) {
  const conversations = useWeddingStore((state) => state.conversations);
  const messages = useWeddingStore((state) => state.messages);
  const sendMessage = useWeddingStore((state) => state.sendMessage);
  const [selectedId, setSelectedId] = useState(conversations[0]?.id ?? "");
  const [draft, setDraft] = useState("");

  const selected = conversations.find((item) => item.id === selectedId) ?? conversations[0];
  const conversationMessages = useMemo(
    () => messages.filter((message) => message.conversationId === selected?.id),
    [messages, selected?.id],
  );

  const submit = (text = draft) => {
    if (!selected || !text.trim()) return;
    sendMessage(selected.id, text, mode);
    setDraft("");
  };

  if (!selected) {
    return (
      <div className="rounded-2xl border border-dashed border-[#e7dfd3] bg-white p-8 text-center text-[#6f6a61]">
        No conversations yet. Request a quote from the marketplace to start one.
      </div>
    );
  }

  return (
    <section className="grid min-h-[680px] overflow-hidden rounded-2xl border border-[#e7dfd3] bg-white luxury-shadow lg:grid-cols-[340px_1fr]">
      <aside className="border-b border-[#e7dfd3] bg-[#fbfaf8] p-4 lg:border-b-0 lg:border-r">
        <div className="mb-4 lg:hidden">
          <select
            value={selected.id}
            onChange={(event) => setSelectedId(event.target.value)}
            className="h-11 w-full rounded-full border border-[#e7dfd3] bg-white px-4 text-sm font-semibold"
          >
            {conversations.map((conversation) => (
              <option key={conversation.id} value={conversation.id}>
                {mode === "vendor" ? conversation.coupleName : conversation.vendorName}
              </option>
            ))}
          </select>
        </div>
        <div className="hidden space-y-2 lg:block">
          {conversations.map((conversation) => {
            const last = [...messages].reverse().find((message) => message.conversationId === conversation.id);
            const active = conversation.id === selected.id;
            return (
              <button
                type="button"
                key={conversation.id}
                onClick={() => setSelectedId(conversation.id)}
                className={`w-full rounded-2xl p-4 text-left transition ${active ? "bg-white luxury-shadow" : "hover:bg-white"}`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#191714] text-sm font-bold text-white">
                    {initials(mode === "vendor" ? conversation.coupleName : conversation.vendorName)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{mode === "vendor" ? conversation.coupleName : conversation.vendorName}</p>
                    <p className="mt-1 truncate text-sm text-[#6f6a61]">{last?.body ?? "No messages yet"}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      <div className="flex min-h-[560px] flex-col">
        <header className="border-b border-[#e7dfd3] p-4">
          <p className="font-semibold">{mode === "vendor" ? selected.coupleName : selected.vendorName}</p>
          <p className="mt-1 text-sm text-[#6f6a61]">
            Shared conversation - {mode === "vendor" ? "vendor view" : "couple view"}
          </p>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto bg-[#fffdf9] p-4">
          {conversationMessages.map((message) => {
            const isMine = message.sender === mode;
            return (
              <div key={message.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[82%] rounded-2xl px-4 py-3 ${isMine ? "bg-[#191714] text-white" : "border border-[#e7dfd3] bg-white text-[#191714]"}`}>
                  <p className="text-sm font-semibold opacity-80">{message.senderName}</p>
                  <p className="mt-1 leading-6">{message.body}</p>
                  <p className="mt-2 text-xs opacity-65">
                    {new Intl.DateTimeFormat("en-CA", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(message.timestamp))}
                  </p>
                </div>
              </div>
            );
          })}
          <div className="text-sm font-medium text-[#9a7a50]">Typing indicator - Wedding OS syncs this conversation across both portals</div>
        </div>

        <footer className="border-t border-[#e7dfd3] bg-white p-4">
          <div className="mb-3 flex flex-wrap gap-2">
            <button onClick={() => submit("Here is a quote summary attached in Wedding OS.")} className="flex h-9 items-center gap-2 rounded-full border border-[#e7dfd3] px-3 text-xs font-semibold text-[#6f6a61]">
              <FileText size={14} />
              Send Quote
            </button>
            <button onClick={() => submit("I added a video consultation link for this week.")} className="flex h-9 items-center gap-2 rounded-full border border-[#e7dfd3] px-3 text-xs font-semibold text-[#6f6a61]">
              <Video size={14} />
              Schedule Call
            </button>
            <button onClick={() => submit("The contract is ready to review in Wedding OS.")} className="flex h-9 items-center gap-2 rounded-full border border-[#e7dfd3] px-3 text-xs font-semibold text-[#6f6a61]">
              <CalendarPlus size={14} />
              Share Contract
            </button>
          </div>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
            className="flex gap-2"
          >
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Write a message..."
              className="min-w-0 flex-1 rounded-full border border-[#e7dfd3] bg-[#fbfaf8] px-4 py-3 outline-none focus:border-[#c8a97e]"
            />
            <button className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#191714] text-white" aria-label="Send message">
              <Send size={18} />
            </button>
          </form>
        </footer>
      </div>
    </section>
  );
}
