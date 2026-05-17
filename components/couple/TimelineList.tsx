"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowRight, CalendarClock, CheckCircle2, Circle, Clock3, Pencil, Plus, Save, Trash2, UsersRound, X, type LucideIcon } from "lucide-react";
import { applyTamilWeddingTemplate, completeTask as completeTaskAction, createTimelineTask, deleteTimelineTask, updateTimelineTask } from "@/app/actions";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatDate } from "@/lib/utils";
import type { CoreTimelineData, CoreTimelineTask } from "@/types/core";

const filters = ["All", "Open", "Completed"] as const;
const timelineTabs = ["Planning Tasks", "Tamil Ceremony Checklist", "Family Responsibilities", "Day-Of Schedule"] as const;
type TaskDraft = {
  title: string;
  group: string;
  dueDate: string;
  priority: string;
  eventId: string;
  categoryId: string;
};
type TaskFeatureResult = {
  feature: string;
  href: string;
  resultLabel: string;
  resultValue: string;
  detail: string;
  ready: boolean;
};

function taskToDraft(task: CoreTimelineTask): TaskDraft {
  return {
    title: task.title,
    group: task.group,
    dueDate: task.dueDate.slice(0, 10),
    priority: task.priority,
    eventId: task.eventId ?? "",
    categoryId: task.categoryId ?? "",
  };
}

function priorityBadgeClass(priority: string) {
  if (priority === "High") return "border-[#f0c9c9] bg-[#fff4f3] text-[#93484d]";
  if (priority === "Medium") return "border-[#ecd8b7] bg-[#fff8ea] text-[#8a6635]";
  return "border-[#d7ded0] bg-[#f3f8f0] text-[#61735f]";
}

function priorityBorderClass(priority: string) {
  if (priority === "High") return "border-l-[#93484d]";
  if (priority === "Medium") return "border-l-[#c8a97e]";
  return "border-l-[#61735f]";
}

function taskTimingClass(tone: "complete" | "overdue" | "soon" | "scheduled") {
  if (tone === "complete") return "border-[#d7ded0] bg-[#f3f8f0] text-[#61735f]";
  if (tone === "overdue") return "border-[#f0c9c9] bg-[#fff4f3] text-[#93484d]";
  if (tone === "soon") return "border-[#ecd8b7] bg-[#fff8ea] text-[#8a6635]";
  return "border-[#e7dfd3] bg-white text-[#6f6a61]";
}

function taskAction(task: CoreTimelineTask) {
  const text = [task.title, task.group, task.category, task.eventName, task.relatedVendorName].filter(Boolean).join(" ").toLowerCase();

  if (text.includes("rsvp") || text.includes("guest") || text.includes("invite") || text.includes("meal")) {
    return { label: "Open guests", href: "/rsvp" };
  }
  if (text.includes("seat") || text.includes("table")) {
    return { label: "Open seating", href: "/rsvp#seating" };
  }
  if (text.includes("budget") || text.includes("payment") || text.includes("deposit") || text.includes("invoice")) {
    return { label: "Open budget", href: "/budget" };
  }
  if (text.includes("contract") || text.includes("document") || text.includes("file") || text.includes("floor plan") || text.includes("menu")) {
    return { label: "Open documents", href: "/documents" };
  }
  if (text.includes("vendor") || text.includes("quote") || text.includes("proposal") || text.includes("book") || text.includes("photographer") || text.includes("cater")) {
    return { label: "Open vendors", href: task.relatedVendorName ? "/messages" : "/marketplace" };
  }
  if (text.includes("message") || text.includes("call") || text.includes("email")) {
    return { label: "Open messages", href: "/messages" };
  }
  if (text.includes("schedule") || text.includes("arrival") || text.includes("run sheet") || text.includes("day-of") || text.includes("timing")) {
    return { label: "Open run sheet", href: "/run-sheet" };
  }
  if (text.includes("venue") || text.includes("date") || text.includes("setup")) {
    return { label: "Open setup", href: "/onboarding" };
  }

  return { label: "Review task", href: "/timeline" };
}

