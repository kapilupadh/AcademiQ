import React from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

/**
 * A single sidebar navigation item.
 * @param {object} props
 * @param {React.ElementType} props.icon  - Lucide icon component
 * @param {string} props.label            - Display label
 * @param {string} props.to               - Route path
 * @param {boolean} props.collapsed       - Sidebar collapsed state
 * @param {string} props.accent           - Tailwind accent color class prefix e.g. "indigo"
 * @param {boolean} [props.sub]           - Nested sub-item (smaller, indented)
 * @param {function} [props.onClick]      - Optional click handler (e.g. close mobile drawer)
 */
export default function SidebarItem({
  icon: Icon,
  label,
  to,
  collapsed,
  accent = "indigo",
  sub = false,
  onClick,
}) {
  const { pathname } = useLocation();
  const isActive = to === "/" ? pathname === "/" : pathname.startsWith(to);

  const accentMap = {
    indigo: {
      activeBg: "bg-indigo-500/15 dark:bg-indigo-500/20",
      activeText: "text-indigo-600 dark:text-indigo-400",
      activeDot: "bg-indigo-500",
      hoverBg: "hover:bg-indigo-500/8 dark:hover:bg-indigo-500/10",
    },
    blue: {
      activeBg: "bg-blue-500/15 dark:bg-blue-500/20",
      activeText: "text-blue-600 dark:text-blue-400",
      activeDot: "bg-blue-500",
      hoverBg: "hover:bg-blue-500/8 dark:hover:bg-blue-500/10",
    },
    violet: {
      activeBg: "bg-violet-500/15 dark:bg-violet-500/20",
      activeText: "text-violet-600 dark:text-violet-400",
      activeDot: "bg-violet-500",
      hoverBg: "hover:bg-violet-500/8 dark:hover:bg-violet-500/10",
    },
  };

  const colors = accentMap[accent] || accentMap.indigo;

  return (
    <div className="relative group">
      <Link
        to={to}
        onClick={onClick}
        className={`
          flex items-center gap-3 rounded-lg transition-all duration-200 cursor-pointer select-none
          ${sub ? "px-3 py-1.5 ml-4 text-sm" : "px-3 py-2 text-sm font-medium"}
          ${
            isActive
              ? `${colors.activeBg} ${colors.activeText}`
              : `text-zinc-600 dark:text-zinc-400 ${colors.hoverBg} hover:text-zinc-900 dark:hover:text-zinc-100`
          }
          ${collapsed && !sub ? "justify-center" : ""}
        `}
      >
        {/* Active indicator bar */}
        {isActive && !collapsed && (
          <motion.span
            layoutId={`active-bar-${accent}`}
            className={`absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full ${colors.activeDot}`}
            transition={{ type: "spring", stiffness: 500, damping: 35 }}
          />
        )}

        {/* Icon */}
        {Icon && (
          <Icon
            size={sub ? 14 : 18}
            strokeWidth={isActive ? 2.2 : 1.8}
            className={`shrink-0 ${isActive ? colors.activeText : ""}`}
          />
        )}

        {/* Label */}
        {!collapsed && (
          <motion.span
            initial={false}
            animate={{ opacity: 1 }}
            className="truncate leading-none"
          >
            {label}
          </motion.span>
        )}
      </Link>

      {/* Tooltip when collapsed */}
      {collapsed && (
        <div
          className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50
          pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150"
        >
          <div
            className="bg-zinc-900 dark:bg-zinc-800 text-white text-xs px-2.5 py-1.5 rounded-md
            shadow-lg whitespace-nowrap border border-zinc-700"
          >
            {label}
          </div>
        </div>
      )}
    </div>
  );
}
