import { prisma } from "@/lib/prisma";

export async function buildResidenceContext(): Promise<string> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const [
    residence,
    unitStats,
    lotStats,
    prospectStats,
    saleStats,
    openInterventions,
    recentReadings,
    openAlerts,
    monthExpenses,
    coOwners,
    recentSales,
    prestataires,
    expiringGuarantees,
    recentExpenses,
    unpaidInvoices,
    projectMemories,
    staffList,
  ] = await Promise.all([
    prisma.residence.findFirst(),
    prisma.unit.count(),
    prisma.lot.groupBy({ by: ["status"], _count: true }),
    prisma.prospect.groupBy({ by: ["status"], _count: true }),
    prisma.sale.groupBy({ by: ["status"], _count: true }),
    prisma.intervention.findMany({
      where: { status: { not: "COMPLETED" } },
      take: 8,
      orderBy: { date: "asc" },
      select: { title: true, status: true, date: true },
    }),
    prisma.meterReading.findMany({
      take: 10,
      orderBy: { date: "desc" },
      include: {
        meter: {
          select: {
            serialNumber: true,
            subscription: { select: { unit: { select: { name: true } } } },
          },
        },
      },
    }),
    prisma.alert.count({ where: { read: false } }),
    prisma.expense.aggregate({
      _sum: { amount: true },
      where: { date: { gte: startOfMonth } },
    }),
    prisma.coOwner.findMany({ orderBy: { order: "asc" } }),
    prisma.sale.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { lot: { select: { name: true } } },
    }),
    // Prestataires with financial summary
    prisma.prestataire.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        nomSociete: true,
        metier: true,
        responsable: true,
        telephone: true,
        statut: true,
        montantMarche: true,
        montantPaye: true,
        noteSatisfaction: true,
        garantieDuree: true,
        garantieExpiration: true,
        recommande: true,
        blackliste: true,
        dateDebut: true,
        dateFin: true,
        metierData: true,
        notes: true,
      },
    }),
    // Guarantees expiring in 30 days
    prisma.prestataire.findMany({
      where: {
        garantieExpiration: { gte: now, lte: in30Days },
      },
      select: { nomSociete: true, metier: true, garantieExpiration: true },
    }),
    // Recent expenses
    prisma.expense.findMany({
      take: 5,
      orderBy: { date: "desc" },
      select: { amount: true, title: true, date: true },
    }),
    // Unpaid invoices
    prisma.invoice.findMany({
      where: { paid: false },
      take: 10,
      orderBy: { dueDate: "asc" },
      select: {
        amount: true,
        paid: true,
        dueDate: true,
        subscription: { select: { unit: { select: { name: true } } } },
      },
    }).catch(() => []),
    // Project memories (autorisation construire, titre foncier, residence info)
    prisma.agentMemory.findMany({
      where: { key: { in: ["project:residence_info", "project:autorisation_construire", "project:titre_foncier"] } },
    }).catch(() => []),
    // Staff
    prisma.staff.findMany({
      where: { active: true },
      select: { id: true, name: true, role: true, phone: true, salary: true, salaryType: true },
    }).catch(() => []),
  ]);

  const lotStatusMap = Object.fromEntries(lotStats.map((g) => [g.status, g._count]));
  const prospectStatusMap = Object.fromEntries(prospectStats.map((g) => [g.status, g._count]));
  const saleStatusMap = Object.fromEntries(saleStats.map((g) => [g.status, g._count]));

  const anomalousReadings = recentReadings.filter(
    (r) => r.previousValue !== null && r.value < r.previousValue
  );

  // Prestataires summary
  const prestByMetier: Record<string, { count: number; totalMarche: number; totalPaye: number }> = {};
  let totalMarcheAll = 0, totalPayeAll = 0;
  for (const p of prestataires) {
    if (!prestByMetier[p.metier]) prestByMetier[p.metier] = { count: 0, totalMarche: 0, totalPaye: 0 };
    prestByMetier[p.metier].count++;
    prestByMetier[p.metier].totalMarche += p.montantMarche ?? 0;
    prestByMetier[p.metier].totalPaye += p.montantPaye ?? 0;
    totalMarcheAll += p.montantMarche ?? 0;
    totalPayeAll += p.montantPaye ?? 0;
  }

  const prestataireLines = prestataires.map(p => {
    const reste = (p.montantMarche ?? 0) - (p.montantPaye ?? 0);
    const md = p.metierData ? (() => { try { return JSON.parse(p.metierData!); } catch { return {}; } })() : {};
    const keyFields = Object.entries(md as Record<string, unknown>).slice(0, 3).map(([k, v]) => `${k}=${v}`).join(', ');
    return `  • [${p.metier}] ${p.nomSociete}${p.responsable ? ` (${p.responsable})` : ''}${p.telephone ? ` tél:${p.telephone}` : ''} | Statut:${p.statut} | Marché:${(p.montantMarche ?? 0).toLocaleString('fr-MA')} MAD | Payé:${(p.montantPaye ?? 0).toLocaleString('fr-MA')} MAD | Reste:${reste.toLocaleString('fr-MA')} MAD${p.noteSatisfaction ? ` | Note:${p.noteSatisfaction}/5` : ''}${p.recommande ? ' ✓RECOMMANDÉ' : ''}${p.blackliste ? ' ⚠BLACKLISTÉ' : ''}${keyFields ? ` | ${keyFields}` : ''}`;
  }).join('\n');

  const memoryMap = Object.fromEntries(projectMemories.map(m => [m.key, { value: m.value, context: m.context }]));
  const residenceInfo = memoryMap["project:residence_info"];
  const dacInfo = memoryMap["project:autorisation_construire"];
  const tfInfo = memoryMap["project:titre_foncier"];

  const ctx = `
=== CONTEXTE RÉSIDENCE LES ORCHIDÉES 2 ===
Date: ${now.toLocaleDateString("fr-MA", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
Résidence: ${residence?.name ?? "Les Orchidées 2"} — ${residence?.address ?? ""} ${residence?.city ?? "Oulad Saleh, Casablanca"}
${tfInfo ? `Titre Foncier: ${tfInfo.value}${tfInfo.context ? ` — ${tfInfo.context}` : ""}` : ""}
${dacInfo ? `Autorisation de Construire: ${dacInfo.value}${dacInfo.context ? `\n${dacInfo.context}` : ""}` : ""}
${residenceInfo ? `Structure résidence: ${residenceInfo.value}${residenceInfo.context ? `\n${residenceInfo.context}` : ""}` : ""}

--- GESTION TECHNIQUE ---
Unités: ${unitStats} | Interventions ouvertes: ${openInterventions.length} | Alertes non lues: ${openAlerts}
${openInterventions.map((i) => `  • ${i.title} [${i.status}]`).join('\n')}
Relevés récents:
${recentReadings.map((r) => `  • ${r.meter.subscription.unit?.name ?? 'Général'} | ${r.meter.serialNumber} | ${r.value}${r.previousValue !== null ? ` (conso:${(r.value - r.previousValue).toFixed(1)})` : ''}`).join('\n')}
${anomalousReadings.length > 0 ? `⚠️ ANOMALIES: ${anomalousReadings.map((r) => r.meter.subscription.unit?.name).join(', ')}` : ''}

--- CORPS DE MÉTIER / PRESTATAIRES (${prestataires.length} total) ---
Total marchés: ${totalMarcheAll.toLocaleString('fr-MA')} MAD | Total payé: ${totalPayeAll.toLocaleString('fr-MA')} MAD | Reste: ${(totalMarcheAll - totalPayeAll).toLocaleString('fr-MA')} MAD
${prestataireLines || '  Aucun prestataire enregistré'}
${expiringGuarantees.length > 0 ? `⚠️ GARANTIES EXPIRANT DANS 30J: ${expiringGuarantees.map(p => `${p.nomSociete} (${new Date(p.garantieExpiration!).toLocaleDateString('fr-FR')})`).join(', ')}` : ''}

--- COMPTABILITÉ ---
Dépenses ce mois: ${(monthExpenses._sum.amount ?? 0).toLocaleString('fr-MA')} MAD
Dernières dépenses: ${recentExpenses.map(e => `${e.title} ${e.amount.toLocaleString('fr-MA')} MAD`).join(' | ')}
${unpaidInvoices.length > 0 ? `Factures impayées (${unpaidInvoices.length}): ${unpaidInvoices.slice(0, 5).map(i => `${i.subscription?.unit?.name ?? '?'} ${i.amount.toLocaleString('fr-MA')} MAD`).join(', ')}` : 'Aucune facture impayée'}

--- VENTE IMMOBILIÈRE ---
Lots: Disponibles:${lotStatusMap['DISPONIBLE'] ?? 0} | Réservés:${lotStatusMap['RESERVE'] ?? 0} | Vendus:${lotStatusMap['VENDU'] ?? 0}
Prospects: Nouveaux:${prospectStatusMap['NOUVEAU'] ?? 0} | Contactés:${prospectStatusMap['CONTACTE'] ?? 0} | Négociation:${prospectStatusMap['NEGOCIATION'] ?? 0} | Signés:${prospectStatusMap['SIGNE'] ?? 0}
Ventes récentes: ${recentSales.map((s) => `Lot ${s.lot.name} ${s.totalAmount.toLocaleString('fr-MA')} MAD [${s.status}]`).join(' | ')}

--- COPROPRIÉTAIRES ---
${coOwners.map((co) => `  • ${co.name}: ${co.sharePercent}%`).join('\n')}

--- PERSONNEL ACTIF ---
${staffList.length === 0 ? "  Aucun personnel enregistré" : staffList.map(s => `  • ${s.name} [${s.role}]${s.phone ? ` tél:${s.phone}` : ""}${s.salary ? ` | Salaire:${s.salary} MAD/${s.salaryType}` : ""}`).join('\n')}
===========================================
`;

  return ctx;
}
