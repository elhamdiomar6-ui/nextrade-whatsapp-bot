"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useLang } from "@/contexts/LangContext";
import { Plus, X, UserPlus } from "lucide-react";
import { createProspect } from "@/actions/prospects";
import type { LotStatus, UnitKind } from "@prisma/client";

export interface LotOption {
  id: string;
  name: string;
  status: LotStatus;
  kind: UnitKind;
}

export function NewProspectForm({ lots }: { lots: LotOption[] }) {
  const { data: session } = useSession();
  const { lang } = useLang();
  const router = useRouter();

  if (session?.user?.role === "VIEWER") return null;
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [selectedLots, setSelectedLots] = useState<string[]>([]);
  const [error, setError] = useState("");

  const available = lots.filter((l) => l.status === "DISPONIBLE");

  const toggleLot = (id: string) =>
    setSelectedLots((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const reset = () => {
    setName(""); setPhone(""); setWhatsapp(""); setSelectedLots([]); setError("");
  };
  const close = () => { reset(); setOpen(false); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    setError("");

    startTransition(async () => {
      try {
        await createProspect({
          name,
          phone: phone || undefined,
          whatsapp: whatsapp || undefined,
          lotIds: selectedLots,
        });
        close();
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      }
    });
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 bg-green-700 text-white text-sm px-3 py-1.5 rounded-xl hover:bg-green-800 transition-colors"
      >
        <Plus size={15} />
        {lang === "fr" ? "Nouveau prospect" : "عميل جديد"}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white">
              <div className="flex items-center gap-2">
                <UserPlus size={18} className="text-green-700" />
                <h2 className="font-semibold text-gray-900 text-sm">
                  {lang === "fr" ? "Nouveau prospect" : "عميل محتمل جديد"}
                </h2>
              </div>
              <button onClick={close} className="text-gray-400 hover:text-gray-700 transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">
                  {lang === "fr" ? "Nom complet" : "الاسم الكامل"} *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder={lang === "fr" ? "Prénom Nom..." : "الاسم الكامل..."}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1.5">
                    {lang === "fr" ? "Téléphone" : "الهاتف"}
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="06..."
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1.5">
                    WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="06..."
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              {/* Lots ciblés */}
              {available.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-2">
                    {lang === "fr" ? "Lots ciblés (optionnel)" : "الوحدات المستهدفة (اختياري)"}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {available.map((l) => (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => toggleLot(l.id)}
                        className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                          selectedLots.includes(l.id)
                            ? "bg-green-700 text-white border-green-700"
                            : "bg-white text-gray-600 border-gray-200 hover:border-green-400"
                        }`}
                      >
                        {l.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={close} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-800 rounded-xl hover:bg-gray-100 transition-colors">
                  {lang === "fr" ? "Annuler" : "إلغاء"}
                </button>
                <button type="submit" disabled={pending} className="px-5 py-2 bg-green-700 text-white text-sm font-medium rounded-xl hover:bg-green-800 disabled:opacity-60 transition-colors">
                  {pending ? "…" : (lang === "fr" ? "Ajouter" : "إضافة")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
