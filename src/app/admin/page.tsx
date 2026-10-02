import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, verifySessionToken } from "@/lib/auth";
import AdminLoginForm from "@/components/AdminLoginForm";
import FeedbackTable from "@/components/FeedbackTable";

export const runtime = "nodejs";

export default async function AdminPage() {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE_NAME)?.value;
  const authenticated = await verifySessionToken(token);

  if (!authenticated) {
    return <AdminLoginForm />;
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-5 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Tester feedback</h1>
        <p className="mt-1 text-sm opacity-70">
          Newest first. Status changes save immediately.
        </p>
      </header>
      <FeedbackTable />
    </main>
  );
}
