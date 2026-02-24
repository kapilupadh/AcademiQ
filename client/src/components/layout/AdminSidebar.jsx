import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  BookText,
  CalendarRange,
  Clock,
  MessageSquare,
  Lock,
  BarChart2,
  Wallet,
  AlertOctagon,
  GraduationCap,
  UserCheck,
  UserCog,
  Layers,
  BookOpen,
  CalendarClock,
  ClipboardList,
  FileCheck,
  Radio,
  FileBarChart,
  Building,
  SlidersHorizontal,
  ShieldCheck,
  Bell,
  Mail,
  Globe,
  Webhook,
  DatabaseBackup,
  ScrollText,
  ChevronDown,
  Menu,
  X,
  LogOut,
  ShieldEllipsis,
} from "lucide-react";
import { useSidebar } from "../../hooks/useSidebar";

const ACCENT = "violet";

const PRIMARY = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/admin/dashboard" },
  { label: "User Management", icon: Users, to: "/admin/generate-id" },
  { label: "Examination Engine", icon: BookText, to: "/admin/exams/create" },
];

const SECONDARY = [
  {
    key: "dashboard-detail",
    label: "Dashboard Details",
    icon: BarChart2,
    sub: [
      { label: "Analytics Overview", icon: BarChart2, to: "/admin/dashboard" },
      {
        label: "Financial Summary",
        icon: Wallet,
        to: "/admin/dashboard/finance",
      },
      {
        label: "Early Warnings",
        icon: AlertOctagon,
        to: "/admin/dashboard/warnings",
      },
    ],
  },
  {
    key: "users-detail",
    label: "User Details",
    icon: Users,
    sub: [
      { label: "Students", icon: GraduationCap, to: "/admin/users/students" },
      { label: "Teachers", icon: UserCheck, to: "/admin/users/teachers" },
      { label: "Administrators", icon: UserCog, to: "/admin/generate-id" },
      { label: "Parents", icon: Users, to: "/admin/users/parents" },
    ],
  },
  {
    key: "academics",
    label: "Academics & Timetable",
    icon: CalendarRange,
    sub: [
      { label: "Class Setup", icon: Layers, to: "/admin/academics/classes" },
      {
        label: "Subject Allocation",
        icon: BookOpen,
        to: "/admin/academics/subjects",
      },
      {
        label: "Master Schedule",
        icon: CalendarClock,
        to: "/admin/academics/schedule",
      },
    ],
  },
  {
    key: "attendance",
    label: "Attendance Control",
    icon: Clock,
    sub: [
      {
        label: "Daily Logs",
        icon: ClipboardList,
        to: "/admin/attendance/logs",
      },
      {
        label: "Leave Approvals",
        icon: FileCheck,
        to: "/admin/attendance/leave",
      },
      { label: "Hardware Sync", icon: Radio, to: "/admin/attendance/hardware" },
      { label: "Reports", icon: FileBarChart, to: "/admin/attendance/reports" },
    ],
  },
  {
    key: "exams-detail",
    label: "Exam Details",
    icon: BookText,
    sub: [
      { label: "Exam Creation", icon: BookText, to: "/admin/exams/create" },
      { label: "Hall Allocation", icon: Building, to: "/admin/exams/halls" },
      {
        label: "Grading Scales",
        icon: SlidersHorizontal,
        to: "/admin/exams/grading",
      },
      { label: "Compliance", icon: ShieldCheck, to: "/admin/exams/compliance" },
    ],
  },
  {
    key: "communications",
    label: "Communications",
    icon: MessageSquare,
    sub: [
      {
        label: "Announcements",
        icon: Bell,
        to: "/admin/communications/announcements",
      },
      { label: "SMS/Email Logs", icon: Mail, to: "/admin/communications/logs" },
      {
        label: "Parent Portals",
        icon: Globe,
        to: "/admin/communications/parents",
      },
    ],
  },
  {
    key: "settings",
    label: "System Settings",
    icon: Lock,
    sub: [
      {
        label: "Integrations (API)",
        icon: Webhook,
        to: "/admin/settings/integrations",
      },
      {
        label: "Security Policies",
        icon: Lock,
        to: "/admin/settings/security",
      },
      { label: "Backups", icon: DatabaseBackup, to: "/admin/settings/backups" },
      { label: "Audit Trails", icon: ScrollText, to: "/admin/settings/audit" },
    ],
  },
];

