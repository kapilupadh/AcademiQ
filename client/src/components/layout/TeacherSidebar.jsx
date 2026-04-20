import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  NotebookPen,
  Clock,
  CalendarRange,
  FileText,
  BookMarked,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  LogOut,
  School,
  Menu,
  X,
} from "lucide-react";

// Mocked useTheme for standalone compilation
// Note: Uncomment the import below and remove the mock when using in your local project.
// import { useTheme } from "../../context/ThemeContext";
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
  document.documentElement.style.setProperty("--teacher-sidebar-w", w);

/* ─── Logo paths ────────────────────────────────────────────────── */
const LOGO_DARK_MODE = "/Icons/Untitled.png";
const LOGO_LIGHT_MODE = "/Icons/Dark-Logo.jpg";

/* ─── PRIMARY NAV ───────────────────────────────────────────────── */
const PRIMARY = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, to: "/teacher/dashboard" },
  { key: "assignment", label: "Assignments", icon: NotebookPen, to: "/teacher/assignments" },
  { key: "examination", label: "Examination", icon: BookOpen, to: "/teacher/exams" },
  { key: "classes", label: "My Classes", icon: Users, to: "/teacher/students", comingSoon: true },
];

/* ─── SECONDARY NAV ─────────────────────────────────────────────── */
const SECONDARY = [
  { 
    key: "attendance", 
    label: "Attendance", 
    icon: Clock, 
    to: "/teacher/attendance/mark", 
    badge: { type: "otp", text: "OTP", style: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20" } 
  },
  { 
    key: "class-details", 
    label: "Class Details", 
    icon: CalendarRange, 
    to: "/teacher/students/seating", 
    comingSoon: true 
  },
  { 
    key: "assessment-details", 
    label: "Assessment Details", 
    icon: FileText, 
    to: "/teacher/assessments/rubrics", 
    comingSoon: true 
  },
  { 
    key: "lesson-planning", 
    label: "Lesson Planning", 
    icon: BookMarked, 
    to: "/teacher/subjects", 
    comingSoon: false, 
    badge: { type: "new", text: "NEW", style: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700" } 
  },
  { 
    key: "communication", 
    label: "Communication", 
    icon: MessageSquare, 
    to: "/teacher/messages", 
    comingSoon: true, 
    badge: { type: "count", text: "3", style: "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" } 
  },
];

/* ─── THEME TOKENS (shadcn-like, neutral zinc from reference) ───── */
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
    rolePill: "bg-zinc-800/80 text-zinc-300 border border-zinc-700/60",
    avatar: "bg-zinc-800 text-zinc-200 border-zinc-700",
    userName: "text-zinc-100",
    email: "text-zinc-500",
    tooltip: "bg-zinc-900 border-zinc-800 text-zinc-50 shadow-lg",
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
    rolePill: "bg-zinc-100 text-zinc-700 border border-zinc-200",
    avatar: "bg-zinc-100 text-zinc-700 border-zinc-200",
    userName: "text-zinc-900",
    email: "text-zinc-500",
    tooltip: "bg-zinc-900 border-zinc-800 text-zinc-50 shadow-lg",
    soon: "bg-zinc-100 text-zinc-500 border-zinc-200",
    logoutHover: "hover:bg-red-50 hover:text-red-600",
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
    const dot = badge.type === "otp" ? "bg-amber-500" : "bg-zinc-900 dark:bg-zinc-100";
    return <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${dot}`} />;
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

/* ─── TOOLTIP ───────────────────────────────────────────────────── */
function Tooltip({ label, tk }) {
  return (
    <div
      className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50
      pointer-events-none opacity-0 group-hover:opacity-100
      -translate-x-1 group-hover:translate-x-0
      transition-all duration-150"
    >
      <div
        className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap border ${tk.tooltip}`}
      >
        {label}
      </div>
    </div>
  );
}

