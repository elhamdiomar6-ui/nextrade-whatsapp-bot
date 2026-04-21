"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useLang } from "@/contexts/LangContext";
import { Wrench, Clock, CheckCircle, XCircle, AlertCircle, Phone, Pencil, Trash2 } from "lucide-react";
import type { InterventionStatus } from "@prisma/client";
import { NewInterventionForm } from "@/components/forms/NewInterventionForm";
import { EditInterventionForm } from "@/components/forms/EditInterventionForm";
import { AttachmentsPanel } from "@/components/AttachmentsPanel";
import type { AttachmentRow } from "@/actions/attachments";
import { deleteIntervention } from "@/actions/interventions";

interface InterventionRow {
  id: string;
  title: string;
  description: string | null;
  date: string;
  status: InterventionStatus;
  contractorName: string | null;
  contractorPhone: string | null;
  mediaCount: number;
  documentsCount: number;
  attachments: AttachmentRow[];
}

const statusConfig: Record<InterventionStatus, { color: string; icon: React.ReactNode; fr: string; ar: string }> = {
  PENDING:    { color: "bg-gray-100 text-gray-600",   icon: <Clock size={13} />,        fr: "En attente",  ar: "قيد الانتظار" },
  IN_PROGRESS:{ color: "bg-blue-100 text-blue-700",   icon: <AlertCircle size={13} />,  fr: "En cours",    ar: "جارٍ" },
  COMPLETED:  { color: "bg-green-100 text-green-700", icon: <CheckCircle size={13} />,  fr: "Terminée",    ar: "منتهية" },
  CANCELLED:  { color: "bg-red-100 text-red-600",     icon: <XCircle size={13} />,      fr: "Annulée",     ar: "ملغاة" },
};

export function InterventionsClient({ interventions }: { interventions: InterventionRow[] }) {
  const { lang, isRtl } = useLang();
  const { data: session } = useSession();
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, startDelete] = useTransition();

  const isViewer = session?.user?.role === "VIEWER";
  const open = interventions.filter((i) => i.status !== "COMPLETED" && i.status !== "CANCELLED");

  const handleDelete = (id: string) => {
    startDelete(async () => {
      await deleteIntervention(id);
      setConfirmDeleteId(null);
      router.refresh();
    });
  };

  const editing = interventions.find((i) => i.id === editingId);

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{interventions.length} {lang === "fr" ? "intervention(s)" : "تدخل"}</p>
        <NewInterventionForm />
      </div>

      {open.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-center gap-2">
          <AlertCircle size={16} className="text-amber-600 shrink-0" />
          <p className="text-sm text-amber-700 font-medium">
            {lang === "fr" ? `${open.length} intervention(s) ouverte(s)` : `${open.length} تدخل مفتوح`}
          </p>
        </div>
      )}

      {interventions.length === 0 ? (
        <p className="text-center text-gray-400 py-10">{lang === "fr" ? "Aucune intervention." : "لا توجد تدخلات."}</p>
      ) : (
        <div className="space-y-3">
          {interventions.map((i) => {
            const sc = statusConfig[i.status];
            return (
              <div key={i.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <Wrench size={16} className="text-gray-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{i.title}</p>
                      {i.description && <p className="text-xs text-gray-400 mt-0.5">{i.description}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${sc.color}`}>
                      {sc.icon}{sc[lang]}
                    </span>
                    {!isViewer && (
                      <>
                        <button
                          onClick={() => setEditingId(i.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title={lang === "fr" ? "Modifier" : "تعديل"}
                        >
                          <Pencil size={13} />
                        </button>
                        {confirmDeleteId === i.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(i.id)}
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
                            onClick={() => setConfirmDeleteId(i.id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title={lang === "fr" ? "Supprimer" : "حذف"}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                  <span>{new Date(i.date).toLocaleDateString(lang === "fr" ? "fr-MA" : "ar-MA", { day: "2-digit", month: "long", year: "numeric" })}</span>
                  {i.contractorName && (
                    <span className="flex items-center gap-1">
                      <Phone size={11} /> {i.contractorName}{i.contractorPhone ? ` · ${i.contractorPhone}` : ""}
                    </span>
                  )}
                </div>

                <AttachmentsPanel
                  entityType="intervention"
                  entityId={i.id}
                  initialAttachments={i.attachments}
                  phases
                  collapsible
                  defaultOpen={i.attachments.length > 0}
                />
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <EditInterventionForm
          intervention={editing}
          onClose={() => setEditingId(null)}
        />
      )}
    </div>
  );
}
