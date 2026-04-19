"use client";
import { useState, useRef, useTransition, DragEvent } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/contexts/LangContext";
import { smartIntakeConfirm } from "@/actions/smart-intake";
import {
  ScanLine, Upload, Loader2, CheckCircle, AlertCircle,
  Zap, Clock, X, RefreshCw, Sparkles,
} from "lucide-react";

interface SuggestedAction {
  id: string;
  type: string;
  label: string;
  priority: number;
  data: Record<string, unknown>;
}

interface AnalysisResult {
  docType: string;
  confidence: number;
  title: string;
  linkedUnit: string | null;
  linkedMeter: string | null;
  data: Record<string, unknown>;
  suggestedActions: SuggestedAction[];
  tooLarge?: boolean;
  error?: string;
}

interface HistoryItem {
  id: string;
  fileName: string;
  fileUrl: string | null;
  docType: string;
  confidence: number;
  actionsExecuted: string[];
  createdAt: string;
}

const DOC_TYPE_META: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  electricity_bill:      { label: "Facture électricité",    icon: "⚡", color: "#d97706", bg: "#fffbeb" },
  water_bill:            { label: "Facture eau",            icon: "💧", color: "#0284c7", bg: "#e0f2fe" },
  internet_bill:         { label: "Facture internet/tel",   icon: "📶", color: "#7c3aed", bg: "#fdf4ff" },
  meter_reading:         { label: "Relevé compteur",        icon: "📊", color: "#059669", bg: "#ecfdf5" },
  contractor_quote:      { label: "Devis prestataire",      icon: "📋", color: "#7c3aed", bg: "#fdf4ff" },
  contractor_invoice:    { label: "Facture prestataire",    icon: "🧾", color: "#15803d", bg: "#f0fdf4" },
  rental_contract:       { label: "Contrat location",       icon: "📄", color: "#1d4ed8", bg: "#eff6ff" },
  sale_contract:         { label: "Contrat vente",          icon: "📄", color: "#1d4ed8", bg: "#eff6ff" },
  work_contract:         { label: "Contrat travaux",        icon: "📄", color: "#1d4ed8", bg: "#eff6ff" },
  notarial_act:          { label: "Acte notarié",           icon: "⚖️", color: "#1e293b", bg: "#f8fafc" },
  building_permit:       { label: "Permis construire",      icon: "🏛️", color: "#166534", bg: "#f0fdf4" },
  construction_permit:   { label: "Autorisation construction", icon: "🏗️", color: "#92400e", bg: "#fef3c7" },
  architectural_plan:    { label: "Plan architectural",     icon: "📐", color: "#0e7490", bg: "#ecfeff" },
  cin:                   { label: "CIN",                    icon: "🪪", color: "#374151", bg: "#f9fafb" },
  passport:              { label: "Passeport",              icon: "🛂", color: "#374151", bg: "#f9fafb" },
  land_title:            { label: "Titre foncier",          icon: "🗂️", color: "#78350f", bg: "#fef3c7" },
  delivery_note:         { label: "Bon de livraison",       icon: "📦", color: "#ea580c", bg: "#fff7ed" },
  payment_receipt:       { label: "Reçu paiement",          icon: "💵", color: "#15803d", bg: "#f0fdf4" },
  control_report:        { label: "Rapport bureau contrôle",icon: "📑", color: "#6d28d9", bg: "#f5f3ff" },
  reception_pv:          { label: "PV réception travaux",   icon: "📝", color: "#6d28d9", bg: "#f5f3ff" },
  warranty_certificate:  { label: "Attestation garantie",   icon: "🏅", color: "#ca8a04", bg: "#fefce8" },
  admin_document:        { label: "Document administratif", icon: "🗃️", color: "#64748b", bg: "#f8fafc" },
  site_photo:            { label: "Photo chantier",         icon: "🏗️", color: "#92400e", bg: "#fef3c7" },
  meter_photo:           { label: "Photo compteur",         icon: "📷", color: "#0284c7", bg: "#e0f2fe" },
  apartment_photo:       { label: "Photo appartement",      icon: "🏠", color: "#15803d", bg: "#f0fdf4" },
  other:                 { label: "Autre document",         icon: "📁", color: "#6b7280", bg: "#f9fafb" },
};

