"use client";
import { useState, useRef, useTransition, DragEvent } from "react";
import { useRouter } from "next/navigation";
import { Upload, X, Loader, CheckCircle, AlertCircle, FileText, Image as Img, Sparkles } from "lucide-react";
import { addPrestataireDocument, deletePrestataireDocument } from "@/actions/prestataires";

// ─── Types de documents ───────────────────────────────────────────────────────

export const DOC_CATS = [
  { key: "contrat",         fr: "Contrat",               ar: "عقد",                emoji: "📄", color: "#1d4ed8", bg: "#eff6ff" },
  { key: "facture",         fr: "Facture",               ar: "فاتورة",             emoji: "🧾", color: "#15803d", bg: "#f0fdf4" },
  { key: "devis",           fr: "Devis",                 ar: "عرض أسعار",          emoji: "📋", color: "#7c3aed", bg: "#fdf4ff" },
  { key: "bon_livraison",   fr: "Bon de livraison",      ar: "وصل تسليم",          emoji: "📦", color: "#ea580c", bg: "#fff7ed" },
  { key: "photo_avant",     fr: "Photo avant travaux",   ar: "صورة قبل الأشغال",   emoji: "📷", color: "#0284c7", bg: "#e0f2fe" },
  { key: "photo_apres",     fr: "Photo après travaux",   ar: "صورة بعد الأشغال",   emoji: "📸", color: "#059669", bg: "#ecfdf5" },
  { key: "photo_produit",   fr: "Photo produit",         ar: "صورة المنتج",        emoji: "🖼️", color: "#9333ea", bg: "#fdf4ff" },
  { key: "photo_chantier",  fr: "Photo chantier",        ar: "صورة الورشة",        emoji: "🏗️", color: "#92400e", bg: "#fef3c7" },
  { key: "plan",            fr: "Plan / Dessin",         ar: "مخطط / رسم",         emoji: "📐", color: "#0e7490", bg: "#ecfeff" },
  { key: "attestation",     fr: "Attestation / Agrément",ar: "شهادة / اعتماد",     emoji: "🏅", color: "#ca8a04", bg: "#fefce8" },
  { key: "rapport",         fr: "Rapport / Note",        ar: "تقرير / ملاحظة",     emoji: "📊", color: "#64748b", bg: "#f8fafc" },
  { key: "PV",              fr: "PV / Procès-verbal",    ar: "محضر",               emoji: "📝", color: "#6d28d9", bg: "#f5f3ff" },
  { key: "acte",            fr: "Acte notarié",          ar: "عقد توثيقي",         emoji: "⚖️", color: "#1e293b", bg: "#f8fafc" },
  { key: "permis",          fr: "Permis / Autorisation", ar: "رخصة / إذن",         emoji: "🏛️", color: "#166534", bg: "#f0fdf4" },
  { key: "autre",           fr: "Autre",                 ar: "أخرى",               emoji: "📁", color: "#6b7280", bg: "#f9fafb" },
] as const;

export type DocCatKey = typeof DOC_CATS[number]["key"];

export interface PDoc {
  id: string; title: string; url: string; type: string; createdAt: string;
}

function isImage(url: string) {
  return /\.(jpg|jpeg|png|gif|webp|svg|avif)(\?|$)/i.test(url) || url.includes("/image/upload/");
}

function isPdf(url: string) {
  return /\.pdf(\?|$)/i.test(url);
}

function docCat(type: string) {
  return DOC_CATS.find(c => c.key === type) ?? DOC_CATS[DOC_CATS.length - 1];
}

// ─── Composant galerie documents (lecture seule + suppression) ────────────────

