"use client";

import { useState } from "react";
import { FileText, Download, Calendar, TrendingUp } from "lucide-react";

const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

export function ReportsClient() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [loading, setLoading] = useState(false);

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

  async function downloadReport() {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/monthly?year=${year}&month=${month}`);
      if (!res.ok) { alert("Erreur lors de la génération du rapport"); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `orchidees2-rapport-${year}-${String(month).padStart(2, "0")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  }

  async function downloadAnnualReport() {
    setLoading(true);
    try {
      // Generate 12 monthly reports and merge — for now open in tabs
      for (let m = 1; m <= 12; m++) {
        const url = `/api/reports/monthly?year=${year}&month=${m}`;
        window.open(url, "_blank");
        await new Promise((r) => setTimeout(r, 300));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Monthly report card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
            <FileText size={20} className="text-green-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Rapport mensuel</h2>
            <p className="text-xs text-gray-500">Relevés · Dépenses · Interventions · Ventes</p>
          </div>
        </div>

        <div className="flex gap-3 mb-5">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-600 mb-1">Mois</label>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {MONTHS.map((m, i) => (
                <option key={i + 1} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-600 mb-1">Année</label>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={downloadReport}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors text-sm"
        >
          <Download size={16} />
          {loading ? "Génération en cours…" : `Télécharger — ${MONTHS[month - 1]} ${year}`}
        </button>
      </div>

      {/* Annual report card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <TrendingUp size={20} className="text-blue-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Rapport annuel</h2>
            <p className="text-xs text-gray-500">12 rapports mensuels — un onglet par mois</p>
          </div>
        </div>

        <div className="mb-5">
          <label className="block text-xs font-medium text-gray-600 mb-1">Année</label>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <button
          onClick={downloadAnnualReport}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors text-sm"
        >
          <Calendar size={16} />
          {loading ? "Ouverture des rapports…" : `Générer les 12 mois — ${year}`}
        </button>
      </div>

      {/* Info card */}
      <div className="bg-green-50 rounded-2xl border border-green-100 p-4">
        <p className="text-xs text-green-700 font-medium mb-1">Contenu des rapports</p>
        <ul className="text-xs text-green-600 space-y-0.5 list-disc list-inside">
          <li>Résumé KPI du mois (relevés, dépenses, interventions, ventes)</li>
          <li>Tableau des relevés compteurs avec détection d&apos;anomalies</li>
          <li>Liste des dépenses par catégorie</li>
          <li>Interventions techniques</li>
          <li>Ventes immobilières et distribution 25% entre copropriétaires</li>
        </ul>
      </div>
    </div>
  );
}
