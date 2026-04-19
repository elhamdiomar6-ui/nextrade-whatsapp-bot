"use client";
import { useEffect, useState } from "react";
import { CheckCircle, XCircle, X } from "lucide-react";

interface ToastProps {
  message: string;
  type?: "success" | "error";
  onDismiss: () => void;
  undoAction?: { label: string; fn: () => void; timeoutMs?: number };
}

export function Toast({ message, type = "success", onDismiss, undoAction }: ToastProps) {
  const [progress, setProgress] = useState(100);
  const timeout = undoAction?.timeoutMs ?? 4000;

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.max(0, 100 - (elapsed / timeout) * 100);
      setProgress(pct);
      if (pct === 0) { clearInterval(interval); onDismiss(); }
    }, 50);
    return () => clearInterval(interval);
  }, [timeout, onDismiss]);

  return (
    <div className={`relative flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium min-w-[260px] max-w-sm
      ${type === "success" ? "bg-green-700 text-white border-green-600" : "bg-red-600 text-white border-red-500"}`}>
      {type === "success" ? <CheckCircle size={18} className="shrink-0" /> : <XCircle size={18} className="shrink-0" />}
      <span className="flex-1">{message}</span>
      {undoAction && (
        <button
          onClick={() => { undoAction.fn(); onDismiss(); }}
          className="text-white/80 hover:text-white text-xs underline shrink-0"
        >
          {undoAction.label}
        </button>
      )}
      <button onClick={onDismiss} className="text-white/60 hover:text-white ml-1">
        <X size={14} />
      </button>
      <div
        className="absolute bottom-0 left-0 h-0.5 bg-white/40 rounded-b-xl transition-none"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

// Global toast context
import { createContext, useContext, useCallback, ReactNode } from "react";

interface ToastItem {
  id: string;
  message: string;
  type: "success" | "error";
  undoAction?: { label: string; fn: () => void; timeoutMs?: number };
}

interface ToastContextValue {
  showToast: (msg: string, type?: "success" | "error", undo?: ToastItem["undoAction"]) => void;
}

const ToastCtx = createContext<ToastContextValue>({ showToast: () => {} });

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: "success" | "error" = "success", undoAction?: ToastItem["undoAction"]) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type, undoAction }]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastCtx.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2 items-end">
        {toasts.map((t) => (
          <Toast
            key={t.id}
            message={t.message}
            type={t.type}
            onDismiss={() => dismiss(t.id)}
            undoAction={t.undoAction}
          />
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  return useContext(ToastCtx);
}
