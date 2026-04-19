export type Lang = "fr" | "ar";

export type Translations = {
  appName: string;
  appSubtitle: string;
  nav: {
    dashboard: string;
    units: string;
    meters: string;
    readings: string;
    invoices: string;
    expenses: string;
    interventions: string;
    visits: string;
    documents: string;
    lots: string;
    prospects: string;
    sales: string;
    revenue: string;
    prestataires: string;
  };
  auth: {
    email: string;
    password: string;
    login: string;
    logging: string;
    logout: string;
    errorInvalid: string;
  };
  dashboard: {
    welcome: string;
    totalUnits: string;
    activeMeters: string;
    pendingVisits: string;
    openAlerts: string;
    recentActivity: string;
    noActivity: string;
  };
  lots: {
    title: string;
    disponible: string;
    reserve: string;
    vendu: string;
    price: string;
    area: string;
    floor: string;
    status: string;
    addLot: string;
    noLots: string;
  };
  prospects: {
    title: string;
    nouveau: string;
    contacte: string;
    visite: string;
    negociation: string;
    signe: string;
    perdu: string;
    addProspect: string;
    contactHistory: string;
    noProspects: string;
    lastContact: string;
    targetedLots: string;
  };
  sales: {
    title: string;
    reserve: string;
    enCours: string;
    acteSigne: string;
    livre: string;
    totalAmount: string;
    deposit: string;
    notary: string;
    paymentSchedule: string;
    addPayment: string;
    noSales: string;
  };
  revenue: {
    title: string;
    distribute: string;
    coOwners: string;
    sharePercent: string;
    distributions: string;
    totalDistributed: string;
    noDistributions: string;
    exportPdf: string;
  };
  agent: {
    title: string;
    placeholder: string;
    send: string;
    thinking: string;
    error: string;
    clearHistory: string;
  };
  common: {
    loading: string;
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    add: string;
    search: string;
    back: string;
    confirm: string;
    total: string;
    date: string;
    notes: string;
    status: string;
    actions: string;
    name: string;
    phone: string;
    email: string;
    amount: string;
    paid: string;
    pending: string;
  };
};

