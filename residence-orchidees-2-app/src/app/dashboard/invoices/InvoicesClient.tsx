"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/contexts/LangContext";
import { Receipt, CheckCircle, Clock, Paperclip, ChevronDown, ChevronUp, Plus, X, Zap, Droplets, Wifi, Flame, Phone, Printer } from "lucide-react";
import { fmt } from "@/lib/fmt";
import type { ServiceType } from "@prisma/client";
import { AttachmentsPanel } from "@/components/AttachmentsPanel";
import type { AttachmentRow } from "@/actions/attachments";
import { createInvoiceManual, markInvoicePaid } from "@/actions/invoices";

interface InvoiceRow {
  id: string;
  reference: string | null;
  amount: number;
  period: string;
  dueDate: string | null;
  paid: boolean;
  paidAt: string | null;
  unitName: string;
  serviceType: ServiceType;
  attachments: AttachmentRow[];
}

interface SubscriptionOption {
  id: string;
  serviceType: ServiceType;
  unitName: string;
}

interface Stats { total: number; paid: number; pending: number; totalAmount: number; pendingAmount: number }

const SERVICE_META: Record<string, { label: string; labelAr: string; icon: React.ReactNode; color: string; hasIndex: boolean; unit: string }> = {
  ELECTRICITY: { label: "Électricité", labelAr: "الكهرباء",   icon: <Zap size={14} />,      color: "#d97706", hasIndex: true,  unit: "kWh" },
  WATER:       { label: "Eau",          labelAr: "الماء",      icon: <Droplets size={14} />, color: "#0284c7", hasIndex: true,  unit: "m³"  },
  INTERNET:    { label: "Internet",     labelAr: "الإنترنت",   icon: <Wifi size={14} />,     color: "#7c3aed", hasIndex: false, unit: ""    },
  GAS:         { label: "Gaz",          labelAr: "الغاز",      icon: <Flame size={14} />,    color: "#ea580c", hasIndex: true,  unit: "m³"  },
  PHONE:       { label: "Téléphone",    labelAr: "الهاتف",     icon: <Phone size={14} />,    color: "#374151", hasIndex: false, unit: ""    },
  OTHER:       { label: "Autre",        labelAr: "أخرى",       icon: <Receipt size={14} />,  color: "#6b7280", hasIndex: false, unit: ""    },
};

function serviceLabel(type: ServiceType, lang: string) {
  const m = SERVICE_META[type];
  return lang === "fr" ? m.label : m.labelAr;
}

const INPUT_STYLE: React.CSSProperties = {
  width: "100%", padding: "8px 10px", border: "1px solid #d1d5db",
  borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box",
};
const LABEL_STYLE: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 };

