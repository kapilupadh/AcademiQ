import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  BookOpen,
  PenTool,
  Clock,
  UserCircle,
  ChevronDown,
  ClipboardList,
  BookMarked,
  ShieldAlert,
  Trophy,
  FileText,
  Menu,
  X,
  LogOut,
  GraduationCap,
} from "lucide-react";
import { useSidebar } from "../../hooks/useSidebar";

// ─────────────────────────────────────────────
// PRIMARY NAV  (always visible, flat list)
// ─────────────────────────────────────────────
const PRIMARY = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/dashboard" },
  { label: "Examination", icon: BookOpen, to: "/exam/instructions" },
  { label: "Assignment", icon: PenTool, to: "/assignments/pending" },
  { label: "Attendance", icon: Clock, to: "/attendance/history" },
];

// ─────────────────────────────────────────────
// SECONDARY NAV  (middle section)
// ─────────────────────────────────────────────
const SECONDARY = [
  {
    key: "profile",
    label: "My Profile",
    icon: UserCircle,
    to: "/profile", // direct link — already built
    accordion: false,
  },
  {
    key: "exam-details",
    label: "Exam Details",
    icon: BookMarked,
    accordion: true,
    sub: [
      {
        label: "Examination Results",
        icon: ClipboardList,
        to: "/exams/results",
      },
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
    to: "/assignments/details", // read-only info page
    accordion: false,
  },
  {
    key: "achievements",
    label: "Achievements",
    icon: Trophy,
    comingSoon: true, // placeholder — disabled
    accordion: false,
  },
];

// ─────────────────────────────────────────────
// Nav Item  (flat link)
// ─────────────────────────────────────────────
function NavItem({ icon: Icon, label, to, onClick }) {
  const { pathname } = useLocation();
  const isActive =
    pathname === to ||
    (to !== "/dashboard" && to.length > 1 && pathname.startsWith(to));

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
        transition-all duration-150
        ${
          isActive
            ? "bg-indigo-500/15 text-indigo-400"
            : "text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-100"
        }`}
    >
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-indigo-500 rounded-full" />
      )}
      <Icon size={17} strokeWidth={isActive ? 2.2 : 1.8} className="shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  );
}

// ─────────────────────────────────────────────
// Accordion Group  (expandable section)
// ─────────────────────────────────────────────
function AccordionGroup({
  icon: Icon,
  label,
  groupKey,
  openGroups,
  toggleGroup,
  children,
}) {
  const isOpen = !!openGroups[groupKey];
  return (
    <div>
      <button
        onClick={() => toggleGroup(groupKey)}
        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium
          text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-100 transition-all duration-150"
      >
        <Icon size={17} strokeWidth={1.8} className="shrink-0" />
        <span className="flex-1 text-left truncate">{label}</span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
        >
          <ChevronDown size={14} strokeWidth={2} />
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
            <div className="mt-0.5 ml-[26px] pl-3 border-l border-zinc-800 space-y-0.5 pb-1">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────
// Sub Item  (inside accordion)
// ─────────────────────────────────────────────
function SubItem({ icon: Icon, label, to, onClick }) {
  const { pathname } = useLocation();
  const isActive = pathname === to;
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-2.5 px-2 py-1.5 rounded-md text-xs font-medium
        transition-all duration-150
        ${
          isActive
            ? "text-indigo-400 bg-indigo-500/10"
            : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60"
        }`}
    >
      <Icon size={13} strokeWidth={isActive ? 2.2 : 1.8} className="shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  );
}

