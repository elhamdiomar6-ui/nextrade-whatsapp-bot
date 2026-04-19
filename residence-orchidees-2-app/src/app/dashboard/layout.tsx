import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/DashboardShell";
import { ToastProvider } from "@/components/Toast";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <ToastProvider>
      <DashboardShell>{children}</DashboardShell>
    </ToastProvider>
  );
}