export const translations: Record<Lang, Translations> = {
  fr: {
    appName:    "Les Orchidées 2",
    appSubtitle:"Espace de Gestion",
    nav: {
      dashboard:     "Tableau de bord",
      units:         "Unités",
      meters:        "Compteurs",
      readings:      "Relevés",
      invoices:      "Factures",
      expenses:      "Dépenses",
      interventions: "Interventions",
      visits:        "Visites",
      documents:     "Documents",
      lots:          "Stock lots",
      prospects:     "Prospects CRM",
      sales:         "Ventes",
      revenue:       "Répartition revenus",
      prestataires:  "Corps de métier",
    },
    auth: {
      email:        "Adresse e-mail",
      password:     "Mot de passe",
      login:        "Se connecter",
      logging:      "Connexion…",
      logout:       "Déconnexion",
      errorInvalid: "Email ou mot de passe incorrect.",
    },
    dashboard: {
      welcome:       "Bonjour",
      totalUnits:    "Unités totales",
      activeMeters:  "Compteurs actifs",
      pendingVisits: "Interventions ouvertes",
      openAlerts:    "Alertes ouvertes",
      recentActivity:"Derniers relevés",
      noActivity:    "Aucune activité récente.",
    },
    lots: {
      title:       "Stock des lots",
      disponible:  "Disponible",
      reserve:     "Réservé",
      vendu:       "Vendu",
      price:       "Prix",
      area:        "Surface",
      floor:       "Étage",
      status:      "Statut",
      addLot:      "Nouveau lot",
      noLots:      "Aucun lot trouvé.",
    },
    prospects: {
      title:          "Prospects CRM",
      nouveau:        "Nouveau",
      contacte:       "Contacté",
      visite:         "Visité",
      negociation:    "Négociation",
      signe:          "Signé",
      perdu:          "Perdu",
      addProspect:    "Nouveau prospect",
      contactHistory: "Historique contacts",
      noProspects:    "Aucun prospect.",
      lastContact:    "Dernier contact",
      targetedLots:   "Lots visés",
    },
    sales: {
      title:           "Suivi des ventes",
      reserve:         "Réservé",
      enCours:         "En cours",
      acteSigne:       "Acte signé",
      livre:           "Livré",
      totalAmount:     "Montant total",
      deposit:         "Acompte",
      notary:          "Notaire",
      paymentSchedule: "Calendrier paiements",
      addPayment:      "Ajouter tranche",
      noSales:         "Aucune vente enregistrée.",
    },
    revenue: {
      title:            "Répartition des revenus",
      distribute:       "Distribuer",
      coOwners:         "Copropriétaires",
      sharePercent:     "Quote-part",
      distributions:    "Historique distributions",
      totalDistributed: "Total distribué",
      noDistributions:  "Aucune distribution.",
      exportPdf:        "Exporter PDF",
    },
    agent: {
      title:        "Orchid — Assistant IA",
      placeholder:  "Posez votre question…",
      send:         "Envoyer",
      thinking:     "Orchid réfléchit…",
      error:        "Erreur de communication avec l'agent.",
      clearHistory: "Effacer l'historique",
    },
    common: {
      loading: "Chargement…",
      save:    "Enregistrer",
      cancel:  "Annuler",
      delete:  "Supprimer",
      edit:    "Modifier",
      add:     "Ajouter",
      search:  "Rechercher",
      back:    "Retour",
      confirm: "Confirmer",
      total:   "Total",
      date:    "Date",
      notes:   "Notes",
      status:  "Statut",
      actions: "Actions",
      name:    "Nom",
      phone:   "Téléphone",
      email:   "Email",
      amount:  "Montant",
      paid:    "Payé",
      pending: "En attente",
    },
  },
  ar: {
    appName:    "إقامة الأوركيد 2",
    appSubtitle:"فضاء الإدارة",
    nav: {
      dashboard:     "لوحة القيادة",
      units:         "الوحدات",
      meters:        "العدادات",
      readings:      "القراءات",
      invoices:      "الفواتير",
      expenses:      "المصاريف",
      interventions: "التدخلات",
      visits:        "الزيارات",
      documents:     "الوثائق",
      lots:          "مخزون اللوتات",
      prospects:     "إدارة العملاء",
      sales:         "المبيعات",
      revenue:       "توزيع الإيرادات",
      prestataires:  "المقاولون",
    },
    auth: {
      email:        "البريد الإلكتروني",
      password:     "كلمة المرور",
      login:        "تسجيل الدخول",
      logging:      "جارٍ التسجيل…",
      logout:       "تسجيل الخروج",
      errorInvalid: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
    },
    dashboard: {
      welcome:       "مرحباً",
      totalUnits:    "إجمالي الوحدات",
      activeMeters:  "العدادات النشطة",
      pendingVisits: "التدخلات المفتوحة",
      openAlerts:    "التنبيهات المفتوحة",
      recentActivity:"آخر القراءات",
      noActivity:    "لا يوجد نشاط حديث.",
    },
    lots: {
      title:       "مخزون اللوتات",
      disponible:  "متاح",
      reserve:     "محجوز",
      vendu:       "مباع",
      price:       "السعر",
      area:        "المساحة",
      floor:       "الطابق",
      status:      "الحالة",
      addLot:      "لوت جديد",
      noLots:      "لا توجد لوتات.",
    },
    prospects: {
      title:          "إدارة العملاء المحتملين",
      nouveau:        "جديد",
      contacte:       "تم الاتصال",
      visite:         "زار",
      negociation:    "تفاوض",
      signe:          "وقّع",
      perdu:          "فقدان",
      addProspect:    "عميل جديد",
      contactHistory: "سجل الاتصالات",
      noProspects:    "لا يوجد عملاء.",
      lastContact:    "آخر اتصال",
      targetedLots:   "اللوتات المستهدفة",
    },
    sales: {
      title:           "متابعة المبيعات",
      reserve:         "محجوز",
      enCours:         "قيد الإنجاز",
      acteSigne:       "العقد موقّع",
      livre:           "تم التسليم",
      totalAmount:     "المبلغ الإجمالي",
      deposit:         "العربون",
      notary:          "الموثق",
      paymentSchedule: "جدول الدفع",
      addPayment:      "إضافة دفعة",
      noSales:         "لا توجد مبيعات.",
    },
    revenue: {
      title:            "توزيع الإيرادات",
      distribute:       "توزيع",
      coOwners:         "الشركاء",
      sharePercent:     "نسبة الحصة",
      distributions:    "سجل التوزيعات",
      totalDistributed: "الإجمالي الموزّع",
      noDistributions:  "لا توجد توزيعات.",
      exportPdf:        "تصدير PDF",
    },
    agent: {
      title:        "أوركيد — المساعد الذكي",
      placeholder:  "اطرح سؤالك…",
      send:         "إرسال",
      thinking:     "أوركيد يفكر…",
      error:        "خطأ في التواصل مع المساعد.",
      clearHistory: "مسح السجل",
    },
    common: {
      loading: "جارٍ التحميل…",
      save:    "حفظ",
      cancel:  "إلغاء",
      delete:  "حذف",
      edit:    "تعديل",
      add:     "إضافة",
      search:  "بحث",
      back:    "رجوع",
      confirm: "تأكيد",
      total:   "الإجمالي",
      date:    "التاريخ",
      notes:   "ملاحظات",
      status:  "الحالة",
      actions: "الإجراءات",
      name:    "الاسم",
      phone:   "الهاتف",
      email:   "البريد",
      amount:  "المبلغ",
      paid:    "مدفوع",
      pending: "قيد الانتظار",
    },
  },
};
