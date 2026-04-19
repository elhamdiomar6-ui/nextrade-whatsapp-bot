"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { fmt } from "@/lib/fmt";
import { markAllNotificationsRead } from "@/actions/notifications";
import { useRouter } from "next/navigation";

const SERVICE_LABELS: Record<string, { fr: string; icon: string }> = {
  WATER:       { fr: "Eau",          icon: "💧" },
  ELECTRICITY: { fr: "Électricité",  icon: "⚡" },
  GAS:         { fr: "Gaz",          icon: "🔥" },
  INTERNET:    { fr: "Internet",     icon: "🌐" },
  PHONE:       { fr: "Téléphone",    icon: "📞" },
  OTHER:       { fr: "Autre",        icon: "📦" },
};

const NOTIF_ICONS: Record<string, string> = {
  FACTURE: "🧾", RELEVE: "📊", INTERVENTION: "🔧", MESSAGE: "💬", INFO: "ℹ️",
};

interface Props {
  unit: {
    id: string; name: string; kind: string; floor?: number | null;
    occupantName?: string | null; occupantType?: string | null;
    subscriptions: {
      id: string; serviceType: string; status: string;
      meters: {
        id: string; serialNumber: string; serviceType: string;
        readings: { id: string; value: number; previousValue?: number | null; date: string }[];
      }[];
      invoices: { id: string; reference?: string | null; amount: number; period: string; dueDate?: string | null; paid: boolean }[];
      documents: { id: string; title: string; type: string; url: string; createdAt: string }[];
    }[];
  };
  userName: string;
  interventions: { id: string; title: string; status: string; date: string }[];
  notifications: { id: string; title: string; body: string; type: string; link?: string | null; createdAt: string }[];
  unreadMessages: number;
}

