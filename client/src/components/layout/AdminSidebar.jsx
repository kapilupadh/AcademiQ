import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  UsersRound,
  BrainCircuit,
  LayoutPanelTop,
  UserSearch,
  GraduationCap,
  ClipboardList,
  MessageSquare,
  Settings2,
  ShieldCheck,
  ScrollText,
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  School,
  Menu,
  X,
  Upload,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

/* ─── Google Font: DM Sans ─────────────────────────────────────── */
const injectFont = () => {
  if (document.getElementById("dm-sans-font")) return;
  const link = Object.assign(document.createElement("link"), {
    id: "dm-sans-font",
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap",
  });
  document.head.appendChild(link);
};

/* ─── CSS variable for content padding ─────────────────────────── */
const setSidebarWidth = (w) =>
  document.documentElement.style.setProperty("--admin-sidebar-w", w);

/* ─── Logo paths ────────────────────────────────────────────────── */
const LOGO_DARK_MODE = "/Icons/Untitled.png";
const LOGO_LIGHT_MODE = "/Icons/Dark-Logo.jpg";

/* ─── PRIMARY NAV ───────────────────────────────────────────────── */
const PRIMARY = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    to: "/admin/dashboard",
  },
  {
    key: "user-management",
    label: "User Management",
    icon: UsersRound,
    to: "/admin/generate-id",
    badge: {
      type: "chip",
      text: "ID",
      style: "bg-violet-500/15 text-violet-400 border border-violet-500/30",
    },
  },
  {
    key: "exam-engine",
    label: "Examination Engine",
    icon: BrainCircuit,
    to: "/admin/exams",
    badge: {
      type: "new",
      text: "NEW",
      style: "bg-violet-500/15 text-violet-400 border border-violet-500/30",
    },
  },
];

/* ─── SECONDARY NAV (all accordion) ────────────────────────────── */
const getSecondaryNav = (notificationsCount = 0) => [
  {
    key: "dashboard-details",
    label: "Dashboard Details",
    icon: LayoutPanelTop,
    sub: [
      { label: "System Overview", icon: ShieldCheck, to: "/admin/overview" },
      { label: "Analytics", icon: ClipboardList, to: "/admin/analytics" },
      { label: "Recent Activity", icon: ScrollText, to: "/admin/activity" },
    ],
  },
  {
    key: "user-details",
    label: "User Details",
    icon: UserSearch,
    sub: [
      { label: "All Students", icon: GraduationCap, to: "/admin/users/students" },
      { label: "All Teachers", icon: UsersRound, to: "/admin/users/teachers" },
      { label: "All Admins", icon: ShieldCheck, to: "/admin/users/admins" },
      { label: "Generate Unique IDs", icon: ScrollText, to: "/admin/generate-id" },
    ],
  },
  {
    key: "academics",
    label: "Academics",
    icon: GraduationCap,
    sub: [
     { label: "Manage Subjects", icon: FileText, to: "/admin/subjects/manage" }, //  ← NEW
      { label: "Import Subjects", icon: Upload, to: "/admin/subjects/import" }, // ← NEW
      { label: "Classes & Sections", icon: LayoutPanelTop, to: "/admin/academics/classes" },
      { label: "Timetable", icon: ClipboardList, to: "/admin/academics/timetable" },
      { label: "Curriculum", icon: ScrollText, to: "/admin/academics/curriculum" },
    ],
  },
  {
    key: "exam-details",
    label: "Exam Details",
    icon: BrainCircuit,
    sub: [
      { label: "Scheduled Exams", icon: ClipboardList, to: "/admin/exams" },
      { label: "Results & Grades", icon: ScrollText, to: "/admin/exams/results" },
      { label: "Guidelines & Rules", icon: ShieldCheck, to: "/admin/exams/guidelines" },
      { label: "Exam Reports", icon: FileText, to: "/admin/exams/reports" },
    ],
  },
  {
    key: "communications",
    label: "Communications",
    icon: MessageSquare,
    badge: {
      type: "count",
      text: String(notificationsCount || 0),
      style: "bg-violet-600 text-white",
    },
    sub: [
      { label: "Announcements", icon: ScrollText, to: "/admin/comms/announcements" },
      { label: "Notice Board", icon: ClipboardList, to: "/admin/comms/notices" },
      { label: "Direct Messages", icon: MessageSquare, to: "/admin/comms/messages" },
    ],
  },
  {
    key: "system-settings",
    label: "System Settings",
    icon: Settings2,
    sub: [
      { label: "General Settings", icon: Settings2, to: "/admin/settings/general" },
      { label: "Roles & Permissions", icon: ShieldCheck, to: "/admin/settings/roles" },
      { label: "Appearance", icon: LayoutPanelTop, to: "/admin/settings/appearance" },
      { label: "Audit Logs", icon: ScrollText, to: "/admin/settings/audit" },
    ],
  },
];

