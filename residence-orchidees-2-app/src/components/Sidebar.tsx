"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useLang } from "@/contexts/LangContext";
import {
  LayoutDashboard,
  Building2,
  Gauge,
  ClipboardList,
  Receipt,
  Wallet,
  Wrench,
  UserCheck,
  FolderOpen,
  LogOut,
  X,
  Layers,
  Users,
  TrendingUp,
  PieChart,
  UserCircle,
  MessageSquare,
  Database,
  FolderCog,
  UserPlus,
  Home,
  MessagesSquare,
  Hammer,
  ScanLine,
  HardHat,
  FileBarChart,
} from "lucide-react";

const gestionItems = [
  { key: "dashboard",     href: "/dashboard",              icon: LayoutDashboard },
  { key: "units",         href: "/dashboard/units",         icon: Building2 },
  { key: "meters",        href: "/dashboard/meters",        icon: Gauge },
  { key: "readings",      href: "/dashboard/readings",      icon: ClipboardList },
  { key: "invoices",      href: "/dashboard/invoices",      icon: Receipt },
  { key: "expenses",      href: "/dashboard/expenses",      icon: Wallet },
  { key: "interventions", href: "/dashboard/interventions", icon: Wrench },
  { key: "visits",        href: "/dashboard/visits",        icon: UserCheck },
  { key: "documents",     href: "/dashboard/documents",     icon: FolderOpen },
] as const;

const constructionItems = [
  { key: "construction", href: "/dashboard/construction", icon: HardHat,  labelFr: "Dossier construction", labelAr: "ملف البناء" },
  { key: "prestataires", href: "/dashboard/prestataires", icon: Hammer,   labelFr: "Corps de métier",      labelAr: "أصحاب المهن" },
] as const;

const commercialItems = [
  { key: "lots",      href: "/dashboard/lots",      icon: Layers },
  { key: "prospects", href: "/dashboard/prospects", icon: Users },
  { key: "sales",     href: "/dashboard/sales",     icon: TrendingUp },
  { key: "revenue",   href: "/dashboard/revenue",   icon: PieChart },
] as const;

const personnesItems = [
  { key: "occupants",   href: "/dashboard/occupants",   icon: Users,     labelFr: "Occupants",   labelAr: "الشاغلون" },
  { key: "acquereurs",  href: "/dashboard/acquereurs",  icon: UserPlus,  labelFr: "Acquéreurs",  labelAr: "المشترون المحتملون" },
  { key: "personnel",   href: "/dashboard/personnel",   icon: UserCheck, labelFr: "Personnel",   labelAr: "الموظفون" },
] as const;

const adminItems = [
  { key: "adminData",      href: "/dashboard/admin/data",      icon: Database,   labelFr: "Données / Rectif.",  labelAr: "بيانات / تصحيح" },
  { key: "adminDocuments", href: "/dashboard/admin/documents", icon: FolderCog,  labelFr: "Gestion documents",  labelAr: "إدارة الوثائق" },
] as const;

