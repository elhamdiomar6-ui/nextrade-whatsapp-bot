"use client";

import { useState } from "react";
import { useLang } from "@/contexts/LangContext";
import { MessageCircle, Phone, Save, Send, CheckCircle, AlertCircle } from "lucide-react";
import { saveWhatsAppSettings, testWhatsApp, type WASettings } from "@/actions/whatsapp-settings";

interface Props {
  initial: WASettings;
  instance: string;
}

const owners = [
  { key: "WA_OMAR"     , nameFr: "Omar El Hamdi (Admin)",   nameAr: "عمر الحمدي (مدير)" },
  { key: "WA_MOHAMED"  , nameFr: "Mohamed El Hamdi",        nameAr: "محمد الحمدي" },
  { key: "WA_BRAHIM"   , nameFr: "Brahim El Hamdi",         nameAr: "إبراهيم الحمدي" },
  { key: "WA_LAHOUCINE", nameFr: "Lahoucine El Hamdi",      nameAr: "لحسين الحمدي" },
] as const;

export function WhatsAppConfigClient({ initial, instance }: Props) {
  const { lang, isRtl } = useLang();
  const [values, setValues] = useState<WASettings>(initial);
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, { ok: boolean; text: string }>>({});
  const [testingKey, setTestingKey] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveMsg(null);
    const res = await saveWhatsAppSettings(values);
    setSaving(false);
    setSaveMsg(res.success
      ? { ok: true,  text: lang === "fr" ? "Numéros enregistrés !" : "تم حفظ الأرقام!" }
      : { ok: false, text: res.error ?? "Erreur" }
    );
  };

  const handleTest = async (key: string) => {
    const num = values[key as keyof WASettings];
    if (!num) {
      setTestResults((p) => ({ ...p, [key]: { ok: false, text: lang === "fr" ? "Numéro vide" : "رقم فارغ" } }));
      return;
    }
    setTestingKey(key);
    const res = await testWhatsApp(num);
    setTestingKey(null);
    setTestResults((p) => ({
      ...p,
      [key]: res.success
        ? { ok: true,  text: lang === "fr" ? "Envoyé !" : "تم الإرسال!" }
        : { ok: false, text: res.error ?? "Erreur" },
    }));
  };

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="max-w-lg mx-auto space-y-5">

      {/* Instance info */}
      <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
        <MessageCircle size={20} className="text-green-700 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-green-800">UltraMsg</p>
          <p className="text-xs text-green-600">
            {lang === "fr" ? "Instance" : "النسخة"}: <span className="font-mono font-bold">{instance || "—"}</span>
          </p>
          <p className="text-xs text-green-500 mt-0.5">
            {lang === "fr"
              ? "Token & instance configurés dans .env"
              : "الرمز والنسخة مُعدَّان في ملف .env"}
          </p>
        </div>
      </div>

      {/* Phone numbers form */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
          <Phone size={16} className="text-green-700" />
          {lang === "fr" ? "Numéros WhatsApp des copropriétaires" : "أرقام واتساب الملاك"}
        </h3>
        <p className="text-xs text-gray-400">
          {lang === "fr"
            ? "Format international requis. Ex: +212600123456"
            : "الصيغة الدولية مطلوبة. مثال: +212600123456"}
        </p>

        {owners.map(({ key, nameFr, nameAr }) => (
          <div key={key}>
            <label className="text-xs font-medium text-gray-600 block mb-1.5">
              {lang === "fr" ? nameFr : nameAr}
            </label>
            <div className="flex gap-2">
              <input
                type="tel"
                value={values[key as keyof WASettings]}
                onChange={(e) => setValues((p) => ({ ...p, [key]: e.target.value }))}
                placeholder="+212600000000"
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                type="button"
                onClick={() => handleTest(key)}
                disabled={testingKey === key}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-500 hover:border-green-400 hover:text-green-700 transition-colors disabled:opacity-60"
              >
                <Send size={13} />
                {testingKey === key ? "…" : (lang === "fr" ? "Tester" : "اختبار")}
              </button>
            </div>
            {testResults[key] && (
              <div className={`flex items-center gap-1 text-xs mt-1 ${testResults[key].ok ? "text-green-600" : "text-red-500"}`}>
                {testResults[key].ok ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                {testResults[key].text}
              </div>
            )}
          </div>
        ))}

        {saveMsg && (
          <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-xl ${saveMsg.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
            {saveMsg.ok ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
            {saveMsg.text}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-green-700 hover:bg-green-800 text-white text-sm font-medium py-2.5 rounded-xl transition-colors disabled:opacity-60"
        >
          <Save size={15} />
          {saving
            ? (lang === "fr" ? "Enregistrement…" : "جارٍ الحفظ…")
            : (lang === "fr" ? "Enregistrer les numéros" : "حفظ الأرقام")}
        </button>
      </form>
    </div>
  );
}