// ─────────────────────────────────────────────
// Coming Soon Item  (disabled)
// ─────────────────────────────────────────────
function ComingSoonItem({ icon: Icon, label }) {
  return (
    <div
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
        text-zinc-600 cursor-not-allowed select-none"
      title="Coming soon"
    >
      <Icon size={17} strokeWidth={1.8} className="shrink-0" />
      <span className="flex-1 truncate">{label}</span>
      <span
        className="text-[9px] font-semibold tracking-wide uppercase
        px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 border border-zinc-700"
      >
        Soon
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────
// Sidebar Content (shared between desktop and mobile drawer)
// ─────────────────────────────────────────────
function SidebarContent({
  openGroups,
  toggleGroup,
  onItemClick,
  showCloseBtn,
  onClose,
}) {
  const navigate = useNavigate();

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || {};
    } catch {
      return {};
    }
  })();
  const initials = (user.name || "S").slice(0, 2).toUpperCase();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 pt-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0 shadow-md shadow-indigo-900/40">
            <GraduationCap size={16} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-tight tracking-tight">
              AcademiQ
            </p>
            <p className="text-[10px] text-zinc-500 leading-tight">
              Student Portal
            </p>
          </div>
        </div>
        {showCloseBtn && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all"
            aria-label="Close sidebar"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* ── Section 1: Primary Navigation ── */}
      <div className="px-3 mb-1">
        <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest mb-2 px-1">
          Main
        </p>
        <nav className="space-y-0.5">
          {PRIMARY.map((item) => (
            <NavItem key={item.to} {...item} onClick={onItemClick} />
          ))}
        </nav>
      </div>

      {/* ── Divider ── */}
      <div className="mx-3 border-t border-zinc-800/80 my-3" />

      {/* ── Section 2: Secondary Navigation ── */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 scrollbar-hide">
        <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest mb-2 px-1">
          More
        </p>
        <div className="space-y-0.5">
          {SECONDARY.map((item) => {
            if (item.comingSoon) {
              return (
                <ComingSoonItem
                  key={item.key}
                  icon={item.icon}
                  label={item.label}
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
                  toggleGroup={toggleGroup}
                >
                  {item.sub.map((s) => (
                    <SubItem key={s.to} {...s} onClick={onItemClick} />
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
                onClick={onItemClick}
              />
            );
          })}
        </div>
      </div>

      {/* ── Divider ── */}
      <div className="mx-3 border-t border-zinc-800/80" />

      {/* ── Footer: User Card + Logout ── */}
      <div className="p-3 flex items-center gap-3">
        {/* Avatar */}
        <div
          className="w-9 h-9 rounded-full bg-indigo-600/20 border border-indigo-500/30
          flex items-center justify-center shrink-0"
        >
          <span className="text-xs font-bold text-indigo-400 leading-none">
            {initials}
          </span>
        </div>

        {/* Name + Email */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-zinc-100 truncate leading-tight">
            {user.name || "Student"}
          </p>
          <p className="text-[10px] text-zinc-500 truncate leading-tight mt-0.5">
            {user.email || "student@academiq.com"}
          </p>
        </div>

        {/* Logout — red */}
        <button
          onClick={handleLogout}
          title="Logout"
          className="p-1.5 rounded-md text-red-500 hover:text-red-400
            hover:bg-red-500/10 transition-all duration-150 shrink-0"
        >
          <LogOut size={15} />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Export
// ─────────────────────────────────────────────
export default function Sidebar() {
  const { mobileOpen, openGroups, toggleMobile, closeMobile, toggleGroup } =
    useSidebar();

  return (
    <>
      {/* Mobile: floating hamburger */}
      <button
        onClick={toggleMobile}
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-lg
          bg-zinc-900 border border-zinc-700 shadow-lg
          text-zinc-400 hover:text-white transition-all"
        aria-label="Open sidebar"
      >
        <Menu size={18} />
      </button>

      {/* Mobile: Overlay + slide-in Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={closeMobile}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            />
            <motion.aside
              key="drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 38 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-[260px]
                border-r border-zinc-800 shadow-2xl md:hidden"
            >
              <SidebarContent
                openGroups={openGroups}
                toggleGroup={toggleGroup}
                onItemClick={closeMobile}
                showCloseBtn
                onClose={closeMobile}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop: fixed, always expanded */}
      <aside
        className="fixed left-0 top-0 bottom-0 z-40 hidden md:flex flex-col
        w-[240px] border-r border-zinc-800"
      >
        <SidebarContent
          openGroups={openGroups}
          toggleGroup={toggleGroup}
          onItemClick={null}
          showCloseBtn={false}
          onClose={null}
        />
      </aside>
    </>
  );
}
