"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function loginWithPassword(_previousState: { error?: string } | undefined, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const waitlistSignup = email
    ? await prisma.waitlistSignup.findUnique({
        where: { email },
        select: { status: true },
      })
    : null;

  try {
    await signIn("credentials", {
      email,
      password: formData.get("password"),
      redirectTo: waitlistSignup?.status === "PENDING" ? "/waitlist" : "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password." };
    }

    throw error;
  }

  return {};
}
