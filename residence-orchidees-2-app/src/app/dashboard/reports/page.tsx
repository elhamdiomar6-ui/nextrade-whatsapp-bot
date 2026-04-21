import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/DashboardShell";
import { ReportsClient } from "./ReportsClient";

export default async function ReportsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const role = (session.user as { role?: string }).role;
  if (role === "OCCUPANT") redirect("/dashboard/mon-espace");

  return (
    <DashboardShell>
      <ReportsClient />
    </DashboardShell>
  );
}
