"use client";

import Link from "next/link";
import { useLang } from "@/contexts/LangContext";
import { PwaInstallButton } from "@/components/PwaInstallButton";

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n));
import {
  Building2, Gauge, Wrench, Bell, TrendingUp,
  AlertTriangle, CheckCircle, BarChart3, PieChart, Star, Zap,
  Camera, FileBarChart, MessageSquare, Smartphone,
} from "lucide-react";

interface Reading {
  id: string;
  value: number;
  previousValue: number | null;
  date: string;
  unitName: string | null;
  meterSerial: string;
  serviceType: string;
  consumption: number | null;
  anomaly: boolean;
}

interface CoOwnerStat {
  id: string;
  name: string;
  sharePercent: number;
  totalReceived: number;
  theoreticalShare: number;
}

interface Stats {
  totalUnits: number;
  totalMeters: number;
  totalReadings: number;
  totalExpensesAmount: number;
  openInterventions: number;
  openAlerts: number;
  coOwnerStats: CoOwnerStat[];
  totalElecMeters: number;
  totalElecKwh: number;
  totalElecConsumption: number;
  recentReadings: Reading[];
}

interface Props {
  stats: Stats;
  userName: string;
  userRole: string;
}

const coOwnerColors = [
  "border-green-200 bg-green-50 text-green-800",
  "border-blue-200 bg-blue-50 text-blue-800",
  "border-purple-200 bg-purple-50 text-purple-800",
  "border-amber-200 bg-amber-50 text-amber-800",
];

