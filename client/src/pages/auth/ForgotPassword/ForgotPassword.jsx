import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mail, 
  Lock, 
  ArrowRight, 
  CheckCircle, 
  Loader2, 
  Key,
  ShieldCheck,
  User as UserIcon
} from "lucide-react";
import api from "../../../services/api";

const Alert = ({ variant, title, children }) => (
  <motion.div 
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    className={`p-4 rounded-2xl text-sm border ${
      variant === "error" 
        ? "bg-red-500/10 border-red-500/20 text-red-400" 
        : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
    }`}
  >
    <div className="font-bold mb-1 uppercase tracking-widest text-[10px]">{title}</div>
    {children}
  </motion.div>
);

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [recoveredId, setRecoveredId] = useState("");

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

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await api.post(`/auth/forgot-password`, {
        email: formData.email,
      });
      setSuccess(res.data.message);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await api.post(`/auth/verify-otp`, {
        email: formData.email,
        otp: formData.otp,
      });
      setResetToken(res.data.resetToken);
      setRecoveredId(res.data.unique_id);
      setSuccess("OTP Verified!");
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP.");
    } finally {
      setLoading(false);
    }
  };

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
      const res = await api.post(`/auth/reset-password`, {
        resetToken: resetToken,
        newPassword: formData.newPassword,
      });
      setSuccess(res.data.message);
      setTimeout(() => {
        navigate("/login");
      }, 2500);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center font-['Inter'] relative overflow-hidden p-6">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(50,50,50,0.1)_0%,transparent_50%)] pointer-events-none" />
      <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-violet-500/5 blur-[120px] rounded-full pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#111] border border-white/5 rounded-[2.5rem] p-8 lg:p-12 shadow-2xl relative z-10"
      >
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold mb-2 tracking-tight">
            {step === 1 && "Account Recovery"}
            {step === 2 && "Verification"}
            {step === 3 && "Secure Access"}
          </h2>
          <p className="text-zinc-500 text-sm">
            {step === 1 && "Enter your registered email to reset your access"}
            {step === 2 && `We've sent a 6-digit code to ${formData.email}`}
            {step === 3 && "Recovery successful. You can now reset your password."}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {(error || success) && (
            <div className="mb-6">
              {error && <Alert variant="error" title="Security Alert">{error}</Alert>}
              {success && <Alert variant="success" title="Success">{success}</Alert>}
            </div>
          )}
        </AnimatePresence>

        {/* Step 1: Email Form */}
        {step === 1 && (
          <form className="space-y-6" onSubmit={handleSendOTP}>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="name@university.edu"
                  className="w-full bg-black/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-zinc-700"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/10"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : "Continue Recovery"}
            </button>
          </form>
        )}

        {/* Step 2: OTP Form */}
        {step === 2 && (
          <form className="space-y-6" onSubmit={handleVerifyOTP}>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">
                Verification Code
              </label>
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                <input
                  type="text"
                  name="otp"
                  value={formData.otp}
                  onChange={handleChange}
                  required
                  placeholder="123456"
                  maxLength={6}
                  className="w-full bg-black/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-zinc-700 tracking-[0.5em] text-center font-mono"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/10"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : "Verify Identity"}
            </button>
            <div className="text-center">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-[10px] text-zinc-500 hover:text-white uppercase tracking-widest font-bold transition-colors"
              >
                Use different email
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Result & Reset Form */}
        {step === 3 && (
          <div className="space-y-8">
            {/* Recovered ID Display */}
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-3xl p-6 text-center space-y-2">
              <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-[0.2em]">Identity Recovered</div>
              <div className="text-2xl font-mono font-bold text-white tracking-tight">{recoveredId}</div>
              <div className="text-[10px] text-zinc-500">This is your Unique ID provided by the admin.</div>
            </div>

            <form className="space-y-6" onSubmit={handleResetPassword}>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">
                  New Secure Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                  <input
                    type="password"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    required
                    placeholder="••••••••"
                    className="w-full bg-black/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    placeholder="••••••••"
                    className="w-full bg-black/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/10"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : "Update Credentials"}
              </button>
            </form>
          </div>
        )}

        <div className="mt-8 text-center">
          <p className="text-xs text-zinc-500">
            Remembered your credentials?{" "}
            <Link to="/login" className="text-white font-bold hover:underline transition-all">
              Sign In
            </Link>
          </p>
        </div>

        <div className="text-[10px] text-zinc-700 text-center mt-12 uppercase tracking-widest font-bold">
          &copy; 2026 AcademiQ Security
        </div>
      </motion.div>
    </div>
  );
}
