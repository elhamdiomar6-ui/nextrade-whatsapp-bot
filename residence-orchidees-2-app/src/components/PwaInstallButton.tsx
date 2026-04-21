"use client";

import { useEffect, useState } from "react";
import { Download, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallButton() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    // iOS detection
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const standalone = (navigator as { standalone?: boolean }).standalone;
    setIsIos(ios);
    if (ios && standalone) setInstalled(true);

    // Android / Chrome install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (installed) {
    return (
      <span className="text-xs text-green-600 font-medium flex items-center gap-1">
        ✓ Installée
      </span>
    );
  }

  if (isIos) {
    return (
      <>
        <button
          onClick={() => setShowIosHint(!showIosHint)}
          className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded-lg font-medium transition-colors flex items-center gap-1"
        >
          <Smartphone size={12} />
          iOS — Comment ?
        </button>
        {showIosHint && (
          <div className="mt-2 bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800 space-y-1">
            <p>1. Ouvrez dans <strong>Safari</strong></p>
            <p>2. Appuyez sur <strong>Partager</strong> (icône carré ↑)</p>
            <p>3. Choisissez <strong>Sur l&apos;écran d&apos;accueil</strong></p>
          </div>
        )}
      </>
    );
  }

  if (prompt) {
    return (
      <button
        onClick={async () => {
          await prompt.prompt();
          const { outcome } = await prompt.userChoice;
          if (outcome === "accepted") setInstalled(true);
          setPrompt(null);
        }}
        className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded-lg font-medium transition-colors flex items-center gap-1"
      >
        <Download size={12} />
        Installer
      </button>
    );
  }

  // Prompt not available yet (already installed or not supported)
  return (
    <span className="text-xs text-gray-400">
      Disponible sur mobile
    </span>
  );
}