function taskFeatureResult(task: CoreTimelineTask, data: CoreTimelineData): TaskFeatureResult {
  const action = taskAction(task);
  const text = [task.title, task.group, task.category, task.eventName, task.relatedVendorName].filter(Boolean).join(" ").toLowerCase();
  const summary = data.featureSummary;
  const isVendorBookingTask = text.includes("book") || text.includes("hire") || text.includes("confirm vendor") || text.includes("contract signed");
  const isVendorShortlistTask = text.includes("shortlist") || text.includes("options") || text.includes("compare") || text.includes("find vendor");

  if (action.href.startsWith("/rsvp#seating") || text.includes("seat") || text.includes("table")) {
    return {
      feature: "Seating",
      href: "/rsvp#seating",
      resultLabel: "Tables assigned",
      resultValue: `${summary.seatingAssignments} assignments`,
      detail: `${summary.seatingTables} tables exist. Confirm the relevant guests are seated before closing this task.`,
      ready: summary.seatingTables > 0 && summary.seatingAssignments > 0,
    };
  }

  if (action.href === "/rsvp" || text.includes("rsvp") || text.includes("guest") || text.includes("invite") || text.includes("meal")) {
    return {
      feature: "Guests",
      href: "/rsvp",
      resultLabel: "RSVP list built",
      resultValue: `${summary.guests} guests`,
      detail: `${summary.eventInvites} event invites are linked. Confirm the list, event invites, meals, and attendees are ready enough for this task.`,
      ready: summary.guests > 0,
    };
  }

  if (action.href === "/budget" || text.includes("budget") || text.includes("payment") || text.includes("deposit") || text.includes("invoice")) {
    return {
      feature: "Budget",
      href: "/budget",
      resultLabel: "Budget records",
      resultValue: `${summary.budgetItems} items`,
      detail: "Confirm the relevant budget items, invoices, deposits, or payment schedule rows are entered before completing this task.",
      ready: summary.budgetItems > 0,
    };
  }

  if (action.href === "/documents" || text.includes("contract") || text.includes("document") || text.includes("file") || text.includes("floor plan") || text.includes("menu")) {
    return {
      feature: "Documents",
      href: "/documents",
      resultLabel: "Documents uploaded",
      resultValue: `${summary.documents} files`,
      detail: "Confirm the needed contract, invoice, floor plan, menu, or checklist file is stored in Documents.",
      ready: summary.documents > 0,
    };
  }

  if (action.href === "/marketplace" || action.href === "/messages" || text.includes("vendor") || text.includes("quote") || text.includes("proposal") || text.includes("book")) {
    if (isVendorBookingTask) {
      return {
        feature: "Vendors & quotes",
        href: "/marketplace",
        resultLabel: "Booked vendors",
        resultValue: `${summary.bookedVendors} booked`,
        detail: "This is a booking task. Confirm the vendor is actually booked in Wedding OS before closing it.",
        ready: summary.bookedVendors > 0,
      };
    }

    if (isVendorShortlistTask) {
      return {
        feature: "Vendors & quotes",
        href: "/marketplace",
        resultLabel: "Vendor shortlist",
        resultValue: `${summary.savedVendors} saved / ${summary.comparisonItems} compared`,
        detail: `${summary.vendorNeeds} vendor needs are recorded. Confirm there is a real shortlist, saved vendor, comparison, or vendor need before closing this task.`,
        ready: summary.savedVendors > 0 || summary.comparisonItems > 0 || summary.vendorNeeds > 0,
      };
    }

    return {
      feature: "Vendors & quotes",
      href: action.href,
      resultLabel: "Vendor progress",
      resultValue: `${summary.inquiries} inquiries / ${summary.vendorQuotes} quotes / ${summary.bookedVendors} booked`,
      detail: "Confirm the relevant quote request, vendor message, proposal, or booking is in place before completing this task.",
      ready: summary.inquiries > 0 || summary.vendorQuotes > 0 || summary.bookedVendors > 0,
    };
  }

  if (action.href === "/run-sheet" || text.includes("schedule") || text.includes("arrival") || text.includes("run sheet") || text.includes("day-of") || text.includes("timing")) {
    return {
      feature: "Run sheets",
      href: "/run-sheet",
      resultLabel: "Execution details",
      resultValue: `${summary.runSheetBlocks} blocks / ${summary.responsibilities} owners`,
      detail: "Confirm timing blocks, owners, arrivals, and event execution notes are captured before completing this task.",
      ready: summary.runSheetBlocks > 0,
    };
  }

  if (action.href === "/onboarding" || text.includes("venue") || text.includes("date") || text.includes("setup")) {
    return {
      feature: "Wedding setup",
      href: "/onboarding",
      resultLabel: "Event setup",
      resultValue: `${summary.events} events`,
      detail: "Confirm the wedding details, venue/date assumptions, events, and planning settings are correct before closing this task.",
      ready: summary.events > 0,
    };
  }

  return {
    feature: "Timeline",
    href: "/timeline",
    resultLabel: "Planning task",
    resultValue: task.completed ? "Complete" : "Open",
    detail: "Confirm the real-world work behind this task is complete before closing it.",
    ready: true,
  };
}

