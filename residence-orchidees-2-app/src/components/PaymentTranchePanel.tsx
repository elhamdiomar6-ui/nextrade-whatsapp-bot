"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { fmt } from "@/lib/fmt";
import { useSession } from "next-auth/react";
import { useLang } from "@/contexts/LangContext";
import { CalendarDays, CheckCircle2, Circle, Trash2, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { addPaymentTranche, markTranchePaid, deletePaymentTranche } from "@/actions/payment-tranches";

export interface TranchRow {
  id: string;
  label: string | null;
  amount: number;
  dueDate: string;
  paid: boolean;
  paidAt: string | null;
}

interface Props {
  saleId: string;
  tranches: TranchRow[];
  totalAmount: number;
}

export function PaymentTranchePanel({ saleId, tranches, totalAmount }: Props) {
  const { lang } = useLang();
  const { data: session } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [pending, startTransition] = useTransition();

  // New tranche form
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");

  const isViewer = session?.user?.role === "VIEWER";
  const paidTotal = tranches.filter((t) => t.paid).reduce((acc, t) => acc + t.amount, 0);
  const paidCount = tranches.filter((t) => t.paid).length;
  const progress  = tranches.length > 0 ? Math.round((paidCount / tranches.length) * 100) : 0;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !dueDate) return;
    startTransition(async () => {
      await addPaymentTranche({ saleId, label, amount: parseFloat(amount), dueDate });
      setLabel(""); setAmount(""); setDueDate("");
      setShowAdd(false);
      router.refresh();
    });
  };

  const handleTogglePaid = (id: string, paid: boolean) => {
    startTransition(async () => {
      await markTranchePaid(id, !paid);
      router.refresh();
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deletePaymentTranche(id);
      router.refresh();
    });
  };

  return (
    <div className="border-t border-gray-50 pt-3">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-xs text-gray-500 hover:text-green-700 transition-colors w-full"
      >
        <CalendarDays size={13} />
        <span className="font-medium">
          {lang === "fr" ? "Échéancier" : "جدول الدفع"}
        </span>
        {tranches.length > 0 && (
          <span className="text-green-700 font-bold">
            {paidCount}/{tranches.length} — {fmt(paidTotal)} MAD
          </span>
        )}
        {open ? <ChevronUp size={12} className="ml-auto" /> : <ChevronDown size={12} className="ml-auto" />}
      </button>

      {open && (
        <div className="mt-2 space-y-2">
          {/* Progress bar */}
          {tranches.length > 0 && (
            <div>
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>{progress}% {lang === "fr" ? "réglé" : "مدفوع"}</span>
                <span>{fmt(totalAmount - paidTotal)} MAD {lang === "fr" ? "restant" : "متبقٍ"}</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {/* Tranche list */}
          {tranches.map((t) => (
            <div key={t.id} className="flex items-center gap-2 py-1.5 border-b border-gray-50 last:border-0">
              {!isViewer ? (
                <button
                  onClick={() => handleTogglePaid(t.id, t.paid)}
                  disabled={pending}
                  className="shrink-0 transition-colors"
                >
                  {t.paid
                    ? <CheckCircle2 size={16} className="text-green-500" />
                    : <Circle size={16} className="text-gray-300 hover:text-green-400" />}
                </button>
              ) : (
                <span className="shrink-0">
                  {t.paid
                    ? <CheckCircle2 size={16} className="text-green-500" />
                    : <Circle size={16} className="text-gray-300" />}
                </span>
              )}
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-medium ${t.paid ? "line-through text-gray-400" : "text-gray-700"}`}>
                  {t.label ?? (lang === "fr" ? "Tranche" : "قسط")} — {fmt(t.amount)} MAD
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(t.dueDate).toLocaleDateString(lang === "fr" ? "fr-MA" : "ar-MA", { day: "2-digit", month: "short", year: "numeric" })}
                  {t.paid && t.paidAt && (
                    <span className="text-green-600 ml-1">
                      ✓ {new Date(t.paidAt).toLocaleDateString(lang === "fr" ? "fr-MA" : "ar-MA", { day: "2-digit", month: "short" })}
                    </span>
                  )}
                </p>
              </div>
              {!isViewer && (
                <button
                  onClick={() => handleDelete(t.id)}
                  disabled={pending}
                  className="shrink-0 p-1 text-gray-300 hover:text-red-400 transition-colors disabled:opacity-40"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          ))}

          {/* Add tranche */}
          {!isViewer && (
            showAdd ? (
              <form onSubmit={handleAdd} className="bg-gray-50 rounded-xl p-3 space-y-2 mt-1">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder={lang === "fr" ? "Libellé (optionnel)" : "التسمية (اختياري)"}
                    className="col-span-2 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-green-500 bg-white"
                  />
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    placeholder={lang === "fr" ? "Montant MAD" : "المبلغ"}
                    min="0"
                    step="1000"
                    className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-green-500 bg-white"
                  />
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                    className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-green-500 bg-white"
                  />
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={pending}
                    className="flex-1 bg-green-700 text-white text-xs py-1.5 rounded-lg hover:bg-green-800 disabled:opacity-60">
                    {pending ? "…" : (lang === "fr" ? "Ajouter" : "إضافة")}
                  </button>
                  <button type="button" onClick={() => setShowAdd(false)}
                    className="px-3 text-xs text-gray-500 hover:text-gray-800 rounded-lg hover:bg-gray-100">
                    {lang === "fr" ? "Annuler" : "إلغاء"}
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setShowAdd(true)}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-green-700 transition-colors mt-1"
              >
                <Plus size={12} />
                {lang === "fr" ? "Ajouter une échéance" : "إضافة دفعة"}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
