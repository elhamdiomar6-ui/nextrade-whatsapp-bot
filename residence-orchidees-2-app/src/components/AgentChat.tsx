"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLang } from "@/contexts/LangContext";
import { agentCreatePrestataire, agentGetAlertCount } from "@/actions/agentActions";
import {
  X, Send, Trash2, Bot, User, Loader2,
  Sparkles, ChevronRight, Plus, AlertTriangle,
  ExternalLink, CheckCircle, ScanLine,
} from "lucide-react";

interface AgentAction {
  type: "CREATE_PRESTATAIRE" | "NAVIGATE" | "SHOW_ALERT_SUMMARY";
  label: string;
  payload: Record<string, unknown>;
  missingFields?: string[];
}

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  action?: AgentAction | null;
  quickReplies?: string[];
  actionDone?: boolean;
}

// Contextual suggestions per page
const PAGE_SUGGESTIONS: Record<string, string[]> = {
  "/dashboard": ["Résumé du jour", "Alertes urgentes", "Rapport mensuel"],
  "/dashboard/prestataires": ["Meilleur prestataire noté", "Garanties qui expirent", "Marchés impayés"],
  "/dashboard/interventions": ["Interventions urgentes", "Clôturer terminée", "Nouvelle intervention"],
  "/dashboard/prospects": ["Relancer prospects J+7", "Pipeline du mois", "Nouveau prospect"],
  "/dashboard/invoices": ["Factures impayées", "Résumé facturation", "Anomalies compteurs"],
  "/dashboard/expenses": ["Dépenses ce mois", "Comparer mois dernier", "Répartir les frères"],
  "/dashboard/lots": ["Lots disponibles", "Meilleur lot à vendre", "Simuler revenu vente"],
  "/dashboard/units": ["Unités vacantes", "Occupants actifs", "Compteurs à relever"],
};

function getSuggestions(pathname: string): string[] {
  for (const [path, suggestions] of Object.entries(PAGE_SUGGESTIONS)) {
    if (pathname === path || pathname.startsWith(path + "/")) return suggestions;
  }
  return ["Résumé du jour", "Alertes urgentes", "Rapport mensuel"];
}

function getPageLabel(pathname: string): string {
  const labels: Record<string, string> = {
    "/dashboard": "Tableau de bord",
    "/dashboard/prestataires": "Corps de métier",
    "/dashboard/interventions": "Interventions",
    "/dashboard/prospects": "Prospects",
    "/dashboard/invoices": "Factures",
    "/dashboard/expenses": "Dépenses",
    "/dashboard/lots": "Lots",
    "/dashboard/units": "Unités",
    "/dashboard/meters": "Compteurs",
    "/dashboard/readings": "Relevés",
  };
  for (const [path, label] of Object.entries(labels)) {
    if (pathname === path || pathname.startsWith(path + "/")) return label;
  }
  return "Application";
}

const DOC_TYPE_CHAT: Record<string, { icon: string; label: string }> = {
  electricity_bill: { icon: "⚡", label: "Facture électricité" },
  water_bill: { icon: "💧", label: "Facture eau" },
  meter_reading: { icon: "📊", label: "Relevé compteur" },
  contractor_quote: { icon: "📋", label: "Devis prestataire" },
  contractor_invoice: { icon: "🧾", label: "Facture prestataire" },
  cin: { icon: "🪪", label: "CIN" },
  rental_contract: { icon: "📄", label: "Contrat location" },
  other: { icon: "📁", label: "Document" },
};