function getMeta(docType: string) {
  return DOC_TYPE_META[docType] ?? DOC_TYPE_META.other;
}

function DataRow({ label, value }: { label: string; value: unknown }) {
  if (value === null || value === undefined || value === "") return null;
  let display = String(value);
  if (typeof value === "number" && (label.toLowerCase().includes("montant") || label.toLowerCase().includes("amount"))) {
    display = `${value.toLocaleString("fr-MA")} MAD`;
  }
  return (
    <div style={{ display: "flex", gap: 8, fontSize: 12, padding: "4px 0", borderBottom: "1px solid #f3f4f6" }}>
      <span style={{ color: "#9ca3af", minWidth: 130, flexShrink: 0 }}>{label}</span>
      <span style={{ color: "#111827", fontWeight: 500, wordBreak: "break-word" }}>{display}</span>
    </div>
  );
}

const DATA_LABELS: Record<string, Record<string, string>> = {
  electricity_bill: {
    clientName: "Client", clientNumber: "N° client", contractNumber: "N° contrat",
    meterNumber: "N° compteur", periodStart: "Début période", periodEnd: "Fin période",
    previousIndex: "Index ancien", currentIndex: "Index nouveau", consumption: "Consommation (kWh)",
    amountHT: "Montant HT", tva: "TVA", amountTTC: "Montant TTC", dueDate: "Date limite paiement",
  },
  water_bill: {
    clientName: "Client", meterNumber: "N° compteur", consumption: "Consommation (m³)",
    amountTTC: "Montant TTC", periodStart: "Début période", periodEnd: "Fin période", dueDate: "Date limite",
  },
  meter_reading: {
    meterNumber: "N° compteur", index: "Index relevé", date: "Date relevé", serviceType: "Type",
  },
  contractor_quote: {
    company: "Société", workType: "Type travaux", amountHT: "Montant HT", tva: "TVA",
    amountTTC: "Montant TTC", date: "Date", reference: "Référence",
  },
  contractor_invoice: {
    company: "Société", workType: "Type travaux", amountHT: "Montant HT", tva: "TVA",
    amountTTC: "Montant TTC", date: "Date", reference: "Référence",
  },
  cin: {
    lastName: "Nom", firstName: "Prénom", idNumber: "N° CIN",
    birthDate: "Date naissance", expiryDate: "Expiration", nationality: "Nationalité",
  },
  passport: {
    lastName: "Nom", firstName: "Prénom", idNumber: "N° Passeport",
    birthDate: "Date naissance", expiryDate: "Expiration", nationality: "Nationalité",
  },
  rental_contract: {
    parties: "Parties", object: "Objet", amount: "Montant", signDate: "Date signature",
    startDate: "Date début", endDate: "Date fin",
  },
};

