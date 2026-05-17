import Link from "next/link";
import { SignupForm } from "./SignupForm";
import { prisma } from "@/lib/prisma";
import { CategoryType } from "@prisma/client";
import { PublicHeader } from "@/components/layout/PublicHeader";

export const dynamic = "force-dynamic";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code = "" } = await searchParams;
  const [invite, vendorCategories] = await Promise.all([
    code
      ? prisma.invite.findUnique({
          where: { code },
          select: { role: true, status: true, expiresAt: true },
        })
      : null,
    prisma.category.findMany({
      where: { type: CategoryType.VENDOR_SERVICE, archivedAt: null },
      select: { id: true, name: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
  ]);

  return (
    <main className="min-h-screen bg-[#FAF9F7]">
      <PublicHeader />
      <div className="mx-auto flex w-full max-w-5xl flex-col justify-center px-4 py-10">
        <SignupForm code={code} role={invite?.role} vendorCategories={vendorCategories} />
        <p className="mt-5 text-center text-sm text-[#6f6a61]">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-[#191714]">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
