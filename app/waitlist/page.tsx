import Link from "next/link";
import { redirect } from "next/navigation";
import { Clock3, Gem, LockKeyhole, MailCheck } from "lucide-react";
import { auth } from "@/auth";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { prisma } from "@/lib/prisma";
import { logout } from "@/app/account/actions";

export const dynamic = "force-dynamic";

export default async function WaitlistPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const waitlistSignup = await prisma.waitlistSignup.findFirst({
    where: {
      OR: [{ userId: session.user.id }, { email: session.user.email ?? "" }],
    },
  });

  if (!waitlistSignup || waitlistSignup.status !== "PENDING") {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-[#FAF9F7]">
      <PublicHeader />
      <div className="mx-auto flex min-h-[calc(100vh-80px)] max-w-4xl items-center justify-center px-4 py-10">
        <section className="w-full overflow-hidden rounded-3xl border border-[#e7dfd3] bg-white luxury-shadow">
          <div className="border-b border-[#eee7dd] bg-[#191714] p-6 text-white">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-white text-[#191714]">
              <Gem size={21} />
            </div>
            <h1 className="mt-5 font-display text-4xl font-semibold">You are on the Wedding OS waitlist</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/72">
              Your account has been created, but workspace access is not enabled yet. You will be able to use the platform once an active invitation is issued for your account.
            </p>
          </div>

          <div className="grid gap-4 p-5 md:grid-cols-3">
            <div className="rounded-2xl bg-[#fbfaf8] p-4">
              <Clock3 size={20} className="text-[#9a7a50]" />
              <p className="mt-3 text-sm font-semibold text-[#191714]">Status</p>
              <p className="mt-1 text-sm text-[#6f6a61]">Pending access review</p>
            </div>
            <div className="rounded-2xl bg-[#fbfaf8] p-4">
              <MailCheck size={20} className="text-[#61735f]" />
              <p className="mt-3 text-sm font-semibold text-[#191714]">Account</p>
              <p className="mt-1 truncate text-sm text-[#6f6a61]">{waitlistSignup.email}</p>
            </div>
            <div className="rounded-2xl bg-[#fbfaf8] p-4">
              <LockKeyhole size={20} className="text-[#93484d]" />
              <p className="mt-3 text-sm font-semibold text-[#191714]">Workspace access</p>
              <p className="mt-1 text-sm text-[#6f6a61]">Restricted until invited</p>
            </div>
          </div>

          <div className="border-t border-[#eee7dd] p-5">
            <p className="text-sm leading-6 text-[#6f6a61]">
              If you receive a new invitation code, sign up again with the same email or contact the Wedding OS team to enable your account.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link href="/" className="flex h-11 items-center justify-center rounded-full border border-[#e7dfd3] px-5 text-sm font-semibold text-[#6f6a61]">
                Back to home
              </Link>
              <form action={logout}>
                <button className="h-11 rounded-full bg-[#191714] px-5 text-sm font-semibold text-white">Sign out</button>
              </form>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
