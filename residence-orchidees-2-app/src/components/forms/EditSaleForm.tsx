"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/contexts/LangContext";
import { X, HandshakeIcon } from "lucide-react";
import { updateSale } from "@/actions/sales";
import type { SaleStatus } from "@prisma/client";

interface Props {
  sale: {
    id: string; status: SaleStatus;
    buyerName: string | null; buyerPhone: string | null;
    totalAmount: number; depositAmount: number;
    notaryName: string | null; notaryPhone: string | null;
    signingDate: string | null; deliveryDate: string | null;
    notes: string | null;
    lot: { name: string };
  };
  onClose: () => void;
}

const statusOptions: { value: SaleStatus; fr: string; ar: string }[] = [
  { value: "RESERVE",    fr: "Réservé",     ar: "محجوز" },
  { value: "EN_COURS",   fr: "En cours",    ar: "جارٍ" },
  { value: "ACTE_SIGNE", fr: "Acte signé",  ar: "عقد موقّع" },
  { value: "LIVRE",      fr: "Livré",       ar: "مسلّم" },
];

export function EditSaleForm({ sale, onClose }: Props) {
  const { lang } = useLang();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [status, setStatus] = useState<SaleStatus>(sale.status);
  const [buyerName, setBuyerName] = useState(sale.buyerName ?? "");
  const [buyerPhone, setBuyerPhone] = useState(sale.buyerPhone ?? "");
  const [totalAmount, setTotalAmount] = useState(String(sale.totalAmount));
  const [depositAmount, setDepositAmount] = useState(String(sale.depositAmount));
  const [notaryName, setNotaryName] = useState(sale.notaryName ?? "");
  const [notaryPhone, setNotaryPhone] = useState(sale.notaryPhone ?? "");
  const [signingDate, setSigningDate] = useState(sale.signingDate ? sale.signingDate.slice(0, 10) : "");
  const [deliveryDate, setDeliveryDate] = useState(sale.deliveryDate ? sale.deliveryDate.slice(0, 10) : "");
  const [notes, setNotes] = useState(sale.notes ?? "");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      try {
        await updateSale(sale.id, {
          status,
          buyerName: buyerName || undefined,
          buyerPhone: buyerPhone || undefined,
          totalAmount: parseFloat(totalAmount),
          depositAmount: parseFloat(depositAmount || "0"),
          notaryName: notaryName || undefined,
          notaryPhone: notaryPhone || undefined,
          signingDate: signingDate || undefined,
          deliveryDate: deliveryDate || undefined,
          notes: notes || undefined,
        });
        onClose();
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <div className="flex items-center gap-2">
            <HandshakeIcon size={18} className="text-green-700" />
            <h2 className="font-semibold text-gray-900 text-sm">
              {lang === "fr" ? `Modifier — ${sale.lot.name}` : `تعديل — ${sale.lot.name}`}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1.5">{lang === "fr" ? "Statut" : "الحالة"}</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as SaleStatus)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500">
              {statusOptions.map((s) => (
                <option key={s.value} value={s.value}>{lang === "fr" ? s.fr : s.ar}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1.5">{lang === "fr" ? "Acheteur" : "المشتري"}</label>
              <input type="text" value={buyerName} onChange={(e) => setBuyerName(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1.5">{lang === "fr" ? "Tél. acheteur" : "هاتف المشتري"}</label>
              <input type="tel" value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value)} placeholder="06..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1.5">{lang === "fr" ? "Prix total (MAD)" : "السعر الإجمالي"} *</label>
              <input type="number" min="0" step="1000" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} required
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1.5">{lang === "fr" ? "Acompte (MAD)" : "العربون"}</label>
              <input type="number" min="0" step="1000" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1.5">{lang === "fr" ? "Notaire" : "الموثق"}</label>
              <input type="text" value={notaryName} onChange={(e) => setNotaryName(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1.5">{lang === "fr" ? "Tél. notaire" : "هاتف الموثق"}</label>
              <input type="tel" value={notaryPhone} onChange={(e) => setNotaryPhone(e.target.value)} placeholder="05..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1.5">{lang === "fr" ? "Date signature" : "تاريخ التوقيع"}</label>
              <input type="date" value={signingDate} onChange={(e) => setSigningDate(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1.5">{lang === "fr" ? "Date livraison" : "تاريخ التسليم"}</label>
              <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1.5">{lang === "fr" ? "Notes" : "ملاحظات"}</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
          </div>

          {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-800 rounded-xl hover:bg-gray-100 transition-colors">
              {lang === "fr" ? "Annuler" : "إلغاء"}
            </button>
            <button type="submit" disabled={pending} className="px-5 py-2 bg-green-700 text-white text-sm font-medium rounded-xl hover:bg-green-800 disabled:opacity-60 transition-colors">
              {pending ? "…" : (lang === "fr" ? "Enregistrer" : "حفظ")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
