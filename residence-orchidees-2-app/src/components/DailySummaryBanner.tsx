"use client";

import { useState } from "react";
import { X, Bell, ChevronDown, ChevronUp } from "lucide-react";
import { useLang } from "@/contexts/LangContext";

interface Props {
  date: string;
  context: string; // "3 factures, 2 relevés manquants, 1 intervention"
  unpaidInvoices: number;
  missingReadings: number;
  expiringSoon: number;
  coldProspects: number;
  openInterventions: number;
}

export function DailySummaryBanner({ date, context, unpaidInvoices, missingReadings, expiringSoon, coldProspects, openInterventions }: Props) {
  const { isRtl } = useLang();
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  if (dismissed) return null;

  const hasAlerts = unpaidInvoices > 0 || missingReadings > 0 || expiringSoon > 0 || openInterventions > 0;
  const allGood = !hasAlerts && coldProspects === 0;

  const items = [
    unpaidInvoices > 0   && { icon: "💰", label: isRtl ? `${unpaidInvoices} فاتورة غير مدفوعة` : `${unpaidInvoices} facture(s) impayée(s)`, color: "#dc2626" },
    missingReadings > 0  && { icon: "📊", label: isRtl ? `${missingReadings} عداد بدون قراءة` : `${missingReadings} relevé(s) manquant(s)`, color: "#d97706" },
    expiringSoon > 0     && { icon: "🛡️", label: isRtl ? `${expiringSoon} ضمان ينتهي قريباً` : `${expiringSoon} garantie(s) expirent dans 30j`, color: "#7c3aed" },
    coldProspects > 0    && { icon: "👤", label: isRtl ? `${coldProspects} عميل بدون تواصل منذ 7 أيام` : `${coldProspects} prospect(s) sans contact depuis 7j`, color: "#0284c7" },
    openInterventions > 0 && { icon: "🔧", label: isRtl ? `${openInterventions} تدخل مفتوح` : `${openInterventions} intervention(s) ouverte(s)`, color: "#374151" },
  ].filter(Boolean) as { icon: string; label: string; color: string }[];

  return (
    <div dir={isRtl ? "rtl" : "ltr"} style={{
      background: allGood ? "#f0fdf4" : "#fffbeb",
      border: `1px solid ${allGood ? "#bbf7d0" : "#fde68a"}`,
      borderRadius: 12,
      padding: "10px 14px",
      marginBottom: 16,
      display: "flex",
      flexDirection: "column",
      gap: 6,
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Bell size={15} color={allGood ? "#15803d" : "#d97706"} />
        <span style={{ fontSize: 13, fontWeight: 700, color: allGood ? "#15803d" : "#92400e", flex: 1 }}>
          {isRtl ? `ملخص يوم ${date}` : `Résumé du ${date}`}
          {allGood && (isRtl ? " — كل شيء على ما يرام ✅" : " — Tout est en ordre ✅")}
        </span>
        {items.length > 0 && (
          <button onClick={() => setExpanded(v => !v)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", display: "flex", alignItems: "center" }}>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        )}
        <button onClick={() => setDismissed(true)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}>
          <X size={14} />
        </button>
      </div>

      {/* Summary chips (always visible) */}
      {!allGood && !expanded && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {items.map((item, i) => (
            <span key={i} style={{ fontSize: 11, background: "white", border: `1px solid ${item.color}20`, color: item.color, padding: "2px 8px", borderRadius: 20, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
              {item.icon} {item.label}
            </span>
          ))}
        </div>
      )}

      {/* Expanded detail */}
      {expanded && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4, paddingTop: 2 }}>
          {items.map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: item.color }}>
              <span>{item.icon}</span>
              <span style={{ fontWeight: 600 }}>{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