/* ─── NAV ITEM ──────────────────────────────────────────────────── */
function NavItem({ icon: Icon, label, to, badge, collapsed, tk, onClick }) {
  const { pathname } = useLocation();

  // Exact match OR starts with `to/` (segment boundary) — never partial string overlap
  const isActive =
    pathname === to ||
    (to !== "/teacher/dashboard" && pathname.startsWith(to + "/"));

  const SafeIcon = Icon || LayoutDashboard;

  return (
    <div className="relative group">
      <Link
        to={to}
        onClick={onClick}
        className={`relative flex items-center gap-3 rounded-lg text-sm font-medium
          transition-all duration-200
          ${collapsed ? "justify-center px-0 py-2.5 w-full" : "px-3 py-2"}
          ${isActive ? tk.navActive : `${tk.navBase} ${tk.navHover}`}`}
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        {isActive && !collapsed && (
          <motion.span
            layoutId="active-nav-bar"
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

/* ─── COMING SOON ITEM (shadcn-style badge) ────────────────────── */
function ComingSoonItem({ icon: Icon, label, badge, collapsed, tk }) {
  // Fallback to prevent white-screen crashes if an icon isn't found in the current lucide-react version
  const SafeIcon = Icon || LayoutDashboard;

  return (
    <div className="relative group">
      <div
        className={`flex items-center gap-3 rounded-lg text-sm font-medium cursor-not-allowed
        transition-all duration-200 select-none
        ${collapsed ? "justify-center px-0 py-2.5 w-full opacity-50" : "px-3 py-2"} ${tk.navBase}`}
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        <span className="relative shrink-0">
          <SafeIcon size={16} strokeWidth={1.8} className={`${!collapsed ? "opacity-60" : ""}`} />
          {collapsed && <Badge badge={badge} forIcon />}
        </span>
        {!collapsed && (
          <>
            <span className="flex-1 truncate opacity-70">{label}</span>
            <span
              className={`text-[9px] font-semibold tracking-wide px-1.5 py-0.5
              rounded-md border leading-none shrink-0 ${tk.soon}`}
            >
              Soon
            </span>
          </>
        )}
      </div>
      {collapsed && <Tooltip label={`${label} · Soon`} tk={tk} />}
    </div>
  );
}

/* ─── SECTION LABEL ─────────────────────────────────────────────── */
function SectionLabel({ text, collapsed, tk }) {
  if (collapsed)
    return <div className={`my-2 mx-auto w-5 border-t ${tk.divider}`} />;
  return (
    <p
      className={`text-[10px] font-semibold uppercase tracking-wider px-3 mb-1.5 mt-3 ${tk.label}`}
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {text}
    </p>
  );
}

/* ─── SIDEBAR CONTENT ───────────────────────────────────────────── */
function SidebarContent({ collapsed, onToggleCollapsed, onItemClick, showClose, onClose, mobileView }) {
  const { isDark } = useTheme();
  const tk = isDark ? T.dark : T.light;
  const navigate = useNavigate();

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || {};
    } catch {
      return {};
    }
  })();
  const name = user.name || "Teacher";
  const email = user.email || "teacher@academiq.com";
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/teacher-login");
  };

  return (
    <div
      className={`flex flex-col h-full transition-all duration-300 ${tk.bg} ${tk.border} border-r
      ${!isDark ? "shadow-[4px_0_24px_-12px_rgba(0,0,0,0.08)]" : ""}`}
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* ── HEADER ── */}
      <div
        className={`flex items-center justify-between border-b ${tk.divider} h-16 shrink-0
        ${collapsed ? "px-2" : "px-4"}`}
      >
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <img
            src={isDark ? LOGO_DARK_MODE : LOGO_LIGHT_MODE}
            alt="Logo"
            className="h-8 w-auto rounded-md object-contain shrink-0 transition-all duration-150"
            onError={(e) => {
              e.target.style.display = "none";
              if (e.target.nextSibling) e.target.nextSibling.style.display = "flex";
            }}
          />
          <div className="w-8 h-8 rounded-md bg-teal-600 items-center justify-center shrink-0 hidden">
            <School size={15} className="text-white" />
          </div>
          
          {!collapsed && (
            <span
              className={`text-[9px] font-semibold px-2 py-0.5 rounded-md leading-none shrink-0 tracking-wider ${tk.rolePill}`}
            >
              TEACHER
            </span>
          )}
        </div>

        {/* Action Button */}
        {!mobileView ? (
          <button
            onClick={onToggleCollapsed}
            className={`p-1.5 rounded-md transition-all duration-200 shrink-0 ml-1 ${tk.btn}`}
            title={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>
        ) : showClose ? (
          <button
            onClick={onClose}
            className={`p-1.5 rounded-md transition-all duration-200 shrink-0 ml-1 ${tk.btn}`}
          >
            <X size={16} />
          </button>
        ) : null}
      </div>

      {/* ── PRIMARY NAV ── */}
      <div className={`${collapsed ? "px-2" : "px-3"} pt-2 pb-1 overflow-hidden`}>
        <SectionLabel text="Main" collapsed={collapsed} tk={tk} />
        <nav className="space-y-0.5">
          {PRIMARY.map((item) =>
            item.comingSoon ? (
              <ComingSoonItem key={item.key} {...item} collapsed={collapsed} tk={tk} />
            ) : (
              <NavItem key={item.key} {...item} collapsed={collapsed} tk={tk} onClick={onItemClick} />
            )
          )}
        </nav>
      </div>

      <div className={`mx-3 border-t ${tk.divider} my-2 shrink-0`} />

      {/* ── SECONDARY NAV ── */}
      <div className={`flex-1 overflow-y-auto scrollbar-hide ${collapsed ? "px-2" : "px-3"} pb-2`}>
        <SectionLabel text="Management" collapsed={collapsed} tk={tk} />
        <div className="space-y-0.5">
          {SECONDARY.map((item) =>
            item.comingSoon ? (
              <ComingSoonItem key={item.key} {...item} collapsed={collapsed} tk={tk} />
            ) : (
              <NavItem key={item.key} {...item} collapsed={collapsed} tk={tk} onClick={onItemClick} />
            )
          )}
        </div>
      </div>

      <div className={`mx-3 border-t ${tk.divider} shrink-0`} />

      {/* ── FOOTER — ACCOUNT ── */}
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
            <div
              className={`flex items-center gap-2.5 min-w-0 mt-1 p-2 rounded-lg border ${tk.divider} transition-all duration-200`}
            >
              <div
                className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 ${tk.avatar}`}
              >
                <span className="text-[11px] font-semibold leading-none">{initials}</span>
              </div>
              <div className="flex flex-col flex-1 min-w-0 justify-center">
                <p className={`text-xs font-semibold truncate leading-tight ${tk.userName}`}>
                  {name}
                </p>
                <p className={`text-[10px] truncate leading-tight mt-0.5 ${tk.email}`}>
                  {email}
                </p>
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

/* ─── MAIN EXPORT ───────────────────────────────────────────────── */
export default function TeacherSidebar() {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("tch_sidebar_collapsed")) ?? false;
    } catch {
      return false;
    }
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    injectFont();
  }, []);

  useEffect(() => {
    setSidebarWidth(collapsed ? "72px" : "260px");
    localStorage.setItem("tch_sidebar_collapsed", JSON.stringify(collapsed));
    return () => setSidebarWidth("260px");
  }, [collapsed]);

  const toggleCollapsed = () => setCollapsed((p) => !p);
  const sidebarW = collapsed ? 72 : 260;

  return (
    <>
      {/* Mobile trigger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-[9999] md:hidden p-2 rounded-lg
          bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm
          text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all duration-200"
        aria-label="Open sidebar"
      >
        <Menu size={18} />
      </button>

      <AnimatePresence>
        {/* Separated elements from Fragment to prevent AnimatePresence key tracking issues */}
        {mobileOpen && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm md:hidden"
          />
        )}
        {mobileOpen && (
          <motion.aside
            key="drawer"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
            className="fixed left-0 top-0 bottom-0 z-[9999] w-[260px] shadow-2xl md:hidden"
          >
            <SidebarContent
              collapsed={false}
              onToggleCollapsed={toggleCollapsed}
              onItemClick={() => setMobileOpen(false)}
              showClose
              onClose={() => setMobileOpen(false)}
              mobileView
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
          collapsed={collapsed}
          onToggleCollapsed={toggleCollapsed}
          onItemClick={null}
          showClose={false}
          onClose={null}
          mobileView={false}
        />
      </motion.aside>
    </>
  );
}