export function DocGallery({
  documents, prestataireId, canEdit, ar,
}: {
  documents: PDoc[]; prestataireId: string; canEdit: boolean; ar: boolean;
}) {
  const router = useRouter();
  const [, startT] = useTransition();
  const [deleting, setDeleting] = useState<string | null>(null);

  if (documents.length === 0) return null;

  // Grouper par type
  const groups: Record<string, PDoc[]> = {};
  for (const d of documents) {
    (groups[d.type] ??= []).push(d);
  }

  async function handleDelete(doc: PDoc) {
    if (!confirm(ar ? `حذف "${doc.title}" ؟` : `Supprimer "${doc.title}" ?`)) return;
    setDeleting(doc.id);
    try {
      // Supprimer de Cloudinary si applicable
      if (doc.url.includes("cloudinary.com")) {
        await fetch("/api/upload/delete", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: doc.url }),
        });
      }
      await new Promise<void>((res, rej) =>
        startT(async () => { try { await deletePrestataireDocument(doc.id); res(); } catch(e) { rej(e); } })
      );
      router.refresh();
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {Object.entries(groups).map(([type, docs]) => {
        const cat = docCat(type);
        const photos = docs.filter(d => isImage(d.url));
        const files  = docs.filter(d => !isImage(d.url));
        return (
          <div key={type}>
            <p style={{ fontSize: 11, fontWeight: 700, color: cat.color, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
              <span>{cat.emoji}</span>{ar ? cat.ar : cat.fr} ({docs.length})
            </p>
            {/* Photos en grille */}
            {photos.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: files.length > 0 ? 8 : 0 }}>
                {photos.map(doc => (
                  <div key={doc.id} style={{ position: "relative", width: 90, height: 90, borderRadius: 8, overflow: "hidden", border: "2px solid #e5e7eb", flexShrink: 0 }}>
                    <a href={doc.url} target="_blank" rel="noopener noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={doc.url} alt={doc.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </a>
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(0,0,0,0.6)", padding: "2px 4px" }}>
                      <p style={{ color: "white", fontSize: 9, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.title}</p>
                    </div>
                    {canEdit && (
                      <button
                        onClick={() => handleDelete(doc)}
                        disabled={deleting === doc.id}
                        style={{ position: "absolute", top: 2, right: 2, background: "#dc2626", color: "white", border: "none", borderRadius: "50%", width: 18, height: 18, cursor: "pointer", fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
                        {deleting === doc.id ? "…" : "×"}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
            {/* Fichiers en liste */}
            {files.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {files.map(doc => (
                  <div key={doc.id} style={{ display: "flex", alignItems: "center", gap: 8, background: cat.bg, borderRadius: 7, padding: "6px 10px", border: `1px solid ${cat.color}20` }}>
                    <span style={{ fontSize: 14 }}>{isPdf(doc.url) ? "📄" : cat.emoji}</span>
                    <a href={doc.url} target="_blank" rel="noopener noreferrer" style={{ flex: 1, fontSize: 12, color: cat.color, textDecoration: "none", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {doc.title}
                    </a>
                    <span style={{ fontSize: 10, color: "#9ca3af" }}>{new Date(doc.createdAt).toLocaleDateString("fr-FR")}</span>
                    {canEdit && (
                      <button onClick={() => handleDelete(doc)} disabled={deleting === doc.id} style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626", padding: "0 2px", fontSize: 13 }}>
                        {deleting === doc.id ? "…" : "✕"}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Zone d'upload ────────────────────────────────────────────────────────────

export function UploadZone({
  prestataireId, ar, onDone,
}: {
  prestataireId: string; ar: boolean; onDone?: () => void;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [done, setDone] = useState<string>("");
  const [docType, setDocType] = useState<DocCatKey>("autre");
  const [docTitle, setDocTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiInfo, setAiInfo] = useState<{ parties?: string; notes?: string; amount?: number | null; date?: string | null; confidence?: string } | null>(null);

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) pickFile(file);
  }

  function pickFile(file: File) {
    setSelectedFile(file);
    setAiInfo(null);
    if (!docTitle) setDocTitle(file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "));
    setError("");
    setDone("");
    // Auto-detect type from file
    const name = file.name.toLowerCase();
    const mime = file.type.toLowerCase();
    if (mime.startsWith("image/")) {
      // keep current type if already photo
      if (!docType.startsWith("photo")) setDocType("photo_chantier");
    } else if (name.includes("facture") || name.includes("invoice")) setDocType("facture");
    else if (name.includes("contrat") || name.includes("contract")) setDocType("contrat");
    else if (name.includes("devis") || name.includes("quote")) setDocType("devis");
    else if (name.includes("plan")) setDocType("plan");
    else if (name.includes("rapport")) setDocType("rapport");
    else if (name.includes("livraison") || name.includes("bl")) setDocType("bon_livraison");
  }

  async function analyzeWithAI() {
    if (!selectedFile) return;
    setAnalyzing(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", selectedFile);
      fd.append("context", `Prestataire ${prestataireId}`);
      const res = await fetch("/api/documents/analyze", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Analyse échouée");
      const data = await res.json();
      if (data.title) setDocTitle(data.title);
      if (data.type && DOC_CATS.some(c => c.key === data.type)) setDocType(data.type as DocCatKey);
      setAiInfo({
        parties: data.parties ?? undefined,
        notes: data.notes ?? undefined,
        amount: data.amount,
        date: data.date,
        confidence: data.confidence ?? "low",
      });
    } catch {
      setError(ar ? "فشل التحليل الذكي" : "Échec de l'analyse IA");
    } finally {
      setAnalyzing(false);
    }
  }

  async function doUpload() {
    if (!selectedFile || !docTitle.trim()) return;
    setUploading(true);
    setError("");
    setProgress(ar ? "جارٍ الرفع…" : "Upload en cours…");
    try {
      const fd = new FormData();
      fd.append("file", selectedFile);
      fd.append("entityType", "prestataire");
      fd.append("entityId", prestataireId);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) { const j = await res.json(); throw new Error(j.error ?? "Erreur upload"); }
      const { url } = await res.json();
      await addPrestataireDocument(prestataireId, { title: docTitle.trim(), url, type: docType });
      setDone(ar ? "تم الرفع بنجاح ✓" : "Fichier ajouté ✓");
      setSelectedFile(null);
      setDocTitle("");
      setProgress("");
      router.refresh();
      onDone?.();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur upload");
      setProgress("");
    } finally {
      setUploading(false);
    }
  }

  const inp: React.CSSProperties = { width: "100%", border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" };
  const sel: React.CSSProperties = { ...inp, background: "white", cursor: "pointer" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !selectedFile && fileRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? "#16a34a" : selectedFile ? "#1d4ed8" : "#d1d5db"}`,
          borderRadius: 10, padding: "18px 16px", textAlign: "center",
          background: dragging ? "#f0fdf4" : selectedFile ? "#eff6ff" : "#fafafa",
          cursor: selectedFile ? "default" : "pointer", transition: "all 0.2s",
        }}>
        {selectedFile ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center" }}>
            {selectedFile.type.startsWith("image/") ? <Img size={20} color="#1d4ed8" /> : <FileText size={20} color="#1d4ed8" />}
            <span style={{ fontSize: 13, color: "#1d4ed8", fontWeight: 500 }}>{selectedFile.name}</span>
            <span style={{ fontSize: 11, color: "#9ca3af" }}>({(selectedFile.size / 1024).toFixed(0)} Ko)</span>
            <button onClick={e => { e.stopPropagation(); setSelectedFile(null); setDocTitle(""); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280" }}><X size={15} /></button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
            <Upload size={24} color="#9ca3af" />
            <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>{ar ? "اسحب ملفًا هنا أو انقر للاختيار" : "Glisser un fichier ici ou cliquer"}</p>
            <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>{ar ? "صور، PDF، Word، Excel — حد أقصى 50 ميغا" : "Images, PDF, Word, Excel — max 50 Mo"}</p>
          </div>
        )}
      </div>
      <input ref={fileRef} type="file" style={{ display: "none" }} accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.dwg,.dxf" onChange={e => { const f = e.target.files?.[0]; if (f) pickFile(f); e.target.value = ""; }} />

      {/* Bouton analyse IA */}
      {selectedFile && !aiInfo && (
        <button
          onClick={analyzeWithAI}
          disabled={analyzing}
          style={{
            display: "flex", alignItems: "center", gap: 7, alignSelf: "flex-start",
            background: analyzing ? "#f3f4f6" : "linear-gradient(135deg,#7c3aed,#5b21b6)",
            color: analyzing ? "#9ca3af" : "white",
            border: "none", borderRadius: 8, padding: "7px 14px",
            fontSize: 12, fontWeight: 600, cursor: analyzing ? "not-allowed" : "pointer",
            transition: "opacity 0.2s",
          }}>
          {analyzing
            ? <Loader size={13} style={{ animation: "spin 1s linear infinite" }} />
            : <Sparkles size={13} />}
          {analyzing
            ? (ar ? "جارٍ التحليل…" : "Analyse en cours…")
            : (ar ? "✨ تحليل بالذكاء الاصطناعي" : "✨ Analyser avec Claude")}
        </button>
      )}

      {/* Suggestions IA */}
      {aiInfo && (
        <div style={{ background: "#fdf4ff", border: "1px solid #e9d5ff", borderRadius: 10, padding: "10px 12px", fontSize: 12 }}>
          <p style={{ margin: "0 0 6px", fontWeight: 700, color: "#7c3aed", display: "flex", alignItems: "center", gap: 5 }}>
            <Sparkles size={12} />
            {ar ? "اقتراحات الذكاء الاصطناعي" : "Suggestions Claude"}
            <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 500, color: aiInfo.confidence === "high" ? "#16a34a" : aiInfo.confidence === "medium" ? "#d97706" : "#9ca3af" }}>
              {aiInfo.confidence === "high" ? "✓ Haute confiance" : aiInfo.confidence === "medium" ? "~ Confiance moyenne" : "? Basse confiance"}
            </span>
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 3, color: "#4b5563" }}>
            {aiInfo.parties && <span>👥 {aiInfo.parties}</span>}
            {aiInfo.amount  && <span>💰 {aiInfo.amount.toLocaleString("fr-MA")} MAD</span>}
            {aiInfo.date    && <span>📅 {new Date(aiInfo.date).toLocaleDateString("fr-MA", { day: "2-digit", month: "long", year: "numeric" })}</span>}
            {aiInfo.notes   && <span>📝 {aiInfo.notes}</span>}
          </div>
          <button
            onClick={() => setAiInfo(null)}
            style={{ marginTop: 6, fontSize: 10, color: "#9ca3af", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            {ar ? "إعادة التحليل" : "Relancer l'analyse"}
          </button>
        </div>
      )}

      {/* Titre + type */}
      {selectedFile && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 500, color: "#374151", marginBottom: 3 }}>{ar ? "عنوان الملف" : "Titre du document"}</p>
            <input value={docTitle} onChange={e => setDocTitle(e.target.value)} style={inp} placeholder={ar ? "عنوان..." : "Titre…"} />
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 500, color: "#374151", marginBottom: 3 }}>{ar ? "نوع الوثيقة" : "Type de document"}</p>
            <select value={docType} onChange={e => setDocType(e.target.value as DocCatKey)} style={sel}>
              {DOC_CATS.map(c => <option key={c.key} value={c.key}>{c.emoji} {ar ? c.ar : c.fr}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* Bouton upload + états */}
      {selectedFile && (
        <button onClick={doUpload} disabled={uploading || !docTitle.trim()}
          style={{ background: "#1d4ed8", color: "white", border: "none", borderRadius: 8, padding: "9px 20px", cursor: uploading ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 600, opacity: uploading ? 0.7 : 1, display: "flex", alignItems: "center", gap: 8, alignSelf: "flex-start" }}>
          {uploading ? <Loader size={15} style={{ animation: "spin 1s linear infinite" }} /> : <Upload size={15} />}
          {uploading ? (ar ? "جارٍ الرفع..." : "Upload en cours…") : (ar ? "رفع الملف" : "Uploader le fichier")}
        </button>
      )}

      {progress && <p style={{ fontSize: 12, color: "#6b7280", margin: 0, display: "flex", alignItems: "center", gap: 5 }}><Loader size={12} />{progress}</p>}
      {done    && <p style={{ fontSize: 12, color: "#15803d", margin: 0, display: "flex", alignItems: "center", gap: 5 }}><CheckCircle size={12} />{done}</p>}
      {error   && <p style={{ fontSize: 12, color: "#dc2626", margin: 0, display: "flex", alignItems: "center", gap: 5 }}><AlertCircle size={12} />{error}</p>}
    </div>
  );
}
