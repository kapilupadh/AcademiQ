// client/src/components/layout/Sidebar.jsx
import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  BookOpen,
  PenTool,
  Clock,
  UserCircle,
  BookMarked,
  ShieldAlert,
  ClipboardList,
  FileText,
  Trophy,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  Menu,
  X,
  School,
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
  document.documentElement.style.setProperty("--student-sidebar-w", w);

/* ─── Logo paths ────────────────────────────────────────────────── */
const LOGO_DARK_MODE = "/Icons/Untitled.png";
const LOGO_LIGHT_MODE = "/Icons/Dark-Logo.jpg";

/* ─── PRIMARY NAV (flat, top) ───────────────────────────────────── */
const PRIMARY = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    to: "/dashboard",
  },
  {
    key: "examination",
    label: "Examination",
    icon: BookOpen,
    to: "/exam/instructions",
  },
  {
    key: "result",
    label: "Result",
    icon: ClipboardList,
    to: "/exams/result",
  },
  {
    key: "assignment",
    label: "Assignments",
    icon: PenTool,
    to: "/student/assignments",
  },
  {
    key: "attendance",
    label: "Attendance",
    icon: Clock,
    to: "/attendance/history",
  },
];

/* ─── SECONDARY NAV (middle, accordion allowed) ─────────────────── */
const SECONDARY = [
  {
    key: "profile",
    label: "My Profile",
    icon: UserCircle,
    to: "/profile",
    accordion: false,
  },
  {
    key: "exam-details",
    label: "Exam Details",
    icon: BookMarked,
    comingSoon : true,
    accordion: true,
    sub: [
      {
        label: "Examination Guidelines",
        icon: FileText,
        to: "/exams/guidelines",
      },
      { label: "Rules & Regulations", icon: ShieldAlert, to: "/exams/rules" },
    ],
  },

  {
    key: "achievements",
    label: "Achievements",
    icon: Trophy,
    comingSoon: true,
    accordion: false,
  },
];

