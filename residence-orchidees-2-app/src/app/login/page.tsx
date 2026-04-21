"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Building2 } from "lucide-react";

const T = {
  fr: {
    appName:   "Résidence Les Orchidées 2",
    subtitle:  "Espace de Gestion",
    email:     "Adresse e-mail",
    password:  "Mot de passe",
    submit:    "Se connecter",
    loading:   "Connexion…",
    error:     "Email ou mot de passe incorrect.",
    toggleLang:"العربية",
  },
  ar: {
    appName:   "إقامة الأوركيد 2",
    subtitle:  "فضاء الإدارة",
    email:     "البريد الإلكتروني",
    password:  "كلمة المرور",
    submit:    "تسجيل الدخول",
    loading:   "جارٍ التسجيل…",
    error:     "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
    toggleLang:"Français",
  },
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [lang, setLang] = useState<"fr" | "ar">("fr");
  const isOccupantPortal = searchParams.get("portal") === "occupant";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const t = T[lang];
  const isRtl = lang === "ar";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError(t.error);
    } else {
      // Fetch session to check role for redirect
      const { getSession } = await import("next-auth/react");
      const session = await getSession();
      const role = (session?.user as { role?: string })?.role;
      if (role === "OCCUPANT") {
        router.push("/dashboard/mon-espace");
      } else {
        router.push("/dashboard");
      }
    }
  }

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100 flex items-center justify-center p-4"
    >
      <div className="w-full max-w-sm">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header band */}
          <div className="bg-gradient-to-r from-green-800 to-emerald-700 px-8 py-8 text-center relative">
            {/* Lang toggle */}
            <button
              type="button"
              onClick={() => setLang(lang === "fr" ? "ar" : "fr")}
              className="absolute top-4 right-4 text-xs px-2.5 py-1 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
            >
              {t.toggleLang}
            </button>

            {/* Icon */}
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/15 rounded-full mb-3">
              <Building2 className="text-white" size={32} />
            </div>

            <h1 className="text-lg font-bold text-white leading-tight">
              {t.appName}
            </h1>
            <p className="text-green-200 text-sm mt-0.5">
              {isOccupantPortal ? (lang === "fr" ? "Portail Occupants" : "بوابة الساكنين") : t.subtitle}
            </p>
          </div>

          {/* Form */}
          <div className="px-7 py-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t.email}
                </label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  dir="ltr"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 text-sm transition-shadow"
                  placeholder="admin@orchidees2.ma"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t.password}
                </label>
                <div className="relative">
                  <input
                    type={showPwd ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    dir="ltr"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 text-sm pr-11 transition-shadow"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <p className="text-red-500 text-sm text-center bg-red-50 py-2 px-3 rounded-lg">
                  {error}
                </p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-green-700 hover:bg-green-800 disabled:bg-green-400 text-white font-semibold rounded-xl transition-colors text-sm mt-1 cursor-pointer disabled:cursor-not-allowed"
              >
                {loading ? t.loading : t.submit}
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-4">
          Résidence Les Orchidées 2 · Casablanca
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
