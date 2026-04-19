"use client";

import { useState } from "react";
import { useLang } from "@/contexts/LangContext";
import { User, Phone, Mail, Lock, CheckCircle, AlertCircle, Shield } from "lucide-react";
import { updateProfile, changePassword } from "@/actions/profile";

interface Props {
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    role: string;
  };
}

const roleLabel: Record<string, { fr: string; ar: string }> = {
  ADMIN:    { fr: "Administrateur",  ar: "مدير عام" },
  MANAGER:  { fr: "Gestionnaire",    ar: "مدير" },
  OPERATOR: { fr: "Opérateur",       ar: "مشغّل" },
  VIEWER:   { fr: "Observateur",     ar: "مراقب" },
};

export function ProfileClient({ user }: Props) {
  const { lang, isRtl } = useLang();

  // Profile form state
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Password form state
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pwLoading, setPwLoading] = useState(false);

  const roleObj = roleLabel[user.role] ?? { fr: user.role, ar: user.role };

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg(null);
    const res = await updateProfile({ name, phone });
    setProfileLoading(false);
    if (res.success) {
      setProfileMsg({ ok: true, text: lang === "fr" ? "Profil mis à jour !" : "تم تحديث الملف الشخصي!" });
    } else {
      setProfileMsg({ ok: false, text: res.error ?? "Erreur" });
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg(null);
    if (newPw !== confirmPw) {
      setPwMsg({ ok: false, text: lang === "fr" ? "Les mots de passe ne correspondent pas" : "كلمتا المرور غير متطابقتين" });
      return;
    }
    setPwLoading(true);
    const res = await changePassword({ currentPassword: currentPw, newPassword: newPw });
    setPwLoading(false);
    if (res.success) {
      setPwMsg({ ok: true, text: lang === "fr" ? "Mot de passe changé !" : "تم تغيير كلمة المرور!" });
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
    } else {
      setPwMsg({ ok: false, text: res.error ?? "Erreur" });
    }
  }

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="max-w-lg mx-auto space-y-5">

      {/* Identity card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
        <div className="w-14 h-14 bg-green-700 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shrink-0">
          {user.name[0].toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-gray-900 text-lg leading-tight">{user.name}</p>
          <p className="text-sm text-gray-400">{user.email}</p>
          <span className="inline-flex items-center gap-1 mt-1 text-xs px-2 py-0.5 bg-green-50 text-green-700 rounded-full font-medium">
            <Shield size={11} />
            {roleObj[lang]}
          </span>
        </div>
      </div>

      {/* Profile form */}
      <form onSubmit={handleProfileSave} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
          <User size={16} className="text-green-700" />
          {lang === "fr" ? "Informations personnelles" : "المعلومات الشخصية"}
        </h3>

        <div className="space-y-3">
          {/* Name */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              {lang === "fr" ? "Nom complet" : "الاسم الكامل"}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Email — read only */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              <span className="flex items-center gap-1"><Mail size={11} />{lang === "fr" ? "Email" : "البريد الإلكتروني"}</span>
            </label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full border border-gray-100 rounded-xl px-3 py-2.5 text-sm text-gray-400 bg-gray-50 cursor-not-allowed"
            />
          </div>

          {/* Phone/WhatsApp */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              <span className="flex items-center gap-1"><Phone size={11} />{lang === "fr" ? "Téléphone WhatsApp" : "رقم واتساب"}</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+212600000000"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        {profileMsg && (
          <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-xl ${profileMsg.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
            {profileMsg.ok ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
            {profileMsg.text}
          </div>
        )}

        <button
          type="submit"
          disabled={profileLoading}
          className="w-full bg-green-700 hover:bg-green-800 text-white text-sm font-medium py-2.5 rounded-xl transition-colors disabled:opacity-60"
        >
          {profileLoading
            ? (lang === "fr" ? "Enregistrement…" : "جارٍ الحفظ…")
            : (lang === "fr" ? "Enregistrer" : "حفظ")}
        </button>
      </form>

      {/* Password form */}
      <form onSubmit={handlePasswordChange} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
          <Lock size={16} className="text-green-700" />
          {lang === "fr" ? "Changer le mot de passe" : "تغيير كلمة المرور"}
        </h3>

        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              {lang === "fr" ? "Mot de passe actuel" : "كلمة المرور الحالية"}
            </label>
            <input
              type="password"
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              {lang === "fr" ? "Nouveau mot de passe" : "كلمة المرور الجديدة"}
            </label>
            <input
              type="password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              required
              minLength={8}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              {lang === "fr" ? "Confirmer le nouveau mot de passe" : "تأكيد كلمة المرور الجديدة"}
            </label>
            <input
              type="password"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        {pwMsg && (
          <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-xl ${pwMsg.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
            {pwMsg.ok ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
            {pwMsg.text}
          </div>
        )}

        <button
          type="submit"
          disabled={pwLoading}
          className="w-full bg-gray-800 hover:bg-gray-900 text-white text-sm font-medium py-2.5 rounded-xl transition-colors disabled:opacity-60"
        >
          {pwLoading
            ? (lang === "fr" ? "Changement…" : "جارٍ التغيير…")
            : (lang === "fr" ? "Changer le mot de passe" : "تغيير كلمة المرور")}
        </button>
      </form>
    </div>
  );
}
