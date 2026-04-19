"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/contexts/LangContext";
import { X, UserPlus } from "lucide-react";
import { updateProspect } from "@/actions/prospects";
import type { ProspectStatus } from "@prisma/client";

interface Props {
  prospect: {
    id: string; name: string; phone: string | null; whatsapp: string | null;
    email: string | null; status: ProspectStatus; notes: string | null;
  };
  onClose: () => void;
}

const statusOptions: { value: ProspectStatus; fr: string; ar: string }[] = [
  { value: "NOUVEAU",     fr: "Nouveau",      ar: "جديد" },
  { value: "CONTACTE",    fr: "Contacté",     ar: "تم التواصل" },
  { value: "VISITE",      fr: "Visite",       ar: "زيارة" },
  { value: "NEGOCIATION", fr: "Négociation",  ar: "تفاوض" },
  { value: "SIGNE",       fr: "Signé",        ar: "موقّع" },
  { value: "PERDU",       fr: "Perdu",        ar: "خسارة" },
];

export function EditProspectForm({ prospect, onClose }: Props) {
  const { lang } = useLang();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [name, setName] = useState(prospect.name);
  const [phone, setPhone] = useState(prospect.phone ?? "");
  const [whatsapp, setWhatsapp] = useState(prospect.whatsapp ?? "");
  const [email, setEmail] = useState(prospect.email ?? "");
  const [status, setStatus] = useState<ProspectStatus>(prospect.status);
  const [notes, setNotes] = useState(prospect.notes ?? "");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      try {
        await updateProspect(prospect.id, {
          name, phone: phone || undefined, whatsapp: whatsapp || undefined,
          email: email || undefined, status, notes: notes || undefined,
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
            <UserPlus size={18} className="text-green-700" />
            <h2 className="font-semibold text-gray-900 text-sm">
              {lang === "fr" ? "Modifier le prospect" : "تعديل العميل"}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1.5">{lang === "fr" ? "Nom complet" : "الاسم الكامل"} *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1.5">{lang === "fr" ? "Statut" : "الحالة"}</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as ProspectStatus)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500">
              {statusOptions.map((s) => (
                <option key={s.value} value={s.value}>{lang === "fr" ? s.fr : s.ar}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1.5">{lang === "fr" ? "Téléphone" : "الهاتف"}</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="06..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1.5">WhatsApp</label>
              <input type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="06..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1.5">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
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
