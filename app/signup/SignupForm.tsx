"use client";

import { type FormEvent, useActionState, useMemo, useRef, useState } from "react";
import { ArrowRight, BriefcaseBusiness, CalendarDays, CheckCircle2, Gem, Store, UserPlus, UsersRound } from "lucide-react";
import { signupWithInvite } from "./actions";

type SignupStep = "choose" | "account" | "workspace" | "review";
type AccountType = "couple" | "vendor";

function roleToType(role?: string): AccountType | null {
  if (role === "COUPLE_OWNER" || role === "WEDDING_MEMBER") return "couple";
  if (role === "VENDOR_OWNER" || role === "VENDOR_MEMBER") return "vendor";
  return null;
}

function isOwnerInvite(role?: string) {
  return role === "COUPLE_OWNER" || role === "VENDOR_OWNER" || !role;
}

function passwordRequirementError(value: string) {
  if (value.length < 12) return "Password must be at least 12 characters.";
  if (!/[a-z]/.test(value)) return "Password needs a lowercase letter.";
  if (!/[A-Z]/.test(value)) return "Password needs an uppercase letter.";
  if (!/[0-9]/.test(value)) return "Password needs a number.";
  if (!/[^A-Za-z0-9]/.test(value)) return "Password needs a symbol.";
  return null;
}

