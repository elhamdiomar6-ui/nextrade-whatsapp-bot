"use client";

import { useState, useRef } from "react";
import { Camera, X, Sparkles, Loader2, CheckCircle, Upload } from "lucide-react";
import { createReading } from "@/actions/readings";
import { useRouter } from "next/navigation";

interface MeterOption {
  id: string;
  serial: string;
  unitName: string;
  lastValue: number | null;
}

interface Props {
  meters: MeterOption[];
}

type Step = "capture" | "analyzing" | "confirm" | "saving" | "done";

export function PhotoReadingModal({ meters }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("capture");

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [detectedIndex, setDetectedIndex] = useState<number | null>(null);
  const [detectedMeter, setDetectedMeter] = useState<string | null>(null);
  const [detectedUnit, setDetectedUnit] = useState<string | null>(null);
  const [selectedMeterId, setSelectedMeterId] = useState("");
  const [confirmedIndex, setConfirmedIndex] = useState("");
  const [error, setError] = useState("");

  function openModal() {
    setStep("capture");
    setPhotoFile(null);
    setPhotoPreview(null);
    setDetectedIndex(null);
    setDetectedMeter(null);
    setDetectedUnit(null);
    setSelectedMeterId("");
    setConfirmedIndex("");
    setError("");
    setOpen(true);
  }

  async function handlePhoto(file: File) {
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setStep("analyzing");
    setError("");

    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/scan/analyze", { method: "POST", body: fd });
      const json = await res.json();

      const d = json.data ?? {};
      const idx = d.index ?? d.currentIndex ?? null;
      const meterNum = d.meterNumber ?? json.linkedMeter ?? null;

      setDetectedIndex(idx);
      setDetectedMeter(meterNum);
      setConfirmedIndex(idx !== null ? String(idx) : "");

      // Auto-match meter
      if (meterNum) {
        const matched = meters.find((m) => m.serial === meterNum);
        if (matched) {
          setSelectedMeterId(matched.id);
          setDetectedUnit(matched.unitName);
        }
      }

      setStep("confirm");
    } catch {
      setError("Erreur d'analyse. Entrez l'index manuellement.");
      setStep("confirm");
    }
  }

  async function handleSave() {
    if (!selectedMeterId || !confirmedIndex) return;
    setStep("saving");
    try {
      let photoUrl: string | undefined;
      if (photoFile) {
        const fd = new FormData();
        fd.append("file", photoFile);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const json = await res.json();
        if (!json.error) photoUrl = json.url;
      }
      await createReading({
        meterId: selectedMeterId,
        value: parseFloat(confirmedIndex),
        notes: "Relevé par photo IA",
        photoUrl,
      });
      setStep("done");
      setTimeout(() => {
        setOpen(false);
        router.refresh();
      }, 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
      setStep("confirm");
    }
  }

  const selectedMeter = meters.find((m) => m.id === selectedMeterId);
  const consumption = selectedMeter?.lastValue !== null && confirmedIndex
    ? (parseFloat(confirmedIndex) - (selectedMeter?.lastValue ?? 0)).toFixed(2)
    : null;

  return (
    <>
      {/* Bouton déclencheur */}
      <button
        onClick={openModal}
        className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-sm px-3 py-1.5 rounded-xl transition-colors font-medium"
      >
        <Camera size={15} />
        Relevé par photo
        <span className="text-[10px] bg-purple-500 px-1.5 py-0.5 rounded-full font-bold">IA</span>
      </button>

      {!open ? null : (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Camera size={18} className="text-purple-600" />
                <h2 className="font-semibold text-gray-900 text-sm">Relevé par photo IA</h2>
              </div>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4">

              {/* STEP: capture */}
              {step === "capture" && (
                <div className="text-center py-4 space-y-4">
                  <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mx-auto">
                    <Camera size={36} className="text-purple-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Photographiez le compteur</p>
                    <p className="text-xs text-gray-500 mt-1">L&apos;IA lit automatiquement l&apos;index</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => {
                        if (fileRef.current) {
                          fileRef.current.setAttribute("capture", "environment");
                          fileRef.current.click();
                        }
                      }}
                      className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl transition-colors"
                    >
                      <Camera size={18} />
                      Ouvrir l&apos;appareil photo
                    </button>
                    <button
                      onClick={() => {
                        if (fileRef.current) {
                          fileRef.current.removeAttribute("capture");
                          fileRef.current.click();
                        }
                      }}
                      className="w-full flex items-center justify-center gap-2 border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium py-2.5 rounded-xl transition-colors text-sm"
                    >
                      <Upload size={16} />
                      Choisir depuis la galerie
                    </button>
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handlePhoto(f);
                    }}
                  />
                </div>
              )}

              {/* STEP: analyzing */}
              {step === "analyzing" && (
                <div className="text-center py-6 space-y-3">
                  {photoPreview && (
                    <img src={photoPreview} alt="Compteur" className="w-40 h-40 object-cover rounded-xl mx-auto border-2 border-purple-200" />
                  )}
                  <div className="flex items-center justify-center gap-2 text-purple-600">
                    <Loader2 size={20} className="animate-spin" />
                    <span className="font-medium">Analyse IA en cours…</span>
                  </div>
                  <p className="text-xs text-gray-400">Lecture de l&apos;index, identification du compteur</p>
                </div>
              )}

              {/* STEP: confirm */}
              {step === "confirm" && (
                <div className="space-y-4">
                  {photoPreview && (
                    <img src={photoPreview} alt="Compteur" className="w-full h-40 object-cover rounded-xl border border-gray-200" />
                  )}

                  {detectedIndex !== null && (
                    <div className="bg-purple-50 border border-purple-200 rounded-xl px-4 py-3 flex items-start gap-2">
                      <Sparkles size={16} className="text-purple-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-purple-800">
                          IA a détecté : index {detectedIndex}
                        </p>
                        {detectedUnit && <p className="text-xs text-purple-600">Unité : {detectedUnit} · N° {detectedMeter}</p>}
                      </div>
                    </div>
                  )}

                  {/* Meter select */}
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1.5">Compteur *</label>
                    <select
                      value={selectedMeterId}
                      onChange={(e) => setSelectedMeterId(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Sélectionner…</option>
                      {meters.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.unitName} — {m.serial}
                          {m.lastValue !== null ? ` (${m.lastValue})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Index confirm */}
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1.5">
                      Index relevé *
                      {detectedIndex !== null && <span className="text-purple-500 ml-1">(pré-rempli par IA)</span>}
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={confirmedIndex}
                      onChange={(e) => setConfirmedIndex(e.target.value)}
                      placeholder="Vérifiez ou corrigez l'index"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    {consumption !== null && (
                      <p className={`text-xs mt-1 font-medium ${parseFloat(consumption) < 0 ? "text-red-600" : "text-green-700"}`}>
                        {parseFloat(consumption) < 0 ? "⚠️ " : "+"}{consumption} m³
                      </p>
                    )}
                  </div>

                  {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => setStep("capture")}
                      className="flex-1 py-2 border border-gray-200 text-gray-500 rounded-xl hover:bg-gray-50 text-sm transition-colors"
                    >
                      Reprendre photo
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={!selectedMeterId || !confirmedIndex}
                      className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-colors"
                    >
                      Enregistrer
                    </button>
                  </div>
                </div>
              )}

              {/* STEP: saving */}
              {step === "saving" && (
                <div className="text-center py-8 space-y-3">
                  <Loader2 size={32} className="animate-spin text-purple-600 mx-auto" />
                  <p className="text-gray-600 font-medium">Enregistrement…</p>
                </div>
              )}

              {/* STEP: done */}
              {step === "done" && (
                <div className="text-center py-8 space-y-3">
                  <CheckCircle size={40} className="text-green-500 mx-auto" />
                  <p className="font-semibold text-green-700">Relevé enregistré !</p>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </>
  );
}