export function DashboardClient({ stats, userName, userRole }: Props) {
  const { t, lang, isRtl } = useLang();
  const isViewer = userRole === "VIEWER";

  const myCoOwner = isViewer
    ? stats.coOwnerStats.find((c) =>
        c.name.toLowerCase().includes(userName.split(" ")[0].toLowerCase())
      )
    : null;

  const kpiCards = [
    { label: t.dashboard.totalUnits,    value: stats.totalUnits,        icon: Building2, color: "bg-green-50 text-green-700",  iconColor: "text-green-600" },
    { label: t.dashboard.activeMeters,  value: stats.totalMeters,       icon: Gauge,     color: "bg-blue-50 text-blue-700",    iconColor: "text-blue-600" },
    { label: t.dashboard.pendingVisits, value: stats.openInterventions, icon: Wrench,    color: "bg-amber-50 text-amber-700",  iconColor: "text-amber-600" },
    { label: t.dashboard.openAlerts,    value: stats.openAlerts,        icon: Bell,      color: "bg-red-50 text-red-700",      iconColor: "text-red-600" },
  ];

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="space-y-6">

      {/* ── Welcome ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-green-700 rounded-full flex items-center justify-center text-white font-bold shrink-0">
          {userName[0]?.toUpperCase() ?? "A"}
        </div>
        <div>
          <p className="text-sm text-gray-500">{t.dashboard.welcome},</p>
          <p className="text-lg font-semibold text-gray-900">{userName}</p>
        </div>
        {isViewer && (
          <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
            {lang === "fr" ? "Copropriétaire" : "مالك مشارك"}
          </span>
        )}
      </div>

      {/* ── VIEWER — Carte personnelle ────────────────────────────────────── */}
      {isViewer && myCoOwner && (
        <div className="bg-gradient-to-br from-green-700 to-green-900 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Star size={16} className="text-green-300" />
                <p className="text-xs text-green-200 font-medium uppercase tracking-wide">
                  {lang === "fr" ? "Ma part copropriété" : "حصتي في الملكية المشتركة"}
                </p>
              </div>
              <p className="text-3xl font-bold mt-2">{myCoOwner.sharePercent}%</p>
              <p className="text-sm text-green-200 mt-0.5">
                {lang === "fr" ? "Résidence Les Orchidées 2" : "إقامة الأوركيدي 2"}
              </p>
            </div>
            <PieChart size={40} className="text-green-300 opacity-60" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="bg-white/10 rounded-xl p-3">
              <p className="text-xs text-green-200">{lang === "fr" ? "Revenus distribués" : "الإيرادات الموزعة"}</p>
              <p className="text-lg font-bold mt-0.5">
                {fmt(myCoOwner.totalReceived)} MAD
              </p>
            </div>
            <div className="bg-white/10 rounded-xl p-3">
              <p className="text-xs text-green-200">{lang === "fr" ? "Part théorique ventes" : "الحصة النظرية للمبيعات"}</p>
              <p className="text-lg font-bold mt-0.5">
                {fmt(myCoOwner.theoreticalShare)} MAD
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── ADMIN — Parts copropriétaires ─────────────────────────────────── */}
      {!isViewer && stats.coOwnerStats.length > 0 && stats.coOwnerStats.some(c => c.theoreticalShare > 0) && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.coOwnerStats.map((co, i) => (
            <div key={co.id} className={`rounded-2xl border p-4 ${coOwnerColors[i % 4]}`}>
              <p className="text-xs font-medium opacity-70 truncate">{co.name.split(" ")[0]}</p>
              <p className="text-lg font-bold mt-1">{fmt(co.theoreticalShare)} MAD</p>
              <p className="text-xs opacity-60">{co.sharePercent}%</p>
            </div>
          ))}
        </div>
      )}

      {/* ── KPI Cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map(({ label, value, icon: Icon, color, iconColor }) => (
          <div key={label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
              <Icon size={20} className={iconColor} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500 mt-0.5 leading-tight">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Électricité KPI ──────────────────────────────────────────────── */}
      {stats.totalElecMeters > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={18} className="text-yellow-500" />
            <h3 className="font-semibold text-gray-800 text-sm">
              {lang === "fr" ? "Électricité" : "الكهرباء"}
            </h3>
            <span className="ml-auto text-xs text-gray-400">
              {stats.totalElecMeters} {lang === "fr" ? "compteur(s)" : "عداد"}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-yellow-50 rounded-xl p-3">
              <p className="text-xs text-yellow-700 font-medium">
                {lang === "fr" ? "Index total (kWh)" : "مجموع الفهرس (كيلوواط)"}
              </p>
              <p className="text-2xl font-bold text-yellow-800 mt-0.5">
                {fmt(stats.totalElecKwh)}
                <span className="text-sm font-normal text-yellow-600 ml-1">kWh</span>
              </p>
            </div>
            <div className="bg-orange-50 rounded-xl p-3">
              <p className="text-xs text-orange-700 font-medium">
                {lang === "fr" ? "Consommation cumulée" : "الاستهلاك التراكمي"}
              </p>
              <p className="text-2xl font-bold text-orange-800 mt-0.5">
                {stats.totalElecConsumption > 0
                  ? `+${fmt(stats.totalElecConsumption)}`
                  : "—"}
                {stats.totalElecConsumption > 0 && (
                  <span className="text-sm font-normal text-orange-600 ml-1">kWh</span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Dépenses ─────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-1">
          <BarChart3 size={18} className="text-green-700" />
          <h3 className="font-semibold text-gray-800 text-sm">
            {lang === "fr" ? "Total dépenses" : "إجمالي المصاريف"}
          </h3>
        </div>
        <p className="text-3xl font-bold text-gray-900">
          {fmt(stats.totalExpensesAmount)}{" "}
          <span className="text-base font-normal text-gray-400">MAD</span>
        </p>
      </div>

      {/* ── Fonctionnalités IA ───────────────────────────────────────────── */}
      {!isViewer && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <span className="text-base">✨</span>
            <h3 className="font-semibold text-gray-800 text-sm">
              {lang === "fr" ? "Fonctionnalités intelligentes" : "الميزات الذكية"}
            </h3>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 divide-x divide-y divide-gray-100">
            {/* Photo IA */}
            <Link href="/dashboard/readings" className="flex flex-col items-start gap-2 p-4 hover:bg-purple-50 transition-colors group">
              <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                <Camera size={18} className="text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  {lang === "fr" ? "Relevé par photo" : "قراءة بالصورة"}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {lang === "fr" ? "L'IA lit l'index automatiquement" : "الذكاء يقرأ الفهرس"}
                </p>
                <span className="inline-block mt-1.5 text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-bold">IA</span>
              </div>
            </Link>

            {/* Rapports PDF */}
            <Link href="/dashboard/reports" className="flex flex-col items-start gap-2 p-4 hover:bg-green-50 transition-colors group">
              <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <FileBarChart size={18} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  {lang === "fr" ? "Rapports PDF" : "تقارير PDF"}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {lang === "fr" ? "Mensuel, annuel, copropriétaires" : "شهري وسنوي"}
                </p>
                <span className="inline-block mt-1.5 text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-bold">PDF</span>
              </div>
            </Link>

            {/* WhatsApp */}
            <Link href="/dashboard/whatsapp" className="flex flex-col items-start gap-2 p-4 hover:bg-emerald-50 transition-colors group">
              <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                <MessageSquare size={18} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  {lang === "fr" ? "Alertes WhatsApp" : "تنبيهات واتساب"}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {lang === "fr" ? "Anomalies, interventions, résumé" : "شذوذات وتدخلات"}
                </p>
                <span className="inline-block mt-1.5 text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-bold">AUTO</span>
              </div>
            </Link>

            {/* PWA */}
            <div className="flex flex-col items-start gap-2 p-4">
              <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
                <Smartphone size={18} className="text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800">
                  {lang === "fr" ? "Installer l'app" : "تثبيت التطبيق"}
                </p>
                <p className="text-xs text-gray-400 mt-0.5 mb-2">
                  {lang === "fr" ? "Accès depuis l'écran d'accueil" : "وصول من الشاشة الرئيسية"}
                </p>
                <PwaInstallButton />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Derniers relevés ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <TrendingUp size={18} className="text-green-700" />
          <h3 className="font-semibold text-gray-800 text-sm">{t.dashboard.recentActivity}</h3>
        </div>

        {stats.recentReadings.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-8">{t.dashboard.noActivity}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs">
                  <th className="px-4 py-3 text-start font-medium">{lang === "fr" ? "Unité" : "الوحدة"}</th>
                  <th className="px-4 py-3 text-start font-medium hidden sm:table-cell">{lang === "fr" ? "N° Compteur" : "رقم العداد"}</th>
                  <th className="px-4 py-3 text-center font-medium hidden sm:table-cell">{lang === "fr" ? "Type" : "النوع"}</th>
                  <th className="px-4 py-3 text-end font-medium">{lang === "fr" ? "Relevé" : "القراءة"}</th>
                  <th className="px-4 py-3 text-end font-medium">{lang === "fr" ? "Conso." : "الاستهلاك"}</th>
                  <th className="px-4 py-3 text-center font-medium">{lang === "fr" ? "État" : "الحالة"}</th>
                  <th className="px-4 py-3 text-end font-medium hidden sm:table-cell">{lang === "fr" ? "Date" : "التاريخ"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stats.recentReadings.map((r) => {
                  const isElec = r.serviceType === "ELECTRICITY";
                  const unit = isElec ? "kWh" : "m³";
                  return (
                    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {r.unitName ?? (lang === "fr" ? "Non affecté" : "غير مُعيَّن")}
                      </td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs hidden sm:table-cell">{r.meterSerial}</td>
                      <td className="px-4 py-3 text-center hidden sm:table-cell">
                        {isElec
                          ? <Zap size={14} className="text-yellow-500 inline" />
                          : <span className="text-xs text-blue-500">💧</span>}
                      </td>
                      <td className="px-4 py-3 text-end font-semibold text-gray-800">
                        {fmt(r.value)} <span className="text-xs text-gray-400">{unit}</span>
                      </td>
                      <td className="px-4 py-3 text-end text-gray-600">
                        {r.consumption !== null ? `+${r.consumption}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {r.anomaly
                          ? <AlertTriangle size={16} className="text-red-500 inline" />
                          : <CheckCircle size={16} className="text-green-500 inline" />}
                      </td>
                      <td className="px-4 py-3 text-end text-gray-400 text-xs hidden sm:table-cell">
                        {new Date(r.date).toLocaleDateString(
                          lang === "fr" ? "fr-MA" : "ar-MA",
                          { day: "2-digit", month: "short", year: "numeric" }
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
