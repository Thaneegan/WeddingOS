"use server";

import { redirect } from "next/navigation";
import { signOut } from "@/auth";
import { updatePassword } from "@/app/actions";

type AccountState = { error?: string; success?: string };

export async function changePassword(_previousState: AccountState | undefined, formData: FormData): Promise<AccountState> {
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (newPassword.length < 8) return { error: "New password must be at least 8 characters." };
  if (newPassword !== confirmPassword) return { error: "New password and confirmation do not match." };

  try {
    await updatePassword({ currentPassword, newPassword });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Password update failed." };
  }

  return { success: "Password updated." };
}

export async function logout() {
  await signOut({ redirect: false });
  redirect("/login");
}
