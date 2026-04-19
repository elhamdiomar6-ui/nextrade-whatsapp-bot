"use client";

import { useLang } from "@/contexts/LangContext";
import { Gauge, Droplets, Zap, Flame, Wifi, Phone, CheckCircle, Clock } from "lucide-react";
import type { ServiceType, SubscriptionScope } from "@prisma/client";

interface MeterRow {
  id: string;
  serialNumber: string;
  serviceType: ServiceType;
  unitName: string;
  scope: SubscriptionScope;
  lastReading: { value: number; date: string; validated: boolean } | null;
}

const serviceIcon: Record<ServiceType, React.ReactNode> = {
  WATER:       <Droplets size={15} className="text-blue-500" />,
  ELECTRICITY: <Zap size={15} className="text-yellow-500" />,
  GAS:         <Flame size={15} className="text-orange-500" />,
  INTERNET:    <Wifi size={15} className="text-purple-500" />,
  PHONE:       <Phone size={15} className="text-green-500" />,
  OTHER:       <Gauge size={15} className="text-gray-500" />,
};

const serviceLabel: Record<ServiceType, { fr: string; ar: string }> = {
  WATER:       { fr: "Eau",         ar: "ماء" },
  ELECTRICITY: { fr: "Électricité", ar: "كهرباء" },
  GAS:         { fr: "Gaz",         ar: "غاز" },
  INTERNET:    { fr: "Internet",    ar: "إنترنت" },
  PHONE:       { fr: "Téléphone",   ar: "هاتف" },
  OTHER:       { fr: "Autre",       ar: "أخرى" },
};

export function MetersClient({ meters }: { meters: MeterRow[] }) {
  const { lang, isRtl } = useLang();

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
          <Gauge size={18} className="text-green-700" />
          <h3 className="font-semibold text-gray-800 text-sm">
            {lang === "fr" ? `${meters.length} compteur(s) enregistré(s)` : `${meters.length} عداد مسجل`}
          </h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs">
              <th className="px-4 py-3 text-start font-medium">{lang === "fr" ? "N° Série" : "الرقم التسلسلي"}</th>
              <th className="px-4 py-3 text-start font-medium hidden sm:table-cell">{lang === "fr" ? "Unité" : "الوحدة"}</th>
              <th className="px-4 py-3 text-start font-medium">{lang === "fr" ? "Service" : "الخدمة"}</th>
              <th className="px-4 py-3 text-end font-medium">{lang === "fr" ? "Dernier relevé" : "آخر قراءة"}</th>
              <th className="px-4 py-3 text-center font-medium hidden sm:table-cell">{lang === "fr" ? "Validé" : "مصادق"}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {meters.map((m) => (
              <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-gray-700">{m.serialNumber}</td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <span className="font-medium text-gray-900">{m.unitName}</span>
                  {m.scope === "GENERAL" && (
                    <span className="ml-1.5 text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">
                      {lang === "fr" ? "Général" : "عام"}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    {serviceIcon[m.serviceType]}
                    <span className="text-gray-600 text-xs hidden sm:inline">{serviceLabel[m.serviceType][lang]}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-end">
                  {m.lastReading ? (
                    <div>
                      <p className="font-semibold text-gray-800">{m.lastReading.value} m³</p>
                      <p className="text-xs text-gray-400">
                        {new Date(m.lastReading.date).toLocaleDateString(lang === "fr" ? "fr-MA" : "ar-MA", { day: "2-digit", month: "short" })}
                      </p>
                    </div>
                  ) : (
                    <span className="text-gray-300 text-xs">{lang === "fr" ? "Aucun" : "لا توجد"}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center hidden sm:table-cell">
                  {m.lastReading?.validated ? (
                    <CheckCircle size={16} className="text-green-500 inline" />
                  ) : (
                    <Clock size={16} className="text-amber-400 inline" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