/* ─── THEME TOKENS (shadcn-like, neutral zinc) ─────────────────── */
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
    subActive: "text-zinc-50 bg-zinc-800/60",
    subBase: "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/40",
    subBorder: "border-zinc-800/70",
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
    subActive: "text-zinc-900 bg-zinc-100",
    subBase: "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100",
    subBorder: "border-zinc-200",
    logoutHover: "hover:bg-red-50 hover:text-red-600",
  },
};

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
function NavItem({ icon: Icon, label, to, collapsed, tk, onClick }) {
  const { pathname } = useLocation();
  const isActive =
    pathname === to ||
    (to !== "/dashboard" && to.length > 1 && pathname.startsWith(to));

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
        <Icon
          size={16}
          strokeWidth={isActive ? 2.2 : 1.8}
          className="shrink-0"
        />
        {!collapsed && <span className="flex-1 truncate">{label}</span>}
      </Link>
      {collapsed && <Tooltip label={label} tk={tk} />}
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

/* ─── ACCORDION GROUP ───────────────────────────────────────────── */
function AccordionGroup({
  icon: Icon,
  label,
  groupKey,
  openGroups,
  onToggle,
  tk,
  collapsed,
  children,
}) {
  const isOpen = !!openGroups[groupKey];
  return (
    <div className="relative group">
      {collapsed ? (
        <>
          <button
            className={`flex justify-center w-full py-2.5 rounded-lg transition-all duration-200 ${tk.navBase} ${tk.navHover}`}
          >
            <Icon size={16} strokeWidth={1.8} />
          </button>
          <Tooltip label={label} tk={tk} />
        </>
      ) : (
        <>
          <button
            onClick={() => onToggle(groupKey)}
            className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium
              transition-all duration-200 ${tk.navBase} ${tk.navHover}`}
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            <Icon size={16} strokeWidth={1.8} className="shrink-0" />
            <span className="flex-1 text-left truncate">{label}</span>
            <motion.span
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="opacity-70"
            >
              <ChevronDown size={13} strokeWidth={2} />
            </motion.span>
          </button>
          <AnimatePresence initial={false}>
            {isOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                className="overflow-hidden"
              >
                <div
                  className={`mt-1 ml-[22px] pl-3 border-l ${tk.subBorder} space-y-0.5 pb-1`}
                >
                  {children}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}

/* ─── SUB ITEM ──────────────────────────────────────────────────── */
function SubItem({ icon: Icon, label, to, tk, onClick }) {
  const { pathname } = useLocation();
  const isActive = pathname === to;
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium
        transition-all duration-200 ${isActive ? tk.subActive : tk.subBase}`}
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <Icon size={13} strokeWidth={isActive ? 2.2 : 1.8} className="shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  );
}

/* ─── COMING SOON ITEM (shadcn-style badge) ────────────────────── */
function ComingSoonItem({ icon: Icon, label, collapsed, tk }) {
  return (
    <div className="relative group">
      <div
        className={`flex items-center gap-3 rounded-lg text-sm font-medium cursor-not-allowed
        transition-all duration-200 select-none
        ${collapsed ? "justify-center px-0 py-2.5 w-full opacity-50" : "px-3 py-2"} ${tk.navBase}`}
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        <Icon
          size={16}
          strokeWidth={1.8}
          className={`shrink-0 ${!collapsed ? "opacity-60" : ""}`}
        />
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

/* ─── SIDEBAR CONTENT ───────────────────────────────────────────── */
function SidebarContent({
  collapsed,
  openGroups,
  onToggleGroup,
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
  const name = user.full_name || "Student";
  const email = user.email || "student@academiq.com";
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
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
          />

          {!collapsed && (
            <span
              className={`text-[9px] font-semibold px-2 py-0.5 rounded-md leading-none shrink-0 tracking-wider ${tk.rolePill}`}
            >
              STUDENT
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
      <div
        className={`${collapsed ? "px-2" : "px-3"} pt-2 pb-1 overflow-hidden`}
      >
        <SectionLabel text="Main" collapsed={collapsed} tk={tk} />
        <nav className="space-y-0.5">
          {PRIMARY.map(({ key, ...item }) => (
            <NavItem
              key={key}
              {...item}
              collapsed={collapsed}
              tk={tk}
              onClick={onItemClick}
            />
          ))}
        </nav>
      </div>

      <div className={`mx-3 border-t ${tk.divider} my-2 shrink-0`} />

      {/* ── SECONDARY NAV ── */}
      <div
        className={`flex-1 overflow-y-auto scrollbar-hide ${collapsed ? "px-2" : "px-3"} pb-2`}
      >
        <SectionLabel text="More" collapsed={collapsed} tk={tk} />
        <div className="space-y-0.5">
          {SECONDARY.map(({ key, ...item }) => {
            if (item.comingSoon) {
              return (
                <ComingSoonItem
                  key={key}
                  icon={item.icon}
                  label={item.label}
                  collapsed={collapsed}
                  tk={tk}
                />
              );
            }
            if (item.accordion) {
              return (
                <AccordionGroup
                  key={key}
                  groupKey={key}
                  icon={item.icon}
                  label={item.label}
                  openGroups={openGroups}
                  onToggle={onToggleGroup}
                  tk={tk}
                  collapsed={collapsed}
                >
                  {item.sub.map((s) => (
                    <SubItem
                      key={s.to}
                      icon={s.icon}
                      label={s.label}
                      to={s.to}
                      tk={tk}
                      onClick={onItemClick}
                    />
                  ))}
                </AccordionGroup>
              );
            }
            return (
              <NavItem
                key={key}
                icon={item.icon}
                label={item.label}
                to={item.to}
                collapsed={collapsed}
                tk={tk}
                onClick={onItemClick}
              />
            );
          })}
        </div>
      </div>

      <div className={`mx-3 border-t ${tk.divider} shrink-0`} />

      {/* ── FOOTER — ACCOUNT ── */}
      <div
        className={`overflow-hidden shrink-0 ${collapsed ? "px-2 py-3 flex justify-center" : "px-3 py-3"}`}
      >
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
                className={`w-9 h-9 rounded-full border-2 flex items-center justify-center shrink-0 shadow-sm ${tk.avatar} border-indigo-500/30 bg-gradient-to-br from-indigo-500 to-indigo-700 text-white`}
              >
                <span className="text-[12px] font-black leading-none tracking-tighter">{initials}</span>
              </div>
              <div className="flex flex-col flex-1 min-w-0 justify-center">
                <p className={`text-xs font-black truncate leading-tight tracking-tight ${tk.userName}`}>
                  {name}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                   <p className={`text-[10px] truncate leading-tight opacity-80 ${tk.email}`}>
                     {email}
                   </p>
                   {user.current_semester && (
                     <span className="px-1 py-0.5 bg-indigo-500/10 text-indigo-500 rounded text-[8px] font-black uppercase tracking-tighter">
                       SEM {user.current_semester}
                     </span>
                   )}
                </div>
                {user.college_roll_number && (
                  <p className="text-[9px] font-black text-indigo-400 mt-1 uppercase tracking-widest leading-none">
                    Roll: {user.college_roll_number}
                  </p>
                )}
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
export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("stu_sidebar_collapsed")) ?? false;
    } catch {
      return false;
    }
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState({});

  useEffect(() => {
    injectFont();
  }, []);

  // Tablet Smart-Collapse
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && window.innerWidth <= 1100) {
        setCollapsed(true);
      }
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setSidebarWidth(collapsed ? "72px" : "260px");
    localStorage.setItem("stu_sidebar_collapsed", JSON.stringify(collapsed));
    return () => setSidebarWidth("260px");
  }, [collapsed]);

  const toggleCollapsed = () => setCollapsed((p) => !p);
  const toggleGroup = (key) =>
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));
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
        {mobileOpen && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm md:hidden"
            />
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
                openGroups={openGroups}
                onToggleGroup={toggleGroup}
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

      <motion.aside
        initial={false}
        animate={{ width: sidebarW }}
        transition={{ type: "spring", stiffness: 380, damping: 38 }}
        className="fixed left-0 top-0 bottom-0 z-40 hidden md:block overflow-hidden"
      >
        <SidebarContent
          collapsed={collapsed}
          openGroups={openGroups}
          onToggleGroup={toggleGroup}
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
