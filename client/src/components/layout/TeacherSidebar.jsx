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
  ChevronDown,
  LogOut,
  School,
  Menu,
  X,
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
  document.documentElement.style.setProperty("--teacher-sidebar-w", w);

/* ─── Logo paths ────────────────────────────────────────────────── */
const LOGO_DARK_MODE = "/Icons/Untitled.png"; // isDark = true  → dark bg → Light-Logo
const LOGO_LIGHT_MODE = "/Icons/Dark-Logo.jpg"; // isDark = false → light bg → Dark-Logo

/* ─── NAV DATA ──────────────────────────────────────────────────── */
const PRIMARY = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    to: "/teacher/dashboard",
  },
  {
    key: "examination",
    label: "Examination",
    icon: BookOpen,
    to: "/teacher/exams",
  },
  { key: "classes", label: "My Classes", icon: Users, to: "/teacher/students" },
  {
    key: "assessments",
    label: "Assessments",
    icon: NotebookPen,
    to: "/teacher/exams/create",
  },
];

const SECONDARY = [
  {
    key: "attendance",
    label: "Attendance",
    icon: Clock,
    to: "/teacher/attendance/mark",
    badge: {
      type: "otp",
      text: "OTP",
      style: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
    },
  },
  {
    key: "class-details",
    label: "Class Details",
    icon: CalendarRange,
    to: "/teacher/students/seating",
  },
  {
    key: "assessment-details",
    label: "Assessment Details",
    icon: FileText,
    to: "/teacher/assessments/rubrics",
  },
  {
    key: "lesson-planning",
    label: "Lesson Planning",
    icon: BookMarked,
    to: "/teacher/subjects",
    badge: {
      type: "new",
      text: "NEW",
      style: "bg-teal-500/15 text-teal-400 border border-teal-500/30",
    },
  },
  {
    key: "communication",
    label: "Communication",
    icon: MessageSquare,
    to: "/teacher/messages",
    badge: { type: "count", text: "3", style: "bg-teal-600 text-white" },
  },
];

/* ─── THEME TOKENS ──────────────────────────────────────────────── */
const T = {
  dark: {
    bg: "bg-[#0f1117]",
    border: "border-zinc-800",
    label: "text-zinc-600",
    divider: "border-zinc-800",
    navBase: "text-zinc-400",
    navHover: "hover:bg-zinc-800/60 hover:text-zinc-100",
    navActive: "bg-teal-500/12 text-teal-400",
    activeBar: "bg-teal-500",
    btn: "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800",
    brand: "text-white",
    brandSub: "text-zinc-500",
    rolePill: "bg-teal-900/40 text-teal-400 border border-teal-800/50",
    avatar: "bg-teal-900/40 text-teal-400 border-teal-800/40",
    userName: "text-zinc-100",
    email: "text-zinc-500",
    tooltip: "bg-zinc-900 border-zinc-700 text-white shadow-xl",
  },
  light: {
    bg: "bg-zinc-50",
    border: "border-zinc-200",
    label: "text-zinc-400",
    divider: "border-zinc-200",
    navBase: "text-zinc-600",
    navHover: "hover:bg-zinc-100 hover:text-zinc-900",
    navActive: "bg-teal-50 text-teal-700",
    activeBar: "bg-teal-600",
    btn: "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100",
    brand: "text-zinc-900",
    brandSub: "text-zinc-500",
    rolePill: "bg-teal-50 text-teal-700 border border-teal-200",
    avatar: "bg-teal-100 text-teal-700 border-teal-200",
    userName: "text-zinc-900",
    email: "text-zinc-500",
    tooltip: "bg-zinc-900 border-zinc-700 text-white shadow-xl",
  },
};

