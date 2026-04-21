"use client";

import Link from "next/link";
import { Menu, Bell, Printer } from "lucide-react";
import { useSession } from "next-auth/react";
import { useLang } from "@/contexts/LangContext";
import type { Lang } from "@/lib/i18n";

interface DashboardHeaderProps {
  onMenuClick: () => void;
  pageTitle: string;
}

const roleLabel: Record<string, { fr: string; ar: string }> = {
  ADMIN:    { fr: "Administrateur",  ar: "مدير عام" },
  MANAGER:  { fr: "Gestionnaire",    ar: "مدير" },
  OPERATOR: { fr: "Opérateur",       ar: "مشغّل" },
  VIEWER:   { fr: "Observateur",     ar: "مراقب" },
};

export function DashboardHeader({ onMenuClick, pageTitle }: DashboardHeaderProps) {
  const { data: session } = useSession();
  const { lang, setLang, isRtl } = useLang();

  const role = (session?.user as { role?: string })?.role ?? "VIEWER";
  const label = roleLabel[role]?.[lang] ?? role;

  return (
    <header
      dir={isRtl ? "rtl" : "ltr"}
      className="h-16 bg-white border-b border-gray-100 px-4 flex items-center justify-between shrink-0 shadow-sm"
    >
      {/* Left: hamburger + title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
        >
          <Menu size={20} />
        </button>
        <h2 className="text-base font-semibold text-gray-800">{pageTitle}</h2>
      </div>

      {/* Right: lang + notifications + user */}
      <div className="flex items-center gap-2">
        {/* Language toggle */}
        <button
          onClick={() => setLang(lang === "fr" ? "ar" : ("fr" as Lang))}
          className="hidden sm:block text-xs px-2.5 py-1 rounded-full border border-gray-200 text-gray-500 hover:border-green-400 hover:text-green-700 transition-colors"
        >
          {lang === "fr" ? "ع" : "FR"}
        </button>

        {/* Print */}
        <button
          onClick={() => window.print()}
          className="no-print p-2 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-green-700 transition-colors"
          title={lang === "fr" ? "Imprimer / Enregistrer PDF" : "طباعة / حفظ PDF"}
        >
          <Printer size={20} />
        </button>

        {/* Notifications */}
        <button className="relative p-2 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* User chip → profile */}
        <Link href="/dashboard/profile" className="flex items-center gap-2 pl-2 border-l border-gray-100 hover:opacity-80 transition-opacity">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-gray-800 leading-none">
              {session?.user?.name ?? "—"}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{label}</p>
          </div>
          <div className="w-8 h-8 bg-green-700 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">
            {(session?.user?.name ?? "?")[0].toUpperCase()}
          </div>
        </Link>
      </div>
    </header>
  );
}
