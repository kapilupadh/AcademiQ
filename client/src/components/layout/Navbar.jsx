import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, LogOut, User, Sun, Moon } from "lucide-react";

export default function Navbar({ page = "public" }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Theme State
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Theme Logic
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/login"; // Force reload for clean state or use navigate("/login")
  };

  const getInitials = (name) => {
    return name ? name.charAt(0).toUpperCase() : "U";
  };

  return (
    <div className="px-8 py-3">
      <div className="flex justify-between items-center">
        {/* Logo */}
        <div className="group cursor-pointer">
          <Link to={page === "login" || page === "public" ? "/" : "/dashboard"}>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white transition-all duration-300 group-hover:text-blue-600 dark:group-hover:text-blue-200 group-hover:tracking-wide group-hover:drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]">
              Academi
              <span className="inline-block text-blue-600 dark:text-blue-500 transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110 group-hover:drop-shadow-[0_0_15px_rgba(59,130,246,1)]">
                Q
              </span>
            </h1>
          </Link>
        </div>

        {/* Navigation Links */}
        <ul className="flex items-center gap-6 font-medium">
          {/* Public / Login View */}
          {(page === "login" || page === "public") && (
            <>
              <li className="cursor-pointer text-zinc-500 hover:text-slate-200 transition duration-300 ease-in-out">
                <Link to="/">Home</Link>
              </li>
              <li className="cursor-pointer text-zinc-500 hover:text-slate-200 transition duration-300 ease-in-out">
                <Link to="/about">About</Link>
              </li>
              <li className="cursor-pointer text-zinc-500 hover:text-slate-200 transition duration-300 ease-in-out">
                <Link to="/contact">Contact</Link>
              </li>
            </>
          )}

          {/* Student / Dashboard View */}
          {page !== "login" && page !== "public" && (
            <>
              <li className="cursor-pointer text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition duration-300 ease-in-out">
                <Link to="/dashboard">Home</Link>
              </li>
              <li className="cursor-pointer text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition duration-300 ease-in-out">
                <Link to="/sessional">Sessional</Link>
              </li>
              <li className="cursor-pointer text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition duration-300 ease-in-out">
                <Link to="/Notifications">Notifications</Link>
              </li>

              {/* Profile Dropdown */}
              <li className="relative ml-2" ref={dropdownRef}>
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer overflow-hidden bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 font-bold border-2 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500 transition-all duration-300 transform hover:scale-110 active:scale-95 shadow-sm hover:shadow-lg dark:shadow-zinc-950/50"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  {getInitials(user?.full_name)}
                </div>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-3 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl py-2 animate-in fade-in zoom-in-95 duration-200 z-50">
                    <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-800 mb-1">
                      <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
                        {user?.full_name || "User"}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                        {user?.email || "student@example.com"}
                      </p>
                    </div>

                    <Link
                      to="/profile"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <User className="w-4 h-4" />
                      Profile
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                )}
              </li>
            </>
          )}

          {/* Theme Toggle Button - Always Last */}
          <li className="cursor-pointer text-zinc-500 hover:text-slate-200 transition duration-300 ease-in-out ml-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-zinc-800 dark:hover:bg-zinc-800/50 transition-colors"
              aria-label="Toggle Theme"
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5 text-yellow-500" />
              ) : (
                <Moon className="w-5 h-5 text-zinc-100 dark:text-zinc-400" />
              )}
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
}