export function AgentChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [alertCount, setAlertCount] = useState(0);
  const [executingAction, setExecutingAction] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scanRef = useRef<HTMLInputElement>(null);
  const { isRtl } = useLang();
  const pathname = usePathname();
  const router = useRouter();

  // Fetch alert count on mount
  useEffect(() => {
    agentGetAlertCount().then(setAlertCount).catch(() => {});
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        inputRef.current?.focus();
      }, 100);
    }
  }, [open, messages]);

  const sendMessage = useCallback(async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;

    const userMsg: Message = { role: "user", content: msg, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
          pageContext: getPageLabel(pathname),
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply ?? data.message ?? "",
          timestamp: new Date(),
          action: data.action ?? null,
          quickReplies: data.quickReplies ?? [],
        },
      ]);
    } catch {
      setError("Erreur de communication avec Orchid.");
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, pathname]);

  async function executeAction(msgIndex: number, action: AgentAction) {
    setExecutingAction(`${msgIndex}`);
    try {
      if (action.type === "CREATE_PRESTATAIRE") {
        const p = action.payload as any;
        await agentCreatePrestataire({
          metier: p.metier,
          nomSociete: p.nomSociete,
          responsable: p.responsable,
          telephone: p.telephone,
          adresse: p.adresse,
          montantMarche: p.montantMarche,
          metierData: p.metierData,
          notes: p.notes,
        });
        setMessages((prev) => prev.map((m, i) => i === msgIndex ? { ...m, actionDone: true } : m));
        router.refresh();
        await sendMessage(`La fiche de ${p.nomSociete} a été créée. Qu'est-ce qu'il me manque encore pour compléter la fiche ?`);
      } else if (action.type === "NAVIGATE") {
        router.push((action.payload as any).href);
        setOpen(false);
      }
    } catch {
      setError("Erreur lors de l'exécution de l'action.");
    } finally {
      setExecutingAction(null);
    }
  }

  async function handleScanInChat(file: File) {
    setLoading(true);
    setError("");
    const userMsg: Message = { role: "user", content: `📎 ${file.name}`, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/scan/analyze", { method: "POST", body: fd });
      const data = await res.json();
      const meta = DOC_TYPE_CHAT[data.docType] ?? { icon: "📄", label: data.docType };
      const dataLines = Object.entries(data.data ?? {})
        .filter(([, v]) => v !== null && v !== undefined && v !== "")
        .slice(0, 6)
        .map(([k, v]) => `• ${k}: **${v}**`)
        .join("\n");
      const actionsLines = (data.suggestedActions ?? []).map((a: { label: string }) => `✅ ${a.label}`).join("\n");
      const reply = `${meta.icon} **${meta.label}** détecté (${data.confidence}%)\n\n${data.title}\n\n${dataLines ? `**Données extraites:**\n${dataLines}\n\n` : ""}${actionsLines ? `**Actions proposées:**\n${actionsLines}\n\nVa sur [Scan intelligent](/dashboard/scan) pour confirmer.` : "Aucune action automatique possible."}`;
      setMessages(prev => [...prev, { role: "assistant", content: reply, timestamp: new Date(), quickReplies: ["Confirmer les actions", "Aller au Scan", "Nouveau document"] }]);
    } catch {
      setError("Échec analyse document.");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  const suggestions = getSuggestions(pathname);

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        style={{
          position: "fixed",
          bottom: 20,
          [isRtl ? "left" : "right"]: 20,
          zIndex: 40,
          width: 56,
          height: 56,
          background: "linear-gradient(135deg, #15803d 0%, #166534 100%)",
          color: "white",
          border: "none",
          borderRadius: "50%",
          display: open ? "none" : "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          boxShadow: "0 4px 20px rgba(22,101,52,0.4)",
          transition: "transform 0.2s",
          fontSize: 22,
        }}
        onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.08)")}
        onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
        title="Orchid — Assistant IA"
      >
        🌸
        {alertCount > 0 && (
          <span style={{
            position: "absolute", top: -2, right: -2,
            background: "#dc2626", color: "white",
            borderRadius: "50%", width: 20, height: 20,
            fontSize: 11, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "2px solid white",
            animation: "pulse 2s infinite",
          }}>
            {alertCount > 9 ? "9+" : alertCount}
          </span>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          dir={isRtl ? "rtl" : "ltr"}
          style={{
            position: "fixed",
            bottom: 16,
            [isRtl ? "left" : "right"]: 16,
            zIndex: 50,
            width: "min(440px, calc(100vw - 32px))",
            height: "min(640px, calc(100vh - 32px))",
            background: "white",
            borderRadius: 20,
            boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
            border: "1px solid #e5e7eb",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div style={{
            background: "linear-gradient(135deg, #15803d 0%, #166534 100%)",
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 38, height: 38,
                background: "rgba(255,255,255,0.15)",
                borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20,
              }}>🌸</div>
              <div>
                <p style={{ color: "white", fontWeight: 700, fontSize: 14, margin: 0 }}>Orchid</p>
                <p style={{ color: "#86efac", fontSize: 11, margin: 0, display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 6, height: 6, background: "#4ade80", borderRadius: "50%", display: "inline-block" }} />
                  {loading ? "En train de réfléchir…" : "En ligne · Les Orchidées 2"}
                </p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {alertCount > 0 && (
                <button onClick={() => sendMessage("Quelles sont les alertes urgentes du moment ?")} style={{ background: "rgba(220,38,38,0.3)", border: "none", borderRadius: 8, padding: "4px 8px", cursor: "pointer", color: "white", fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                  <AlertTriangle size={12} />{alertCount} alerte{alertCount > 1 ? "s" : ""}
                </button>
              )}
              {messages.length > 0 && (
                <button onClick={() => setMessages([])} style={{ background: "none", border: "none", borderRadius: 8, padding: "6px", cursor: "pointer", color: "#86efac" }}>
                  <Trash2 size={14} />
                </button>
              )}
              <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", borderRadius: 8, padding: "6px", cursor: "pointer", color: "#86efac" }}>
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Page context chip */}
          <div style={{ padding: "6px 14px", background: "#f0fdf4", borderBottom: "1px solid #dcfce7", display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <Sparkles size={11} color="#16a34a" />
            <span style={{ fontSize: 11, color: "#15803d", fontWeight: 500 }}>Page: {getPageLabel(pathname)}</span>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "14px", display: "flex", flexDirection: "column", gap: 12 }}>
            {messages.length === 0 && (
              <div style={{ textAlign: "center", paddingTop: 20 }}>
                <div style={{ width: 60, height: 60, background: "#f0fdf4", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontSize: 28 }}>🌸</div>
                <p style={{ fontWeight: 600, color: "#111827", fontSize: 14, margin: "0 0 4px" }}>Bonjour ! Je suis Orchid</p>
                <p style={{ fontSize: 12, color: "#9ca3af", margin: "0 0 16px", lineHeight: 1.5 }}>
                  Assistant IA de la Résidence Les Orchidées 2.<br />
                  Je connais tout de votre résidence en temps réel.
                </p>
                {/* Contextual suggestions */}
                <p style={{ fontSize: 11, color: "#6b7280", marginBottom: 8, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>Suggestions pour cette page</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
                  {suggestions.map((s) => (
                    <button key={s} onClick={() => sendMessage(s)} style={{ fontSize: 12, padding: "6px 12px", borderRadius: 20, border: "1px solid #d1fae5", color: "#15803d", background: "#f0fdf4", cursor: "pointer", fontWeight: 500, transition: "all 0.15s" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#dcfce7"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#f0fdf4"; }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} style={{ display: "flex", flexDirection: msg.role === "user" ? "row-reverse" : "row", gap: 8, alignItems: "flex-start" }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                  background: msg.role === "user" ? "#15803d" : "#f0fdf4",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: msg.role === "user" ? 12 : 14,
                  color: msg.role === "user" ? "white" : undefined,
                }}>
                  {msg.role === "user" ? <User size={13} /> : "🌸"}
                </div>
                <div style={{ maxWidth: "80%", display: "flex", flexDirection: "column", gap: 6 }}>
                  {/* Message bubble */}
                  <div style={{
                    background: msg.role === "user" ? "#15803d" : "#f9fafb",
                    color: msg.role === "user" ? "white" : "#111827",
                    padding: "10px 14px",
                    borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                    fontSize: 13,
                    lineHeight: 1.55,
                    border: msg.role === "assistant" ? "1px solid #e5e7eb" : "none",
                  }}>
                    <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{msg.content}</p>
                    <p style={{ fontSize: 10, opacity: 0.5, margin: "4px 0 0", textAlign: isRtl ? "left" : "right" }}>
                      {msg.timestamp.toLocaleTimeString("fr-MA", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>

                  {/* Action button */}
                  {msg.action && !msg.actionDone && (
                    <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: "10px 12px" }}>
                      {msg.action.missingFields && msg.action.missingFields.length > 0 && (
                        <p style={{ fontSize: 11, color: "#f59e0b", margin: "0 0 8px", display: "flex", alignItems: "center", gap: 4 }}>
                          <AlertTriangle size={11} />
                          Champs manquants: {msg.action.missingFields.join(", ")}
                        </p>
                      )}
                      <button
                        onClick={() => executeAction(i, msg.action!)}
                        disabled={executingAction === `${i}`}
                        style={{
                          background: "#15803d", color: "white", border: "none",
                          borderRadius: 8, padding: "8px 14px", cursor: "pointer",
                          fontSize: 12, fontWeight: 700,
                          display: "flex", alignItems: "center", gap: 6,
                          opacity: executingAction === `${i}` ? 0.7 : 1,
                          width: "100%", justifyContent: "center",
                        }}>
                        {executingAction === `${i}` ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                        {executingAction === `${i}` ? "En cours…" : msg.action.label}
                      </button>
                    </div>
                  )}
                  {msg.actionDone && (
                    <div style={{ fontSize: 11, color: "#15803d", display: "flex", alignItems: "center", gap: 4, padding: "4px 8px" }}>
                      <CheckCircle size={12} />Créé avec succès !
                    </div>
                  )}

                  {/* Quick replies */}
                  {msg.role === "assistant" && msg.quickReplies && msg.quickReplies.length > 0 && i === messages.length - 1 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                      {msg.quickReplies.map((qr, qi) => (
                        <button key={qi} onClick={() => sendMessage(qr)} style={{ fontSize: 11, padding: "5px 10px", borderRadius: 20, border: "1px solid #e5e7eb", color: "#374151", background: "white", cursor: "pointer", transition: "all 0.15s" }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#f0fdf4"; (e.currentTarget as HTMLElement).style.borderColor = "#86efac"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "white"; (e.currentTarget as HTMLElement).style.borderColor = "#e5e7eb"; }}>
                          {qr}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🌸</div>
                <div style={{ background: "#f9fafb", borderRadius: "18px 18px 18px 4px", padding: "12px 16px", border: "1px solid #e5e7eb" }}>
                  <div style={{ display: "flex", gap: 4 }}>
                    {[0, 1, 2].map(i => (
                      <span key={i} style={{ width: 6, height: 6, background: "#16a34a", borderRadius: "50%", display: "inline-block", animation: `bounce 1.2s ${i * 0.2}s infinite` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {error && (
              <p style={{ fontSize: 12, color: "#dc2626", textAlign: "center", background: "#fef2f2", padding: "8px 12px", borderRadius: 8 }}>
                {error}
              </p>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: "10px 12px", borderTop: "1px solid #f3f4f6", background: "#fafafa", flexShrink: 0 }}>
            <input ref={scanRef} type="file" accept="image/*,.pdf" style={{ display: "none" }}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleScanInChat(f); e.target.value = ""; }} />
            <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
              <button onClick={() => scanRef.current?.click()} title="Scanner un document" style={{ width: 34, height: 34, background: "#f3f4f6", border: "1px solid #e5e7eb", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, color: "#6b7280" }}>
                <ScanLine size={14} />
              </button>
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Posez votre question ou décrivez un prestataire…"
                rows={1}
                style={{
                  flex: 1, resize: "none", borderRadius: 14,
                  border: "1px solid #e5e7eb", padding: "9px 14px",
                  fontSize: 13, outline: "none", maxHeight: 90,
                  fontFamily: "inherit", lineHeight: 1.4,
                  transition: "border-color 0.2s",
                }}
                onFocus={e => (e.currentTarget.style.borderColor = "#16a34a")}
                onBlur={e => (e.currentTarget.style.borderColor = "#e5e7eb")}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                style={{
                  width: 38, height: 38,
                  background: !input.trim() || loading ? "#e5e7eb" : "#15803d",
                  color: !input.trim() || loading ? "#9ca3af" : "white",
                  border: "none", borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: !input.trim() || loading ? "not-allowed" : "pointer",
                  transition: "all 0.2s", flexShrink: 0,
                }}>
                {loading ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> : <Send size={15} />}
              </button>
            </div>
            <p style={{ fontSize: 10, color: "#d1d5db", textAlign: "center", margin: "5px 0 0" }}>
              Entrée pour envoyer · Orchid connaît votre résidence en temps réel
            </p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.15)} }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </>
  );
}
