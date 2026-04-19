"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { fmt } from "@/lib/fmt";
import { useSession } from "next-auth/react";
import { useLang } from "@/contexts/LangContext";
import { Home, Store, TrendingUp, Pencil, Trash2 } from "lucide-react";
import type { SaleStatus, UnitKind } from "@prisma/client";
import { NewSaleForm, type AvailableLot } from "@/components/forms/NewSaleForm";
import { EditSaleForm } from "@/components/forms/EditSaleForm";
import { AttachmentsPanel } from "@/components/AttachmentsPanel";
import type { AttachmentRow } from "@/actions/attachments";
import { deleteSale } from "@/actions/sales";
import { PaymentTranchePanel, type TranchRow } from "@/components/PaymentTranchePanel";

interface SaleRow {
  id: string; status: SaleStatus; totalAmount: number; depositAmount: number;
  contractUrl: string | null; buyerName: string | null; buyerPhone: string | null;
  notaryName: string | null; notaryPhone: string | null;
  signingDate: string | null; deliveryDate: string | null; notes: string | null;
  lot: { id: string; name: string; kind: UnitKind };
  paidTotal: number; scheduledCount: number; paidCount: number; createdAt: string;
  attachments: AttachmentRow[];
  paymentSchedule: TranchRow[];
}

interface Props {
  sales: SaleRow[];
  stats: { reserve: number; enCours: number; acteSigne: number; livre: number; totalRevenue: number };
  availableLots: AvailableLot[];
}

const statusColors: Record<SaleStatus, string> = {
  RESERVE: "bg-amber-100 text-amber-700", EN_COURS: "bg-blue-100 text-blue-700",
  ACTE_SIGNE: "bg-green-100 text-green-700", LIVRE: "bg-purple-100 text-purple-700",
};

export function SalesClient({ sales, stats, availableLots }: Props) {
  const { t, lang, isRtl } = useLang();
  const { data: session } = useSession();
  const router = useRouter();
  const ts = t.sales;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, startDelete] = useTransition();

  const isViewer = session?.user?.role === "VIEWER";

  const statusLabel: Record<SaleStatus, string> = {
    RESERVE: ts.reserve, EN_COURS: ts.enCours, ACTE_SIGNE: ts.acteSigne, LIVRE: ts.livre,
  };

  const handleDelete = (id: string) => {
    startDelete(async () => {
      await deleteSale(id);
      setConfirmDeleteId(null);
      router.refresh();
    });
  };

  const editing = sales.find((s) => s.id === editingId);

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: ts.reserve,   count: stats.reserve,   color: "bg-amber-50 text-amber-700 border-amber-200" },
          { label: ts.enCours,   count: stats.enCours,   color: "bg-blue-50 text-blue-700 border-blue-200" },
          { label: ts.acteSigne, count: stats.acteSigne, color: "bg-green-50 text-green-700 border-green-200" },
          { label: ts.livre,     count: stats.livre,     color: "bg-purple-50 text-purple-700 border-purple-200" },
        ].map(({ label, count, color }) => (
          <div key={label} className={`rounded-2xl border p-4 text-center ${color}`}>
            <p className="text-2xl font-bold">{count}</p>
            <p className="text-xs font-medium mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Revenue total + button */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
            <TrendingUp size={22} className="text-green-700" />
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">
              {lang === "fr" ? "Revenus confirmés (actes signés + livrés)" : "الإيرادات المؤكدة"}
            </p>
            <p className="text-2xl font-bold text-gray-900">
              {stats.totalRevenue.toLocaleString(lang === "fr" ? "fr-MA" : "ar-MA")}
              <span className="text-sm font-normal text-gray-400 ml-1">MAD</span>
            </p>
          </div>
        </div>
        <NewSaleForm availableLots={availableLots} />
      </div>

      {/* Sales list */}
      {sales.length === 0 ? (
        <p className="text-center text-gray-400 py-12">{ts.noSales}</p>
      ) : (
        <div className="space-y-3">
          {sales.map((sale) => {
            const progress = sale.scheduledCount > 0
              ? Math.round((sale.paidCount / sale.scheduledCount) * 100) : 0;
            const remaining = sale.totalAmount - sale.paidTotal;

            return (
              <div key={sale.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {sale.lot.kind === "SHOP"
                      ? <Store size={18} className="text-amber-600 shrink-0" />
                      : <Home size={18} className="text-green-700 shrink-0" />}
                    <div>
                      <p className="font-semibold text-gray-900">{sale.lot.name}</p>
                      {sale.buyerName && (
                        <p className="text-xs text-gray-500">
                          {lang === "fr" ? "Acheteur" : "المشتري"}: {sale.buyerName}
                          {sale.buyerPhone && ` · ${sale.buyerPhone}`}
                        </p>
                      )}
                      {sale.notaryName && (
                        <p className="text-xs text-gray-400">{lang === "fr" ? "Notaire" : "الموثق"}: {sale.notaryName}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[sale.status]}`}>
                      {statusLabel[sale.status]}
                    </span>
                    {!isViewer && (
                      <>
                        <button
                          onClick={() => setEditingId(sale.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <Pencil size={13} />
                        </button>
                        {confirmDeleteId === sale.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(sale.id)}
                              disabled={deleting}
                              className="text-xs px-2 py-0.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60"
                            >
                              {lang === "fr" ? "Oui" : "نعم"}
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                            >
                              {lang === "fr" ? "Non" : "لا"}
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(sale.id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-400">{ts.totalAmount}</p>
                    <p className="font-semibold text-gray-900">{fmt(sale.totalAmount)} MAD</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">{ts.deposit}</p>
                    <p className="font-semibold text-green-700">{fmt(sale.depositAmount)} MAD</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">{lang === "fr" ? "Reste" : "المتبقي"}</p>
                    <p className={`font-semibold ${remaining > 0 ? "text-amber-600" : "text-gray-400"}`}>
                      {fmt(remaining)} MAD
                    </p>
                  </div>
                </div>

                {sale.scheduledCount > 0 && (
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>{ts.paymentSchedule}</span>
                      <span>{sale.paidCount}/{sale.scheduledCount} — {progress}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                )}

                {sale.signingDate && (
                  <p className="text-xs text-gray-400">
                    {lang === "fr" ? "Signé le" : "وقّع في"}{" "}
                    {new Date(sale.signingDate).toLocaleDateString(lang === "fr" ? "fr-MA" : "ar-MA", { day: "2-digit", month: "long", year: "numeric" })}
                  </p>
                )}

                <PaymentTranchePanel
                  saleId={sale.id}
                  tranches={sale.paymentSchedule}
                  totalAmount={sale.totalAmount}
                />

                <AttachmentsPanel
                  entityType="sale"
                  entityId={sale.id}
                  initialAttachments={sale.attachments}
                />
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <EditSaleForm
          sale={editing}
          onClose={() => setEditingId(null)}
        />
      )}
    </div>
  );
}