export function InvoicesClient({
  invoices, stats, subscriptions,
}: {
  invoices: InvoiceRow[];
  stats: Stats;
  subscriptions: SubscriptionOption[];
}) {
  const { lang, isRtl } = useLang();
  const router = useRouter();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [printInv, setPrintInv] = useState<InvoiceRow | null>(null);
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState("");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Form state
  const [subId, setSubId] = useState("");
  const [reference, setReference] = useState("");
  const [amount, setAmount] = useState("");
  const [period, setPeriod] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [prevIndex, setPrevIndex] = useState("");
  const [currIndex, setCurrIndex] = useState("");

  const selectedSub = subscriptions.find(s => s.id === subId);
  const meta = selectedSub ? SERVICE_META[selectedSub.serviceType] : null;

  function resetForm() {
    setSubId(""); setReference(""); setAmount(""); setPeriod("");
    setDueDate(""); setPrevIndex(""); setCurrIndex(""); setFormError("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subId) { setFormError("Choisissez une unité et un service."); return; }
    if (!amount || isNaN(Number(amount))) { setFormError("Montant invalide."); return; }
    if (!period) { setFormError("La période est obligatoire."); return; }
    setFormError("");
    startTransition(async () => {
      try {
        await createInvoiceManual({
          subscriptionId: subId,
          reference: reference || undefined,
          amount: parseFloat(amount),
          period,
          dueDate: dueDate || undefined,
          previousIndex: prevIndex ? parseFloat(prevIndex) : undefined,
          currentIndex: currIndex ? parseFloat(currIndex) : undefined,
        });
        setShowForm(false);
        resetForm();
        router.refresh();
      } catch (err) {
        setFormError(err instanceof Error ? err.message : "Erreur");
      }
    });
  }

  async function togglePaid(id: string, current: boolean) {
    setTogglingId(id);
    try {
      await markInvoicePaid(id, !current);
      router.refresh();
    } finally {
      setTogglingId(null);
    }
  }

  // Group subscriptions by unit for the select
  const subsByUnit = subscriptions.reduce<Record<string, SubscriptionOption[]>>((acc, s) => {
    if (!acc[s.unitName]) acc[s.unitName] = [];
    acc[s.unitName].push(s);
    return acc;
  }, {});

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="space-y-5">

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: lang === "fr" ? "Total"      : "الإجمالي", value: `${fmt(stats.totalAmount)} MAD`, color: "bg-gray-50 text-gray-700" },
          { label: lang === "fr" ? "Payées"      : "مدفوعة",   value: stats.paid.toString(),           color: "bg-green-50 text-green-700" },
          { label: lang === "fr" ? "En attente" : "معلقة",    value: `${fmt(stats.pendingAmount)} MAD`, color: "bg-amber-50 text-amber-700" },
        ].map(({ label, value, color }) => (
          <div key={label} className={`rounded-2xl p-4 ${color}`}>
            <p className="text-lg font-bold">{value}</p>
            <p className="text-xs mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Header + Add button */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Receipt size={16} color="#6b7280" />
          <span style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>
            {lang === "fr" ? `${invoices.length} facture(s)` : `${invoices.length} فاتورة`}
          </span>
        </div>
        <button
          onClick={() => { setShowForm(true); resetForm(); }}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "#15803d", color: "white", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
        >
          <Plus size={14} />
          {lang === "fr" ? "Nouvelle facture" : "فاتورة جديدة"}
        </button>
      </div>

      {/* Manual form modal */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "white", borderRadius: 16, padding: 24, width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#111827" }}>
                {lang === "fr" ? "Nouvelle facture" : "فاتورة جديدة"}
              </h2>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>

              {/* Unit + Service */}
              <div>
                <label style={LABEL_STYLE}>{lang === "fr" ? "Unité / Service *" : "الوحدة / الخدمة *"}</label>
                <select value={subId} onChange={e => setSubId(e.target.value)} style={INPUT_STYLE} required>
                  <option value="">{lang === "fr" ? "— Choisir —" : "— اختر —"}</option>
                  {Object.entries(subsByUnit).sort(([a], [b]) => a.localeCompare(b)).map(([unit, subs]) => (
                    <optgroup key={unit} label={unit}>
                      {subs.map(s => (
                        <option key={s.id} value={s.id}>
                          {serviceLabel(s.serviceType, lang)}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* Reference */}
              <div>
                <label style={LABEL_STYLE}>{lang === "fr" ? "N° facture / Référence" : "رقم الفاتورة"}</label>
                <input type="text" value={reference} onChange={e => setReference(e.target.value)}
                  placeholder={lang === "fr" ? "ex: 636138198" : "مثال: 636138198"}
                  style={INPUT_STYLE} />
              </div>

              {/* Amount */}
              <div>
                <label style={LABEL_STYLE}>{lang === "fr" ? "Montant TTC (MAD) *" : "المبلغ شامل الضريبة (درهم) *"}</label>
                <input type="number" step="0.01" min="0" value={amount} onChange={e => setAmount(e.target.value)}
                  placeholder="ex: 604.06" style={INPUT_STYLE} required />
              </div>

              {/* Period */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={LABEL_STYLE}>{lang === "fr" ? "Période *" : "الفترة *"}</label>
                  <input type="date" value={period} onChange={e => setPeriod(e.target.value)} style={INPUT_STYLE} required />
                </div>
                <div>
                  <label style={LABEL_STYLE}>{lang === "fr" ? "Date limite paiement" : "تاريخ الاستحقاق"}</label>
                  <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={INPUT_STYLE} />
                </div>
              </div>

              {/* Indexes (only for ELECTRICITY, WATER, GAS) */}
              {meta?.hasIndex && (
                <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 10, padding: 12 }}>
                  <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 700, color: "#374151", display: "flex", alignItems: "center", gap: 6 }}>
                    {meta.icon}
                    {lang === "fr" ? `Relevé compteur (${meta.unit})` : `قراءة العداد (${meta.unit})`}
                    <span style={{ fontWeight: 400, color: "#9ca3af" }}>{lang === "fr" ? "— optionnel" : "— اختياري"}</span>
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div>
                      <label style={LABEL_STYLE}>{lang === "fr" ? `Index ancien (${meta.unit})` : `الفهرس القديم (${meta.unit})`}</label>
                      <input type="number" step="0.01" min="0" value={prevIndex} onChange={e => setPrevIndex(e.target.value)}
                        placeholder="ex: 26666" style={INPUT_STYLE} />
                    </div>
                    <div>
                      <label style={LABEL_STYLE}>{lang === "fr" ? `Index actuel (${meta.unit})` : `الفهرس الجديد (${meta.unit})`}</label>
                      <input type="number" step="0.01" min="0" value={currIndex} onChange={e => setCurrIndex(e.target.value)}
                        placeholder="ex: 28331" style={INPUT_STYLE} />
                    </div>
                  </div>
                  {prevIndex && currIndex && !isNaN(Number(prevIndex)) && !isNaN(Number(currIndex)) && (
                    <p style={{ margin: "8px 0 0", fontSize: 12, color: "#15803d", fontWeight: 600 }}>
                      {lang === "fr" ? "Consommation" : "الاستهلاك"} : {(Number(currIndex) - Number(prevIndex)).toFixed(1)} {meta.unit}
                    </p>
                  )}
                </div>
              )}

              {formError && (
                <p style={{ color: "#dc2626", fontSize: 12, margin: 0, padding: "8px 10px", background: "#fef2f2", borderRadius: 8 }}>
                  {formError}
                </p>
              )}

              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => setShowForm(false)}
                  style={{ flex: 1, padding: "10px", border: "1px solid #e5e7eb", borderRadius: 10, background: "white", color: "#374151", fontSize: 13, cursor: "pointer" }}>
                  {lang === "fr" ? "Annuler" : "إلغاء"}
                </button>
                <button type="submit" disabled={isPending}
                  style={{ flex: 2, padding: "10px", border: "none", borderRadius: 10, background: isPending ? "#9ca3af" : "#15803d", color: "white", fontSize: 13, fontWeight: 700, cursor: isPending ? "not-allowed" : "pointer" }}>
                  {isPending ? (lang === "fr" ? "Enregistrement…" : "جارٍ الحفظ…") : (lang === "fr" ? "Enregistrer la facture" : "حفظ الفاتورة")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoices table */}
      {invoices.length === 0 ? (
        <p className="text-center text-gray-400 py-10">{lang === "fr" ? "Aucune facture." : "لا توجد فواتير."}</p>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs">
                <th className="px-4 py-3 text-start font-medium">{lang === "fr" ? "Unité" : "الوحدة"}</th>
                <th className="px-4 py-3 text-start font-medium hidden sm:table-cell">{lang === "fr" ? "Service" : "الخدمة"}</th>
                <th className="px-4 py-3 text-start font-medium hidden sm:table-cell">{lang === "fr" ? "Référence" : "المرجع"}</th>
                <th className="px-4 py-3 text-end font-medium">{lang === "fr" ? "Montant" : "المبلغ"}</th>
                <th className="px-4 py-3 text-end font-medium hidden sm:table-cell">{lang === "fr" ? "Période" : "الفترة"}</th>
                <th className="px-4 py-3 text-center font-medium">{lang === "fr" ? "Statut" : "الحالة"}</th>
                <th className="px-4 py-3 text-center font-medium w-8">🖨️</th>
                <th className="px-4 py-3 text-center font-medium w-12">📎</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => {
                const m = SERVICE_META[inv.serviceType];
                return (
                  <>
                    <tr key={inv.id} className="hover:bg-gray-50 transition-colors border-t border-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{inv.unitName}</td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, padding: "2px 8px", borderRadius: 20, background: `${m.color}15`, color: m.color, fontWeight: 600 }}>
                          {m.icon}{lang === "fr" ? m.label : m.labelAr}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell text-xs text-gray-400 font-mono">{inv.reference ?? "—"}</td>
                      <td className="px-4 py-3 text-end font-semibold text-gray-800">{fmt(inv.amount)} MAD</td>
                      <td className="px-4 py-3 text-end text-xs text-gray-400 hidden sm:table-cell">
                        {new Date(inv.period).toLocaleDateString(lang === "fr" ? "fr-MA" : "ar-MA", { month: "long", year: "numeric" })}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => togglePaid(inv.id, inv.paid)}
                          disabled={togglingId === inv.id}
                          title={lang === "fr" ? (inv.paid ? "Marquer impayée" : "Marquer payée") : (inv.paid ? "تحديد كغير مدفوعة" : "تحديد كمدفوعة")}
                          style={{ background: "none", border: "none", cursor: "pointer", opacity: togglingId === inv.id ? 0.5 : 1 }}
                        >
                          {inv.paid
                            ? <CheckCircle size={16} className="text-green-500" />
                            : <Clock size={16} className="text-amber-400" />}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setExpanded(expanded === inv.id ? null : inv.id)}
                          className="inline-flex items-center gap-0.5 text-xs text-gray-400 hover:text-green-700 transition-colors"
                        >
                          <Paperclip size={13} />
                          {inv.attachments.length > 0 && (
                            <span className="text-xs font-bold text-green-700">{inv.attachments.length}</span>
                          )}
                          {expanded === inv.id ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                        </button>
                      </td>
                    </tr>
                    {expanded === inv.id && (
                      <tr key={`${inv.id}-att`} className="bg-gray-50/50">
                        <td colSpan={7} className="px-4 pb-3">
                          <AttachmentsPanel
                            entityType="invoice"
                            entityId={inv.id}
                            initialAttachments={inv.attachments}
                            collapsible={false}
                            defaultOpen
                          />
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
