"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";

type Lang = "fr" | "ar";

const T = {
  fr: {
    nav_name: "Les Orchidées 2",
    nav_sub: "Résidence Premium",
    nav_services: "Services",
    nav_agent: "Agent IA",
    nav_contact: "Contact",
    nav_cta: "Accéder à mon espace →",
    hero_eyebrow: "Résidence Premium · Casablanca",
    hero_title1: "Bienvenue dans",
    hero_title2: "votre espace",
    hero_title3: "de vie idéal",
    hero_desc: "Gérez votre logement, vos paiements et vos demandes depuis une plateforme unique. Votre assistant IA est disponible 24h/24 pour vous accompagner.",
    hero_cta1: "🔑 Accéder à mon espace",
    hero_cta2: "✨ Découvrir l'Agent IA",
    hero_card_title: "Agent Orchid IA",
    hero_card_sub: "Assistant personnel 24h/24",
    hero_chat1: "Bonjour ! Je suis votre assistant Orchid. Comment puis-je vous aider ?",
    hero_chat2: "Ma prochaine échéance de loyer ?",
    hero_badge1: "Satisfaction résidents",
    hero_badge2: "Résidents actifs",
    hero_next: "Prochaine échéance",
    hero_status: "À jour",
    hero_pay_status: "Statut paiements",
    stat1_label: "Résidents",
    stat2_label: "Satisfaction",
    stat3_label: "Temps de réponse",
    stat4_label: "Assistance IA",
    services_badge: "Fonctionnalités",
    services_title1: "Tout ce dont vous avez",
    services_title2: "besoin, en un seul endroit",
    services_desc: "Votre espace résidentiel numérique réunit toutes les fonctionnalités pour un quotidien simplifié.",
    s1_title: "Paiements en ligne",
    s1_desc: "Réglez votre loyer et charges en quelques clics. Historique complet et reçus automatiques.",
    s2_title: "Demandes de maintenance",
    s2_desc: "Signalez une panne ou demandez une intervention. Suivez l'avancement en temps réel.",
    s3_title: "Documents & Contrats",
    s3_desc: "Accédez à vos contrats, attestations et quittances à tout moment, depuis n'importe quel appareil.",
    s4_title: "Annonces résidence",
    s4_desc: "Restez informé des actualités, travaux planifiés et événements de votre résidence en temps réel.",
    s5_title: "Agent Orchid IA",
    s5_desc: "Votre assistant intelligent répond à vos questions, anticipe vos besoins et vous guide 24h/24.",
    s6_title: "Espace communauté",
    s6_desc: "Échangez avec vos voisins, organisez des services partagés et participez à la vie de votre résidence.",
    learn_more: "En savoir plus →",
    discover: "Découvrir →",
    agent_badge: "Intelligence Artificielle",
    agent_title1: "Rencontrez",
    agent_title2: "Agent Orchid IA",
    agent_desc: "Votre assistant personnel propulsé par l'IA de pointe. Il connaît votre contrat, votre historique de paiements et les règles de votre résidence.",
    agent_f1: "Réponses instantanées à vos questions de résidence",
    agent_f2: "Rappels de paiements et d'échéances automatiques",
    agent_f3: "Assistance en français et arabe 24h/24",
    agent_f4: "Création de tickets de maintenance par conversation",
    agent_cta: "💬 Parler à Orchid IA",
    agent_online: "En ligne · Répond en <5 sec",
    msg1: "Bonjour Mohamed ! 👋 Je vois que votre prochain loyer est le",
    msg1b: "15 janvier",
    msg1c: ". Puis-je vous aider avec autre chose ?",
    msg2: "Oui, le robinet de ma cuisine fuit depuis hier.",
    msg3a: "J'ai créé un ticket de maintenance",
    msg3b: "#MT-2847",
    msg3c: "pour vous. Un technicien vous contactera dans les",
    msg3d: "2 heures",
    msg3e: ". 🔧",
    chat_ph: "Posez votre question…",
    cta_badge: "Votre espace vous attend",
    cta_title1: "Prêt à simplifier",
    cta_title2: "votre vie résidentielle ?",
    cta_desc: "Rejoignez les 247 résidents qui gèrent leur quotidien depuis notre plateforme.",
    cta_btn1: "🔑 Accéder à mon espace",
    cta_btn2: "📞 Contacter la gérance",
    footer_desc: "Votre résidence de standing à Casablanca, gérée avec excellence et accompagnée par l'intelligence artificielle.",
    nav_nav: "Navigation",
    espace: "Espace résident",
    f_accueil: "Accueil",
    f_connexion: "Connexion",
    f_paiements: "Mes paiements",
    f_maintenance: "Maintenance",
    f_docs: "Mes documents",
    f_contact: "Contact",
    f_powered: "Propulsé par Agent Orchid IA ✦",
    f_copy: "© 2026 Résidence Les Orchidées 2. Tous droits réservés.",
  },
  ar: {
    nav_name: "أوركيدي 2",
    nav_sub: "مجمع سكني فاخر",
    nav_services: "الخدمات",
    nav_agent: "المساعد الذكي",
    nav_contact: "اتصل بنا",
    nav_cta: "← الدخول إلى فضائي",
    hero_eyebrow: "مجمع فاخر · الدار البيضاء",
    hero_title1: "مرحباً في",
    hero_title2: "فضاءك",
    hero_title3: "المثالي للعيش",
    hero_desc: "أدِر سكنك ومدفوعاتك وطلباتك من منصة واحدة. مساعدك الذكي متاح على مدار الساعة لمرافقتك.",
    hero_cta1: "🔑 الدخول إلى فضائي",
    hero_cta2: "✨ اكتشاف المساعد الذكي",
    hero_card_title: "مساعد أوركيد الذكي",
    hero_card_sub: "مساعد شخصي على مدار الساعة",
    hero_chat1: "مرحباً! أنا مساعدك أوركيد. كيف يمكنني مساعدتك؟",
    hero_chat2: "ما هو موعد دفعتي القادمة؟",
    hero_badge1: "رضا السكان",
    hero_badge2: "ساكن نشط",
    hero_next: "الموعد القادم",
    hero_status: "محدّث",
    hero_pay_status: "حالة المدفوعات",
    stat1_label: "ساكن",
    stat2_label: "رضا",
    stat3_label: "وقت الاستجابة",
    stat4_label: "دعم ذكي",
    services_badge: "الميزات",
    services_title1: "كل ما تحتاجه",
    services_title2: "في مكان واحد",
    services_desc: "فضاؤك السكني الرقمي يجمع كل الميزات لحياة يومية مبسطة.",
    s1_title: "المدفوعات الإلكترونية",
    s1_desc: "ادفع إيجارك والرسوم ببضع نقرات. سجل كامل وإيصالات تلقائية.",
    s2_title: "طلبات الصيانة",
    s2_desc: "أبلغ عن عطل أو اطلب تدخلاً. تابع التقدم في الوقت الفعلي.",
    s3_title: "الوثائق والعقود",
    s3_desc: "اطلع على عقودك وشهاداتك ووصولاتك في أي وقت من أي جهاز.",
    s4_title: "إعلانات المجمع",
    s4_desc: "ابق على اطلاع بآخر الأخبار والأعمال المخططة وفعاليات مجمعك.",
    s5_title: "مساعد أوركيد الذكي",
    s5_desc: "مساعدك الذكي يجيب على أسئلتك ويتوقع احتياجاتك ويرشدك على مدار الساعة.",
    s6_title: "فضاء المجتمع",
    s6_desc: "تواصل مع جيرانك ونظّم الخدمات المشتركة وشارك في حياة مجمعك.",
    learn_more: "← اعرف أكثر",
    discover: "← اكتشف",
    agent_badge: "الذكاء الاصطناعي",
    agent_title1: "تعرّف على",
    agent_title2: "مساعد أوركيد الذكي",
    agent_desc: "مساعدك الشخصي المدعوم بأحدث تقنيات الذكاء الاصطناعي. يعرف عقدك وسجل مدفوعاتك وقواعد مجمعك.",
    agent_f1: "إجابات فورية على أسئلتك السكنية",
    agent_f2: "تذكيرات تلقائية بالمدفوعات والمواعيد",
    agent_f3: "مساعدة بالفرنسية والعربية على مدار الساعة",
    agent_f4: "إنشاء تذاكر الصيانة عبر المحادثة",
    agent_cta: "💬 التحدث مع أوركيد",
    agent_online: "متصل · يجيب خلال أقل من 5 ثوانٍ",
    msg1: "مرحباً محمد ! 👋 أرى أن دفعتك القادمة في",
    msg1b: "15 يناير",
    msg1c: ". هل يمكنني مساعدتك في شيء آخر؟",
    msg2: "نعم، حنفية المطبخ تسرّب منذ الأمس.",
    msg3a: "لقد أنشأت تذكرة صيانة",
    msg3b: "#MT-2847",
    msg3c: "لك. سيتصل بك تقني خلال",
    msg3d: "ساعتين",
    msg3e: ". 🔧",
    chat_ph: "اطرح سؤالك…",
    cta_badge: "فضاؤك ينتظرك",
    cta_title1: "هل أنت مستعد لتبسيط",
    cta_title2: "حياتك السكنية؟",
    cta_desc: "انضم إلى 247 ساكناً يديرون حياتهم اليومية من منصتنا.",
    cta_btn1: "🔑 الدخول إلى فضائي",
    cta_btn2: "📞 التواصل مع الإدارة",
    footer_desc: "مجمعك الفاخر في الدار البيضاء، يُدار بامتياز ويرافقه الذكاء الاصطناعي.",
    nav_nav: "التنقل",
    espace: "فضاء الساكن",
    f_accueil: "الرئيسية",
    f_connexion: "تسجيل الدخول",
    f_paiements: "مدفوعاتي",
    f_maintenance: "الصيانة",
    f_docs: "وثائقي",
    f_contact: "التواصل",
    f_powered: "مدعوم بمساعد أوركيد الذكي ✦",
    f_copy: "© 2026 مجمع أوركيدي 2. جميع الحقوق محفوظة.",
  },
};

