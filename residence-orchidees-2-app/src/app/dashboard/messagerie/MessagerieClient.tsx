"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { sendMessage } from "@/actions/messages";

const MSG_TYPES = [
  { value: "LIBRE",         label: "💬 Message libre" },
  { value: "INCIDENT",      label: "🚨 Signalement incident" },
  { value: "DOCUMENT",      label: "📄 Demande de document" },
  { value: "FACTURE",       label: "🧾 Question sur facture" },
  { value: "INTERVENTION",  label: "🔧 Demande d'intervention" },
];

const TYPE_ICONS: Record<string, string> = {
  LIBRE: "💬", INCIDENT: "🚨", DOCUMENT: "📄", FACTURE: "🧾", INTERVENTION: "🔧",
};

interface Thread {
  id: string;
  threadId: string;
  type: string;
  subject?: string | null;
  content: string;
  createdAt: string;
  isAdmin: boolean;
  unitId?: string | null;
  sender: { id: string; name: string; role: string };
  unit?: { id: string; name: string } | null;
}

interface Message {
  id: string;
  content: string;
  isAdmin: boolean;
  type: string;
  createdAt: string;
  sender: { id: string; name: string; role: string };
  read: boolean;
}

interface Props {
  threads: Thread[];
  units: { id: string; name: string }[];
  currentUserId: string;
  currentUserName: string;
  isAdmin: boolean;
  myUnitId: string | null;
}