/* ─── THEME TOKENS (Violet accent) ─────────────────────────────── */
const T = {
  dark: {
    bg: "bg-[#0f1117]",
    border: "border-zinc-800",
    label: "text-zinc-600",
    divider: "border-zinc-800",
    navBase: "text-zinc-400",
    navHover: "hover:bg-zinc-800/60 hover:text-zinc-100",
    navActive: "bg-violet-500/12 text-violet-400",
    activeBar: "bg-violet-500",
    btn: "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800",
    brand: "text-white",
    brandSub: "text-zinc-500",
    rolePill: "bg-violet-900/40 text-violet-400 border border-violet-800/50",
    avatar: "bg-violet-900/40 text-violet-400 border-violet-800/40",
    userName: "text-zinc-100",
    email: "text-zinc-500",
    tooltip: "bg-zinc-900 border-zinc-700 text-white shadow-xl",
    subActive: "text-violet-400 bg-violet-500/10",
    subBase: "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60",
    subBorder: "border-zinc-800",
  },
  light: {
    bg: "bg-zinc-50",
    border: "border-zinc-200",
    label: "text-zinc-400",
    divider: "border-zinc-200",
    navBase: "text-zinc-600",
    navHover: "hover:bg-zinc-100 hover:text-zinc-900",
    navActive: "bg-violet-50 text-violet-700",
    activeBar: "bg-violet-600",
    btn: "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100",
    brand: "text-zinc-900",
    brandSub: "text-zinc-500",
    rolePill: "bg-violet-50 text-violet-700 border border-violet-200",
    avatar: "bg-violet-100 text-violet-700 border-violet-200",
    userName: "text-zinc-900",
    email: "text-zinc-500",
    tooltip: "bg-zinc-900 border-zinc-700 text-white shadow-xl",
    subActive: "text-violet-700 bg-violet-50",
    subBase: "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100",
    subBorder: "border-zinc-200",
  },
};

/* ─── BADGE ─────────────────────────────────────────────────────── */
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
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] font-bold tracking-wide uppercase leading-none shrink-0 ${badge.style}`}>
      {badge.text}
    </span>
  );
}

/* ─── TOOLTIP ───────────────────────────────────────────────────── */
function Tooltip({ label, tk }) {
  return (
    <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150">
      <div className={`px-2.5 py-1.5 rounded-md text-xs whitespace-nowrap border ${tk.tooltip}`}>
        {label}
      </div>
    </div>
  );
}

/* ─── PRIMARY NAV ITEM ──────────────────────────────────────────── */
function NavItem({ icon: Icon, label, to, badge, collapsed, tk, onClick }) {
  const { pathname } = useLocation();
  const isActive = pathname === to || (to !== "/admin/dashboard" && to.length > 1 && pathname.startsWith(to));

  return (
    <div className="relative group">
      <Link
        to={to}
        onClick={onClick}
        className={`relative flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer
          ${collapsed ? "justify-center px-0 py-2.5 w-full" : "px-3 py-2.5"}
          ${isActive ? tk.navActive : `${tk.navBase} ${tk.navHover}`}`}
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        {isActive && !collapsed && (
          <span className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full ${tk.activeBar}`} />
        )}
        <span className="relative shrink-0">
          <Icon size={17} strokeWidth={isActive ? 2.2 : 1.8} />
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

/* ─── SECTION LABEL ─────────────────────────────────────────────── */
function SectionLabel({ text, collapsed, tk }) {
  if (collapsed) return <div className={`my-2 mx-auto w-6 border-t ${tk.divider}`} />;
  return (
    <p className={`text-[9px] font-bold uppercase tracking-[0.12em] px-3 mb-1.5 ${tk.label}`} style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {text}
    </p>
  );
}

