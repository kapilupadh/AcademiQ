import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Bell, LogOut, User, Sun, Moon, Settings } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";

const LOGO_DARK_MODE = "/Icons/Untitled.png";
const LOGO_LIGHT_MODE = "/Icons/Dark-Logo.jpg";

// Role-based home route
const HOME_ROUTE = {
  student: "/dashboard",
  teacher: "/teacher/dashboard",
  admin:   "/admin/dashboard",
};

// Role-based logout route
const LOGOUT_ROUTE = {
  student: "/login",
  teacher: "/teacher-login",
  admin:   "/admin/login",
};

// Role pill label + style
const ROLE_PILL = {
  student: { label: "STUDENT", cls: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50" },
  teacher: { label: "TEACHER", cls: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700" },
  admin:   { label: "ADMIN",   cls: "bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400 border border-violet-200 dark:border-violet-900/50" },
};

export default function Navbar({ page = "public" }) {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);
  const { isDark, toggleTheme } = useTheme();
  const theme = isDark ? "dark" : "light";

  const isAuthed = page !== "login" && page !== "public";

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try { setUser(JSON.parse(storedUser)); }
      catch (e) { localStorage.removeItem("user"); }
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target))
        setDropdownOpen(false);
      if (notificationRef.current && !notificationRef.current.contains(event.target))
        setNotificationOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.location.href = LOGOUT_ROUTE[page] ?? "/login";
  };

  const getInitials = (name) =>
    name ? name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() : "U";

  const homeRoute = HOME_ROUTE[page] ?? "/";
  const rolePill  = ROLE_PILL[page];

  const GHOST_BTN =
    "relative inline-flex items-center justify-center rounded-md text-sm font-medium transition-all duration-200 h-9 w-9 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 hover:text-zinc-900 dark:hover:text-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-600";

  const DROPDOWN_CLS =
    "absolute right-0 mt-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg shadow-zinc-900/5 dark:shadow-black/20 z-50 overflow-hidden";

  const DROPDOWN_ITEM =
    "flex items-center gap-2 px-3 py-2 rounded-md text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 transition-colors cursor-pointer";

  const NavLink = ({ to, children }) => {
    const active = to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);
    return (
      <Link
        to={to}
        className={`relative text-sm font-medium transition-colors py-1 ${
          active
            ? "text-zinc-900 dark:text-zinc-50"
            : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        }`}
      >
        {children}
        {active && (
          <motion.span
            layoutId="nav-active-underline"
            className="absolute -bottom-[18px] left-0 right-0 h-[2px] bg-zinc-900 dark:bg-zinc-50 rounded-full"
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
          />
        )}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b border-zinc-200/80 dark:border-zinc-800/70 bg-white/75 dark:bg-zinc-950/75 backdrop-blur-xl h-16 flex items-center">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center w-full px-4 md:px-6 gap-4">

        {/* ── LEFT: Logo + role pill ── */}
        <div className="flex items-center gap-3 min-w-0 pl-12 md:pl-0">
          <Link to={isAuthed ? homeRoute : "/"} className="flex items-center gap-2 group">
            <img
              src={isDark ? LOGO_DARK_MODE : LOGO_LIGHT_MODE}
              alt="AcademiQ Logo"
              className="h-7 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
              onError={(e) => { e.target.style.display = "none"; }}
            />
            <span className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 hidden sm:block">
              Academi<span className="text-blue-600 dark:text-blue-500">Q</span>
            </span>
          </Link>

          {/* Role pill — only when authenticated */}
          {isAuthed && rolePill && (
            <span className={`hidden sm:inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-md tracking-wider leading-none ${rolePill.cls}`}>
              {rolePill.label}
            </span>
          )}
        </div>

        {/* ── CENTER: Public nav links ── */}
        <nav className="hidden md:flex items-center justify-center gap-7">
          {!isAuthed && (
            <>
              <NavLink to="/">Home</NavLink>
              <NavLink to="/about">About</NavLink>
              <NavLink to="/contact">Contact</NavLink>
            </>
          )}
        </nav>

        {/* ── RIGHT: Actions ── */}
        <div className="flex items-center justify-end gap-1.5">

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className={GHOST_BTN}
            aria-label="Toggle theme"
            title={isDark ? "Light mode" : "Dark mode"}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={theme}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-center"
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </motion.span>
            </AnimatePresence>
          </button>

          {/* ── Authenticated: notifications + profile ── */}
          {isAuthed && (
            <>
              {/* Notifications */}
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => setNotificationOpen((p) => !p)}
                  className={GHOST_BTN}
                  aria-label="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-2 right-2 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500 ring-2 ring-white dark:ring-zinc-950" />
                  </span>
                </button>

                <AnimatePresence>
                  {notificationOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.96 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className={`${DROPDOWN_CLS} w-72`}
                    >
                      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Notifications</span>
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                            2 new
                          </span>
                        </div>
                        <button className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 transition-colors">
                          Mark all read
                        </button>
                      </div>
                      <div className="max-h-[280px] overflow-y-auto py-1">
                        {[
                          { title: "Exam Schedule Released", body: "Sessional 1 starts next Monday.", time: "2h" },
                          { title: "Assignment Due",         body: "Physics assignment is due tomorrow.", time: "5h" },
                        ].map((n) => (
                          <div
                            key={n.title}
                            className="px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer border-l-2 border-blue-500"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{n.title}</p>
                              <span className="text-[10px] text-zinc-400 shrink-0 mt-0.5">{n.time}</span>
                            </div>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{n.body}</p>
                          </div>
                        ))}
                      </div>
                      <div className="p-1.5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                        <button
                          onClick={() => setNotificationOpen(false)}
                          className="block w-full text-center text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 transition-colors py-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        >
                          View all notifications
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-800 mx-1" />

              {/* Profile dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen((p) => !p)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-600"
                  aria-label="Profile"
                >
                  <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                    {getInitials(user?.full_name || user?.name)}
                  </span>
                </button>

                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.96 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className={`${DROPDOWN_CLS} w-60`}
                    >
                      {/* User header */}
                      <div className="flex items-center gap-3 px-3 py-3 border-b border-zinc-200 dark:border-zinc-800">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900 border border-zinc-200 dark:border-zinc-700">
                          <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                            {getInitials(user?.full_name || user?.name)}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50 truncate">
                              {user?.full_name || user?.name || "User"}
                            </p>
                          </div>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                            {user?.email || ""}
                          </p>
                          {/* Role pill inside dropdown */}
                          {rolePill && (
                            <span className={`inline-flex items-center text-[9px] font-semibold px-1.5 py-0.5 rounded mt-1 tracking-wider leading-none ${rolePill.cls}`}>
                              {rolePill.label}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Menu items — profile only for non-admin */}
                      <div className="p-1">
                        {page !== "admin" && (
                          <Link
                            to="/profile"
                            onClick={() => setDropdownOpen(false)}
                            className={DROPDOWN_ITEM}
                          >
                            <User className="w-4 h-4 text-zinc-500" />
                            <span className="flex-1">Profile</span>
                          </Link>
                        )}
                        <div
                          className={`${DROPDOWN_ITEM} opacity-50 cursor-not-allowed`}
                          title="Coming soon"
                        >
                          <Settings className="w-4 h-4 text-zinc-500" />
                          <span className="flex-1">Settings</span>
                          <span className="text-[9px] font-semibold tracking-wide px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border border-zinc-200 dark:border-zinc-700">
                            Soon
                          </span>
                        </div>
                      </div>

                      {/* Logout */}
                      <div className="p-1 border-t border-zinc-200 dark:border-zinc-800">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span className="flex-1 text-left">Log out</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          )}

          {/* Public CTA */}
          {!isAuthed && (
            <>
              <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-800 mx-1 hidden sm:block" />
              <Link
                to="/login"
                className="hidden sm:inline-flex items-center h-9 px-4 rounded-md text-sm font-medium bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-colors"
              >
                Sign in
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}