const navItems = [...gestionItems, ...commercialItems] as const;
type NavKey = typeof navItems[number]["key"];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { t, isRtl } = useLang();
  const { data: session } = useSession();
  const userRole = (session?.user as { role?: string })?.role;
  const isAdmin = userRole === "ADMIN";
  const isOccupant = userRole === "OCCUPANT";

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        dir={isRtl ? "rtl" : "ltr"}
        className={`
          no-print fixed top-0 z-30 h-full w-64 bg-green-800 text-white flex flex-col
          transition-transform duration-300 ease-in-out
          lg:static lg:translate-x-0 lg:shrink-0
          ${isRtl ? "right-0" : "left-0"}
          ${open
            ? "translate-x-0"
            : isRtl
            ? "translate-x-full"
            : "-translate-x-full"
          }
        `}
      >
        {/* Logo */}
        <div className="px-5 py-5 border-b border-green-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/15 rounded-xl flex items-center justify-center shrink-0">
              <Building2 size={20} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-white font-semibold text-sm leading-tight truncate">
                {t.appName}
              </p>
              <p className="text-green-300 text-xs truncate">{t.appSubtitle}</p>
            </div>
          </div>
          {/* Close btn — mobile only */}
          <button
            onClick={onClose}
            className="lg:hidden text-green-300 hover:text-white p-1 rounded-lg hover:bg-white/10"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {/* OCCUPANT: Espace personnel uniquement */}
        {isOccupant && (
          <>
            <p className="px-3 pt-1 pb-1 text-green-400 text-xs font-semibold uppercase tracking-widest">
              {isRtl ? "فضائي" : "Mon espace"}
            </p>
            {[
              { href: "/dashboard/mon-espace", icon: Home,            labelFr: "Mon logement",   labelAr: "مسكني" },
              { href: "/dashboard/messagerie", icon: MessagesSquare,  labelFr: "Messagerie",      labelAr: "المراسلة" },
            ].map(({ href, icon: Icon, labelFr, labelAr }) => (
              <Link key={href} href={href} onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors group ${isActive(href) ? "bg-white/15 text-white" : "text-green-200 hover:bg-white/10 hover:text-white"}`}>
                <Icon size={18} className={`shrink-0 ${isActive(href) ? "text-white" : "text-green-300 group-hover:text-white"}`} />
                <span>{isRtl ? labelAr : labelFr}</span>
                {isActive(href) && <span className={`${isRtl ? "mr-auto" : "ml-auto"} w-1.5 h-1.5 rounded-full bg-green-300`} />}
              </Link>
            ))}
          </>
        )}

        {/* ADMIN/MANAGER/VIEWER: Gestion section */}
        {!isOccupant && <p className="px-3 pt-1 pb-1 text-green-400 text-xs font-semibold uppercase tracking-widest">
          {isRtl ? "الإدارة" : "Gestion"}
        </p>}
        {!isOccupant && gestionItems.map(({ key, href, icon: Icon }) => (
          <Link
            key={key}
            href={href}
            onClick={onClose}
            className={`
              flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
              transition-colors group
              ${isActive(href)
                ? "bg-white/15 text-white"
                : "text-green-200 hover:bg-white/10 hover:text-white"
              }
            `}
          >
            <Icon size={18} className={`shrink-0 ${isActive(href) ? "text-white" : "text-green-300 group-hover:text-white"}`} />
            <span>{t.nav[key as NavKey]}</span>
            {isActive(href) && <span className={`${isRtl ? "mr-auto" : "ml-auto"} w-1.5 h-1.5 rounded-full bg-green-300`} />}
          </Link>
        ))}

        {/* Construction section */}
        {!isOccupant && <p className="px-3 pt-3 pb-1 text-green-400 text-xs font-semibold uppercase tracking-widest">
          {isRtl ? "البناء" : "Construction"}
        </p>}
        {!isOccupant && constructionItems.map(({ key, href, icon: Icon, labelFr, labelAr }) => (
          <Link key={key} href={href} onClick={onClose}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors group ${isActive(href) ? "bg-white/15 text-white" : "text-green-200 hover:bg-white/10 hover:text-white"}`}>
            <Icon size={18} className={`shrink-0 ${isActive(href) ? "text-white" : "text-green-300 group-hover:text-white"}`} />
            <span>{isRtl ? labelAr : labelFr}</span>
            {isActive(href) && <span className={`${isRtl ? "mr-auto" : "ml-auto"} w-1.5 h-1.5 rounded-full bg-green-300`} />}
          </Link>
        ))}

        {/* Messagerie for non-occupant */}
        {!isOccupant && (
          <Link href="/dashboard/messagerie" onClick={onClose}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors group ${isActive("/dashboard/messagerie") ? "bg-white/15 text-white" : "text-green-200 hover:bg-white/10 hover:text-white"}`}>
            <MessagesSquare size={18} className={`shrink-0 ${isActive("/dashboard/messagerie") ? "text-white" : "text-green-300 group-hover:text-white"}`} />
            <span>{isRtl ? "المراسلة" : "Messagerie"}</span>
          </Link>
        )}

        {/* Rapports PDF for non-occupant */}
        {!isOccupant && (
          <Link href="/dashboard/reports" onClick={onClose}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors group ${isActive("/dashboard/reports") ? "bg-white/15 text-white" : "text-green-200 hover:bg-white/10 hover:text-white"}`}>
            <FileBarChart size={18} className={`shrink-0 ${isActive("/dashboard/reports") ? "text-white" : "text-green-300 group-hover:text-white"}`} />
            <span>{isRtl ? "التقارير" : "Rapports PDF"}</span>
            {isActive("/dashboard/reports") && <span className={`${isRtl ? "mr-auto" : "ml-auto"} w-1.5 h-1.5 rounded-full bg-green-300`} />}
          </Link>
        )}

        {/* Scan intelligent for non-occupant */}
        {!isOccupant && (
          <Link href="/dashboard/scan" onClick={onClose}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors group ${isActive("/dashboard/scan") ? "bg-white/15 text-white" : "text-green-200 hover:bg-white/10 hover:text-white"}`}>
            <ScanLine size={18} className={`shrink-0 ${isActive("/dashboard/scan") ? "text-white" : "text-green-300 group-hover:text-white"}`} />
            <span>{isRtl ? "مسح ذكي" : "Scan intelligent"}</span>
            {isActive("/dashboard/scan") && <span className={`${isRtl ? "mr-auto" : "ml-auto"} w-1.5 h-1.5 rounded-full bg-green-300`} />}
            <span style={{ marginLeft: isRtl ? undefined : "auto", marginRight: isRtl ? "auto" : undefined, fontSize: 9, background: "rgba(124,58,237,0.3)", color: "#c4b5fd", padding: "1px 5px", borderRadius: 20, fontWeight: 700 }}>IA</span>
          </Link>
        )}

        {/* Commercial section */}
        {!isOccupant && <p className="px-3 pt-3 pb-1 text-green-400 text-xs font-semibold uppercase tracking-widest">
          {isRtl ? "التجاري" : "Commercial"}
        </p>}
        {!isOccupant && commercialItems.map(({ key, href, icon: Icon }) => (
            <Link
              key={key}
              href={href}
              onClick={onClose}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                transition-colors group
                ${isActive(href)
                  ? "bg-white/15 text-white"
                  : "text-green-200 hover:bg-white/10 hover:text-white"
                }
              `}
            >
              <Icon
                size={18}
                className={`shrink-0 ${
                  isActive(href) ? "text-white" : "text-green-300 group-hover:text-white"
                }`}
              />
              <span>{t.nav[key as NavKey]}</span>
              {isActive(href) && (
                <span className={`${isRtl ? "mr-auto" : "ml-auto"} w-1.5 h-1.5 rounded-full bg-green-300`} />
              )}
            </Link>
          ))}
        {/* Personnes section */}
        {!isOccupant && <p className="px-3 pt-3 pb-1 text-green-400 text-xs font-semibold uppercase tracking-widest">
          {isRtl ? "الأشخاص" : "Personnes"}
        </p>}
        {!isOccupant && personnesItems.map(({ key, href, icon: Icon, labelFr, labelAr }) => (
          <Link
            key={key}
            href={href}
            onClick={onClose}
            className={`
              flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
              transition-colors group
              ${isActive(href)
                ? "bg-white/15 text-white"
                : "text-green-200 hover:bg-white/10 hover:text-white"
              }
            `}
          >
            <Icon
              size={18}
              className={`shrink-0 ${isActive(href) ? "text-white" : "text-green-300 group-hover:text-white"}`}
            />
            <span>{isRtl ? labelAr : labelFr}</span>
            {isActive(href) && (
              <span className={`${isRtl ? "mr-auto" : "ml-auto"} w-1.5 h-1.5 rounded-full bg-green-300`} />
            )}
          </Link>
        ))}

        {/* Administration section — ADMIN only */}
        {isAdmin && (
          <>
            <p className="px-3 pt-3 pb-1 text-green-400 text-xs font-semibold uppercase tracking-widest">
              {isRtl ? "الإدارة" : "Administration"}
            </p>
            {adminItems.map(({ key, href, icon: Icon, labelFr, labelAr }) => (
              <Link
                key={key}
                href={href}
                onClick={onClose}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                  transition-colors group
                  ${isActive(href)
                    ? "bg-white/15 text-white"
                    : "text-green-200 hover:bg-white/10 hover:text-white"
                  }
                `}
              >
                <Icon
                  size={18}
                  className={`shrink-0 ${isActive(href) ? "text-white" : "text-green-300 group-hover:text-white"}`}
                />
                <span>{isRtl ? labelAr : labelFr}</span>
                {isActive(href) && (
                  <span className={`${isRtl ? "mr-auto" : "ml-auto"} w-1.5 h-1.5 rounded-full bg-green-300`} />
                )}
              </Link>
            ))}
          </>
        )}
        </nav>

        {/* Profile + Logout */}
        <div className="px-3 py-4 border-t border-green-700 space-y-0.5">
          <Link
            href="/dashboard/profile"
            onClick={onClose}
            className={`
              flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
              transition-colors group
              ${pathname === "/dashboard/profile"
                ? "bg-white/15 text-white"
                : "text-green-200 hover:bg-white/10 hover:text-white"}
            `}
          >
            <UserCircle size={18} className={`shrink-0 ${pathname === "/dashboard/profile" ? "text-white" : "text-green-300 group-hover:text-white"}`} />
            <span>{isRtl ? "ملفي الشخصي" : "Mon profil"}</span>
          </Link>
          {isAdmin && (
            <Link
              href="/dashboard/whatsapp"
              onClick={onClose}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                transition-colors group
                ${pathname === "/dashboard/whatsapp"
                  ? "bg-white/15 text-white"
                  : "text-green-200 hover:bg-white/10 hover:text-white"}
              `}
            >
              <MessageSquare size={18} className={`shrink-0 ${pathname === "/dashboard/whatsapp" ? "text-white" : "text-green-300 group-hover:text-white"}`} />
              <span>{isRtl ? "إعدادات واتساب" : "Config WhatsApp"}</span>
            </Link>
          )}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-green-200 hover:bg-white/10 hover:text-white transition-colors group"
          >
            <LogOut size={18} className="shrink-0 text-green-300 group-hover:text-white" />
            <span>{t.auth.logout}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
