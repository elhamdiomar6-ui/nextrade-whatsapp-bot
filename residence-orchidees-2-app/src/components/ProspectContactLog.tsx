"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useLang } from "@/contexts/LangContext";
import { Phone, Home, MessageCircle, Mail, ChevronDown, ChevronUp, Plus, Trash2, Calendar } from "lucide-react";
import type { ContactType } from "@prisma/client";
import { addProspectContact, deleteProspectContact } from "@/actions/prospect-contacts";

export interface ContactRow {
  id: string;
  type: ContactType;
  notes: string | null;
  date: string;
}

const contactTypeOptions: { value: ContactType; icon: React.ReactNode; fr: string; ar: string }[] = [
  { value: "APPEL",    icon: <Phone size={13} />,          fr: "Appel",    ar: "مكالمة" },
  { value: "VISITE",   icon: <Home size={13} />,           fr: "Visite",   ar: "زيارة" },
  { value: "WHATSAPP", icon: <MessageCircle size={13} />,  fr: "WhatsApp", ar: "واتساب" },
  { value: "MESSAGE",  icon: <MessageCircle size={13} />,  fr: "Message",  ar: "رسالة" },
  { value: "EMAIL",    icon: <Mail size={13} />,           fr: "Email",    ar: "بريد" },
];

const typeIcon: Record<ContactType, string> = {
  APPEL: "📞", VISITE: "🏠", MESSAGE: "💬", WHATSAPP: "📱", EMAIL: "📧",
};

interface Props {
  prospectId: string;
  contacts: ContactRow[];
}

export function ProspectContactLog({ prospectId, contacts }: Props) {
  const { lang } = useLang();
  const { data: session } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [pending, startTransition] = useTransition();

  const [type, setType] = useState<ContactType>("APPEL");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const isViewer = session?.user?.role === "VIEWER";

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      await addProspectContact({ prospectId, type, notes: notes || undefined, date });
      setNotes(""); setDate(new Date().toISOString().slice(0, 10));
      setShowAdd(false);
      router.refresh();
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deleteProspectContact(id);
      router.refresh();
    });
  };

  return (
    <div className="border-t border-gray-50 pt-2">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-xs text-gray-400 hover:text-green-700 transition-colors"
      >
        <Calendar size={13} />
        <span>{lang === "fr" ? "Historique contacts" : "سجل الاتصالات"}</span>
        {contacts.length > 0 && (
          <span className="font-bold text-green-700">{contacts.length}</span>
        )}
        {open ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
      </button>

      {open && (
        <div className="mt-2 space-y-1.5">
          {contacts.length === 0 && (
            <p className="text-xs text-gray-400 italic py-1">
              {lang === "fr" ? "Aucun contact enregistré" : "لا يوجد سجل اتصالات"}
            </p>
          )}

          {contacts.map((c) => (
            <div key={c.id} className="flex items-start gap-2 py-1 border-b border-gray-50 last:border-0">
              <span className="text-sm shrink-0">{typeIcon[c.type]}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-600">
                  {new Date(c.date).toLocaleDateString(lang === "fr" ? "fr-MA" : "ar-MA", { day: "2-digit", month: "short", year: "numeric" })}
                </p>
                {c.notes && <p className="text-xs text-gray-400 mt-0.5 italic">{c.notes}</p>}
              </div>
              {!isViewer && (
                <button
                  onClick={() => handleDelete(c.id)}
                  disabled={pending}
                  className="shrink-0 p-1 text-gray-300 hover:text-red-400 transition-colors disabled:opacity-40"
                >
                  <Trash2 size={11} />
                </button>
              )}
            </div>
          ))}

          {!isViewer && (
            showAdd ? (
              <form onSubmit={handleAdd} className="bg-gray-50 rounded-xl p-3 space-y-2 mt-1">
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as ContactType)}
                    className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-green-500"
                  >
                    {contactTypeOptions.map((o) => (
                      <option key={o.value} value={o.value}>{lang === "fr" ? o.fr : o.ar}</option>
                    ))}
                  </select>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-green-500 bg-white"
                  />
                </div>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={lang === "fr" ? "Notes (optionnel)..." : "ملاحظات (اختياري)..."}
                  className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-green-500 bg-white"
                />
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
                {lang === "fr" ? "Ajouter un contact" : "إضافة اتصال"}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
