"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/contexts/LangContext";
import { X, Wrench } from "lucide-react";
import { updateIntervention } from "@/actions/interventions";
import type { InterventionStatus } from "@prisma/client";

interface Props {
  intervention: {
    id: string; title: string; description: string | null; status: InterventionStatus;
    contractorName: string | null; contractorPhone: string | null;
  };
  onClose: () => void;
}

const statusOptions: { value: InterventionStatus; fr: string; ar: string }[] = [
  { value: "PENDING",     fr: "En attente",  ar: "قيد الانتظار" },
  { value: "IN_PROGRESS", fr: "En cours",    ar: "جارٍ" },
  { value: "COMPLETED",   fr: "Terminée",    ar: "منتهية" },
  { value: "CANCELLED",   fr: "Annulée",     ar: "ملغاة" },
];

export function EditInterventionForm({ intervention, onClose }: Props) {
  const { lang } = useLang();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [title, setTitle] = useState(intervention.title);
  const [description, setDescription] = useState(intervention.description ?? "");
  const [status, setStatus] = useState<InterventionStatus>(intervention.status);
  const [contractorName, setContractorName] = useState(intervention.contractorName ?? "");
  const [contractorPhone, setContractorPhone] = useState(intervention.contractorPhone ?? "");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      try {
        await updateIntervention(intervention.id, {
          title, description: description || undefined, status,
          contractorName: contractorName || undefined,
          contractorPhone: contractorPhone || undefined,
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
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Wrench size={18} className="text-gray-600" />
            <h2 className="font-semibold text-gray-900 text-sm">
              {lang === "fr" ? "Modifier l'intervention" : "تعديل التدخل"}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1.5">{lang === "fr" ? "Titre" : "العنوان"} *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1.5">{lang === "fr" ? "Statut" : "الحالة"}</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as InterventionStatus)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500">
              {statusOptions.map((s) => (
                <option key={s.value} value={s.value}>{lang === "fr" ? s.fr : s.ar}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1.5">{lang === "fr" ? "Description" : "وصف"}</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
          </div>

          <div className="border-t border-gray-100 pt-3">
            <p className="text-xs font-medium text-gray-500 mb-3">{lang === "fr" ? "Prestataire" : "المقاول"}</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1.5">{lang === "fr" ? "Nom" : "الاسم"}</label>
                <input type="text" value={contractorName} onChange={(e) => setContractorName(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1.5">{lang === "fr" ? "Téléphone" : "الهاتف"}</label>
                <input type="tel" value={contractorPhone} onChange={(e) => setContractorPhone(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
            </div>
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
