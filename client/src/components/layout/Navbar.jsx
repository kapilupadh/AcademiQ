// client/src/components/layout/Navbar.jsx
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, LogOut, User, Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";

/* ─── Logo paths ────────────────────────────────────────────────── */
const LOGO_DARK_MODE = "/Icons/Untitled.png"; 
const LOGO_LIGHT_MODE = "/Icons/Dark-Logo.jpg"; 

export default function Navbar({ page = "public" }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const notificationRef = useRef(null);

  const { isDark, toggleTheme } = useTheme();
  const theme = isDark ? "dark" : "light";

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user from localStorage:", e);
        localStorage.removeItem("user");
      }
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setNotificationOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/login"; 
  };

  const getInitials = (name) => {
    return name ? name.charAt(0).toUpperCase() : "U";
  };

  // UI Component Classes (Matching shadcn/ui style)
  const GHOST_BTN_CLS = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 dark:focus-visible:ring-zinc-300 h-9 w-9 text-zinc-500 dark:text-zinc-400";
  const NAV_LINK_CLS = "text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50";
  const DROPDOWN_CLS = "absolute right-0 mt-2 w-72 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-md z-50 overflow-hidden";
  const DROPDOWN_ITEM_CLS = "flex items-center gap-2 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer";

  return (
    <div className="sticky top-0 z-30 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80 h-16 flex items-center">
      <div className="flex justify-between items-center w-full px-4 md:px-6">
        
        {/* Logo Section - Cleanly aligned, margin added for mobile hamburger */}
        <div className="flex items-center gap-3 pl-12 md:pl-0">
          <Link to={page === "login" || page === "public" ? "/" : "/dashboard"} className="flex items-center gap-2 group">
            <img
              src={isDark ? LOGO_DARK_MODE : LOGO_LIGHT_MODE}
              alt="AcademiQ Logo"
              className="h-7 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <span className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 hidden sm:block">
              Academi<span className="text-blue-600 dark:text-blue-500">Q</span>
            </span>
          </Link>
        </div>

        {/* Navigation & Actions */}
        <div className="flex items-center gap-2 md:gap-4">
          
          {/* Public Nav Links */}
          {(page === "login" || page === "public") && (
            <nav className="hidden sm:flex items-center gap-6 mr-4">
              <Link to="/" className={NAV_LINK_CLS}>Home</Link>
              <Link to="/about" className={NAV_LINK_CLS}>About</Link>
              <Link to="/contact" className={NAV_LINK_CLS}>Contact</Link>
            </nav>
          )}

          {/* Authenticated Dashboard Links */}
          {page !== "login" && page !== "public" && (
            <nav className="hidden sm:flex items-center gap-6 mr-2">
              <Link to="/dashboard" className={NAV_LINK_CLS}>Home</Link>
            </nav>
          )}

          {/* Action Icons */}
          <div className="flex items-center gap-1">
            
            {/* Theme Toggle */}
            <button onClick={toggleTheme} className={GHOST_BTN_CLS} aria-label="Toggle Theme">
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Authenticated Actions */}
            {page !== "login" && page !== "public" && (
              <>
                {/* Notifications */}
                <div className="relative" ref={notificationRef}>
                  <button onClick={() => setNotificationOpen(!notificationOpen)} className={GHOST_BTN_CLS}>
                    <Bell className="w-4 h-4" />
                  </button>

                  <AnimatePresence>
                    {notificationOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: 5, scale: 0.95 }} 
                        animate={{ opacity: 1, y: 0, scale: 1 }} 
                        exit={{ opacity: 0, scale: 0.95 }} 
                        transition={{ duration: 0.15 }}
                        className={DROPDOWN_CLS}
                      >
                        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Notifications</span>
                          <button className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">Mark all read</button>
                        </div>
                        <div className="max-h-[280px] overflow-y-auto py-1">
                          <div className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer">
                            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Exam Schedule Released</p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Sessional 1 starts next Monday.</p>
                          </div>
                          <div className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer">
                            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Assignment Due</p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Physics assignment is due tomorrow.</p>
                          </div>
                        </div>
                        <div className="p-2 border-t border-zinc-200 dark:border-zinc-800">
                          <Link to="/notifications" className="block w-full text-center text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors py-1.5">
                            View All Notifications
                          </Link>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Profile Dropdown */}
                <div className="relative ml-1" ref={dropdownRef}>
                  <button 
                    onClick={() => setDropdownOpen(!dropdownOpen)} 
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:focus-visible:ring-zinc-300"
                  >
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{getInitials(user?.full_name)}</span>
                  </button>

                  <AnimatePresence>
                    {dropdownOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: 5, scale: 0.95 }} 
                        animate={{ opacity: 1, y: 0, scale: 1 }} 
                        exit={{ opacity: 0, scale: 0.95 }} 
                        transition={{ duration: 0.15 }}
                        className={`${DROPDOWN_CLS} w-56`}
                      >
                        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
                          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50 truncate">{user?.full_name || "User"}</p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">{user?.email || "student@example.com"}</p>
                        </div>
                        <div className="p-1">
                          <Link to="/profile" onClick={() => setDropdownOpen(false)} className={DROPDOWN_ITEM_CLS}>
                            <User className="w-4 h-4 mr-2" /> Profile
                          </Link>
                        </div>
                        <div className="p-1 border-t border-zinc-200 dark:border-zinc-800">
                          <button onClick={handleLogout} className={`${DROPDOWN_ITEM_CLS} w-full text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30`}>
                            <LogOut className="w-4 h-4 mr-2" /> Log out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}