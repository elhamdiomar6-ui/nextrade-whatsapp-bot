import { NextRequest, NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const year  = parseInt(searchParams.get("year")  ?? String(new Date().getFullYear()));
  const month = parseInt(searchParams.get("month") ?? String(new Date().getMonth() + 1));

  const from = new Date(year, month - 1, 1);
  const to   = new Date(year, month, 0, 23, 59, 59);

  const [readings, expenses, interventions, sales, coOwners] = await Promise.all([
    prisma.meterReading.findMany({
      where: { date: { gte: from, lte: to } },
      include: { meter: { include: { subscription: { include: { unit: true } } } } },
      orderBy: { date: "asc" },
    }),
    prisma.expense.findMany({
      where: { date: { gte: from, lte: to } },
      include: { category: true },
      orderBy: { date: "asc" },
    }),
    prisma.intervention.findMany({
      where: { date: { gte: from, lte: to } },
      include: { contractor: true },
      orderBy: { date: "asc" },
    }),
    prisma.sale.findMany({
      where: { createdAt: { gte: from, lte: to } },
      include: { lot: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.coOwner.findMany({ orderBy: { order: "asc" } }),
  ]);

  const monthName = from.toLocaleDateString("fr-MA", { month: "long", year: "numeric" });
  const totalExpenses    = expenses.reduce((s, e) => s + e.amount, 0);
  const totalSalesAmount = sales.reduce((s, v) => s + v.totalAmount, 0);

  // ── Génération PDF ─────────────────────────────────────────────────────────
  const buffers: Buffer[] = [];
  const doc = new PDFDocument({ margin: 40, size: "A4" });

  doc.on("data", (b: Buffer) => buffers.push(b));

  const endDoc = (): Promise<Buffer> =>
    new Promise((resolve) => {
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.end();
    });

  // ── Helpers ────────────────────────────────────────────────────────────────
  const GREEN  = "#15803d";
  const GRAY   = "#6b7280";
  const DARK   = "#111827";
  const LGRAY  = "#f3f4f6";

  function sectionTitle(title: string) {
    doc.moveDown(0.6)
       .fillColor(GREEN).fontSize(11).font("Helvetica-Bold").text(title.toUpperCase())
       .fillColor(GRAY) .fontSize(8) .font("Helvetica")
       .moveDown(0.2);
    doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor("#d1fae5").lineWidth(1).stroke();
    doc.moveDown(0.4);
  }

  function tableRow(cols: string[], widths: number[], isHeader = false) {
    const rowH = 18;
    const startX = 40;
    let x = startX;
    const y = doc.y;

    if (isHeader) {
      doc.rect(startX, y, widths.reduce((a, b) => a + b, 0), rowH).fill(GREEN);
    } else if (doc.y % 36 < rowH) {
      doc.rect(startX, y, widths.reduce((a, b) => a + b, 0), rowH).fill(LGRAY);
    }

    cols.forEach((col, i) => {
      doc.fillColor(isHeader ? "white" : DARK)
         .fontSize(8)
         .font(isHeader ? "Helvetica-Bold" : "Helvetica")
         .text(col, x + 3, y + 5, { width: widths[i] - 6, lineBreak: false });
      x += widths[i];
    });

    doc.y = y + rowH;
    doc.x = startX;
  }

  // ── En-tête ────────────────────────────────────────────────────────────────
  doc.rect(0, 0, 595, 80).fill(GREEN);
  doc.fillColor("white")
     .fontSize(18).font("Helvetica-Bold")
     .text("Résidence Les Orchidées 2", 40, 20);
  doc.fontSize(10).font("Helvetica")
     .text(`Rapport mensuel — ${monthName}`, 40, 44);
  doc.fontSize(8)
     .text(`Oulad Saleh, Casablanca  ·  Généré le ${new Date().toLocaleDateString("fr-MA")}`, 40, 60);
  doc.y = 100;

  // ── Résumé synthétique ─────────────────────────────────────────────────────
  sectionTitle("Résumé du mois");
  const kpis = [
    ["Relevés saisis",      String(readings.length)],
    ["Dépenses totales",    `${totalExpenses.toLocaleString("fr-MA")} MAD`],
    ["Interventions",       String(interventions.length)],
    ["Ventes",              String(sales.length)],
    ["CA ventes",           `${totalSalesAmount.toLocaleString("fr-MA")} MAD`],
  ];
  kpis.forEach(([label, val]) => {
    doc.fillColor(GRAY).fontSize(8).font("Helvetica").text(`${label} :`, 40, doc.y, { continued: true, width: 200 });
    doc.fillColor(DARK).font("Helvetica-Bold").text(` ${val}`);
  });

  // ── Relevés ───────────────────────────────────────────────────────────────
  if (readings.length > 0) {
    sectionTitle(`Relevés compteurs (${readings.length})`);
    tableRow(["Unité", "N° Compteur", "Relevé (m³)", "Conso.", "Statut"], [100, 120, 90, 80, 80], true);
    for (const r of readings) {
      const unit  = r.meter.subscription.unit?.name ?? "—";
      const conso = r.previousValue !== null ? `${(r.value - r.previousValue).toFixed(2)}` : "—";
      const anomaly = r.previousValue !== null && r.value < r.previousValue ? "⚠ ANOMALIE" : "✓ Normal";
      tableRow([unit, r.meter.serialNumber, String(r.value), conso, anomaly], [100, 120, 90, 80, 80]);
    }
  }

  // ── Dépenses ─────────────────────────────────────────────────────────────
  if (expenses.length > 0) {
    if (doc.y > 650) doc.addPage();
    sectionTitle(`Dépenses (${expenses.length}) — Total : ${totalExpenses.toLocaleString("fr-MA")} MAD`);
    tableRow(["Description", "Catégorie", "Montant", "Date"], [220, 130, 100, 65], true);
    for (const e of expenses) {
      tableRow([
        e.title,
        e.category.nameFr,
        `${e.amount.toLocaleString("fr-MA")} MAD`,
        e.date.toLocaleDateString("fr-MA"),
      ], [220, 130, 100, 65]);
    }
  }

  // ── Interventions ─────────────────────────────────────────────────────────
  if (interventions.length > 0) {
    if (doc.y > 650) doc.addPage();
    sectionTitle(`Interventions (${interventions.length})`);
    tableRow(["Titre", "Prestataire", "Statut", "Date"], [230, 140, 80, 65], true);
    for (const i of interventions) {
      tableRow([
        i.title,
        i.contractor?.name ?? "—",
        i.status,
        i.date.toLocaleDateString("fr-MA"),
      ], [230, 140, 80, 65]);
    }
  }

  // ── Ventes ────────────────────────────────────────────────────────────────
  if (sales.length > 0) {
    if (doc.y > 650) doc.addPage();
    sectionTitle(`Ventes (${sales.length}) — CA : ${totalSalesAmount.toLocaleString("fr-MA")} MAD`);
    tableRow(["Lot", "Acheteur", "Montant", "Acompte", "Statut"], [70, 150, 110, 100, 85], true);
    for (const s of sales) {
      tableRow([
        s.lot.name,
        s.buyerName ?? "—",
        `${s.totalAmount.toLocaleString("fr-MA")} MAD`,
        `${s.depositAmount.toLocaleString("fr-MA")} MAD`,
        s.status,
      ], [70, 150, 110, 100, 85]);
    }
  }

  // ── Parts copropriétaires ─────────────────────────────────────────────────
  if (totalSalesAmount > 0 && coOwners.length > 0) {
    if (doc.y > 650) doc.addPage();
    sectionTitle("Distribution théorique entre copropriétaires");
    tableRow(["Copropriétaire", "Part (%)", "Montant théorique (MAD)"], [250, 80, 185], true);
    for (const co of coOwners) {
      const share = totalSalesAmount * (co.sharePercent / 100);
      tableRow([co.name, `${co.sharePercent}%`, share.toLocaleString("fr-MA")], [250, 80, 185]);
    }
  }

  // ── Pied de page ──────────────────────────────────────────────────────────
  doc.moveDown(2)
     .fillColor(GRAY).fontSize(7)
     .text(`Document confidentiel — Résidence Les Orchidées 2, Casablanca — ${new Date().toLocaleDateString("fr-MA")}`, { align: "center" });

  const pdfBuffer = await endDoc();

  return new NextResponse(pdfBuffer as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="orchidees2-rapport-${year}-${String(month).padStart(2, "0")}.pdf"`,
    },
  });
}
