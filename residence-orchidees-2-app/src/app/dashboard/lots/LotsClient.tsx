"use client";

import { useLang } from "@/contexts/LangContext";
import { Home, Store, CheckCircle, Clock, Tag, Maximize2, Users } from "lucide-react";
import type { UnitKind, LotStatus, SaleStatus } from "@prisma/client";

interface LotRow {
  id: string;
  name: string;
  reference: string | null;
  status: LotStatus;
  price: number | null;
  area: number | null;
  floor: number | null;
  kind: UnitKind;
  description: string | null;
  mediaCount: number;
  prospectsCount: number;
  hasSale: boolean;
  saleStatus: SaleStatus | null;
}

interface Props {
  lots: LotRow[];
  stats: { disponible: number; reserve: number; vendu: number };
}

const statusColors: Record<LotStatus, string> = {
  DISPONIBLE: "bg-green-100 text-green-700",
  RESERVE:    "bg-amber-100 text-amber-700",
  VENDU:      "bg-blue-100 text-blue-700",
};

export function LotsClient({ lots, stats }: Props) {
  const { t, lang, isRtl } = useLang();
  const tl = t.lots;

  const statusLabel: Record<LotStatus, string> = {
    DISPONIBLE: tl.disponible,
    RESERVE:    tl.reserve,
    VENDU:      tl.vendu,
  };

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="space-y-6">
      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: tl.disponible, count: stats.disponible, color: "bg-green-50 text-green-700 border-green-200" },
          { label: tl.reserve,    count: stats.reserve,    color: "bg-amber-50 text-amber-700 border-amber-200" },
          { label: tl.vendu,      count: stats.vendu,      color: "bg-blue-50 text-blue-700 border-blue-200" },
        ].map(({ label, count, color }) => (
          <div key={label} className={`rounded-2xl border p-4 text-center ${color}`}>
            <p className="text-2xl font-bold">{count}</p>
            <p className="text-xs font-medium mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Grid */}
      {lots.length === 0 ? (
        <p className="text-center text-gray-400 py-12">{tl.noLots}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {lots.map((lot) => (
            <div
              key={lot.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-4 space-y-3"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {lot.kind === "SHOP" ? (
                    <Store size={20} className="text-amber-600 shrink-0" />
                  ) : (
                    <Home size={20} className="text-green-700 shrink-0" />
                  )}
                  <div>
                    <p className="font-bold text-gray-900">{lot.name}</p>
                    {lot.reference && (
                      <p className="text-xs text-gray-400">{lot.reference}</p>
                    )}
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[lot.status]}`}>
                  {statusLabel[lot.status]}
                </span>
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                {lot.price !== null && (
                  <div className="flex items-center gap-1.5">
                    <Tag size={13} className="text-gray-400 shrink-0" />
                    <span className="font-semibold text-gray-800">
                      {lot.price.toLocaleString(lang === "fr" ? "fr-MA" : "ar-MA")} MAD
                    </span>
                  </div>
                )}
                {lot.area !== null && (
                  <div className="flex items-center gap-1.5">
                    <Maximize2 size={13} className="text-gray-400 shrink-0" />
                    <span>{lot.area} m²</span>
                  </div>
                )}
                {lot.floor !== null && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <span>
                      {lang === "fr" ? "Étage" : "طابق"} {lot.floor === 0 ? (lang === "fr" ? "RDC" : "أرضي") : lot.floor}
                    </span>
                  </div>
                )}
                {lot.prospectsCount > 0 && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Users size={13} className="text-gray-400 shrink-0" />
                    <span>{lot.prospectsCount} {lang === "fr" ? "prospect(s)" : "عميل"}</span>
                  </div>
                )}
              </div>

              {/* Sale badge */}
              {lot.hasSale && lot.saleStatus && (
                <div className="pt-1 border-t border-gray-50">
                  <div className="flex items-center gap-1.5 text-xs">
                    <CheckCircle size={13} className="text-blue-500 shrink-0" />
                    <span className="text-blue-600 font-medium">
                      {t.sales[lot.saleStatus === "RESERVE" ? "reserve"
                        : lot.saleStatus === "EN_COURS" ? "enCours"
                        : lot.saleStatus === "ACTE_SIGNE" ? "acteSigne"
                        : "livre"]}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
