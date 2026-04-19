"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useLang } from "@/contexts/LangContext";
import { Plus, X, Droplets, Upload, Camera } from "lucide-react";
import { createReading } from "@/actions/readings";

export interface MeterOption {
  id: string;
  serial: string;
  unitName: string;
  lastValue: number | null;
}

export function NewReadingForm({ meters }: { meters: MeterOption[] }) {
  const { data: session } = useSession();
  const { lang } = useLang();
  const router = useRouter();

  if (session?.user?.role === "VIEWER") return null;
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const [meterId, setMeterId] = useState("");
  const [value, setValue] = useState("");
  const [notes, setNotes] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [error, setError] = useState("");

  const selected = meters.find((m) => m.id === meterId);
  const consumption =
    selected?.lastValue !== null && value !== ""
      ? (parseFloat(value) - (selected?.lastValue ?? 0)).toFixed(2)
      : null;
  const isAnomaly = consumption !== null && parseFloat(consumption) < 0;

  const reset = () => {
    setMeterId(""); setValue(""); setNotes(""); setPhoto(null); setError("");
  };
  const close = () => { reset(); setOpen(false); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!meterId || !value) return;
    setError("");

    startTransition(async () => {
      try {
        let photoUrl: string | undefined;
        if (photo) {
          const fd = new FormData();
          fd.append("file", photo);
          const res = await fetch("/api/upload", { method: "POST", body: fd });
          const json = await res.json();
          if (json.error) throw new Error(json.error);
          photoUrl = json.url;
        }
        await createReading({ meterId, value: parseFloat(value), notes: notes || undefined, photoUrl });
        close();
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      }
    });
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 bg-green-700 text-white text-sm px-3 py-1.5 rounded-xl hover:bg-green-800 transition-colors"
      >
        <Plus size={15} />
        {lang === "fr" ? "Nouveau relevé" : "قراءة جديدة"}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Droplets size={18} className="text-blue-500" />
                <h2 className="font-semibold text-gray-900 text-sm">
                  {lang === "fr" ? "Nouveau relevé compteur" : "قراءة عداد جديدة"}
                </h2>
              </div>
              <button onClick={close} className="text-gray-400 hover:text-gray-700 transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Meter select */}
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">
                  {lang === "fr" ? "Compteur" : "العداد"} *
                </label>
                <select
                  value={meterId}
                  onChange={(e) => setMeterId(e.target.value)}
                  required
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">{lang === "fr" ? "Sélectionner un compteur..." : "اختر عداداً..."}</option>
                  {meters.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.unitName} — {m.serial}
                      {m.lastValue !== null ? ` (${m.lastValue} m³)` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Previous value */}
              {selected && (
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1.5">
                    {lang === "fr" ? "Ancien relevé" : "القراءة السابقة"}
                  </label>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-500 font-mono">
                    {selected.lastValue !== null ? `${selected.lastValue} m³` : "—"}
                  </div>
                </div>
              )}

              {/* New value */}
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">
                  {lang === "fr" ? "Nouveau relevé (m³)" : "القراءة الجديدة (م³)"} *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  required
                  placeholder="ex: 325"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                {consumption !== null && (
                  <p className={`text-xs mt-1 font-medium ${isAnomaly ? "text-red-600" : "text-green-700"}`}>
                    {isAnomaly ? "⚠️ " : "+"}{consumption} m³{isAnomaly ? (lang === "fr" ? " — anomalie !" : " — شذوذ!") : ""}
                  </p>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">
                  {lang === "fr" ? "Notes" : "ملاحظات"}
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={lang === "fr" ? "Observation facultative..." : "ملاحظة اختيارية..."}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Photo upload */}
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">
                  <span className="flex items-center gap-1">
                    <Camera size={13} />
                    {lang === "fr" ? "Photo du compteur" : "صورة العداد"}
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer border border-dashed border-gray-300 rounded-xl px-3 py-2.5 hover:border-green-400 transition-colors">
                  <Upload size={14} className="text-gray-400 shrink-0" />
                  <span className="text-sm text-gray-500 truncate">
                    {photo ? photo.name : (lang === "fr" ? "Choisir une photo..." : "اختر صورة...")}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>

              {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

              {/* Buttons */}
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={close}
                  className="px-4 py-2 text-sm text-gray-500 hover:text-gray-800 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  {lang === "fr" ? "Annuler" : "إلغاء"}
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="px-5 py-2 bg-green-700 text-white text-sm font-medium rounded-xl hover:bg-green-800 disabled:opacity-60 transition-colors"
                >
                  {pending ? "…" : (lang === "fr" ? "Enregistrer" : "حفظ")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
