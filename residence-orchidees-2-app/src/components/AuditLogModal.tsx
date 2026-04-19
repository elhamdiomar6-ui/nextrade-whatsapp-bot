"use client";
import { useState, useTransition } from "react";
import { History, X, Clock, User } from "lucide-react";
import { getAuditLogs } from "@/actions/admin-data";
import { useLang } from "@/contexts/LangContext";

interface AuditEntry {
  id: string;
  userName: string;
  userEmail: string;
  field: string;
  oldValue: string | null;
  newValue: string | null;
  createdAt: Date;
}

interface Props {
  entity: string;
  entityId: string;
  entityLabel: string;
}

export function AuditLogButton({ entity, entityId, entityLabel }: Props) {
  const [open, setOpen] = useState(false);
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [pending, startTransition] = useTransition();
  const { lang } = useLang();

  function open_() {
    setOpen(true);
    startTransition(async () => {
      const data = await getAuditLogs(entity, entityId);
      setLogs(data as AuditEntry[]);
    });
  }

  return (
    <>
      <button
        onClick={open_}
        className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <History size={13} />
        {lang === "fr" ? "Historique" : "السجل"}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[70vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <History size={18} className="text-green-700" />
                <p className="font-semibold text-gray-900 text-sm">
                  {lang === "fr" ? "Historique des modifications" : "سجل التعديلات"} — {entityLabel}
                </p>
              </div>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-700 p-1">
                <X size={18} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-5">
              {pending ? (
                <p className="text-center text-gray-400 py-8 text-sm">{lang === "fr" ? "Chargement…" : "جارٍ التحميل…"}</p>
              ) : logs.length === 0 ? (
                <p className="text-center text-gray-400 py-8 text-sm">{lang === "fr" ? "Aucune modification enregistrée." : "لا توجد تعديلات."}</p>
              ) : (
                <div className="space-y-3">
                  {logs.map((l) => (
                    <div key={l.id} className="flex gap-3 text-sm">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                        <User size={14} className="text-green-700" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-gray-900">{l.userName}</span>
                          <span className="text-gray-400 text-xs">·</span>
                          <span className="font-medium text-gray-700">{l.field}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          <span className="line-through text-red-400">{l.oldValue ?? "—"}</span>
                          {" → "}
                          <span className="text-green-700 font-medium">{l.newValue ?? "—"}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                          <Clock size={11} />
                          {new Date(l.createdAt).toLocaleString(lang === "fr" ? "fr-MA" : "ar-MA", {
                            day: "2-digit", month: "short", year: "numeric",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
