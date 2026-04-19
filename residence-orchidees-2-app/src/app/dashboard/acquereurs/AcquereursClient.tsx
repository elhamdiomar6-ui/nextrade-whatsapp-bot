"use client";
import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { fmt } from "@/lib/fmt";
import { useLang } from "@/contexts/LangContext";
import {
  createAcquereur,
  updateAcquereur,
  deleteAcquereur,
  addAcquereurContact,
} from "@/actions/acquereurs";
import {
  UserPlus, X, Pencil, Trash2, Eye, Phone, Search,
  LayoutGrid, List, FileText, Clock, ChevronDown,
  TrendingUp, CheckCircle, MessageSquare, Mail,
  PhoneCall, Building2, PlusCircle,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ContactLog {
  id: string;
  type: string;
  date: string;
  notes: string | null;
  createdAt: string;
}

interface AcquereurDoc {
  id: string;
  title: string;
  url: string;
  type: string;
  createdAt: string;
}

interface AcquereurRow {
  id: string;
  nom: string;
  prenom: string;
  cin: string | null;
  dateNaissance: string | null;
  nationalite: string | null;
  profession: string | null;
  situationFam: string;
  nbEnfants: number;
  telephone: string | null;
  whatsapp: string | null;
  email: string | null;
  adresse: string | null;
  unitesCiblees: string | null;
  budgetMax: number | null;
  financement: string;
  banque: string | null;
  apport: number | null;
  statut: string;
  agentResponsable: string | null;
  prochaineAction: string | null;
  prochaineDate: string | null;
  notes: string | null;
  contacts: ContactLog[];
  documents: AcquereurDoc[];
  createdAt: string;
}

interface Stats {
  total: number;
  actifs: number;
  enNegociation: number;
  actes: number;
}

interface Props {
  acquereurs: AcquereurRow[];
  stats: Stats;
  userRole: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUT_PIPELINE: Array<{
  value: string;
  labelFr: string;
  labelAr: string;
  bg: string;
  color: string;
  headerBg: string;
}> = [
  { value: "NOUVEAU",     labelFr: "Nouveau",     labelAr: "جديد",          bg: "#f0f9ff", color: "#0369a1", headerBg: "#0369a1" },
  { value: "CONTACTE",    labelFr: "Contacté",    labelAr: "تم الاتصال",    bg: "#fff7ed", color: "#c2410c", headerBg: "#c2410c" },
  { value: "VISITE",      labelFr: "Visité",      labelAr: "زار",           bg: "#fdf4ff", color: "#7e22ce", headerBg: "#7e22ce" },
  { value: "NEGOCIATION", labelFr: "Négociation", labelAr: "تفاوض",         bg: "#fffbeb", color: "#b45309", headerBg: "#b45309" },
  { value: "COMPROMIS",   labelFr: "Compromis",   labelAr: "اتفاق مبدئي",   bg: "#ecfdf5", color: "#047857", headerBg: "#047857" },
  { value: "ACTE",        labelFr: "Acte",        labelAr: "عقد موقع",      bg: "#dcfce7", color: "#15803d", headerBg: "#15803d" },
  { value: "PERDU",       labelFr: "Perdu",       labelAr: "خُسر",          bg: "#f9fafb", color: "#6b7280", headerBg: "#6b7280" },
];

const CONTACT_TYPES = [
  { value: "APPEL",    labelFr: "Appel",     labelAr: "مكالمة",   icon: PhoneCall },
  { value: "VISITE",   labelFr: "Visite",    labelAr: "زيارة",    icon: Building2 },
  { value: "MESSAGE",  labelFr: "Message",   labelAr: "رسالة",    icon: MessageSquare },
  { value: "WHATSAPP", labelFr: "WhatsApp",  labelAr: "واتساب",   icon: MessageSquare },
  { value: "EMAIL",    labelFr: "Email",     labelAr: "بريد إلكتروني", icon: Mail },
];

const SIT_FAM_OPTIONS = [
  { value: "CELIBATAIRE", fr: "Célibataire",  ar: "أعزب/عزباء" },
  { value: "MARIE",       fr: "Marié(e)",     ar: "متزوج/ة" },
  { value: "DIVORCE",     fr: "Divorcé(e)",   ar: "مطلق/ة" },
  { value: "VEUF",        fr: "Veuf/Veuve",   ar: "أرمل/ة" },
];

// ─── Empty form ───────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  nom: "", prenom: "", cin: "", dateNaissance: "", nationalite: "Marocaine",
  profession: "", situationFam: "CELIBATAIRE", nbEnfants: 0,
  telephone: "", whatsapp: "", email: "", adresse: "",
  unitesCiblees: "", budgetMax: "", financement: "CASH",
  banque: "", apport: "", agentResponsable: "", notes: "",
  statut: "NOUVEAU",
  // suivi
  prochaineAction: "", prochaineDate: "",
};

type FormState = typeof EMPTY_FORM;

const EMPTY_CONTACT = { type: "APPEL", date: "", notes: "" };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStatutInfo(value: string) {
  return STATUT_PIPELINE.find((s) => s.value === value) ?? STATUT_PIPELINE[0];
}

function parseUnits(json: string | null): string[] {
  if (!json) return [];
  try { return JSON.parse(json); } catch { return []; }
}

function Badge({ bg, color, label }: { bg: string; color: string; label: string }) {
  return (
    <span style={{ background: bg, color, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600, display: "inline-block", whiteSpace: "nowrap" }}>
      {label}
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AcquereursClient({ acquereurs, stats, userRole }: Props) {
  const { lang, isRtl } = useLang();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isAr = lang === "ar";
  const isViewer = userRole === "VIEWER";

  // View
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Form
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState("");

  // Contact log
  const [contactForm, setContactForm] = useState(EMPTY_CONTACT);
  const [contactError, setContactError] = useState("");
  const [addingContact, setAddingContact] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState("");

  const filtered = useMemo(() => {
    return acquereurs.filter((a) => {
      const name = `${a.nom} ${a.prenom}`.toLowerCase();
      const q = search.toLowerCase();
      if (q && !name.includes(q) && !(a.telephone ?? "").includes(q)) return false;
      if (filterStatut && a.statut !== filterStatut) return false;
      return true;
    });
  }, [acquereurs, search, filterStatut]);

  const detailAcquereur = detailId ? acquereurs.find((a) => a.id === detailId) ?? null : null;

  // ── Open create ──
  function openCreate() {
    setForm(EMPTY_FORM);
    setEditId(null);
    setFormError("");
    setShowModal(true);
  }

  // ── Open edit ──
  function openEdit(a: AcquereurRow) {
    const units = parseUnits(a.unitesCiblees);
    setForm({
      nom: a.nom, prenom: a.prenom, cin: a.cin ?? "", dateNaissance: a.dateNaissance ? a.dateNaissance.slice(0, 10) : "",
      nationalite: a.nationalite ?? "Marocaine", profession: a.profession ?? "",
      situationFam: a.situationFam, nbEnfants: a.nbEnfants,
      telephone: a.telephone ?? "", whatsapp: a.whatsapp ?? "",
      email: a.email ?? "", adresse: a.adresse ?? "",
      unitesCiblees: units.join(", "),
      budgetMax: a.budgetMax !== null ? String(a.budgetMax) : "",
      financement: a.financement, banque: a.banque ?? "", apport: a.apport !== null ? String(a.apport) : "",
      agentResponsable: a.agentResponsable ?? "", notes: a.notes ?? "",
      statut: a.statut,
      prochaineAction: a.prochaineAction ?? "",
      prochaineDate: a.prochaineDate ? a.prochaineDate.slice(0, 10) : "",
    });
    setEditId(a.id);
    setFormError("");
    setShowModal(true);
  }

  // ── Submit form ──
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nom.trim() || !form.prenom.trim()) {
      setFormError(isAr ? "الاسم واللقب مطلوبان" : "Nom et prénom requis");
      return;
    }
    setFormError("");
    const unitsArr = form.unitesCiblees ? form.unitesCiblees.split(",").map((s) => s.trim()).filter(Boolean) : undefined;
    const payload = {
      nom: form.nom.trim(), prenom: form.prenom.trim(),
      cin: form.cin || undefined, dateNaissance: form.dateNaissance || undefined,
      nationalite: form.nationalite || undefined, profession: form.profession || undefined,
      situationFam: form.situationFam, nbEnfants: Number(form.nbEnfants) || 0,
      telephone: form.telephone || undefined, whatsapp: form.whatsapp || undefined,
      email: form.email || undefined, adresse: form.adresse || undefined,
      unitesCiblees: unitsArr, budgetMax: form.budgetMax !== "" ? Number(form.budgetMax) : undefined,
      financement: form.financement, banque: form.banque || undefined,
      apport: form.apport !== "" ? Number(form.apport) : undefined,
      agentResponsable: form.agentResponsable || undefined, notes: form.notes || undefined,
    };
    startTransition(async () => {
      if (editId) {
        await updateAcquereur(editId, {
          ...payload,
          statut: form.statut,
          prochaineAction: form.prochaineAction || undefined,
          prochaineDate: form.prochaineDate || undefined,
        });
      } else {
        await createAcquereur(payload);
      }
      setShowModal(false);
      setEditId(null);
      router.refresh();
    });
  }

  // ── Status change inline ──
  function handleStatusChange(id: string, statut: string) {
    startTransition(async () => {
      await updateAcquereur(id, { statut });
      router.refresh();
    });
  }

  // ── Delete ──
  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteAcquereur(id);
      setConfirmDeleteId(null);
      if (detailId === id) setDetailId(null);
      router.refresh();
    });
  }

  // ── Add contact ──
  function handleAddContact(e: React.FormEvent) {
    e.preventDefault();
    if (!contactForm.date) {
      setContactError(isAr ? "التاريخ مطلوب" : "La date est requise");
      return;
    }
    if (!detailId) return;
    setContactError("");
    startTransition(async () => {
      await addAcquereurContact(detailId, {
        type: contactForm.type,
        date: contactForm.date,
        notes: contactForm.notes || undefined,
      });
      setContactForm(EMPTY_CONTACT);
      setAddingContact(false);
      router.refresh();
    });
  }

  // ── Styles ──
  const inputStyle: React.CSSProperties = {
    width: "100%", border: "1px solid #e5e7eb", borderRadius: 8,
    padding: "7px 10px", fontSize: 13, outline: "none", background: "#fff", boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: 11, fontWeight: 600, color: "#6b7280",
    marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em",
  };
  const gridStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 16px" };
  const sectionTitleStyle: React.CSSProperties = {
    fontSize: 12, fontWeight: 700, color: "#0369a1", textTransform: "uppercase",
    letterSpacing: "0.08em", marginBottom: 12, paddingBottom: 6, borderBottom: "1px solid #dbeafe",
  };

  return (
    <div dir={isRtl ? "rtl" : "ltr"} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* ── Stats bar ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        {[
          { label: isAr ? "إجمالي المشترين" : "Total acquéreurs",  value: stats.total,         color: "#0369a1", bg: "#dbeafe" },
          { label: isAr ? "نشطون" : "En cours",                    value: stats.actifs,        color: "#047857", bg: "#dcfce7" },
          { label: isAr ? "في التفاوض" : "En négociation",         value: stats.enNegociation, color: "#b45309", bg: "#fef3c7" },
          { label: isAr ? "عقود موقعة" : "Actes signés",           value: stats.actes,         color: "#15803d", bg: "#bbf7d0" },
        ].map((s) => (
          <div key={s.label} style={{ background: "#fff", borderRadius: 14, border: "1px solid #f3f4f6", padding: "14px 16px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 4 }}>{s.label}</p>
            <span style={{ background: s.bg, color: s.color, borderRadius: 10, padding: "6px 10px", fontSize: 20, fontWeight: 700, display: "inline-block" }}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #f3f4f6", padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div style={{ position: "relative", flex: "1 1 180px", minWidth: 140 }}>
          <Search size={14} style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", pointerEvents: "none" }} />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={isAr ? "بحث..." : "Rechercher..."} style={{ ...inputStyle, paddingLeft: 30 }} />
        </div>
        <select value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)} style={{ ...inputStyle, width: "auto", cursor: "pointer" }}>
          <option value="">{isAr ? "كل المراحل" : "Toutes étapes"}</option>
          {STATUT_PIPELINE.map((s) => (
            <option key={s.value} value={s.value}>{isAr ? s.labelAr : s.labelFr}</option>
          ))}
        </select>
        <div style={{ display: "flex", gap: 4 }}>
          <button
            onClick={() => setViewMode("kanban")}
            style={{ background: viewMode === "kanban" ? "#1d4ed8" : "#f3f4f6", color: viewMode === "kanban" ? "#fff" : "#6b7280", border: "none", borderRadius: 8, padding: "7px 10px", cursor: "pointer", display: "flex", alignItems: "center" }}
          >
            <LayoutGrid size={15} />
          </button>
          <button
            onClick={() => setViewMode("list")}
            style={{ background: viewMode === "list" ? "#1d4ed8" : "#f3f4f6", color: viewMode === "list" ? "#fff" : "#6b7280", border: "none", borderRadius: 8, padding: "7px 10px", cursor: "pointer", display: "flex", alignItems: "center" }}
          >
            <List size={15} />
          </button>
        </div>
        <div style={{ flex: 1 }} />
        {!isViewer && (
          <button
            onClick={openCreate}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "#1d4ed8", color: "#fff", border: "none", borderRadius: 9, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}
          >
            <UserPlus size={15} />
            {isAr ? "إضافة مشتري" : "Nouvel acquéreur"}
          </button>
        )}
      </div>

      {/* ── Kanban View ── */}
      {viewMode === "kanban" && (
        <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8, alignItems: "flex-start" }}>
          {STATUT_PIPELINE.map((col) => {
            const cards = filtered.filter((a) => a.statut === col.value);
            return (
              <div key={col.value} style={{ minWidth: 210, flex: "0 0 210px", display: "flex", flexDirection: "column", gap: 0 }}>
                {/* Column header */}
                <div style={{ background: col.headerBg, borderRadius: "10px 10px 0 0", padding: "8px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>{isAr ? col.labelAr : col.labelFr}</span>
                  <span style={{ background: "rgba(255,255,255,0.25)", color: "#fff", borderRadius: 20, padding: "1px 8px", fontSize: 11, fontWeight: 700 }}>{cards.length}</span>
                </div>
                {/* Cards */}
                <div style={{ background: "#f9fafb", borderRadius: "0 0 10px 10px", border: "1px solid #e5e7eb", borderTop: "none", minHeight: 60, padding: 8, display: "flex", flexDirection: "column", gap: 8 }}>
                  {cards.length === 0 && (
                    <p style={{ textAlign: "center", color: "#d1d5db", fontSize: 12, padding: "12px 0" }}>—</p>
                  )}
                  {cards.map((a) => {
                    const units = parseUnits(a.unitesCiblees);
                    return (
                      <div
                        key={a.id}
                        style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "10px 12px", cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
                        onClick={() => setDetailId(a.id)}
                      >
                        <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: "#111827" }}>{a.prenom} {a.nom}</p>
                        {a.telephone && (
                          <p style={{ margin: "4px 0 0", fontSize: 11, color: "#6b7280", display: "flex", alignItems: "center", gap: 4 }}>
                            <Phone size={10} /> {a.telephone}
                          </p>
                        )}
                        {a.budgetMax && (
                          <p style={{ margin: "4px 0 0", fontSize: 11, color: "#0369a1" }}>
                            {fmt(a.budgetMax)} MAD
                          </p>
                        )}
                        {units.length > 0 && (
                          <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 4 }}>
                            {units.map((u) => (
                              <span key={u} style={{ background: "#f3f4f6", color: "#374151", borderRadius: 4, padding: "1px 6px", fontSize: 10, fontWeight: 600 }}>{u}</span>
                            ))}
                          </div>
                        )}
                        {/* Status change */}
                        {!isViewer && (
                          <div style={{ marginTop: 8 }} onClick={(e) => e.stopPropagation()}>
                            <select
                              value={a.statut}
                              onChange={(e) => handleStatusChange(a.id, e.target.value)}
                              style={{ width: "100%", border: "1px solid #e5e7eb", borderRadius: 6, padding: "4px 6px", fontSize: 11, background: col.bg, color: col.color, fontWeight: 600, cursor: "pointer" }}
                            >
                              {STATUT_PIPELINE.map((s) => (
                                <option key={s.value} value={s.value}>{isAr ? s.labelAr : s.labelFr}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── List View ── */}
      {viewMode === "list" && (
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #f3f4f6", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          {filtered.length === 0 ? (
            <p style={{ textAlign: "center", color: "#9ca3af", padding: "40px 0" }}>{isAr ? "لا يوجد مشترون." : "Aucun acquéreur."}</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f9fafb", borderBottom: "1px solid #f3f4f6" }}>
                    {[
                      isAr ? "الاسم" : "Nom",
                      isAr ? "الهاتف" : "Téléphone",
                      isAr ? "الوحدات" : "Unités ciblées",
                      isAr ? "الميزانية" : "Budget",
                      isAr ? "المرحلة" : "Étape",
                      isAr ? "إجراءات" : "Actions",
                    ].map((h) => (
                      <th key={h} style={{ padding: "10px 14px", textAlign: isRtl ? "right" : "left", fontWeight: 600, fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a) => {
                    const si = getStatutInfo(a.statut);
                    const units = parseUnits(a.unitesCiblees);
                    return (
                      <tr
                        key={a.id}
                        style={{ borderBottom: "1px solid #f9fafb" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                      >
                        <td style={{ padding: "10px 14px" }}>
                          <p style={{ fontWeight: 600, color: "#111827", margin: 0 }}>{a.prenom} {a.nom}</p>
                          {a.profession && <p style={{ fontSize: 11, color: "#9ca3af", margin: "2px 0 0" }}>{a.profession}</p>}
                        </td>
                        <td style={{ padding: "10px 14px", color: "#374151" }}>{a.telephone ?? <span style={{ color: "#d1d5db" }}>—</span>}</td>
                        <td style={{ padding: "10px 14px" }}>
                          {units.length > 0 ? (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                              {units.map((u) => <span key={u} style={{ background: "#f3f4f6", color: "#374151", borderRadius: 5, padding: "2px 7px", fontSize: 11, fontWeight: 600 }}>{u}</span>)}
                            </div>
                          ) : <span style={{ color: "#d1d5db" }}>—</span>}
                        </td>
                        <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
                          {a.budgetMax !== null ? <><b>{fmt(a.budgetMax)}</b> <span style={{ fontSize: 11, color: "#9ca3af" }}>MAD</span></> : <span style={{ color: "#d1d5db" }}>—</span>}
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          <Badge bg={si.bg} color={si.color} label={isAr ? si.labelAr : si.labelFr} />
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <button onClick={() => setDetailId(a.id)} style={{ background: "#eff6ff", color: "#1d4ed8", border: "none", borderRadius: 7, padding: "5px 7px", cursor: "pointer", display: "flex", alignItems: "center" }}>
                              <Eye size={13} />
                            </button>
                            {!isViewer && (
                              <>
                                <button onClick={() => openEdit(a)} style={{ background: "#f0fdf4", color: "#15803d", border: "none", borderRadius: 7, padding: "5px 7px", cursor: "pointer", display: "flex", alignItems: "center" }}>
                                  <Pencil size={13} />
                                </button>
                                {confirmDeleteId === a.id ? (
                                  <div style={{ display: "flex", gap: 4 }}>
                                    <button onClick={() => handleDelete(a.id)} disabled={isPending} style={{ background: "#dc2626", color: "#fff", border: "none", borderRadius: 7, padding: "5px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                                      {isAr ? "نعم" : "Oui"}
                                    </button>
                                    <button onClick={() => setConfirmDeleteId(null)} style={{ background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 7, padding: "5px 10px", fontSize: 11, cursor: "pointer" }}>
                                      {isAr ? "لا" : "Non"}
                                    </button>
                                  </div>
                                ) : (
                                  <button onClick={() => setConfirmDeleteId(a.id)} style={{ background: "#fff1f2", color: "#dc2626", border: "none", borderRadius: 7, padding: "5px 7px", cursor: "pointer", display: "flex", alignItems: "center" }}>
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
      )}

      {/* ── Create / Edit Modal ── */}
      {showModal && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div
            dir={isRtl ? "rtl" : "ltr"}
            style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 700, maxHeight: "92vh", overflowY: "auto", boxShadow: "0 20px 50px rgba(0,0,0,0.2)" }}
          >
            {/* Header */}
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "#fff", zIndex: 1, borderRadius: "16px 16px 0 0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ background: "#dbeafe", borderRadius: 10, padding: "8px 10px", display: "flex" }}>
                  <UserPlus size={18} style={{ color: "#1d4ed8" }} />
                </div>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#111827" }}>
                  {editId ? (isAr ? "تعديل المشتري" : "Modifier l'acquéreur") : (isAr ? "مشتري جديد" : "Nouvel acquéreur")}
                </h2>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}>
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit} style={{ padding: 24 }}>

              {/* Identité */}
              <div style={{ marginBottom: 20 }}>
                <p style={sectionTitleStyle}>{isAr ? "الهوية" : "Identité"}</p>
                <div style={gridStyle}>
                  <div><label style={labelStyle}>{isAr ? "اللقب *" : "Nom *"}</label><input style={inputStyle} value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} /></div>
                  <div><label style={labelStyle}>{isAr ? "الاسم *" : "Prénom *"}</label><input style={inputStyle} value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} /></div>
                  <div><label style={labelStyle}>CIN</label><input style={inputStyle} value={form.cin} onChange={(e) => setForm({ ...form, cin: e.target.value })} /></div>
                  <div><label style={labelStyle}>{isAr ? "تاريخ الميلاد" : "Date naissance"}</label><input type="date" style={inputStyle} value={form.dateNaissance} onChange={(e) => setForm({ ...form, dateNaissance: e.target.value })} /></div>
                  <div><label style={labelStyle}>{isAr ? "المهنة" : "Profession"}</label><input style={inputStyle} value={form.profession} onChange={(e) => setForm({ ...form, profession: e.target.value })} /></div>
                  <div><label style={labelStyle}>{isAr ? "الجنسية" : "Nationalité"}</label><input style={inputStyle} value={form.nationalite} onChange={(e) => setForm({ ...form, nationalite: e.target.value })} /></div>
                  <div><label style={labelStyle}>{isAr ? "الحالة العائلية" : "Situation fam."}</label>
                    <select style={inputStyle} value={form.situationFam} onChange={(e) => setForm({ ...form, situationFam: e.target.value })}>
                      {SIT_FAM_OPTIONS.map((s) => <option key={s.value} value={s.value}>{isAr ? s.ar : s.fr}</option>)}
                    </select>
                  </div>
                  <div><label style={labelStyle}>{isAr ? "الأطفال" : "Nb enfants"}</label><input type="number" min={0} style={inputStyle} value={form.nbEnfants} onChange={(e) => setForm({ ...form, nbEnfants: Number(e.target.value) })} /></div>
                </div>
              </div>

              {/* Coordonnées */}
              <div style={{ marginBottom: 20 }}>
                <p style={sectionTitleStyle}>{isAr ? "الاتصال" : "Coordonnées"}</p>
                <div style={gridStyle}>
                  <div><label style={labelStyle}>{isAr ? "الهاتف" : "Téléphone"}</label><input style={inputStyle} value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} /></div>
                  <div><label style={labelStyle}>WhatsApp</label><input style={inputStyle} value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} /></div>
                  <div><label style={labelStyle}>Email</label><input type="email" style={inputStyle} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                  <div><label style={labelStyle}>{isAr ? "العنوان" : "Adresse"}</label><input style={inputStyle} value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })} /></div>
                </div>
              </div>

              {/* Intérêt achat */}
              <div style={{ marginBottom: 20 }}>
                <p style={sectionTitleStyle}>{isAr ? "اهتمام الشراء" : "Intérêt d'achat"}</p>
                <div style={gridStyle}>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={labelStyle}>{isAr ? "الوحدات المستهدفة (مفصولة بفاصلة)" : "Unités ciblées (séparées par virgule)"}</label>
                    <input style={inputStyle} value={form.unitesCiblees} onChange={(e) => setForm({ ...form, unitesCiblees: e.target.value })} placeholder="A1, A3, MAG2" />
                  </div>
                  <div><label style={labelStyle}>{isAr ? "الميزانية القصوى (MAD)" : "Budget max (MAD)"}</label><input type="number" min={0} style={inputStyle} value={form.budgetMax} onChange={(e) => setForm({ ...form, budgetMax: e.target.value })} /></div>
                  <div><label style={labelStyle}>{isAr ? "طريقة التمويل" : "Financement"}</label>
                    <select style={inputStyle} value={form.financement} onChange={(e) => setForm({ ...form, financement: e.target.value })}>
                      <option value="CASH">{isAr ? "نقداً" : "Cash"}</option>
                      <option value="CREDIT">{isAr ? "قرض" : "Crédit"}</option>
                    </select>
                  </div>
                  {form.financement === "CREDIT" && (
                    <>
                      <div><label style={labelStyle}>{isAr ? "البنك" : "Banque"}</label><input style={inputStyle} value={form.banque} onChange={(e) => setForm({ ...form, banque: e.target.value })} /></div>
                      <div><label style={labelStyle}>{isAr ? "المساهمة الذاتية" : "Apport (MAD)"}</label><input type="number" min={0} style={inputStyle} value={form.apport} onChange={(e) => setForm({ ...form, apport: e.target.value })} /></div>
                    </>
                  )}
                </div>
              </div>

              {/* Suivi */}
              <div style={{ marginBottom: 20 }}>
                <p style={sectionTitleStyle}>{isAr ? "المتابعة" : "Suivi"}</p>
                <div style={gridStyle}>
                  {editId && (
                    <div><label style={labelStyle}>{isAr ? "المرحلة" : "Statut"}</label>
                      <select style={inputStyle} value={form.statut} onChange={(e) => setForm({ ...form, statut: e.target.value })}>
                        {STATUT_PIPELINE.map((s) => <option key={s.value} value={s.value}>{isAr ? s.labelAr : s.labelFr}</option>)}
                      </select>
                    </div>
                  )}
                  <div><label style={labelStyle}>{isAr ? "المسؤول" : "Agent responsable"}</label><input style={inputStyle} value={form.agentResponsable} onChange={(e) => setForm({ ...form, agentResponsable: e.target.value })} /></div>
                  <div><label style={labelStyle}>{isAr ? "الإجراء القادم" : "Prochaine action"}</label><input style={inputStyle} value={form.prochaineAction} onChange={(e) => setForm({ ...form, prochaineAction: e.target.value })} /></div>
                  <div><label style={labelStyle}>{isAr ? "تاريخ الإجراء" : "Date prochaine action"}</label><input type="date" style={inputStyle} value={form.prochaineDate} onChange={(e) => setForm({ ...form, prochaineDate: e.target.value })} /></div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={labelStyle}>{isAr ? "ملاحظات" : "Notes"}</label>
                    <textarea style={{ ...inputStyle, minHeight: 70, resize: "vertical" }} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                  </div>
                </div>
              </div>

              {formError && <p style={{ color: "#dc2626", fontSize: 13, marginBottom: 12 }}>{formError}</p>}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 8, borderTop: "1px solid #f3f4f6" }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 9, padding: "9px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  {isAr ? "إلغاء" : "Annuler"}
                </button>
                <button type="submit" disabled={isPending} style={{ background: "#1d4ed8", color: "#fff", border: "none", borderRadius: 9, padding: "9px 20px", fontSize: 13, fontWeight: 600, cursor: isPending ? "not-allowed" : "pointer", opacity: isPending ? 0.7 : 1 }}>
                  {isPending ? (isAr ? "جارٍ الحفظ..." : "Enregistrement...") : editId ? (isAr ? "حفظ التعديلات" : "Enregistrer") : (isAr ? "إضافة" : "Créer")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Detail Panel ── */}
      {detailAcquereur && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 50, display: "flex", justifyContent: isRtl ? "flex-start" : "flex-end" }}
          onClick={(e) => { if (e.target === e.currentTarget) setDetailId(null); }}
        >
          <div
            dir={isRtl ? "rtl" : "ltr"}
            style={{ background: "#fff", width: "100%", maxWidth: 500, height: "100%", overflowY: "auto", boxShadow: "-4px 0 30px rgba(0,0,0,0.15)", display: "flex", flexDirection: "column" }}
          >
            {/* Panel header */}
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #f3f4f6", background: "#f9fafb", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#111827" }}>{detailAcquereur.prenom} {detailAcquereur.nom}</h2>
                {detailAcquereur.profession && <p style={{ margin: "2px 0 0", fontSize: 12, color: "#9ca3af" }}>{detailAcquereur.profession}</p>}
                <div style={{ marginTop: 8 }}>
                  {(() => { const si = getStatutInfo(detailAcquereur.statut); return <Badge bg={si.bg} color={si.color} label={isAr ? si.labelAr : si.labelFr} />; })()}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {!isViewer && (
                  <button onClick={() => { setDetailId(null); openEdit(detailAcquereur); }} style={{ background: "#dbeafe", color: "#1d4ed8", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                    <Pencil size={13} />{isAr ? "تعديل" : "Modifier"}
                  </button>
                )}
                <button onClick={() => setDetailId(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}>
                  <X size={20} />
                </button>
              </div>
            </div>

            <div style={{ padding: 24, flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Identité */}
              <PanelSection title={isAr ? "الهوية" : "Identité"} color="#0369a1">
                {detailAcquereur.cin && <PRow label="CIN" value={detailAcquereur.cin} />}
                {detailAcquereur.dateNaissance && <PRow label={isAr ? "الميلاد" : "Naissance"} value={new Date(detailAcquereur.dateNaissance).toLocaleDateString("fr-FR")} />}
                {detailAcquereur.nationalite && <PRow label={isAr ? "الجنسية" : "Nationalité"} value={detailAcquereur.nationalite} />}
                <PRow label={isAr ? "الحالة العائلية" : "Situation fam."} value={SIT_FAM_OPTIONS.find((s) => s.value === detailAcquereur.situationFam)?.[isAr ? "ar" : "fr"] ?? detailAcquereur.situationFam} />
                <PRow label={isAr ? "الأطفال" : "Enfants"} value={String(detailAcquereur.nbEnfants)} />
              </PanelSection>

              {/* Coordonnées */}
              <PanelSection title={isAr ? "الاتصال" : "Coordonnées"} color="#0369a1">
                {detailAcquereur.telephone && <PRow label={isAr ? "الهاتف" : "Téléphone"} value={detailAcquereur.telephone} />}
                {detailAcquereur.whatsapp && <PRow label="WhatsApp" value={detailAcquereur.whatsapp} />}
                {detailAcquereur.email && <PRow label="Email" value={detailAcquereur.email} />}
                {detailAcquereur.adresse && <PRow label={isAr ? "العنوان" : "Adresse"} value={detailAcquereur.adresse} />}
              </PanelSection>

              {/* Intérêt */}
              <PanelSection title={isAr ? "اهتمام الشراء" : "Intérêt d'achat"} color="#0369a1">
                {detailAcquereur.budgetMax !== null && <PRow label={isAr ? "الميزانية" : "Budget max"} value={`${fmt(detailAcquereur.budgetMax)} MAD`} />}
                <PRow label={isAr ? "التمويل" : "Financement"} value={detailAcquereur.financement === "CASH" ? (isAr ? "نقداً" : "Cash") : (isAr ? "قرض" : "Crédit")} />
                {detailAcquereur.banque && <PRow label={isAr ? "البنك" : "Banque"} value={detailAcquereur.banque} />}
                {detailAcquereur.apport !== null && <PRow label={isAr ? "المساهمة" : "Apport"} value={`${fmt(detailAcquereur.apport)} MAD`} />}
                {parseUnits(detailAcquereur.unitesCiblees).length > 0 && (
                  <PRow label={isAr ? "الوحدات" : "Unités"} value={parseUnits(detailAcquereur.unitesCiblees).join(", ")} />
                )}
              </PanelSection>

              {/* Suivi */}
              {(detailAcquereur.prochaineAction || detailAcquereur.notes || detailAcquereur.agentResponsable) && (
                <PanelSection title={isAr ? "المتابعة" : "Suivi"} color="#0369a1">
                  {detailAcquereur.agentResponsable && <PRow label={isAr ? "المسؤول" : "Agent"} value={detailAcquereur.agentResponsable} />}
                  {detailAcquereur.prochaineAction && <PRow label={isAr ? "الإجراء القادم" : "Prochaine action"} value={detailAcquereur.prochaineAction} />}
                  {detailAcquereur.prochaineDate && <PRow label={isAr ? "التاريخ" : "Date"} value={new Date(detailAcquereur.prochaineDate).toLocaleDateString("fr-FR")} />}
                  {detailAcquereur.notes && <PRow label={isAr ? "ملاحظات" : "Notes"} value={detailAcquereur.notes} />}
                </PanelSection>
              )}

              {/* Contact History */}
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, paddingBottom: 6, borderBottom: "1px solid #dbeafe" }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#0369a1", textTransform: "uppercase", letterSpacing: "0.08em" }}>{isAr ? "سجل الاتصالات" : "Historique contacts"}</p>
                  {!isViewer && (
                    <button
                      onClick={() => setAddingContact(!addingContact)}
                      style={{ display: "flex", alignItems: "center", gap: 4, background: "#dbeafe", color: "#1d4ed8", border: "none", borderRadius: 7, padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}
                    >
                      <PlusCircle size={12} />
                      {isAr ? "إضافة" : "Ajouter"}
                    </button>
                  )}
                </div>

                {/* Add contact form */}
                {addingContact && !isViewer && (
                  <form onSubmit={handleAddContact} style={{ background: "#f0f9ff", borderRadius: 10, padding: 14, marginBottom: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 12px" }}>
                      <div>
                        <label style={labelStyle}>{isAr ? "النوع" : "Type"}</label>
                        <select style={inputStyle} value={contactForm.type} onChange={(e) => setContactForm({ ...contactForm, type: e.target.value })}>
                          {CONTACT_TYPES.map((ct) => <option key={ct.value} value={ct.value}>{isAr ? ct.labelAr : ct.labelFr}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={labelStyle}>{isAr ? "التاريخ *" : "Date *"}</label>
                        <input type="date" style={inputStyle} value={contactForm.date} onChange={(e) => setContactForm({ ...contactForm, date: e.target.value })} />
                      </div>
                      <div style={{ gridColumn: "1 / -1" }}>
                        <label style={labelStyle}>{isAr ? "ملاحظات" : "Notes"}</label>
                        <textarea style={{ ...inputStyle, minHeight: 55, resize: "vertical" }} value={contactForm.notes} onChange={(e) => setContactForm({ ...contactForm, notes: e.target.value })} />
                      </div>
                    </div>
                    {contactError && <p style={{ color: "#dc2626", fontSize: 12 }}>{contactError}</p>}
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                      <button type="button" onClick={() => { setAddingContact(false); setContactForm(EMPTY_CONTACT); }} style={{ background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 7, padding: "6px 14px", fontSize: 12, cursor: "pointer" }}>{isAr ? "إلغاء" : "Annuler"}</button>
                      <button type="submit" disabled={isPending} style={{ background: "#1d4ed8", color: "#fff", border: "none", borderRadius: 7, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{isAr ? "حفظ" : "Enregistrer"}</button>
                    </div>
                  </form>
                )}

                {/* Timeline */}
                {detailAcquereur.contacts.length === 0 ? (
                  <p style={{ color: "#d1d5db", fontSize: 12, textAlign: "center", padding: "10px 0" }}>{isAr ? "لا يوجد سجل" : "Aucun contact enregistré"}</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {detailAcquereur.contacts.map((c) => {
                      const ct = CONTACT_TYPES.find((t) => t.value === c.type);
                      return (
                        <div key={c.id} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                          <div style={{ background: "#dbeafe", color: "#1d4ed8", borderRadius: 8, padding: "5px 7px", display: "flex", flexShrink: 0 }}>
                            {ct ? <ct.icon size={13} /> : <Clock size={13} />}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ fontSize: 12, fontWeight: 600, color: "#111827" }}>{isAr ? (ct?.labelAr ?? c.type) : (ct?.labelFr ?? c.type)}</span>
                              <span style={{ fontSize: 11, color: "#9ca3af" }}>{new Date(c.date).toLocaleDateString("fr-FR")}</span>
                            </div>
                            {c.notes && <p style={{ margin: "3px 0 0", fontSize: 12, color: "#6b7280" }}>{c.notes}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Documents */}
              {detailAcquereur.documents.length > 0 && (
                <PanelSection title={isAr ? "الوثائق" : "Documents"} color="#0369a1">
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {detailAcquereur.documents.map((doc) => (
                      <a key={doc.id} href={doc.url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 8, background: "#f9fafb", borderRadius: 8, padding: "8px 12px", textDecoration: "none", color: "#1d4ed8", fontSize: 13 }}>
                        <FileText size={14} />
                        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.title}</span>
                        <span style={{ fontSize: 11, color: "#9ca3af" }}>{new Date(doc.createdAt).toLocaleDateString("fr-FR")}</span>
                      </a>
                    ))}
                  </div>
                </PanelSection>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PanelSection({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div>
      <p style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10, paddingBottom: 6, borderBottom: `1px solid ${color}30` }}>{title}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>{children}</div>
    </div>
  );
}

function PRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", gap: 8, fontSize: 13 }}>
      <span style={{ color: "#9ca3af", minWidth: 120, flexShrink: 0 }}>{label}</span>
      <span style={{ color: "#111827", fontWeight: 500, flex: 1, wordBreak: "break-word" }}>{value}</span>
    </div>
  );
}