/* ─── BADGE ─────────────────────────────────────────────────────── */
function Badge({ badge, forIcon = false }) {
  if (!badge) return null;
  if (forIcon && badge.type === "count") {
    return (
      <span
        className={`absolute -top-1 -right-1 flex items-center justify-center
        w-3.5 h-3.5 rounded-full text-[9px] font-bold leading-none ${badge.style}`}
      >
        {badge.text}
      </span>
    );
  }
  if (forIcon) {
    // OTP / NEW in icon mode: small coloured dot
    const dot = badge.type === "otp" ? "bg-amber-400" : "bg-teal-400";
    return (
      <span
        className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${dot}`}
      />
    );
  }
  // Expanded text badge
  if (badge.type === "count") {
    return (
      <span
        className={`inline-flex items-center justify-center w-4 h-4 rounded-full
        text-[10px] font-bold leading-none shrink-0 ${badge.style}`}
      >
        {badge.text}
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px]
      font-bold tracking-wide uppercase leading-none shrink-0 ${badge.style}`}
    >
      {badge.text}
    </span>
  );
}

/* ─── TOOLTIP ───────────────────────────────────────────────────── */
function Tooltip({ label, tk }) {
  return (
    <div
      className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50
      pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150"
    >
      <div
        className={`px-2.5 py-1.5 rounded-md text-xs whitespace-nowrap border ${tk.tooltip}`}
      >
        {label}
      </div>
    </div>
  );
}

