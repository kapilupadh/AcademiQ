// src/components/Navbar.jsx
import { Link } from "react-router-dom";

export default function Navbar({ page = "public" }) {
  return (
    <div className="px-8 py-3">
      <div className="flex justify-between items-center">
        <div className="group cursor-pointer">
          <h1 className="text-2xl font-bold text-white transition-all duration-300 group-hover:text-blue-200 group-hover:tracking-wide group-hover:drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]">
            Academi
            <span className="inline-block text-blue-500 transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110 group-hover:drop-shadow-[0_0_15px_rgba(59,130,246,1)]">
              Q
            </span>
          </h1>
        </div>

        <ul className="flex gap-5 font-medium">
          {/* Default links (e.g. for dashboard) */}
          {page === "public" || page === "login" ? null : (
            <li className="cursor-pointer text-zinc-500 hover:text-slate-200 transition duration-300 ease-in-out">
              <Link to="/">Home</Link>
            </li>
          )}

          {/* This section changes based on the "page" prop */}
          {page === "login" || page === "public" ? (
            <>
              <li className="cursor-pointer text-zinc-500 hover:text-slate-200 transition duration-300 ease-in-out">
                <Link to="/about">About</Link>
              </li>
              <li className="cursor-pointer text-zinc-500 hover:text-slate-200 transition duration-300 ease-in-out">
                <Link to="/contact">Contact</Link>
              </li>
            </>
          ) : (
            <>
              <li className="cursor-pointer text-zinc-500 hover:text-slate-200 transition duration-300 ease-in-out">
                <Link to="/dashboard">Dashboard</Link>
              </li>
              <li className="cursor-pointer text-zinc-500 hover:text-slate-200 transition duration-300 ease-in-out">
                <Link to="/profile">Profile</Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </div>
  );
}
