import { LoginForm } from "./LoginForm";
import { PublicHeader } from "@/components/layout/PublicHeader";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#FAF9F7]">
      <PublicHeader />
      <div className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-10">
        <LoginForm />
      </div>
    </main>
  );
}
