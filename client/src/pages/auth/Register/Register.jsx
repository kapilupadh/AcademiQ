// src/pages/Register.jsx
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CircleHelp, Loader2 } from "lucide-react";
import axios from "axios";
import Alert from "../../../components/ui/Alert";

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: ID Validation, 2: Full Form
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form Data
  const [formData, setFormData] = useState({
    unique_id: "",
    session_token: "",
    first_name: "",
    last_name: "",
    email: "",
    dob: "",
    password: "",
    confirm_password: "",
    username: "", // Added username
    department_id: "", // Added department
  });
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    // Fetch departments
    axios
      .get((`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/departments`))
      .then((res) => setDepartments(res.data))
      .catch((err) => console.error("Failed to fetch departments", err));
  }, []);

  const [agreed, setAgreed] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name || e.target.id]: e.target.value,
    });
  };

  // Step 1: Validate Unique ID
  const handleValidateId = async () => {
    if (!formData.unique_id) {
      setError("Please enter your Unique ID.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await axios.post(
        (`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/auth/validate-id`),
        {
          unique_id: formData.unique_id,
        },
      );

      if (res.data.valid) {
        setFormData((prev) => ({
          ...prev,
          session_token: res.data.session_token,
        }));
        setStep(2);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Invalid Unique ID or Connection Error",
      );
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Register
  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirm_password) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      // Construct full name for backend (though backend stores user detail, request said full_name)
      // Actually backend User model has first_name / last_name, but Logic req says "full_name" is passed.
      // Based on my previously written Controller, it expects 'full_name' in body but stores in field 'full_name'?
      // Wait, User model has 'full_name', NOT first/last separate (I updated User model to have full_name)
      // BUT Register.jsx has First/Last inputs. I will combine them.

      const payload = {
        unique_id: formData.unique_id,
        session_token: formData.session_token,
        username: formData.username,
        email: formData.email,
        password: formData.password,
        full_name: `${formData.first_name} ${formData.last_name}`,
        dob: formData.dob,
        department_id: formData.department_id,
      };

      await axios.post((`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/auth/register`), payload);

      // Success
      // alert("Registration Successful! Please login.");
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Registration Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-4">
      <div className="w-full max-w-[600px] p-8 rounded-xl shadow-2xl border bg-white border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800 transition-colors duration-300">
        <div className="mb-6 text-center space-y-2">
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-white">
            Create your account
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400">
            {step === 1
              ? "Enter your Unique ID to start"
              : "Complete your registration details"}
          </p>
        </div>

        {error && (
          <div className="mb-6">
            <Alert variant="error" title="Error">
              {error}
            </Alert>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleRegister}>
          {/* Unique ID - Always Visible, Disabled in Step 2 */}
          <div className="space-y-1 relative group">
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 cursor-help">
                Unique ID
              </label>
              <CircleHelp className="w-4 h-4 text-zinc-400" />
            </div>
            {/* Tooltip code... */}
            <div className="flex gap-2">
              <input
                type="text"
                name="unique_id" // Important for handleChange
                id="unique_id"
                value={formData.unique_id}
                onChange={handleChange}
                disabled={step === 2}
                placeholder="e.g. CS-2024-001"
                className={`w-full px-3 py-2 text-sm bg-transparent border rounded-md outline-none border-zinc-300 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-zinc-700 dark:focus:ring-zinc-700 placeholder-zinc-400 font-medium transition-all ${
                  step === 2 ? "opacity-50 cursor-not-allowed" : ""
                }`}
              />

              {step === 1 && (
                <button
                  type="button"
                  onClick={handleValidateId}
                  disabled={loading || !formData.unique_id}
                  className="px-4 py-2 bg-zinc-900 text-white rounded-md font-bold hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-black"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Verify"
                  )}
                </button>
              )}
            </div>
          </div>

          {step === 2 && (
            <>
              {/* Username Field (Added) */}
              <div className="space-y-1">
                <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  id="username" // fallback
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="captain_code"
                  className="w-full px-3 py-2 text-sm bg-transparent border rounded-md outline-none border-zinc-300 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-zinc-700 dark:focus:ring-zinc-700 placeholder-zinc-400 font-medium transition-all"
                />
              </div>

              {/* Department Selection */}
              <div className="space-y-1">
                <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Department
                </label>
                <select
                  name="department_id"
                  value={formData.department_id}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm bg-transparent border rounded-md outline-none border-zinc-300 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-zinc-700 dark:focus:ring-zinc-700 placeholder-zinc-400 font-medium transition-all"
                >
                  <option
                    value=""
                    className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                  >
                    Select Department
                  </option>
                  {departments.map((dept) => (
                    <option
                      key={dept.id}
                      value={dept.id}
                      className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                    >
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* First/Last Name */}
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="w-full space-y-1">
                  <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    id="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    placeholder="John"
                    className="w-full px-3 py-2 text-sm bg-transparent border rounded-md outline-none border-zinc-300 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-zinc-700 dark:focus:ring-zinc-700 placeholder-zinc-400 font-medium transition-all"
                  />
                </div>
                <div className="w-full space-y-1">
                  <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    id="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    placeholder="Doe"
                    className="w-full px-3 py-2 text-sm bg-transparent border rounded-md outline-none border-zinc-300 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-zinc-700 dark:focus:ring-zinc-700 placeholder-zinc-400 font-medium transition-all"
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
                  name="email"
                  id="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="m@example.com"
                  className="w-full px-3 py-2 text-sm bg-transparent border rounded-md outline-none border-zinc-300 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-zinc-700 dark:focus:ring-zinc-700 placeholder-zinc-400 font-medium transition-all"
                />
              </div>

              {/* DOB */}
              <div className="space-y-1">
                <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="dob"
                  id="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm bg-transparent border rounded-md outline-none border-zinc-300 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-zinc-700 dark:focus:ring-zinc-700 placeholder-zinc-400 font-medium transition-all scheme-light dark:scheme-dark"
                />
              </div>

              {/* Passwords (Same as before) */}
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="w-full space-y-1">
                  <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    id="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm bg-transparent border rounded-md outline-none border-zinc-300 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-zinc-700 dark:focus:ring-zinc-700 transition-all"
                  />
                </div>
                <div className="w-full space-y-1">
                  <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    name="confirm_password"
                    id="confirm_password"
                    value={formData.confirm_password}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm bg-transparent border rounded-md outline-none border-zinc-300 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-zinc-700 dark:focus:ring-zinc-700 transition-all"
                  />
                </div>
              </div>

              {/* Terms & Submit */}
              <div className="flex justify-start items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:ring-zinc-700 accent-zinc-900 dark:accent-white"
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

              <button
                disabled={!agreed || loading}
                className={`w-full py-2 mt-2 text-sm font-bold text-white rounded-md transition-all ${
                  agreed
                    ? "bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-200 cursor-pointer"
                    : "bg-zinc-300 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-600 cursor-not-allowed"
                }`}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : (
                  "Create Account"
                )}
              </button>
            </>
          )}
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Already have an account?{" "}
            <Link
              to="/login"
              className="underline text-zinc-900 hover:text-zinc-600 dark:text-zinc-200 dark:hover:text-white transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

