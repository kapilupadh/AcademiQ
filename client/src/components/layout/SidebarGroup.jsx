import React from "react";
import { ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Accordion group with a parent trigger and collapsible sub-items.
 * @param {object} props
 * @param {React.ElementType} props.icon   - Lucide icon
 * @param {string} props.label             - Group label
 * @param {boolean} props.isOpen           - Open state (from useSidebar openGroups)
 * @param {function} props.onToggle        - Toggle handler
 * @param {boolean} props.collapsed        - Sidebar collapsed state
 * @param {string} props.accent            - Color accent ("indigo"|"blue"|"violet")
 * @param {boolean} props.hasActive        - True if any child is active (highlights parent)
 * @param {React.ReactNode} props.children - SidebarItem children
 */
export default function SidebarGroup({
  icon: Icon,
  label,
  isOpen,
  onToggle,
  collapsed,
  accent = "indigo",
  hasActive = false,
  children,
}) {
  const accentMap = {
    indigo: {
      activeText: "text-indigo-600 dark:text-indigo-400",
      activeBg: "bg-indigo-500/10 dark:bg-indigo-500/15",
      hoverBg: "hover:bg-indigo-500/8 dark:hover:bg-indigo-500/10",
    },
    blue: {
      activeText: "text-blue-600 dark:text-blue-400",
      activeBg: "bg-blue-500/10 dark:bg-blue-500/15",
      hoverBg: "hover:bg-blue-500/8 dark:hover:bg-blue-500/10",
    },
    violet: {
      activeText: "text-violet-600 dark:text-violet-400",
      activeBg: "bg-violet-500/10 dark:bg-violet-500/15",
      hoverBg: "hover:bg-violet-500/8 dark:hover:bg-violet-500/10",
    },
  };

  const colors = accentMap[accent] || accentMap.indigo;

  // In collapsed mode, just show the icon + tooltip (no accordion)
  if (collapsed) {
    return (
      <div className="relative group">
        <button
          className={`
            flex items-center justify-center w-full px-3 py-2 rounded-lg transition-all duration-200
            ${hasActive ? `${colors.activeBg} ${colors.activeText}` : `text-zinc-600 dark:text-zinc-400 ${colors.hoverBg} hover:text-zinc-900 dark:hover:text-zinc-100`}
          `}
        >
          {Icon && (
            <Icon
              size={18}
              strokeWidth={hasActive ? 2.2 : 1.8}
              className="shrink-0"
            />
          )}
        </button>
        {/* Tooltip */}
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
      </div>
    );
  }

  return (
    <div>
      {/* Parent trigger */}
      <button
        onClick={onToggle}
        className={`
          flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium
          transition-all duration-200 cursor-pointer select-none
          ${
            hasActive
              ? `${colors.activeBg} ${colors.activeText}`
              : `text-zinc-600 dark:text-zinc-400 ${colors.hoverBg} hover:text-zinc-900 dark:hover:text-zinc-100`
          }
        `}
      >
        {Icon && (
          <Icon
            size={18}
            strokeWidth={hasActive ? 2.2 : 1.8}
            className="shrink-0"
          />
        )}
        <span className="flex-1 text-left truncate leading-none">{label}</span>
        <motion.span
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="shrink-0"
        >
          <ChevronRight size={14} strokeWidth={2} />
        </motion.span>
      </button>

      {/* Collapsible children */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="group-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-1 space-y-0.5 border-l border-zinc-200 dark:border-zinc-800 ml-[22px] pl-3">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