export function MessagerieClient({ threads, units, currentUserId, currentUserName, isAdmin, myUnitId }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [activeThread, setActiveThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [content, setContent] = useState("");
  const [msgType, setMsgType] = useState("LIBRE");
  const [subject, setSubject] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const [showNewThread, setShowNewThread] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [newType, setNewType] = useState("LIBRE");
  const [newSubject, setNewSubject] = useState("");
  const [selectedUnitId, setSelectedUnitId] = useState(myUnitId ?? "");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadThread(thread: Thread) {
    setActiveThread(thread);
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/messages/${thread.threadId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch {
      setMessages([]);
    }
    setLoadingMessages(false);
  }

  async function handleSendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || !activeThread) return;
    setSendingMsg(true);
    try {
      await sendMessage({
        content: content.trim(),
        type: msgType,
        threadId: activeThread.threadId,
        unitId: activeThread.unitId ?? undefined,
      });
      setContent("");
      // Reload messages
      await loadThread(activeThread);
      router.refresh();
    } finally {
      setSendingMsg(false);
    }
  }

  async function handleNewThread(e: React.FormEvent) {
    e.preventDefault();
    if (!newContent.trim()) return;
    setSendingMsg(true);
    try {
      await sendMessage({
        content: newContent.trim(),
        type: newType,
        subject: newSubject.trim() || undefined,
        unitId: selectedUnitId || undefined,
      });
      setNewContent("");
      setNewSubject("");
      setShowNewThread(false);
      router.refresh();
    } finally {
      setSendingMsg(false);
    }
  }

  const groupedThreads = isAdmin
    ? threads.reduce((acc, t) => {
        const unitName = t.unit?.name ?? "Sans unité";
        if (!acc[unitName]) acc[unitName] = [];
        acc[unitName].push(t);
        return acc;
      }, {} as Record<string, Thread[]>)
    : { "Mes messages": threads };

  return (
    <div style={{ display: "flex", height: "calc(100vh - 64px)", background: "#f9fafb" }}>

      {/* ── LEFT PANEL: Thread list ── */}
      <div style={{ width: 320, borderRight: "1px solid #e5e7eb", background: "#fff", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>
            💬 Messagerie
          </h2>
          <button
            onClick={() => setShowNewThread(true)}
            style={{ background: "#166534", color: "#fff", border: "none", borderRadius: 8, padding: "7px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
          >
            + Nouveau
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto" }}>
          {Object.entries(groupedThreads).map(([group, groupThreads]) => (
            <div key={group}>
              {isAdmin && (
                <p style={{ padding: "10px 16px 4px", fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  🏠 {group}
                </p>
              )}
              {groupThreads.map(thread => (
                <button
                  key={thread.id}
                  onClick={() => loadThread(thread)}
                  style={{
                    width: "100%", textAlign: "left", padding: "12px 16px",
                    borderBottom: "1px solid #f9fafb", background: activeThread?.threadId === thread.threadId ? "#f0fdf4" : "#fff",
                    border: "none", borderLeft: activeThread?.threadId === thread.threadId ? "3px solid #166534" : "3px solid transparent",
                    cursor: "pointer", transition: "background .15s",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 16 }}>{TYPE_ICONS[thread.type] ?? "💬"}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#111827", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {thread.subject ?? thread.content.slice(0, 35)}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: "#6b7280" }}>{thread.sender.name}</span>
                    <span style={{ fontSize: 10, color: "#9ca3af" }}>{new Date(thread.createdAt).toLocaleDateString("fr-FR")}</span>
                  </div>
                </button>
              ))}
            </div>
          ))}
          {threads.length === 0 && (
            <div style={{ padding: 32, textAlign: "center", color: "#9ca3af" }}>
              <p style={{ fontSize: 32, marginBottom: 8 }}>💬</p>
              <p style={{ fontSize: 13 }}>Aucune conversation</p>
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT PANEL: Chat ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {!activeThread ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", flexDirection: "column", gap: 12 }}>
            <span style={{ fontSize: 56 }}>💬</span>
            <p style={{ fontSize: 16, fontWeight: 600 }}>Sélectionnez une conversation</p>
            <p style={{ fontSize: 13 }}>ou créez-en une nouvelle</p>
            <button
              onClick={() => setShowNewThread(true)}
              style={{ background: "#166534", color: "#fff", border: "none", borderRadius: 10, padding: "12px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer", marginTop: 8 }}
            >
              + Nouveau message
            </button>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div style={{ padding: "14px 20px", borderBottom: "1px solid #e5e7eb", background: "#fff", display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 24 }}>{TYPE_ICONS[activeThread.type] ?? "💬"}</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>
                  {activeThread.subject ?? activeThread.content.slice(0, 50)}
                </p>
                <p style={{ fontSize: 12, color: "#6b7280" }}>
                  {isAdmin ? `🏠 ${activeThread.unit?.name ?? "—"} · ` : ""}
                  {MSG_TYPES.find(t => t.value === activeThread.type)?.label ?? activeThread.type}
                </p>
              </div>
              <span style={{ fontSize: 11, color: "#9ca3af" }}>
                {new Date(activeThread.createdAt).toLocaleDateString("fr-FR")}
              </span>
            </div>

            {/* Messages area */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 0", display: "flex", flexDirection: "column", gap: 12, background: "#f9fafb" }}>
              {loadingMessages ? (
                <div style={{ textAlign: "center", color: "#9ca3af", padding: 40 }}>Chargement…</div>
              ) : messages.map(msg => {
                const isMine = msg.sender.id === currentUserId;
                return (
                  <div key={msg.id} style={{ display: "flex", justifyContent: isMine ? "flex-end" : "flex-start", gap: 8, alignItems: "flex-end" }}>
                    {!isMine && (
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: msg.isAdmin ? "#166534" : "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: msg.isAdmin ? "#fff" : "#374151", flexShrink: 0 }}>
                        {msg.isAdmin ? "👨‍💼" : "👤"}
                      </div>
                    )}
                    <div style={{ maxWidth: "70%" }}>
                      {!isMine && <p style={{ fontSize: 11, color: "#6b7280", marginBottom: 4, paddingLeft: 4 }}>{msg.sender.name}</p>}
                      <div style={{
                        padding: "10px 14px",
                        borderRadius: isMine ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                        background: isMine ? "#166534" : "#fff",
                        color: isMine ? "#fff" : "#111827",
                        fontSize: 14,
                        lineHeight: 1.5,
                        boxShadow: "0 1px 4px rgba(0,0,0,.06)",
                      }}>
                        {msg.content}
                      </div>
                      <p style={{ fontSize: 10, color: "#9ca3af", marginTop: 4, textAlign: isMine ? "right" : "left", paddingLeft: 4 }}>
                        {new Date(msg.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} · {new Date(msg.createdAt).toLocaleDateString("fr-FR")}
                        {isMine && <span style={{ marginLeft: 4 }}>{msg.read ? " ✓✓" : " ✓"}</span>}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply form */}
            <form onSubmit={handleSendReply} style={{ padding: "12px 16px", background: "#fff", borderTop: "1px solid #e5e7eb" }}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
                <select
                  value={msgType}
                  onChange={e => setMsgType(e.target.value)}
                  style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px", fontSize: 13, color: "#374151", background: "#f9fafb", flexShrink: 0 }}
                >
                  {MSG_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Votre message…"
                  rows={2}
                  style={{ flex: 1, border: "1px solid #e5e7eb", borderRadius: 10, padding: "10px 14px", fontSize: 14, resize: "none", outline: "none", fontFamily: "inherit" }}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendReply(e as any); } }}
                />
                <button
                  type="submit"
                  disabled={sendingMsg || !content.trim()}
                  style={{ background: sendingMsg || !content.trim() ? "#d1d5db" : "#166534", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 14, cursor: sendingMsg || !content.trim() ? "not-allowed" : "pointer", flexShrink: 0 }}
                >
                  {sendingMsg ? "…" : "Envoyer ➤"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>

      {/* ── MODAL: New thread ── */}
      {showNewThread && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={e => { if (e.target === e.currentTarget) setShowNewThread(false); }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 520, boxShadow: "0 20px 60px rgba(0,0,0,.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700 }}>Nouveau message</h3>
              <button onClick={() => setShowNewThread(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#6b7280" }}>✕</button>
            </div>
            <form onSubmit={handleNewThread} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Type de message</label>
                <select value={newType} onChange={e => setNewType(e.target.value)}
                  style={{ width: "100%", border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 12px", fontSize: 14 }}>
                  {MSG_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              {isAdmin && (
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Unité concernée</label>
                  <select value={selectedUnitId} onChange={e => setSelectedUnitId(e.target.value)}
                    style={{ width: "100%", border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 12px", fontSize: 14 }}>
                    <option value="">— Aucune —</option>
                    {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Objet (optionnel)</label>
                <input value={newSubject} onChange={e => setNewSubject(e.target.value)} placeholder="Ex: Fuite d'eau, demande d'attestation…"
                  style={{ width: "100%", border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 12px", fontSize: 14 }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Message *</label>
                <textarea value={newContent} onChange={e => setNewContent(e.target.value)} rows={4} required
                  placeholder="Décrivez votre demande en détail…"
                  style={{ width: "100%", border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 12px", fontSize: 14, resize: "vertical", fontFamily: "inherit" }} />
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setShowNewThread(false)}
                  style={{ background: "#f3f4f6", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 14, cursor: "pointer", fontWeight: 600 }}>
                  Annuler
                </button>
                <button type="submit" disabled={sendingMsg || !newContent.trim()}
                  style={{ background: "#166534", color: "#fff", border: "none", borderRadius: 8, padding: "10px 24px", fontSize: 14, fontWeight: 700, cursor: sendingMsg || !newContent.trim() ? "not-allowed" : "pointer" }}>
                  {sendingMsg ? "Envoi…" : "Envoyer le message"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
