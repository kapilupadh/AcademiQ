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
    // NEW: Promoted Results to Primary Nav
    key: "result",
    label: "Result",
    icon: ClipboardList,
    to: "/exams/result", 
  },
  {
    key: "assignment",
    label: "Assignment",
    icon: PenTool,
    to: "/assignments/pending",
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
    accordion: true,
    sub: [
      // Removed "Examination Results" from here since it's now in PRIMARY
      {
        label: "Examination Guidelines",
        icon: FileText,
        to: "/exams/guidelines",
      },
      { label: "Rules & Regulations", icon: ShieldAlert, to: "/exams/rules" },
    ],
  },
  {
    key: "assignment-details",
    label: "Assignment Details",
    icon: FileText,
    to: "/assignments/details",
    accordion: false,
  },
  {
    key: "achievements",
    label: "Achievements",
    icon: Trophy,
    comingSoon: true,
    accordion: false,
  },
];

/* ─── THEME TOKENS (Indigo accent) ─────────────────────────────── */
const T = {
  dark: {
    bg: "bg-[#0f1117]",
    border: "border-zinc-800",
    label: "text-zinc-600",
    divider: "border-zinc-800",
    navBase: "text-zinc-400",
    navHover: "hover:bg-zinc-800/60 hover:text-zinc-100",
    navActive: "bg-indigo-500/12 text-indigo-400",
    activeBar: "bg-indigo-500",
    btn: "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800",
    brand: "text-white",
    brandSub: "text-zinc-500",
    rolePill: "bg-indigo-900/40 text-indigo-400 border border-indigo-800/50",
    avatar: "bg-indigo-900/40 text-indigo-400 border-indigo-800/40",
    userName: "text-zinc-100",
    email: "text-zinc-500",
    tooltip: "bg-zinc-900 border-zinc-700 text-white shadow-xl",
    soon: "bg-zinc-800 text-zinc-500 border-zinc-700",
    subActive: "text-indigo-400 bg-indigo-500/10",
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
    navActive: "bg-indigo-50 text-indigo-700",
    activeBar: "bg-indigo-600",
    btn: "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100",
    brand: "text-zinc-900",
    brandSub: "text-zinc-500",
    rolePill: "bg-indigo-50 text-indigo-700 border border-indigo-200",
    avatar: "bg-indigo-100 text-indigo-700 border-indigo-200",
    userName: "text-zinc-900",
    email: "text-zinc-500",
    tooltip: "bg-zinc-900 border-zinc-700 text-white shadow-xl",
    soon: "bg-zinc-200 text-zinc-500 border-zinc-300",
    subActive: "text-indigo-700 bg-indigo-50",
    subBase: "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100",
    subBorder: "border-zinc-200",
  },
};

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
          transition-all duration-150
          ${collapsed ? "justify-center px-0 py-2.5 w-full" : "px-3 py-2.5"}
          ${isActive ? tk.navActive : `${tk.navBase} ${tk.navHover}`}`}
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        {isActive && !collapsed && (
          <span
            className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full ${tk.activeBar}`}
          />
        )}
        <Icon
          size={17}
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
    return <div className={`my-2 mx-auto w-6 border-t ${tk.divider}`} />;
  return (
    <p
      className={`text-[9px] font-bold uppercase tracking-[0.12em] px-3 mb-1.5 ${tk.label}`}
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
            className={`flex justify-center w-full py-2.5 rounded-lg transition-all duration-150 ${tk.navBase} ${tk.navHover}`}
          >
            <Icon size={17} strokeWidth={1.8} />
          </button>
          <Tooltip label={label} tk={tk} />
        </>
      ) : (
        <>
          <button
            onClick={() => onToggle(groupKey)}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium
              transition-all duration-150 ${tk.navBase} ${tk.navHover}`}
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            <Icon size={17} strokeWidth={1.8} className="shrink-0" />
            <span className="flex-1 text-left truncate">{label}</span>
            <motion.span
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
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
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                className="overflow-hidden"
              >
                <div
                  className={`mt-0.5 ml-[26px] pl-3 border-l ${tk.subBorder} space-y-0.5 pb-1`}
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
      className={`flex items-center gap-2.5 px-2 py-1.5 rounded-md text-xs font-medium
        transition-all duration-150 ${isActive ? tk.subActive : tk.subBase}`}
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <Icon size={13} strokeWidth={isActive ? 2.2 : 1.8} className="shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  );
}

/* ─── COMING SOON ITEM ──────────────────────────────────────────── */
function ComingSoonItem({ icon: Icon, label, collapsed, tk }) {
  return (
    <div className="relative group">
      <div
        className={`flex items-center gap-3 rounded-lg text-sm font-medium cursor-not-allowed
        transition-all duration-150 select-none opacity-50
        ${collapsed ? "justify-center px-0 py-2.5 w-full" : "px-3 py-2.5"} ${tk.navBase}`}
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        <Icon size={17} strokeWidth={1.8} className="shrink-0" />
        {!collapsed && (
          <>
            <span className="flex-1 truncate">{label}</span>
            <span
              className={`text-[8px] font-bold tracking-wide uppercase px-1.5 py-0.5
              rounded border leading-none ${tk.soon}`}
            >
              Soon
            </span>
          </>
        )}
      </div>
      {collapsed && <Tooltip label={`${label} (Coming Soon)`} tk={tk} />}
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
  const name = user.name || "Student";
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
      className={`flex flex-col h-full transition-colors duration-150 ${tk.bg} ${tk.border} border-r`}
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* ── HEADER: Logo + Role badge + Collapse toggle ── */}
      <div
        className={`flex items-center justify-between border-b ${tk.divider} h-16 shrink-0
        ${collapsed ? "px-2" : "px-3"}`}
      >
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
            <div className="w-8 h-8 rounded-md bg-indigo-600 items-center justify-center shrink-0 hidden">
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
                  STUDENT
                </span>
              </div>
              <p className={`text-[10px] leading-tight ${tk.brandSub}`}>
                Student Portal
              </p>
            </div>
          </div>
        ) : (
          <>
            <img
              src={isDark ? LOGO_DARK_MODE : LOGO_LIGHT_MODE}
              alt="AcademiQ"
              className="w-8 h-8 rounded-md object-contain shrink-0 transition-all duration-150"
              onError={(e) => {
                e.target.style.display = "none";
                if (e.target.nextSibling)
                  e.target.nextSibling.style.display = "flex";
              }}
            />
            <div className="w-8 h-8 rounded-md bg-indigo-600 items-center justify-center shrink-0 hidden">
              <School size={15} className="text-white" />
            </div>
          </>
        )}

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

      {/* ── PRIMARY NAV — MAIN ── */}
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

      <div className={`mx-3 border-t ${tk.divider} my-2`} />

      {/* ── SECONDARY NAV — MORE ── */}
      <div
        className={`flex-1 overflow-y-auto scrollbar-hide ${collapsed ? "px-2" : "px-3"} pb-2`}
      >
        <SectionLabel text="More" collapsed={collapsed} tk={tk} />
        <div className="space-y-0.5">
          {SECONDARY.map((item) => {
            if (item.comingSoon) {
              return (
                <ComingSoonItem
                  key={item.key}
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
                  key={item.key}
                  groupKey={item.key}
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
                key={item.key}
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

      <div className={`mx-3 border-t ${tk.divider}`} />

      {/* ── FOOTER — ACCOUNT ── */}
      <div
        className={`overflow-hidden ${collapsed ? "px-2 py-3 flex justify-center" : "px-3 py-3"}`}
      >
        {collapsed ? (
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
          <>
            <SectionLabel text="Account" collapsed={false} tk={tk} />
            <div className="flex items-center gap-2.5">
              <div
                className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 ${tk.avatar}`}
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
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-lg
          bg-zinc-900 border border-zinc-700 shadow-lg text-zinc-400 hover:text-white transition-all"
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