"use client";
import { useState, useTransition, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { fmt } from "@/lib/fmt";
import { useLang } from "@/contexts/LangContext";
import {
  createPrestataire, updatePrestataire, deletePrestataire,
} from "@/actions/prestataires";
import { UploadZone, DocGallery, DOC_CATS } from "./UploadZone";
import {
  Hammer, Plus, X, Pencil, Trash2, Phone, Star, Search,
  FileText, Calendar, Shield, Mail, LayoutList, Download,
  ThumbsUp, AlertTriangle, BadgeCheck, FolderOpen,
} from "lucide-react";

// ─── Métiers ──────────────────────────────────────────────────────────────────

const METIERS = [
  { key: "ELECTRICITE",               fr: "Électricité",                ar: "الكهرباء" },
  { key: "PLOMBERIE_SANITAIRE",       fr: "Plomberie / Sanitaire",      ar: "السباكة / الصرف الصحي" },
  { key: "CLIMATISATION_VENTILATION", fr: "Climatisation / Ventilation",ar: "التكييف / التهوية" },
  { key: "MENUISERIE_BOIS",           fr: "Menuiserie Bois",            ar: "النجارة الخشبية" },
  { key: "MENUISERIE_ALUMINIUM",      fr: "Menuiserie Aluminium",       ar: "نجارة الألومنيوم" },
  { key: "FERRONNERIE_SERRURERIE",    fr: "Ferronnerie / Serrurerie",   ar: "الحدادة / الأقفال" },
  { key: "MACONNERIE",                fr: "Maçonnerie",                 ar: "البناء والمداميك" },
  { key: "BETON_COFFRAGE",            fr: "Béton / Coffrage",           ar: "الخرسانة / القوالب" },
  { key: "CARRELAGE_REVETEMENT",      fr: "Carrelage / Revêtement",     ar: "البلاط / الأرضيات" },
  { key: "PEINTURE_BATIMENT",         fr: "Peinture Bâtiment",          ar: "دهن المبنى" },
  { key: "PLATRERIE_ENDUIT",          fr: "Plâtrerie / Enduit",         ar: "الجبس / الطلاء" },
  { key: "TERRASSEMENT",              fr: "Terrassement",               ar: "أعمال الحفر" },
  { key: "ETANCHEITE_ISOLATION",      fr: "Étanchéité / Isolation",     ar: "العزل المائي / الحراري" },
  { key: "ASCENSEUR",                 fr: "Ascenseur",                  ar: "المصعد" },
  { key: "GEOMETRE",                  fr: "Géomètre Expert",            ar: "المساح الخبير" },
  { key: "INGENIEUR_GENIE_CIVIL",     fr: "Ingénieur Génie Civil",      ar: "مهندس البناء" },
  { key: "BUREAU_CONTROLE",           fr: "Bureau Contrôle",            ar: "مكتب المراقبة" },
  { key: "TOPOGRAPHIE",               fr: "Topographie",                ar: "الطبوغرافيا" },
  { key: "SECURITE_INCENDIE",         fr: "Sécurité Incendie",          ar: "الحماية من الحرائق" },
  { key: "ESPACES_VERTS",             fr: "Espaces Verts",              ar: "المساحات الخضراء" },
  { key: "NETTOYAGE_CHANTIER",        fr: "Nettoyage Chantier",         ar: "تنظيف الورشة" },
  { key: "TRANSPORT_LIVRAISON",       fr: "Transport / Livraison",      ar: "النقل / التوصيل" },
  { key: "LOCATION_ENGINS",           fr: "Location Engins",            ar: "تأجير المعدات" },
  { key: "FOURNISSEUR_MATERIAUX",     fr: "Fournisseur Matériaux",      ar: "مورد المواد" },
  { key: "ARCHITECTE",                fr: "Architecte",                 ar: "المهندس المعماري" },
  { key: "NOTAIRE",                   fr: "Notaire",                    ar: "موثق عدل" },
  { key: "VENDEUR_TERRAIN",           fr: "Vendeur Terrain",            ar: "بائع الأرض" },
  { key: "ORGANISME_URBANISME",       fr: "Organisme Urbanisme",        ar: "هيئة التعمير" },
  { key: "AUTRE",                     fr: "Autre Métier",               ar: "مهنة أخرى" },
] as const;
type MetierKey = typeof METIERS[number]["key"];

// ─── Icônes & couleurs par métier ─────────────────────────────────────────────

const METIER_ICONS: Record<MetierKey, { emoji: string; bg: string; color: string }> = {
  ELECTRICITE:               { emoji: "⚡", bg: "#fef3c7", color: "#d97706" },
  PLOMBERIE_SANITAIRE:       { emoji: "🔧", bg: "#dbeafe", color: "#2563eb" },
  CLIMATISATION_VENTILATION: { emoji: "❄️", bg: "#e0f2fe", color: "#0284c7" },
  MENUISERIE_BOIS:           { emoji: "🪚", bg: "#fef9c3", color: "#a16207" },
  MENUISERIE_ALUMINIUM:      { emoji: "🪟", bg: "#f1f5f9", color: "#475569" },
  FERRONNERIE_SERRURERIE:    { emoji: "⚙️", bg: "#f3f4f6", color: "#4b5563" },
  MACONNERIE:                { emoji: "🧱", bg: "#fef2f2", color: "#b45309" },
  BETON_COFFRAGE:            { emoji: "🏗️", bg: "#f8fafc", color: "#64748b" },
  CARRELAGE_REVETEMENT:      { emoji: "🔲", bg: "#ecfdf5", color: "#059669" },
  PEINTURE_BATIMENT:         { emoji: "🎨", bg: "#fdf4ff", color: "#9333ea" },
  PLATRERIE_ENDUIT:          { emoji: "🏛️", bg: "#fff7ed", color: "#c2410c" },
  TERRASSEMENT:              { emoji: "🚜", bg: "#fefce8", color: "#ca8a04" },
  ETANCHEITE_ISOLATION:      { emoji: "🛡️", bg: "#eff6ff", color: "#3b82f6" },
  ASCENSEUR:                 { emoji: "🔼", bg: "#f0fdf4", color: "#16a34a" },
  GEOMETRE:                  { emoji: "📐", bg: "#fdf2f8", color: "#ec4899" },
  INGENIEUR_GENIE_CIVIL:     { emoji: "🏛️", bg: "#f8fafc", color: "#334155" },
  BUREAU_CONTROLE:           { emoji: "🔍", bg: "#fefce8", color: "#854d0e" },
  TOPOGRAPHIE:               { emoji: "🗺️", bg: "#ecfdf5", color: "#065f46" },
  SECURITE_INCENDIE:         { emoji: "🚒", bg: "#fff1f2", color: "#e11d48" },
  ESPACES_VERTS:             { emoji: "🌿", bg: "#f0fdf4", color: "#15803d" },
  NETTOYAGE_CHANTIER:        { emoji: "🧹", bg: "#f9fafb", color: "#6b7280" },
  TRANSPORT_LIVRAISON:       { emoji: "🚛", bg: "#fff7ed", color: "#ea580c" },
  LOCATION_ENGINS:           { emoji: "🏗️", bg: "#fefce8", color: "#d97706" },
  FOURNISSEUR_MATERIAUX:     { emoji: "📦", bg: "#eff6ff", color: "#2563eb" },
  ARCHITECTE:                { emoji: "✏️", bg: "#fdf4ff", color: "#7c3aed" },
  NOTAIRE:                   { emoji: "⚖️", bg: "#f8fafc", color: "#1e293b" },
  VENDEUR_TERRAIN:           { emoji: "🏞️", bg: "#f0fdf4", color: "#15803d" },
  ORGANISME_URBANISME:       { emoji: "🏢", bg: "#eff6ff", color: "#1d4ed8" },
  AUTRE:                     { emoji: "🔨", bg: "#f9fafb", color: "#6b7280" },
};

// ─── Champs spécifiques par métier ────────────────────────────────────────────

type EF = { key: string; fr: string; ar: string; type: "text" | "date" | "select" | "number"; options?: string[] };

const METIER_EXTRA: Partial<Record<MetierKey, EF[]>> = {
  ELECTRICITE: [
    { key: "agrement",        fr: "Agrément ONEE N°",                    ar: "رقم ترخيص ONEE",               type: "text" },
    { key: "agrementDate",    fr: "Date obtention agrément",              ar: "تاريخ الحصول على الترخيص",     type: "date" },
    { key: "puissanceAuth",   fr: "Puissance autorisée (kW)",             ar: "القدرة المرخصة (كيلواط)",      type: "text" },
    { key: "typeTravaux",     fr: "Type travaux",                         ar: "نوع الأعمال",                  type: "select", options: ["Tableau général", "Colonnes montantes", "Appartements", "Parties communes", "Éclairage", "Mixte"] },
    { key: "habilitation",    fr: "Habilitation électrique",              ar: "التأهيل الكهربائي",             type: "text" },
  ],
  PLOMBERIE_SANITAIRE: [
    { key: "agrementEau",     fr: "Agrément ONEE eau N°",                 ar: "رقم ترخيص ONEE للماء",         type: "text" },
    { key: "typeTravaux",     fr: "Type travaux",                         ar: "نوع الأعمال",                  type: "select", options: ["Colonnes montantes", "Appartements", "Parties communes", "Toiture", "Tout"] },
    { key: "marquesEquip",    fr: "Marques équipements posés",            ar: "ماركات المعدات المركبة",        type: "text" },
    { key: "habGaz",          fr: "Habilitation gaz",                     ar: "ترخيص الغاز",                  type: "text" },
  ],
  CLIMATISATION_VENTILATION: [
    { key: "agrementFrigo",   fr: "Agrément frigoriste N°",               ar: "رقم ترخيص التبريد",            type: "text" },
    { key: "marque",          fr: "Marque unités",                        ar: "ماركة الوحدات",                 type: "text" },
    { key: "modele",          fr: "Modèle unités",                        ar: "موديل الوحدات",                 type: "text" },
    { key: "fluide",          fr: "Type fluide frigorigène",              ar: "نوع المبرد",                    type: "select", options: ["R32", "R410A", "R407C", "R134a", "R600a", "Autre"] },
    { key: "contratMaint",    fr: "N° contrat maintenance annuelle",       ar: "رقم عقد الصيانة السنوية",      type: "text" },
    { key: "prochaineRev",    fr: "Date prochaine révision",              ar: "تاريخ المراجعة القادمة",        type: "date" },
  ],
  MENUISERIE_BOIS: [
    { key: "essenceBois",     fr: "Essence bois utilisée",                ar: "نوع الخشب",                    type: "text" },
    { key: "typeTravaux",     fr: "Type travaux",                         ar: "نوع الأعمال",                  type: "select", options: ["Portes", "Fenêtres", "Placards", "Escaliers", "Mixte"] },
    { key: "traitement",      fr: "Traitement appliqué",                  ar: "المعالجة المطبقة",              type: "select", options: ["Lasure", "Vernis", "Peinture", "Huile", "Sans traitement"] },
  ],
  MENUISERIE_ALUMINIUM: [
    { key: "marqueProfile",   fr: "Marque profilés (Technal, Wicona…)",   ar: "ماركة البروفيل",               type: "text" },
    { key: "couleurRAL",      fr: "Couleur RAL",                          ar: "لون RAL",                      type: "text" },
    { key: "typeVitrage",     fr: "Type vitrage",                         ar: "نوع الزجاج",                   type: "select", options: ["Simple", "Double", "Feuilleté", "Trempé", "Réfléchissant"] },
    { key: "typeTravaux",     fr: "Type travaux",                         ar: "نوع الأعمال",                  type: "select", options: ["Façade", "Fenêtres", "Portes", "Garde-corps", "Verrière", "Mixte"] },
    { key: "ruptePont",       fr: "Rupture pont thermique",               ar: "قطع الجسر الحراري",            type: "select", options: ["Oui", "Non"] },
  ],
  FERRONNERIE_SERRURERIE: [
    { key: "typeMetal",       fr: "Type métal",                           ar: "نوع المعدن",                   type: "select", options: ["Fer forgé", "Acier inox", "Acier galvanisé", "Aluminium"] },
    { key: "typeTravaux",     fr: "Type travaux",                         ar: "نوع الأعمال",                  type: "select", options: ["Portail", "Grilles", "Escalier", "Garde-corps", "Serrures", "Mixte"] },
    { key: "traitAntiCorr",   fr: "Traitement anticorrosion",             ar: "معالجة مضادة للصدأ",           type: "select", options: ["Galvanisation", "Thermolaquage", "Peinture époxy", "Métallisation", "Inox massif"] },
  ],
  MACONNERIE: [
    { key: "typeTravaux",     fr: "Type travaux",                         ar: "نوع الأعمال",                  type: "select", options: ["Murs porteurs", "Cloisons", "Rebouchage", "Démolition", "Tout"] },
    { key: "materiaux",       fr: "Matériaux utilisés",                   ar: "المواد المستخدمة",             type: "select", options: ["Briques", "Parpaings", "Pierre", "BTC", "Mixte"] },
  ],
  BETON_COFFRAGE: [
    { key: "typeBeton",       fr: "Type béton",                           ar: "نوع الخرسانة",                 type: "select", options: ["Armé", "Précontraint", "Banché", "Autoplaçant"] },
    { key: "resistance",      fr: "Résistance (B25, B30…)",               ar: "مقاومة الخرسانة",              type: "select", options: ["B20", "B25", "B30", "B35", "B40"] },
    { key: "volumeCoule",     fr: "Volume coulé (m³)",                    ar: "الحجم المصبوب (م³)",           type: "number" },
    { key: "typesCoffrage",   fr: "Type coffrage",                        ar: "نوع القوالب",                  type: "select", options: ["Bois", "Métal", "Tunnel", "Mixte"] },
  ],
  CARRELAGE_REVETEMENT: [
    { key: "marqueCarrelage", fr: "Marque carrelage",                     ar: "ماركة البلاط",                 type: "text" },
    { key: "format",          fr: "Format (ex : 60×60 cm)",               ar: "القياس (مثال: 60×60 سم)",      type: "text" },
    { key: "typePose",        fr: "Type pose",                            ar: "نوع التركيب",                  type: "select", options: ["Sol", "Mur", "Terrasse", "Piscine", "Façade"] },
    { key: "surface",         fr: "Surface posée (m²)",                   ar: "المساحة المركبة (م²)",         type: "number" },
  ],
  PEINTURE_BATIMENT: [
    { key: "marquesPeinture", fr: "Marque peinture (Riad, Imi, Astral…)", ar: "ماركة الطلاء",                 type: "text" },
    { key: "typeTravaux",     fr: "Type travaux",                         ar: "نوع الأعمال",                  type: "select", options: ["Intérieure", "Extérieure", "Façade", "Imperméabilisant", "Anti-corrosion"] },
    { key: "surface",         fr: "Surface peinte (m²)",                  ar: "المساحة المطلية (م²)",         type: "number" },
    { key: "nbCouches",       fr: "Nombre de couches",                    ar: "عدد الطبقات",                  type: "text" },
  ],
  PLATRERIE_ENDUIT: [
    { key: "typePlâtre",      fr: "Type plâtre / enduit",                 ar: "نوع الجبس / الطلاء",           type: "select", options: ["Plâtre traditionnel", "Placo-plâtre", "Enduit ciment", "Faux plafond", "Staff"] },
    { key: "surface",         fr: "Surface (m²)",                         ar: "المساحة (م²)",                 type: "number" },
    { key: "isolation",       fr: "Doublage isolant",                     ar: "العزل المزدوج",                 type: "select", options: ["Oui", "Non"] },
  ],
  TERRASSEMENT: [
    { key: "typeSol",         fr: "Type sol",                             ar: "نوع التربة",                   type: "select", options: ["Rocheux", "Argileux", "Sableux", "Mixte"] },
    { key: "volume",          fr: "Volume terrassé (m³)",                 ar: "حجم الحفر (م³)",               type: "number" },
    { key: "profondeur",      fr: "Profondeur fouilles (m)",              ar: "عمق الحفر (م)",                 type: "number" },
    { key: "typeEngins",      fr: "Type engins (pelle, bulldozer…)",      ar: "نوع المعدات",                  type: "text" },
    { key: "societeTransport",fr: "Société transport déblais",            ar: "شركة نقل التراب",               type: "text" },
    { key: "destination",     fr: "Destination déblais",                  ar: "وجهة التراب المنقول",          type: "text" },
  ],
  ETANCHEITE_ISOLATION: [
    { key: "typeEtanche",     fr: "Type étanchéité",                      ar: "نوع العزل المائي",              type: "select", options: ["Bitume", "Membrane", "Liquide", "Tuile", "Polyuréthane", "Autre"] },
    { key: "produitRef",      fr: "Marque produit + référence",           ar: "ماركة المنتج + المرجع",         type: "text" },
    { key: "surface",         fr: "Surface traitée (m²)",                 ar: "المساحة المعالجة (م²)",        type: "number" },
    { key: "epaisseurIso",    fr: "Épaisseur isolation (cm)",             ar: "سماكة العزل (سم)",             type: "number" },
    { key: "garantieEtanche", fr: "Garantie étanchéité (années)",         ar: "ضمان العزل (سنوات)",           type: "text" },
    { key: "prochaineVisite", fr: "Date prochain contrôle",               ar: "تاريخ المراقبة القادمة",       type: "date" },
  ],
  ASCENSEUR: [
    { key: "marque",          fr: "Marque ascenseur",                     ar: "ماركة المصعد",                 type: "text" },
    { key: "modele",          fr: "Modèle",                               ar: "الموديل",                      type: "text" },
    { key: "numSerie",        fr: "N° de série",                          ar: "الرقم التسلسلي",               type: "text" },
    { key: "capacitePersonnes",fr: "Capacité (personnes)",                ar: "السعة (أشخاص)",                type: "text" },
    { key: "capaciteKg",      fr: "Capacité (kg)",                        ar: "السعة (كيلوغرام)",             type: "text" },
    { key: "vitesse",         fr: "Vitesse (m/s)",                        ar: "السرعة (م/ث)",                  type: "text" },
    { key: "numAgrement",     fr: "N° agrément",                          ar: "رقم الاعتماد",                  type: "text" },
    { key: "dateMiseEnService",fr: "Date mise en service",                ar: "تاريخ الوضع في الخدمة",        type: "date" },
    { key: "societeMaint",    fr: "Société maintenance",                  ar: "شركة الصيانة",                  type: "text" },
    { key: "contratMaint",    fr: "N° contrat maintenance",               ar: "رقم عقد الصيانة",               type: "text" },
    { key: "prochaineRev",    fr: "Date prochaine révision obligatoire",  ar: "تاريخ المراجعة الإلزامية",     type: "date" },
  ],
  GEOMETRE: [
    { key: "numOrdre",        fr: "N° Ordre Géomètres Experts Maroc",     ar: "رقم هيئة المساحين الخبراء",    type: "text" },
    { key: "typeMission",     fr: "Type mission",                         ar: "نوع المهمة",                   type: "select", options: ["Bornage", "Morcellement", "Règlement de copropriété", "Levé topographique", "Division parcellaire"] },
    { key: "numRequisition",  fr: "N° réquisition conservation foncière", ar: "رقم طلب المحافظة العقارية",    type: "text" },
  ],
  INGENIEUR_GENIE_CIVIL: [
    { key: "numOrdre",        fr: "N° Ordre Ingénieurs Maroc",            ar: "رقم هيئة المهندسين",           type: "text" },
    { key: "specialiteIng",   fr: "Spécialité",                           ar: "التخصص",                       type: "select", options: ["Béton armé", "Charpente métallique", "Fondations", "Parasismique", "VRD", "Géotechnique"] },
    { key: "mission",         fr: "Mission",                              ar: "المهمة",                       type: "select", options: ["Étude", "Calcul", "Suivi chantier", "Réception", "Expertise"] },
    { key: "assurance",       fr: "Assurance RC N°",                      ar: "رقم تأمين المسؤولية",          type: "text" },
  ],
  BUREAU_CONTROLE: [
    { key: "numAgrement",     fr: "N° Agrément Ministère Habitat",        ar: "رقم اعتماد وزارة الإسكان",    type: "text" },
    { key: "organisme",       fr: "Organisme",                            ar: "الجهة",                        type: "select", options: ["SOCOTEC", "VERITAS", "DEKRA", "APAVE", "COPREC", "Autre"] },
    { key: "mission",         fr: "Mission (L, LP, LE, S, T, F, Ph…)",   ar: "المهمة",                       type: "select", options: ["L", "LP", "LE", "S", "T", "F", "Ph", "G", "Global"] },
    { key: "assurance",       fr: "Assurance RC N°",                      ar: "رقم تأمين المسؤولية",          type: "text" },
  ],
  TOPOGRAPHIE: [
    { key: "typeMission",     fr: "Type mission",                         ar: "نوع المهمة",                   type: "select", options: ["Nivellement", "Implantation", "Plan de masse", "Plan topographique", "Relevé façades"] },
    { key: "logiciel",        fr: "Logiciel utilisé (AutoCAD, etc.)",     ar: "البرنامج المستخدم",             type: "text" },
    { key: "numAgrement",     fr: "N° agrément",                          ar: "رقم الاعتماد",                  type: "text" },
  ],
  SECURITE_INCENDIE: [
    { key: "typeEquipements", fr: "Type équipements installés",           ar: "نوع المعدات المركبة",           type: "select", options: ["Extincteurs", "Détecteurs fumée", "Sprinklers", "Désenfumage", "RIA", "Colonnes sèches", "Alarme incendie", "Global"] },
    { key: "numAgrementInst", fr: "N° agrément installateur",             ar: "رقم ترخيص المركب",              type: "text" },
    { key: "organismeVerif",  fr: "Organisme vérification",               ar: "هيئة التحقق",                  type: "text" },
    { key: "dateInstallation",fr: "Date installation",                    ar: "تاريخ التركيب",                 type: "date" },
    { key: "prochaineVisite", fr: "Date prochain contrôle obligatoire",   ar: "تاريخ المراقبة الإلزامية",     type: "date" },
    { key: "numRapport",      fr: "N° rapport contrôle",                  ar: "رقم تقرير المراقبة",           type: "text" },
  ],
  ESPACES_VERTS: [
    { key: "typeVegetaux",    fr: "Type végétaux plantés",                ar: "نوع النباتات",                 type: "text" },
    { key: "surface",         fr: "Surface (m²)",                         ar: "المساحة (م²)",                 type: "number" },
    { key: "arrosage",        fr: "Système arrosage",                     ar: "نظام الري",                    type: "select", options: ["Automatique", "Manuel", "Mixte"] },
    { key: "contratEntretien",fr: "Contrat entretien",                    ar: "عقد الصيانة",                  type: "select", options: ["Oui", "Non"] },
    { key: "frequence",       fr: "Fréquence entretien",                  ar: "تكرار الصيانة",                type: "text" },
  ],
  NETTOYAGE_CHANTIER: [
    { key: "frequencePassages",fr: "Fréquence passages",                  ar: "تكرار المرور",                 type: "text" },
    { key: "volumeDechets",   fr: "Volume déchets évacués (m³)",          ar: "حجم النفايات المنقولة (م³)",   type: "number" },
    { key: "centreTrait",     fr: "Centre traitement déchets",            ar: "مركز معالجة النفايات",         type: "text" },
    { key: "triSelectif",     fr: "Tri sélectif",                         ar: "الفرز الانتقائي",               type: "select", options: ["Oui", "Non"] },
  ],
  TRANSPORT_LIVRAISON: [
    { key: "typeVehicules",   fr: "Type véhicules",                       ar: "نوع المركبات",                 type: "select", options: ["Camion", "Grue", "Nacelle", "Semi-remorque", "Camionnette", "Mixte"] },
    { key: "immatriculations",fr: "Immatriculations",                     ar: "أرقام التسجيل",                type: "text" },
    { key: "typeMarchandises",fr: "Types marchandises transportées",      ar: "أنواع البضائع المنقولة",       type: "text" },
    { key: "numAssurance",    fr: "N° assurance transport",               ar: "رقم تأمين النقل",              type: "text" },
  ],
  LOCATION_ENGINS: [
    { key: "typeEngins",      fr: "Type engins loués",                    ar: "نوع المعدات المستأجرة",        type: "text" },
    { key: "dureeLocation",   fr: "Durée location (jours)",               ar: "مدة الاستئجار (أيام)",         type: "number" },
    { key: "coutJournalier",  fr: "Coût journalier (MAD)",                ar: "التكلفة اليومية (درهم)",       type: "number" },
    { key: "societeProprietaire",fr: "Société propriétaire des engins",   ar: "شركة مالكة المعدات",           type: "text" },
    { key: "numAssurance",    fr: "N° assurance engins",                  ar: "رقم تأمين المعدات",            type: "text" },
  ],
  FOURNISSEUR_MATERIAUX: [
    { key: "categorie",       fr: "Catégorie matériaux",                  ar: "فئة المواد",                   type: "select", options: ["Ciment", "Fer", "Bois", "Carrelage", "Sanitaire", "Peinture", "Isolation", "Électricité", "Plomberie", "Mixte", "Autre"] },
    { key: "marquesFournies", fr: "Marques fournies",                     ar: "الماركات المقدمة",              type: "text" },
    { key: "volumeQte",       fr: "Volume / Quantité livrée",             ar: "الكمية المسلمة",               type: "text" },
    { key: "conditionsPaiement",fr: "Conditions paiement",               ar: "شروط الدفع",                   type: "text" },
  ],
  ARCHITECTE: [
    { key: "numOrdre",        fr: "N° Ordre Architectes Maroc",           ar: "رقم هيئة المعماريين المغرب",   type: "text" },
    { key: "dplg",            fr: "DPLG / Diplôme d'État",                ar: "DPLG / دبلوم الدولة",          type: "select", options: ["Oui", "Non"] },
    { key: "cabinet",         fr: "Cabinet d'architecture",               ar: "مكتب الهندسة المعمارية",       type: "text" },
    { key: "mission",         fr: "Mission",                              ar: "المهمة",                       type: "select", options: ["Avant-projet", "Projet", "Permis construire", "Suivi chantier", "Réception", "Tout"] },
    { key: "assurance",       fr: "Assurance RC N°",                      ar: "رقم تأمين المسؤولية",          type: "text" },
  ],
  NOTAIRE: [
    { key: "numEtude",        fr: "N° Étude notariale",                   ar: "رقم مكتب التوثيق",             type: "text" },
    { key: "barreau",         fr: "Barreau (ville)",                      ar: "المجلس (المدينة)",             type: "text" },
    { key: "typeActes",       fr: "Type actes rédigés",                   ar: "نوع العقود المحررة",           type: "select", options: ["Vente terrain", "Compromis vente", "Acte définitif", "Copropriété", "Hypothèque", "Autre"] },
    { key: "honoraires",      fr: "Honoraires (MAD)",                     ar: "أتعاب التوثيق (درهم)",         type: "number" },
  ],
  VENDEUR_TERRAIN: [
    { key: "typeVendeur",     fr: "Type vendeur",                         ar: "نوع البائع",                   type: "select", options: ["Particulier", "Société"] },
    { key: "cin",             fr: "CIN (si particulier)",                 ar: "رقم البطاقة الوطنية",          type: "text" },
    { key: "dateNaissance",   fr: "Date naissance (si particulier)",      ar: "تاريخ الميلاد",                type: "date" },
    { key: "rcSociete",       fr: "RC société",                           ar: "سجل الشركة التجاري",           type: "text" },
    { key: "ifSociete",       fr: "IF société",                           ar: "المعرف الجبائي للشركة",        type: "text" },
    { key: "iceSociete",      fr: "ICE société",                          ar: "الرقم التعريفي الموحد للشركة", type: "text" },
    { key: "representantLegal",fr: "Représentant légal",                  ar: "الممثل القانوني",              type: "text" },
    { key: "numTF",           fr: "N° Titre Foncier (TF)",               ar: "رقم الرسم العقاري",             type: "text" },
    { key: "superficieTerrain",fr: "Superficie terrain (m²)",            ar: "مساحة الأرض (م²)",             type: "number" },
    { key: "prixVente",       fr: "Prix vente (MAD)",                    ar: "سعر البيع (درهم)",             type: "number" },
    { key: "dateCompromis",   fr: "Date compromis de vente",              ar: "تاريخ مذكرة التفاهم",          type: "date" },
    { key: "dateActeDefinitif",fr: "Date acte définitif",                ar: "تاريخ العقد النهائي",           type: "date" },
    { key: "notaireInstrumentaire",fr: "Notaire instrumentaire",         ar: "الموثق المحرر",                 type: "text" },
  ],
  ORGANISME_URBANISME: [
    { key: "nomOrganisme",    fr: "Nom organisme",                        ar: "اسم الهيئة",                   type: "select", options: ["Agence Urbaine", "Commune", "Wilaya", "Arrondissement", "Ministère Habitat", "ONEE", "Conservation Foncière", "Autre"] },
    { key: "interlocuteur",   fr: "Interlocuteur",                        ar: "المتعامل معه",                  type: "text" },
    { key: "telOrg",          fr: "Téléphone",                            ar: "الهاتف",                       type: "text" },
    { key: "emailOrg",        fr: "Email",                                ar: "البريد الإلكتروني",             type: "text" },
    { key: "typeDossier",     fr: "Type dossier",                         ar: "نوع الملف",                    type: "select", options: ["Permis construire", "Autorisation lotir", "Certificat conformité", "Licence habiter", "Branchement eau", "Branchement élec", "Titre foncier", "Autre"] },
    { key: "numDossier",      fr: "N° dossier",                           ar: "رقم الملف",                    type: "text" },
    { key: "dateDepot",       fr: "Date dépôt dossier",                   ar: "تاريخ إيداع الملف",            type: "date" },
    { key: "dateObtentionPrevue",fr: "Date obtention prévue",             ar: "التاريخ المتوقع للحصول",       type: "date" },
    { key: "dateObtentionReelle",fr: "Date obtention réelle",             ar: "التاريخ الفعلي للحصول",        type: "date" },
    { key: "statutDossier",   fr: "Statut dossier",                       ar: "حالة الملف",                   type: "select", options: ["En attente", "Obtenu", "Refusé", "Expiré", "En cours traitement"] },
  ],
};

// ─── Autres constantes ────────────────────────────────────────────────────────

const ZONES = [
  { key: "SS1",      fr: "Sous-sol 1",   ar: "القبو 1" },
  { key: "SS2",      fr: "Sous-sol 2",   ar: "القبو 2" },
  { key: "RDC",      fr: "RDC",          ar: "الطابق الأرضي" },
  { key: "ETAGE_1",  fr: "Étage 1",      ar: "الطابق 1" },
  { key: "ETAGE_2",  fr: "Étage 2",      ar: "الطابق 2" },
  { key: "ETAGE_3",  fr: "Étage 3",      ar: "الطابق 3" },
  { key: "ETAGE_4",  fr: "Étage 4",      ar: "الطابق 4" },
  { key: "TERRASSE", fr: "Terrasse",      ar: "السطح" },
];
const STATUTS = [
  { key: "EN_COURS", fr: "En cours", ar: "جارٍ",  bg: "#dbeafe", text: "#1d4ed8" },
  { key: "TERMINE",  fr: "Terminé",  ar: "منجز",  bg: "#dcfce7", text: "#15803d" },
  { key: "GARANTIE", fr: "Garantie", ar: "ضمان",  bg: "#fef9c3", text: "#a16207" },
  { key: "LITIGE",   fr: "Litige",   ar: "نزاع",  bg: "#fee2e2", text: "#dc2626" },
  { key: "CLOTURE",  fr: "Clôturé",  ar: "مغلق",  bg: "#f3f4f6", text: "#6b7280" },
];
// DOC_TYPES handled by UploadZone component

// ─── Types ────────────────────────────────────────────────────────────────────

interface PDoc { id: string; title: string; url: string; type: string; createdAt: string; }
interface PRow {
  id: string; metier: MetierKey; metierLibre: string | null;
  nomSociete: string; responsable: string | null; telephone: string | null;
  whatsapp: string | null; email: string | null; adresse: string | null;
  rc: string | null; identifiantFiscal: string | null; specialite: string | null;
  zonesIntervention: string | null; montantMarche: number | null; montantPaye: number | null;
  dateDebut: string | null; dateFin: string | null; statut: string;
  noteSatisfaction: number | null; garantieDuree: string | null; garantieExpiration: string | null;
  notes: string | null; metierData: string | null; autresMetiers: string | null;
  recommande: boolean | null; blackliste: boolean | null;
  documents: PDoc[]; createdAt: string;
}
interface Stats { total: number; enCours: number; termines: number; totalMarche: number; totalPaye: number; }

// ─── Styles ───────────────────────────────────────────────────────────────────

const inp: React.CSSProperties = { width: "100%", border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" };
const sel: React.CSSProperties = { ...inp, background: "white", cursor: "pointer" };
function STitle({ t }: { t: string }) {
  return <p style={{ fontSize: 11, fontWeight: 700, color: "#16a34a", textTransform: "uppercase", letterSpacing: "0.08em", paddingBottom: 5, borderBottom: "1px solid #dcfce7", marginBottom: 4 }}>{t}</p>;
}
function FLabel({ l }: { l: string }) {
  return <p style={{ fontSize: 12, fontWeight: 500, color: "#374151", marginBottom: 3 }}>{l}</p>;
}

// ─── Form default ─────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  metier: "ELECTRICITE" as MetierKey, metierLibre: "",
  nomSociete: "", responsable: "", telephone: "", whatsapp: "", email: "", adresse: "",
  rc: "", identifiantFiscal: "", specialite: "",
  zonesIntervention: [] as string[], autresMetiers: [] as string[],
  montantMarche: "", montantPaye: "",
  dateDebut: "", dateFin: "", statut: "EN_COURS",
  noteSatisfaction: 0, garantieDuree: "", garantieExpiration: "", notes: "",
  metierData: {} as Record<string, string>,
  recommande: false, blackliste: false,
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function PrestatairesClient({ prestataires, stats, userRole }: {
  prestataires: PRow[]; stats: Stats; userRole: string;
}) {
  const { isRtl } = useLang();
  const ar = isRtl;
  const canEdit = userRole === "ADMIN" || userRole === "MANAGER";
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [selectedMetier, setSelectedMetier] = useState<MetierKey | "TOUS">("ELECTRICITE");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [sortCol, setSortCol] = useState<string>("nomSociete");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3200);
  }

  function metierLabel(k: string) {
    const m = METIERS.find(x => x.key === k);
    return ar ? (m?.ar ?? k) : (m?.fr ?? k);
  }

  function openAdd() {
    const m = selectedMetier === "TOUS" ? "ELECTRICITE" : selectedMetier;
    setForm({ ...EMPTY_FORM, metier: m });
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(p: PRow) {
    setForm({
      metier: p.metier, metierLibre: p.metierLibre ?? "",
      nomSociete: p.nomSociete, responsable: p.responsable ?? "",
      telephone: p.telephone ?? "", whatsapp: p.whatsapp ?? "",
      email: p.email ?? "", adresse: p.adresse ?? "",
      rc: p.rc ?? "", identifiantFiscal: p.identifiantFiscal ?? "",
      specialite: p.specialite ?? "",
      zonesIntervention: p.zonesIntervention ? JSON.parse(p.zonesIntervention) : [],
      autresMetiers: p.autresMetiers ? JSON.parse(p.autresMetiers) : [],
      montantMarche: p.montantMarche !== null ? String(p.montantMarche) : "",
      montantPaye: p.montantPaye !== null ? String(p.montantPaye) : "",
      dateDebut: p.dateDebut ? p.dateDebut.substring(0, 10) : "",
      dateFin: p.dateFin ? p.dateFin.substring(0, 10) : "",
      statut: p.statut, noteSatisfaction: p.noteSatisfaction ?? 0,
      garantieDuree: p.garantieDuree ?? "",
      garantieExpiration: p.garantieExpiration ? p.garantieExpiration.substring(0, 10) : "",
      notes: p.notes ?? "",
      metierData: p.metierData ? JSON.parse(p.metierData) : {},
      recommande: p.recommande ?? false,
      blackliste: p.blackliste ?? false,
    });
    setEditingId(p.id);
    setShowForm(true);
  }

  const toggleZone = (k: string) => setForm(f => ({ ...f, zonesIntervention: f.zonesIntervention.includes(k) ? f.zonesIntervention.filter(z => z !== k) : [...f.zonesIntervention, k] }));
  const toggleAM = (k: string) => setForm(f => ({ ...f, autresMetiers: f.autresMetiers.includes(k) ? f.autresMetiers.filter(m => m !== k) : [...f.autresMetiers, k] }));
  const setEF = (key: string, val: string) => setForm(f => ({ ...f, metierData: { ...f.metierData, [key]: val } }));

  function handleSubmit() {
    if (!form.nomSociete.trim()) { showToast(ar ? "اسم الشركة مطلوب" : "Le nom est obligatoire", false); return; }
    const payload = {
      metier: form.metier,
      metierLibre: form.metier === "AUTRE" ? form.metierLibre || undefined : undefined,
      nomSociete: form.nomSociete.trim(),
      responsable: form.responsable || undefined, telephone: form.telephone || undefined,
      whatsapp: form.whatsapp || undefined, email: form.email || undefined,
      adresse: form.adresse || undefined, rc: form.rc || undefined,
      identifiantFiscal: form.identifiantFiscal || undefined,
      specialite: form.specialite || undefined,
      zonesIntervention: form.zonesIntervention,
      montantMarche: form.montantMarche ? parseFloat(form.montantMarche) : undefined,
      montantPaye: form.montantPaye ? parseFloat(form.montantPaye) : 0,
      dateDebut: form.dateDebut || undefined, dateFin: form.dateFin || undefined,
      statut: form.statut,
      noteSatisfaction: form.noteSatisfaction > 0 ? form.noteSatisfaction : undefined,
      garantieDuree: form.garantieDuree || undefined,
      garantieExpiration: form.garantieExpiration || undefined,
      notes: form.notes || undefined,
      metierData: Object.keys(form.metierData).length > 0 ? form.metierData : undefined,
      autresMetiers: form.autresMetiers.length > 0 ? form.autresMetiers : undefined,
      recommande: form.recommande,
      blackliste: form.blackliste,
    };
    startTransition(async () => {
      try {
        editingId ? await updatePrestataire(editingId, payload) : await createPrestataire(payload);
        setShowForm(false);
        showToast(ar ? "تم الحفظ" : "Enregistré ✓", true);
        router.refresh();
      } catch { showToast(ar ? "خطأ في الحفظ" : "Erreur", false); }
    });
  }

  function handleDelete(id: string) {
    if (!confirm(ar ? "حذف هذا المقاول؟" : "Supprimer ce prestataire ?")) return;
    startTransition(async () => {
      try {
        await deletePrestataire(id);
        if (expandedId === id) setExpandedId(null);
        showToast(ar ? "تم الحذف" : "Supprimé", true);
        router.refresh();
      } catch { showToast(ar ? "خطأ" : "Erreur", false); }
    });
  }

  function toggleSort(col: string) {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
  }

  // ── Derived ──
  const countByMetier = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of prestataires) {
      map[p.metier] = (map[p.metier] ?? 0) + 1;
      const am: string[] = p.autresMetiers ? JSON.parse(p.autresMetiers) : [];
      for (const m of am) map[m] = (map[m] ?? 0) + 1;
    }
    return map;
  }, [prestataires]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let list = prestataires.filter(p => {
      const matchSearch = !q
        || p.nomSociete.toLowerCase().includes(q)
        || (p.responsable ?? "").toLowerCase().includes(q)
        || (p.telephone ?? "").includes(q)
        || metierLabel(p.metier).toLowerCase().includes(q);
      if (!matchSearch) return false;
      if (selectedMetier === "TOUS") return true;
      const am: string[] = p.autresMetiers ? JSON.parse(p.autresMetiers) : [];
      return p.metier === selectedMetier || am.includes(selectedMetier);
    });
    // sort for table view
    list = [...list].sort((a, b) => {
      let va: string | number = "", vb: string | number = "";
      if (sortCol === "nomSociete")    { va = a.nomSociete.toLowerCase(); vb = b.nomSociete.toLowerCase(); }
      else if (sortCol === "metier")   { va = metierLabel(a.metier);      vb = metierLabel(b.metier); }
      else if (sortCol === "statut")   { va = a.statut;                   vb = b.statut; }
      else if (sortCol === "marche")   { va = a.montantMarche ?? 0;       vb = b.montantMarche ?? 0; }
      else if (sortCol === "paye")     { va = a.montantPaye ?? 0;         vb = b.montantPaye ?? 0; }
      else if (sortCol === "reste")    { va = (a.montantMarche ?? 0) - (a.montantPaye ?? 0); vb = (b.montantMarche ?? 0) - (b.montantPaye ?? 0); }
      else if (sortCol === "note")     { va = a.noteSatisfaction ?? 0;    vb = b.noteSatisfaction ?? 0; }
      const cmp = typeof va === "number" ? (va as number) - (vb as number) : String(va).localeCompare(String(vb));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [prestataires, selectedMetier, search, sortCol, sortDir]);

  // ── Export Excel ──
  const exportExcel = useCallback(() => {
    const rows = filtered.map(p => {
      const md: Record<string, string> = p.metierData ? JSON.parse(p.metierData) : {};
      const am: string[] = p.autresMetiers ? JSON.parse(p.autresMetiers) : [];
      const zones: string[] = p.zonesIntervention ? JSON.parse(p.zonesIntervention) : [];
      const sc = STATUTS.find(s => s.key === p.statut);
      return {
        [ar ? "الشركة" : "Société"]: p.nomSociete,
        [ar ? "المهنة" : "Métier"]: metierLabel(p.metier),
        [ar ? "مهن أخرى" : "Autres métiers"]: am.map(m => metierLabel(m)).join(", "),
        [ar ? "المسؤول" : "Responsable"]: p.responsable ?? "",
        [ar ? "الهاتف" : "Téléphone"]: p.telephone ?? "",
        "WhatsApp": p.whatsapp ?? "",
        "Email": p.email ?? "",
        [ar ? "العنوان" : "Adresse"]: p.adresse ?? "",
        "RC": p.rc ?? "",
        "IF": p.identifiantFiscal ?? "",
        [ar ? "الحالة" : "Statut"]: ar ? sc?.ar : sc?.fr,
        [ar ? "مناطق التدخل" : "Zones"]: zones.map(z => ZONES.find(x => x.key === z)?.[ar ? "ar" : "fr"]).join(", "),
        [ar ? "مبلغ السوق (MAD)" : "Marché (MAD)"]: p.montantMarche ?? "",
        [ar ? "المدفوع (MAD)" : "Payé (MAD)"]: p.montantPaye ?? 0,
        [ar ? "المتبقي (MAD)" : "Reste (MAD)"]: Math.max(0, (p.montantMarche ?? 0) - (p.montantPaye ?? 0)),
        [ar ? "التقييم" : "Note /5"]: p.noteSatisfaction ?? "",
        [ar ? "موصى به" : "Recommandé"]: p.recommande ? "Oui" : "Non",
        [ar ? "محظور" : "Blacklisté"]: p.blackliste ? "Oui" : "Non",
        ...(Object.fromEntries(
          (METIER_EXTRA[p.metier] ?? []).map(f => [ar ? f.ar : f.fr, md[f.key] ?? ""])
        )),
        [ar ? "ملاحظات" : "Notes"]: p.notes ?? "",
      };
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Prestataires");
    XLSX.writeFile(wb, `prestataires_${new Date().toISOString().slice(0,10)}.xlsx`);
  }, [filtered, ar]);

  const totalReste = stats.totalMarche - stats.totalPaye;
  const editingPrest = prestataires.find(p => p.id === editingId);
  const extraFields = METIER_EXTRA[form.metier] ?? [];

  function Stars({ n, size = 12 }: { n: number | null; size?: number }) {
    return <span style={{ display: "inline-flex", gap: 2 }}>{[1,2,3,4,5].map(i => <Star key={i} size={size} fill={i <= (n ?? 0) ? "#f59e0b" : "none"} stroke={i <= (n ?? 0) ? "#f59e0b" : "#d1d5db"} />)}</span>;
  }

  function SortTh({ col, label }: { col: string; label: string }) {
    const active = sortCol === col;
    return (
      <th onClick={() => toggleSort(col)} style={{ padding: "9px 12px", textAlign: ar ? "right" : "left", fontWeight: 600, color: active ? "#1d4ed8" : "#6b7280", borderBottom: "1px solid #e5e7eb", fontSize: 12, whiteSpace: "nowrap", cursor: "pointer", userSelect: "none" }}>
        {label}{" "}
        <span style={{ fontSize: 9, opacity: 0.6 }}>{active ? (sortDir === "asc" ? "▲" : "▼") : "⇅"}</span>
      </th>
    );
  }

  // ── Render ──
  return (
    <div dir={ar ? "rtl" : "ltr"} style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: "inherit", overflow: "hidden" }}>

      {toast && <div style={{ position: "fixed", top: 20, right: ar ? "auto" : 20, left: ar ? 20 : "auto", zIndex: 9999, background: toast.ok ? "#15803d" : "#dc2626", color: "white", padding: "10px 20px", borderRadius: 10, fontSize: 14, fontWeight: 500, boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}>{toast.msg}</div>}

      {/* KPI */}
      <div style={{ display: "flex", gap: 10, padding: "14px 20px 10px", flexWrap: "wrap", flexShrink: 0 }}>
        {[
          { l: ar ? "المقاولون" : "Total",            v: stats.total,                      c: "#1d4ed8", bg: "#dbeafe" },
          { l: ar ? "جارٍ" : "En cours",               v: stats.enCours,                    c: "#7c3aed", bg: "#ede9fe" },
          { l: ar ? "منجز" : "Terminés",                v: stats.termines,                   c: "#15803d", bg: "#dcfce7" },
          { l: ar ? "مجموع المشاريع" : "Total marchés", v: `${fmt(stats.totalMarche)} MAD`,  c: "#92400e", bg: "#fef3c7" },
          { l: ar ? "المدفوع" : "Total payé",           v: `${fmt(stats.totalPaye)} MAD`,    c: "#15803d", bg: "#dcfce7" },
          { l: ar ? "المتبقي" : "Reste",                v: `${fmt(totalReste)} MAD`,         c: "#dc2626", bg: "#fee2e2" },
        ].map(({ l, v, c, bg }) => (
          <div key={l} style={{ background: bg, borderRadius: 10, padding: "8px 14px", minWidth: 110 }}>
            <p style={{ fontSize: 10, color: c, fontWeight: 600, marginBottom: 1, textTransform: "uppercase" }}>{l}</p>
            <p style={{ fontSize: 16, fontWeight: 700, color: c }}>{v}</p>
          </div>
        ))}
      </div>

      {/* Main */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden", padding: "0 20px 20px", gap: 14 }}>

        {/* LEFT panel */}
        <div style={{ width: 248, flexShrink: 0, background: "white", borderRadius: 12, border: "1px solid #e5e7eb", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "10px 14px", borderBottom: "1px solid #f3f4f6" }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "flex", alignItems: "center", gap: 5 }}>
              <Hammer size={13} color="#4b5563" />{ar ? "تصفية بالمهنة" : "Corps de métier"}
            </p>
          </div>
          <div style={{ overflowY: "auto", flex: 1 }}>
            {/* Tous */}
            <button onClick={() => { setSelectedMetier("TOUS"); setExpandedId(null); }}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 14px", background: selectedMetier === "TOUS" ? "#f0fdf4" : "#f9fafb", borderLeft: selectedMetier === "TOUS" && !ar ? "3px solid #16a34a" : "3px solid transparent", borderRight: selectedMetier === "TOUS" && ar ? "3px solid #16a34a" : "3px solid transparent", borderTop: "none", borderBottom: "1px solid #e5e7eb", cursor: "pointer" }}>
              <span style={{ fontSize: 12.5, color: selectedMetier === "TOUS" ? "#15803d" : "#374151", fontWeight: selectedMetier === "TOUS" ? 700 : 500, display: "flex", alignItems: "center", gap: 6 }}>
                <LayoutList size={13} />{ar ? "الكل" : "Tous les prestataires"}
              </span>
              <span style={{ background: selectedMetier === "TOUS" ? "#16a34a" : "#e5e7eb", color: selectedMetier === "TOUS" ? "white" : "#6b7280", fontSize: 10, fontWeight: 700, borderRadius: 20, padding: "1px 7px" }}>{prestataires.length}</span>
            </button>
            {/* Liste métiers */}
            {METIERS.map(({ key, fr: mFr, ar: mAr }) => {
              const cnt = countByMetier[key] ?? 0;
              const active = selectedMetier === key;
              const icon = METIER_ICONS[key as MetierKey];
              return (
                <button key={key} onClick={() => { setSelectedMetier(key as MetierKey); setExpandedId(null); }}
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 12px", background: active ? "#f0fdf4" : "transparent", borderLeft: active && !ar ? "3px solid #16a34a" : "3px solid transparent", borderRight: active && ar ? "3px solid #16a34a" : "3px solid transparent", borderTop: "none", borderBottom: "1px solid #f9fafb", cursor: "pointer", gap: 6 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 7, flex: 1, minWidth: 0 }}>
                    <span style={{ width: 24, height: 24, borderRadius: 6, background: icon.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>{icon.emoji}</span>
                    <span style={{ fontSize: 12, color: active ? "#15803d" : "#374151", fontWeight: active ? 600 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: ar ? "right" : "left" }}>{ar ? mAr : mFr}</span>
                  </span>
                  {cnt > 0 && <span style={{ background: active ? "#16a34a" : "#e5e7eb", color: active ? "white" : "#6b7280", fontSize: 10, fontWeight: 700, borderRadius: 20, padding: "1px 6px", flexShrink: 0 }}>{cnt}</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT panel */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, gap: 8, flexWrap: "wrap" }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              {selectedMetier !== "TOUS" && (
                <span style={{ fontSize: 18 }}>{METIER_ICONS[selectedMetier].emoji}</span>
              )}
              {selectedMetier === "TOUS" ? (ar ? "جميع المقاولين" : "Tous les prestataires") : metierLabel(selectedMetier)}
              <span style={{ fontSize: 12, fontWeight: 400, color: "#9ca3af" }}>({filtered.length})</span>
            </h2>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ position: "relative" }}>
                <Search size={13} style={{ position: "absolute", top: "50%", left: ar ? "auto" : 9, right: ar ? 9 : "auto", transform: "translateY(-50%)", color: "#9ca3af", pointerEvents: "none" }} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder={ar ? "بحث بالاسم / المهنة / الهاتف" : "Nom, métier, téléphone…"} style={{ paddingLeft: ar ? 10 : 28, paddingRight: ar ? 28 : 10, paddingTop: 7, paddingBottom: 7, border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13, outline: "none", width: 200 }} />
              </div>
              {filtered.length > 0 && (
                <button onClick={exportExcel} style={{ background: "#16a34a", color: "white", border: "none", borderRadius: 8, padding: "7px 12px", cursor: "pointer", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
                  <Download size={14} />Excel
                </button>
              )}
              {canEdit && (
                <button onClick={openAdd} style={{ background: "#1d4ed8", color: "white", border: "none", borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
                  <Plus size={14} />{ar ? "إضافة" : "Nouveau"}
                </button>
              )}
            </div>
          </div>

          {/* Vue TOUS — tableau */}
          {selectedMetier === "TOUS" ? (
            filtered.length === 0 ? (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontSize: 14 }}>
                {ar ? "لا يوجد مقاول" : "Aucun prestataire"}
              </div>
            ) : (
              <div style={{ flex: 1, overflowY: "auto", background: "white", borderRadius: 12, border: "1px solid #e5e7eb" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#f9fafb", position: "sticky", top: 0 }}>
                      <SortTh col="nomSociete" label={ar ? "الشركة" : "Société"} />
                      <SortTh col="metier"     label={ar ? "المهنة" : "Métier(s)"} />
                      <th style={{ padding: "9px 12px", textAlign: ar ? "right" : "left", fontWeight: 600, color: "#6b7280", borderBottom: "1px solid #e5e7eb", fontSize: 12, whiteSpace: "nowrap" }}>{ar ? "الهاتف" : "Téléphone"}</th>
                      <SortTh col="marche"     label={ar ? "السوق (MAD)" : "Marché"} />
                      <SortTh col="paye"       label={ar ? "المدفوع" : "Payé"} />
                      <SortTh col="reste"      label={ar ? "المتبقي" : "Reste"} />
                      <SortTh col="statut"     label={ar ? "الحالة" : "Statut"} />
                      <SortTh col="note"       label={ar ? "التقييم" : "Note"} />
                      <th style={{ padding: "9px 12px", borderBottom: "1px solid #e5e7eb", fontSize: 12 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(p => {
                      const sc = STATUTS.find(s => s.key === p.statut) ?? STATUTS[0];
                      const am: string[] = p.autresMetiers ? JSON.parse(p.autresMetiers) : [];
                      const icon = METIER_ICONS[p.metier];
                      const reste = (p.montantMarche ?? 0) - (p.montantPaye ?? 0);
                      return (
                        <tr key={p.id} style={{ borderBottom: "1px solid #f3f4f6" }}
                          onMouseEnter={e => (e.currentTarget.style.background = "#f9fafb")}
                          onMouseLeave={e => (e.currentTarget.style.background = "")}>
                          {/* Société + badges */}
                          <td style={{ padding: "8px 12px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                              <span style={{ width: 30, height: 30, borderRadius: 8, background: icon.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>{icon.emoji}</span>
                              <div>
                                <span style={{ fontWeight: 600, color: "#111827", fontSize: 13 }}>{p.nomSociete}</span>
                                <div style={{ display: "flex", gap: 4, marginTop: 2, flexWrap: "wrap" }}>
                                  {p.recommande && <span style={{ fontSize: 9, background: "#dcfce7", color: "#15803d", borderRadius: 4, padding: "1px 5px", fontWeight: 700, display: "flex", alignItems: "center", gap: 2 }}><BadgeCheck size={9} />{ar ? "موصى به" : "Recommandé"}</span>}
                                  {p.blackliste && <span style={{ fontSize: 9, background: "#fee2e2", color: "#dc2626", borderRadius: 4, padding: "1px 5px", fontWeight: 700, display: "flex", alignItems: "center", gap: 2 }}><AlertTriangle size={9} />{ar ? "محظور" : "Blacklisté"}</span>}
                                </div>
                              </div>
                            </div>
                          </td>
                          {/* Métier(s) */}
                          <td style={{ padding: "8px 12px" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                              <span style={{ fontSize: 12, color: "#374151" }}>{metierLabel(p.metier)}</span>
                              {am.length > 0 && (
                                <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                                  {am.map(m => <span key={m} style={{ fontSize: 10, background: "#eff6ff", color: "#1d4ed8", borderRadius: 4, padding: "1px 5px", whiteSpace: "nowrap" }}>{metierLabel(m)}</span>)}
                                </div>
                              )}
                            </div>
                          </td>
                          {/* Téléphone */}
                          <td style={{ padding: "8px 12px", whiteSpace: "nowrap" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                              {p.telephone && <a href={`tel:${p.telephone}`} style={{ color: "#374151", textDecoration: "none", fontSize: 12 }}>{p.telephone}</a>}
                              {p.whatsapp && <a href={`https://wa.me/${p.whatsapp.replace(/\D/g,"")}`} target="_blank" rel="noopener noreferrer" style={{ color: "#16a34a", textDecoration: "none", fontSize: 11, display: "flex", alignItems: "center", gap: 3 }}><Phone size={10} />WA</a>}
                            </div>
                          </td>
                          {/* Marché */}
                          <td style={{ padding: "8px 12px", fontWeight: 600, color: "#111827", whiteSpace: "nowrap", fontSize: 12 }}>{p.montantMarche !== null ? `${fmt(p.montantMarche)}` : "—"}</td>
                          {/* Payé */}
                          <td style={{ padding: "8px 12px", color: "#15803d", fontWeight: 500, whiteSpace: "nowrap", fontSize: 12 }}>{p.montantPaye !== null ? `${fmt(p.montantPaye ?? 0)}` : "—"}</td>
                          {/* Reste */}
                          <td style={{ padding: "8px 12px", color: reste > 0 ? "#dc2626" : "#15803d", fontWeight: 600, whiteSpace: "nowrap", fontSize: 12 }}>{p.montantMarche !== null ? fmt(Math.max(0, reste)) : "—"}</td>
                          {/* Statut */}
                          <td style={{ padding: "8px 12px" }}><span style={{ background: sc.bg, color: sc.text, fontSize: 11, fontWeight: 600, borderRadius: 20, padding: "2px 8px", whiteSpace: "nowrap" }}>{ar ? sc.ar : sc.fr}</span></td>
                          {/* Note */}
                          <td style={{ padding: "8px 12px" }}><Stars n={p.noteSatisfaction} /></td>
                          {/* Actions */}
                          <td style={{ padding: "8px 12px" }}>
                            {canEdit && (
                              <div style={{ display: "flex", gap: 5 }}>
                                <button onClick={() => openEdit(p)} style={{ background: "#eff6ff", color: "#1d4ed8", border: "none", borderRadius: 5, padding: "4px 8px", cursor: "pointer" }}><Pencil size={12} /></button>
                                <button onClick={() => handleDelete(p.id)} style={{ background: "#fef2f2", color: "#dc2626", border: "none", borderRadius: 5, padding: "4px 8px", cursor: "pointer" }}><Trash2 size={12} /></button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            /* Vue par métier — cartes */
            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
              {filtered.length === 0 ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: 10, color: "#9ca3af", paddingTop: 60 }}>
                  <span style={{ fontSize: 40 }}>{METIER_ICONS[selectedMetier].emoji}</span>
                  <p style={{ fontSize: 14 }}>{ar ? "لا يوجد مقاول لهذه المهنة" : "Aucun prestataire pour ce métier"}</p>
                  {canEdit && <button onClick={openAdd} style={{ marginTop: 4, background: "#1d4ed8", color: "white", border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 13 }}>{ar ? "إضافة أول مقاول" : "Ajouter le premier prestataire"}</button>}
                </div>
              ) : (
                filtered.map(p => {
                  const sc = STATUTS.find(s => s.key === p.statut) ?? STATUTS[0];
                  const expanded = expandedId === p.id;
                  const reste = (p.montantMarche ?? 0) - (p.montantPaye ?? 0);
                  const zones: string[] = p.zonesIntervention ? JSON.parse(p.zonesIntervention) : [];
                  const am: string[] = p.autresMetiers ? JSON.parse(p.autresMetiers) : [];
                  const md: Record<string, string> = p.metierData ? JSON.parse(p.metierData) : {};
                  const extras = METIER_EXTRA[p.metier] ?? [];
                  const filledExtras = extras.filter(f => md[f.key]);
                  const icon = METIER_ICONS[p.metier];

                  return (
                    <div key={p.id}
                      style={{ background: "white", border: `1px solid ${expanded ? icon.color : "#e5e7eb"}`, borderRadius: 10, overflow: "hidden", cursor: "pointer", borderLeft: !ar ? `4px solid ${icon.color}` : undefined, borderRight: ar ? `4px solid ${icon.color}` : undefined }}
                      onClick={() => setExpandedId(expanded ? null : p.id)}>
                      {/* Card header */}
                      <div style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                              <span style={{ width: 32, height: 32, borderRadius: 8, background: icon.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{icon.emoji}</span>
                              <span style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>{p.nomSociete}</span>
                              <span style={{ background: sc.bg, color: sc.text, fontSize: 11, fontWeight: 600, borderRadius: 20, padding: "2px 8px" }}>{ar ? sc.ar : sc.fr}</span>
                              {p.noteSatisfaction && p.noteSatisfaction >= 4 && (
                                <span style={{ fontSize: 10, background: "#dcfce7", color: "#15803d", borderRadius: 4, padding: "1px 6px", fontWeight: 700, display: "flex", alignItems: "center", gap: 2 }}><BadgeCheck size={10} />{ar ? "موصى به" : "Recommandé"}</span>
                              )}
                              {p.recommande && p.noteSatisfaction && p.noteSatisfaction < 4 && (
                                <span style={{ fontSize: 10, background: "#dcfce7", color: "#15803d", borderRadius: 4, padding: "1px 6px", fontWeight: 700, display: "flex", alignItems: "center", gap: 2 }}><ThumbsUp size={10} />{ar ? "موصى به" : "Recommandé"}</span>
                              )}
                              {p.blackliste && <span style={{ fontSize: 10, background: "#fee2e2", color: "#dc2626", borderRadius: 4, padding: "1px 6px", fontWeight: 700, display: "flex", alignItems: "center", gap: 2 }}><AlertTriangle size={10} />{ar ? "محظور" : "⚠ Blacklisté"}</span>}
                              {p.noteSatisfaction && <Stars n={p.noteSatisfaction} />}
                              {am.map(m => <span key={m} style={{ fontSize: 10, background: "#eff6ff", color: "#1d4ed8", borderRadius: 4, padding: "1px 6px", whiteSpace: "nowrap" }}>{metierLabel(m)}</span>)}
                            </div>
                            <div style={{ display: "flex", gap: 12, marginTop: 5, flexWrap: "wrap" }}>
                              {p.responsable && <span style={{ fontSize: 12, color: "#6b7280" }}>{p.responsable}</span>}
                              {p.telephone && (
                                <span style={{ fontSize: 12, color: "#6b7280", display: "flex", alignItems: "center", gap: 3 }}>
                                  <Phone size={11} />{p.telephone}
                                </span>
                              )}
                              {p.whatsapp && (
                                <a href={`https://wa.me/${p.whatsapp.replace(/\D/g,"")}`} target="_blank" rel="noopener noreferrer"
                                  onClick={e => e.stopPropagation()}
                                  style={{ fontSize: 12, color: "#16a34a", display: "flex", alignItems: "center", gap: 3, textDecoration: "none", background: "#f0fdf4", borderRadius: 6, padding: "2px 8px" }}>
                                  <Phone size={11} />WhatsApp
                                </a>
                              )}
                            </div>
                            {/* Champs spécifiques résumé (max 3) */}
                            {filledExtras.length > 0 && (
                              <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                                {filledExtras.slice(0, 3).map(f => (
                                  <span key={f.key} style={{ fontSize: 11, color: icon.color, background: icon.bg, borderRadius: 4, padding: "2px 7px" }}>
                                    <b>{ar ? f.ar : f.fr}:</b> {md[f.key]}
                                  </span>
                                ))}
                                {filledExtras.length > 3 && <span style={{ fontSize: 11, color: "#9ca3af" }}>+{filledExtras.length - 3}</span>}
                              </div>
                            )}
                          </div>
                          <div style={{ textAlign: ar ? "left" : "right", flexShrink: 0 }}>
                            {p.montantMarche !== null && (
                              <>
                                <p style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{fmt(p.montantMarche)} <span style={{ fontSize: 11, color: "#9ca3af" }}>MAD</span></p>
                                <p style={{ fontSize: 11, color: reste > 0 ? "#dc2626" : "#15803d" }}>{ar ? "مدفوع:" : "Payé:"} {fmt(p.montantPaye ?? 0)} MAD</p>
                              </>
                            )}
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap", alignItems: "center" }}>
                          {(p.dateDebut || p.dateFin) && <span style={{ fontSize: 11, color: "#9ca3af", display: "flex", alignItems: "center", gap: 3 }}><Calendar size={11} />{p.dateDebut && new Date(p.dateDebut).toLocaleDateString("fr-FR")}{p.dateFin && ` → ${new Date(p.dateFin).toLocaleDateString("fr-FR")}`}</span>}
                          {zones.map(z => { const zz = ZONES.find(x => x.key === z); return <span key={z} style={{ fontSize: 10, background: "#f3f4f6", color: "#6b7280", borderRadius: 4, padding: "1px 6px" }}>{ar ? zz?.ar : zz?.fr}</span>; })}
                          {p.garantieDuree && <span style={{ fontSize: 11, color: "#a16207", display: "flex", alignItems: "center", gap: 3 }}><Shield size={11} />{ar ? "ضمان:" : "Garantie:"} {p.garantieDuree}</span>}
                        </div>
                      </div>

                      {/* Expanded */}
                      {expanded && (
                        <div style={{ borderTop: `1px solid ${icon.bg}`, background: "#fafafa", padding: "12px 16px" }} onClick={e => e.stopPropagation()}>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 14, fontSize: 13 }}>
                            {(p.email || p.adresse) && (
                              <div style={{ flex: "1 1 200px", display: "flex", flexDirection: "column", gap: 4 }}>
                                {p.email && <span style={{ display: "flex", alignItems: "center", gap: 5, color: "#374151" }}><Mail size={12} color="#9ca3af" />{p.email}</span>}
                                {p.adresse && <span style={{ color: "#6b7280", fontSize: 12 }}>{p.adresse}</span>}
                              </div>
                            )}
                            {(p.rc || p.identifiantFiscal) && (
                              <div style={{ flex: "1 1 140px", display: "flex", flexDirection: "column", gap: 4 }}>
                                {p.rc && <span style={{ color: "#374151", fontSize: 12 }}><b>RC:</b> {p.rc}</span>}
                                {p.identifiantFiscal && <span style={{ color: "#374151", fontSize: 12 }}><b>IF:</b> {p.identifiantFiscal}</span>}
                              </div>
                            )}
                            {p.specialite && <div style={{ flex: "1 1 200px" }}><p style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", marginBottom: 2 }}>{ar ? "التخصص" : "Spécialité"}</p><p style={{ color: "#374151", fontSize: 13 }}>{p.specialite}</p></div>}
                            {/* Tous les champs spécifiques */}
                            {filledExtras.length > 0 && (
                              <div style={{ flex: "1 1 100%", background: icon.bg, borderRadius: 8, padding: "10px 12px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8, border: `1px solid ${icon.color}20` }}>
                                <p style={{ gridColumn: "1/-1", fontSize: 11, fontWeight: 700, color: icon.color, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px" }}>
                                  {icon.emoji} {ar ? "بيانات خاصة بالمهنة" : "Données spécifiques métier"}
                                </p>
                                {filledExtras.map(f => (
                                  <div key={f.key}>
                                    <p style={{ fontSize: 10, fontWeight: 700, color: icon.color, textTransform: "uppercase", marginBottom: 2 }}>{ar ? f.ar : f.fr}</p>
                                    <p style={{ fontSize: 13, color: "#111827", fontWeight: 500 }}>{md[f.key]}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                            {p.montantMarche !== null && (
                              <div style={{ flex: "1 1 160px", background: "#f9fafb", borderRadius: 8, padding: "8px 12px", border: "1px solid #e5e7eb" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ color: "#6b7280", fontSize: 12 }}>{ar ? "المشروع:" : "Marché:"}</span><span style={{ fontWeight: 600 }}>{fmt(p.montantMarche)} MAD</span></div>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ color: "#6b7280", fontSize: 12 }}>{ar ? "المدفوع:" : "Payé:"}</span><span style={{ color: "#15803d", fontWeight: 600 }}>{fmt(p.montantPaye ?? 0)} MAD</span></div>
                                <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#6b7280", fontSize: 12 }}>{ar ? "المتبقي:" : "Reste:"}</span><span style={{ color: reste > 0 ? "#dc2626" : "#15803d", fontWeight: 700 }}>{fmt(Math.max(0, reste))} MAD</span></div>
                              </div>
                            )}
                            {p.notes && <div style={{ flex: "1 1 100%", background: "#fffbeb", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#92400e", border: "1px solid #fde68a" }}>{p.notes}</div>}
                          </div>
                          {/* Galerie documents */}
                          <div style={{ marginTop: 10 }}>
                            {p.documents.length > 0 && (
                              <div style={{ marginBottom: 10 }}>
                                <p style={{ fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
                                  <FolderOpen size={13} />{ar ? "الوثائق" : "Documents"} ({p.documents.length})
                                </p>
                                <DocGallery documents={p.documents} prestataireId={p.id} canEdit={canEdit} ar={ar} />
                              </div>
                            )}
                            {canEdit && (
                              <details style={{ marginTop: p.documents.length > 0 ? 8 : 0 }}>
                                <summary style={{ fontSize: 12, color: "#1d4ed8", cursor: "pointer", fontWeight: 600, listStyle: "none", display: "flex", alignItems: "center", gap: 5, padding: "6px 0" }}>
                                  <Plus size={13} />{ar ? "إضافة وثيقة / صورة" : "Ajouter document / photo"}
                                </summary>
                                <div style={{ marginTop: 8, padding: "12px", background: "#f8fafc", borderRadius: 8, border: "1px solid #e5e7eb" }}>
                                  <UploadZone prestataireId={p.id} ar={ar} />
                                </div>
                              </details>
                            )}
                          </div>
                          {canEdit && (
                            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                              <button onClick={() => openEdit(p)} style={{ display: "flex", alignItems: "center", gap: 4, background: "#eff6ff", color: "#1d4ed8", border: "none", borderRadius: 6, padding: "5px 12px", cursor: "pointer", fontSize: 12, fontWeight: 500 }}><Pencil size={13} />{ar ? "تعديل" : "Modifier"}</button>
                              <button onClick={() => handleDelete(p.id)} style={{ display: "flex", alignItems: "center", gap: 4, background: "#fef2f2", color: "#dc2626", border: "none", borderRadius: 6, padding: "5px 12px", cursor: "pointer", fontSize: 12, fontWeight: 500 }}><Trash2 size={13} />{ar ? "حذف" : "Supprimer"}</button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── FORM MODAL ─────────────────────────────────────────────────────── */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: 20, overflowY: "auto" }}
          onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div dir={ar ? "rtl" : "ltr"} style={{ background: "white", borderRadius: 14, width: "100%", maxWidth: 740, boxShadow: "0 20px 60px rgba(0,0,0,0.3)", marginTop: 20 }}>
            {/* Header with métier color */}
            <div style={{ padding: "0", borderRadius: "14px 14px 0 0", overflow: "hidden" }}>
              <div style={{ background: METIER_ICONS[form.metier].bg, padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `3px solid ${METIER_ICONS[form.metier].color}20` }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: METIER_ICONS[form.metier].color, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 20 }}>{METIER_ICONS[form.metier].emoji}</span>
                  {editingId ? (ar ? "تعديل المقاول" : "Modifier") : (ar ? "مقاول جديد" : "Nouveau prestataire")}
                  {" — "}{metierLabel(form.metier)}
                </h3>
                <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}><X size={20} /></button>
              </div>
            </div>

            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16, maxHeight: "74vh", overflowY: "auto" }}>

              {/* Métier principal */}
              <STitle t={ar ? "المهنة الرئيسية" : "Corps de métier principal"} />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div>
                  <FLabel l={ar ? "المهنة *" : "Métier principal *"} />
                  <select value={form.metier} onChange={e => setForm(f => ({ ...f, metier: e.target.value as MetierKey, metierData: {} }))} style={sel}>
                    {METIERS.map(m => <option key={m.key} value={m.key}>{ar ? m.ar : m.fr}</option>)}
                  </select>
                </div>
                {form.metier === "AUTRE" && (
                  <div><FLabel l={ar ? "تحديد المهنة" : "Précisez le métier"} /><input value={form.metierLibre} onChange={e => setForm(f => ({ ...f, metierLibre: e.target.value }))} style={inp} /></div>
                )}
                <div>
                  <FLabel l={ar ? "مهن أخرى (هذه الشركة تغطي أيضاً)" : "Cette société intervient aussi en"} />
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 4 }}>
                    {METIERS.filter(m => m.key !== form.metier).map(m => {
                      const checked = form.autresMetiers.includes(m.key);
                      const ic = METIER_ICONS[m.key as MetierKey];
                      return <button key={m.key} type="button" onClick={() => toggleAM(m.key)} style={{ background: checked ? ic.color : "#f3f4f6", color: checked ? "white" : "#374151", border: "none", borderRadius: 20, padding: "4px 10px", cursor: "pointer", fontSize: 11, fontWeight: checked ? 600 : 400, display: "flex", alignItems: "center", gap: 4 }}><span>{ic.emoji}</span>{ar ? m.ar : m.fr}</button>;
                    })}
                  </div>
                </div>
              </div>

              {/* Identification */}
              <STitle t={ar ? "بيانات التعريف" : "Identification"} />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div><FLabel l={ar ? "اسم الشركة / الحرفي *" : "Nom société / artisan *"} /><input value={form.nomSociete} onChange={e => setForm(f => ({ ...f, nomSociete: e.target.value }))} style={inp} /></div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div><FLabel l={ar ? "المسؤول" : "Responsable"} /><input value={form.responsable} onChange={e => setForm(f => ({ ...f, responsable: e.target.value }))} style={inp} /></div>
                  <div><FLabel l={ar ? "الهاتف" : "Téléphone"} /><input value={form.telephone} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))} style={inp} /></div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div><FLabel l="WhatsApp" /><input value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} style={inp} /></div>
                  <div><FLabel l="Email" /><input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} style={inp} /></div>
                </div>
                <div><FLabel l={ar ? "العنوان" : "Adresse"} /><input value={form.adresse} onChange={e => setForm(f => ({ ...f, adresse: e.target.value }))} style={inp} /></div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div><FLabel l="RC (Registre Commerce)" /><input value={form.rc} onChange={e => setForm(f => ({ ...f, rc: e.target.value }))} style={inp} /></div>
                  <div><FLabel l="IF (Identifiant Fiscal)" /><input value={form.identifiantFiscal} onChange={e => setForm(f => ({ ...f, identifiantFiscal: e.target.value }))} style={inp} /></div>
                </div>
              </div>

              {/* Champs spécifiques au métier */}
              {extraFields.length > 0 && (
                <>
                  <div style={{ background: METIER_ICONS[form.metier].bg, borderRadius: 8, padding: "4px 10px 2px", border: `1px solid ${METIER_ICONS[form.metier].color}30` }}>
                    <STitle t={`${METIER_ICONS[form.metier].emoji}  ${ar ? `بيانات خاصة — ${METIERS.find(m => m.key === form.metier)?.ar}` : `Données spécifiques — ${METIERS.find(m => m.key === form.metier)?.fr}`}`} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {extraFields.map(f => (
                      <div key={f.key}>
                        <FLabel l={ar ? f.ar : f.fr} />
                        {f.type === "select" ? (
                          <select value={form.metierData[f.key] ?? ""} onChange={e => setEF(f.key, e.target.value)} style={sel}>
                            <option value="">{ar ? "اختر..." : "Choisir…"}</option>
                            {f.options?.map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        ) : (
                          <input type={f.type === "number" ? "number" : f.type} min={f.type === "number" ? "0" : undefined} value={form.metierData[f.key] ?? ""} onChange={e => setEF(f.key, e.target.value)} style={inp} />
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Intervention */}
              <STitle t={ar ? "التدخل" : "Intervention"} />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div><FLabel l={ar ? "التخصص التفصيلي" : "Spécialité détaillée"} /><textarea value={form.specialite} onChange={e => setForm(f => ({ ...f, specialite: e.target.value }))} style={{ ...inp, minHeight: 56, resize: "vertical" }} /></div>
                <div>
                  <FLabel l={ar ? "مناطق التدخل" : "Zones d'intervention"} />
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                    {ZONES.map(z => { const c = form.zonesIntervention.includes(z.key); return <button key={z.key} type="button" onClick={() => toggleZone(z.key)} style={{ background: c ? "#16a34a" : "#f3f4f6", color: c ? "white" : "#374151", border: "none", borderRadius: 20, padding: "5px 12px", cursor: "pointer", fontSize: 12 }}>{ar ? z.ar : z.fr}</button>; })}
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  <div><FLabel l={ar ? "تاريخ البداية" : "Date début"} /><input type="date" value={form.dateDebut} onChange={e => setForm(f => ({ ...f, dateDebut: e.target.value }))} style={inp} /></div>
                  <div><FLabel l={ar ? "تاريخ الانتهاء" : "Date fin"} /><input type="date" value={form.dateFin} onChange={e => setForm(f => ({ ...f, dateFin: e.target.value }))} style={inp} /></div>
                  <div><FLabel l={ar ? "الحالة" : "Statut"} /><select value={form.statut} onChange={e => setForm(f => ({ ...f, statut: e.target.value }))} style={sel}>{STATUTS.map(s => <option key={s.key} value={s.key}>{ar ? s.ar : s.fr}</option>)}</select></div>
                </div>
              </div>

              {/* Financier */}
              <STitle t={ar ? "المالية" : "Financier"} />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div><FLabel l={ar ? "مبلغ السوق / الفاتورة (MAD)" : "Montant marché / devis (MAD)"} /><input type="number" min="0" value={form.montantMarche} onChange={e => setForm(f => ({ ...f, montantMarche: e.target.value }))} style={inp} placeholder="0" /></div>
                  <div><FLabel l={ar ? "المبلغ المدفوع (MAD)" : "Montant payé (MAD)"} /><input type="number" min="0" value={form.montantPaye} onChange={e => setForm(f => ({ ...f, montantPaye: e.target.value }))} style={inp} placeholder="0" /></div>
                </div>
                {form.montantMarche && (
                  <div style={{ background: "#f9fafb", borderRadius: 8, padding: "8px 14px", display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                    <span style={{ color: "#6b7280" }}>{ar ? "المتبقي:" : "Reste à payer:"}</span>
                    <span style={{ fontWeight: 700, color: "#dc2626" }}>{fmt(Math.max(0, parseFloat(form.montantMarche || "0") - parseFloat(form.montantPaye || "0")))} MAD</span>
                  </div>
                )}
              </div>

              {/* Qualité & Garantie */}
              <STitle t={ar ? "الجودة والضمان" : "Qualité & Garantie"} />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div>
                  <FLabel l={ar ? "تقييم الرضا" : "Note de satisfaction"} />
                  <div style={{ display: "flex", gap: 5, marginTop: 4, alignItems: "center" }}>
                    {[1,2,3,4,5].map(i => <button key={i} type="button" onClick={() => setForm(f => ({ ...f, noteSatisfaction: f.noteSatisfaction === i ? 0 : i }))} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}><Star size={26} fill={i <= form.noteSatisfaction ? "#f59e0b" : "none"} stroke={i <= form.noteSatisfaction ? "#f59e0b" : "#d1d5db"} /></button>)}
                    {form.noteSatisfaction > 0 && <span style={{ fontSize: 13, color: "#9ca3af" }}>{form.noteSatisfaction}/5</span>}
                    {form.noteSatisfaction >= 4 && <span style={{ fontSize: 11, background: "#dcfce7", color: "#15803d", borderRadius: 4, padding: "2px 8px", fontWeight: 600, marginLeft: 4 }}><BadgeCheck size={11} style={{ display: "inline", verticalAlign: "middle" }} /> {ar ? "موصى به تلقائياً" : "Badge Recommandé ✓"}</span>}
                  </div>
                </div>

                {/* Recommandé / Blacklisté */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <FLabel l={ar ? "هل توصي بهذا المقاول؟" : "Recommanderiez-vous ?"} />
                    <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                      <button type="button" onClick={() => setForm(f => ({ ...f, recommande: true }))}
                        style={{ flex: 1, padding: "7px 0", borderRadius: 8, border: `2px solid ${form.recommande ? "#16a34a" : "#e5e7eb"}`, background: form.recommande ? "#f0fdf4" : "white", color: form.recommande ? "#15803d" : "#6b7280", fontWeight: 600, cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                        <ThumbsUp size={14} />{ar ? "نعم" : "Oui"}
                      </button>
                      <button type="button" onClick={() => setForm(f => ({ ...f, recommande: false }))}
                        style={{ flex: 1, padding: "7px 0", borderRadius: 8, border: `2px solid ${!form.recommande ? "#e5e7eb" : "#e5e7eb"}`, background: !form.recommande ? "#f9fafb" : "white", color: "#6b7280", cursor: "pointer", fontSize: 12 }}>
                        {ar ? "لا" : "Non"}
                      </button>
                    </div>
                  </div>
                  <div>
                    <FLabel l={ar ? "تحذير (مشكل / محظور)" : "Signaler problème / Blacklister"} />
                    <button type="button" onClick={() => setForm(f => ({ ...f, blackliste: !f.blackliste }))}
                      style={{ width: "100%", marginTop: 4, padding: "7px 0", borderRadius: 8, border: `2px solid ${form.blackliste ? "#dc2626" : "#e5e7eb"}`, background: form.blackliste ? "#fef2f2" : "white", color: form.blackliste ? "#dc2626" : "#6b7280", fontWeight: 600, cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                      <AlertTriangle size={14} />{form.blackliste ? (ar ? "محظور ✓ (انقر للإلغاء)" : "Blacklisté ✓ (cliquer pour annuler)") : (ar ? "اضغط للحظر" : "Cliquer pour blacklister")}
                    </button>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div><FLabel l={ar ? "مدة الضمان" : "Durée garantie"} /><input value={form.garantieDuree} onChange={e => setForm(f => ({ ...f, garantieDuree: e.target.value }))} style={inp} placeholder={ar ? "مثل: سنتان" : "Ex: 2 ans"} /></div>
                  <div><FLabel l={ar ? "انتهاء الضمان" : "Expiration garantie"} /><input type="date" value={form.garantieExpiration} onChange={e => setForm(f => ({ ...f, garantieExpiration: e.target.value }))} style={inp} /></div>
                </div>
                <div><FLabel l={ar ? "ملاحظات" : "Commentaire / Notes"} /><textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} style={{ ...inp, minHeight: 60, resize: "vertical" }} /></div>
              </div>

              {/* Documents (modification uniquement) */}
              {editingId && editingPrest && (
                <>
                  <STitle t={ar ? "الوثائق والصور" : `Documents & Photos (${editingPrest.documents.length})`} />
                  {/* Galerie existante */}
                  {editingPrest.documents.length > 0 && (
                    <DocGallery documents={editingPrest.documents} prestataireId={editingId} canEdit={canEdit} ar={ar} />
                  )}
                  {/* Upload nouveau fichier */}
                  <div style={{ background: "#f8fafc", borderRadius: 10, padding: "14px", border: "1px solid #e5e7eb" }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 10, display: "flex", alignItems: "center", gap: 5 }}>
                      <Plus size={13} />{ar ? "إضافة وثيقة / صورة جديدة" : "Ajouter un document / une photo"}
                    </p>
                    <UploadZone prestataireId={editingId} ar={ar} />
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: "12px 24px", borderTop: "1px solid #f3f4f6", display: "flex", justifyContent: "flex-end", gap: 10, borderRadius: "0 0 14px 14px", background: "#fafafa" }}>
              <button onClick={() => setShowForm(false)} style={{ background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 8, padding: "8px 18px", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>{ar ? "إلغاء" : "Annuler"}</button>
              <button onClick={handleSubmit} disabled={isPending} style={{ background: "#16a34a", color: "white", border: "none", borderRadius: 8, padding: "8px 22px", cursor: isPending ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 600, opacity: isPending ? 0.7 : 1 }}>
                {isPending ? (ar ? "جارٍ..." : "Enregistrement…") : (ar ? "حفظ" : "Enregistrer")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
