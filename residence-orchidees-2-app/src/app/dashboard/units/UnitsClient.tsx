"use client";

import { useState } from "react";
import { useLang } from "@/contexts/LangContext";
import { Home, Store, User, Building2, Gauge, Tag, ChevronDown, ChevronUp } from "lucide-react";
import { fmt } from "@/lib/fmt";
import { AttachmentsPanel } from "@/components/AttachmentsPanel";
import type { AttachmentRow } from "@/actions/attachments";
import type { UnitKind, LotStatus } from "@prisma/client";

interface UnitRow {
  id: string;
  name: string;
  kind: UnitKind;
  floor: number | null;
  subscriptionsCount: number;
  metersCount: number;
  hasLot: boolean;
  lotStatus: LotStatus | null;
  lotPrice: number | null;
  attachments: AttachmentRow[];
}

const kindIcon: Record<UnitKind, React.ReactNode> = {
  APARTMENT: <Home size={16} className="text-green-700" />,
  SHOP:      <Store size={16} className="text-amber-600" />,
  CONCIERGE: <User size={16} className="text-blue-600" />,
  COMMON:    <Building2 size={16} className="text-purple-600" />,
};

const kindLabel: Record<UnitKind, { fr: string; ar: string }> = {
  APARTMENT: { fr: "Appartement", ar: "شقة" },
  SHOP:      { fr: "Magasin",     ar: "محل" },
  CONCIERGE: { fr: "Concierge",  ar: "حارس" },
  COMMON:    { fr: "Commun",     ar: "مشترك" },
};

const lotStatusColor: Record<LotStatus, string> = {
  DISPONIBLE: "bg-green-100 text-green-700",
  RESERVE:    "bg-amber-100 text-amber-700",
  VENDU:      "bg-blue-100 text-blue-700",
};

const lotStatusLabel: Record<LotStatus, { fr: string; ar: string }> = {
  DISPONIBLE: { fr: "Disponible", ar: "متاح" },
  RESERVE:    { fr: "Réservé",    ar: "محجوز" },
  VENDU:      { fr: "Vendu",      ar: "مباع" },
};

export function UnitsClient({ units }: { units: UnitRow[] }) {
  const { lang, isRtl } = useLang();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const grouped: Record<UnitKind, UnitRow[]> = {
    APARTMENT: units.filter((u) => u.kind === "APARTMENT"),
    SHOP:      units.filter((u) => u.kind === "SHOP"),
    CONCIERGE: units.filter((u) => u.kind === "CONCIERGE"),
    COMMON:    units.filter((u) => u.kind === "COMMON"),
  };

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(["APARTMENT","SHOP","CONCIERGE","COMMON"] as UnitKind[]).map((k) => (
          <div key={k} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <div className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center">
              {kindIcon[k]}
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{grouped[k].length}</p>
              <p className="text-xs text-gray-500">{kindLabel[k][lang]}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs">
              <th className="px-4 py-3 text-start font-medium">{lang === "fr" ? "Unité" : "الوحدة"}</th>
              <th className="px-4 py-3 text-start font-medium hidden sm:table-cell">{lang === "fr" ? "Type" : "النوع"}</th>
              <th className="px-4 py-3 text-start font-medium hidden sm:table-cell">{lang === "fr" ? "Étage" : "الطابق"}</th>
              <th className="px-4 py-3 text-center font-medium">
                <Gauge size={14} className="inline" />
              </th>
              <th className="px-4 py-3 text-start font-medium hidden md:table-cell">{lang === "fr" ? "Lot vente" : "لوت البيع"}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {units.map((u) => (
              <>
                <tr key={u.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setExpandedId(expandedId === u.id ? null : u.id)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {kindIcon[u.kind]}
                      <span className="font-semibold text-gray-900">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-gray-500 text-xs">{kindLabel[u.kind][lang]}</td>
                  <td className="px-4 py-3 hidden sm:table-cell text-gray-500 text-xs">
                    {u.floor === null ? "—" : u.floor === 0 ? (lang === "fr" ? "RDC" : "أرضي") : u.floor}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center gap-1 text-xs text-gray-500">{u.metersCount}</span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {u.hasLot && u.lotStatus ? (
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${lotStatusColor[u.lotStatus]}`}>{lotStatusLabel[u.lotStatus][lang]}</span>
                        {u.lotPrice && <span className="text-xs text-gray-400 flex items-center gap-0.5"><Tag size={10} />{fmt(u.lotPrice)} MAD</span>}
                      </div>
                    ) : <span className="text-xs text-gray-300">—</span>}
                  </td>
                  <td className="px-3 py-3 text-gray-400">
                    {expandedId === u.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </td>
                </tr>
                {expandedId === u.id && (
                  <tr key={`${u.id}-att`}>
                    <td colSpan={6} className="px-4 pb-3 bg-gray-50">
                      <AttachmentsPanel entityType="unit" entityId={u.id} initialAttachments={u.attachments} collapsible={false} defaultOpen />
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
