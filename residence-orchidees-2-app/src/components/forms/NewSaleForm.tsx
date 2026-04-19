"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { fmt } from "@/lib/fmt";
import { useSession } from "next-auth/react";
import { useLang } from "@/contexts/LangContext";
import { Plus, X, HandshakeIcon } from "lucide-react";
import { createSale } from "@/actions/sales";
import type { UnitKind } from "@prisma/client";

export interface AvailableLot {
  id: string;
  name: string;
  kind: UnitKind;
  price: number | null;
}

export function NewSaleForm({ availableLots }: { availableLots: AvailableLot[] }) {
  const { data: session } = useSession();
  const { lang } = useLang();
  const router = useRouter();

  if (session?.user?.role === "VIEWER") return null;
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const [lotId, setLotId] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [notaryName, setNotaryName] = useState("");
  const [error, setError] = useState("");

  const selectedLot = availableLots.find((l) => l.id === lotId);

  const reset = () => {
    setLotId(""); setBuyerName(""); setBuyerPhone("");
    setTotalAmount(""); setDepositAmount(""); setNotaryName(""); setError("");
  };
  const close = () => { reset(); setOpen(false); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lotId || !buyerName || !totalAmount) return;
    setError("");

    startTransition(async () => {
      try {
        await createSale({
          lotId,
          buyerName,
          buyerPhone: buyerPhone || undefined,
          totalAmount: parseFloat(totalAmount),
          depositAmount: parseFloat(depositAmount || "0"),
          notaryName: notaryName || undefined,
        });
        close();
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      }
    });
  };

  if (availableLots.length === 0) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 bg-green-700 text-white text-sm px-3 py-1.5 rounded-xl hover:bg-green-800 transition-colors"
      >
        <Plus size={15} />
        {lang === "fr" ? "Nouvelle vente" : "بيع جديد"}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white">
              <div className="flex items-center gap-2">
                <HandshakeIcon size={18} className="text-green-700" />
                <h2 className="font-semibold text-gray-900 text-sm">
                  {lang === "fr" ? "Nouvelle vente" : "بيع جديد"}
                </h2>
              </div>
              <button onClick={close} className="text-gray-400 hover:text-gray-700 transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Lot */}
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">
                  {lang === "fr" ? "Lot / Bien" : "الوحدة"} *
                </label>
                <select
                  value={lotId}
                  onChange={(e) => {
                    setLotId(e.target.value);
                    const l = availableLots.find((x) => x.id === e.target.value);
                    if (l?.price) setTotalAmount(String(l.price));
                  }}
                  required
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">{lang === "fr" ? "Sélectionner un lot..." : "اختر وحدة..."}</option>
                  {availableLots.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} {l.kind === "SHOP" ? "(Magasin)" : "(Appart.)"}{l.price ? ` — ${fmt(l.price)} MAD` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Buyer */}
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">
                  {lang === "fr" ? "Nom de l'acheteur" : "اسم المشتري"} *
                </label>
                <input
                  type="text"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  required
                  placeholder={lang === "fr" ? "Prénom Nom..." : "اسم المشتري..."}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">
                  {lang === "fr" ? "Téléphone acheteur" : "هاتف المشتري"}
                </label>
                <input
                  type="tel"
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(e.target.value)}
                  placeholder="06..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Amounts */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1.5">
                    {lang === "fr" ? "Prix total (MAD)" : "السعر الإجمالي (درهم)"} *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    required
                    placeholder="0"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1.5">
                    {lang === "fr" ? "Acompte (MAD)" : "العربون (درهم)"}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="0"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              {totalAmount && depositAmount && (
                <p className="text-xs text-gray-500">
                  {lang === "fr" ? "Reste à payer : " : "المتبقي : "}
                  <span className="font-semibold text-amber-600">
                    {fmt(parseFloat(totalAmount || "0") - parseFloat(depositAmount || "0"))} MAD
                  </span>
                </p>
              )}

              {/* Notary */}
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">
                  {lang === "fr" ? "Notaire (optionnel)" : "الموثق (اختياري)"}
                </label>
                <input
                  type="text"
                  value={notaryName}
                  onChange={(e) => setNotaryName(e.target.value)}
                  placeholder={lang === "fr" ? "Nom du notaire..." : "اسم الموثق..."}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={close} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-800 rounded-xl hover:bg-gray-100 transition-colors">
                  {lang === "fr" ? "Annuler" : "إلغاء"}
                </button>
                <button type="submit" disabled={pending} className="px-5 py-2 bg-green-700 text-white text-sm font-medium rounded-xl hover:bg-green-800 disabled:opacity-60 transition-colors">
                  {pending ? "…" : (lang === "fr" ? "Créer la vente" : "إنشاء البيع")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
