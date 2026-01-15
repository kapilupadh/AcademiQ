import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowRight, CheckCircle, Loader2 } from "lucide-react";
import axios from "axios";
import Alert from "../../../components/ui/Alert";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [resetToken, setResetToken] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Step 1: Send OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/forgot-password",
        {
          email: formData.email,
        }
      );
      setSuccess(res.data.message);
      setStep(2);
    } catch (err) {
      console.error("OTP Error:", err);
      const msg =
        err.response?.data?.message || err.message || "Failed to send OTP.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/verify-otp",
        {
          email: formData.email,
          otp: formData.otp,
        }
      );
      setResetToken(res.data.resetToken);
      setSuccess("OTP Verified!");
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP.");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (formData.newPassword !== formData.confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/reset-password",
        {
          resetToken: resetToken,
          newPassword: formData.newPassword,
        }
      );
      setSuccess(res.data.message);
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-4">
      <div className="w-full max-w-[450px] p-8 rounded-xl shadow-2xl border bg-white border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800 transition-colors duration-300">
        <div className="mb-8 text-center space-y-2">
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-white">
            {step === 1 && "Forgot Password"}
            {step === 2 && "Verify OTP"}
            {step === 3 && "Reset Password"}
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400">
            {step === 1 && "Enter your email to receive an OTP."}
            {step === 2 && `Enter the OTP sent to ${formData.email}`}
            {step === 3 && "Create a new strong password."}
          </p>
        </div>

        {error && (
          <div className="mb-6">
            <Alert variant="error" title="Error">
              {error}
            </Alert>
          </div>
        )}

        {success && (
          <div className="mb-6">
            <Alert variant="success" title="Success">
              {success}
            </Alert>
          </div>
        )}

        {/* Step 1: Email Form */}
        {step === 1 && (
          <form className="space-y-4" onSubmit={handleSendOTP}>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="you@example.com"
                  className="w-full pl-10 px-3 py-2 text-sm bg-transparent border rounded-md outline-none border-zinc-300 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-zinc-700 dark:focus:ring-zinc-700 transition-all"
                />
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 mt-2 flex items-center justify-center text-sm font-bold text-white bg-zinc-900 rounded-md hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-900 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-200 dark:focus:ring-zinc-100 transition-all shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Send OTP"
              )}
            </button>
          </form>
        )}

        {/* Step 2: OTP Form */}
        {step === 2 && (
          <form className="space-y-4" onSubmit={handleVerifyOTP}>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Enter OTP
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="otp"
                  value={formData.otp}
                  onChange={handleChange}
                  required
                  placeholder="123456"
                  maxLength={6}
                  className="w-full pl-10 px-3 py-2 text-sm bg-transparent border rounded-md outline-none border-zinc-300 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-zinc-700 dark:focus:ring-zinc-700 transition-all tracking-widest text-center"
                />
                <CheckCircle className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 mt-2 flex items-center justify-center text-sm font-bold text-white bg-zinc-900 rounded-md hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-900 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-200 dark:focus:ring-zinc-100 transition-all shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Verify OTP"
              )}
            </button>
            <div className="text-center mt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 underline"
              >
                Resend OTP / Change Email
              </button>
            </div>
          </form>
        )}

        {/* Step 3: New Password Form */}
        {step === 3 && (
          <form className="space-y-4" onSubmit={handleResetPassword}>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                New Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 px-3 py-2 text-sm bg-transparent border rounded-md outline-none border-zinc-300 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-zinc-700 dark:focus:ring-zinc-700 transition-all"
                />
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 px-3 py-2 text-sm bg-transparent border rounded-md outline-none border-zinc-300 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-zinc-700 dark:focus:ring-zinc-700 transition-all"
                />
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 mt-2 flex items-center justify-center text-sm font-bold text-white bg-zinc-900 rounded-md hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-900 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-200 dark:focus:ring-zinc-100 transition-all shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Reset Password"
              )}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Remember your password?{" "}
            <Link
              to="/login"
              className="font-semibold text-zinc-900 hover:text-zinc-700 underline dark:text-zinc-100 dark:hover:text-white transition-colors"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
