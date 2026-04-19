"use client";

import { useState } from "react";
import { useLang } from "@/contexts/LangContext";
import { Users, PieChart, Calendar, Download, Loader2 } from "lucide-react";
import { fmt } from "@/lib/fmt";

interface CoOwnerRow {
  id: string;
  name: string;
  sharePercent: number;
  totalReceived: number;
}

interface DistributionRow {
  id: string;
  date: string;
  totalAmount: number;
  notes: string | null;
  lotName: string;
  shares: { coOwnerName: string; amount: number; sharePercent: number }[];
}

interface AvailableLot {
  id: string;
  name: string;
  saleId: string | null;
  saleAmount: number;
}

interface Props {
  coOwners: CoOwnerRow[];
  distributions: DistributionRow[];
  availableLots: AvailableLot[];
  totalDistributed: number;
}

const coOwnerColors = [
  "bg-green-100 text-green-700 border-green-200",
  "bg-blue-100 text-blue-700 border-blue-200",
  "bg-purple-100 text-purple-700 border-purple-200",
  "bg-amber-100 text-amber-700 border-amber-200",
];

export function RevenueClient({ coOwners, distributions, totalDistributed, lang: _lang }: Props & { lang?: string }) {
  const { t, lang, isRtl } = useLang();
  const tr = t.revenue;
  const [downloading, setDownloading] = useState(false);

  const downloadPdf = async () => {
    setDownloading(true);
    try {
      const now   = new Date();
      const year  = now.getFullYear();
      const month = now.getMonth() + 1;
      const res   = await fetch(`/api/reports/monthly?year=${year}&month=${month}`);
      if (!res.ok) throw new Error("Erreur génération PDF");
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `orchidees2-rapport-${year}-${String(month).padStart(2, "0")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="space-y-6">
      {/* Total */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
          <PieChart size={22} className="text-green-700" />
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-0.5">{tr.totalDistributed}</p>
          <p className="text-2xl font-bold text-gray-900">
            {totalDistributed.toLocaleString(lang === "fr" ? "fr-MA" : "ar-MA")}
            <span className="text-sm font-normal text-gray-400 ml-1">MAD</span>
          </p>
        </div>
      </div>

      {/* Co-owners */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
          <Users size={18} className="text-green-700" />
          <h3 className="font-semibold text-gray-800 text-sm">{tr.coOwners}</h3>
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {coOwners.map((co, i) => (
            <div
              key={co.id}
              className={`rounded-xl border p-4 flex items-center justify-between ${coOwnerColors[i % 4]}`}
            >
              <div>
                <p className="font-semibold text-sm">{co.name}</p>
                <p className="text-xs mt-0.5 opacity-75">
                  {tr.sharePercent}: {co.sharePercent}%
                </p>
              </div>
              <div className="text-end">
                <p className="font-bold text-lg">
                  {fmt(co.totalReceived)}
                </p>
                <p className="text-xs opacity-75">MAD</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Distribution history */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-green-700" />
            <h3 className="font-semibold text-gray-800 text-sm">{tr.distributions}</h3>
          </div>
          <button
            onClick={downloadPdf}
            disabled={downloading}
            className="flex items-center gap-1.5 text-xs text-green-700 hover:text-green-800 font-medium disabled:opacity-60 transition-opacity"
          >
            {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            {tr.exportPdf}
          </button>
        </div>

        {distributions.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-8">{tr.noDistributions}</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {distributions.map((d) => (
              <div key={d.id} className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">
                      {lang === "fr" ? "Lot" : "لوت"} {d.lotName}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(d.date).toLocaleDateString(
                        lang === "fr" ? "fr-MA" : "ar-MA",
                        { day: "2-digit", month: "long", year: "numeric" }
                      )}
                    </p>
                  </div>
                  <p className="font-bold text-gray-800">
                    {fmt(d.totalAmount)} MAD
                  </p>
                </div>

                {/* Shares breakdown */}
                <div className="grid grid-cols-2 gap-1.5">
                  {d.shares.map((s, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-2 py-1.5"
                    >
                      <span className="text-gray-600 truncate">{s.coOwnerName}</span>
                      <span className="font-semibold text-gray-800 ml-2 shrink-0">
                        {fmt(s.amount)} MAD
                      </span>
                    </div>
                  ))}
                </div>

                {d.notes && (
                  <p className="text-xs text-gray-400 italic">{d.notes}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
