"use client";
import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { fmt } from "@/lib/fmt";
import { useLang } from "@/contexts/LangContext";
import { createOccupant, updateOccupant, deleteOccupant } from "@/actions/occupants";
import {
  Users, UserPlus, X, Pencil, Trash2, Eye, Phone, Home, Calendar,
  ChevronDown, Search, FileText,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OccupantDoc {
  id: string;
  title: string;
  url: string;
  type: string;
  createdAt: string;
}

interface OccupantRow {
  id: string;
  nom: string;
  prenom: string;
  cin: string | null;
  dateNaissance: string | null;
  nationalite: string | null;
  situationFam: string;
  nbEnfants: number;
  nomConjoint: string | null;
  telephone: string | null;
  whatsapp: string | null;
  email: string | null;
  adresse: string | null;
  unitId: string | null;
  unit: { id: string; name: string } | null;
  type: string;
  dateEntree: string | null;
  dateSortie: string | null;
  loyer: number | null;
  caution: number | null;
  statut: string;
  documents: OccupantDoc[];
  createdAt: string;
}

interface UnitRow {
  id: string;
  name: string;
  kind: string;
}

interface Stats {
  total: number;
  actifs: number;
  locataires: number;
  proprietaires: number;
}

interface Props {
  occupants: OccupantRow[];
  units: UnitRow[];
  stats: Stats;
  userRole: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUT_COLORS: Record<string, { bg: string; color: string; label: string; labelAr: string }> = {
  ACTIF:      { bg: "#dcfce7", color: "#15803d", label: "Actif",      labelAr: "نشط" },
  SORTI:      { bg: "#f3f4f6", color: "#6b7280", label: "Sorti",      labelAr: "خارج" },
  EN_ATTENTE: { bg: "#fef3c7", color: "#d97706", label: "En attente", labelAr: "في الانتظار" },
};

const TYPE_COLORS: Record<string, { bg: string; color: string; label: string; labelAr: string }> = {
  PROPRIETAIRE: { bg: "#f3e8ff", color: "#7c3aed", label: "Propriétaire",  labelAr: "مالك" },
  LOCATAIRE:    { bg: "#dbeafe", color: "#1d4ed8", label: "Locataire",     labelAr: "مستأجر" },
  OCCUPANT:     { bg: "#f3f4f6", color: "#6b7280", label: "Occupant",      labelAr: "شاغل" },
};

const SIT_FAM_OPTIONS = [
  { value: "CELIBATAIRE", fr: "Célibataire",  ar: "أعزب/عزباء" },
  { value: "MARIE",       fr: "Marié(e)",     ar: "متزوج/ة" },
  { value: "DIVORCE",     fr: "Divorcé(e)",   ar: "مطلق/ة" },
  { value: "VEUF",        fr: "Veuf/Veuve",   ar: "أرمل/ة" },
];

function Badge({ style, label }: { style: { bg: string; color: string }; label: string }) {
  return (
    <span style={{
      backgroundColor: style.bg,
      color: style.color,
      borderRadius: 6,
      padding: "2px 8px",
      fontSize: 11,
      fontWeight: 600,
      display: "inline-block",
      whiteSpace: "nowrap",
    }}>
      {label}
    </span>
  );
}

// ─── Empty form state ─────────────────────────────────────────────────────────

const EMPTY_FORM = {
  nom: "", prenom: "", cin: "", dateNaissance: "", nationalite: "Marocaine",
  situationFam: "CELIBATAIRE", nbEnfants: 0, nomConjoint: "",
  telephone: "", whatsapp: "", email: "", adresse: "",
  unitId: "", type: "LOCATAIRE", dateEntree: "", dateSortie: "",
  loyer: "", caution: "", statut: "ACTIF",
};

type FormState = typeof EMPTY_FORM;

// ─── Main component ───────────────────────────────────────────────────────────

export default function OccupantsClient({ occupants, units, stats, userRole }: Props) {
  const { lang, isRtl } = useLang();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // UI state
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState("");
  const [filterType, setFilterType] = useState("");

  const isViewer = userRole === "VIEWER";
  const isAr = lang === "ar";

  // Filtered list
  const filtered = useMemo(() => {
    return occupants.filter((o) => {
      const name = `${o.nom} ${o.prenom}`.toLowerCase();
      const unit = o.unit?.name.toLowerCase() ?? "";
      const q = search.toLowerCase();
      if (q && !name.includes(q) && !unit.includes(q) && !(o.telephone ?? "").includes(q)) return false;
      if (filterStatut && o.statut !== filterStatut) return false;
      if (filterType && o.type !== filterType) return false;
      return true;
    });
  }, [occupants, search, filterStatut, filterType]);

  const detailOccupant = detailId ? occupants.find((o) => o.id === detailId) ?? null : null;

  // ── Open create modal ──
  function openCreate() {
    setForm(EMPTY_FORM);
    setEditId(null);
    setError("");
    setShowModal(true);
  }

  // ── Open edit modal ──
  function openEdit(o: OccupantRow) {
    setForm({
      nom: o.nom,
      prenom: o.prenom,
      cin: o.cin ?? "",
      dateNaissance: o.dateNaissance ? o.dateNaissance.slice(0, 10) : "",
      nationalite: o.nationalite ?? "Marocaine",
      situationFam: o.situationFam,
      nbEnfants: o.nbEnfants,
      nomConjoint: o.nomConjoint ?? "",
      telephone: o.telephone ?? "",
      whatsapp: o.whatsapp ?? "",
      email: o.email ?? "",
      adresse: o.adresse ?? "",
      unitId: o.unitId ?? "",
      type: o.type,
      dateEntree: o.dateEntree ? o.dateEntree.slice(0, 10) : "",
      dateSortie: o.dateSortie ? o.dateSortie.slice(0, 10) : "",
      loyer: o.loyer !== null ? String(o.loyer) : "",
      caution: o.caution !== null ? String(o.caution) : "",
      statut: o.statut,
    });
    setEditId(o.id);
    setError("");
    setShowModal(true);
  }

  // ── Submit form ──
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nom.trim() || !form.prenom.trim()) {
      setError(isAr ? "الاسم واللقب مطلوبان" : "Nom et prénom sont requis");
      return;
    }
    setError("");
    const payload = {
      nom: form.nom.trim(),
      prenom: form.prenom.trim(),
      cin: form.cin || undefined,
      dateNaissance: form.dateNaissance || undefined,
      nationalite: form.nationalite || undefined,
      situationFam: form.situationFam,
      nbEnfants: Number(form.nbEnfants) || 0,
      nomConjoint: form.nomConjoint || undefined,
      telephone: form.telephone || undefined,
      whatsapp: form.whatsapp || undefined,
      email: form.email || undefined,
      adresse: form.adresse || undefined,
      unitId: form.unitId || undefined,
      type: form.type,
      dateEntree: form.dateEntree || undefined,
      dateSortie: form.dateSortie || undefined,
      loyer: form.loyer !== "" ? Number(form.loyer) : undefined,
      caution: form.caution !== "" ? Number(form.caution) : undefined,
      statut: form.statut,
    };
    startTransition(async () => {
      if (editId) {
        await updateOccupant(editId, payload);
      } else {
        await createOccupant(payload);
      }
      setShowModal(false);
      setEditId(null);
      router.refresh();
    });
  }

  // ── Delete ──
  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteOccupant(id);
      setConfirmDeleteId(null);
      if (detailId === id) setDetailId(null);
      router.refresh();
    });
  }

  // ── Shared input style ──
  const inputStyle: React.CSSProperties = {
    width: "100%",
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    padding: "7px 10px",
    fontSize: 13,
    outline: "none",
    background: "#fff",
    boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 11,
    fontWeight: 600,
    color: "#6b7280",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  };
  const sectionStyle: React.CSSProperties = {
    marginBottom: 20,
  };
  const sectionTitleStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 700,
    color: "#15803d",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: 12,
    paddingBottom: 6,
    borderBottom: "1px solid #dcfce7",
  };
  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px 16px",
  };

  return (
    <div dir={isRtl ? "rtl" : "ltr"} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* ── Stats bar ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        {[
          { label: isAr ? "إجمالي الشاغلين" : "Total occupants",    value: stats.total,       color: "#1d4ed8", bg: "#dbeafe" },
          { label: isAr ? "نشطون" : "Actifs",                        value: stats.actifs,      color: "#15803d", bg: "#dcfce7" },
          { label: isAr ? "مستأجرون" : "Locataires",                 value: stats.locataires,  color: "#1d4ed8", bg: "#dbeafe" },
          { label: isAr ? "ملاك" : "Propriétaires",                  value: stats.proprietaires, color: "#7c3aed", bg: "#f3e8ff" },
        ].map((s) => (
          <div key={s.label} style={{ background: "#fff", borderRadius: 14, border: "1px solid #f3f4f6", padding: "14px 16px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 4 }}>{s.label}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ background: s.bg, color: s.color, borderRadius: 10, padding: "6px 10px", fontSize: 20, fontWeight: 700 }}>{s.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #f3f4f6", padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        {/* Search */}
        <div style={{ position: "relative", flex: "1 1 180px", minWidth: 140 }}>
          <Search size={14} style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", pointerEvents: "none" }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isAr ? "بحث..." : "Rechercher..."}
            style={{ ...inputStyle, paddingLeft: 30 }}
          />
        </div>
        {/* Statut filter */}
        <div style={{ position: "relative" }}>
          <select value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)} style={{ ...inputStyle, paddingRight: 28, width: "auto", cursor: "pointer" }}>
            <option value="">{isAr ? "كل الحالات" : "Tous statuts"}</option>
            {Object.entries(STATUT_COLORS).map(([k, v]) => (
              <option key={k} value={k}>{isAr ? v.labelAr : v.label}</option>
            ))}
          </select>
        </div>
        {/* Type filter */}
        <div style={{ position: "relative" }}>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ ...inputStyle, paddingRight: 28, width: "auto", cursor: "pointer" }}>
            <option value="">{isAr ? "كل الأنواع" : "Tous types"}</option>
            {Object.entries(TYPE_COLORS).map(([k, v]) => (
              <option key={k} value={k}>{isAr ? v.labelAr : v.label}</option>
            ))}
          </select>
        </div>
        {/* Spacer */}
        <div style={{ flex: 1 }} />
        {/* Create button */}
        {!isViewer && (
          <button
            onClick={openCreate}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "#15803d", color: "#fff", border: "none", borderRadius: 9, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}
          >
            <UserPlus size={15} />
            {isAr ? "إضافة شاغل" : "Nouvel occupant"}
          </button>
        )}
      </div>

      {/* ── Table ── */}
      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #f3f4f6", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        {filtered.length === 0 ? (
          <p style={{ textAlign: "center", color: "#9ca3af", padding: "40px 0" }}>
            {isAr ? "لا يوجد شاغلون." : "Aucun occupant."}
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f9fafb", borderBottom: "1px solid #f3f4f6" }}>
                  {[
                    isAr ? "الاسم" : "Nom",
                    isAr ? "الوحدة" : "Unité",
                    isAr ? "النوع" : "Type",
                    isAr ? "الحالة" : "Statut",
                    isAr ? "الهاتف" : "Téléphone",
                    isAr ? "الإيجار" : "Loyer",
                    isAr ? "تاريخ الدخول" : "Entrée",
                    isAr ? "إجراءات" : "Actions",
                  ].map((h) => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: isRtl ? "right" : "left", fontWeight: 600, fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => {
                  const typeStyle = TYPE_COLORS[o.type] ?? TYPE_COLORS.OCCUPANT;
                  const statutStyle = STATUT_COLORS[o.statut] ?? STATUT_COLORS.ACTIF;
                  return (
                    <tr
                      key={o.id}
                      style={{ borderBottom: "1px solid #f9fafb", cursor: "pointer" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                    >
                      <td style={{ padding: "10px 14px" }}>
                        <p style={{ fontWeight: 600, color: "#111827" }}>{o.prenom} {o.nom}</p>
                        {o.cin && <p style={{ fontSize: 11, color: "#9ca3af" }}>CIN: {o.cin}</p>}
                      </td>
                      <td style={{ padding: "10px 14px", color: "#374151" }}>
                        {o.unit ? (
                          <span style={{ background: "#f3f4f6", borderRadius: 6, padding: "2px 8px", fontSize: 12, fontWeight: 600 }}>{o.unit.name}</span>
                        ) : (
                          <span style={{ color: "#d1d5db", fontSize: 12 }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <Badge style={typeStyle} label={isAr ? typeStyle.labelAr : typeStyle.label} />
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <Badge style={statutStyle} label={isAr ? statutStyle.labelAr : statutStyle.label} />
                      </td>
                      <td style={{ padding: "10px 14px", color: "#374151", whiteSpace: "nowrap" }}>
                        {o.telephone ?? <span style={{ color: "#d1d5db" }}>—</span>}
                      </td>
                      <td style={{ padding: "10px 14px", color: "#374151", whiteSpace: "nowrap" }}>
                        {o.loyer !== null ? <><b>{fmt(o.loyer)}</b> <span style={{ fontSize: 11, color: "#9ca3af" }}>MAD</span></> : <span style={{ color: "#d1d5db" }}>—</span>}
                      </td>
                      <td style={{ padding: "10px 14px", color: "#6b7280", fontSize: 12, whiteSpace: "nowrap" }}>
                        {o.dateEntree ? new Date(o.dateEntree).toLocaleDateString("fr-FR") : <span style={{ color: "#d1d5db" }}>—</span>}
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <button
                            onClick={() => setDetailId(o.id)}
                            title={isAr ? "عرض" : "Détail"}
                            style={{ background: "#eff6ff", color: "#1d4ed8", border: "none", borderRadius: 7, padding: "5px 7px", cursor: "pointer", display: "flex", alignItems: "center" }}
                          >
                            <Eye size={13} />
                          </button>
                          {!isViewer && (
                            <>
                              <button
                                onClick={() => openEdit(o)}
                                title={isAr ? "تعديل" : "Modifier"}
                                style={{ background: "#f0fdf4", color: "#15803d", border: "none", borderRadius: 7, padding: "5px 7px", cursor: "pointer", display: "flex", alignItems: "center" }}
                              >
                                <Pencil size={13} />
                              </button>
                              {confirmDeleteId === o.id ? (
                                <div style={{ display: "flex", gap: 4 }}>
                                  <button
                                    onClick={() => handleDelete(o.id)}
                                    disabled={isPending}
                                    style={{ background: "#dc2626", color: "#fff", border: "none", borderRadius: 7, padding: "5px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}
                                  >
                                    {isAr ? "نعم" : "Oui"}
                                  </button>
                                  <button
                                    onClick={() => setConfirmDeleteId(null)}
                                    style={{ background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 7, padding: "5px 10px", fontSize: 11, cursor: "pointer" }}
                                  >
                                    {isAr ? "لا" : "Non"}
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setConfirmDeleteId(o.id)}
                                  title={isAr ? "حذف" : "Supprimer"}
                                  style={{ background: "#fff1f2", color: "#dc2626", border: "none", borderRadius: 7, padding: "5px 7px", cursor: "pointer", display: "flex", alignItems: "center" }}
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Create / Edit Modal ── */}
      {showModal && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div
            dir={isRtl ? "rtl" : "ltr"}
            style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 680, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 50px rgba(0,0,0,0.2)" }}
          >
            {/* Modal header */}
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "#fff", zIndex: 1, borderRadius: "16px 16px 0 0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ background: "#dcfce7", borderRadius: 10, padding: "8px 10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Users size={18} style={{ color: "#15803d" }} />
                </div>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#111827" }}>
                  {editId
                    ? (isAr ? "تعديل شاغل" : "Modifier l'occupant")
                    : (isAr ? "شاغل جديد" : "Nouvel occupant")}
                </h2>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 4 }}>
                <X size={20} />
              </button>
            </div>

            {/* Form body */}
            <form onSubmit={handleSubmit} style={{ padding: 24 }}>

              {/* Section Identité */}
              <div style={sectionStyle}>
                <p style={sectionTitleStyle}>{isAr ? "الهوية" : "Identité"}</p>
                <div style={gridStyle}>
                  <div>
                    <label style={labelStyle}>{isAr ? "اللقب *" : "Nom *"}</label>
                    <input style={inputStyle} value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} placeholder={isAr ? "اللقب" : "Nom de famille"} />
                  </div>
                  <div>
                    <label style={labelStyle}>{isAr ? "الاسم *" : "Prénom *"}</label>
                    <input style={inputStyle} value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} placeholder={isAr ? "الاسم الأول" : "Prénom"} />
                  </div>
                  <div>
                    <label style={labelStyle}>CIN</label>
                    <input style={inputStyle} value={form.cin} onChange={(e) => setForm({ ...form, cin: e.target.value })} placeholder="AB123456" />
                  </div>
                  <div>
                    <label style={labelStyle}>{isAr ? "تاريخ الميلاد" : "Date de naissance"}</label>
                    <input type="date" style={inputStyle} value={form.dateNaissance} onChange={(e) => setForm({ ...form, dateNaissance: e.target.value })} />
                  </div>
                  <div>
                    <label style={labelStyle}>{isAr ? "الجنسية" : "Nationalité"}</label>
                    <input style={inputStyle} value={form.nationalite} onChange={(e) => setForm({ ...form, nationalite: e.target.value })} placeholder="Marocaine" />
                  </div>
                  <div>
                    <label style={labelStyle}>{isAr ? "الحالة العائلية" : "Situation familiale"}</label>
                    <select style={inputStyle} value={form.situationFam} onChange={(e) => setForm({ ...form, situationFam: e.target.value })}>
                      {SIT_FAM_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>{isAr ? s.ar : s.fr}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>{isAr ? "عدد الأطفال" : "Nb enfants"}</label>
                    <input type="number" min={0} style={inputStyle} value={form.nbEnfants} onChange={(e) => setForm({ ...form, nbEnfants: Number(e.target.value) })} />
                  </div>
                  <div>
                    <label style={labelStyle}>{isAr ? "اسم الزوج/الزوجة" : "Nom conjoint"}</label>
                    <input style={inputStyle} value={form.nomConjoint} onChange={(e) => setForm({ ...form, nomConjoint: e.target.value })} />
                  </div>
                </div>
              </div>

              {/* Section Coordonnées */}
              <div style={sectionStyle}>
                <p style={sectionTitleStyle}>{isAr ? "معلومات الاتصال" : "Coordonnées"}</p>
                <div style={gridStyle}>
                  <div>
                    <label style={labelStyle}>{isAr ? "الهاتف" : "Téléphone"}</label>
                    <input style={inputStyle} value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} placeholder="+212 6..." />
                  </div>
                  <div>
                    <label style={labelStyle}>WhatsApp</label>
                    <input style={inputStyle} value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="+212 6..." />
                  </div>
                  <div>
                    <label style={labelStyle}>Email</label>
                    <input type="email" style={inputStyle} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" />
                  </div>
                  <div>
                    <label style={labelStyle}>{isAr ? "العنوان" : "Adresse"}</label>
                    <input style={inputStyle} value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })} />
                  </div>
                </div>
              </div>

              {/* Section Situation immeuble */}
              <div style={sectionStyle}>
                <p style={sectionTitleStyle}>{isAr ? "وضعية في المبنى" : "Situation dans l'immeuble"}</p>
                <div style={gridStyle}>
                  <div>
                    <label style={labelStyle}>{isAr ? "الوحدة" : "Unité"}</label>
                    <select style={inputStyle} value={form.unitId} onChange={(e) => setForm({ ...form, unitId: e.target.value })}>
                      <option value="">{isAr ? "— بدون وحدة —" : "— Sans unité —"}</option>
                      {units.map((u) => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>{isAr ? "النوع" : "Type"}</label>
                    <select style={inputStyle} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                      <option value="LOCATAIRE">{isAr ? "مستأجر" : "Locataire"}</option>
                      <option value="PROPRIETAIRE">{isAr ? "مالك" : "Propriétaire"}</option>
                      <option value="OCCUPANT">{isAr ? "شاغل" : "Occupant"}</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>{isAr ? "الحالة" : "Statut"}</label>
                    <select style={inputStyle} value={form.statut} onChange={(e) => setForm({ ...form, statut: e.target.value })}>
                      <option value="ACTIF">{isAr ? "نشط" : "Actif"}</option>
                      <option value="SORTI">{isAr ? "خارج" : "Sorti"}</option>
                      <option value="EN_ATTENTE">{isAr ? "في الانتظار" : "En attente"}</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>{isAr ? "تاريخ الدخول" : "Date entrée"}</label>
                    <input type="date" style={inputStyle} value={form.dateEntree} onChange={(e) => setForm({ ...form, dateEntree: e.target.value })} />
                  </div>
                  <div>
                    <label style={labelStyle}>{isAr ? "تاريخ الخروج" : "Date sortie"}</label>
                    <input type="date" style={inputStyle} value={form.dateSortie} onChange={(e) => setForm({ ...form, dateSortie: e.target.value })} />
                  </div>
                  <div>
                    <label style={labelStyle}>{isAr ? "الإيجار (MAD)" : "Loyer (MAD)"}</label>
                    <input type="number" min={0} style={inputStyle} value={form.loyer} onChange={(e) => setForm({ ...form, loyer: e.target.value })} placeholder="0" />
                  </div>
                  <div>
                    <label style={labelStyle}>{isAr ? "الضمان (MAD)" : "Caution (MAD)"}</label>
                    <input type="number" min={0} style={inputStyle} value={form.caution} onChange={(e) => setForm({ ...form, caution: e.target.value })} placeholder="0" />
                  </div>
                </div>
              </div>

              {error && <p style={{ color: "#dc2626", fontSize: 13, marginBottom: 12 }}>{error}</p>}

              {/* Footer */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 8, borderTop: "1px solid #f3f4f6" }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 9, padding: "9px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                >
                  {isAr ? "إلغاء" : "Annuler"}
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  style={{ background: "#15803d", color: "#fff", border: "none", borderRadius: 9, padding: "9px 20px", fontSize: 13, fontWeight: 600, cursor: isPending ? "not-allowed" : "pointer", opacity: isPending ? 0.7 : 1 }}
                >
                  {isPending ? (isAr ? "جارٍ الحفظ..." : "Enregistrement...") : (editId ? (isAr ? "حفظ التعديلات" : "Enregistrer") : (isAr ? "إضافة" : "Créer"))}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Detail Panel ── */}
      {detailOccupant && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 50, display: "flex", justifyContent: isRtl ? "flex-start" : "flex-end" }}
          onClick={(e) => { if (e.target === e.currentTarget) setDetailId(null); }}
        >
          <div
            dir={isRtl ? "rtl" : "ltr"}
            style={{ background: "#fff", width: "100%", maxWidth: 460, height: "100%", overflowY: "auto", boxShadow: "-4px 0 30px rgba(0,0,0,0.15)", display: "flex", flexDirection: "column" }}
          >
            {/* Panel header */}
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f9fafb" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#111827" }}>
                  {detailOccupant.prenom} {detailOccupant.nom}
                </h2>
                {detailOccupant.cin && <p style={{ margin: "2px 0 0", fontSize: 12, color: "#9ca3af" }}>CIN: {detailOccupant.cin}</p>}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {!isViewer && (
                  <button
                    onClick={() => { setDetailId(null); openEdit(detailOccupant); }}
                    style={{ background: "#f0fdf4", color: "#15803d", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                  >
                    <Pencil size={13} />
                    {isAr ? "تعديل" : "Modifier"}
                  </button>
                )}
                <button onClick={() => setDetailId(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 4 }}>
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Panel content */}
            <div style={{ padding: 24, flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Badges */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Badge style={TYPE_COLORS[detailOccupant.type] ?? TYPE_COLORS.OCCUPANT} label={isAr ? (TYPE_COLORS[detailOccupant.type]?.labelAr ?? "") : (TYPE_COLORS[detailOccupant.type]?.label ?? "")} />
                <Badge style={STATUT_COLORS[detailOccupant.statut] ?? STATUT_COLORS.ACTIF} label={isAr ? (STATUT_COLORS[detailOccupant.statut]?.labelAr ?? "") : (STATUT_COLORS[detailOccupant.statut]?.label ?? "")} />
                {detailOccupant.unit && (
                  <span style={{ background: "#f3f4f6", color: "#374151", borderRadius: 6, padding: "2px 10px", fontSize: 12, fontWeight: 600 }}>
                    <Home size={11} style={{ display: "inline", marginRight: 4 }} />{detailOccupant.unit.name}
                  </span>
                )}
              </div>

              {/* Identité */}
              <DetailSection title={isAr ? "الهوية" : "Identité"}>
                <DetailRow label={isAr ? "الاسم الكامل" : "Nom complet"} value={`${detailOccupant.prenom} ${detailOccupant.nom}`} />
                {detailOccupant.cin && <DetailRow label="CIN" value={detailOccupant.cin} />}
                {detailOccupant.dateNaissance && <DetailRow label={isAr ? "تاريخ الميلاد" : "Naissance"} value={new Date(detailOccupant.dateNaissance).toLocaleDateString("fr-FR")} />}
                {detailOccupant.nationalite && <DetailRow label={isAr ? "الجنسية" : "Nationalité"} value={detailOccupant.nationalite} />}
                <DetailRow label={isAr ? "الحالة العائلية" : "Situation fam."} value={SIT_FAM_OPTIONS.find((s) => s.value === detailOccupant.situationFam)?.[isAr ? "ar" : "fr"] ?? detailOccupant.situationFam} />
                <DetailRow label={isAr ? "الأطفال" : "Enfants"} value={String(detailOccupant.nbEnfants)} />
                {detailOccupant.nomConjoint && <DetailRow label={isAr ? "الزوج/الزوجة" : "Conjoint"} value={detailOccupant.nomConjoint} />}
              </DetailSection>

              {/* Coordonnées */}
              <DetailSection title={isAr ? "الاتصال" : "Coordonnées"}>
                {detailOccupant.telephone && <DetailRow label={isAr ? "الهاتف" : "Téléphone"} value={detailOccupant.telephone} />}
                {detailOccupant.whatsapp && <DetailRow label="WhatsApp" value={detailOccupant.whatsapp} />}
                {detailOccupant.email && <DetailRow label="Email" value={detailOccupant.email} />}
                {detailOccupant.adresse && <DetailRow label={isAr ? "العنوان" : "Adresse"} value={detailOccupant.adresse} />}
              </DetailSection>

              {/* Situation immeuble */}
              <DetailSection title={isAr ? "وضعية في المبنى" : "Situation immeuble"}>
                {detailOccupant.unit && <DetailRow label={isAr ? "الوحدة" : "Unité"} value={detailOccupant.unit.name} />}
                {detailOccupant.dateEntree && <DetailRow label={isAr ? "تاريخ الدخول" : "Entrée"} value={new Date(detailOccupant.dateEntree).toLocaleDateString("fr-FR")} />}
                {detailOccupant.dateSortie && <DetailRow label={isAr ? "تاريخ الخروج" : "Sortie"} value={new Date(detailOccupant.dateSortie).toLocaleDateString("fr-FR")} />}
                {detailOccupant.loyer !== null && <DetailRow label={isAr ? "الإيجار" : "Loyer"} value={`${fmt(detailOccupant.loyer)} MAD`} />}
                {detailOccupant.caution !== null && <DetailRow label={isAr ? "الضمان" : "Caution"} value={`${fmt(detailOccupant.caution)} MAD`} />}
              </DetailSection>

              {/* Documents */}
              {detailOccupant.documents.length > 0 && (
                <DetailSection title={isAr ? "الوثائق" : "Documents"}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {detailOccupant.documents.map((doc) => (
                      <a
                        key={doc.id}
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ display: "flex", alignItems: "center", gap: 8, background: "#f9fafb", borderRadius: 8, padding: "8px 12px", textDecoration: "none", color: "#1d4ed8", fontSize: 13 }}
                      >
                        <FileText size={14} />
                        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.title}</span>
                        <span style={{ fontSize: 11, color: "#9ca3af" }}>{new Date(doc.createdAt).toLocaleDateString("fr-FR")}</span>
                      </a>
                    ))}
                  </div>
                </DetailSection>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p style={{ fontSize: 11, fontWeight: 700, color: "#15803d", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10, paddingBottom: 6, borderBottom: "1px solid #dcfce7" }}>{title}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {children}
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", gap: 8, fontSize: 13 }}>
      <span style={{ color: "#9ca3af", minWidth: 110, flexShrink: 0 }}>{label}</span>
      <span style={{ color: "#111827", fontWeight: 500, flex: 1, wordBreak: "break-word" }}>{value}</span>
    </div>
  );
}
