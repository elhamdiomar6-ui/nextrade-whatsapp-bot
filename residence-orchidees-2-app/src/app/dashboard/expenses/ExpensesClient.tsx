"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { fmt } from "@/lib/fmt";
import { useSession } from "next-auth/react";
import { useLang } from "@/contexts/LangContext";
import { Wallet, BarChart3, Paperclip, ChevronDown, ChevronUp, Pencil, Trash2 } from "lucide-react";
import { NewExpenseForm, type CategoryOption } from "@/components/forms/NewExpenseForm";
import { EditExpenseForm } from "@/components/forms/EditExpenseForm";
import { AttachmentsPanel } from "@/components/AttachmentsPanel";
import type { AttachmentRow } from "@/actions/attachments";
import { deleteExpense } from "@/actions/expenses";

interface ExpenseRow {
  id: string;
  title: string;
  amount: number;
  date: string;
  description: string | null;
  categoryNameFr: string;
  categoryNameAr: string;
  categoryId: string;
  attachments: AttachmentRow[];
}

interface CategoryTotal { id: string; nameFr: string; nameAr: string | null; total: number; count: number }

interface Props {
  expenses: ExpenseRow[];
  totalByCategory: CategoryTotal[];
  grandTotal: number;
  categories: CategoryOption[];
}

export function ExpensesClient({ expenses, totalByCategory, grandTotal, categories }: Props) {
  const { lang, isRtl } = useLang();
  const { data: session } = useSession();
  const router = useRouter();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, startDelete] = useTransition();

  const isViewer = session?.user?.role === "VIEWER";
  const activeCats = totalByCategory.filter((c) => c.count > 0);

  const handleDelete = (id: string) => {
    startDelete(async () => {
      await deleteExpense(id);
      setConfirmDeleteId(null);
      router.refresh();
    });
  };

  const editing = expenses.find((e) => e.id === editingId);

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="space-y-5">
      {/* Grand total + button */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
            <Wallet size={22} className="text-red-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">{lang === "fr" ? "Total dépenses" : "إجمالي المصاريف"}</p>
            <p className="text-2xl font-bold text-gray-900">
              {grandTotal.toLocaleString(lang === "fr" ? "fr-MA" : "ar-MA")}
              <span className="text-sm font-normal text-gray-400 ml-1">MAD</span>
            </p>
          </div>
        </div>
        <NewExpenseForm categories={categories} />
      </div>

      {/* By category */}
      {activeCats.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 size={16} className="text-green-700" />
            <p className="text-sm font-semibold text-gray-800">{lang === "fr" ? "Par catégorie" : "حسب الفئة"}</p>
          </div>
          <div className="space-y-2">
            {activeCats.sort((a, b) => b.total - a.total).map((cat) => {
              const pct = grandTotal > 0 ? Math.round((cat.total / grandTotal) * 100) : 0;
              return (
                <div key={cat.id}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600">{lang === "fr" ? cat.nameFr : (cat.nameAr ?? cat.nameFr)}</span>
                    <span className="font-semibold text-gray-800">{fmt(cat.total)} MAD <span className="text-gray-400 font-normal">({pct}%)</span></span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* List */}
      {expenses.length === 0 ? (
        <p className="text-center text-gray-400 py-10">{lang === "fr" ? "Aucune dépense." : "لا توجد مصاريف."}</p>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs">
                <th className="px-4 py-3 text-start font-medium">{lang === "fr" ? "Description" : "الوصف"}</th>
                <th className="px-4 py-3 text-start font-medium hidden sm:table-cell">{lang === "fr" ? "Catégorie" : "الفئة"}</th>
                <th className="px-4 py-3 text-end font-medium">{lang === "fr" ? "Montant" : "المبلغ"}</th>
                <th className="px-4 py-3 text-end font-medium hidden sm:table-cell">{lang === "fr" ? "Date" : "التاريخ"}</th>
                <th className="px-4 py-3 text-center font-medium w-12">📎</th>
                {!isViewer && <th className="px-4 py-3 text-center font-medium w-16"></th>}
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <>
                  <tr
                    key={e.id}
                    className="hover:bg-gray-50 transition-colors border-t border-gray-50"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{e.title}</p>
                      {e.description && <p className="text-xs text-gray-400 mt-0.5">{e.description}</p>}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-xs text-gray-500">
                      {lang === "fr" ? e.categoryNameFr : e.categoryNameAr}
                    </td>
                    <td className="px-4 py-3 text-end font-semibold text-gray-800">{fmt(e.amount)} MAD</td>
                    <td className="px-4 py-3 text-end text-xs text-gray-400 hidden sm:table-cell">
                      {new Date(e.date).toLocaleDateString(lang === "fr" ? "fr-MA" : "ar-MA", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setExpanded(expanded === e.id ? null : e.id)}
                        className="inline-flex items-center gap-0.5 text-xs text-gray-400 hover:text-green-700 transition-colors"
                      >
                        <Paperclip size={13} />
                        {e.attachments.length > 0 && (
                          <span className="text-xs font-bold text-green-700">{e.attachments.length}</span>
                        )}
                        {expanded === e.id ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                      </button>
                    </td>
                    {!isViewer && (
                      <td className="px-4 py-3 text-center">
                        {confirmDeleteId === e.id ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleDelete(e.id)}
                              disabled={deleting}
                              className="text-xs px-1.5 py-0.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60"
                            >
                              {lang === "fr" ? "Oui" : "نعم"}
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                            >
                              {lang === "fr" ? "Non" : "لا"}
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setEditingId(e.id)}
                              className="p-1 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(e.id)}
                              className="p-1 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                  {expanded === e.id && (
                    <tr key={`${e.id}-att`} className="bg-gray-50/50">
                      <td colSpan={isViewer ? 5 : 6} className="px-4 pb-3">
                        <AttachmentsPanel
                          entityType="expense"
                          entityId={e.id}
                          initialAttachments={e.attachments}
                          collapsible={false}
                          defaultOpen
                        />
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <EditExpenseForm
          expense={editing}
          categories={categories}
          onClose={() => setEditingId(null)}
        />
      )}
    </div>
  );
}
