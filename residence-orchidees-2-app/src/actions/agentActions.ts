"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ── Helpers ────────────────────────────────────────────────────────────────────

async function getResidence() {
  const r = await prisma.residence.findFirst();
  if (!r) throw new Error("Résidence introuvable");
  return r;
}

export async function agentCreatePrestataire(data: {
  metier: string;
  nomSociete: string;
  responsable?: string;
  telephone?: string;
  adresse?: string;
  montantMarche?: number;
  montantPaye?: number;
  metierData?: Record<string, string>;
  notes?: string;
}) {
  await prisma.prestataire.create({
    data: {
      metier: data.metier as any,
      nomSociete: data.nomSociete,
      responsable: data.responsable,
      telephone: data.telephone,
      adresse: data.adresse,
      montantMarche: data.montantMarche,
      montantPaye: data.montantPaye ?? 0,
      statut: "EN_COURS" as any,
      metierData: data.metierData ? JSON.stringify(data.metierData) : null,
      notes: data.notes,
    },
  });
  revalidatePath("/dashboard/prestataires");
}

export async function agentSaveMemory(key: string, value: string, context?: string) {
  await prisma.agentMemory.upsert({
    where: { key },
    update: { value, context, updatedAt: new Date() },
    create: { key, value, context },
  });
}

export async function agentGetMemory(key: string): Promise<string | null> {
  const m = await prisma.agentMemory.findUnique({ where: { key } });
  return m?.value ?? null;
}

// ── Invoice ────────────────────────────────────────────────────────────────────

export async function agentCreateInvoice(data: {
  unitName: string;
  serviceType: string;
  reference?: string;
  amount: number;
  period: string;        // "YYYY-MM" or "YYYY-MM-DD"
  dueDate?: string;
  previousIndex?: number;
  currentIndex?: number;
}) {
  const unit = await prisma.unit.findFirst({
    where: { name: { equals: data.unitName, mode: "insensitive" } },
    include: {
      subscriptions: {
        where: { serviceType: data.serviceType as never },
        include: { meters: { take: 1 } },
      },
    },
  });
  if (!unit) throw new Error(`Unité "${data.unitName}" introuvable`);
  const sub = unit.subscriptions[0];
  if (!sub) throw new Error(`Abonnement ${data.serviceType} pour ${data.unitName} introuvable`);

  const period = data.period.length === 7 ? data.period + "-01" : data.period;
  const invoice = await prisma.invoice.create({
    data: {
      subscriptionId: sub.id,
      reference: data.reference || null,
      amount: data.amount,
      period: new Date(period),
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      paid: false,
    },
  });

  if (data.currentIndex !== undefined && sub.meters[0]) {
    const meter = sub.meters[0];
    const lastReading = await prisma.meterReading.findFirst({
      where: { meterId: meter.id },
      orderBy: { date: "desc" },
    });
    await prisma.meterReading.create({
      data: {
        meterId: meter.id,
        value: data.currentIndex,
        previousValue: data.previousIndex ?? lastReading?.value ?? null,
        date: new Date(),
        mode: "MANUAL",
      },
    });
    revalidatePath("/dashboard/readings");
  }

  revalidatePath("/dashboard/invoices");
  return invoice.id;
}

export async function agentMarkInvoicePaid(data: { invoiceId: string; paid?: boolean }) {
  const paid = data.paid !== false;
  await prisma.invoice.update({
    where: { id: data.invoiceId },
    data: { paid, paidAt: paid ? new Date() : null },
  });
  revalidatePath("/dashboard/invoices");
}

// ── Meter Reading ──────────────────────────────────────────────────────────────