/* ─── ACCORDION GROUP ───────────────────────────────────────────── */
function AccordionGroup({ icon: Icon, label, groupKey, badge, openGroups, onToggle, tk, collapsed, subItems, onItemClick }) {
  const { pathname } = useLocation();
  const isOpen = !!openGroups[groupKey];
  const hasActiveSub = subItems.some((s) => pathname === s.to || (s.to.length > 1 && pathname.startsWith(s.to)));

  return (
    <div className="relative group">
      {collapsed ? (
        <>
          <button className={`flex justify-center w-full py-2.5 rounded-lg transition-all duration-150 relative ${hasActiveSub ? tk.navActive : `${tk.navBase} ${tk.navHover}`}`}>
            <span className="relative">
              <Icon size={17} strokeWidth={hasActiveSub ? 2.2 : 1.8} />
              {badge && <Badge badge={badge} forIcon />}
            </span>
          </button>
          <Tooltip label={label} tk={tk} />
        </>
      ) : (
        <>
          <button
            onClick={() => onToggle(groupKey)}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${hasActiveSub ? tk.navActive : `${tk.navBase} ${tk.navHover}`}`}
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            {hasActiveSub && (
              <span className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full ${tk.activeBar}`} />
            )}
            <Icon size={17} strokeWidth={hasActiveSub ? 2.2 : 1.8} className="shrink-0" />
            <span className="flex-1 text-left truncate">{label}</span>
            {badge && <Badge badge={badge} />}
            <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }} className="shrink-0">
              <ChevronDown size={13} strokeWidth={2} />
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
                <div className={`mt-0.5 ml-[26px] pl-3 border-l ${tk.subBorder} space-y-0.5 pb-1`}>
                  {subItems.map((s) => {
                    const SubIcon = s.icon;
                    const isSubActive = pathname === s.to || (s.to.length > 1 && pathname.startsWith(s.to));
                    return (
                      <Link
                        key={s.to}
                        to={s.to}
                        onClick={onItemClick}
                        className={`flex items-center gap-2.5 px-2 py-1.5 rounded-md text-xs font-medium transition-all duration-150 ${isSubActive ? tk.subActive : tk.subBase}`}
                        style={{ fontFamily: "'DM Sans', sans-serif" }}
                      >
                        <SubIcon size={13} strokeWidth={isSubActive ? 2.2 : 1.8} className="shrink-0" />
                        <span className="truncate">{s.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}

/* ─── SIDEBAR CONTENT ───────────────────────────────────────────── */
function SidebarContent({ collapsed, openGroups, onToggleGroup, onToggleCollapsed, onItemClick, showClose, onClose, mobileView, notificationsCount = 0 }) {
  const { isDark } = useTheme();
  const tk = isDark ? T.dark : T.light;
  const navigate = useNavigate();

  const user = (() => { try { return JSON.parse(localStorage.getItem("user")) || {}; } catch { return {}; } })();
  const name = user.name || "Admin";
  const email = user.email || "admin@academiq.com";
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/admin/login");
  };

  return (
    <div className={`flex flex-col h-full transition-colors duration-150 ${tk.bg} ${tk.border} border-r`} style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* ── HEADER ── */}
      <div className={`flex items-center justify-between border-b ${tk.divider} h-16 shrink-0 ${collapsed ? "px-2" : "px-3"}`}>
        {!collapsed ? (
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <img src={isDark ? LOGO_DARK_MODE : LOGO_LIGHT_MODE} alt="AcademiQ"
              className="h-8 w-auto rounded-md object-contain shrink-0 transition-all duration-150"
              onError={(e) => { e.target.style.display = "none"; if (e.target.nextSibling) e.target.nextSibling.style.display = "flex"; }}
            />
            <div className="w-8 h-8 rounded-md bg-violet-600 items-center justify-center shrink-0 hidden">
              <School size={15} className="text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className={`text-sm font-bold leading-tight ${tk.brand}`}>AcademiQ</p>
                <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full leading-none ${tk.rolePill}`}>ADMIN</span>
              </div>
              <p className={`text-[10px] leading-tight ${tk.brandSub}`}>Admin Portal</p>
            </div>
          </div>
        ) : (
          <>
            <img src={isDark ? LOGO_DARK_MODE : LOGO_LIGHT_MODE} alt="AcademiQ"
              className="w-8 h-8 rounded-md object-contain shrink-0 transition-all duration-150"
              onError={(e) => { e.target.style.display = "none"; if (e.target.nextSibling) e.target.nextSibling.style.display = "flex"; }}
            />
            <div className="w-8 h-8 rounded-md bg-violet-600 items-center justify-center shrink-0 hidden">
              <School size={15} className="text-white" />
            </div>
          </>
        )}
        {!mobileView ? (
          <button onClick={onToggleCollapsed} className={`p-1.5 rounded-lg transition-all duration-150 ${tk.btn}`} title={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
            {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>
        ) : showClose ? (
          <button onClick={onClose} className={`p-1.5 rounded-lg transition-all duration-150 ${tk.btn}`}>
            <X size={15} />
          </button>
        ) : null}
      </div>

      {/* ── PRIMARY NAV ── */}
      <div className={`${collapsed ? "px-2" : "px-3"} pt-3 pb-1 overflow-hidden`}>
        <SectionLabel text="Main" collapsed={collapsed} tk={tk} />
        <nav className="space-y-0.5">
          {PRIMARY.map((item) => (
            <NavItem key={item.key} {...item} collapsed={collapsed} tk={tk} onClick={onItemClick} />
          ))}
        </nav>
      </div>

      <div className={`mx-3 border-t ${tk.divider} my-2`} />

      {/* ── SECONDARY NAV ── */}
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

      <div className={`mx-3 border-t ${tk.divider}`} />

      {/* ── FOOTER ── */}
      <div className={`overflow-hidden ${collapsed ? "px-2 py-3 flex justify-center" : "px-3 py-3"}`}>
        {collapsed ? (
          <div className="relative group">
            <button onClick={handleLogout} title="Logout" className="p-1.5 rounded-md text-red-500 hover:bg-red-500/10 transition-all duration-150">
              <LogOut size={15} />
            </button>
            <Tooltip label="Logout" tk={tk} />
          </div>
        ) : (
          <>
            <SectionLabel text="Account" collapsed={false} tk={tk} />
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 ${tk.avatar}`}>
                <span className="text-xs font-bold leading-none">{initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-semibold truncate leading-tight ${tk.userName}`}>{name}</p>
                <p className={`text-[10px] truncate leading-tight mt-0.5 ${tk.email}`}>{email}</p>
              </div>
              <button onClick={handleLogout} title="Logout" className="p-1.5 rounded-md text-red-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150 shrink-0">
                <LogOut size={14} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── MAIN EXPORT ───────────────────────────────────────────────── */
export default function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(() => {
    try { return JSON.parse(localStorage.getItem("adm_sidebar_collapsed")) ?? false; }
    catch { return false; }
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState({});
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchUnreadCount = async () => {
      try {
        setIsLoading(true);
        if (isMounted) setUnreadCount(0);
      } catch (error) {
        if (isMounted) setUnreadCount(0);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchUnreadCount();
    return () => { isMounted = false; };
  }, []);

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
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-lg bg-zinc-900 border border-zinc-700 shadow-lg text-zinc-400 hover:text-white transition-all"
        aria-label="Open sidebar"
      >
        <Menu size={18} />
      </button>

      {/* Mobile overlay drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div key="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            />
            <motion.aside key="drawer" initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 38 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-[260px] shadow-2xl md:hidden"
            >
              <SidebarContent collapsed={false} openGroups={openGroups} onToggleGroup={toggleGroup}
                onToggleCollapsed={toggleCollapsed} onItemClick={() => setMobileOpen(false)}
                showClose onClose={() => setMobileOpen(false)} mobileView
                notificationsCount={isLoading ? 0 : unreadCount}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <motion.aside initial={false} animate={{ width: sidebarW }} transition={{ type: "spring", stiffness: 380, damping: 38 }}
        className="fixed left-0 top-0 bottom-0 z-40 hidden md:block overflow-hidden"
      >
        <SidebarContent collapsed={collapsed} openGroups={openGroups} onToggleGroup={toggleGroup}
          onToggleCollapsed={toggleCollapsed} onItemClick={null}
          showClose={false} onClose={null} mobileView={false}
          notificationsCount={isLoading ? 0 : unreadCount}
        />
      </motion.aside>
    </>
  );
}