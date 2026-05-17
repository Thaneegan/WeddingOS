"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Gem, LogIn } from "lucide-react";
import { loginWithPassword } from "./actions";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginWithPassword, {});

  return (
    <form action={formAction} className="w-full max-w-md rounded-3xl border border-[#e7dfd3] bg-white p-6 luxury-shadow">
      <div className="flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-[#191714] text-white">
          <Gem size={20} />
        </div>
        <div>
          <h1 className="font-display text-2xl font-semibold">Wedding OS</h1>
          <p className="text-sm text-[#6f6a61]">Sign in to your workspace</p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <label className="block">
          <span className="text-sm font-semibold text-[#4b463d]">Email</span>
          <input
            name="email"
            type="email"
            placeholder="you@example.com"
            className="mt-2 h-12 w-full rounded-full border border-[#e7dfd3] bg-[#fbfaf8] px-4 outline-none focus:border-[#c8a97e]"
            required
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-[#4b463d]">Password</span>
          <input
            name="password"
            type="password"
            placeholder="Your password"
            className="mt-2 h-12 w-full rounded-full border border-[#e7dfd3] bg-[#fbfaf8] px-4 outline-none focus:border-[#c8a97e]"
            required
          />
        </label>
      </div>

      {state?.error ? (
        <p className="mt-4 rounded-2xl border border-[#efd5d4] bg-[#fff5f4] p-3 text-sm font-semibold text-[#93484d]">
          {state.error}
        </p>
      ) : null}

      <button
        disabled={pending}
        className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#191714] text-sm font-semibold text-white disabled:opacity-60"
      >
        <LogIn size={17} />
        {pending ? "Signing in..." : "Sign in"}
      </button>
      <Link href="/password-reset" className="mt-4 block text-center text-sm font-semibold text-[#6f6a61]">
        Forgot password?
      </Link>
      <div className="mt-5 border-t border-[#eee7dd] pt-4 text-center text-sm text-[#6f6a61]">
        <p>New to Wedding OS?</p>
        <div className="mt-2 flex justify-center gap-3">
          <Link href="/" className="font-semibold text-[#191714]">
            View platform
          </Link>
          <Link href="/signup" className="font-semibold text-[#8a6332]">
            Join with invite
          </Link>
        </div>
      </div>
    </form>
  );
}
