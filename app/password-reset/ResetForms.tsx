"use client";

import Link from "next/link";
import { useActionState } from "react";
import { KeyRound, Mail } from "lucide-react";
import { completeReset, requestReset } from "./actions";

export function RequestResetForm() {
  const [state, formAction, pending] = useActionState(requestReset, {});

  return (
    <form action={formAction} className="w-full max-w-md rounded-3xl border border-[#e7dfd3] bg-white p-6 luxury-shadow">
      <div className="flex items-center gap-2">
        <Mail size={18} className="text-[#9a7a50]" />
        <h1 className="font-display text-2xl font-semibold">Reset password</h1>
      </div>
      <p className="mt-2 text-sm leading-6 text-[#6f6a61]">Enter your account email and Wedding OS will queue a reset email.</p>
      <input
        name="email"
        type="email"
        placeholder="you@example.com"
        className="mt-5 h-12 w-full rounded-full border border-[#e7dfd3] bg-[#fbfaf8] px-4 outline-none focus:border-[#c8a97e]"
        required
      />
      {state?.error ? <p className="mt-3 text-sm font-semibold text-[#93484d]">{state.error}</p> : null}
      {state?.success ? <p className="mt-3 text-sm font-semibold text-[#61735f]">{state.success}</p> : null}
      <button disabled={pending} className="mt-5 h-12 w-full rounded-full bg-[#191714] text-sm font-semibold text-white disabled:opacity-60">
        {pending ? "Queuing" : "Send reset email"}
      </button>
      <Link href="/login" className="mt-4 block text-center text-sm font-semibold text-[#6f6a61]">
        Back to sign in
      </Link>
    </form>
  );
}

export function CompleteResetForm({ token }: { token?: string }) {
  const [state, formAction, pending] = useActionState(completeReset, {});

  return (
    <form action={formAction} className="w-full max-w-md rounded-3xl border border-[#e7dfd3] bg-white p-6 luxury-shadow">
      <div className="flex items-center gap-2">
        <KeyRound size={18} className="text-[#9a7a50]" />
        <h1 className="font-display text-2xl font-semibold">Set new password</h1>
      </div>
      <input
        name="token"
        defaultValue={token}
        placeholder="Reset token"
        className="mt-5 h-12 w-full rounded-full border border-[#e7dfd3] bg-[#fbfaf8] px-4 outline-none focus:border-[#c8a97e]"
        required
      />
      <input
        name="newPassword"
        type="password"
        placeholder="New password"
        className="mt-3 h-12 w-full rounded-full border border-[#e7dfd3] bg-[#fbfaf8] px-4 outline-none focus:border-[#c8a97e]"
        required
      />
      <input
        name="confirmPassword"
        type="password"
        placeholder="Confirm new password"
        className="mt-3 h-12 w-full rounded-full border border-[#e7dfd3] bg-[#fbfaf8] px-4 outline-none focus:border-[#c8a97e]"
        required
      />
      {state?.error ? <p className="mt-3 text-sm font-semibold text-[#93484d]">{state.error}</p> : null}
      {state?.success ? <p className="mt-3 text-sm font-semibold text-[#61735f]">{state.success}</p> : null}
      <button disabled={pending} className="mt-5 h-12 w-full rounded-full bg-[#191714] text-sm font-semibold text-white disabled:opacity-60">
        {pending ? "Saving" : "Reset password"}
      </button>
    </form>
  );
}