export async function agentCreateReading(data: {
  unitName: string;
  serviceType: string;
  value: number;
  previousValue?: number;
  date?: string;
  notes?: string;
}) {
  const unit = await prisma.unit.findFirst({
    where: { name: { equals: data.unitName, mode: "insensitive" } },
    include: {
      subscriptions: {
        where: { serviceType: data.serviceType as never },
        include: { meters: { take: 1 } },
      },
    },
  });
  if (!unit) throw new Error(`Unité "${data.unitName}" introuvable`);
  const meter = unit.subscriptions[0]?.meters[0];
  if (!meter) throw new Error(`Compteur ${data.serviceType} pour ${data.unitName} introuvable`);

  const lastReading = await prisma.meterReading.findFirst({
    where: { meterId: meter.id },
    orderBy: { date: "desc" },
  });
  await prisma.meterReading.create({
    data: {
      meterId: meter.id,
      value: data.value,
      previousValue: data.previousValue ?? lastReading?.value ?? null,
      date: data.date ? new Date(data.date) : new Date(),
      mode: "MANUAL",
      notes: data.notes || null,
    },
  });
  revalidatePath("/dashboard/readings");
}

// ── Expense ────────────────────────────────────────────────────────────────────

export async function agentCreateExpense(data: {
  title: string;
  amount: number;
  categoryCode?: string;
  description?: string;
  date?: string;
}) {
  const residence = await getResidence();
  const code = (data.categoryCode ?? "OTHER").toUpperCase();
  let category = await prisma.expenseCategory.findFirst({ where: { code: code as never } });
  if (!category) category = await prisma.expenseCategory.findFirst({ where: { code: "OTHER" as never } });
  if (!category) throw new Error("Catégorie dépense introuvable");

  await prisma.expense.create({
    data: {
      title: data.title,
      amount: data.amount,
      description: data.description || null,
      date: data.date ? new Date(data.date) : new Date(),
      categoryId: category.id,
      residenceId: residence.id,
    },
  });
  revalidatePath("/dashboard/expenses");
}

// ── Intervention ───────────────────────────────────────────────────────────────

export async function agentCreateIntervention(data: {
  title: string;
  description?: string;
  date?: string;
}) {
  const residence = await getResidence();
  await prisma.intervention.create({
    data: {
      title: data.title,
      description: data.description || null,
      date: data.date ? new Date(data.date) : new Date(),
      status: "PENDING" as never,
      residenceId: residence.id,
    },
  });
  revalidatePath("/dashboard/interventions");
}

// ── Staff ──────────────────────────────────────────────────────────────────────

export async function agentCreateStaffTask(data: {
  staffName: string;
  date: string;
  areas: string[];
  duration?: number;
  status?: string;
  notes?: string;
}) {
  const staff = await prisma.staff.findFirst({
    where: { name: { contains: data.staffName, mode: "insensitive" } },
  });
  if (!staff) throw new Error(`Personnel "${data.staffName}" introuvable`);
  await prisma.staffTask.create({
    data: {
      staffId: staff.id,
      date: new Date(data.date),
      areas: JSON.stringify(data.areas),
      duration: data.duration ?? null,
      status: (data.status as never) ?? "DONE",
      notes: data.notes || null,
    },
  });
  revalidatePath("/dashboard/personnel");
}

export async function agentCreateStaffPayment(data: {
  staffName: string;
  amount: number;
  date: string;
  period?: string;
  notes?: string;
}) {
  const staff = await prisma.staff.findFirst({
    where: { name: { contains: data.staffName, mode: "insensitive" } },
  });
  if (!staff) throw new Error(`Personnel "${data.staffName}" introuvable`);
  await prisma.staffPayment.create({
    data: {
      staffId: staff.id,
      amount: data.amount,
      date: new Date(data.date),
      period: data.period || null,
      salaryType: staff.salaryType,
      notes: data.notes || null,
    },
  });
  revalidatePath("/dashboard/personnel");
}

// ── Alert count ────────────────────────────────────────────────────────────────

export async function agentGetAlertCount(): Promise<number> {
  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const [alerts, guarantees, unpaidInvoices] = await Promise.all([
    prisma.alert.count({ where: { read: false } }),
    prisma.prestataire.count({ where: { garantieExpiration: { gte: now, lte: in30Days } } }),
    prisma.invoice.count({ where: { paid: false } }).catch(() => 0),
  ]);
  return alerts + guarantees + unpaidInvoices;
}
