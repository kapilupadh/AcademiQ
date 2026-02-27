import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Lock,
  Mail,
  User,
  Key,
  Loader2,
  ShieldCheck,
  Eye,
  EyeOff,
  CheckCircle,
} from "lucide-react";
import axios from "axios";
import Alert from "../../../components/ui/Alert";

export default function AdminRegister() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 = code verification, 2 = account details
  const [adminCode, setAdminCode] = useState("");
  const [codeVerified, setCodeVerified] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    full_name: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // Step 1: Verify admin code client-side pattern (actual validation happens on submit)
  const handleVerifyCode = (e) => {
    e.preventDefault();
    if (!adminCode.trim()) {
      setError("Please enter the admin setup code.");
      return;
    }
    setError("");
    setCodeVerified(true);
    setStep(2);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      await axios.post((`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/auth/admin-register`), {
        full_name: formData.full_name,
        username: formData.username,
        email: formData.email,
        password: formData.password,
        admin_code: adminCode,
      });
      setSuccess(true);
    } catch (err) {
      setError(
        err.response?.data?.message || "Registration failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Success state ─────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-4">
        <div className="w-full max-w-[450px] p-8 rounded-xl shadow-2xl border bg-white border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
            Admin Account Created!
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">
            Your administrator account has been set up successfully. You can now
            sign in.
          </p>
          <button
            onClick={() => navigate("/admin/login")}
            className="w-full py-2.5 text-sm font-bold text-white bg-zinc-900 rounded-md hover:bg-zinc-800 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-200 transition-all"
          >
            Go to Admin Login
          </button>
        </div>
      </div>
    );
  }

  const inputCls =
    "w-full pl-10 px-3 py-2 text-sm bg-transparent border rounded-md outline-none border-zinc-300 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-zinc-700 dark:focus:ring-zinc-700 placeholder-zinc-400 transition-all";

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-4">
      <div className="w-full max-w-[480px] p-8 rounded-xl shadow-2xl border bg-white border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800 transition-colors duration-300">
        {/* Header */}
        <div className="mb-8 text-center space-y-2">
          <div className="w-14 h-14 rounded-full bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-7 h-7 text-white dark:text-zinc-900" />
          </div>
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-white">
            Create Admin Account
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">
            {step === 1
              ? "Enter your admin setup code to proceed"
              : "Fill in your account details"}
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-3 mb-6">
          {[1, 2].map((s) => (
            <div key={s} className="flex-1 flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  step >= s
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
                }`}
              >
                {step > s ? <CheckCircle className="w-4 h-4" /> : s}
              </div>
              <span className="text-xs text-zinc-500 hidden sm:block">
                {s === 1 ? "Verify Code" : "Account Details"}
              </span>
              {s < 2 && (
                <div
                  className={`flex-1 h-0.5 ${step > s ? "bg-zinc-900 dark:bg-white" : "bg-zinc-200 dark:bg-zinc-700"}`}
                />
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-5">
            <Alert variant="error" title="Error">
              {error}
            </Alert>
          </div>
        )}

        {/* ── STEP 1: Code verification ── */}
        {step === 1 && (
          <form className="space-y-4" onSubmit={handleVerifyCode}>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Admin Setup Code
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
                <input
                  type="password"
                  value={adminCode}
                  onChange={(e) => {
                    setAdminCode(e.target.value);
                    setError("");
                  }}
                  placeholder="Enter setup code provided by system owner"
                  className={inputCls}
                />
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                This code is set in the server's{" "}
                <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">
                  ADMIN_SETUP_CODE
                </code>{" "}
                environment variable.
              </p>
            </div>
            <button
              type="submit"
              className="w-full py-2.5 text-sm font-bold text-white bg-zinc-900 rounded-md hover:bg-zinc-800 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-200 transition-all shadow-lg"
            >
              Verify Code
            </button>
          </form>
        )}

        {/* ── STEP 2: Account details ── */}
        {step === 2 && (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
                <input
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="Dr. John Smith"
                  required
                  className={inputCls}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Username
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-zinc-400 text-sm font-mono">
                  @
                </span>
                <input
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="admin_akq"
                  required
                  className="w-full pl-8 px-3 py-2 text-sm bg-transparent border rounded-md outline-none border-zinc-300 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-zinc-700 dark:focus:ring-zinc-700 placeholder-zinc-400 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="admin@academiq.edu"
                  required
                  className={inputCls}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min. 8 characters"
                  required
                  className="w-full pl-10 pr-10 py-2 text-sm bg-transparent border rounded-md outline-none border-zinc-300 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-zinc-700 dark:focus:ring-zinc-700 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
                <input
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className={inputCls}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setError("");
                }}
                className="flex-1 py-2.5 text-sm font-semibold border border-zinc-300 dark:border-zinc-700 rounded-md text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 text-sm font-bold text-white bg-zinc-900 rounded-md hover:bg-zinc-800 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-200 transition-all shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  "Create Account"
                )}
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 text-center">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Already have an account?{" "}
            <Link
              to="/admin/login"
              className="font-semibold text-zinc-900 hover:text-zinc-700 underline dark:text-zinc-100 dark:hover:text-white transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

