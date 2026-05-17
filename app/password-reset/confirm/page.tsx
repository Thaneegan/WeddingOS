import { CompleteResetForm } from "../ResetForms";
import { PublicHeader } from "@/components/layout/PublicHeader";

export default async function PasswordResetConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="min-h-screen bg-[#FAF9F7]">
      <PublicHeader />
      <div className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-10">
        <CompleteResetForm token={params.token} />
      </div>
    </main>
  );
}