function NavItem({ icon: Icon, label, to, onClick }) {
  const { pathname } = useLocation();
  const isActive =
    pathname === to || (to !== "/admin/dashboard" && pathname.startsWith(to));
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 relative
        ${
          isActive
            ? "bg-violet-500/15 text-violet-400 dark:bg-violet-500/20"
            : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 hover:text-zinc-900 dark:hover:text-zinc-100"
        }`}
    >
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-violet-500 rounded-full" />
      )}
      <Icon size={17} strokeWidth={isActive ? 2.2 : 1.8} className="shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  );
}

function NavGroup({
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
          text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/70
          hover:text-zinc-900 dark:hover:text-zinc-100 transition-all duration-150"
      >
        <Icon size={17} strokeWidth={1.8} className="shrink-0" />
        <span className="flex-1 text-left truncate">{label}</span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
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
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-0.5 ml-6 pl-3 border-l border-zinc-800 space-y-0.5 pb-1">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SubItem({ icon: Icon, label, to, onClick }) {
  const { pathname } = useLocation();
  const isActive = pathname === to;
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-2.5 px-2 py-1.5 rounded-md text-xs font-medium transition-all duration-150
        ${
          isActive
            ? "text-violet-400 bg-violet-500/10"
            : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60"
        }`}
    >
      <Icon size={13} strokeWidth={isActive ? 2.2 : 1.8} className="shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  );
}

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
  const initials = (user.name || "A").charAt(0).toUpperCase();
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/admin/login");
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      <div className="flex items-center justify-between px-4 pt-5 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center shrink-0">
            <ShieldEllipsis size={16} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white leading-tight">
              AcademiQ
            </p>
            <p className="text-[10px] text-zinc-500 leading-tight">
              Admin Portal
            </p>
          </div>
        </div>
        {showCloseBtn && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all"
          >
            <X size={16} />
          </button>
        )}
      </div>
      <div className="mx-3 border-t border-zinc-800 mb-2" />
      <nav className="px-2 space-y-0.5">
        {PRIMARY.map((item) => (
          <NavItem key={item.to} {...item} onClick={onItemClick} />
        ))}
      </nav>
      <div className="mx-3 border-t border-zinc-800 my-3" />
      <div className="flex-1 overflow-y-auto px-2 space-y-0.5 pb-4 scrollbar-hide">
        {SECONDARY.map((group) => (
          <NavGroup
            key={group.key}
            groupKey={group.key}
            icon={group.icon}
            label={group.label}
            openGroups={openGroups}
            toggleGroup={toggleGroup}
          >
            {group.sub.map((s) => (
              <SubItem key={s.to} {...s} onClick={onItemClick} />
            ))}
          </NavGroup>
        ))}
      </div>
      <div className="mx-3 border-t border-zinc-800" />
      <div className="p-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-violet-900/50 flex items-center justify-center shrink-0">
          <span className="text-xs font-semibold text-violet-400">
            {initials}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-zinc-100 truncate">
            {user.name || "Admin"}
          </p>
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-sm bg-violet-900/40 text-violet-400">
            Administrator
          </span>
        </div>
        <button
          onClick={handleLogout}
          title="Logout"
          className="p-1.5 rounded-md text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut size={14} />
        </button>
      </div>
    </div>
  );
}

export default function AdminSidebar() {
  const { mobileOpen, openGroups, toggleMobile, closeMobile, toggleGroup } =
    useSidebar();
  return (
    <>
      <button
        onClick={toggleMobile}
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-lg bg-zinc-900 border border-zinc-700 shadow-lg text-zinc-400 hover:text-white transition-all"
        aria-label="Open menu"
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
              onClick={closeMobile}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            />
            <motion.aside
              key="drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 38 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-[260px] border-r border-zinc-800 shadow-2xl md:hidden"
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
      <aside className="fixed left-0 top-0 bottom-0 z-40 hidden md:flex flex-col w-[240px] border-r border-zinc-800">
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
