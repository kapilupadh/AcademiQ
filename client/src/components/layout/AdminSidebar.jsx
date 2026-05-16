import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, UsersRound, BrainCircuit, LayoutPanelTop,
  UserSearch, GraduationCap, ClipboardList, MessageSquare,
  Settings2, ShieldCheck, ScrollText, FileText,
  ChevronLeft, ChevronRight, ChevronDown, LogOut, School, Menu, X, Upload,
  MapPin, BarChart2,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

/* ─── Font injection ────────────────────────────────────────────── */
const injectFont = () => {
  if (document.getElementById("dm-sans-font")) return;
  const link = Object.assign(document.createElement("link"), {
    id: "dm-sans-font", rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap",
  });
  document.head.appendChild(link);
};

const setSidebarWidth = (w) =>
  document.documentElement.style.setProperty("--admin-sidebar-w", w);

const LOGO_DARK_MODE  = "/Icons/Untitled.png";
const LOGO_LIGHT_MODE = "/Icons/Dark-Logo.jpg";

/* ─── Nav data (unchanged) ──────────────────────────────────────── */
const PRIMARY = [
  { key: "dashboard",    label: "Dashboard",          icon: LayoutDashboard, to: "/admin/dashboard" },
  { key: "access-req",   label: "Access Requests",    icon: ShieldCheck,     to: "/admin/access-requests",
    badge: { type: "new", text: "LIVE", style: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50" } },
  { key: "user-mgmt",    label: "User Management",    icon: UsersRound,      to: "/admin/generate-id",
    badge: { type: "chip", text: "ID", style: "bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400 border border-violet-200 dark:border-violet-900/50" } },
  { key: "exam-engine",  label: "Examination Engine", icon: BrainCircuit,    to: "/admin/exams",
    badge: { type: "new", text: "NEW", style: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700" } },
  { key: "att-reports",  label: "Attendance Reports", icon: BarChart2,       to: "/admin/attendance/report" },
];

const getSecondaryNav = (notificationsCount = 0) => [
  {
    key: "dashboard-details", label: "Dashboard Details", icon: LayoutPanelTop,
    sub: [
      { label: "System Overview",  icon: ShieldCheck,    to: "/admin/overview",   comingSoon: true },
      { label: "Analytics",        icon: ClipboardList,  to: "/admin/analytics",  comingSoon: true },
      { label: "Recent Activity",  icon: ScrollText,     to: "/admin/activity",   comingSoon: true },
    ],
  },
  {
    key: "user-details", label: "User Details", icon: UserSearch,
    sub: [
      { label: "All Students",       icon: GraduationCap, to: "/admin/users/students", comingSoon: true },
      { label: "All Teachers",       icon: UsersRound,    to: "/admin/users/teachers", comingSoon: true },
      { label: "All Admins",         icon: ShieldCheck,   to: "/admin/users/admins",   comingSoon: true },
      { label: "Generate Unique IDs",icon: ScrollText,    to: "/admin/generate-id" },
    ],
  },
  {
    key: "academics", label: "Academics", icon: GraduationCap,
    sub: [
      { label: "Manage Subjects",       icon: FileText,      to: "/admin/subjects/manage" },
      { label: "Import Subjects",       icon: Upload,        to: "/admin/subjects/import" },
      { label: "Department Locations",  icon: MapPin,        to: "/admin/departments/locations" },
      { label: "Classes & Sections",    icon: LayoutPanelTop,to: "/admin/academics/classes",    comingSoon: true },
      { label: "Timetable",             icon: ClipboardList, to: "/admin/academics/timetable",  comingSoon: true },
      { label: "Curriculum",            icon: ScrollText,    to: "/admin/academics/curriculum", comingSoon: true },
    ],
  },
  {
    key: "exam-details", label: "Exam Details", icon: BrainCircuit,
    sub: [
      { label: "Scheduled Exams",    icon: ClipboardList, to: "/admin/exams" },
      { label: "Results & Grades",   icon: ScrollText,    to: "/admin/exams/results",    comingSoon: true },
      { label: "Guidelines & Rules", icon: ShieldCheck,   to: "/admin/exams/guidelines", comingSoon: true },
      { label: "Exam Reports",       icon: FileText,      to: "/admin/exams/reports",    comingSoon: true },
    ],
  },
  {
    key: "communications", label: "Communications", icon: MessageSquare,
    badge: { type: "count", text: String(notificationsCount || 0), style: "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" },
    sub: [
      { label: "Announcements",   icon: ScrollText,    to: "/admin/comms/announcements", comingSoon: true },
      { label: "Notice Board",    icon: ClipboardList, to: "/admin/comms/notices",        comingSoon: true },
      { label: "Direct Messages", icon: MessageSquare, to: "/admin/comms/messages",       comingSoon: true },
    ],
  },
  {
    key: "system-settings", label: "System Settings", icon: Settings2,
    sub: [
      { label: "My Profile",          icon: UserSearch,   to: "/profile" },
      { label: "General Settings",    icon: Settings2,    to: "/admin/settings/general",    comingSoon: true },
      { label: "Roles & Permissions", icon: ShieldCheck,  to: "/admin/settings/roles",      comingSoon: true },
      { label: "Appearance",          icon: LayoutPanelTop,to: "/admin/settings/appearance", comingSoon: true },
      { label: "Audit Logs",          icon: ScrollText,   to: "/admin/settings/audit",      comingSoon: true },
    ],
  },
];

/* ─── Theme tokens — matches TeacherSidebar T exactly ───────────── */
const T = {
  dark: {
    bg: "bg-zinc-950",
    border: "border-zinc-800/80",
    label: "text-zinc-500",
    divider: "border-zinc-800/60",
    navBase: "text-zinc-400",
    navHover: "hover:bg-zinc-800/50 hover:text-zinc-50",
    navActive: "bg-zinc-800/70 text-zinc-50",
    activeBar: "bg-zinc-50",
    btn: "text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800/60",
    brand: "text-zinc-50",
    brandSub: "text-zinc-500",
    rolePill: "bg-violet-950/40 text-violet-400 border border-violet-900/50",
    avatar: "bg-zinc-800 text-zinc-200 border-zinc-700",
    userName: "text-zinc-100",
    email: "text-zinc-500",
    tooltip: "bg-zinc-900 border-zinc-800 text-zinc-50 shadow-lg",
    subActive: "text-zinc-50 bg-zinc-800/70",
    subBase: "text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800/50",
    subBorder: "border-zinc-800/60",
    soon: "bg-zinc-800/80 text-zinc-400 border-zinc-700/70",
    logoutHover: "hover:bg-red-500/10 hover:text-red-400",
  },
  light: {
    bg: "bg-white",
    border: "border-zinc-200",
    label: "text-zinc-500",
    divider: "border-zinc-200/70",
    navBase: "text-zinc-600",
    navHover: "hover:bg-zinc-100 hover:text-zinc-900",
    navActive: "bg-zinc-100 text-zinc-900",
    activeBar: "bg-zinc-900",
    btn: "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100",
    brand: "text-zinc-900",
    brandSub: "text-zinc-500",
    rolePill: "bg-violet-50 text-violet-700 border border-violet-200",
    avatar: "bg-zinc-100 text-zinc-700 border-zinc-200",
    userName: "text-zinc-900",
    email: "text-zinc-500",
    tooltip: "bg-zinc-900 border-zinc-800 text-zinc-50 shadow-lg",
    subActive: "text-zinc-900 bg-zinc-100",
    subBase: "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100",
    subBorder: "border-zinc-200/70",
    soon: "bg-zinc-100 text-zinc-500 border-zinc-200",
    logoutHover: "hover:bg-red-50 hover:text-red-600",
  },
};

/* ─── Badge ─────────────────────────────────────────────────────── */
function Badge({ badge, forIcon = false }) {
  if (!badge) return null;
  if (forIcon && badge.type === "count") {
    return (
      <span className={`absolute -top-1 -right-1 flex items-center justify-center w-3.5 h-3.5 rounded-full text-[9px] font-bold leading-none ${badge.style}`}>
        {badge.text}
      </span>
    );
  }
  if (forIcon) {
    return <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-violet-400" />;
  }
  if (badge.type === "count") {
    return (
      <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold leading-none shrink-0 ${badge.style}`}>
        {badge.text}
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-semibold tracking-wide leading-none shrink-0 ${badge.style}`}>
      {badge.text}
    </span>
  );
}

/* ─── Tooltip ───────────────────────────────────────────────────── */
function Tooltip({ label, tk }) {
  return (
    <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 pointer-events-none opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-150">
      <div className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap border ${tk.tooltip}`}>
        {label}
      </div>
    </div>
  );
}

/* ─── NavItem ───────────────────────────────────────────────────── */
function NavItem({ icon: Icon, label, to, badge, collapsed, tk, onClick }) {
  const { pathname } = useLocation();
  const isActive = pathname === to || (to !== "/admin/dashboard" && to.length > 1 && pathname.startsWith(to));
  const SafeIcon = Icon || LayoutDashboard;

  return (
    <div className="relative group">
      <Link
        to={to} onClick={onClick}
        className={`relative flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200
          ${collapsed ? "justify-center px-0 py-2.5 w-full" : "px-3 py-2"}
          ${isActive ? tk.navActive : `${tk.navBase} ${tk.navHover}`}`}
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        {isActive && !collapsed && (
          <motion.span
            layoutId="admin-active-bar"
            className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-full ${tk.activeBar}`}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
          />
        )}
        <span className="relative shrink-0">
          <SafeIcon size={16} strokeWidth={isActive ? 2.2 : 1.8} />
          {collapsed && <Badge badge={badge} forIcon />}
        </span>
        {!collapsed && (
          <>
            <span className="flex-1 truncate">{label}</span>
            <Badge badge={badge} />
          </>
        )}
      </Link>
      {collapsed && <Tooltip label={label} tk={tk} />}
    </div>
  );
}

/* ─── SectionLabel ──────────────────────────────────────────────── */
function SectionLabel({ text, collapsed, tk }) {
  if (collapsed) return <div className={`my-2 mx-auto w-5 border-t ${tk.divider}`} />;
  return (
    <p
      className={`text-[10px] font-semibold uppercase tracking-wider px-3 mb-1.5 mt-3 ${tk.label}`}
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {text}
    </p>
  );
}

/* ─── SubItem ───────────────────────────────────────────────────── */
function SubItem({ icon: Icon, label, to, comingSoon, tk, onClick }) {
  const { pathname } = useLocation();
  const isActive = !comingSoon && (pathname === to || (to.length > 1 && pathname.startsWith(to)));

  if (comingSoon) {
    return (
      <div
        className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium cursor-not-allowed select-none opacity-50 ${tk.subBase}`}
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        <Icon size={12} strokeWidth={1.8} className="shrink-0" />
        <span className="truncate flex-1">{label}</span>
        <span className={`text-[9px] font-semibold tracking-wide px-1.5 py-0.5 rounded-md border leading-none shrink-0 ${tk.soon}`}>
          Soon
        </span>
      </div>
    );
  }

  return (
    <Link
      to={to} onClick={onClick}
      className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium transition-all duration-150 ${isActive ? tk.subActive : tk.subBase}`}
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <Icon size={12} strokeWidth={isActive ? 2.2 : 1.8} className="shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  );
}

/* ─── AccordionGroup ────────────────────────────────────────────── */
function AccordionGroup({ icon: Icon, label, groupKey, badge, openGroups, onToggle, tk, collapsed, subItems, onItemClick }) {
  const { pathname } = useLocation();
  const isOpen = !!openGroups[groupKey];
  const hasActiveSub = subItems.some(
    (s) => !s.comingSoon && (pathname === s.to || (s.to.length > 1 && pathname.startsWith(s.to)))
  );

  if (collapsed) {
    return (
      <div className="relative group">
        <button className={`flex justify-center w-full py-2.5 rounded-lg transition-all duration-150 ${hasActiveSub ? tk.navActive : `${tk.navBase} ${tk.navHover}`}`}>
          <span className="relative">
            <Icon size={16} strokeWidth={hasActiveSub ? 2.2 : 1.8} />
            {badge && <Badge badge={badge} forIcon />}
          </span>
        </button>
        <Tooltip label={label} tk={tk} />
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => onToggle(groupKey)}
        className={`relative flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${hasActiveSub ? tk.navActive : `${tk.navBase} ${tk.navHover}`}`}
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        {hasActiveSub && (
          <motion.span
            layoutId={`admin-acc-bar-${groupKey}`}
            className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-full ${tk.activeBar}`}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
          />
        )}
        <Icon size={16} strokeWidth={hasActiveSub ? 2.2 : 1.8} className="shrink-0" />
        <span className="flex-1 text-left truncate">{label}</span>
        {badge && <Badge badge={badge} />}
        <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={13} strokeWidth={2} className="shrink-0" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className={`mt-0.5 ml-6 pl-3 border-l ${tk.subBorder} space-y-0.5 pb-1`}>
              {subItems.map((s) => (
                <SubItem key={s.to} icon={s.icon} label={s.label} to={s.to} comingSoon={s.comingSoon} tk={tk} onClick={onItemClick} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── SidebarContent ────────────────────────────────────────────── */
function SidebarContent({ collapsed, openGroups, onToggleGroup, onToggleCollapsed, onItemClick, showClose, onClose, mobileView, notificationsCount = 0 }) {
  const { isDark } = useTheme();
  const tk = isDark ? T.dark : T.light;
  const navigate = useNavigate();

  const user = (() => { try { return JSON.parse(localStorage.getItem("user")) || {}; } catch { return {}; } })();
  const name = user.full_name || user.name || "Admin";
  const email = user.email || "admin@academiq.com";
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/admin/login");
  };

  return (
    <div
      className={`flex flex-col h-full transition-all duration-300 ${tk.bg} ${tk.border} border-r ${!isDark ? "shadow-[4px_0_24px_-12px_rgba(0,0,0,0.08)]" : ""}`}
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* ── Header ── */}
      <div className={`flex items-center justify-between border-b ${tk.divider} h-16 shrink-0 ${collapsed ? "px-2" : "px-4"}`}>
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <img
            src={isDark ? LOGO_DARK_MODE : LOGO_LIGHT_MODE}
            alt="Logo"
            className="h-8 w-auto rounded-md object-contain shrink-0 transition-all duration-150"
            onError={(e) => { e.target.style.display = "none"; if (e.target.nextSibling) e.target.nextSibling.style.display = "flex"; }}
          />
          <div className="w-8 h-8 rounded-md bg-violet-600 items-center justify-center shrink-0 hidden">
            <School size={15} className="text-white" />
          </div>
          {!collapsed && (
            <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-md leading-none shrink-0 tracking-wider ${tk.rolePill}`}>
              ADMIN
            </span>
          )}
        </div>

        {!mobileView ? (
          <button
            onClick={onToggleCollapsed}
            className={`p-1.5 rounded-md transition-all duration-200 shrink-0 ml-1 ${tk.btn}`}
            title={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>
        ) : showClose ? (
          <button onClick={onClose} className={`p-1.5 rounded-md transition-all duration-200 shrink-0 ml-1 ${tk.btn}`}>
            <X size={16} />
          </button>
        ) : null}
      </div>

      {/* ── Primary nav ── */}
      <div className={`${collapsed ? "px-2" : "px-3"} pt-2 pb-1 overflow-hidden`}>
        <SectionLabel text="Main" collapsed={collapsed} tk={tk} />
        <nav className="space-y-0.5">
          {PRIMARY.map((item) => (
            <NavItem key={item.key} {...item} collapsed={collapsed} tk={tk} onClick={onItemClick} />
          ))}
        </nav>
      </div>

      <div className={`mx-3 border-t ${tk.divider} my-2 shrink-0`} />

      {/* ── Secondary nav (accordion) ── */}
      <div className={`flex-1 overflow-y-auto scrollbar-hide ${collapsed ? "px-2" : "px-3"} pb-2`}>
        <SectionLabel text="Management" collapsed={collapsed} tk={tk} />
        <div className="space-y-0.5">
          {getSecondaryNav(notificationsCount).map((item) => (
            <AccordionGroup
              key={item.key}
              groupKey={item.key}
              icon={item.icon}
              label={item.label}
              badge={item.badge}
              subItems={item.sub}
              openGroups={openGroups}
              onToggle={onToggleGroup}
              tk={tk}
              collapsed={collapsed}
              onItemClick={onItemClick}
            />
          ))}
        </div>
      </div>

      <div className={`mx-3 border-t ${tk.divider} shrink-0`} />

      {/* ── Footer / Account ── */}
      <div className={`overflow-hidden shrink-0 ${collapsed ? "px-2 py-3 flex justify-center" : "px-3 py-3"}`}>
        {collapsed ? (
          <div className="relative group">
            <button
              onClick={handleLogout}
              title="Logout"
              className={`p-2 rounded-md text-zinc-500 ${tk.logoutHover} transition-all duration-200`}
            >
              <LogOut size={15} />
            </button>
            <Tooltip label="Logout" tk={tk} />
          </div>
        ) : (
          <div className="flex flex-col w-full min-w-0">
            <SectionLabel text="Account" collapsed={false} tk={tk} />
            <div className={`flex items-center gap-2.5 min-w-0 mt-1 p-2 rounded-lg border ${tk.divider} transition-all duration-200`}>
              <div className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 ${tk.avatar}`}>
                <span className="text-[11px] font-semibold leading-none">{initials}</span>
              </div>
              <div className="flex flex-col flex-1 min-w-0 justify-center">
                <p className={`text-xs font-semibold truncate leading-tight ${tk.userName}`}>{name}</p>
                <p className={`text-[10px] truncate leading-tight mt-0.5 ${tk.email}`}>{email}</p>
              </div>
              <button
                onClick={handleLogout}
                title="Logout"
                className={`p-1.5 rounded-md text-zinc-500 ${tk.logoutHover} transition-all duration-200 shrink-0`}
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main export ───────────────────────────────────────────────── */
export default function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(() => {
    try { return JSON.parse(localStorage.getItem("adm_sidebar_collapsed")) ?? false; }
    catch { return false; }
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState({});
  const [unreadCount] = useState(0);

  useEffect(() => { injectFont(); }, []);

  useEffect(() => {
    setSidebarWidth(collapsed ? "72px" : "260px");
    localStorage.setItem("adm_sidebar_collapsed", JSON.stringify(collapsed));
    return () => setSidebarWidth("260px");
  }, [collapsed]);

  const toggleCollapsed = () => setCollapsed((p) => !p);
  const toggleGroup = (key) => setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  const sidebarW = collapsed ? 72 : 260;

  return (
    <>
      {/* Mobile trigger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-[9999] md:hidden p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all duration-200"
        aria-label="Open sidebar"
      >
        <Menu size={18} />
      </button>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm md:hidden"
          />
        )}
        {mobileOpen && (
          <motion.aside
            key="drawer"
            initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
            className="fixed left-0 top-0 bottom-0 z-[9999] w-[260px] shadow-2xl md:hidden"
          >
            <SidebarContent
              collapsed={false} openGroups={openGroups} onToggleGroup={toggleGroup}
              onToggleCollapsed={toggleCollapsed} onItemClick={() => setMobileOpen(false)}
              showClose onClose={() => setMobileOpen(false)} mobileView notificationsCount={unreadCount}
            />
          </motion.aside>
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ width: sidebarW }}
        transition={{ type: "spring", stiffness: 380, damping: 38 }}
        className="fixed left-0 top-0 bottom-0 z-40 hidden md:block overflow-hidden"
      >
        <SidebarContent
          collapsed={collapsed} openGroups={openGroups} onToggleGroup={toggleGroup}
          onToggleCollapsed={toggleCollapsed} onItemClick={null}
          showClose={false} onClose={null} mobileView={false} notificationsCount={unreadCount}
        />
      </motion.aside>
    </>
  );
}