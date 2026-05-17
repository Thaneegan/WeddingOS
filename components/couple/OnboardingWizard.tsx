"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CalendarDays, Check, CircleDollarSign, MapPin, Settings2, Store, UsersRound } from "lucide-react";
import { completeCoupleOnboarding } from "@/app/actions";
import { formatCurrency } from "@/lib/utils";

type VendorCategoryOption = {
  id: string;
  name: string;
};

type InitialWedding = {
  coupleNames: string;
  weddingDate: string;
  location: string;
  style: string;
  budget: number;
  guestCount: number;
};

type OnboardingForm = InitialWedding & {
  venueName: string;
  venueStatus: string;
  ceremonyDate: string;
  receptionDate: string;
  eventTypes: string[];
  vendorCategoryIds: string[];
  priorities: string[];
  settings: {
    culturalEvents: boolean;
    familyCollaborators: boolean;
    publicRsvp: boolean;
    vendorPitches: boolean;
  };
};

const steps = [
  { label: "Wedding", icon: CalendarDays },
  { label: "Venue", icon: MapPin },
  { label: "Vendors", icon: Store },
  { label: "Guests", icon: UsersRound },
  { label: "Settings", icon: Settings2 },
];

const priorityOptions = [
  "Find venue options",
  "Book photo and video",
  "Confirm catering direction",
  "Build RSVP list",
  "Create day-of schedule",
  "Set family review milestones",
];

const tamilEventOptions = [
  { type: "ENGAGEMENT", label: "Engagement / pre-wedding" },
  { type: "NALANGU", label: "Nalangu or family ceremony" },
  { type: "MEHNDI_SANGEET", label: "Mehndi / Sangeet" },
  { type: "CEREMONY", label: "Wedding ceremony" },
  { type: "RECEPTION", label: "Reception" },
  { type: "FAMILY_MEAL", label: "Post-wedding family meal" },
];

const inputClass =
  "w-full rounded-full border border-[#e0d5c7] bg-white px-5 py-3 text-sm text-[#191714] outline-none transition placeholder:text-[#9b9388] hover:border-[#c8a97e] focus:border-[#191714] focus:ring-4 focus:ring-[#c8a97e]/15";

