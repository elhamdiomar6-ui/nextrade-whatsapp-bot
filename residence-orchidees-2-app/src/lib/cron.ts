import cron from "node-cron";
import { prisma } from "./prisma";
import { sendWhatsApp, getOmarPhone } from "./whatsapp";

let started = false;

export function startCronJobs(): void {
  if (started) return;
  started = true;

  // Tous les jours à 09h00
  cron.schedule("0 9 * * *", async () => {
    console.log("[Cron] Vérification quotidienne démarrée");
    await sendDailySummary();
    await checkOverdueInvoices();
    await checkStaleProspects();
    await checkOpenInterventions();
    console.log("[Cron] Vérification terminée");
  });

  console.log("[Cron] ✓ Planificateur démarré (quotidien 09:00)");
}

// ─── Résumé quotidien Orchid 🌸 ──────────────────────────────────────────────
async function sendDailySummary(): Promise<void> {
  const omar = await getOmarPhone();
  if (!omar) return;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const [
    openAlerts,
    openInterventions,
    monthExpenses,
    unpaidInvoices,
    expiringGuarantees,
    staleProspects,
    lotStats,
  ] = await Promise.all([
    prisma.alert.count({ where: { read: false } }),
    prisma.intervention.count({ where: { status: { in: ["PENDING", "IN_PROGRESS"] } } }),
    prisma.expense.aggregate({ _sum: { amount: true }, where: { date: { gte: startOfMonth } } }),
    prisma.invoice.findMany({ where: { paid: false }, select: { amount: true } }).catch(() => [] as { amount: number }[]),
    prisma.prestataire.count({ where: { garantieExpiration: { gte: now, lte: in30Days } } }),
    prisma.prospect.count({ where: { status: { notIn: ["SIGNE", "PERDU"] }, updatedAt: { lte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } } }),
    prisma.lot.groupBy({ by: ["status"], _count: true }),
  ]);

  const lotsDisponibles = lotStats.find(l => l.status === "DISPONIBLE")?._count ?? 0;
  const lotsReserves = lotStats.find(l => l.status === "RESERVE")?._count ?? 0;
  const totalImpaye = unpaidInvoices.reduce((s, i) => s + i.amount, 0);
  const depensesMois = monthExpenses._sum.amount ?? 0;

  const dateStr = now.toLocaleDateString("fr-MA", { weekday: "long", day: "numeric", month: "long" });

  const lines: string[] = [
    `🌸 *Orchid — Résumé du ${dateStr}*`,
    `_Résidence Les Orchidées 2_`,
    ``,
  ];

  // Alertes & urgences
  const urgences: string[] = [];
  if (openAlerts > 0) urgences.push(`⚠️ ${openAlerts} alerte${openAlerts > 1 ? "s" : ""} non lue${openAlerts > 1 ? "s" : ""}`);
  if (openInterventions > 0) urgences.push(`🔧 ${openInterventions} intervention${openInterventions > 1 ? "s" : ""} en cours`);
  if (expiringGuarantees > 0) urgences.push(`🛡️ ${expiringGuarantees} garantie${expiringGuarantees > 1 ? "s" : ""} expirent dans 30j`);
  if (staleProspects > 0) urgences.push(`📞 ${staleProspects} prospect${staleProspects > 1 ? "s" : ""} sans contact +7j`);

  if (urgences.length > 0) {
    lines.push(`*📋 Points d'attention :*`);
    urgences.forEach(u => lines.push(u));
    lines.push(``);
  }

  // Finances
  lines.push(`*💰 Finances (ce mois) :*`);
  lines.push(`• Dépenses : ${depensesMois.toLocaleString("fr-MA")} MAD`);
  if (totalImpaye > 0) {
    lines.push(`• Impayés : ${totalImpaye.toLocaleString("fr-MA")} MAD (${unpaidInvoices.length} facture${unpaidInvoices.length > 1 ? "s" : ""})`);
  }
  lines.push(``);

  // Ventes
  if (lotsDisponibles > 0 || lotsReserves > 0) {
    lines.push(`*🏠 Ventes :*`);
    lines.push(`• ${lotsDisponibles} lot${lotsDisponibles > 1 ? "s" : ""} disponible${lotsDisponibles > 1 ? "s" : ""}`);
    if (lotsReserves > 0) lines.push(`• ${lotsReserves} lot${lotsReserves > 1 ? "s" : ""} réservé${lotsReserves > 1 ? "s" : ""}`);
    lines.push(``);
  }

  lines.push(`_Bonne journée ! 🌟_`);

  await sendWhatsApp(omar, lines.join("\n"));
  console.log("[Cron] ✓ Résumé quotidien envoyé");
}

// ─── Factures impayées J+5 ────────────────────────────────────────────────────
async function checkOverdueInvoices(): Promise<void> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 5);

  const overdue = await prisma.invoice.findMany({
    where: { paid: false, dueDate: { not: null, lte: cutoff } },
    include: { subscription: { include: { unit: true } } },
  });

  if (overdue.length === 0) return;

  const omar = await getOmarPhone();
  if (!omar) return;

  const lines = overdue.map((inv) => {
    const unit = inv.subscription.unit?.name ?? "Général";
    const due  = inv.dueDate?.toLocaleDateString("fr-MA") ?? "—";
    return `• ${unit} — ${inv.amount.toLocaleString()} MAD (éch. ${due})`;
  });

  await sendWhatsApp(
    omar,
    `⚠️ *Orchidées 2 — Factures impayées J+5*\n${lines.join("\n")}\n\nMerci de régulariser.`
  );
}

// ─── Prospects sans contact J+7 ───────────────────────────────────────────────
async function checkStaleProspects(): Promise<void> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);

  const stale = await prisma.prospect.findMany({
    where: {
      status: { notIn: ["SIGNE", "PERDU"] },
      updatedAt: { lte: cutoff },
    },
  });

  if (stale.length === 0) return;

  const omar = await getOmarPhone();
  if (!omar) return;

  const lines = stale.map((p) => `• ${p.name} (${p.phone ?? "sans tél."})`);
  await sendWhatsApp(
    omar,
    `📊 *Orchidées 2 — Prospects inactifs +7 jours*\n${lines.join("\n")}\n\nRelance recommandée.`
  );
}

// ─── Interventions non clôturées J+7 ─────────────────────────────────────────
async function checkOpenInterventions(): Promise<void> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);

  const open = await prisma.intervention.findMany({
    where: {
      status: { in: ["PENDING", "IN_PROGRESS"] },
      createdAt: { lte: cutoff },
    },
  });

  if (open.length === 0) return;

  const omar = await getOmarPhone();
  if (!omar) return;

  const lines = open.map((i) => `• ${i.title} (${i.status})`);
  await sendWhatsApp(
    omar,
    `🔧 *Orchidées 2 — Interventions ouvertes +7 jours*\n${lines.join("\n")}\n\nAction requise.`
  );
}
