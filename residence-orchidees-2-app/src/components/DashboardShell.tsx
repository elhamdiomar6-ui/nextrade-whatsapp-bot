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
      className="flex h-screen overflow-hidden bg-gray-50"
    >
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <DashboardHeader
          onMenuClick={() => setSidebarOpen(true)}
          pageTitle={pageTitle}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>

      {/* Agent Orchid — floating chat */}
      <AgentChat />
    </div>
  );
}
