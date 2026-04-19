"use client";

import { useLang } from "@/contexts/LangContext";
import { AlertTriangle, CheckCircle, Droplets, Zap, Image } from "lucide-react";
import type { ServiceType } from "@prisma/client";
import { NewReadingForm, type MeterOption } from "@/components/forms/NewReadingForm";

interface ReadingRow {
  id: string;
  value: number;
  previousValue: number | null;
  date: string;
  validated: boolean;
  notes: string | null;
  photoUrl: string | null;
  meterSerial: string;
  serviceType: ServiceType;
  unitName: string;
  consumption: number | null;
  anomaly: boolean;
}

interface Props {
  readings: ReadingRow[];
  meters: MeterOption[];
}

export function ReadingsClient({ readings, meters }: Props) {
  const { lang, isRtl } = useLang();

  const anomalies = readings.filter((r) => r.anomaly);

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{readings.length} {lang === "fr" ? "relevé(s)" : "قراءة"}</p>
        <NewReadingForm meters={meters} />
      </div>

      {anomalies.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-700">
              {lang === "fr" ? `${anomalies.length} anomalie(s) détectée(s)` : `تم اكتشاف ${anomalies.length} شذوذ`}
            </p>
            <p className="text-xs text-red-500 mt-0.5">{anomalies.map((a) => a.unitName).join(", ")}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs">
              <th className="px-4 py-3 text-start font-medium">{lang === "fr" ? "Unité" : "الوحدة"}</th>
              <th className="px-4 py-3 text-start font-medium hidden sm:table-cell">{lang === "fr" ? "Compteur" : "العداد"}</th>
              <th className="px-4 py-3 text-end font-medium">{lang === "fr" ? "Relevé" : "القراءة"}</th>
              <th className="px-4 py-3 text-end font-medium hidden sm:table-cell">{lang === "fr" ? "Précédent" : "السابقة"}</th>
              <th className="px-4 py-3 text-end font-medium">{lang === "fr" ? "Conso." : "الاستهلاك"}</th>
              <th className="px-4 py-3 text-center font-medium">{lang === "fr" ? "État" : "الحالة"}</th>
              <th className="px-4 py-3 text-end font-medium hidden md:table-cell">{lang === "fr" ? "Date" : "التاريخ"}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {readings.map((r) => (
              <tr key={r.id} className={`hover:bg-gray-50 transition-colors ${r.anomaly ? "bg-red-50/30" : ""}`}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    {r.serviceType === "WATER"
                      ? <Droplets size={13} className="text-blue-400 shrink-0" />
                      : <Zap size={13} className="text-yellow-400 shrink-0" />}
                    <span className="font-medium text-gray-900">{r.unitName}</span>
                  </div>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell font-mono text-xs text-gray-500">{r.meterSerial}</td>
                <td className="px-4 py-3 text-end font-semibold text-gray-800">{r.value} m³</td>
                <td className="px-4 py-3 text-end text-gray-500 hidden sm:table-cell">{r.previousValue ?? "—"}</td>
                <td className="px-4 py-3 text-end">
                  {r.consumption !== null ? (
                    <span className={r.anomaly ? "text-red-600 font-semibold" : "text-gray-700"}>
                      {r.anomaly ? "⚠️" : "+"}{r.consumption}
                    </span>
                  ) : "—"}
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    {r.anomaly
                      ? <AlertTriangle size={15} className="text-red-500" />
                      : <CheckCircle size={15} className="text-green-500" />}
                    {r.photoUrl && (
                      <a href={r.photoUrl} target="_blank" rel="noopener noreferrer" title="Photo">
                        <Image size={13} className="text-blue-400 hover:text-blue-600" />
                      </a>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-end text-xs text-gray-400 hidden md:table-cell">
                  {new Date(r.date).toLocaleDateString(lang === "fr" ? "fr-MA" : "ar-MA", { day: "2-digit", month: "short", year: "numeric" })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
