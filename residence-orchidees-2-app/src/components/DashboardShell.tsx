"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { AgentChat } from "@/components/AgentChat";
import { useLang } from "@/contexts/LangContext";

const pageTitles: Record<string, { fr: string; ar: string }> = {
  "/dashboard":               { fr: "Tableau de bord",    ar: "لوحة القيادة" },
  "/dashboard/units":         { fr: "Unités",             ar: "الوحدات" },
  "/dashboard/meters":        { fr: "Compteurs",          ar: "العدادات" },
  "/dashboard/readings":      { fr: "Relevés",            ar: "القراءات" },
  "/dashboard/invoices":      { fr: "Factures",           ar: "الفواتير" },
  "/dashboard/expenses":      { fr: "Dépenses",           ar: "المصاريف" },
  "/dashboard/interventions": { fr: "Interventions",      ar: "التدخلات" },
  "/dashboard/visits":        { fr: "Visites agents",     ar: "زيارات الوكلاء" },
  "/dashboard/documents":     { fr: "Documents",          ar: "الوثائق" },
  "/dashboard/lots":          { fr: "Stock des lots",     ar: "مخزون اللوتات" },
  "/dashboard/prospects":     { fr: "Prospects CRM",      ar: "إدارة العملاء" },
  "/dashboard/sales":         { fr: "Suivi des ventes",   ar: "متابعة المبيعات" },
  "/dashboard/revenue":       { fr: "Répartition revenus",ar: "توزيع الإيرادات" },
  "/dashboard/profile":             { fr: "Mon profil",              ar: "ملفي الشخصي" },
  "/dashboard/whatsapp":            { fr: "Config WhatsApp",          ar: "إعدادات واتساب" },
  "/dashboard/admin/data":          { fr: "Rectification données",    ar: "تصحيح البيانات" },
  "/dashboard/admin/documents":     { fr: "Gestion documents admin",  ar: "إدارة وثائق المشرف" },
  "/dashboard/construction":        { fr: "Dossier construction",      ar: "ملف البناء" },
  "/dashboard/occupants":           { fr: "Occupants",                 ar: "الشاغلون" },
  "/dashboard/acquereurs":          { fr: "Acquéreurs",                ar: "المشترون" },
  "/dashboard/messagerie":          { fr: "Messagerie",                ar: "المراسلة" },
  "/dashboard/mon-espace":          { fr: "Mon logement",              ar: "مسكني" },
  "/dashboard/scan":                { fr: "Scan intelligent",          ar: "المسح الذكي" },
  "/dashboard/reports":             { fr: "Rapports PDF",               ar: "التقارير" },
  "/dashboard/personnel":           { fr: "Personnel",                  ar: "الموظفون" },
  "/dashboard/prestataires":        { fr: "Corps de métier",            ar: "أصحاب المهن" },
};

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { lang, isRtl } = useLang();

  const titleObj = pageTitles[pathname] ?? pageTitles["/dashboard"];
  const pageTitle = titleObj[lang];

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      className="flex bg-gray-50 lg:h-screen lg:overflow-hidden"
      style={{ maxWidth: "100vw", overflowX: "clip" }}
    >
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0 lg:overflow-hidden">
        <DashboardHeader
          onMenuClick={() => setSidebarOpen(true)}
          pageTitle={pageTitle}
        />

        <main className="flex-1 lg:overflow-y-auto p-3 md:p-6">
          {children}
        </main>
      </div>

      {/* Agent Orchid — floating chat */}
      <AgentChat />
    </div>
  );
}