export function TimelineList({ data }: { data: CoreTimelineData }) {
  const router = useRouter();
  const taskListRef = useRef<HTMLDivElement | null>(null);
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const [tab, setTab] = useState<(typeof timelineTabs)[number]>("Planning Tasks");
  const [newTask, setNewTask] = useState({
    title: "",
    group: "Custom",
    dueDate: "2026-06-30",
    priority: "Medium",
    eventId: "",
    categoryId: data.categories[0]?.id ?? "",
  });
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<TaskDraft | null>(null);
  const [selectedTask, setSelectedTask] = useState<CoreTimelineTask | null>(null);
  const [completingTask, setCompletingTask] = useState<CoreTimelineTask | null>(null);
  const tasks: CoreTimelineTask[] = data.tasks;
  const today = useMemo(() => {
    const value = new Date();
    value.setHours(0, 0, 0, 0);
    return value;
  }, []);

  const planningHealth = useMemo(() => {
    const hasCompletionEvidence = (task: CoreTimelineTask) => taskFeatureResult(task, data).ready;
    const needsReviewTasks = tasks.filter((task) => task.completed && !hasCompletionEvidence(task));
    const openTasks = tasks.filter((task) => !task.completed || !hasCompletionEvidence(task));
    const completedTasks = tasks.filter((task) => task.completed && hasCompletionEvidence(task));
    const overdueTasks = openTasks.filter((task) => new Date(task.dueDate) < today);
    const dueSoonTasks = openTasks.filter((task) => {
      const dueDate = new Date(task.dueDate);
      const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / 86_400_000);
      return daysUntilDue >= 0 && daysUntilDue <= 14;
    });
    const highPriorityOpenTasks = openTasks.filter((task) => task.priority === "High");
    const nextCriticalTasks = [...overdueTasks, ...dueSoonTasks, ...highPriorityOpenTasks]
      .filter((task, index, list) => list.findIndex((item) => item.id === task.id) === index)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 4);
    const responsibilitiesOpen = data.responsibilities.filter((item) => item.status !== "Done");
    const upcomingEvents = data.events
      .filter((event) => new Date(event.date) >= today)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return {
      openTasks,
      completedTasks,
      needsReviewTasks,
      overdueTasks,
      dueSoonTasks,
      highPriorityOpenTasks,
      nextCriticalTasks,
      responsibilitiesOpen,
      upcomingEvents,
      nextEvent: upcomingEvents[0],
      completionRate: tasks.length ? Math.round((completedTasks.length / tasks.length) * 100) : 0,
    };
  }, [data, tasks, today]);

  const focusTaskList = (nextFilter: (typeof filters)[number]) => {
    setFilter(nextFilter);
    setTab("Planning Tasks");
    taskListRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const toggleTask = async (task: CoreTimelineTask) => {
    await completeTaskAction({ taskId: task.id, completed: !task.completed });
    router.refresh();
  };

  const visibleTasks = tasks.filter((task) => {
    const hasCompletionEvidence = taskFeatureResult(task, data).ready;
    if (filter === "Completed" && (!task.completed || !hasCompletionEvidence)) return false;
    if (filter === "Open" && task.completed && hasCompletionEvidence) return false;
    if (categoryFilter !== "All" && task.categoryId !== categoryFilter) return false;
    if (priorityFilter !== "All" && task.priority !== priorityFilter) return false;
    return true;
  });

  const groups = Array.from(new Set(tasks.map((task) => task.group)));
  const saveDraft = async (taskId: string) => {
    if (!draft?.title.trim()) return;
    await updateTimelineTask({
      taskId,
      fields: {
        title: draft.title,
        group: draft.group,
        dueDate: draft.dueDate,
        priority: draft.priority,
        eventId: draft.eventId || null,
        categoryId: draft.categoryId || null,
      },
    });
    setEditingId(null);
    setDraft(null);
    router.refresh();
  };

  return (
    <section className="rounded-2xl border border-[#e7dfd3] bg-white p-5 luxury-shadow">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9a7a50]">Planning timeline</p>
          <h2 className="mt-1 font-display text-3xl font-semibold text-[#191714]">Know what to do next</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6f6a61]">
            Start with urgent tasks, then move into checklists, family owners, or event schedules when needed.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => router.push("/onboarding")}
            className="inline-flex h-10 items-center justify-center rounded-full border border-[#e7dfd3] bg-white px-4 text-sm font-semibold text-[#6f6a61] transition hover:-translate-y-0.5 hover:border-[#c8a97e]"
          >
            Setup guide
          </button>
          <button
            type="button"
            onClick={async () => {
              await applyTamilWeddingTemplate({});
              router.refresh();
            }}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-[#191714] px-4 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <CalendarClock size={16} />
            Apply Tamil template
          </button>
        </div>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <TimelineHealthButton label="Open" value={planningHealth.openTasks.length} detail="Tasks left" icon={Circle} tone="neutral" onClick={() => focusTaskList("Open")} />
        <TimelineHealthButton label="Overdue" value={planningHealth.overdueTasks.length} detail="Needs action" icon={AlertTriangle} tone="rose" onClick={() => focusTaskList("Open")} />
        <TimelineHealthButton label="Due soon" value={planningHealth.dueSoonTasks.length} detail="Next 14 days" icon={Clock3} tone="gold" onClick={() => focusTaskList("Open")} />
        <TimelineHealthButton label="Complete" value={planningHealth.completionRate} detail="Percent done" icon={CheckCircle2} tone="green" onClick={() => focusTaskList("Completed")} />
        <button
          type="button"
          onClick={() => router.push("/run-sheet")}
          className="rounded-2xl border border-[#eee7dd] bg-[#fffdf9] p-4 text-left transition hover:-translate-y-0.5 hover:border-[#c8a97e] hover:shadow-md"
        >
          <span className="flex size-9 items-center justify-center rounded-full bg-[#191714] text-white">
            <CalendarClock size={17} />
          </span>
          <span className="mt-3 block text-xs font-semibold uppercase tracking-[0.14em] text-[#8f7450]">Next event</span>
          <span className="mt-1 block truncate text-sm font-semibold text-[#191714]">{planningHealth.nextEvent?.name ?? "Not scheduled"}</span>
          <span className="mt-1 block text-xs text-[#6f6a61]">{planningHealth.nextEvent ? formatDate(planningHealth.nextEvent.date) : "Open run sheets"}</span>
        </button>
      </div>

      {planningHealth.nextCriticalTasks.length ? (
        <div className="mb-5 rounded-2xl border border-[#eadcc6] bg-[#fbf5ec] p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-[#191714]">Start here</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${priorityBadgeClass(planningHealth.nextCriticalTasks[0].priority)}`}>
                  {planningHealth.nextCriticalTasks[0].priority}
                </span>
                <p className="text-sm text-[#6f6a61]">{planningHealth.nextCriticalTasks[0].title}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setTab("Planning Tasks");
                  setFilter("Open");
                  setCategoryFilter(planningHealth.nextCriticalTasks[0].categoryId ?? "All");
                  taskListRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="inline-flex h-10 items-center justify-center rounded-full border border-[#e7dfd3] bg-white px-4 text-sm font-semibold text-[#6f6a61] transition hover:-translate-y-0.5"
              >
                Show task
              </button>
              <button
                type="button"
                onClick={() => router.push(taskAction(planningHealth.nextCriticalTasks[0]).href)}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#191714] px-4 text-sm font-semibold text-white transition hover:-translate-y-0.5"
              >
                {taskAction(planningHealth.nextCriticalTasks[0]).label}
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div ref={taskListRef} className="rounded-2xl border border-[#eee7dd] bg-[#fffdf9] p-4">
      <div className="mb-4 grid gap-2 md:grid-cols-4">
        {timelineTabs.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition hover:-translate-y-0.5 ${
              tab === item ? "border-[#191714] bg-[#191714] text-white" : "border-[#e7dfd3] bg-white text-[#6f6a61] hover:border-[#c8a97e]"
            }`}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="mb-5 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <p className="text-sm font-semibold text-[#191714]">
          {tab === "Planning Tasks" ? "Planning task list" : tab}
        </p>
        <div className="flex flex-wrap gap-2">
          {filters.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={`rounded-full px-3 py-2 text-sm font-semibold transition hover:-translate-y-0.5 ${filter === item ? "bg-[#191714] text-white" : "border border-[#e7dfd3] bg-white text-[#6f6a61]"}`}
            >
              {item}
            </button>
          ))}
          <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="h-10 cursor-pointer rounded-full border border-[#e7dfd3] bg-white px-3 text-sm font-semibold text-[#6f6a61]">
            <option value="All">All categories</option>
            {data.categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
          <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)} className="h-10 cursor-pointer rounded-full border border-[#e7dfd3] bg-white px-3 text-sm font-semibold text-[#6f6a61]">
            <option>All</option>
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
        </div>
      </div>
      {tab === "Family Responsibilities" ? (
        <div className="grid gap-3 md:grid-cols-2">
          {data.responsibilities.length ? (
            data.responsibilities.map((item) => (
              <article key={item.id} className="rounded-2xl border border-[#eee7dd] bg-[#fffdf9] p-4 transition hover:-translate-y-0.5 hover:border-[#c8a97e]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-[#191714]">{item.title}</p>
                    <p className="mt-1 text-sm text-[#6f6a61]">{item.eventName ?? "All events"} - due {formatDate(item.dueDate)}</p>
                    <p className="mt-2 text-sm text-[#6f6a61]">
                      {item.assignedName ? `Assigned to ${item.assignedName}` : "No owner assigned"}
                    </p>
                  </div>
                  <StatusBadge tone={item.status === "Done" ? "green" : item.status === "Blocked" ? "rose" : "gold"}>{item.status}</StatusBadge>
                </div>
              </article>
            ))
          ) : (
            <EmptyTimelineCard icon={UsersRound} title="No family responsibilities yet" body="Apply the Tamil wedding template or add responsibilities to coordinate family roles." />
          )}
        </div>
      ) : null}
      {tab === "Day-Of Schedule" ? (
        <div className="space-y-4">
          {data.events.map((event) => {
            const blocks = data.timelineBlocks.filter((block) => block.eventId === event.id);
            return (
              <article key={event.id} className="rounded-2xl border border-[#eee7dd] bg-[#fffdf9] p-4">
                <h3 className="font-display text-2xl font-semibold">{event.name}</h3>
                <p className="mt-1 text-sm text-[#6f6a61]">{formatDate(event.date)}{event.startTime ? ` - ${event.startTime}` : ""}</p>
                <div className="mt-4 space-y-3">
                  {blocks.length ? (
                    blocks.map((block) => (
                      <div key={block.id} className="grid gap-2 rounded-xl border border-[#eee7dd] bg-white p-3 md:grid-cols-[140px_1fr_180px]">
                        <p className="text-sm font-semibold text-[#9a7a50]">{new Date(block.startsAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</p>
                        <p className="font-semibold">{block.title}</p>
                        <p className="text-sm text-[#6f6a61]">{block.ownerName ?? block.location ?? "Unassigned"}</p>
                      </div>
                    ))
                  ) : (
                    <p className="rounded-xl border border-dashed border-[#e7dfd3] p-3 text-sm text-[#6f6a61]">No schedule blocks yet.</p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
      {tab === "Tamil Ceremony Checklist" ? (
        <div className="mb-5 rounded-2xl border border-[#eadcc6] bg-[#fbf5ec] p-4">
          <p className="text-sm font-semibold text-[#191714]">Tamil ceremony checklist view</p>
          <p className="mt-1 text-sm text-[#6f6a61]">Showing tasks grouped under Tamil ceremony and cultural preparation. Use the task list below to edit, complete, or add more items.</p>
        </div>
      ) : null}
      {tab !== "Family Responsibilities" && tab !== "Day-Of Schedule" ? (
      <>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          if (!newTask.title.trim()) return;
          await createTimelineTask({
            title: newTask.title,
            group: newTask.group,
            dueDate: newTask.dueDate,
            priority: newTask.priority,
            eventId: newTask.eventId || undefined,
            categoryId: newTask.categoryId || undefined,
          });
          setNewTask({ title: "", group: "Custom", dueDate: "2026-06-30", priority: "Medium", eventId: "", categoryId: data.categories[0]?.id ?? "" });
          router.refresh();
        }}
        className="mb-5 grid gap-3 rounded-2xl border border-[#eee7dd] bg-[#fffdf9] p-4 lg:grid-cols-[1fr_140px_150px_140px_150px_180px_auto]"
      >
        <input
          value={newTask.title}
          onChange={(event) => setNewTask((task) => ({ ...task, title: event.target.value }))}
          placeholder="New task"
          className="h-11 rounded-full border border-[#e7dfd3] bg-white px-4 text-sm outline-none focus:border-[#c8a97e]"
        />
        <input
          value={newTask.group}
          onChange={(event) => setNewTask((task) => ({ ...task, group: event.target.value }))}
          placeholder="Group"
          className="h-11 rounded-full border border-[#e7dfd3] bg-white px-4 text-sm outline-none focus:border-[#c8a97e]"
        />
        <input
          value={newTask.dueDate}
          onChange={(event) => setNewTask((task) => ({ ...task, dueDate: event.target.value }))}
          type="date"
          className="h-11 rounded-full border border-[#e7dfd3] bg-white px-4 text-sm outline-none focus:border-[#c8a97e]"
        />
        <select
          value={newTask.eventId}
          onChange={(event) => setNewTask((task) => ({ ...task, eventId: event.target.value }))}
          className="h-11 rounded-full border border-[#e7dfd3] bg-white px-3 text-sm font-semibold"
          aria-label="Related event"
        >
          <option value="">No event</option>
          {data.events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.name}
            </option>
          ))}
        </select>
        <select
          value={newTask.priority}
          onChange={(event) => setNewTask((task) => ({ ...task, priority: event.target.value }))}
          className={`h-11 rounded-full border px-3 text-sm font-semibold ${priorityBadgeClass(newTask.priority)}`}
        >
          <option>High</option>
          <option>Medium</option>
          <option>Low</option>
        </select>
        <select
          value={newTask.categoryId}
          onChange={(event) => setNewTask((task) => ({ ...task, categoryId: event.target.value }))}
          className="h-11 rounded-full border border-[#e7dfd3] bg-white px-3 text-sm font-semibold"
        >
          {data.categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <button className="flex h-11 items-center justify-center gap-2 rounded-full bg-[#191714] px-5 text-sm font-semibold text-white" aria-label="Add timeline task">
          <Plus size={16} />
          Add
        </button>
      </form>
      <div className="space-y-5">
        {groups.map((group) => {
          const groupTasks = visibleTasks.filter((task) => task.group === group);
          if (!groupTasks.length) return null;
          return (
            <div key={group}>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-[#9a7a50]">{group}</h3>
              <div className="grid gap-3">
                {groupTasks.map((task) => {
                  const editing = editingId === task.id && draft;
                  const action = taskAction(task);
                  const featureResult = taskFeatureResult(task, data);
                  const needsCompletionReview = task.completed && !featureResult.ready;
                  const dueDate = new Date(task.dueDate);
                  const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / 86_400_000);
                  const timingTone = needsCompletionReview ? "soon" : task.completed ? "complete" : daysUntilDue < 0 ? "overdue" : daysUntilDue <= 14 ? "soon" : "scheduled";
                  const timingLabel = needsCompletionReview ? "Needs review" : task.completed ? "Complete" : daysUntilDue < 0 ? "Overdue" : daysUntilDue <= 14 ? "Due soon" : "Scheduled";
                  return (
                    <article key={task.id} className={`rounded-2xl border border-l-4 border-[#eee7dd] bg-[#fffdf9] p-4 transition hover:border-[#c8a97e] hover:shadow-md ${priorityBorderClass(task.priority)}`}>
                      {editing ? (
                        <div className="grid gap-3 md:grid-cols-[1fr_140px_150px_130px_160px_180px_auto] md:items-center">
                          <input aria-label={`Task title ${task.title}`} value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} className="h-10 rounded-full border border-[#e7dfd3] bg-white px-3 text-sm" />
                          <input value={draft.group} onChange={(event) => setDraft({ ...draft, group: event.target.value })} className="h-10 rounded-full border border-[#e7dfd3] bg-white px-3 text-sm" />
                          <input value={draft.dueDate} onChange={(event) => setDraft({ ...draft, dueDate: event.target.value })} type="date" className="h-10 rounded-full border border-[#e7dfd3] bg-white px-3 text-sm" />
                          <select value={draft.eventId} onChange={(event) => setDraft({ ...draft, eventId: event.target.value })} className="h-10 rounded-full border border-[#e7dfd3] bg-white px-3 text-sm font-semibold">
                            <option value="">No event</option>
                            {data.events.map((event) => (
                              <option key={event.id} value={event.id}>
                                {event.name}
                              </option>
                            ))}
                          </select>
                          <select value={draft.priority} onChange={(event) => setDraft({ ...draft, priority: event.target.value })} className={`h-10 rounded-full border px-3 text-sm font-semibold ${priorityBadgeClass(draft.priority)}`}>
                            <option>High</option>
                            <option>Medium</option>
                            <option>Low</option>
                          </select>
                          <select value={draft.categoryId} onChange={(event) => setDraft({ ...draft, categoryId: event.target.value })} className="h-10 rounded-full border border-[#e7dfd3] bg-white px-3 text-sm font-semibold">
                            <option value="">No category</option>
                            {data.categories.map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.name}
                              </option>
                            ))}
                          </select>
                          <div className="flex gap-2">
                            <button onClick={() => void saveDraft(task.id)} className="flex size-10 items-center justify-center rounded-full bg-[#191714] text-white" aria-label={`Save ${task.title}`}>
                              <Save size={16} />
                            </button>
                            <button onClick={() => { setEditingId(null); setDraft(null); }} className="flex size-10 items-center justify-center rounded-full border border-[#e7dfd3]" aria-label="Cancel edit">
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="grid gap-4 xl:grid-cols-[1fr_340px] xl:items-center">
                          <button
                            type="button"
                            onClick={() => setSelectedTask(task)}
                            className="flex items-start gap-3 rounded-xl p-2 text-left transition hover:bg-[#fff4e4]"
                            aria-label={`Open action details for ${task.title}`}
                          >
                            <span className={`mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full border ${needsCompletionReview ? "border-[#ecd8b7] bg-[#fff8ea] text-[#8a6635]" : task.completed ? "border-[#d7ded0] bg-[#f3f8f0] text-[#61735f]" : "border-[#eadcc6] bg-white text-[#9a7a50]"}`}>
                              {needsCompletionReview ? <AlertTriangle size={18} /> : task.completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                            </span>
                            <span className="min-w-0">
                              <span className="block text-base font-semibold text-[#191714]">{task.title}</span>
                              <span className="mt-2 flex flex-wrap gap-2">
                                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${priorityBadgeClass(task.priority)}`}>{task.priority}</span>
                                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${taskTimingClass(timingTone)}`}>{timingLabel}</span>
                                <span className="rounded-full border border-[#e7dfd3] bg-white px-3 py-1 text-xs font-semibold text-[#6f6a61]">
                                  Due {formatDate(task.dueDate)}
                                </span>
                              </span>
                              <span className="mt-2 block text-sm text-[#6f6a61]">
                                {[task.category ?? "No category", task.eventName, task.relatedVendorName].filter(Boolean).join(" - ")}
                              </span>
                              <span className="mt-2 block text-xs font-semibold text-[#8f7450]">
                                Closes against {featureResult.feature}: {featureResult.resultValue}
                              </span>
                            </span>
                          </button>
                          <div className="flex flex-wrap justify-start gap-2 xl:justify-end">
                            <button
                              type="button"
                              onClick={() => (task.completed && featureResult.ready ? setSelectedTask(task) : router.push(featureResult.href))}
                              className={`inline-flex h-11 min-w-36 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold transition hover:-translate-y-0.5 ${
                                task.completed && featureResult.ready ? "border border-[#e7dfd3] bg-white text-[#6f6a61] hover:border-[#c8a97e]" : "bg-[#191714] text-white hover:shadow-lg"
                              }`}
                              aria-label={task.completed && featureResult.ready ? `Review ${task.title}` : `${action.label} for ${task.title}`}
                            >
                              {task.completed && featureResult.ready ? "Review" : action.label}
                              <ArrowRight size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (task.completed) {
                                  void toggleTask(task);
                                } else {
                                  setCompletingTask(task);
                                }
                              }}
                              className={`inline-flex h-11 items-center justify-center gap-2 rounded-full border px-4 text-sm font-semibold transition hover:-translate-y-0.5 ${taskTimingClass(task.completed ? "complete" : "scheduled")}`}
                              aria-label={task.completed ? `Mark ${task.title} open` : `Mark ${task.title} complete`}
                            >
                              {task.completed ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                              {task.completed ? "Reopen" : "Complete"}
                              </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(task.id);
                                setDraft(taskToDraft(task));
                              }}
                              className="flex size-11 items-center justify-center rounded-full border border-[#e7dfd3] bg-white text-[#6f6a61] transition hover:-translate-y-0.5 hover:border-[#c8a97e]"
                              aria-label={`Edit ${task.title}`}
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                await deleteTimelineTask({ taskId: task.id });
                                router.refresh();
                              }}
                              className="flex size-11 items-center justify-center rounded-full border border-[#e7dfd3] bg-white text-[#93484d] transition hover:-translate-y-0.5 hover:border-[#d78f8f]"
                              aria-label={`Delete ${task.title}`}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      </>
      ) : null}
      </div>
      {selectedTask ? (
        <TaskActionModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onAction={() => router.push(taskAction(selectedTask).href)}
          featureResult={taskFeatureResult(selectedTask, data)}
          onComplete={() => {
            setCompletingTask(selectedTask);
            setSelectedTask(null);
          }}
          onEdit={() => {
            setEditingId(selectedTask.id);
            setDraft(taskToDraft(selectedTask));
            setSelectedTask(null);
            taskListRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
          }}
        />
      ) : null}
      {completingTask ? (
        <TaskCompletionConfirmModal
          task={completingTask}
          featureResult={taskFeatureResult(completingTask, data)}
          onClose={() => setCompletingTask(null)}
          onAction={() => router.push(taskFeatureResult(completingTask, data).href)}
          onConfirm={async () => {
            await toggleTask(completingTask);
            setCompletingTask(null);
          }}
        />
      ) : null}
    </section>
  );
}

function TaskActionModal({
  task,
  onClose,
  onAction,
  onComplete,
  onEdit,
  featureResult,
}: {
  task: CoreTimelineTask;
  onClose: () => void;
  onAction: () => void;
  onComplete: () => void | Promise<void>;
  onEdit: () => void;
  featureResult: TaskFeatureResult;
}) {
  const action = taskAction(task);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#191714]/55 p-4 backdrop-blur-sm" onMouseDown={onClose}>
      <div
        className="w-full max-w-2xl rounded-3xl border border-[#e7dfd3] bg-white p-6 shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9a7a50]">Task details</p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-[#191714]">{task.title}</h2>
            <p className="mt-2 text-sm leading-6 text-[#6f6a61]">
              Review what this task is connected to, then choose whether to open the right workspace or mark it complete.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[#e7dfd3] text-[#6f6a61] transition hover:-translate-y-0.5 hover:border-[#c8a97e]"
            aria-label="Close task details"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-[#eee7dd] bg-[#fffdf9] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8f7450]">Due date</p>
            <p className="mt-2 font-semibold text-[#191714]">{formatDate(task.dueDate)}</p>
          </div>
          <div className="rounded-2xl border border-[#eee7dd] bg-[#fffdf9] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8f7450]">Priority</p>
            <span className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${priorityBadgeClass(task.priority)}`}>
              {task.priority}
            </span>
          </div>
          <div className="rounded-2xl border border-[#eee7dd] bg-[#fffdf9] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8f7450]">Category</p>
            <p className="mt-2 font-semibold text-[#191714]">{task.category ?? "No category"}</p>
          </div>
          <div className="rounded-2xl border border-[#eee7dd] bg-[#fffdf9] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8f7450]">Event / vendor</p>
            <p className="mt-2 font-semibold text-[#191714]">
              {[task.eventName, task.relatedVendorName].filter(Boolean).join(" - ") || "Not linked"}
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-[#eadcc6] bg-[#fbf5ec] p-4">
          <p className="text-sm font-semibold text-[#191714]">Recommended next step</p>
          <p className="mt-1 text-sm leading-6 text-[#6f6a61]">
            Open the related workspace to complete the action, then return here and mark the task complete when the work is actually done.
          </p>
        </div>
        <div className={`mt-3 rounded-2xl border p-4 ${featureResult.ready ? "border-[#d7ded0] bg-[#f3f8f0]" : "border-[#ecd8b7] bg-[#fff8ea]"}`}>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8f7450]">Completion result</p>
          <p className="mt-2 font-semibold text-[#191714]">{featureResult.resultLabel}: {featureResult.resultValue}</p>
          <p className="mt-1 text-sm leading-6 text-[#6f6a61]">{featureResult.detail}</p>
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#e7dfd3] bg-white px-5 text-sm font-semibold text-[#6f6a61] transition hover:-translate-y-0.5 hover:border-[#c8a97e]"
          >
            <Pencil size={16} />
            Edit task
          </button>
          <button
            type="button"
            onClick={() => void onComplete()}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#d7ded0] bg-[#f3f8f0] px-5 text-sm font-semibold text-[#61735f] transition hover:-translate-y-0.5"
          >
            {task.completed ? <Circle size={16} /> : <CheckCircle2 size={16} />}
            {task.completed ? "Mark open" : "Mark complete"}
          </button>
          <button
            type="button"
            onClick={onAction}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#191714] px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            {action.label}
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function TaskCompletionConfirmModal({
  task,
  featureResult,
  onClose,
  onAction,
  onConfirm,
}: {
  task: CoreTimelineTask;
  featureResult: TaskFeatureResult;
  onClose: () => void;
  onAction: () => void;
  onConfirm: () => void | Promise<void>;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#191714]/55 p-4 backdrop-blur-sm" onMouseDown={onClose}>
      <div
        className="w-full max-w-xl rounded-3xl border border-[#e7dfd3] bg-white p-6 shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9a7a50]">Confirm completion</p>
        <h2 className="mt-2 font-display text-3xl font-semibold text-[#191714]">{task.title}</h2>
        <p className="mt-2 text-sm leading-6 text-[#6f6a61]">
          This task is tied to <span className="font-semibold text-[#191714]">{featureResult.feature}</span>. Confirm the linked work is actually done before closing the priority item.
        </p>

        <div className={`mt-5 rounded-2xl border p-4 ${featureResult.ready ? "border-[#d7ded0] bg-[#f3f8f0]" : "border-[#ecd8b7] bg-[#fff8ea]"}`}>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8f7450]">Current feature result</p>
          <p className="mt-2 text-xl font-semibold text-[#191714]">{featureResult.resultValue}</p>
          <p className="mt-1 text-sm font-semibold text-[#191714]">{featureResult.resultLabel}</p>
          <p className="mt-2 text-sm leading-6 text-[#6f6a61]">{featureResult.detail}</p>
        </div>

        {!featureResult.ready ? (
          <p className="mt-3 rounded-2xl border border-[#ecd8b7] bg-[#fff8ea] p-3 text-sm font-semibold text-[#8a6635]">
            Wedding OS does not see strong evidence for this feature yet. You can still mark it complete if the work was done outside the platform, but opening the feature first is recommended.
          </p>
        ) : null}

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-full border border-[#e7dfd3] bg-white px-5 text-sm font-semibold text-[#6f6a61] transition hover:-translate-y-0.5 hover:border-[#c8a97e]"
          >
            Keep open
          </button>
          <button
            type="button"
            onClick={onAction}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#e7dfd3] bg-white px-5 text-sm font-semibold text-[#6f6a61] transition hover:-translate-y-0.5 hover:border-[#c8a97e]"
          >
            Open {featureResult.feature}
            <ArrowRight size={16} />
          </button>
          <button
            type="button"
            onClick={() => void onConfirm()}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#191714] px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <CheckCircle2 size={16} />
            Yes, mark complete
          </button>
        </div>
      </div>
    </div>
  );
}

function TimelineHealthButton({
  label,
  value,
  detail,
  icon: Icon,
  tone,
  onClick,
}: {
  label: string;
  value: number;
  detail: string;
  icon: LucideIcon;
  tone: "ink" | "green" | "gold" | "rose" | "neutral";
  onClick: () => void;
}) {
  const toneClasses = {
    ink: "bg-[#191714] text-white",
    green: "bg-[#eef7eb] text-[#61735f]",
    gold: "bg-[#fff8ea] text-[#8a6635]",
    rose: "bg-[#fff4f3] text-[#93484d]",
    neutral: "bg-[#faf7f1] text-[#6f6a61]",
  }[tone];

  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl border border-[#eee7dd] bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-[#c8a97e] hover:shadow-md"
    >
      <span className={`flex size-10 items-center justify-center rounded-full ${toneClasses}`}>
        <Icon size={18} />
      </span>
      <span className="mt-3 block text-xs font-semibold uppercase tracking-[0.14em] text-[#8f7450]">{label}</span>
      <span className="mt-1 block text-3xl font-semibold text-[#191714]">{value}</span>
      <span className="mt-1 block text-xs text-[#6f6a61]">{detail}</span>
    </button>
  );
}

function EmptyTimelineCard({ icon: Icon, title, body }: { icon: LucideIcon; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#e7dfd3] bg-[#fffdf9] p-5">
      <Icon className="text-[#9a7a50]" size={22} />
      <p className="mt-3 font-semibold text-[#191714]">{title}</p>
      <p className="mt-1 text-sm leading-6 text-[#6f6a61]">{body}</p>
    </div>
  );
}