export function ScanClient({ history }: { history: HistoryItem[] }) {
  const { isRtl } = useLang();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [, startT] = useTransition();

  type State = "idle" | "analyzing" | "result" | "uploading" | "confirming" | "done";
  const [state, setState] = useState<State>("idle");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [selectedActionIds, setSelectedActionIds] = useState<Set<string>>(new Set());
  const [doneActions, setDoneActions] = useState<string[]>([]);
  const [error, setError] = useState("");

  function reset() {
    setState("idle");
    setSelectedFile(null);
    setAnalysis(null);
    setSelectedActionIds(new Set());
    setDoneActions([]);
    setError("");
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) startAnalysis(file);
  }

  async function startAnalysis(file: File) {
    setSelectedFile(file);
    setState("analyzing");
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/scan/analyze", { method: "POST", body: fd });
      if (!res.ok) throw new Error(await res.text());
      const result: AnalysisResult = await res.json();
      if (result.error) throw new Error(result.error as string);
      setAnalysis(result);
      // Pre-select all priority 1 and 2 actions
      setSelectedActionIds(new Set(
        (result.suggestedActions ?? [])
          .filter(a => a.priority <= 2)
          .map(a => a.id)
      ));
      setState("result");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur analyse");
      setState("idle");
    }
  }

  async function confirm() {
    if (!selectedFile || !analysis) return;
    setState("uploading");
    try {
      // Upload to Cloudinary
      const fd = new FormData();
      fd.append("file", selectedFile);
      fd.append("entityType", "scan");
      fd.append("entityId", "scan-" + Date.now());
      const upRes = await fetch("/api/upload", { method: "POST", body: fd });
      if (!upRes.ok) throw new Error("Échec upload");
      const { url } = await upRes.json();

      setState("confirming");
      const selected = (analysis.suggestedActions ?? []).filter(a => selectedActionIds.has(a.id));

      const result = await new Promise<{ done: string[]; errors: string[] }>((resolve, reject) => {
        startT(async () => {
          try {
            const r = await smartIntakeConfirm({
              fileUrl: url,
              fileName: selectedFile.name,
              docType: analysis.docType,
              confidence: analysis.confidence,
              linkedUnit: analysis.linkedUnit,
              linkedMeter: analysis.linkedMeter,
              data: analysis.data,
              selectedActions: selected,
            });
            resolve(r);
          } catch (e) { reject(e); }
        });
      });

      setDoneActions(result.done);
      setState("done");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
      setState("result");
    }
  }

  const meta = analysis ? getMeta(analysis.docType) : null;
  const labels = analysis ? (DATA_LABELS[analysis.docType] ?? {}) : {};
  const dataEntries = analysis
    ? Object.entries(analysis.data ?? {}).filter(([, v]) => v !== null && v !== undefined && v !== "")
    : [];

  return (
    <div dir={isRtl ? "rtl" : "ltr"} style={{ maxWidth: 860, margin: "0 auto", padding: "0 16px 40px" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <div style={{ width: 36, height: 36, background: "linear-gradient(135deg,#7c3aed,#5b21b6)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ScanLine size={18} color="white" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#111827" }}>
              Scan intelligent
            </h1>
            <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>
              Orchid lit et classe vos documents automatiquement
            </p>
          </div>
          {state !== "idle" && (
            <button onClick={reset} style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#6b7280", background: "none", border: "1px solid #e5e7eb", borderRadius: 8, padding: "5px 10px", cursor: "pointer" }}>
              <RefreshCw size={12} /> Nouveau scan
            </button>
          )}
        </div>
      </div>

      {/* IDLE: Drop zone */}
      {state === "idle" && (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? "#7c3aed" : "#d1d5db"}`,
            borderRadius: 16, padding: "48px 24px", textAlign: "center",
            background: dragging ? "#fdf4ff" : "#fafafa",
            cursor: "pointer", transition: "all 0.2s",
          }}>
          <div style={{ width: 64, height: 64, background: "linear-gradient(135deg,#ede9fe,#ddd6fe)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <ScanLine size={28} color="#7c3aed" />
          </div>
          <p style={{ fontSize: 16, fontWeight: 600, color: "#111827", margin: "0 0 6px" }}>
            Déposez un document à analyser
          </p>
          <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 20px" }}>
            Facture, contrat, CIN, relevé compteur, devis, permis…
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", marginBottom: 20 }}>
            {["⚡ Facture élec", "💧 Facture eau", "📋 Devis", "📄 Contrat", "🪪 CIN", "📊 Relevé"].map(t => (
              <span key={t} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 20, background: "#f3f4f6", color: "#374151", border: "1px solid #e5e7eb" }}>{t}</span>
            ))}
          </div>
          <button style={{ background: "linear-gradient(135deg,#7c3aed,#5b21b6)", color: "white", border: "none", borderRadius: 10, padding: "10px 24px", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8 }}>
            <Upload size={15} /> Choisir un fichier
          </button>
          <p style={{ fontSize: 11, color: "#9ca3af", margin: "12px 0 0" }}>
            Images, PDF — max 4 Mo pour analyse IA
          </p>
        </div>
      )}
      <input ref={fileRef} type="file" accept="image/*,.pdf" style={{ display: "none" }}
        onChange={e => { const f = e.target.files?.[0]; if (f) startAnalysis(f); e.target.value = ""; }} />

      {/* ANALYZING */}
      {state === "analyzing" && (
        <div style={{ textAlign: "center", padding: "64px 24px", background: "#fafafa", borderRadius: 16, border: "1px solid #e5e7eb" }}>
          <div style={{ position: "relative", width: 80, height: 80, margin: "0 auto 20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "3px solid #ede9fe" }} />
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "3px solid transparent", borderTopColor: "#7c3aed", animation: "spin 1s linear infinite" }} />
            <span style={{ fontSize: 32 }}>🌸</span>
          </div>
          <p style={{ fontSize: 16, fontWeight: 600, color: "#111827", margin: "0 0 6px" }}>Orchid analyse votre document…</p>
          <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>{selectedFile?.name}</p>
          <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 8 }}>
            Détection du type · Extraction des données · Proposition d&apos;actions
          </p>
          <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {/* RESULT */}
      {(state === "result" || state === "uploading" || state === "confirming") && analysis && meta && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Detection banner */}
          <div style={{ background: meta.bg, border: `1.5px solid ${meta.color}30`, borderRadius: 14, padding: "16px 20px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
              <span style={{ fontSize: 36, lineHeight: 1 }}>{meta.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: meta.color }}>{meta.label}</span>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20,
                    background: analysis.confidence >= 80 ? "#dcfce7" : analysis.confidence >= 50 ? "#fef9c3" : "#fee2e2",
                    color: analysis.confidence >= 80 ? "#15803d" : analysis.confidence >= 50 ? "#854d0e" : "#dc2626",
                  }}>
                    {analysis.confidence}% confiance
                  </span>
                  {analysis.linkedUnit && (
                    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: "#dbeafe", color: "#1d4ed8", fontWeight: 600 }}>
                      📍 {analysis.linkedUnit}
                    </span>
                  )}
                  {analysis.linkedMeter && (
                    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: "#f0fdf4", color: "#15803d", fontWeight: 600 }}>
                      🔢 {analysis.linkedMeter}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 13, color: "#374151", margin: 0, fontWeight: 500 }}>{analysis.title}</p>
                <p style={{ fontSize: 11, color: "#9ca3af", margin: "2px 0 0" }}>{selectedFile?.name}</p>
              </div>
            </div>
          </div>

          {/* Extracted data */}
          {dataEntries.length > 0 && (
            <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 14, overflow: "hidden" }}>
              <div style={{ padding: "10px 16px", background: "#f9fafb", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 6 }}>
                <Sparkles size={13} color="#7c3aed" />
                <span style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Données extraites</span>
              </div>
              <div style={{ padding: "8px 16px" }}>
                {dataEntries.map(([key, val]) => (
                  <DataRow key={key} label={labels[key] ?? key} value={val} />
                ))}
              </div>
            </div>
          )}

          {/* Proposed actions */}
          {(analysis.suggestedActions ?? []).length > 0 && (
            <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 14, overflow: "hidden" }}>
              <div style={{ padding: "10px 16px", background: "#f9fafb", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 6 }}>
                <Zap size={13} color="#d97706" />
                <span style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Actions proposées</span>
                <span style={{ marginLeft: "auto", fontSize: 11, color: "#9ca3af" }}>Décochez pour désactiver</span>
              </div>
              <div style={{ padding: "8px 0" }}>
                {analysis.suggestedActions.map(a => (
                  <label key={a.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", cursor: "pointer", borderBottom: "1px solid #f9fafb" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#fafafa")}
                    onMouseLeave={e => (e.currentTarget.style.background = "")}>
                    <input
                      type="checkbox"
                      checked={selectedActionIds.has(a.id)}
                      onChange={e => {
                        const next = new Set(selectedActionIds);
                        if (e.target.checked) next.add(a.id); else next.delete(a.id);
                        setSelectedActionIds(next);
                      }}
                      style={{ width: 16, height: 16, accentColor: "#7c3aed", cursor: "pointer" }}
                    />
                    <span style={{ flex: 1, fontSize: 13, color: "#111827" }}>{a.label}</span>
                    <span style={{
                      fontSize: 10, padding: "2px 6px", borderRadius: 20, fontWeight: 600,
                      background: a.priority === 1 ? "#fee2e2" : a.priority === 2 ? "#fef9c3" : "#f3f4f6",
                      color: a.priority === 1 ? "#dc2626" : a.priority === 2 ? "#854d0e" : "#6b7280",
                    }}>
                      {a.priority === 1 ? "Prioritaire" : a.priority === 2 ? "Recommandé" : "Optionnel"}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, fontSize: 13, color: "#dc2626" }}>
              <AlertCircle size={14} />{error}
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={confirm}
              disabled={state !== "result" || selectedActionIds.size === 0}
              style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                background: state !== "result" || selectedActionIds.size === 0 ? "#e5e7eb" : "linear-gradient(135deg,#7c3aed,#5b21b6)",
                color: state !== "result" || selectedActionIds.size === 0 ? "#9ca3af" : "white",
                border: "none", borderRadius: 12, padding: "12px 20px",
                fontSize: 14, fontWeight: 700, cursor: state !== "result" || selectedActionIds.size === 0 ? "not-allowed" : "pointer",
              }}>
              {state === "uploading" && <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> Upload en cours…</>}
              {state === "confirming" && <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> Traitement…</>}
              {state === "result" && <><CheckCircle size={15} /> Confirmer ({selectedActionIds.size} action{selectedActionIds.size > 1 ? "s" : ""})</>}
            </button>
            <button onClick={reset} style={{ padding: "12px 16px", border: "1px solid #e5e7eb", borderRadius: 12, background: "white", color: "#6b7280", cursor: "pointer", fontSize: 13 }}>
              <X size={15} />
            </button>
          </div>
        </div>
      )}

      {/* DONE */}
      {state === "done" && (
        <div style={{ background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: 16, padding: "32px 24px", textAlign: "center" }}>
          <div style={{ width: 64, height: 64, background: "#dcfce7", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 28 }}>
            ✅
          </div>
          <p style={{ fontSize: 18, fontWeight: 700, color: "#15803d", margin: "0 0 12px" }}>Traitement terminé !</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 20 }}>
            {doneActions.map((a, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center", fontSize: 13, color: "#166534" }}>
                <CheckCircle size={14} color="#16a34a" /> {a}
              </div>
            ))}
          </div>
          <button onClick={reset} style={{ background: "#15803d", color: "white", border: "none", borderRadius: 10, padding: "10px 24px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            Nouveau scan
          </button>
        </div>
      )}

      {/* HISTORY */}
      {history.length > 0 && state === "idle" && (
        <div style={{ marginTop: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
            <Clock size={14} color="#9ca3af" />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Historique scans</span>
            <span style={{ fontSize: 12, color: "#9ca3af" }}>({history.length})</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {history.slice(0, 10).map(h => {
              const m = getMeta(h.docType);
              return (
                <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "white", border: "1px solid #e5e7eb", borderRadius: 10 }}>
                  <span style={{ fontSize: 20 }}>{m.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.fileName}</p>
                    <p style={{ margin: 0, fontSize: 11, color: "#9ca3af" }}>
                      {m.label} · {new Date(h.createdAt).toLocaleDateString("fr-MA", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  {h.actionsExecuted.length > 0 && (
                    <span style={{ fontSize: 10, color: "#15803d", background: "#dcfce7", padding: "2px 8px", borderRadius: 20, fontWeight: 600, whiteSpace: "nowrap" }}>
                      {h.actionsExecuted.length} action{h.actionsExecuted.length > 1 ? "s" : ""}
                    </span>
                  )}
                  <span style={{ fontSize: 11, color: "#d1d5db" }}>
                    {h.confidence}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
