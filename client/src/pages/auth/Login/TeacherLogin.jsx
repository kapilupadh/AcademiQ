import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, Mail, Loader2 } from "lucide-react";
import axios from "axios";
import Alert from "../../../components/ui/Alert";

export default function TeacherLogin() {
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
      const res = await axios.post("http://localhost:5000/api/auth/login", {
        login_id: formData.login_id,
        password: formData.password,
      });

      // Check if role is teacher (2) or admin (1)
      const role = res.data.user.role; // Now an integer: 1=Admin, 2=Teacher, 3=Student
      if (role !== 2 && role !== 1) {
        // Fallback for students trying to use this portal, though backend might allow it.
        // If you want strict separation:
        // throw new Error("This portal is for Teachers and Admins only.");

        // For now, we allow them but log it.
        console.warn("Student logged in via Teacher Portal");
      }

      localStorage.setItem("user", JSON.stringify(res.data.user));
      localStorage.setItem("token", res.data.token);

      if (res.data.user.role === 1) {
        navigate("/admin/generate-id");
      } else if (res.data.user.role === 2) {
        navigate("/teacher/dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Login Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-4">
      <div className="w-full max-w-[450px] p-8 rounded-xl shadow-2xl border bg-white border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800 transition-colors duration-300">
        <div className="mb-8 text-center space-y-2">
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-white">
            Teacher Login
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400">
            Access your teaching portal
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
                placeholder="teacher@example.com"
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
              to="/teacher-register"
              className="font-semibold text-zinc-900 hover:text-zinc-700 underline dark:text-zinc-100 dark:hover:text-white transition-colors"
            >
              Sign up as Teacher
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
