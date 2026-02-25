import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CircleHelp, Loader2 } from "lucide-react";
import axios from "axios";
import Alert from "../../../components/ui/Alert";

export default function TeacherRegister() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: ID Validation, 2: Full Form
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    unique_id: "",
    session_token: "",
    first_name: "",
    last_name: "",
    email: "",
    dob: "",
    password: "",
    confirm_password: "",
    username: "",
  });

  const [boundData, setBoundData] = useState(null); // Stores admin provided name/email
  const [agreed, setAgreed] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name || e.target.id]: e.target.value,
    });
  };

  const handleValidateId = async () => {
    if (!formData.unique_id) {
      setError("Please enter your Teacher ID.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await axios.post(
        (`${process.env.REACT_APP_API_URL || "http://10.201.249.129:5000"}/api/auth/validate-id`),
        {
          unique_id: formData.unique_id,
        },
      );

      if (res.data.valid) {
        if (res.data.role !== 2 && res.data.role !== "teacher") {
          setError("This ID is not authorized for Teacher registration.");
          setLoading(false);
          return;
        }

        setFormData((prev) => ({
          ...prev,
          session_token: res.data.session_token,
        }));

        // Handle Bound Data if present
        if (res.data.bound_data) {
          setBoundData(res.data.bound_data);

          // Attempt to split name
          const fullName = res.data.bound_data.name || "";
          const lastSpaceIndex = fullName.lastIndexOf(" ");
          let firstName = fullName;
          let lastName = "";

          if (lastSpaceIndex > 0) {
            firstName = fullName.substring(0, lastSpaceIndex);
            lastName = fullName.substring(lastSpaceIndex + 1);
          }

          setFormData((prev) => ({
            ...prev,
            first_name: firstName,
            last_name: lastName,
            email: res.data.bound_data.email || "",
          }));
        }

        setStep(2);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Invalid ID or Connection Error",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirm_password) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        unique_id: formData.unique_id,
        session_token: formData.session_token,
        username: formData.username,
        email: formData.email,
        password: formData.password,
        full_name: `${formData.first_name} ${formData.last_name}`,
        dob: formData.dob,
      };

      await axios.post((`${process.env.REACT_APP_API_URL || "http://10.201.249.129:5000"}/api/auth/register`), payload);
      navigate("/teacher-login");
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Registration Failed",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-4">
      <div className="w-full max-w-[600px] p-8 rounded-xl shadow-2xl border bg-white border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800 transition-colors duration-300">
        <div className="mb-6 text-center space-y-2">
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-white">
            Teacher Registration
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400">
            {step === 1
              ? "Enter your Teacher ID to verify eligibility"
              : "Complete your account setup"}
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
          {/* Unique ID */}
          <div className="space-y-1 relative group">
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 cursor-help">
                Teacher ID
              </label>
              <CircleHelp className="w-4 h-4 text-zinc-400" />
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                name="unique_id"
                value={formData.unique_id}
                onChange={handleChange}
                disabled={step === 2}
                placeholder="e.g. TCH-2024-XXXX"
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
              {boundData && (
                <div className="p-3 mb-2 text-xs rounded bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 border border-blue-200 dark:border-blue-800">
                  <strong>Note:</strong> Your Name and Email have been
                  pre-filled based on your Teacher ID. They cannot be changed.
                </div>
              )}

              {/* Username Field */}
              <div className="space-y-1">
                <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="prof_smith"
                  className="w-full px-3 py-2 text-sm bg-transparent border rounded-md outline-none border-zinc-300 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-zinc-700 dark:focus:ring-zinc-700 placeholder-zinc-400 font-medium transition-all"
                />
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
                    value={formData.first_name}
                    onChange={handleChange}
                    disabled={!!boundData?.name}
                    className={`w-full px-3 py-2 text-sm bg-transparent border rounded-md outline-none border-zinc-300 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-zinc-700 dark:focus:ring-zinc-700 placeholder-zinc-400 font-medium transition-all ${
                      boundData?.name
                        ? "opacity-60 cursor-not-allowed bg-zinc-100 dark:bg-zinc-900"
                        : ""
                    }`}
                  />
                </div>
                <div className="w-full space-y-1">
                  <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    disabled={!!boundData?.name}
                    className={`w-full px-3 py-2 text-sm bg-transparent border rounded-md outline-none border-zinc-300 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-zinc-700 dark:focus:ring-zinc-700 placeholder-zinc-400 font-medium transition-all ${
                      boundData?.name
                        ? "opacity-60 cursor-not-allowed bg-zinc-100 dark:bg-zinc-900"
                        : ""
                    }`}
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
                  value={formData.email}
                  onChange={handleChange}
                  disabled={!!boundData?.email}
                  className={`w-full px-3 py-2 text-sm bg-transparent border rounded-md outline-none border-zinc-300 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-zinc-700 dark:focus:ring-zinc-700 placeholder-zinc-400 font-medium transition-all ${
                    boundData?.email
                      ? "opacity-60 cursor-not-allowed bg-zinc-100 dark:bg-zinc-900"
                      : ""
                  }`}
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
                  value={formData.dob}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm bg-transparent border rounded-md outline-none border-zinc-300 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-zinc-700 dark:focus:ring-zinc-700 placeholder-zinc-400 font-medium transition-all scheme-light dark:scheme-dark"
                />
              </div>

              {/* Passwords */}
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="w-full space-y-1">
                  <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
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
                  I agree to the Terms of Service.
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
                  "Create Teacher Account"
                )}
              </button>
            </>
          )}
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Already have an account?{" "}
            <Link
              to="/teacher-login"
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

