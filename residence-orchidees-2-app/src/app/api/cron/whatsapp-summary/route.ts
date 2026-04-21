import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyAllOwners } from "@/lib/whatsapp";

// Vercel Cron déclenche cette route tous les jours à 9h UTC (10h Maroc été / 9h hiver)
// Vérifie le secret pour éviter les appels non autorisés
export async function GET(req: NextRequest) {
  const secret = req.headers.get("authorization");
  if (secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const today = now.toISOString().split("T")[0];

  // ─── 1. Factures impayées ce mois ─────────────────────────────────────────
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const unpaidInvoices = await prisma.invoice.findMany({
    where: { paid: false, period: { gte: startMonth } },
    include: { subscription: { include: { unit: true } } },
    orderBy: { dueDate: "asc" },
  });

  // ─── 2. Compteurs sans relevé depuis 30j ──────────────────────────────────
  const since30 = new Date(); since30.setDate(since30.getDate() - 30);
  const allMeters = await prisma.meter.findMany({
    where: { subscription: { status: "ACTIVE" } },
    include: {
      subscription: { include: { unit: true } },
      readings: { orderBy: { date: "desc" }, take: 1 },
    },
  });
  const missingReadings = allMeters.filter(
    m => !m.readings[0] || new Date(m.readings[0].date) < since30
  );

  // ─── 3. Garanties expirant dans 30j ───────────────────────────────────────
  const in30 = new Date(); in30.setDate(in30.getDate() + 30);
  const expiringSoon = await prisma.prestataire.findMany({
    where: { garantieExpiration: { gte: now, lte: in30 } },
    orderBy: { garantieExpiration: "asc" },
  });

  // ─── 4. Prospects sans contact depuis 7j ──────────────────────────────────
  const since7 = new Date(); since7.setDate(since7.getDate() - 7);
  const coldProspects = await prisma.prospect.findMany({
    where: {
      status: { notIn: ["SIGNE", "PERDU"] },
      updatedAt: { lt: since7 },
    },
    orderBy: { updatedAt: "asc" },
    take: 5,
  });

  // ─── 5. Interventions non clôturées ───────────────────────────────────────
  const openInterventions = await prisma.intervention.findMany({
    where: { status: { in: ["PENDING", "IN_PROGRESS"] } },
    orderBy: { date: "asc" },
  });

  // ─── Composer le message WhatsApp ────────────────────────────────────────
  const lines: string[] = [];
  lines.push(`🌸 *Résumé Orchidées 2 — ${today}*`);
  lines.push("");

  if (unpaidInvoices.length > 0) {
    const total = unpaidInvoices.reduce((s, i) => s + i.amount, 0);
    lines.push(`💰 *Factures impayées : ${unpaidInvoices.length}* (${total.toLocaleString("fr-MA")} MAD)`);
    unpaidInvoices.slice(0, 3).forEach(inv => {
      lines.push(`  • ${inv.subscription.unit?.name ?? "Général"} — ${inv.amount} MAD${inv.dueDate ? ` (éch. ${new Date(inv.dueDate).toLocaleDateString("fr-MA")})` : ""}`);
    });
    lines.push("");
  }

  if (missingReadings.length > 0) {
    lines.push(`📊 *Relevés manquants : ${missingReadings.length} compteurs*`);
    missingReadings.slice(0, 4).forEach(m => {
      lines.push(`  • ${m.subscription.unit?.name ?? m.serialNumber}`);
    });
    lines.push("");
  }

  if (expiringSoon.length > 0) {
    lines.push(`🛡️ *Garanties expirant dans 30j : ${expiringSoon.length}*`);
    expiringSoon.forEach(p => {
      const d = p.garantieExpiration ? new Date(p.garantieExpiration).toLocaleDateString("fr-MA") : "?";
      lines.push(`  • ${p.nomSociete} — expire le ${d}`);
    });
    lines.push("");
  }

  if (coldProspects.length > 0) {
    lines.push(`👤 *Prospects sans contact depuis 7j : ${coldProspects.length}*`);
    coldProspects.forEach(p => {
      lines.push(`  • ${p.name}${p.phone ? ` (${p.phone})` : ""}`);
    });
    lines.push("");
  }

  if (openInterventions.length > 0) {
    lines.push(`🔧 *Interventions ouvertes : ${openInterventions.length}*`);
    openInterventions.slice(0, 3).forEach(i => {
      lines.push(`  • ${i.title} (${i.status === "PENDING" ? "En attente" : "En cours"})`);
    });
    lines.push("");
  }

  if (lines.length <= 2) {
    lines.push("✅ Tout est en ordre aujourd'hui !");
  }

  const message = lines.join("\n");

  // ─── Envoyer via UltraMsg (tous les copropriétaires) ─────────────────────
  let whatsappSent = false;
  try {
    await notifyAllOwners(message);
    whatsappSent = true;
  } catch { whatsappSent = false; }

  // ─── Sauvegarder en mémoire Orchid ────────────────────────────────────────
  await prisma.agentMemory.upsert({
    where: { key: "system:last_daily_summary" },
    create: { key: "system:last_daily_summary", value: today, context: `${unpaidInvoices.length} factures, ${missingReadings.length} relevés manquants, ${openInterventions.length} interventions` },
    update: { value: today, context: `${unpaidInvoices.length} factures, ${missingReadings.length} relevés manquants, ${openInterventions.length} interventions` },
  });

  return NextResponse.json({
    ok: true,
    date: today,
    whatsappSent,
    summary: {
      unpaidInvoices: unpaidInvoices.length,
      missingReadings: missingReadings.length,
      expiringSoon: expiringSoon.length,
      coldProspects: coldProspects.length,
      openInterventions: openInterventions.length,
    },
    message,
  });
}