export function OnboardingWizard({
  initialWedding,
  vendorCategories,
  initialVendorCategoryIds,
  initialEventTypes,
}: {
  initialWedding: InitialWedding;
  vendorCategories: VendorCategoryOption[];
  initialVendorCategoryIds?: string[];
  initialEventTypes?: string[];
}) {
  const router = useRouter();
  const defaultVendorCategoryIds = useMemo(() => {
    if (initialVendorCategoryIds?.length) {
      const validIds = new Set(vendorCategories.map((category) => category.id));
      return initialVendorCategoryIds.filter((id) => validIds.has(id));
    }

    const starterNames = new Set(["Venues", "Photography", "Videography", "Catering", "Decor"]);
    const starterIds = vendorCategories.filter((category) => starterNames.has(category.name)).map((category) => category.id);
    return starterIds.length ? starterIds : vendorCategories.slice(0, 5).map((category) => category.id);
  }, [initialVendorCategoryIds, vendorCategories]);
  const [isSaving, setIsSaving] = useState(false);
  const [slowSave, setSlowSave] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [form, setForm] = useState<OnboardingForm>({
    ...initialWedding,
    venueName: "",
    venueStatus: "Still searching",
    ceremonyDate: initialWedding.weddingDate,
    receptionDate: initialWedding.weddingDate,
    eventTypes: initialEventTypes?.length ? initialEventTypes : tamilEventOptions.map((event) => event.type),
    vendorCategoryIds: defaultVendorCategoryIds,
    priorities: ["Find venue options", "Book photo and video", "Build RSVP list"],
    settings: {
      culturalEvents: true,
      familyCollaborators: true,
      publicRsvp: true,
      vendorPitches: true,
    },
  });

  const progress = ((step + 1) / steps.length) * 100;
  const selectedVendorNames = useMemo(
    () => vendorCategories.filter((category) => form.vendorCategoryIds.includes(category.id)).map((category) => category.name),
    [form.vendorCategoryIds, vendorCategories],
  );

  const update = <K extends keyof OnboardingForm>(key: K, value: OnboardingForm[K]) => {
    setError("");
    setForm((current) => ({ ...current, [key]: value }));
  };

  const toggleVendorCategory = (id: string) => {
    setError("");
    setForm((current) => ({
      ...current,
      vendorCategoryIds: current.vendorCategoryIds.includes(id)
        ? current.vendorCategoryIds.filter((categoryId) => categoryId !== id)
        : [...current.vendorCategoryIds, id],
    }));
  };

  const togglePriority = (value: string) => {
    setError("");
    setForm((current) => ({
      ...current,
      priorities: current.priorities.includes(value) ? current.priorities.filter((item) => item !== value) : [...current.priorities, value],
    }));
  };

  const toggleEventType = (value: string) => {
    setError("");
    setForm((current) => ({
      ...current,
      eventTypes: current.eventTypes.includes(value) ? current.eventTypes.filter((item) => item !== value) : [...current.eventTypes, value],
    }));
  };

  const canContinue =
    step === 0
      ? Boolean(form.coupleNames.trim() && form.weddingDate && form.location.trim() && form.style.trim())
      : step === 1
        ? Boolean(form.ceremonyDate && form.receptionDate && form.eventTypes.includes("CEREMONY"))
        : step === 2
          ? form.vendorCategoryIds.length > 0
          : step === 3
            ? form.guestCount > 0 && form.budget > 0
            : true;

  const next = () => {
    if (!canContinue) {
      setError("Complete the required fields on this step before continuing.");
      return;
    }
    setStep((current) => Math.min(current + 1, steps.length - 1));
  };

  const submit = () => {
    if (!canContinue) {
      setError("Complete the required fields before saving setup.");
      return;
    }
    setError("");
    setSlowSave(false);
    setIsSaving(true);
    const slowTimer = window.setTimeout(() => setSlowSave(true), 6000);

    completeCoupleOnboarding({
      coupleNames: form.coupleNames.trim(),
      weddingDate: form.weddingDate,
      location: form.location.trim(),
      style: form.style.trim(),
      budget: Number(form.budget),
      guestCount: Number(form.guestCount),
      venueName: form.venueName.trim() || undefined,
      venueStatus: form.venueStatus,
      ceremonyDate: form.ceremonyDate,
      receptionDate: form.receptionDate,
      eventTypes: form.eventTypes,
      vendorCategoryIds: form.vendorCategoryIds,
      priorities: form.priorities,
      settings: form.settings,
    })
      .then(() => {
        window.clearTimeout(slowTimer);
        router.replace("/dashboard");
      })
      .catch((submitError) => {
        window.clearTimeout(slowTimer);
        setIsSaving(false);
        setSlowSave(false);
        setError(submitError instanceof Error ? submitError.message : "Wedding setup could not be saved.");
      });
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="rounded-3xl border border-[#e7dfd3] bg-white p-5 luxury-shadow sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9a7a50]">Wedding setup</p>
            <h1 className="mt-2 font-display text-4xl font-semibold text-[#191714]">Build your planning workspace</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6f6a61]">
              Answer a few questions so Wedding OS can organize your budget, timeline, vendor needs, and planning settings around your actual wedding.
            </p>
          </div>
          <div className="rounded-2xl bg-[#fbf5ec] px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9a7a50]">Setup progress</p>
            <p className="mt-1 text-2xl font-semibold">{step + 1} of {steps.length}</p>
          </div>
        </div>

        <div className="mt-7">
          <div className="h-2 overflow-hidden rounded-full bg-[#eee7dd]">
            <div className="h-full rounded-full bg-[#191714] transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-5">
            {steps.map((item, index) => {
              const Icon = item.icon;
              const active = index === step;
              const done = index < step;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setStep(index)}
                  className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition ${
                    active || done ? "border-[#191714] bg-[#191714] text-white" : "border-[#e7dfd3] bg-white text-[#6f6a61] hover:border-[#c8a97e]"
                  }`}
                >
                  {done ? <Check size={15} /> : <Icon size={15} />}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-[#e7dfd3] bg-white p-5 luxury-shadow sm:p-7">
        {step === 0 ? (
          <div className="grid gap-5 lg:grid-cols-2">
            <Field label="Couple names" required>
              <input value={form.coupleNames} onChange={(event) => update("coupleNames", event.target.value)} className={inputClass} />
            </Field>
            <Field label="Wedding date" required>
              <input type="date" value={form.weddingDate} onChange={(event) => update("weddingDate", event.target.value)} className={inputClass} />
            </Field>
            <Field label="City and region" required>
              <input value={form.location} onChange={(event) => update("location", event.target.value)} className={inputClass} />
            </Field>
            <Field label="Wedding style" required>
              <input value={form.style} onChange={(event) => update("style", event.target.value)} className={inputClass} placeholder="Modern luxury, Tamil fusion, garden reception..." />
            </Field>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="grid gap-5 lg:grid-cols-2">
            <Field label="Venue name">
              <input value={form.venueName} onChange={(event) => update("venueName", event.target.value)} className={inputClass} placeholder="Venue booked or top choice" />
            </Field>
            <Field label="Venue status" required>
              <select value={form.venueStatus} onChange={(event) => update("venueStatus", event.target.value)} className={`${inputClass} cursor-pointer`}>
                <option>Still searching</option>
                <option>Shortlisted</option>
                <option>Soft hold</option>
                <option>Booked</option>
              </select>
            </Field>
            <Field label="Ceremony date" required>
              <input type="date" value={form.ceremonyDate} onChange={(event) => update("ceremonyDate", event.target.value)} className={inputClass} />
            </Field>
            <Field label="Reception date" required>
              <input type="date" value={form.receptionDate} onChange={(event) => update("receptionDate", event.target.value)} className={inputClass} />
            </Field>
            <div className="lg:col-span-2">
              <p className="text-sm font-semibold text-[#191714]">Event structure</p>
              <p className="mt-1 text-sm leading-6 text-[#6f6a61]">Select the Tamil/South Asian events you want Wedding OS to plan across budget, guests, vendors, and day-of execution.</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {tamilEventOptions.map((event) => {
                  const active = form.eventTypes.includes(event.type);
                  const locked = event.type === "CEREMONY";
                  return (
                    <button
                      key={event.type}
                      type="button"
                      onClick={() => (locked ? undefined : toggleEventType(event.type))}
                      className={`flex cursor-pointer items-center justify-between rounded-2xl border p-4 text-left text-sm font-semibold transition ${
                        active ? "border-[#191714] bg-[#191714] text-white" : "border-[#e7dfd3] bg-white text-[#191714] hover:border-[#c8a97e] hover:bg-[#fbf5ec]"
                      } ${locked ? "opacity-95" : ""}`}
                    >
                      <span>{event.label}</span>
                      {active ? <Check size={17} /> : <span className="text-[#9a7a50]">Add</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-5">
            <div>
              <h2 className="font-display text-3xl font-semibold">Which vendors do you need?</h2>
              <p className="mt-2 text-sm leading-6 text-[#6f6a61]">Select the services you want to book. Wedding OS will use this to create vendor needs and planning tasks.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {vendorCategories.map((category) => {
                const active = form.vendorCategoryIds.includes(category.id);
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => toggleVendorCategory(category.id)}
                    className={`flex cursor-pointer items-center justify-between rounded-2xl border p-4 text-left transition ${
                      active ? "border-[#191714] bg-[#191714] text-white" : "border-[#e7dfd3] bg-white text-[#191714] hover:border-[#c8a97e] hover:bg-[#fbf5ec]"
                    }`}
                  >
                    <span className="font-semibold">{category.name}</span>
                    {active ? <Check size={18} /> : <span className="text-sm text-[#9a7a50]">Add</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="grid gap-5 lg:grid-cols-2">
            <Field label="Expected guests" required>
              <input type="number" min={1} value={form.guestCount} onChange={(event) => update("guestCount", Number(event.target.value))} className={inputClass} />
            </Field>
            <Field label="Total budget" required>
              <div className="relative">
                <CircleDollarSign className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9a7a50]" size={18} />
                <input type="number" min={1} value={form.budget} onChange={(event) => update("budget", Number(event.target.value))} className={`${inputClass} pl-11`} />
              </div>
            </Field>
            <div className="rounded-2xl bg-[#fbf5ec] p-5 lg:col-span-2">
              <p className="text-sm font-semibold text-[#6f6a61]">Planning baseline</p>
              <p className="mt-2 font-display text-3xl font-semibold">{formatCurrency(Number(form.budget || 0))} for {Number(form.guestCount || 0)} guests</p>
              <p className="mt-2 text-sm leading-6 text-[#6f6a61]">
                This sets dashboard totals and gives the planner enough context to size vendor recommendations and budget tasks.
              </p>
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-5">
              <div>
                <h2 className="font-display text-3xl font-semibold">Planning priorities</h2>
                <p className="mt-2 text-sm leading-6 text-[#6f6a61]">Pick the work Wedding OS should turn into setup tasks now.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {priorityOptions.map((priority) => {
                  const active = form.priorities.includes(priority);
                  return (
                    <button
                      key={priority}
                      type="button"
                      onClick={() => togglePriority(priority)}
                      className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 text-left transition ${
                        active ? "border-[#191714] bg-[#191714] text-white" : "border-[#e7dfd3] hover:border-[#c8a97e] hover:bg-[#fbf5ec]"
                      }`}
                    >
                      <span className={`flex size-6 items-center justify-center rounded-full ${active ? "bg-white text-[#191714]" : "bg-[#fbf5ec] text-[#9a7a50]"}`}>
                        <Check size={14} />
                      </span>
                      <span className="font-semibold">{priority}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-3 rounded-2xl border border-[#e7dfd3] p-5">
              <h3 className="font-display text-2xl font-semibold">Basic settings</h3>
              <Toggle label="Multi-event or cultural schedule" checked={form.settings.culturalEvents} onChange={(value) => update("settings", { ...form.settings, culturalEvents: value })} />
              <Toggle label="Family collaborators" checked={form.settings.familyCollaborators} onChange={(value) => update("settings", { ...form.settings, familyCollaborators: value })} />
              <Toggle label="Public RSVP link" checked={form.settings.publicRsvp} onChange={(value) => update("settings", { ...form.settings, publicRsvp: value })} />
              <Toggle label="Allow vendor pitches for open needs" checked={form.settings.vendorPitches} onChange={(value) => update("settings", { ...form.settings, vendorPitches: value })} />
            </div>
          </div>
        ) : null}

        <div className="mt-7 rounded-2xl bg-[#fbf5ec] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9a7a50]">Setup summary</p>
          <p className="mt-2 text-sm leading-6 text-[#6f6a61]">
            {form.coupleNames || "Your wedding"} in {form.location || "your city"} with {form.eventTypes.length} events, {selectedVendorNames.length} vendor needs selected, and a {formatCurrency(Number(form.budget || 0))} budget.
          </p>
        </div>

        {error ? <div className="mt-5 rounded-2xl border border-[#f2c9c9] bg-[#fff4f3] p-4 text-sm font-semibold text-[#93484d]">{error}</div> : null}
        {slowSave ? (
          <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-[#e7dfd3] bg-[#fbf5ec] p-4 text-sm text-[#6f6a61] sm:flex-row sm:items-center sm:justify-between">
            <span className="font-semibold text-[#191714]">Setup is taking longer than expected, but your workspace is being saved.</span>
            <button
              type="button"
              onClick={() => router.replace("/dashboard")}
              className="inline-flex cursor-pointer justify-center rounded-full bg-[#191714] px-4 py-2 text-sm font-semibold text-white"
            >
              Continue to dashboard
            </button>
          </div>
        ) : null}

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => setStep((current) => Math.max(current - 1, 0))}
            disabled={step === 0 || isSaving}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-[#e0d5c7] px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowLeft size={16} />
            Back
          </button>
          {step < steps.length - 1 ? (
            <button
              type="button"
              onClick={next}
              disabled={!canContinue}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-[#191714] px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#c9c1b5]"
            >
              Continue
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={isSaving}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-[#191714] px-6 py-3 text-sm font-semibold text-white disabled:cursor-wait disabled:bg-[#c9c1b5]"
            >
              {isSaving ? "Saving setup..." : "Save setup"}
              <Check size={16} />
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-[#191714]">
        {label}
        {required ? <span className="text-[#93484d]"> *</span> : null}
      </span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full cursor-pointer items-center justify-between gap-4 rounded-2xl border border-[#e7dfd3] p-4 text-left transition hover:border-[#c8a97e] hover:bg-[#fbf5ec]"
    >
      <span className="font-semibold">{label}</span>
      <span className={`flex h-7 w-12 items-center rounded-full p-1 transition ${checked ? "bg-[#191714]" : "bg-[#e7dfd3]"}`}>
        <span className={`size-5 rounded-full bg-white transition ${checked ? "translate-x-5" : "translate-x-0"}`} />
      </span>
    </button>
  );
}