/* ─── NAV ITEM ──────────────────────────────────────────────────── */
function NavItem({ icon: Icon, label, to, badge, collapsed, tk, onClick }) {
  const { pathname } = useLocation();
  const isActive =
    pathname === to ||
    (to !== "/teacher/dashboard" && to.length > 1 && pathname.startsWith(to));

  return (
    <div className="relative group">
      <Link
        to={to}
        onClick={onClick}
        className={`relative flex items-center gap-3 rounded-lg text-sm font-medium
          transition-all duration-150 cursor-pointer
          ${collapsed ? "justify-center px-0 py-2.5 w-full" : "px-3 py-2.5"}
          ${isActive ? tk.navActive : `${tk.navBase} ${tk.navHover}`}`}
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        {isActive && !collapsed && (
          <span
            className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full ${tk.activeBar}`}
          />
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
  if (collapsed) {
    return <div className={`my-2 mx-auto w-6 border-t ${tk.divider}`} />;
  }
  return (
    <p
      className={`text-[9px] font-bold uppercase tracking-[0.12em] px-3 mb-1.5 ${tk.label}`}
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {text}
    </p>
  );
}

/* ─── SIDEBAR CONTENT ───────────────────────────────────────────── */
function SidebarContent({
  collapsed,
  onToggleCollapsed,
  onItemClick,
  showClose,
  onClose,
  mobileView,
}) {
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
      className={`flex flex-col h-full transition-colors duration-150 ${tk.bg} ${tk.border} border-r`}
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* ── HEADER: Logo + Collapse toggle — always flex-row, h-16 to match navbar ── */}
      <div
        className={`flex items-center justify-between border-b ${tk.divider} h-16 shrink-0
        ${collapsed ? "px-2" : "px-3"}`}
      >
        {/* Logo */}
        {!collapsed ? (
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <img
              src={isDark ? LOGO_DARK_MODE : LOGO_LIGHT_MODE}
              alt="AcademiQ"
              className="h-8 w-auto rounded-md object-contain shrink-0 transition-all duration-150"
              onError={(e) => {
                e.target.style.display = "none";
                if (e.target.nextSibling)
                  e.target.nextSibling.style.display = "flex";
              }}
            />
            {/* Fallback icon if image fails */}
            <div className="w-8 h-8 rounded-md bg-teal-600 items-center justify-center shrink-0 hidden">
              <School size={15} className="text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className={`text-sm font-bold leading-tight ${tk.brand}`}>
                  AcademiQ
                </p>
                <span
                  className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full leading-none ${tk.rolePill}`}
                >
                  TEACHER
                </span>
              </div>
              <p className={`text-[10px] leading-tight ${tk.brandSub}`}>
                Faculty Portal
              </p>
            </div>
          </div>
        ) : (
          // Collapsed: show logo image, sized to fit within 72px sidebar
          <img
            src={isDark ? LOGO_DARK_MODE : LOGO_LIGHT_MODE}
            alt="AcademiQ"
            className="w-8 h-8 rounded-md object-contain shrink-0 transition-all duration-150"
            onError={(e) => {
              e.target.style.display = "none";
              e.target.nextSibling.style.display = "flex";
            }}
          />
        )}
        {/* Fallback if collapsed image also fails */}
        <div className="w-8 h-8 rounded-md bg-teal-600 items-center justify-center shrink-0 hidden">
          <School size={15} className="text-white" />
        </div>

        {/* Collapse toggle (desktop) / Close (mobile) */}
        {!mobileView ? (
          <button
            onClick={onToggleCollapsed}
            className={`p-1.5 rounded-lg transition-all duration-150 ${tk.btn}`}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>
        ) : showClose ? (
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-all duration-150 ${tk.btn}`}
          >
            <X size={15} />
          </button>
        ) : null}
      </div>

      {/* ── PRIMARY NAV ── */}
      <div
        className={`${collapsed ? "px-2" : "px-3"} pt-3 pb-1 overflow-hidden`}
      >
        <SectionLabel text="Main" collapsed={collapsed} tk={tk} />
        <nav className="space-y-0.5">
          {PRIMARY.map((item) => (
            <NavItem
              key={item.key}
              {...item}
              collapsed={collapsed}
              tk={tk}
              onClick={onItemClick}
            />
          ))}
        </nav>
      </div>

      {/* ── MANAGEMENT DIVIDER ── */}
      <div className={`mx-3 border-t ${tk.divider} my-2`} />

      {/* ── SECONDARY NAV ── */}
      <div
        className={`flex-1 overflow-y-auto scrollbar-hide ${collapsed ? "px-2" : "px-3"} pb-2`}
      >
        <SectionLabel text="Management" collapsed={collapsed} tk={tk} />
        <div className="space-y-0.5">
          {SECONDARY.map((item) => (
            <NavItem
              key={item.key}
              icon={item.icon}
              label={item.label}
              to={item.to}
              badge={item.badge}
              collapsed={collapsed}
              tk={tk}
              onClick={onItemClick}
            />
          ))}
        </div>
      </div>

      {/* ── ACCOUNT DIVIDER ── */}
      <div className={`mx-3 border-t ${tk.divider}`} />

      {/* ── FOOTER — ACCOUNT ── */}
      <div
        className={`overflow-hidden ${collapsed ? "px-2 py-3 flex justify-center" : "px-3 py-3"}`}
      >
        {collapsed ? (
          /* Collapsed: only red logout icon */
          <div className="relative group">
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-1.5 rounded-md text-red-500 hover:bg-red-500/10 transition-all duration-150"
            >
              <LogOut size={15} />
            </button>
            <Tooltip label="Logout" tk={tk} />
          </div>
        ) : (
          /* Expanded: full account card */
          <>
            <SectionLabel text="Account" collapsed={false} tk={tk} />
            <div className="flex items-center gap-2.5">
              <div
                className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0
                ${tk.avatar}`}
              >
                <span className="text-xs font-bold leading-none">
                  {initials}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-xs font-semibold truncate leading-tight ${tk.userName}`}
                >
                  {name}
                </p>
                <p
                  className={`text-[10px] truncate leading-tight mt-0.5 ${tk.email}`}
                >
                  {email}
                </p>
              </div>
              <button
                onClick={handleLogout}
                title="Logout"
                className="p-1.5 rounded-md text-red-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150 shrink-0"
              >
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
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-lg
          bg-zinc-900 border border-zinc-700 shadow-lg text-zinc-400 hover:text-white transition-all"
        aria-label="Open sidebar"
      >
        <Menu size={18} />
      </button>

      {/* Mobile overlay drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            />
            <motion.aside
              key="drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 38 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-[260px] shadow-2xl md:hidden"
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
          </>
        )}
      </AnimatePresence>

      {/* Desktop sidebar — top-0 full height; header row is h-16 matching navbar */}
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
