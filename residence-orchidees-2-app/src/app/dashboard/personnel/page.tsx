import { prisma } from "@/lib/prisma";
import { PersonnelClient } from "./PersonnelClient";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function PersonnelPage() {
  const session = await auth();
  const userRole = (session?.user as { role?: string })?.role;
  if (!["ADMIN", "MANAGER"].includes(userRole ?? "")) redirect("/dashboard");

  const staff = await prisma.staff.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      tasks: { orderBy: { date: "desc" }, take: 30 },
      plannings: {
        orderBy: { date: "asc" },
        where: { date: { gte: new Date(new Date().setDate(new Date().getDate() - 7)) } },
      },
      payments: { orderBy: { date: "desc" }, take: 20 },
    },
  });

  return (
    <PersonnelClient
      staff={staff.map((s) => ({
        id: s.id,
        name: s.name,
        role: s.role,
        phone: s.phone,
        email: s.email,
        address: s.address,
        cin: s.cin,
        startDate: s.startDate?.toISOString() ?? null,
        salary: s.salary,
        salaryType: s.salaryType,
        notes: s.notes,
        active: s.active,
        tasks: s.tasks.map((t) => ({
          id: t.id,
          date: t.date.toISOString(),
          areas: JSON.parse(t.areas) as string[],
          duration: t.duration,
          status: t.status,
          notes: t.notes,
        })),
        plannings: s.plannings.map((p) => ({
          id: p.id,
          date: p.date.toISOString(),
          areas: JSON.parse(p.areas) as string[],
          notes: p.notes,
          done: p.done,
        })),
        payments: s.payments.map((p) => ({
          id: p.id,
          amount: p.amount,
          date: p.date.toISOString(),
          period: p.period,
          salaryType: p.salaryType,
          notes: p.notes,
        })),
      }))}
    />
  );
}
