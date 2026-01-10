// src/pages/Register.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { HelpCircle } from "lucide-react";

export default function Register() {
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-4">
      {/* Card Container */}
      <div className="w-full max-w-[600px] p-8 rounded-xl shadow-2xl border bg-white border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800 transition-colors duration-300">
        {/* Header */}
        <div className="mb-6 text-center space-y-2">
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-white">
            Create your account
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400">
            Enter your credentials below to create your account
          </p>
        </div>

        {/* Form */}
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          {/* Unique ID with Hover Tooltip */}
          <div className="space-y-1 relative group">
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 cursor-help">
                Unique ID
              </label>
              <HelpCircle className="w-4 h-4 text-zinc-400" />
            </div>
            {/* Tooltip */}
            <div className="absolute left-0 -top-8 hidden group-hover:block bg-zinc-800 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-10 border border-zinc-700">
              Enter Unique ID provided by the Dept. of Computer Science
              <div className="absolute -bottom-1 left-4 w-2 h-2 bg-zinc-800 rotate-45 border-r border-b border-zinc-700"></div>
            </div>

            <input
              type="text"
              placeholder="e.g. CS-2024-001"
              className="w-full px-3 py-2 text-sm bg-transparent border rounded-md outline-none
                border-zinc-300 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900
                dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-zinc-700 dark:focus:ring-zinc-700
                placeholder-zinc-400 font-medium transition-all"
            />
          </div>

          {/* First Name & Last Name */}
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="w-full space-y-1">
              <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                First Name
              </label>
              <input
                type="text"
                placeholder="Richard"
                className="w-full px-3 py-2 text-sm bg-transparent border rounded-md outline-none
                  border-zinc-300 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900
                  dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-zinc-700 dark:focus:ring-zinc-700
                  placeholder-zinc-400 font-medium transition-all"
              />
            </div>
            <div className="w-full space-y-1">
              <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Last Name
              </label>
              <input
                type="text"
                placeholder="Rendi"
                className="w-full px-3 py-2 text-sm bg-transparent border rounded-md outline-none
                  border-zinc-300 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900
                  dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-zinc-700 dark:focus:ring-zinc-700
                  placeholder-zinc-400 font-medium transition-all"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Email
            </label>
            <input
              type="email"
              placeholder="m@example.com"
              className="w-full px-3 py-2 text-sm bg-transparent border rounded-md outline-none
                border-zinc-300 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900
                dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-zinc-700 dark:focus:ring-zinc-700
                placeholder-zinc-400 font-medium transition-all"
            />
          </div>

          {/* DOB */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Date of Birth
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 text-sm bg-transparent border rounded-md outline-none
                border-zinc-300 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900
                dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-zinc-700 dark:focus:ring-zinc-700
                placeholder-zinc-400 font-medium transition-all [color-scheme:light] dark:[color-scheme:dark]"
            />
          </div>

          {/* Password Group */}
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="w-full space-y-1">
              <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Password
              </label>
              <input
                type="password"
                className="w-full px-3 py-2 text-sm bg-transparent border rounded-md outline-none
                  border-zinc-300 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900
                  dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-zinc-700 dark:focus:ring-zinc-700
                  transition-all"
              />
            </div>
            <div className="w-full space-y-1">
              <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Confirm Password
              </label>
              <input
                type="password"
                placeholder=""
                className="w-full px-3 py-2 text-sm bg-transparent border rounded-md outline-none
                  border-zinc-300 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900
                  dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-zinc-700 dark:focus:ring-zinc-700
                  transition-all"
              />
            </div>
          </div>

          {/* Helper Text */}
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Must be at least 8 characters long.
          </p>

          {/* Terms Checkbox */}
          <div className=" flex justify-start items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="terms"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900
                dark:border-zinc-700 dark:bg-zinc-900 dark:focus:ring-zinc-700 accent-zinc-900 dark:accent-white"
            />
            <label
              htmlFor="terms"
              className="text-sm text-zinc-500 dark:text-zinc-400 leading-none"
            >
              I agree to the{" "}
              <Link
                to="/terms"
                className="underline hover:text-zinc-800 dark:hover:text-zinc-200"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                to="/privacy"
                className="underline hover:text-zinc-800 dark:hover:text-zinc-200"
              >
                Privacy Policy
              </Link>
              .
            </label>
          </div>

          {/* Submit Button */}
          <button
            disabled={!agreed}
            className={`w-full py-2 mt-2 text-sm font-bold text-white rounded-md transition-all
              ${
                agreed
                  ? "bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-200 cursor-pointer"
                  : "bg-zinc-300 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-600 cursor-not-allowed"
              }`}
          >
            Create Account
          </button>
        </form>

        {/* Sign In Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-sm font-medium underline text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition duration-300 ease-in-out"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
