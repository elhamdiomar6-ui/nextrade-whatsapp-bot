"use client";

import { useLang } from "@/contexts/LangContext";
import { FolderOpen, FileText, ExternalLink } from "lucide-react";
import type { DocumentType } from "@prisma/client";

interface DocRow {
  id: string;
  title: string;
  type: DocumentType;
  url: string;
  date: string;
  context: string;
}

const typeLabel: Record<DocumentType, { fr: string; ar: string; color: string }> = {
  CONTRACT: { fr: "Contrat",   ar: "عقد",     color: "bg-blue-100 text-blue-700" },
  INVOICE:  { fr: "Facture",   ar: "فاتورة",  color: "bg-green-100 text-green-700" },
  REPORT:   { fr: "Rapport",   ar: "تقرير",   color: "bg-purple-100 text-purple-700" },
  PERMIT:   { fr: "Permis",    ar: "تصريح",   color: "bg-amber-100 text-amber-700" },
  OTHER:    { fr: "Autre",     ar: "أخرى",    color: "bg-gray-100 text-gray-600" },
};

export function DocumentsClient({ documents }: { documents: DocRow[] }) {
  const { lang, isRtl } = useLang();

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="space-y-3">
      <div className="flex items-center gap-2 text-gray-500 text-sm">
        <FolderOpen size={16} className="text-green-700" />
        <span>{documents.length} {lang === "fr" ? "document(s)" : "وثيقة"}</span>
      </div>

      {documents.length === 0 ? (
        <p className="text-center text-gray-400 py-10">{lang === "fr" ? "Aucun document." : "لا توجد وثائق."}</p>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs">
                <th className="px-4 py-3 text-start font-medium">{lang === "fr" ? "Titre" : "العنوان"}</th>
                <th className="px-4 py-3 text-start font-medium hidden sm:table-cell">{lang === "fr" ? "Type" : "النوع"}</th>
                <th className="px-4 py-3 text-start font-medium hidden md:table-cell">{lang === "fr" ? "Contexte" : "السياق"}</th>
                <th className="px-4 py-3 text-end font-medium hidden sm:table-cell">{lang === "fr" ? "Date" : "التاريخ"}</th>
                <th className="px-4 py-3 text-center font-medium">{lang === "fr" ? "Fichier" : "الملف"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {documents.map((d) => {
                const tl = typeLabel[d.type];
                return (
                  <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-gray-400 shrink-0" />
                        <span className="font-medium text-gray-900">{d.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tl.color}`}>
                        {tl[lang]}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-xs text-gray-500">{d.context}</td>
                    <td className="px-4 py-3 text-end text-xs text-gray-400 hidden sm:table-cell">
                      {new Date(d.date).toLocaleDateString(lang === "fr" ? "fr-MA" : "ar-MA", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <a href={d.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-green-700 hover:underline">
                        <ExternalLink size={13} />
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
