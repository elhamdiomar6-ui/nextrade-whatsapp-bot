"use client";
import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/contexts/LangContext";
import { useToast } from "@/components/Toast";
import { AuditLogButton } from "@/components/AuditLogModal";
import {
  updateUnitAdmin, updateMeterAdmin, updateSubscriptionAdmin, updateCoOwnerAdmin,
} from "@/actions/admin-data";
import {
  Building2, Gauge, Users, Zap, Droplets, Pencil, Save, X,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────
interface UnitRow {
  id: string; name: string; kind: string; floor: number | null;
  area: number | null; description: string | null;
  occupantName: string | null; occupantPhone: string | null;
  occupantEmail: string | null; occupantType: string | null;
  occupantSince: string | null;
}
interface MeterRow {
  id: string; serialNumber: string; serviceType: string;
  installedAt: string | null; unitId: string | null; unitName: string | null;
  subscriptionId: string;
}
interface SubRow {
  id: string; serviceType: string; scope: string; status: string;
  contractNumber: string | null; provider: string | null; power: string | null;
  unitName: string | null; unitId: string | null;
}
interface CoOwnerRow {
  id: string; name: string; email: string | null; phone: string | null;
  sharePercent: number; order: number;
}
interface Props {
  units: UnitRow[]; meters: MeterRow[]; subscriptions: SubRow[]; coOwners: CoOwnerRow[];
}

const tabs = [
  { key: "units",   labelFr: "Unités",         labelAr: "الوحدات",      icon: Building2 },
  { key: "water",   labelFr: "Compteurs Eau",   labelAr: "عدادات الماء", icon: Droplets },
  { key: "elec",    labelFr: "Compteurs Élec",  labelAr: "عدادات الكهرباء", icon: Zap },
  { key: "subs",    labelFr: "Abonnements",     labelAr: "الاشتراكات",   icon: Gauge },
  { key: "owners",  labelFr: "Copropriétaires", labelAr: "الملاك",       icon: Users },
] as const;

export function AdminDataClient({ units, meters, subscriptions, coOwners }: Props) {
  const { lang, isRtl } = useLang();
  const { showToast } = useToast();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("units");
  const [editId, setEditId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Local draft state
  const [draft, setDraft] = useState<Record<string, string | number | null>>({});

  function startEdit(id: string, initial: Record<string, string | number | null>) {
    setEditId(id);
    setDraft(initial);
  }

  function cancelEdit() { setEditId(null); setDraft({}); }

  function field(key: string, value: string | number | null = null) {
    return draft[key] !== undefined ? draft[key] : value;
  }

  function set(key: string, val: string | number | null) {
    setDraft((d) => ({ ...d, [key]: val }));
  }

  // ── Save handlers ─────────────────────────────────────────────────────
  function saveUnit(id: string) {
    startTransition(async () => {
      const res = await updateUnitAdmin(id, {
        name: String(draft.name ?? ""),
        floor: draft.floor !== null && draft.floor !== "" ? Number(draft.floor) : null,
        area: draft.area !== null && draft.area !== "" ? Number(draft.area) : null,
        description: (draft.description as string) || null,
        occupantName: (draft.occupantName as string) || null,
        occupantPhone: (draft.occupantPhone as string) || null,
        occupantEmail: (draft.occupantEmail as string) || null,
        occupantType: (draft.occupantType as string) || null,
        occupantSince: (draft.occupantSince as string) || null,
      });
      if (res.success) {
        showToast(lang === "fr" ? "Unité mise à jour" : "تم تحديث الوحدة");
        cancelEdit();
        router.refresh();
      } else {
        showToast(res.error ?? "Erreur", "error");
      }
    });
  }

  function saveMeter(id: string) {
    startTransition(async () => {
      const res = await updateMeterAdmin(id, {
        serialNumber: String(draft.serialNumber ?? ""),
        installedAt: (draft.installedAt as string) || null,
      });
      if (res.success) {
        showToast(lang === "fr" ? "Compteur mis à jour" : "تم تحديث العداد");
        cancelEdit();
        router.refresh();
      } else {
        showToast(res.error ?? "Erreur", "error");
      }
    });
  }

  function saveSub(id: string) {
    startTransition(async () => {
      const res = await updateSubscriptionAdmin(id, {
        contractNumber: (draft.contractNumber as string) || null,
        provider: (draft.provider as string) || null,
        power: (draft.power as string) || null,
        status: (draft.status as string) || undefined,
      });
      if (res.success) {
        showToast(lang === "fr" ? "Abonnement mis à jour" : "تم تحديث الاشتراك");
        cancelEdit();
        router.refresh();
      } else {
        showToast(res.error ?? "Erreur", "error");
      }
    });
  }

  function saveOwner(id: string) {
    startTransition(async () => {
      const res = await updateCoOwnerAdmin(id, {
        name: String(draft.name ?? ""),
        email: (draft.email as string) || null,
        phone: (draft.phone as string) || null,
        sharePercent: Number(draft.sharePercent ?? 25),
      });
      if (res.success) {
        showToast(lang === "fr" ? "Copropriétaire mis à jour" : "تم تحديث المالك");
        cancelEdit();
        router.refresh();
      } else {
        showToast(res.error ?? "Erreur", "error");
      }
    });
  }

  // ── Input helper ──────────────────────────────────────────────────────
  function inp(key: string, def: string | number | null, type: string = "text") {
    return (
      <input
        type={type}
        value={String(field(key, def) ?? "")}
        onChange={(e) => set(key, e.target.value)}
        className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-green-500 focus:border-green-500 outline-none"
      />
    );
  }

  function sel(key: string, def: string | null, options: { value: string; label: string }[]) {
    return (
      <select
        value={String(field(key, def) ?? "")}
        onChange={(e) => set(key, e.target.value)}
        className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-green-500 outline-none"
      >
        <option value="">—</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    );
  }

  // ── Row action buttons ────────────────────────────────────────────────
  function EditSaveButtons({ id, onSave, entity, entityLabel }: {
    id: string; onSave: (id: string) => void; entity: string; entityLabel: string;
  }) {
    if (editId === id) {
      return (
        <div className="flex items-center gap-1">
          <button
            onClick={() => onSave(id)}
            disabled={pending}
            className="p-1.5 bg-green-700 text-white rounded-lg hover:bg-green-800 disabled:opacity-50"
          >
            <Save size={13} />
          </button>
          <button onClick={cancelEdit} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100">
            <X size={13} />
          </button>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => startEdit(id, {})}
          className="p-1.5 text-gray-400 hover:text-green-700 rounded-lg hover:bg-green-50"
        >
          <Pencil size={13} />
        </button>
        <AuditLogButton entity={entity} entityId={id} entityLabel={entityLabel} />
      </div>
    );
  }

  // ── Tabs ──────────────────────────────────────────────────────────────
  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="space-y-4">
      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 overflow-x-auto">
        {tabs.map(({ key, labelFr, labelAr, icon: Icon }) => (
          <button
            key={key}
            onClick={() => { setActiveTab(key); cancelEdit(); }}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors
              ${activeTab === key ? "bg-white text-green-800 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
          >
            <Icon size={14} />
            {lang === "fr" ? labelFr : labelAr}
          </button>
        ))}
      </div>

      {/* ── UNITS TAB ───────────────────────────────────────────────── */}
      {activeTab === "units" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs">
                <th className="px-4 py-3 text-start font-medium">{lang === "fr" ? "Unité" : "الوحدة"}</th>
                <th className="px-4 py-3 text-start font-medium hidden md:table-cell">{lang === "fr" ? "Type" : "النوع"}</th>
                <th className="px-4 py-3 text-start font-medium hidden lg:table-cell">{lang === "fr" ? "Occupant" : "الساكن"}</th>
                <th className="px-4 py-3 text-center font-medium hidden sm:table-cell">{lang === "fr" ? "Surface" : "المساحة"}</th>
                <th className="px-4 py-3 text-end font-medium w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {units.map((u) => (
                <React.Fragment key={u.id}>
                  <tr className="group hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-gray-900">{u.name}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 hidden md:table-cell">{u.kind}</td>
                    <td className="px-4 py-3 text-xs text-gray-600 hidden lg:table-cell">
                      {u.occupantName ?? <span className="text-gray-300 italic">{lang === "fr" ? "Non renseigné" : "غير محدد"}</span>}
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-gray-600 hidden sm:table-cell">
                      {u.area ? `${u.area} m²` : "—"}
                    </td>
                    <td className="px-4 py-3 text-end">
                      <EditSaveButtons
                        id={u.id} onSave={saveUnit} entity="Unit" entityLabel={u.name}
                      />
                    </td>
                  </tr>
                  {editId === u.id && (
                    <tr key={`${u.id}-edit`}>
                      <td colSpan={5} className="px-4 pb-4 pt-0 bg-green-50/40">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-2">
                          {[
                            ["name", u.name, "text", lang === "fr" ? "Nom" : "الاسم"],
                            ["floor", u.floor, "number", lang === "fr" ? "Étage" : "الطابق"],
                            ["area", u.area, "number", lang === "fr" ? "Surface (m²)" : "المساحة"],
                            ["occupantName", u.occupantName, "text", lang === "fr" ? "Occupant" : "الساكن"],
                            ["occupantPhone", u.occupantPhone, "text", lang === "fr" ? "Tél occupant" : "هاتف الساكن"],
                            ["occupantEmail", u.occupantEmail, "email", lang === "fr" ? "Email occupant" : "بريد الساكن"],
                          ].map(([k, v, t, label]) => (
                            <div key={String(k)}>
                              <label className="text-xs text-gray-500 mb-1 block">{String(label)}</label>
                              {inp(String(k), v as string | number | null, String(t))}
                            </div>
                          ))}
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">{lang === "fr" ? "Type occupant" : "نوع الساكن"}</label>
                            {sel("occupantType", u.occupantType, [
                              { value: "LOCATAIRE", label: "Locataire" },
                              { value: "PROPRIETAIRE", label: "Propriétaire" },
                              { value: "VACANT", label: "Vacant" },
                            ])}
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">{lang === "fr" ? "Date entrée" : "تاريخ الدخول"}</label>
                            {inp("occupantSince", u.occupantSince ? u.occupantSince.split("T")[0] : null, "date")}
                          </div>
                          <div className="col-span-2 md:col-span-3 lg:col-span-4">
                            <label className="text-xs text-gray-500 mb-1 block">{lang === "fr" ? "Description" : "الوصف"}</label>
                            <textarea
                              value={String(field("description", u.description) ?? "")}
                              onChange={(e) => set("description", e.target.value)}
                              rows={2}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-green-500 outline-none resize-none"
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── WATER / ELEC METERS TAB ──────────────────────────────────── */}
      {(activeTab === "water" || activeTab === "elec") && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs">
                <th className="px-4 py-3 text-start font-medium">{lang === "fr" ? "N° Série" : "رقم التسلسل"}</th>
                <th className="px-4 py-3 text-start font-medium hidden sm:table-cell">{lang === "fr" ? "Unité" : "الوحدة"}</th>
                <th className="px-4 py-3 text-start font-medium hidden md:table-cell">{lang === "fr" ? "Date install." : "تاريخ التركيب"}</th>
                <th className="px-4 py-3 text-end font-medium w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {meters
                .filter((m) => activeTab === "water" ? m.serviceType === "WATER" : m.serviceType === "ELECTRICITY")
                .map((m) => (
                  <React.Fragment key={m.id}>
                    <tr className="group hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-gray-900 font-semibold">{m.serialNumber}</td>
                      <td className="px-4 py-3 text-xs text-gray-600 hidden sm:table-cell">
                        {m.unitName ?? <span className="text-gray-300 italic">{lang === "fr" ? "Non affecté" : "غير مُعيَّن"}</span>}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 hidden md:table-cell">
                        {m.installedAt ? new Date(m.installedAt).toLocaleDateString(lang === "fr" ? "fr-MA" : "ar-MA") : "—"}
                      </td>
                      <td className="px-4 py-3 text-end">
                        <EditSaveButtons
                          id={m.id} onSave={saveMeter} entity="Meter" entityLabel={m.serialNumber}
                        />
                      </td>
                    </tr>
                    {editId === m.id && (
                      <tr key={`${m.id}-edit`}>
                        <td colSpan={4} className="px-4 pb-4 pt-0 bg-green-50/40">
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                            <div>
                              <label className="text-xs text-gray-500 mb-1 block">{lang === "fr" ? "N° Série" : "رقم التسلسل"}</label>
                              {inp("serialNumber", m.serialNumber)}
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 mb-1 block">{lang === "fr" ? "Date installation" : "تاريخ التركيب"}</label>
                              {inp("installedAt", m.installedAt ? m.installedAt.split("T")[0] : null, "date")}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── SUBSCRIPTIONS TAB ───────────────────────────────────────── */}
      {activeTab === "subs" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs">
                <th className="px-4 py-3 text-start font-medium">{lang === "fr" ? "Service" : "الخدمة"}</th>
                <th className="px-4 py-3 text-start font-medium hidden sm:table-cell">{lang === "fr" ? "Unité" : "الوحدة"}</th>
                <th className="px-4 py-3 text-start font-medium hidden md:table-cell">{lang === "fr" ? "N° Contrat" : "رقم العقد"}</th>
                <th className="px-4 py-3 text-start font-medium hidden lg:table-cell">{lang === "fr" ? "Fournisseur" : "المزود"}</th>
                <th className="px-4 py-3 text-end font-medium w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {subscriptions.map((s) => (
                <React.Fragment key={s.id}>
                  <tr className="group hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                        ${s.serviceType === "WATER" ? "bg-blue-100 text-blue-700" :
                          s.serviceType === "ELECTRICITY" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-600"}`}>
                        {s.serviceType} · {s.scope}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 hidden sm:table-cell">{s.unitName ?? "—"}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 hidden md:table-cell">{s.contractNumber ?? "—"}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 hidden lg:table-cell">{s.provider ?? "—"}</td>
                    <td className="px-4 py-3 text-end">
                      <EditSaveButtons
                        id={s.id} onSave={saveSub} entity="Subscription"
                        entityLabel={`${s.serviceType} ${s.unitName ?? s.scope}`}
                      />
                    </td>
                  </tr>
                  {editId === s.id && (
                    <tr key={`${s.id}-edit`}>
                      <td colSpan={5} className="px-4 pb-4 pt-0 bg-green-50/40">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                          {[
                            ["contractNumber", s.contractNumber, "text", lang === "fr" ? "N° Contrat" : "رقم العقد"],
                            ["provider", s.provider, "text", lang === "fr" ? "Fournisseur" : "المزود"],
                            ["power", s.power, "text", lang === "fr" ? "Puissance" : "القدرة"],
                          ].map(([k, v, t, label]) => (
                            <div key={String(k)}>
                              <label className="text-xs text-gray-500 mb-1 block">{String(label)}</label>
                              {inp(String(k), v as string | null, String(t))}
                            </div>
                          ))}
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">{lang === "fr" ? "Statut" : "الحالة"}</label>
                            {sel("status", s.status, [
                              { value: "ACTIVE", label: "Actif" },
                              { value: "SUSPENDED", label: "Suspendu" },
                              { value: "TERMINATED", label: "Résilié" },
                            ])}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── CO-OWNERS TAB ───────────────────────────────────────────── */}
      {activeTab === "owners" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs">
                <th className="px-4 py-3 text-start font-medium">{lang === "fr" ? "Nom" : "الاسم"}</th>
                <th className="px-4 py-3 text-start font-medium hidden sm:table-cell">{lang === "fr" ? "Email" : "البريد"}</th>
                <th className="px-4 py-3 text-start font-medium hidden sm:table-cell">{lang === "fr" ? "Tél." : "الهاتف"}</th>
                <th className="px-4 py-3 text-center font-medium">{lang === "fr" ? "Part %" : "الحصة %"}</th>
                <th className="px-4 py-3 text-end font-medium w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {coOwners.map((co) => (
                <React.Fragment key={co.id}>
                  <tr className="group hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-gray-900">{co.name}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 hidden sm:table-cell">{co.email ?? "—"}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 hidden sm:table-cell">{co.phone ?? "—"}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-0.5 rounded-full">
                        {co.sharePercent}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-end">
                      <EditSaveButtons
                        id={co.id} onSave={saveOwner} entity="CoOwner" entityLabel={co.name}
                      />
                    </td>
                  </tr>
                  {editId === co.id && (
                    <tr key={`${co.id}-edit`}>
                      <td colSpan={5} className="px-4 pb-4 pt-0 bg-green-50/40">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                          {[
                            ["name", co.name, "text", lang === "fr" ? "Nom" : "الاسم"],
                            ["email", co.email, "email", "Email"],
                            ["phone", co.phone, "tel", lang === "fr" ? "Téléphone" : "الهاتف"],
                            ["sharePercent", co.sharePercent, "number", lang === "fr" ? "Part %" : "الحصة %"],
                          ].map(([k, v, t, label]) => (
                            <div key={String(k)}>
                              <label className="text-xs text-gray-500 mb-1 block">{String(label)}</label>
                              {inp(String(k), v as string | number | null, String(t))}
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