function useFadeIn() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, visible } = useFadeIn();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

export default function LandingPage() {
  const [lang, setLang] = useState<Lang>("fr");
  const [scrolled, setScrolled] = useState(false);
  const t = T[lang];
  const isRtl = lang === "ar";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toggleLang = useCallback(() => setLang((l) => (l === "fr" ? "ar" : "fr")), []);

  return (
    <div dir={isRtl ? "rtl" : "ltr"} style={{ fontFamily: isRtl ? "'Noto Naskh Arabic', serif" : "var(--font-geist-sans, system-ui, sans-serif)", overflowX: "hidden" }}>

      {/* ── NAVBAR ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
        background: scrolled ? "rgba(20,83,45,0.97)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        boxShadow: scrolled ? "0 2px 20px rgba(0,0,0,0.25)" : "none",
        transition: "background 0.3s, box-shadow 0.3s",
        padding: "0 24px",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 72 }}>
          <a href="#" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 40, height: 40, background: "linear-gradient(135deg, #d4af37, #b8960c)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, boxShadow: "0 4px 12px rgba(212,175,55,0.4)" }}>🌸</div>
            <div style={{ color: "#fff" }}>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 16, fontWeight: 600, lineHeight: "1.2" }}>{t.nav_name}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", letterSpacing: "0.5px" }}>{t.nav_sub}</div>
            </div>
          </a>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <a href="#services" style={{ color: "rgba(255,255,255,0.8)", textDecoration: "none", fontSize: 14, fontWeight: 500, padding: "8px 14px", borderRadius: 6 }} className="hidden md:block">{t.nav_services}</a>
            <a href="#agent" style={{ color: "rgba(255,255,255,0.8)", textDecoration: "none", fontSize: 14, fontWeight: 500, padding: "8px 14px", borderRadius: 6 }} className="hidden md:block">{t.nav_agent}</a>
            <button onClick={toggleLang} style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)", color: "#fff", fontSize: 13, fontWeight: 600, padding: "6px 14px", borderRadius: 20, cursor: "pointer" }}>
              {lang === "fr" ? "عربي" : "Français"}
            </button>
            <Link href="/login" style={{ background: "linear-gradient(135deg, #d4af37, #b8960c)", color: "#14532d", fontSize: 14, fontWeight: 700, padding: "10px 22px", borderRadius: 25, textDecoration: "none", boxShadow: "0 4px 14px rgba(212,175,55,0.4)" }}>
              {t.nav_cta}
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ minHeight: "100vh", background: "linear-gradient(135deg, #14532d 0%, #0f3d20 40%, #1a5c30 100%)", display: "flex", alignItems: "center", overflow: "hidden", position: "relative" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 20% 50%, rgba(212,175,55,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(212,175,55,0.06) 0%, transparent 40%)" }} />
        <div style={{ position: "relative", zIndex: 2, width: "100%", maxWidth: 1200, margin: "0 auto", padding: "100px 24px 60px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center" }}
          className="hero-grid">
          {/* Left */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24, flexDirection: isRtl ? "row-reverse" : "row" }}>
              <div style={{ width: 40, height: 2, background: "#d4af37", borderRadius: 2 }} />
              <span style={{ color: "#d4af37", fontSize: 12, fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase" }}>{t.hero_eyebrow}</span>
            </div>
            <h1 style={{ fontFamily: "Georgia, serif", fontSize: "clamp(36px, 5vw, 58px)", fontWeight: 700, color: "#fff", lineHeight: 1.15, marginBottom: 20 }}>
              {t.hero_title1}<br />
              <em style={{ color: "#d4af37" }}>{t.hero_title2}</em><br />
              {t.hero_title3}
            </h1>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 17, lineHeight: 1.7, marginBottom: 36, maxWidth: 480 }}>{t.hero_desc}</p>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <Link href="/login" style={{ background: "linear-gradient(135deg, #d4af37, #b8960c)", color: "#14532d", fontSize: 15, fontWeight: 700, padding: "16px 32px", borderRadius: 30, textDecoration: "none", boxShadow: "0 6px 24px rgba(212,175,55,0.4)", display: "inline-flex", alignItems: "center", gap: 8 }}>
                {t.hero_cta1}
              </Link>
              <a href="#agent" style={{ background: "transparent", color: "#fff", fontSize: 15, fontWeight: 500, padding: "15px 28px", borderRadius: 30, textDecoration: "none", border: "1.5px solid rgba(255,255,255,0.35)", display: "inline-flex", alignItems: "center", gap: 8 }}>
                {t.hero_cta2}
              </a>
            </div>
          </div>

          {/* Right — cards */}
          <div style={{ position: "relative", padding: "20px 30px 20px 0" }} className="hidden lg:block">
            {/* Float badge top */}
            <div style={{ position: "absolute", top: -20, right: -10, background: "#fff", borderRadius: 12, padding: "12px 16px", boxShadow: "0 12px 40px rgba(0,0,0,0.18)", display: "flex", alignItems: "center", gap: 10, fontSize: 13, fontWeight: 600, color: "#374151", whiteSpace: "nowrap", animation: "float 3s ease-in-out infinite", zIndex: 3 }}>
              <span style={{ fontSize: 20, fontWeight: 700, color: "#166534", fontFamily: "Georgia, serif" }}>98%</span>
              {t.hero_badge1}
            </div>
            {/* Agent card */}
            <div style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 20, padding: 24, color: "#fff", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div style={{ width: 44, height: 44, background: "linear-gradient(135deg,rgba(212,175,55,.25),rgba(212,175,55,.1))", border: "1px solid rgba(212,175,55,.3)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🤖</div>
                <div>
                  <div style={{ fontFamily: "Georgia, serif", fontSize: 16, fontWeight: 600 }}>{t.hero_card_title}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{t.hero_card_sub}</div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ background: "rgba(212,175,55,.15)", border: "1px solid rgba(212,175,55,.2)", padding: "10px 14px", borderRadius: "4px 12px 12px 12px", fontSize: 13, color: "rgba(255,255,255,.9)", maxWidth: "85%", alignSelf: isRtl ? "flex-end" : "flex-start" }}>{t.hero_chat1}</div>
                <div style={{ background: "rgba(255,255,255,.15)", padding: "10px 14px", borderRadius: "12px 4px 12px 12px", fontSize: 13, color: "rgba(255,255,255,.9)", maxWidth: "85%", alignSelf: isRtl ? "flex-start" : "flex-end" }}>{t.hero_chat2}</div>
                <TypingDots />
              </div>
            </div>
            {/* Status card */}
            <div style={{ background: "rgba(212,175,55,.08)", border: "1px solid rgba(212,175,55,.2)", borderRadius: 20, padding: 24, color: "#fff" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: "Georgia, serif", fontSize: 28, color: "#d4af37", fontWeight: 700 }}>15 Jan</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,.5)", marginTop: 4 }}>{t.hero_next}</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: "Georgia, serif", fontSize: 28, color: "#4ade80", fontWeight: 700 }}>{t.hero_status}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,.5)", marginTop: 4 }}>{t.hero_pay_status}</div>
                </div>
              </div>
            </div>
            {/* Float badge bottom */}
            <div style={{ position: "absolute", bottom: 10, left: -20, background: "#fff", borderRadius: 12, padding: "12px 16px", boxShadow: "0 12px 40px rgba(0,0,0,0.18)", display: "flex", alignItems: "center", gap: 10, fontSize: 13, fontWeight: 600, color: "#374151", whiteSpace: "nowrap", animation: "float 3s ease-in-out 1.5s infinite", zIndex: 3 }}>
              <span style={{ fontSize: 20, fontWeight: 700, color: "#166534", fontFamily: "Georgia, serif" }}>247</span>
              {t.hero_badge2}
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{ background: "#fff", borderBottom: "1px solid #f3f4f6" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4, 1fr)" }}>
          {[
            { num: "247", label: t.stat1_label },
            { num: "98%", label: t.stat2_label },
            { num: "<2h", label: t.stat3_label },
            { num: "24/7", label: t.stat4_label },
          ].map((s, i) => (
            <FadeIn key={i} delay={i * 100}>
              <div style={{ padding: "32px 24px", borderRight: "1px solid #f3f4f6", textAlign: "center" }}>
                <div style={{ fontFamily: "Georgia, serif", fontSize: 36, fontWeight: 700, color: "#166534", lineHeight: 1, marginBottom: 6 }}>{s.num}</div>
                <div style={{ fontSize: 13, color: "#6b7280", fontWeight: 500 }}>{s.label}</div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section id="services" style={{ padding: "96px 0", background: "#f9fafb" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
          <FadeIn>
            <div style={{ textAlign: "center", marginBottom: 64 }}>
              <span style={{ display: "inline-block", background: "#fef9e7", color: "#b8960c", border: "1px solid rgba(212,175,55,.3)", fontSize: 11, fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase", padding: "4px 14px", borderRadius: 20, marginBottom: 16 }}>{t.services_badge}</span>
              <h2 style={{ fontFamily: "Georgia, serif", fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 700, color: "#111827", lineHeight: 1.25, marginBottom: 14 }}>
                {t.services_title1}<br />
                <em style={{ color: "#166534" }}>{t.services_title2}</em>
              </h2>
              <p style={{ fontSize: 17, color: "#6b7280", maxWidth: 560, margin: "0 auto" }}>{t.services_desc}</p>
            </div>
          </FadeIn>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }} className="services-grid">
            {[
              { icon: "💳", title: t.s1_title, desc: t.s1_desc, link: t.learn_more, href: "#" },
              { icon: "🔧", title: t.s2_title, desc: t.s2_desc, link: t.learn_more, href: "#" },
              { icon: "📄", title: t.s3_title, desc: t.s3_desc, link: t.learn_more, href: "#" },
              { icon: "📢", title: t.s4_title, desc: t.s4_desc, link: t.learn_more, href: "#" },
              { icon: "🤖", title: t.s5_title, desc: t.s5_desc, link: t.discover, href: "#agent" },
              { icon: "🏘️", title: t.s6_title, desc: t.s6_desc, link: t.learn_more, href: "#" },
            ].map((s, i) => (
              <FadeIn key={i} delay={Math.floor(i / 3) * 100 + (i % 3) * 100}>
                <ServiceCard icon={s.icon} title={s.title} desc={s.desc} link={s.link} href={s.href} />
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── AGENT ORCHID IA ── */}
      <section id="agent" style={{ padding: "96px 0", background: "linear-gradient(135deg, #14532d 0%, #0d3018 100%)", position: "relative", overflow: "hidden" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }} className="agent-grid">
            <FadeIn>
              <div>
                <span style={{ display: "inline-block", background: "rgba(212,175,55,.12)", color: "#d4af37", border: "1px solid rgba(212,175,55,.3)", fontSize: 11, fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase", padding: "4px 14px", borderRadius: 20, marginBottom: 20 }}>{t.agent_badge}</span>
                <h2 style={{ fontFamily: "Georgia, serif", fontSize: "clamp(30px,4vw,44px)", fontWeight: 700, color: "#fff", lineHeight: 1.2, marginBottom: 18 }}>
                  {t.agent_title1}<br />
                  <em style={{ color: "#d4af37" }}>{t.agent_title2}</em>
                </h2>
                <p style={{ color: "rgba(255,255,255,.65)", fontSize: 16, lineHeight: 1.7, marginBottom: 32 }}>{t.agent_desc}</p>
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 14, marginBottom: 36 }}>
                  {[t.agent_f1, t.agent_f2, t.agent_f3, t.agent_f4].map((f, i) => (
                    <li key={i} style={{ display: "flex", alignItems: "center", gap: 12, color: "rgba(255,255,255,.8)", fontSize: 15 }}>
                      <span style={{ color: "#d4af37", fontSize: 16, flexShrink: 0 }}>✦</span> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/login" style={{ background: "linear-gradient(135deg, #d4af37, #b8960c)", color: "#14532d", fontSize: 14, fontWeight: 700, padding: "14px 28px", borderRadius: 30, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8, boxShadow: "0 6px 24px rgba(212,175,55,0.4)" }}>
                  {t.agent_cta}
                </Link>
              </div>
            </FadeIn>
            <FadeIn delay={200}>
              <div style={{ background: "rgba(255,255,255,.06)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 20, overflow: "hidden" }}>
                {/* Header */}
                <div style={{ background: "rgba(212,175,55,.1)", borderBottom: "1px solid rgba(255,255,255,.1)", padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 36, height: 36, background: "linear-gradient(135deg, #d4af37, #b8960c)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🌸</div>
                  <div>
                    <div style={{ color: "#fff", fontSize: 14, fontWeight: 600 }}>Orchid IA</div>
                    <div style={{ color: "rgba(255,255,255,.5)", fontSize: 11 }}>
                      <span style={{ display: "inline-block", width: 7, height: 7, background: "#4ade80", borderRadius: "50%", marginRight: 5, animation: "blink 2s ease-in-out infinite" }} />
                      {t.agent_online}
                    </div>
                  </div>
                </div>
                {/* Messages */}
                <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14, minHeight: 260 }}>
                  <ChatMsg side="agent" avatar="🌸" isRtl={isRtl}>
                    {t.msg1} <span style={{ color: "#d4af37", fontWeight: 600 }}>{t.msg1b}</span>{t.msg1c}
                  </ChatMsg>
                  <ChatMsg side="user" avatar="👤" isRtl={isRtl}>{t.msg2}</ChatMsg>
                  <ChatMsg side="agent" avatar="🌸" isRtl={isRtl}>
                    {t.msg3a} <span style={{ color: "#d4af37", fontWeight: 600 }}>{t.msg3b}</span> {t.msg3c} <span style={{ color: "#d4af37", fontWeight: 600 }}>{t.msg3d}</span>{t.msg3e}
                  </ChatMsg>
                </div>
                {/* Input */}
                <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,.1)", display: "flex", gap: 10 }}>
                  <div style={{ flex: 1, background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.15)", borderRadius: 20, padding: "10px 16px", color: "rgba(255,255,255,.4)", fontSize: 13 }}>{t.chat_ph}</div>
                  <div style={{ width: 38, height: 38, background: "linear-gradient(135deg,#d4af37,#b8960c)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, cursor: "pointer", flexShrink: 0 }}>➤</div>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ background: "#dcfce7", padding: "96px 0", textAlign: "center" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
          <FadeIn>
            <span style={{ display: "inline-block", background: "rgba(22,101,52,.1)", color: "#166534", border: "1px solid rgba(22,101,52,.2)", fontSize: 11, fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase", padding: "4px 14px", borderRadius: 20, marginBottom: 20 }}>{t.cta_badge}</span>
            <h2 style={{ fontFamily: "Georgia, serif", fontSize: "clamp(30px, 4vw, 48px)", fontWeight: 700, color: "#14532d", lineHeight: 1.2, marginBottom: 16 }}>
              {t.cta_title1}<br />
              <em style={{ color: "#b8960c" }}>{t.cta_title2}</em>
            </h2>
            <p style={{ fontSize: 17, color: "#6b7280", marginBottom: 40, maxWidth: 500, margin: "0 auto 40px" }}>{t.cta_desc}</p>
            <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/login" style={{ background: "#166534", color: "#fff", fontSize: 16, fontWeight: 700, padding: "16px 36px", borderRadius: 30, textDecoration: "none", boxShadow: "0 6px 24px rgba(22,101,52,.35)", display: "inline-flex", alignItems: "center", gap: 8 }}>
                {t.cta_btn1}
              </Link>
              <a href="#contact" style={{ background: "transparent", color: "#14532d", fontSize: 15, fontWeight: 500, padding: "15px 28px", borderRadius: 30, textDecoration: "none", border: "1.5px solid rgba(22,101,52,.35)", display: "inline-flex", alignItems: "center", gap: 8 }}>
                {t.cta_btn2}
              </a>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer id="contact" style={{ background: "#14532d", color: "rgba(255,255,255,.7)", padding: "64px 0 32px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 48, marginBottom: 48 }} className="footer-grid">
            <div>
              <a href="#" style={{ display: "inline-flex", alignItems: "center", gap: 10, textDecoration: "none", marginBottom: 16 }}>
                <div style={{ width: 36, height: 36, background: "linear-gradient(135deg,#d4af37,#b8960c)", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🌸</div>
                <div style={{ color: "#fff" }}>
                  <div style={{ fontFamily: "Georgia,serif", fontSize: 15, fontWeight: 600 }}>{t.nav_name}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,.6)" }}>{t.nav_sub}</div>
                </div>
              </a>
              <p style={{ fontSize: 14, lineHeight: 1.7, maxWidth: 280 }}>{t.footer_desc}</p>
            </div>
            <FooterCol title={t.nav_nav} links={[{ label: t.f_accueil, href: "#" }, { label: t.nav_services, href: "#services" }, { label: t.nav_agent, href: "#agent" }, { label: t.f_contact, href: "#contact" }]} />
            <FooterCol title={t.espace} links={[{ label: t.f_connexion, href: "/login" }, { label: t.f_paiements, href: "/dashboard" }, { label: t.f_maintenance, href: "/dashboard" }, { label: t.f_docs, href: "/dashboard" }]} />
            <FooterCol title={t.f_contact} links={[{ label: "📍 Casablanca, Maroc", href: "#" }, { label: "📞 +212 6 00 00 00 00", href: "tel:+212600000000" }, { label: "✉️ contact@orchidees2.ma", href: "mailto:contact@orchidees2.ma" }]} />
          </div>
          <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,.1)", marginBottom: 24 }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, flexWrap: "wrap", gap: 8 }}>
            <span style={{ color: "rgba(255,255,255,.4)" }}>{t.f_copy}</span>
            <span style={{ color: "#d4af37" }}>{t.f_powered}</span>
          </div>
        </div>
      </footer>

      {/* ── GLOBAL STYLES ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;500;600;700&display=swap');
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.3} }
        @keyframes dot-bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-5px)} }
        .dot-anim { animation: dot-bounce 0.9s ease infinite; }
        .dot-anim:nth-child(2) { animation-delay: 0.15s; }
        .dot-anim:nth-child(3) { animation-delay: 0.3s; }
        @media (max-width: 1024px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .agent-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
        }
        @media (max-width: 900px) {
          .services-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .footer-grid { grid-template-columns: 1fr 1fr !important; gap: 32px !important; }
        }
        @media (max-width: 600px) {
          .services-grid { grid-template-columns: 1fr !important; }
          .footer-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 768px) {
          .hidden.md\\:block { display: none !important; }
        }
        @media (min-width: 769px) {
          .hidden.md\\:block { display: block; }
        }
        @media (max-width: 1023px) {
          .hidden.lg\\:block { display: none !important; }
        }
        @media (min-width: 1024px) {
          .hidden.lg\\:block { display: block; }
        }
      `}</style>
    </div>
  );
}

function TypingDots() {
  return (
    <div style={{ background: "rgba(212,175,55,.15)", border: "1px solid rgba(212,175,55,.2)", padding: "10px 14px", borderRadius: "4px 12px 12px 12px", fontSize: 13, maxWidth: "85%", display: "inline-flex", gap: 4, alignItems: "center" }}>
      <span className="dot-anim" style={{ width: 6, height: 6, background: "#d4af37", borderRadius: "50%", display: "inline-block" }} />
      <span className="dot-anim" style={{ width: 6, height: 6, background: "#d4af37", borderRadius: "50%", display: "inline-block", animationDelay: "0.15s" }} />
      <span className="dot-anim" style={{ width: 6, height: 6, background: "#d4af37", borderRadius: "50%", display: "inline-block", animationDelay: "0.3s" }} />
    </div>
  );
}

function ChatMsg({ side, avatar, children, isRtl }: { side: "agent" | "user"; children: React.ReactNode; avatar: string; isRtl: boolean }) {
  const isAgent = side === "agent";
  const isUserSide = isRtl ? isAgent : !isAgent;
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start", flexDirection: isUserSide ? "row-reverse" : "row" }}>
      <div style={{ width: 32, height: 32, borderRadius: "50%", background: isAgent ? "rgba(212,175,55,.2)" : "rgba(255,255,255,.12)", border: `1px solid ${isAgent ? "rgba(212,175,55,.3)" : "rgba(255,255,255,.2)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>{avatar}</div>
      <div style={{
        background: isAgent ? "rgba(255,255,255,.08)" : "rgba(212,175,55,.12)",
        border: `1px solid ${isAgent ? "rgba(255,255,255,.1)" : "rgba(212,175,55,.2)"}`,
        padding: "10px 14px",
        borderRadius: isUserSide ? "12px 4px 12px 12px" : "4px 12px 12px 12px",
        color: "rgba(255,255,255,.85)",
        fontSize: 13.5,
        lineHeight: 1.5,
        maxWidth: "75%",
      }}>{children}</div>
    </div>
  );
}

function ServiceCard({ icon, title, desc, link, href }: { icon: string; title: string; desc: string; link: string; href: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <a href={href} style={{ display: "block", textDecoration: "none", background: "#fff", border: `1px solid ${hovered ? "transparent" : "#f3f4f6"}`, borderRadius: 20, padding: "36px 28px", transition: "transform 0.3s, box-shadow 0.3s, border-color 0.3s", transform: hovered ? "translateY(-6px)" : "none", boxShadow: hovered ? "0 12px 40px rgba(0,0,0,.18)" : "none", position: "relative", overflow: "hidden" }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #166534, #d4af37)", transform: hovered ? "scaleX(1)" : "scaleX(0)", transformOrigin: "left", transition: "transform 0.3s" }} />
      <div style={{ width: 56, height: 56, background: "#dcfce7", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, marginBottom: 20 }}>{icon}</div>
      <h3 style={{ fontFamily: "Georgia, serif", fontSize: 20, fontWeight: 600, color: "#111827", marginBottom: 10 }}>{title}</h3>
      <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.65 }}>{desc}</p>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#166534", fontSize: 14, fontWeight: 600, marginTop: 16 }}>{link}</span>
    </a>
  );
}

function FooterCol({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h4 style={{ fontFamily: "Georgia, serif", color: "#fff", fontSize: 15, fontWeight: 600, marginBottom: 16 }}>{title}</h4>
      <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
        {links.map((l, i) => (
          <li key={i}><a href={l.href} style={{ color: "rgba(255,255,255,.55)", fontSize: 14, textDecoration: "none" }}>{l.label}</a></li>
        ))}
      </ul>
    </div>
  );
}
