"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useLang } from "@/contexts/LangContext";
import { Plus, X, Wrench } from "lucide-react";
import { createIntervention } from "@/actions/interventions";

export function NewInterventionForm() {
  const { data: session } = useSession();
  const { lang } = useLang();
  const router = useRouter();

  if (session?.user?.role === "VIEWER") return null;
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [contractorName, setContractorName] = useState("");
  const [contractorPhone, setContractorPhone] = useState("");
  const [error, setError] = useState("");

  const reset = () => {
    setTitle(""); setDescription(""); setContractorName(""); setContractorPhone(""); setError("");
  };
  const close = () => { reset(); setOpen(false); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    setError("");

    startTransition(async () => {
      try {
        await createIntervention({
          title,
          description: description || undefined,
          contractorName: contractorName || undefined,
          contractorPhone: contractorPhone || undefined,
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
        {lang === "fr" ? "Nouvelle intervention" : "تدخل جديد"}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Wrench size={18} className="text-gray-600" />
                <h2 className="font-semibold text-gray-900 text-sm">
                  {lang === "fr" ? "Nouvelle intervention" : "تدخل جديد"}
                </h2>
              </div>
              <button onClick={close} className="text-gray-400 hover:text-gray-700 transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">
                  {lang === "fr" ? "Titre" : "العنوان"} *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder={lang === "fr" ? "ex: Réparation porte garage..." : "مثال: إصلاح باب الجراج..."}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">
                  {lang === "fr" ? "Description (optionnel)" : "وصف (اختياري)"}
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder={lang === "fr" ? "Détails du problème..." : "تفاصيل المشكلة..."}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                />
              </div>

              <div className="border-t border-gray-100 pt-3">
                <p className="text-xs font-medium text-gray-500 mb-3">
                  {lang === "fr" ? "Prestataire (optionnel)" : "المقاول (اختياري)"}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1.5">
                      {lang === "fr" ? "Nom" : "الاسم"}
                    </label>
                    <input
                      type="text"
                      value={contractorName}
                      onChange={(e) => setContractorName(e.target.value)}
                      placeholder={lang === "fr" ? "Nom du prestataire" : "اسم المقاول"}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1.5">
                      {lang === "fr" ? "Téléphone" : "الهاتف"}
                    </label>
                    <input
                      type="tel"
                      value={contractorPhone}
                      onChange={(e) => setContractorPhone(e.target.value)}
                      placeholder="06..."
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
              </div>

              {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={close} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-800 rounded-xl hover:bg-gray-100 transition-colors">
                  {lang === "fr" ? "Annuler" : "إلغاء"}
                </button>
                <button type="submit" disabled={pending} className="px-5 py-2 bg-green-700 text-white text-sm font-medium rounded-xl hover:bg-green-800 disabled:opacity-60 transition-colors">
                  {pending ? "…" : (lang === "fr" ? "Créer" : "إنشاء")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
