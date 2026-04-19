"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useLang } from "@/contexts/LangContext";
import { Phone, Mail, MessageCircle, Calendar, Paperclip, ChevronDown, ChevronUp, Pencil, Trash2 } from "lucide-react";
import type { ProspectStatus, LotStatus, ContactType } from "@prisma/client";
import { NewProspectForm, type LotOption } from "@/components/forms/NewProspectForm";
import { EditProspectForm } from "@/components/forms/EditProspectForm";
import { AttachmentsPanel } from "@/components/AttachmentsPanel";
import type { AttachmentRow } from "@/actions/attachments";
import { deleteProspect } from "@/actions/prospects";
import { ProspectContactLog, type ContactRow } from "@/components/ProspectContactLog";

interface ProspectRow {
  id: string; name: string; phone: string | null; whatsapp: string | null;
  email: string | null; status: ProspectStatus; notes: string | null; source: string | null;
  contactsCount: number;
  lastContact: { type: ContactType; date: string } | null;
  lots: { id: string; name: string; status: LotStatus }[];
  createdAt: string; updatedAt: string;
  attachments: AttachmentRow[];
  contacts: ContactRow[];
}

interface Props {
  prospects: ProspectRow[];
  statusCounts: Record<ProspectStatus, number>;
  availableLots: LotOption[];
}

const statusColors: Record<ProspectStatus, string> = {
  NOUVEAU: "bg-gray-100 text-gray-600", CONTACTE: "bg-blue-100 text-blue-700",
  VISITE: "bg-purple-100 text-purple-700", NEGOCIATION: "bg-amber-100 text-amber-700",
  SIGNE: "bg-green-100 text-green-700", PERDU: "bg-red-100 text-red-700",
};

const contactTypeIcon: Record<ContactType, string> = {
  APPEL: "📞", VISITE: "🏠", MESSAGE: "💬", WHATSAPP: "📱", EMAIL: "📧",
};

export function ProspectsClient({ prospects, statusCounts, availableLots }: Props) {
  const { t, lang, isRtl } = useLang();
  const { data: session } = useSession();
  const router = useRouter();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, startDelete] = useTransition();
  const tp = t.prospects;

  const isViewer = session?.user?.role === "VIEWER";

  const statusLabel: Record<ProspectStatus, string> = {
    NOUVEAU: tp.nouveau, CONTACTE: tp.contacte, VISITE: tp.visite,
    NEGOCIATION: tp.negociation, SIGNE: tp.signe, PERDU: tp.perdu,
  };
  const pipeline: ProspectStatus[] = ["NOUVEAU", "CONTACTE", "VISITE", "NEGOCIATION", "SIGNE", "PERDU"];

  const handleDelete = (id: string) => {
    startDelete(async () => {
      await deleteProspect(id);
      setConfirmDeleteId(null);
      router.refresh();
    });
  };

  const editing = prospects.find((p) => p.id === editingId);

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{prospects.length} {lang === "fr" ? "prospect(s)" : "عميل محتمل"}</p>
        <NewProspectForm lots={availableLots} />
      </div>

      {/* Pipeline bar */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {pipeline.map((s) => (
          <div key={s} className={`shrink-0 rounded-xl px-3 py-2 text-center min-w-[90px] ${statusColors[s]}`}>
            <p className="text-lg font-bold">{statusCounts[s]}</p>
            <p className="text-xs font-medium mt-0.5">{statusLabel[s]}</p>
          </div>
        ))}
      </div>

      {prospects.length === 0 ? (
        <p className="text-center text-gray-400 py-12">{tp.noProspects}</p>
      ) : (
        <div className="space-y-3">
          {prospects.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
              {/* Header row */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-gray-900">{p.name}</p>
                  <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-500">
                    {p.phone && <span className="flex items-center gap-1"><Phone size={11} />{p.phone}</span>}
                    {p.whatsapp && <span className="flex items-center gap-1 text-green-600"><MessageCircle size={11} />{p.whatsapp}</span>}
                    {p.email && <span className="flex items-center gap-1"><Mail size={11} />{p.email}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[p.status]}`}>
                    {statusLabel[p.status]}
                  </span>
                  {!isViewer && (
                    <>
                      <button
                        onClick={() => setEditingId(p.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        <Pencil size={13} />
                      </button>
                      {confirmDeleteId === p.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(p.id)}
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
                          onClick={() => setConfirmDeleteId(p.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Lots */}
              {p.lots.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {p.lots.map((l) => (
                    <span key={l.id} className="text-xs px-1.5 py-0.5 bg-green-50 text-green-700 rounded">{l.name}</span>
                  ))}
                </div>
              )}

              {/* Last contact */}
              {p.lastContact && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span>{contactTypeIcon[p.lastContact.type]}</span>
                  <Calendar size={11} />
                  {new Date(p.lastContact.date).toLocaleDateString(lang === "fr" ? "fr-MA" : "ar-MA", { day: "2-digit", month: "short", year: "numeric" })}
                </div>
              )}

              {p.notes && <p className="text-xs text-gray-400 italic">{p.notes}</p>}

              {/* Contact log */}
              <ProspectContactLog prospectId={p.id} contacts={p.contacts} />

              {/* Attachments toggle */}
              <button
                onClick={() => setExpanded(expanded === p.id ? null : p.id)}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-green-700 transition-colors"
              >
                <Paperclip size={13} />
                {p.attachments.length > 0
                  ? <span className="text-green-700 font-bold">{p.attachments.length} {lang === "fr" ? "fichier(s)" : "ملف"}</span>
                  : <span>{lang === "fr" ? "Ajouter fichier" : "إضافة ملف"}</span>}
                {expanded === p.id ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
              </button>

              {expanded === p.id && (
                <AttachmentsPanel
                  entityType="prospect"
                  entityId={p.id}
                  initialAttachments={p.attachments}
                  collapsible={false}
                  defaultOpen
                />
              )}
            </div>
          ))}
        </div>
      )}

      {editing && (
        <EditProspectForm
          prospect={editing}
          onClose={() => setEditingId(null)}
        />
      )}
    </div>
  );
}
