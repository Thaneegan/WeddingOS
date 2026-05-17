"use server";

import { requestPasswordReset, resetPassword } from "@/app/actions";

type ResetState = { error?: string; success?: string };

export async function requestReset(_previousState: ResetState | undefined, formData: FormData): Promise<ResetState> {
  const email = String(formData.get("email") ?? "");
  if (!email) return { error: "Email is required." };

  try {
    await requestPasswordReset({ email });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Password reset request failed." };
  }

  return { success: "If the account exists, a reset email has been queued." };
}

export async function completeReset(_previousState: ResetState | undefined, formData: FormData): Promise<ResetState> {
  const token = String(formData.get("token") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!token) return { error: "Reset token is required." };
  if (newPassword.length < 8) return { error: "New password must be at least 8 characters." };
  if (newPassword !== confirmPassword) return { error: "Passwords do not match." };

  try {
    await resetPassword({ token, newPassword });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Password reset failed." };
  }

  return { success: "Password reset. You can sign in with the new password." };
}
