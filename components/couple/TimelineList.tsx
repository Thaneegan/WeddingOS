"use client";

import { useState } from "react";
import { CheckCircle2, Circle, Filter } from "lucide-react";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatDate } from "@/lib/utils";
import { useWeddingStore } from "@/store/useWeddingStore";

const filters = ["All", "Open", "Completed"] as const;

export function TimelineList() {
  const tasks = useWeddingStore((state) => state.tasks);
  const vendors = useWeddingStore((state) => state.vendors);
  const completeTask = useWeddingStore((state) => state.completeTask);
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");

  const visibleTasks = tasks.filter((task) => {
    if (filter === "Completed") return task.completed;
    if (filter === "Open") return !task.completed;
    return true;
  });

  const groups = Array.from(new Set(tasks.map((task) => task.group)));

  return (
    <section className="rounded-2xl border border-[#e7dfd3] bg-white p-5 luxury-shadow">
      <SectionHeader
        title="Wedding timeline"
        description="A planning timeline connected to vendors, due dates, and completion status."
        action={
          <div className="flex items-center gap-2">
            <Filter size={17} className="text-[#9a7a50]" />
            {filters.map((item) => (
              <button
                key={item}
                onClick={() => setFilter(item)}
                className={`rounded-full px-3 py-2 text-sm font-semibold ${filter === item ? "bg-[#191714] text-white" : "border border-[#e7dfd3] text-[#6f6a61]"}`}
              >
                {item}
              </button>
            ))}
          </div>
        }
      />
      <div className="space-y-5">
        {groups.map((group) => {
          const groupTasks = visibleTasks.filter((task) => task.group === group);
          if (!groupTasks.length) return null;
          return (
            <div key={group}>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-[#9a7a50]">{group}</h3>
              <div className="grid gap-3">
                {groupTasks.map((task) => {
                  const vendor = vendors.find((item) => item.id === task.relatedVendorId);
                  return (
                    <article key={task.id} className="grid gap-3 rounded-2xl border border-[#eee7dd] bg-[#fffdf9] p-4 md:grid-cols-[1fr_150px_120px_120px] md:items-center">
                      <button onClick={() => completeTask(task.id)} className="flex items-start gap-3 text-left">
                        {task.completed ? <CheckCircle2 className="mt-0.5 text-[#61735f]" size={20} /> : <Circle className="mt-0.5 text-[#c8a97e]" size={20} />}
                        <span>
                          <span className="font-semibold">{task.title}</span>
                          {vendor ? <span className="mt-1 block text-sm text-[#6f6a61]">{vendor.name}</span> : null}
                        </span>
                      </button>
                      <p className="text-sm text-[#6f6a61]">{formatDate(task.dueDate)}</p>
                      <StatusBadge tone={task.priority === "High" ? "rose" : task.priority === "Medium" ? "gold" : "neutral"}>{task.priority}</StatusBadge>
                      <StatusBadge tone={task.completed ? "green" : "neutral"}>{task.completed ? "Done" : "Open"}</StatusBadge>
                    </article>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
