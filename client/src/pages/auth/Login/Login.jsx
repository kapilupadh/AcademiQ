import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, Mail, Loader2 } from "lucide-react"; // Added Icons
import api from "../../../services/api";
import Alert from "../../../components/ui/Alert";

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    login_id: "", // email or username
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.type === "email" ? "login_id" : "password"]: e.target.value,
    });
    // Note: The input for email/username should have a generic name or handle generic input
  };

  const handleGenericChange = (e) => {
    setFormData({ ...formData, login_id: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setFormData({ ...formData, password: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await api.post(`/auth/login`, {
        login_id: formData.login_id,
        password: formData.password,
        expected_role: 3, // Student Role
      });

      // Store user info / token in localStorage or Context
      localStorage.setItem("user", JSON.stringify(res.data.user)); // User details
      localStorage.setItem("token", res.data.token); // JWT Token

      // Student defaults to dashboard
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-4">
      <div className="w-full max-w-[450px] p-8 rounded-xl shadow-2xl border bg-white border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800 transition-colors duration-300">
        <div className="mb-8 text-center space-y-2">
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-white">
            Welcome back
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400">
            Enter your credentials to access your account
          </p>
        </div>

        {error && (
          <div className="mb-6">
            <Alert variant="error" title="Login Failed">
              {error}
            </Alert>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Email or Username
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.login_id}
                onChange={handleGenericChange}
                placeholder="student@example.com"
                className="w-full pl-10 px-3 py-2 text-sm bg-transparent border rounded-md outline-none border-zinc-300 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-zinc-700 dark:focus:ring-zinc-700 placeholder-zinc-400 transition-all"
              />
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                value={formData.password}
                onChange={handlePasswordChange}
                placeholder="••••••••"
                className="w-full pl-10 px-3 py-2 text-sm bg-transparent border rounded-md outline-none border-zinc-300 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-zinc-700 dark:focus:ring-zinc-700 transition-all"
              />
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:ring-zinc-700 accent-zinc-900 dark:accent-white transition-all"
              />
              <span className="text-sm text-zinc-500 group-hover:text-zinc-900 dark:text-zinc-400 dark:group-hover:text-zinc-200 transition-colors">
                Remember me
              </span>
            </label>
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-zinc-900 hover:text-zinc-700 dark:text-zinc-200 dark:hover:text-white transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 mt-2 text-sm font-bold text-white bg-zinc-900 rounded-md hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-900 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-200 dark:focus:ring-zinc-100 transition-all shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin mx-auto" />
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-semibold text-zinc-900 hover:text-zinc-700 underline dark:text-zinc-100 dark:hover:text-white transition-colors"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