export function MonEspaceClient({ unit, userName, interventions, notifications, unreadMessages }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [showNotifs, setShowNotifs] = useState(false);

  const allMeters = unit.subscriptions.flatMap(s => s.meters);
  const allInvoices = unit.subscriptions.flatMap(s => s.invoices);
  const allDocuments = unit.subscriptions.flatMap(s => s.documents);
  const pendingInvoices = allInvoices.filter(i => !i.paid);
  const pendingTotal = pendingInvoices.reduce((acc, i) => acc + i.amount, 0);

  const waterMeter = allMeters.find(m => m.serviceType === "WATER");
  const elecMeter = allMeters.find(m => m.serviceType === "ELECTRICITY");

  function handleMarkRead() {
    startTransition(async () => {
      await markAllNotificationsRead();
      router.refresh();
      setShowNotifs(false);
    });
  }

  const unitKindLabel = { APARTMENT: "Appartement", SHOP: "Magasin", CONCIERGE: "Concierge", COMMON: "Partie commune" }[unit.kind] ?? unit.kind;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 20px" }}>

      {/* ── HEADER ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
        <div>
          <p style={{ fontSize: 13, color: "#6b7280", fontWeight: 500, marginBottom: 4 }}>Bonjour,</p>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#111827", lineHeight: 1.2 }}>{userName} 👋</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
            <span style={{ background: "#dcfce7", color: "#166534", fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 20 }}>
              🏠 {unitKindLabel} {unit.name}
            </span>
            {unit.floor != null && (
              <span style={{ background: "#f3f4f6", color: "#6b7280", fontSize: 12, padding: "4px 10px", borderRadius: 20 }}>
                Étage {unit.floor}
              </span>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {/* Notifications bell */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              style={{ position: "relative", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 10, padding: "10px 14px", cursor: "pointer", fontSize: 18 }}
            >
              🔔
              {notifications.length > 0 && (
                <span style={{ position: "absolute", top: -4, right: -4, background: "#ef4444", color: "#fff", fontSize: 10, fontWeight: 800, width: 18, height: 18, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {notifications.length}
                </span>
              )}
            </button>
            {showNotifs && (
              <div style={{ position: "absolute", right: 0, top: "100%", marginTop: 8, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,.12)", width: 320, zIndex: 100 }}>
                <div style={{ padding: "14px 16px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>Notifications</span>
                  <button onClick={handleMarkRead} style={{ fontSize: 12, color: "#166534", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>Tout marquer lu</button>
                </div>
                <div style={{ maxHeight: 320, overflowY: "auto" }}>
                  {notifications.length === 0 ? (
                    <p style={{ padding: 20, textAlign: "center", color: "#9ca3af", fontSize: 13 }}>Aucune notification</p>
                  ) : notifications.map(n => (
                    <div key={n.id} style={{ padding: "12px 16px", borderBottom: "1px solid #f9fafb" }}>
                      <div style={{ display: "flex", gap: 10 }}>
                        <span style={{ fontSize: 20, flexShrink: 0 }}>{NOTIF_ICONS[n.type] ?? "ℹ️"}</span>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", marginBottom: 2 }}>{n.title}</p>
                          <p style={{ fontSize: 12, color: "#6b7280" }}>{n.body}</p>
                          <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>{new Date(n.createdAt).toLocaleDateString("fr-FR")}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          {/* Message CTA */}
          <Link href="/dashboard/messagerie" style={{ background: "#166534", color: "#fff", fontSize: 14, fontWeight: 700, padding: "10px 20px", borderRadius: 10, textDecoration: "none", display: "flex", alignItems: "center", gap: 8, position: "relative" }}>
            💬 Messagerie
            {unreadMessages > 0 && (
              <span style={{ background: "#ef4444", fontSize: 10, fontWeight: 800, padding: "1px 6px", borderRadius: 10 }}>
                {unreadMessages}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* ── KPI CARDS ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }} className="kpi-grid">
        <KpiCard icon="💧" label="Eau — dernier relevé" value={waterMeter?.readings[0] ? `${fmt(waterMeter.readings[0].value)} m³` : "—"} color="#0ea5e9" />
        <KpiCard icon="⚡" label="Élec — dernier relevé" value={elecMeter?.readings[0] ? `${fmt(elecMeter.readings[0].value)} kWh` : "—"} color="#f59e0b" />
        <KpiCard icon="🧾" label="Factures impayées" value={`${pendingInvoices.length}`} sub={pendingInvoices.length > 0 ? `${fmt(pendingTotal)} MAD` : undefined} color={pendingInvoices.length > 0 ? "#ef4444" : "#10b981"} />
        <KpiCard icon="🔧" label="Interventions en cours" value={`${interventions.length}`} color={interventions.length > 0 ? "#f59e0b" : "#10b981"} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }} className="main-grid">

        {/* ── COMPTEURS ── */}
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 18, display: "flex", alignItems: "center", gap: 8 }}>
            📊 Mes compteurs
          </h2>
          {allMeters.length === 0 ? (
            <p style={{ color: "#9ca3af", fontSize: 13 }}>Aucun compteur associé à cette unité.</p>
          ) : allMeters.map(meter => {
            const svc = SERVICE_LABELS[meter.serviceType] ?? { fr: meter.serviceType, icon: "📦" };
            const lastReading = meter.readings[0];
            const prevReading = meter.readings[1];
            const consommation = lastReading && prevReading ? lastReading.value - prevReading.value : null;
            return (
              <div key={meter.id} style={{ borderRadius: 10, border: "1px solid #f3f4f6", padding: "14px 16px", marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 14, color: "#111827", marginBottom: 2 }}>
                      {svc.icon} {svc.fr}
                    </p>
                    <p style={{ fontSize: 11, color: "#9ca3af" }}>N° {meter.serialNumber}</p>
                  </div>
                  {lastReading && (
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontSize: 20, fontWeight: 800, color: "#166534" }}>
                        {fmt(lastReading.value)} <span style={{ fontSize: 12, fontWeight: 500, color: "#6b7280" }}>{meter.serviceType === "ELECTRICITY" ? "kWh" : "m³"}</span>
                      </p>
                      <p style={{ fontSize: 11, color: "#9ca3af" }}>{new Date(lastReading.date).toLocaleDateString("fr-FR")}</p>
                    </div>
                  )}
                </div>
                {consommation !== null && (
                  <div style={{ marginTop: 8, background: "#f0fdf4", borderRadius: 6, padding: "6px 10px", fontSize: 12, color: "#166534", fontWeight: 600 }}>
                    ↑ Consommation : {fmt(consommation)} {meter.serviceType === "ELECTRICITY" ? "kWh" : "m³"} depuis le dernier relevé
                  </div>
                )}
                {/* Mini readings history */}
                {meter.readings.length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Historique</p>
                    {meter.readings.map((r, i) => (
                      <div key={r.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: i === 0 ? "#111827" : "#6b7280", fontWeight: i === 0 ? 600 : 400, padding: "3px 0" }}>
                        <span>{new Date(r.date).toLocaleDateString("fr-FR")}</span>
                        <span>{fmt(r.value)} {meter.serviceType === "ELECTRICITY" ? "kWh" : "m³"}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── FACTURES ── */}
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 18, display: "flex", alignItems: "center", gap: 8 }}>
            🧾 Mes factures
            {pendingInvoices.length > 0 && <span style={{ background: "#fee2e2", color: "#dc2626", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>{pendingInvoices.length} impayée{pendingInvoices.length > 1 ? "s" : ""}</span>}
          </h2>
          {allInvoices.length === 0 ? (
            <p style={{ color: "#9ca3af", fontSize: 13 }}>Aucune facture.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {allInvoices.slice(0, 8).map(inv => (
                <div key={inv.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: 8, border: `1px solid ${inv.paid ? "#f3f4f6" : "#fee2e2"}`, background: inv.paid ? "#fff" : "#fff5f5" }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{inv.reference ?? `Facture ${new Date(inv.period).toLocaleDateString("fr-FR", { month: "short", year: "numeric" })}`}</p>
                    {inv.dueDate && <p style={{ fontSize: 11, color: "#9ca3af" }}>Échéance : {new Date(inv.dueDate).toLocaleDateString("fr-FR")}</p>}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{fmt(inv.amount)} <span style={{ fontSize: 11, color: "#9ca3af" }}>MAD</span></p>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: inv.paid ? "#dcfce7" : "#fee2e2", color: inv.paid ? "#166534" : "#dc2626" }}>
                      {inv.paid ? "✓ Payé" : "En attente"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── ABONNEMENTS ── */}
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 18 }}>📋 Mes abonnements actifs</h2>
          {unit.subscriptions.length === 0 ? (
            <p style={{ color: "#9ca3af", fontSize: 13 }}>Aucun abonnement.</p>
          ) : unit.subscriptions.map(sub => {
            const svc = SERVICE_LABELS[sub.serviceType] ?? { fr: sub.serviceType, icon: "📦" };
            return (
              <div key={sub.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid #f9fafb" }}>
                <span style={{ fontSize: 22 }}>{svc.icon}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{svc.fr}</p>
                  <p style={{ fontSize: 12, color: "#6b7280" }}>{sub.meters.length} compteur{sub.meters.length > 1 ? "s" : ""} • {sub.invoices.length} facture{sub.invoices.length > 1 ? "s" : ""}</p>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: sub.status === "ACTIVE" ? "#dcfce7" : "#f3f4f6", color: sub.status === "ACTIVE" ? "#166534" : "#6b7280" }}>
                  {sub.status === "ACTIVE" ? "Actif" : sub.status}
                </span>
              </div>
            );
          })}
        </div>

        {/* ── DOCUMENTS + INTERVENTIONS ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Documents */}
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: 24, flex: 1 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 18 }}>📁 Mes documents</h2>
            {allDocuments.length === 0 ? (
              <p style={{ color: "#9ca3af", fontSize: 13 }}>Aucun document disponible.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {allDocuments.slice(0, 5).map(doc => (
                  <a key={doc.id} href={doc.url} target="_blank" rel="noopener noreferrer"
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 8, border: "1px solid #f3f4f6", textDecoration: "none", color: "inherit" }}>
                    <span style={{ fontSize: 18 }}>📄</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.title}</p>
                      <p style={{ fontSize: 11, color: "#9ca3af" }}>{new Date(doc.createdAt).toLocaleDateString("fr-FR")}</p>
                    </div>
                    <span style={{ fontSize: 16, color: "#166534" }}>↗</span>
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Interventions */}
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 14 }}>🔧 Interventions en cours</h2>
            {interventions.length === 0 ? (
              <p style={{ color: "#9ca3af", fontSize: 13 }}>Aucune intervention active.</p>
            ) : interventions.map(i => (
              <div key={i.id} style={{ padding: "10px 0", borderBottom: "1px solid #f9fafb", display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ fontSize: 16 }}>{i.status === "IN_PROGRESS" ? "🔄" : "⏳"}</span>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{i.title}</p>
                  <p style={{ fontSize: 11, color: "#9ca3af" }}>{new Date(i.date).toLocaleDateString("fr-FR")} · {i.status === "IN_PROGRESS" ? "En cours" : "En attente"}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Messagerie */}
      <div style={{ marginTop: 24, background: "linear-gradient(135deg, #14532d, #166534)", borderRadius: 16, padding: "24px 28px", color: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Besoin d&apos;aide ? Contactez la gérance</h3>
          <p style={{ color: "rgba(255,255,255,.7)", fontSize: 14 }}>Signalez un incident, demandez un document ou posez une question.</p>
        </div>
        <Link href="/dashboard/messagerie" style={{ background: "#d4af37", color: "#14532d", fontWeight: 700, fontSize: 15, padding: "12px 24px", borderRadius: 25, textDecoration: "none", whiteSpace: "nowrap" }}>
          💬 Envoyer un message
        </Link>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .kpi-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .main-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 500px) {
          .kpi-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

function KpiCard({ icon, label, value, sub, color }: { icon: string; label: string; value: string; sub?: string; color: string }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "18px 20px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: color, borderRadius: "14px 14px 0 0" }} />
      <p style={{ fontSize: 22, marginBottom: 8 }}>{icon}</p>
      <p style={{ fontSize: 24, fontWeight: 800, color: "#111827", lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontSize: 13, fontWeight: 600, color, marginTop: 2 }}>{sub}</p>}
      <p style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>{label}</p>
    </div>
  );
}