export function SignupForm({
  code,
  role,
  vendorCategories,
}: {
  code: string;
  role?: string;
  vendorCategories: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(signupWithInvite, {});
  const [dismissedInvalidInvite, setDismissedInvalidInvite] = useState(false);
  const lockedType = roleToType(role);
  const [accountType, setAccountType] = useState<AccountType | null>(lockedType);
  const hasWorkspaceStep = isOwnerInvite(role);
  const selectedCategoryId = vendorCategories.find((item) => item.name === "Photography")?.id ?? vendorCategories[0]?.id ?? "";
  const [step, setStep] = useState<SignupStep>(lockedType ? "account" : "choose");
  const formRef = useRef<HTMLFormElement>(null);
  const waitlistRequestedRef = useRef<HTMLInputElement>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formValues, setFormValues] = useState<Record<string, string>>({ code, categoryId: selectedCategoryId });
  const steps = useMemo<SignupStep[]>(() => (hasWorkspaceStep ? ["choose", "account", "workspace", "review"] : ["choose", "account", "review"]), [hasWorkspaceStep]);
  const visibleSteps = lockedType ? steps.filter((item) => item !== "choose") : steps;
  const stepIndex = visibleSteps.indexOf(step);

  function getFieldValue(name: string) {
    const form = formRef.current;
    if (!form) return "";
    const value = new FormData(form).get(name);
    return String(value ?? "").trim();
  }

  function getLiveFieldValue(name: string) {
    return String(formValues[name] ?? "").trim();
  }

  function updateField(name: string, value: string) {
    setFormValues((current) => ({ ...current, [name]: value }));
    if (formError) setFormError(null);
  }

  function isValidEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function isPositiveNumber(value: string) {
    const numberValue = Number(value);
    return value !== "" && Number.isFinite(numberValue) && numberValue > 0;
  }

  function canAdvanceStep(targetStep = step) {
    if (targetStep === "choose") return Boolean(accountType);

    if (targetStep === "account") {
      return Boolean(
        getLiveFieldValue("name") &&
          (accountType !== "couple" || getLiveFieldValue("partnerName")) &&
          isValidEmail(getLiveFieldValue("email")) &&
          !passwordRequirementError(getLiveFieldValue("password")),
      );
    }

    if (targetStep === "workspace" && hasWorkspaceStep) {
      if (accountType === "couple") {
        return Boolean(
          getLiveFieldValue("date") &&
            getLiveFieldValue("location") &&
            isPositiveNumber(getLiveFieldValue("budget")) &&
            isPositiveNumber(getLiveFieldValue("guestCount")),
        );
      }

      if (accountType === "vendor") {
        return Boolean(
          getLiveFieldValue("businessName") &&
            getLiveFieldValue("location") &&
            getLiveFieldValue("categoryId") &&
            getLiveFieldValue("serviceName") &&
            isPositiveNumber(getLiveFieldValue("startingPrice")),
        );
      }
    }

    if (targetStep === "review") {
      return Boolean(getLiveFieldValue("code"));
    }

    return true;
  }

  function validateStep(targetStep = step) {
    const errors: Record<string, string> = {};

    if (targetStep === "choose" && !accountType) {
      setFormError("Choose Couple or Vendor to continue.");
      setFieldErrors({});
      return false;
    }

    if (targetStep === "account") {
      const name = getFieldValue("name");
      const partnerName = getFieldValue("partnerName");
      const email = getFieldValue("email");
      const password = getFieldValue("password");
      const passwordError = passwordRequirementError(password);

      if (!name) errors.name = "Enter your name.";
      if (accountType === "couple" && !partnerName) errors.partnerName = "Enter your partner's name.";
      if (!email) errors.email = "Enter your email.";
      else if (!isValidEmail(email)) errors.email = "Enter a valid email address.";
      if (!password) errors.password = "Create a password.";
      else if (passwordError) errors.password = passwordError;
    }

    if (targetStep === "review") {
      if (!getFieldValue("code")) errors.code = "Enter your invite code.";
    }

    if (targetStep === "workspace" && hasWorkspaceStep) {
      if (accountType === "couple") {
        if (!getFieldValue("date")) errors.date = "Choose the wedding date.";
        if (!getFieldValue("location")) errors.location = "Enter the wedding location.";
        if (!getFieldValue("budget")) errors.budget = "Enter a starting budget.";
        else if (!isPositiveNumber(getFieldValue("budget"))) errors.budget = "Enter a valid budget amount.";
        if (!getFieldValue("guestCount")) errors.guestCount = "Enter a guest estimate.";
        else if (!isPositiveNumber(getFieldValue("guestCount"))) errors.guestCount = "Enter a valid guest estimate.";
      }

      if (accountType === "vendor") {
        if (!getFieldValue("businessName")) errors.businessName = "Enter your business name.";
        if (!getFieldValue("location")) errors.location = "Enter your service location.";
        if (!getFieldValue("categoryId")) errors.categoryId = "Choose a service category.";
        if (!getFieldValue("serviceName")) errors.serviceName = "Enter your primary service.";
        if (!getFieldValue("startingPrice")) errors.startingPrice = "Enter a starting price.";
        else if (!isPositiveNumber(getFieldValue("startingPrice"))) errors.startingPrice = "Enter a valid starting price.";
      }
    }

    setFieldErrors(errors);
    setFormError(Object.values(errors)[0] ?? null);
    return Object.keys(errors).length === 0;
  }

  function inputErrorClass(name: string) {
    return fieldErrors[name] ? "border-[#93484d] bg-[#fff5f4]" : "border-[#e7dfd3] bg-[#fbfaf8]";
  }

  function panelInputErrorClass(name: string) {
    return fieldErrors[name] ? "border-[#93484d] bg-[#fff5f4]" : "border-[#e7dfd3] bg-white";
  }

  function errorText(name: string) {
    return fieldErrors[name] ? <span className="mt-1 block text-xs font-semibold text-[#93484d]">{fieldErrors[name]}</span> : null;
  }

  function goNext() {
    if (!validateStep()) return;
    setStep(visibleSteps[Math.min(stepIndex + 1, visibleSteps.length - 1)]);
  }

  function goBack() {
    setFormError(null);
    setFieldErrors({});
    setStep(visibleSteps[Math.max(stepIndex - 1, 0)]);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    setDismissedInvalidInvite(false);

    if (waitlistRequestedRef.current?.value === "true") {
      setFormError(null);
      setFieldErrors({});
      return;
    }

    if (!validateStep("account")) {
      event.preventDefault();
      setStep("account");
      return;
    }

    if (hasWorkspaceStep && !validateStep("workspace")) {
      event.preventDefault();
      setStep("workspace");
      return;
    }

    if (!validateStep("review")) {
      event.preventDefault();
      setStep("review");
    }
  }

  function handleFormActivity() {
    if (formRef.current) {
      const nextValues: Record<string, string> = {};
      for (const [key, value] of new FormData(formRef.current).entries()) {
        nextValues[key] = String(value).trim();
      }
      if (!nextValues.categoryId && selectedCategoryId) nextValues.categoryId = selectedCategoryId;
      setFormValues(nextValues);
    }
    if (formError) setFormError(null);
  }

  const roleLabel = role ? role.toLowerCase().replaceAll("_", " ") : "Choose your account type";
  const canContinue = canAdvanceStep();
  const canSubmit = Boolean(accountType) && canAdvanceStep("account") && (!hasWorkspaceStep || canAdvanceStep("workspace")) && canAdvanceStep("review");
  const derivedCoupleNames =
    getLiveFieldValue("name") && getLiveFieldValue("partnerName")
      ? `${getLiveFieldValue("name")} & ${getLiveFieldValue("partnerName")}`
      : "";

  return (
    <form
      ref={formRef}
      action={formAction}
      onInput={handleFormActivity}
      onChange={handleFormActivity}
      onSubmit={handleSubmit}
      noValidate
      className="w-full max-w-5xl rounded-3xl border border-[#e7dfd3] bg-white p-5 luxury-shadow sm:p-6"
    >
      {state?.invalidInvite ? (
        <InvalidInviteModal
          onTryAgain={() => {
            if (waitlistRequestedRef.current) waitlistRequestedRef.current.value = "false";
            setDismissedInvalidInvite(true);
            setFieldErrors({});
            setFormError(null);
            setStep("review");
          }}
          onJoinWaitlist={() => {
            if (waitlistRequestedRef.current) waitlistRequestedRef.current.value = "true";
            setFieldErrors({});
            setFormError(null);
            formRef.current?.requestSubmit();
          }}
          show={!dismissedInvalidInvite}
        />
      ) : null}
      <input type="hidden" name="accountType" value={accountType ?? ""} />
      <input type="hidden" name="coupleNames" value={derivedCoupleNames} />
      <input ref={waitlistRequestedRef} type="hidden" name="waitlistRequested" value="false" />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-[#191714] text-white">
            <Gem size={20} />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold">Create your Wedding OS account</h1>
            <p className="text-sm capitalize text-[#6f6a61]">{roleLabel}</p>
          </div>
        </div>
        <div className="rounded-full bg-[#fbf5ec] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#8a6332]">
          Invite-only access
        </div>
      </div>

      <div className="mt-6 grid gap-2" style={{ gridTemplateColumns: `repeat(${visibleSteps.length}, minmax(0, 1fr))` }}>
        {visibleSteps.map((item, index) => (
          <button
            key={item}
            type="button"
            onClick={() => {
              const targetIndex = visibleSteps.indexOf(item);
              if (targetIndex <= stepIndex) {
                setFormError(null);
                setFieldErrors({});
                setStep(item);
                return;
              }
              goNext();
            }}
            className={`h-2 rounded-full ${index <= stepIndex ? "bg-[#191714]" : "bg-[#eadfce]"}`}
            aria-label={`Go to ${item} step`}
          />
        ))}
      </div>

      <section className={step === "choose" ? "mt-6" : "hidden"}>
        <div className="mb-4">
          <p className="font-display text-2xl font-semibold text-[#191714]">What are you setting up?</p>
          <p className="mt-2 text-sm leading-6 text-[#6f6a61]">Start with the right workspace. Couples get planning tools; vendors get profile, leads, clients, and marketplace setup.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[
            {
              type: "couple" as const,
              title: "Couple",
              icon: UsersRound,
              description: "Plan a wedding, manage vendors, budget, guests, RSVP, messages, and timeline.",
              details: ["Wedding workspace", "Budget and RSVP setup", "Marketplace quote flow"],
            },
            {
              type: "vendor" as const,
              title: "Vendor",
              icon: Store,
              description: "Publish a vendor profile, manage inquiries, message couples, and track booked clients.",
              details: ["Business profile", "Service setup", "Lead pipeline"],
            },
          ].map((item) => {
            const Icon = item.icon;
            const active = accountType === item.type;
            const disabled = lockedType !== null && lockedType !== item.type;

            return (
              <button
                key={item.type}
                type="button"
                disabled={disabled}
                onClick={() => {
                  setAccountType(item.type);
                }}
                className={`rounded-3xl border p-5 text-left transition ${
                  active ? "border-[#191714] bg-[#fbfaf8] shadow-[0_18px_50px_rgba(25,23,20,0.10)]" : "border-[#e7dfd3] bg-white hover:border-[#c8a97e]"
                } ${disabled ? "cursor-not-allowed opacity-45" : ""}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-[#191714] text-white">
                    <Icon size={20} />
                  </div>
                  {active ? <CheckCircle2 size={20} className="text-[#61735f]" /> : null}
                </div>
                <h2 className="mt-5 font-display text-2xl font-semibold text-[#191714]">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-[#6f6a61]">{item.description}</p>
                <div className="mt-5 space-y-2">
                  {item.details.map((detail) => (
                    <p key={detail} className="flex items-center gap-2 text-sm font-semibold text-[#4b463d]">
                      <CheckCircle2 size={15} className="text-[#61735f]" />
                      {detail}
                    </p>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className={step === "account" ? "mt-6 grid gap-4 sm:grid-cols-2" : "hidden"}>
        <div className="sm:col-span-2">
          <p className="font-display text-2xl font-semibold text-[#191714]">Account basics</p>
          <p className="mt-2 text-sm leading-6 text-[#6f6a61]">Create the owner login for this workspace. You will enter your invite code on the final step.</p>
        </div>
        <label className="block">
          <span className="text-sm font-semibold text-[#4b463d]">Your name</span>
            <input name="name" value={formValues.name ?? ""} onChange={(event) => updateField("name", event.target.value)} autoComplete="name" className={`mt-2 h-12 w-full rounded-full border px-4 outline-none focus:border-[#c8a97e] ${inputErrorClass("name")}`} required aria-invalid={Boolean(fieldErrors.name)} />
          {errorText("name")}
        </label>
        {accountType === "couple" ? (
          <label className="block">
            <span className="text-sm font-semibold text-[#4b463d]">Partner&apos;s name</span>
              <input name="partnerName" value={formValues.partnerName ?? ""} onChange={(event) => updateField("partnerName", event.target.value)} autoComplete="name" className={`mt-2 h-12 w-full rounded-full border px-4 outline-none focus:border-[#c8a97e] ${inputErrorClass("partnerName")}`} required aria-invalid={Boolean(fieldErrors.partnerName)} />
            {errorText("partnerName")}
          </label>
        ) : null}
        <label className="block">
          <span className="text-sm font-semibold text-[#4b463d]">Email</span>
          <input name="email" type="email" value={formValues.email ?? ""} onChange={(event) => updateField("email", event.target.value)} autoComplete="email" className={`mt-2 h-12 w-full rounded-full border px-4 outline-none focus:border-[#c8a97e] ${inputErrorClass("email")}`} required aria-invalid={Boolean(fieldErrors.email)} />
          {errorText("email")}
        </label>
        <label className="block sm:col-span-2">
          <span className="text-sm font-semibold text-[#4b463d]">Password</span>
          <input name="password" type="password" value={formValues.password ?? ""} onChange={(event) => updateField("password", event.target.value)} autoComplete="new-password" minLength={12} className={`mt-2 h-12 w-full rounded-full border px-4 outline-none focus:border-[#c8a97e] ${inputErrorClass("password")}`} required aria-invalid={Boolean(fieldErrors.password)} />
          <span className="mt-2 block text-xs font-medium leading-5 text-[#6f6a61]">
            Use at least 12 characters with uppercase, lowercase, a number, and a symbol.
          </span>
          {errorText("password")}
        </label>
      </section>

      <section className={step === "workspace" ? "mt-6" : "hidden"}>
        {accountType === "couple" ? (
          <div className="space-y-5">
            <div>
              <p className="font-display text-2xl font-semibold text-[#191714]">Set up your wedding</p>
              <p className="mt-2 text-sm leading-6 text-[#6f6a61]">This creates the planning workspace, starter budget, task list, guest groups, and vendor needs.</p>
            </div>
            <div className="grid gap-4 rounded-2xl border border-[#eee7dd] bg-[#fffdf9] p-4 sm:grid-cols-2">
              <label>
                <input name="date" type="date" value={formValues.date ?? ""} onChange={(event) => updateField("date", event.target.value)} className={`h-11 w-full rounded-full border px-4 text-sm outline-none focus:border-[#c8a97e] ${panelInputErrorClass("date")}`} aria-invalid={Boolean(fieldErrors.date)} />
                {errorText("date")}
              </label>
              <label>
                <input name="location" value={formValues.location ?? ""} onChange={(event) => updateField("location", event.target.value)} placeholder="Wedding location, e.g. Toronto, Ontario" className={`h-11 w-full rounded-full border px-4 text-sm outline-none focus:border-[#c8a97e] ${panelInputErrorClass("location")}`} aria-invalid={Boolean(fieldErrors.location)} />
                {errorText("location")}
              </label>
              <input name="style" value={formValues.style ?? ""} onChange={(event) => updateField("style", event.target.value)} placeholder="Style, e.g. Modern South Asian fusion" className="h-11 rounded-full border border-[#e7dfd3] bg-white px-4 text-sm outline-none focus:border-[#c8a97e]" />
              <label>
                <input name="budget" value={formValues.budget ?? ""} onChange={(event) => updateField("budget", event.target.value)} placeholder="Budget, e.g. 35000" inputMode="decimal" className={`h-11 w-full rounded-full border px-4 text-sm outline-none focus:border-[#c8a97e] ${panelInputErrorClass("budget")}`} aria-invalid={Boolean(fieldErrors.budget)} />
                {errorText("budget")}
              </label>
              <label>
                <input name="guestCount" value={formValues.guestCount ?? ""} onChange={(event) => updateField("guestCount", event.target.value)} placeholder="Guest estimate, e.g. 120" inputMode="numeric" className={`h-11 w-full rounded-full border px-4 text-sm outline-none focus:border-[#c8a97e] ${panelInputErrorClass("guestCount")}`} aria-invalid={Boolean(fieldErrors.guestCount)} />
                {errorText("guestCount")}
              </label>
              <textarea name="priorityNotes" value={formValues.priorityNotes ?? ""} onChange={(event) => updateField("priorityNotes", event.target.value)} placeholder="Top planning priorities, cultural events, or must-have vendors" className="min-h-24 rounded-2xl border border-[#e7dfd3] bg-white px-4 py-3 text-sm outline-none focus:border-[#c8a97e] sm:col-span-2" />
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <p className="font-display text-2xl font-semibold text-[#191714]">Set up your vendor profile</p>
              <p className="mt-2 text-sm leading-6 text-[#6f6a61]">This creates your business profile, first service, marketplace listing, and CRM workspace.</p>
            </div>
            <div className="grid gap-4 rounded-2xl border border-[#eee7dd] bg-[#fffdf9] p-4 sm:grid-cols-2">
              <label>
                <input name="businessName" value={formValues.businessName ?? ""} onChange={(event) => updateField("businessName", event.target.value)} placeholder="Business name" className={`h-11 w-full rounded-full border px-4 text-sm outline-none focus:border-[#c8a97e] ${panelInputErrorClass("businessName")}`} aria-invalid={Boolean(fieldErrors.businessName)} />
                {errorText("businessName")}
              </label>
              <label>
                <input name="location" value={formValues.location ?? ""} onChange={(event) => updateField("location", event.target.value)} placeholder="Service location, e.g. Toronto / GTA" className={`h-11 w-full rounded-full border px-4 text-sm outline-none focus:border-[#c8a97e] ${panelInputErrorClass("location")}`} aria-invalid={Boolean(fieldErrors.location)} />
                {errorText("location")}
              </label>
              <label>
                <select name="categoryId" value={formValues.categoryId ?? selectedCategoryId} onChange={(event) => updateField("categoryId", event.target.value)} className={`h-11 w-full rounded-full border px-4 text-sm font-semibold outline-none focus:border-[#c8a97e] ${panelInputErrorClass("categoryId")}`} aria-invalid={Boolean(fieldErrors.categoryId)}>
                  {vendorCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {errorText("categoryId")}
              </label>
              <label>
                <input name="serviceName" value={formValues.serviceName ?? ""} onChange={(event) => updateField("serviceName", event.target.value)} placeholder="Primary package or service" className={`h-11 w-full rounded-full border px-4 text-sm outline-none focus:border-[#c8a97e] ${panelInputErrorClass("serviceName")}`} aria-invalid={Boolean(fieldErrors.serviceName)} />
                {errorText("serviceName")}
              </label>
              <label>
                <input name="startingPrice" value={formValues.startingPrice ?? ""} onChange={(event) => updateField("startingPrice", event.target.value)} placeholder="Starting price, e.g. 2800" inputMode="decimal" className={`h-11 w-full rounded-full border px-4 text-sm outline-none focus:border-[#c8a97e] ${panelInputErrorClass("startingPrice")}`} aria-invalid={Boolean(fieldErrors.startingPrice)} />
                {errorText("startingPrice")}
              </label>
              <input name="responseTime" value={formValues.responseTime ?? ""} onChange={(event) => updateField("responseTime", event.target.value)} placeholder="Response time, e.g. 2 hours" className="h-11 rounded-full border border-[#e7dfd3] bg-white px-4 text-sm outline-none focus:border-[#c8a97e]" />
              <input name="socials" value={formValues.socials ?? ""} onChange={(event) => updateField("socials", event.target.value)} placeholder="Instagram or website URL" className="h-11 rounded-full border border-[#e7dfd3] bg-white px-4 text-sm outline-none focus:border-[#c8a97e] sm:col-span-2" />
              <textarea name="about" value={formValues.about ?? ""} onChange={(event) => updateField("about", event.target.value)} placeholder="Short business description" className="min-h-24 rounded-2xl border border-[#e7dfd3] bg-white px-4 py-3 text-sm outline-none focus:border-[#c8a97e] sm:col-span-2" />
            </div>
          </div>
        )}
      </section>

      <section className={step === "review" ? "mt-6" : "hidden"}>
        <div className="rounded-2xl border border-[#eee7dd] bg-[#fffdf9] p-5">
          <p className="font-display text-2xl font-semibold text-[#191714]">Ready to create your {accountType === "vendor" ? "vendor" : "couple"} workspace</p>
          <p className="mt-2 text-sm leading-6 text-[#6f6a61]">
            Enter your invite code to verify workspace access. If the code is valid, Wedding OS will create your login, initialize the correct workspace, and send you directly to the right portal.
          </p>
          <label className="mt-5 block">
            <span className="text-sm font-semibold text-[#4b463d]">Invite code</span>
            <input name="code" value={formValues.code ?? ""} onChange={(event) => updateField("code", event.target.value)} className={`mt-2 h-12 w-full rounded-full border px-4 outline-none focus:border-[#c8a97e] ${inputErrorClass("code")}`} required aria-invalid={Boolean(fieldErrors.code)} />
            {errorText("code")}
          </label>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {(accountType === "vendor"
              ? [
                  ["Business profile", BriefcaseBusiness],
                  ["Marketplace service", Store],
                  ["Lead CRM", UserPlus],
                ]
              : [
                  ["Wedding workspace", CalendarDays],
                  ["Budget and timeline", Gem],
                  ["Guests and vendors", UsersRound],
                ]
            ).map(([label, Icon]) => {
              const TypedIcon = Icon as typeof Gem;
              return (
                <div key={String(label)} className="flex items-center gap-2 rounded-2xl bg-white p-3 text-sm font-semibold text-[#4b463d]">
                  <TypedIcon size={16} className="text-[#9a7a50]" />
                  {String(label)}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {formError ? (
        <p className="mt-4 rounded-2xl border border-[#efd5d4] bg-[#fff5f4] p-3 text-sm font-semibold text-[#93484d]">
          {formError}
        </p>
      ) : null}

      {state?.error ? (
        <p className="mt-4 rounded-2xl border border-[#efd5d4] bg-[#fff5f4] p-3 text-sm font-semibold text-[#93484d]">
          {state.error}
        </p>
      ) : null}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        {stepIndex > 0 ? (
          <button type="button" onClick={goBack} className="h-12 rounded-full border border-[#e7dfd3] px-5 text-sm font-semibold text-[#6f6a61]">
            Back
          </button>
        ) : null}
        {step !== "review" ? (
          <button type="button" onClick={goNext} disabled={!canContinue} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-[#191714] text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#cfc7bb]">
            Continue
            <ArrowRight size={16} />
          </button>
        ) : (
          <button disabled={pending || !canSubmit} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-[#191714] text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#cfc7bb]">
            <UserPlus size={17} />
            {pending ? "Creating account..." : `Create ${accountType === "vendor" ? "vendor" : "couple"} account`}
          </button>
        )}
      </div>
    </form>
  );
}

function InvalidInviteModal({
  show,
  onTryAgain,
  onJoinWaitlist,
}: {
  show: boolean;
  onTryAgain: () => void;
  onJoinWaitlist: () => void;
}) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#191714]/55 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-[#e7dfd3] bg-white p-5 shadow-[0_30px_90px_rgba(25,23,20,0.25)]">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-[#fff5f4] text-[#93484d]">
          <UserPlus size={20} />
        </div>
        <h2 className="mt-4 font-display text-2xl font-semibold text-[#191714]">Invite code not valid</h2>
        <p className="mt-2 text-sm leading-6 text-[#6f6a61]">
          The invite code you entered is inactive, expired, or does not match this account type. You can go back and try another code, or complete signup and join the waitlist.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onTryAgain}
            className="h-11 rounded-full border border-[#e7dfd3] px-4 text-sm font-semibold text-[#6f6a61]"
          >
            Try another code
          </button>
          <button
            type="button"
            onClick={onJoinWaitlist}
            className="h-11 rounded-full bg-[#191714] px-4 text-sm font-semibold text-white"
          >
            Join waitlist
          </button>
        </div>
      </div>
    </div>
  );
}
