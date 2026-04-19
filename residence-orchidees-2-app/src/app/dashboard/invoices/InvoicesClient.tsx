"use client";

import { useState } from "react";
import { useLang } from "@/contexts/LangContext";
import { Receipt, CheckCircle, Clock, Paperclip, ChevronDown, ChevronUp } from "lucide-react";
import { fmt } from "@/lib/fmt";
import type { ServiceType } from "@prisma/client";
import { AttachmentsPanel } from "@/components/AttachmentsPanel";
import type { AttachmentRow } from "@/actions/attachments";

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

interface Stats { total: number; paid: number; pending: number; totalAmount: number; pendingAmount: number }

export function InvoicesClient({ invoices, stats }: { invoices: InvoiceRow[]; stats: Stats }) {
  const { lang, isRtl } = useLang();
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: lang === "fr" ? "Total"       : "الإجمالي", value: `${fmt(stats.totalAmount)} MAD`, color: "bg-gray-50 text-gray-700" },
          { label: lang === "fr" ? "Payées"       : "مدفوعة",   value: stats.paid.toString(),                        color: "bg-green-50 text-green-700" },
          { label: lang === "fr" ? "En attente"  : "معلقة",    value: `${fmt(stats.pendingAmount)} MAD`, color: "bg-amber-50 text-amber-700" },
        ].map(({ label, value, color }) => (
          <div key={label} className={`rounded-2xl p-4 ${color}`}>
            <p className="text-lg font-bold">{value}</p>
            <p className="text-xs mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {invoices.length === 0 ? (
        <p className="text-center text-gray-400 py-10">{lang === "fr" ? "Aucune facture." : "لا توجد فواتير."}</p>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs">
                <th className="px-4 py-3 text-start font-medium">{lang === "fr" ? "Unité" : "الوحدة"}</th>
                <th className="px-4 py-3 text-start font-medium hidden sm:table-cell">{lang === "fr" ? "Référence" : "المرجع"}</th>
                <th className="px-4 py-3 text-end font-medium">{lang === "fr" ? "Montant" : "المبلغ"}</th>
                <th className="px-4 py-3 text-end font-medium hidden sm:table-cell">{lang === "fr" ? "Période" : "الفترة"}</th>
                <th className="px-4 py-3 text-center font-medium">{lang === "fr" ? "Statut" : "الحالة"}</th>
                <th className="px-4 py-3 text-center font-medium w-12">📎</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <>
                  <tr key={inv.id} className="hover:bg-gray-50 transition-colors border-t border-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{inv.unitName}</td>
                    <td className="px-4 py-3 hidden sm:table-cell text-xs text-gray-400 font-mono">{inv.reference ?? "—"}</td>
                    <td className="px-4 py-3 text-end font-semibold text-gray-800">{fmt(inv.amount)} MAD</td>
                    <td className="px-4 py-3 text-end text-xs text-gray-400 hidden sm:table-cell">
                      {new Date(inv.period).toLocaleDateString(lang === "fr" ? "fr-MA" : "ar-MA", { month: "long", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {inv.paid
                        ? <CheckCircle size={16} className="text-green-500 inline" />
                        : <Clock size={16} className="text-amber-400 inline" />}
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
                      <td colSpan={6} className="px-4 pb-3">
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
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
