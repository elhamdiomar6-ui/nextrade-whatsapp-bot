"use client";
import { useState, useTransition } from "react";
import { useLang } from "@/contexts/LangContext";
import { useToast } from "@/components/Toast";
import { renameDocument, toggleOfficialDocument, deleteDocumentAdmin } from "@/actions/admin-documents";
import { useRouter } from "next/navigation";
import {
  FileText, ExternalLink, Pencil, Trash2, Star, StarOff, Search, X, Save,
} from "lucide-react";

interface DocRow {
  id: string; title: string; type: string; url: string;
  date: string; createdAt: string; isOfficial: boolean;
  context: string; entityType: string;
  subscriptionId: string | null; interventionId: string | null;
  expenseId: string | null; invoiceId: string | null;
}

const typeColors: Record<string, string> = {
  CONTRACT: "bg-blue-100 text-blue-700",
  INVOICE: "bg-green-100 text-green-700",
  REPORT: "bg-purple-100 text-purple-700",
  PERMIT: "bg-amber-100 text-amber-700",
  OTHER: "bg-gray-100 text-gray-600",
};

export function AdminDocumentsClient({ documents }: { documents: DocRow[] }) {
  const { lang, isRtl } = useLang();
  const { showToast } = useToast();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filtered = documents.filter((d) => {
    const matchSearch = d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.context.toLowerCase().includes(search.toLowerCase());
    const matchType = !typeFilter || d.type === typeFilter;
    return matchSearch && matchType;
  });

  function startRename(d: DocRow) {
    setRenameId(d.id);
    setRenameVal(d.title);
    setConfirmDeleteId(null);
  }

  function saveRename(id: string) {
    startTransition(async () => {
      const res = await renameDocument(id, renameVal);
      if (res.success) {
        showToast(lang === "fr" ? "Renommé avec succès" : "تم إعادة التسمية");
        setRenameId(null);
        router.refresh();
      } else showToast(res.error ?? "Erreur", "error");
    });
  }

  function toggleOfficial(id: string, current: boolean) {
    startTransition(async () => {
      const res = await toggleOfficialDocument(id, !current);
      if (res.success) {
        showToast(lang === "fr"
          ? (!current ? "Marqué document officiel" : "Marqué non officiel")
          : (!current ? "تم التحديد كوثيقة رسمية" : "تم إلغاء الوثيقة الرسمية"));
        router.refresh();
      } else showToast(res.error ?? "Erreur", "error");
    });
  }

  function deleteDoc(id: string) {
    startTransition(async () => {
      const res = await deleteDocumentAdmin(id);
      if (res.success) {
        showToast(lang === "fr" ? "Document supprimé" : "تم حذف الوثيقة");
        setConfirmDeleteId(null);
        router.refresh();
      } else showToast(res.error ?? "Erreur", "error");
    });
  }

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={lang === "fr" ? "Rechercher…" : "بحث…"}
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-1 focus:ring-green-500 outline-none"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
              <X size={14} />
            </button>
          )}
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-1 focus:ring-green-500 outline-none"
        >
          <option value="">{lang === "fr" ? "Tous types" : "كل الأنواع"}</option>
          {["CONTRACT", "INVOICE", "REPORT", "PERMIT", "OTHER"].map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <span className="text-xs text-gray-400 self-center whitespace-nowrap">
          {filtered.length} {lang === "fr" ? "doc(s)" : "وثيقة"}
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <p className="text-center text-gray-400 py-10 text-sm">{lang === "fr" ? "Aucun document." : "لا توجد وثائق."}</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs">
                <th className="px-4 py-3 text-start font-medium">{lang === "fr" ? "Titre" : "العنوان"}</th>
                <th className="px-4 py-3 text-start font-medium hidden sm:table-cell">{lang === "fr" ? "Type" : "النوع"}</th>
                <th className="px-4 py-3 text-start font-medium hidden md:table-cell">{lang === "fr" ? "Contexte" : "السياق"}</th>
                <th className="px-4 py-3 text-center font-medium hidden lg:table-cell">{lang === "fr" ? "Officiel" : "رسمي"}</th>
                <th className="px-4 py-3 text-end font-medium hidden sm:table-cell">{lang === "fr" ? "Date" : "التاريخ"}</th>
                <th className="px-4 py-3 text-end font-medium">{lang === "fr" ? "Actions" : "إجراءات"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((d) => (
                <tr key={d.id} className="group hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    {renameId === d.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          value={renameVal}
                          onChange={(e) => setRenameVal(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") saveRename(d.id); if (e.key === "Escape") setRenameId(null); }}
                          autoFocus
                          className="text-xs px-2 py-1 border border-green-400 rounded-lg flex-1 outline-none focus:ring-1 focus:ring-green-500"
                        />
                        <button onClick={() => saveRename(d.id)} disabled={pending} className="p-1 bg-green-700 text-white rounded-lg hover:bg-green-800 disabled:opacity-50">
                          <Save size={12} />
                        </button>
                        <button onClick={() => setRenameId(null)} className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100">
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-gray-400 shrink-0" />
                        <span className="font-medium text-gray-900 truncate max-w-[200px]">{d.title}</span>
                        {d.isOfficial && <Star size={12} className="text-amber-500 shrink-0" />}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColors[d.type] ?? typeColors.OTHER}`}>
                      {d.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 hidden md:table-cell">{d.context}</td>
                  <td className="px-4 py-3 text-center hidden lg:table-cell">
                    <button
                      onClick={() => toggleOfficial(d.id, d.isOfficial)}
                      disabled={pending}
                      className={`p-1 rounded-lg transition-colors ${d.isOfficial ? "text-amber-500 hover:bg-amber-50" : "text-gray-300 hover:text-amber-400 hover:bg-amber-50"}`}
                      title={d.isOfficial ? "Retirer officiel" : "Marquer officiel"}
                    >
                      {d.isOfficial ? <Star size={14} /> : <StarOff size={14} />}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-end text-xs text-gray-400 hidden sm:table-cell">
                    {new Date(d.date).toLocaleDateString(lang === "fr" ? "fr-MA" : "ar-MA", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3 text-end">
                    <div className="flex items-center justify-end gap-1">
                      <a href={d.url} target="_blank" rel="noopener noreferrer"
                        className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                        <ExternalLink size={13} />
                      </a>
                      <button onClick={() => startRename(d)}
                        className="p-1.5 text-gray-400 hover:text-green-700 rounded-lg hover:bg-green-50 transition-colors">
                        <Pencil size={13} />
                      </button>
                      {confirmDeleteId === d.id ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => deleteDoc(d.id)} disabled={pending}
                            className="text-xs text-white bg-red-600 hover:bg-red-700 px-2 py-0.5 rounded-lg disabled:opacity-50">
                            {lang === "fr" ? "Oui" : "نعم"}
                          </button>
                          <button onClick={() => setConfirmDeleteId(null)}
                            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-0.5 rounded-lg hover:bg-gray-100">
                            {lang === "fr" ? "Non" : "لا"}
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmDeleteId(d.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
