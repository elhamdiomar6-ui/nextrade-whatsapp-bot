"use client";
import { useState, useMemo } from "react";
import { useLang } from "@/contexts/LangContext";
import { useRouter } from "next/navigation";
import {
  HardHat, MapPin, Building2, FileText, Wrench, Shield,
  TrendingUp, AlertTriangle, CheckCircle, Clock, Banknote,
  ChevronRight, ExternalLink, Star,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PDoc { id: string; title: string; url: string; type: string }
interface Prestataire {
  id: string; metier: string; nomSociete: string; responsable?: string;
  telephone?: string; statut: string; montantMarche?: number; montantPaye?: number;
  noteSatisfaction?: number; garantieExpiration?: string | Date;
  documents: PDoc[];
}
interface Stats {
  total: number; paye: number; reste: number;
  actifs: number; garantie: number; termines: number; garantiesProches: number;
}

// ─── Catégories construction ──────────────────────────────────────────────────

const CATEGORIES = [
  {
    id: "foncier",
    icon: MapPin,
    color: "#d97706", bg: "#fef3c7",
    fr: "Foncier & Juridique",
    ar: "الوثائق القانونية والأراضي",
    metiers: ["VENDEUR_TERRAIN", "NOTAIRE", "GEOMETRE", "TOPOGRAPHIE", "ORGANISME_URBANISME"],
  },
  {
    id: "conception",
    icon: FileText,
    color: "#7c3aed", bg: "#f5f3ff",
    fr: "Conception & Contrôle",
    ar: "التصميم والمراقبة",
    metiers: ["ARCHITECTE", "INGENIEUR_GENIE_CIVIL", "BUREAU_CONTROLE"],
  },
  {
    id: "gros_oeuvre",
    icon: HardHat,
    color: "#374151", bg: "#f3f4f6",
    fr: "Gros Œuvre",
    ar: "الأعمال الكبرى",
    metiers: ["TERRASSEMENT", "MACONNERIE", "BETON_COFFRAGE", "ETANCHEITE_ISOLATION"],
  },
  {
    id: "corps_etat",
    icon: Wrench,
    color: "#0284c7", bg: "#e0f2fe",
    fr: "Corps d'état secondaires",
    ar: "أعمال التشطيب",
    metiers: [
      "PLOMBERIE_SANITAIRE", "ELECTRICITE", "CLIMATISATION_VENTILATION",
      "MENUISERIE_BOIS", "MENUISERIE_ALUMINIUM", "FERRONNERIE_SERRURERIE",
      "CARRELAGE_REVETEMENT", "PEINTURE_BATIMENT", "PLATRERIE_ENDUIT",
      "ASCENSEUR", "SECURITE_INCENDIE",
    ],
  },
  {
    id: "logistique",
    icon: Building2,
    color: "#059669", bg: "#ecfdf5",
    fr: "Logistique & Matériaux",
    ar: "اللوجستيك والمواد",
    metiers: ["TRANSPORT_LIVRAISON", "LOCATION_ENGINS", "FOURNISSEUR_MATERIAUX"],
  },
] as const;

const STATUT_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  EN_COURS:  { bg: "#dbeafe", color: "#1d4ed8", label: "En cours" },
  TERMINE:   { bg: "#dcfce7", color: "#15803d", label: "Terminé" },
  GARANTIE:  { bg: "#fef9c3", color: "#b45309", label: "Garantie" },
  LITIGE:    { bg: "#fee2e2", color: "#dc2626", label: "Litige" },
  CLOTURE:   { bg: "#f3f4f6", color: "#6b7280", label: "Clôturé" },
};

function fmt(n?: number | null) {
  if (!n) return "—";
  return new Intl.NumberFormat("fr-MA").format(n) + " MAD";
}

