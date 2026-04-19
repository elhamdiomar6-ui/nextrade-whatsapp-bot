"use client";

import { useLang } from "@/contexts/LangContext";
import { UserCheck, CalendarDays, Building2, FileText } from "lucide-react";
import { AttachmentsPanel } from "@/components/AttachmentsPanel";
import type { AttachmentRow } from "@/actions/attachments";

interface VisitRow {
  id: string;
  date: string;
  agentName: string;
  company: string | null;
  notes: string | null;
  readingsCount: number;
  documentsCount: number;
  unitsVisited: string[];
  attachments: AttachmentRow[];
}

export function VisitsClient({ visits }: { visits: VisitRow[] }) {
  const { lang, isRtl } = useLang();

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="space-y-3">
      {visits.length === 0 ? (
        <p className="text-center text-gray-400 py-10">
          {lang === "fr" ? "Aucune visite enregistrée." : "لا توجد زيارات مسجلة."}
        </p>
      ) : (
        visits.map((v) => (
          <div key={v.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <UserCheck size={16} className="text-green-700 shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{v.agentName}</p>
                  {v.company && <p className="text-xs text-gray-400">{v.company}</p>}
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-400 shrink-0">
                <CalendarDays size={12} />
                {new Date(v.date).toLocaleDateString(lang === "fr" ? "fr-MA" : "ar-MA", { day: "2-digit", month: "short", year: "numeric" })}
              </div>
            </div>

            {v.unitsVisited.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <Building2 size={12} className="text-gray-400 shrink-0" />
                {v.unitsVisited.map((u) => (
                  <span key={u} className="text-xs bg-green-50 text-green-700 px-1.5 py-0.5 rounded">{u}</span>
                ))}
              </div>
            )}

            <div className="flex gap-4 text-xs text-gray-500">
              {v.readingsCount > 0 && <span>📊 {v.readingsCount} {lang === "fr" ? "relevé(s)" : "قراءة"}</span>}
              {v.documentsCount > 0 && (
                <span className="flex items-center gap-1">
                  <FileText size={11} />{v.documentsCount} {lang === "fr" ? "doc(s)" : "وثيقة"}
                </span>
              )}
            </div>

            {v.notes && <p className="text-xs text-gray-400 italic border-t border-gray-50 pt-2">{v.notes}</p>}

            <AttachmentsPanel
              entityType="visit"
              entityId={v.id}
              initialAttachments={v.attachments}
            />
          </div>
        ))
      )}
    </div>
  );
}