function Stars({ n }: { n?: number | null }) {
  return (
    <span style={{ display: "inline-flex", gap: 1 }}>
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={10} fill={i <= (n ?? 0) ? "#f59e0b" : "none"} stroke={i <= (n ?? 0) ? "#f59e0b" : "#d1d5db"} />
      ))}
    </span>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ConstructionClient({
  prestataires, stats, userRole,
}: {
  prestataires: Prestataire[];
  stats: Stats;
  userRole: string;
}) {
  const { isRtl } = useLang();
  const ar = isRtl;
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<string>("foncier");

  const filtered = useMemo(() => {
    const cat = CATEGORIES.find(c => c.id === activeCategory);
    if (!cat) return prestataires;
    return prestataires.filter(p => (cat.metiers as readonly string[]).includes(p.metier));
  }, [prestataires, activeCategory]);

  const pctPaye = stats.total > 0 ? Math.round((stats.paye / stats.total) * 100) : 0;

  const today = new Date();
  const in30 = new Date(); in30.setDate(in30.getDate() + 30);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 1100, margin: "0 auto" }}>

      {/* ── KPI Banner ─────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
        {[
          { icon: Banknote,      color: "#1d4ed8", bg: "#dbeafe", v: fmt(stats.total),  l: ar ? "إجمالي الأشغال" : "Total marchés" },
          { icon: CheckCircle,   color: "#15803d", bg: "#dcfce7", v: fmt(stats.paye),   l: ar ? "المبلغ المدفوع" : "Payé" },
          { icon: AlertTriangle, color: "#d97706", bg: "#fef3c7", v: fmt(stats.reste),  l: ar ? "الرصيد المتبقي" : "Reste à payer" },
          { icon: Clock,         color: "#7c3aed", bg: "#f5f3ff", v: stats.actifs,      l: ar ? "أشغال جارية" : "En cours" },
          { icon: Shield,        color: "#b45309", bg: "#fef9c3", v: stats.garantie,    l: ar ? "تحت الضمان" : "Sous garantie" },
          { icon: TrendingUp,    color: "#dc2626", bg: "#fee2e2", v: stats.garantiesProches, l: ar ? "ضمانات تنتهي" : "Garanties <60j" },
        ].map(({ icon: Icon, color, bg, v, l }) => (
          <div key={l} style={{ background: "white", borderRadius: 12, border: "1px solid #e5e7eb", padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon size={18} color={color} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>{v}</div>
              <div style={{ fontSize: 11, color: "#6b7280" }}>{l}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Barre avancement global ────────────────────────────────── */}
      {stats.total > 0 && (
        <div style={{ background: "white", borderRadius: 12, border: "1px solid #e5e7eb", padding: "14px 18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
              {ar ? "تقدم الدفعات" : "Avancement des paiements"}
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#15803d" }}>{pctPaye}%</span>
          </div>
          <div style={{ height: 10, background: "#f3f4f6", borderRadius: 10, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${pctPaye}%`, background: "linear-gradient(90deg, #15803d, #22c55e)", borderRadius: 10, transition: "width 0.5s ease" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11, color: "#9ca3af" }}>
            <span>{ar ? "مدفوع:" : "Payé:"} {fmt(stats.paye)}</span>
            <span>{ar ? "إجمالي:" : "Total:"} {fmt(stats.total)}</span>
          </div>
        </div>
      )}

      {/* ── Corps principal : catégories + liste ──────────────────── */}
      <div style={{ display: "flex", gap: 14, flex: 1, minHeight: 400 }}>

        {/* LEFT: catégories */}
        <div style={{ width: 220, flexShrink: 0, background: "white", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden", alignSelf: "flex-start" }}>
          <div style={{ padding: "10px 14px", borderBottom: "1px solid #f3f4f6" }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "flex", alignItems: "center", gap: 5 }}>
              <HardHat size={13} />{ar ? "مراحل البناء" : "Phases chantier"}
            </p>
          </div>
          {CATEGORIES.map(cat => {
            const cnt = prestataires.filter(p => (cat.metiers as readonly string[]).includes(p.metier)).length;
            const active = activeCategory === cat.id;
            return (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 12px", background: active ? cat.bg : "transparent", borderLeft: active && !ar ? `3px solid ${cat.color}` : "3px solid transparent", borderRight: active && ar ? `3px solid ${cat.color}` : "3px solid transparent", borderTop: "none", borderBottom: "1px solid #f3f4f6", cursor: "pointer", gap: 8 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
                  <cat.icon size={14} color={active ? cat.color : "#6b7280"} style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: active ? cat.color : "#374151", fontWeight: active ? 700 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {ar ? cat.ar : cat.fr}
                  </span>
                </span>
                {cnt > 0 && <span style={{ background: active ? cat.color : "#e5e7eb", color: active ? "white" : "#6b7280", fontSize: 10, fontWeight: 700, borderRadius: 20, padding: "1px 6px", flexShrink: 0 }}>{cnt}</span>}
              </button>
            );
          })}
        </div>

        {/* RIGHT: liste prestataires de la catégorie */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {filtered.length === 0 ? (
            <div style={{ background: "white", borderRadius: 12, border: "1px dashed #d1d5db", padding: 40, textAlign: "center", color: "#9ca3af" }}>
              <HardHat size={32} style={{ margin: "0 auto 10px", opacity: 0.3 }} />
              <p style={{ fontSize: 14 }}>{ar ? "لا يوجد مقاول في هذه المرحلة بعد" : "Aucun prestataire dans cette phase"}</p>
              <button onClick={() => router.push("/dashboard/prestataires")}
                style={{ marginTop: 12, background: "#15803d", color: "white", border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 13, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 5 }}>
                <ExternalLink size={13} />{ar ? "إضافة مقاول" : "Ajouter un prestataire"}
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {filtered.map(p => {
                const st = STATUT_COLORS[p.statut] ?? STATUT_COLORS.EN_COURS;
                const pct = (p.montantMarche ?? 0) > 0
                  ? Math.round(((p.montantPaye ?? 0) / (p.montantMarche ?? 1)) * 100)
                  : null;
                const garantieExp = p.garantieExpiration ? new Date(p.garantieExpiration) : null;
                const garantieAlert = garantieExp && garantieExp <= in30 && garantieExp > today;
                return (
                  <div key={p.id} style={{ background: "white", borderRadius: 12, border: "1px solid #e5e7eb", padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: 0 }}>{p.nomSociete}</h3>
                          <span style={{ background: st.bg, color: st.color, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>{st.label}</span>
                          {garantieAlert && <span style={{ background: "#fee2e2", color: "#dc2626", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, display: "flex", alignItems: "center", gap: 3 }}><AlertTriangle size={9} />Garantie expire</span>}
                        </div>
                        {p.responsable && <p style={{ fontSize: 12, color: "#6b7280", margin: "2px 0 0" }}>{p.responsable}</p>}
                        {p.noteSatisfaction != null && <div style={{ marginTop: 4 }}><Stars n={p.noteSatisfaction} /></div>}
                      </div>
                      <div style={{ textAlign: ar ? "left" : "right", flexShrink: 0 }}>
                        {p.montantMarche ? (
                          <>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{fmt(p.montantMarche)}</div>
                            <div style={{ fontSize: 11, color: "#6b7280" }}>{ar ? "مدفوع:" : "Payé:"} {fmt(p.montantPaye)}</div>
                          </>
                        ) : null}
                      </div>
                    </div>

                    {/* Progress bar */}
                    {pct !== null && (
                      <div style={{ marginTop: 8 }}>
                        <div style={{ height: 6, background: "#f3f4f6", borderRadius: 6, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: pct >= 100 ? "#15803d" : "#3b82f6", borderRadius: 6, transition: "width 0.4s" }} />
                        </div>
                        <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>{pct}% {ar ? "مدفوع" : "payé"}</div>
                      </div>
                    )}

                    {/* Documents */}
                    {p.documents.length > 0 && (
                      <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {p.documents.slice(0, 3).map(d => (
                          <a key={d.id} href={d.url} target="_blank" rel="noreferrer"
                            style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#f3f4f6", borderRadius: 6, padding: "3px 8px", fontSize: 11, color: "#374151", textDecoration: "none" }}>
                            <FileText size={10} />{d.title}
                          </a>
                        ))}
                        {p.documents.length > 3 && <span style={{ fontSize: 11, color: "#9ca3af", padding: "3px 8px" }}>+{p.documents.length - 3}</span>}
                      </div>
                    )}

                    <button onClick={() => router.push("/dashboard/prestataires")}
                      style={{ marginTop: 8, background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "#6b7280", display: "inline-flex", alignItems: "center", gap: 3, padding: 0 }}>
                      {ar ? "فتح الملف" : "Ouvrir la fiche"}<ChevronRight size={11} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
