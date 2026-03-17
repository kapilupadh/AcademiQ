// src/pages/Register.jsx
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CircleHelp, Loader2 } from "lucide-react";
import api from "../../../services/api";
import Alert from "../../../components/ui/Alert";
import { useAcademic } from "../../../context/AcademicContext";

const INPUT_CLS = "w-full px-3 py-2 text-sm bg-transparent border rounded-md outline-none border-zinc-300 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-zinc-700 dark:focus:ring-zinc-700 placeholder-zinc-400 font-medium transition-all";
const LABEL_CLS = "text-sm font-semibold text-zinc-900 dark:text-zinc-100";

export default function Register() {
  const navigate = useNavigate();
  const { departments, getProgramsForDept } = useAcademic();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [agreed, setAgreed] = useState(false);

  const [programs, setPrograms] = useState([]);
  const [loadingPrograms, setLoadingPrograms] = useState(false);

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
    department_id: "",
    program_id: "",
    current_semester: "",
  });

  // When department changes, load its programs
  useEffect(() => {
    if (!formData.department_id) {
      setPrograms([]);
      setFormData(prev => ({ ...prev, program_id: "", current_semester: "" }));
      return;
    }
    setLoadingPrograms(true);
    getProgramsForDept(formData.department_id)
      .then(data => setPrograms(data))
      .finally(() => setLoadingPrograms(false));
  }, [formData.department_id]);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name || e.target.id]: e.target.value }));
  };

  // Derive semester options from selected program duration
  const selectedProgram = programs.find(p => p.id === formData.program_id);
  const maxSemester = selectedProgram ? selectedProgram.duration_years * 2 : 8;
  const semesterOptions = Array.from({ length: maxSemester }, (_, i) => i + 1);

  // Step 1: Validate Unique ID
  const handleValidateId = async () => {
    if (!formData.unique_id) { setError("Please enter your Unique ID."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await api.post(`/auth/validate-id`, { unique_id: formData.unique_id });
      if (res.data.valid) {
        setFormData(prev => ({ ...prev, session_token: res.data.session_token }));
        setStep(2);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid Unique ID or Connection Error");
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
    if (!formData.department_id) {
      setError("Please select a department.");
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
        full_name: `${formData.first_name} ${formData.last_name}`.trim(),
        dob: formData.dob,
        department_id: formData.department_id,
        program_id: formData.program_id || null,
        current_semester: formData.current_semester ? parseInt(formData.current_semester) : null,
      };

      await api.post(`/auth/register`, payload);
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
            {step === 1 ? "Enter your Unique ID to start" : "Complete your registration details"}
          </p>
        </div>

        {error && (
          <div className="mb-6">
            <Alert variant="error" title="Error">{error}</Alert>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleRegister}>
          {/* Unique ID */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <label className={LABEL_CLS}>Unique ID</label>
              <CircleHelp className="w-4 h-4 text-zinc-400" />
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                name="unique_id"
                value={formData.unique_id}
                onChange={handleChange}
                disabled={step === 2}
                placeholder="e.g. STD-2025-1234"
                className={`${INPUT_CLS} ${step === 2 ? "opacity-50 cursor-not-allowed" : ""}`}
              />
              {step === 1 && (
                <button
                  type="button"
                  onClick={handleValidateId}
                  disabled={loading || !formData.unique_id}
                  className="px-4 py-2 bg-zinc-900 text-white rounded-md font-bold hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-black"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify"}
                </button>
              )}
            </div>
          </div>

          {step === 2 && (
            <>
              {/* Username */}
              <div className="space-y-1">
                <label className={LABEL_CLS}>Username</label>
                <input type="text" name="username" value={formData.username}
                  onChange={handleChange} placeholder="captain_code" className={INPUT_CLS} />
              </div>

              {/* Department */}
              <div className="space-y-1">
                <label className={LABEL_CLS}>
                  Department <span className="text-red-500">*</span>
                </label>
                <select name="department_id" value={formData.department_id}
                  onChange={handleChange} className={INPUT_CLS}>
                  <option value="">— Select Department —</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              {/* Program — shown after dept selected */}
              {formData.department_id && (
                <div className="space-y-1">
                  <label className={LABEL_CLS}>Program</label>
                  {loadingPrograms ? (
                    <div className="flex items-center gap-2 text-sm text-zinc-400 py-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Loading programs…
                    </div>
                  ) : programs.length === 0 ? (
                    <p className="text-xs text-zinc-400 py-2">No programs found for this department.</p>
                  ) : (
                    <select name="program_id" value={formData.program_id}
                      onChange={handleChange} className={INPUT_CLS}>
                      <option value="">— Select Program —</option>
                      {programs.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Semester — shown after program selected */}
              {formData.program_id && (
                <div className="space-y-1">
                  <label className={LABEL_CLS}>Current Semester</label>
                  <select name="current_semester" value={formData.current_semester}
                    onChange={handleChange} className={INPUT_CLS}>
                    <option value="">— Select Semester —</option>
                    {semesterOptions.map(s => (
                      <option key={s} value={s}>Semester {s}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* First / Last Name */}
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="w-full space-y-1">
                  <label className={LABEL_CLS}>First Name</label>
                  <input type="text" name="first_name" value={formData.first_name}
                    onChange={handleChange} placeholder="John" className={INPUT_CLS} />
                </div>
                <div className="w-full space-y-1">
                  <label className={LABEL_CLS}>Last Name</label>
                  <input type="text" name="last_name" value={formData.last_name}
                    onChange={handleChange} placeholder="Doe" className={INPUT_CLS} />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className={LABEL_CLS}>Email</label>
                <input type="email" name="email" value={formData.email}
                  onChange={handleChange} placeholder="m@example.com" className={INPUT_CLS} />
              </div>

              {/* DOB */}
              <div className="space-y-1">
                <label className={LABEL_CLS}>Date of Birth</label>
                <input type="date" name="dob" value={formData.dob}
                  onChange={handleChange} className={`${INPUT_CLS} scheme-light dark:scheme-dark`} />
              </div>

              {/* Passwords */}
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="w-full space-y-1">
                  <label className={LABEL_CLS}>Password</label>
                  <input type="password" name="password" value={formData.password}
                    onChange={handleChange} className={INPUT_CLS} />
                </div>
                <div className="w-full space-y-1">
                  <label className={LABEL_CLS}>Confirm Password</label>
                  <input type="password" name="confirm_password" value={formData.confirm_password}
                    onChange={handleChange} className={INPUT_CLS} />
                </div>
              </div>

              {/* Terms */}
              <div className="flex justify-start items-center gap-2 pt-2">
                <input type="checkbox" id="terms" checked={agreed}
                  onChange={e => setAgreed(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-zinc-300 accent-zinc-900 dark:accent-white" />
                <label htmlFor="terms" className="text-sm text-zinc-500 dark:text-zinc-400 leading-none">
                  I agree to the{" "}
                  <Link to="/terms" className="underline hover:text-zinc-800 dark:hover:text-zinc-200">Terms of Service</Link>
                  {" "}and{" "}
                  <Link to="/privacy" className="underline hover:text-zinc-800 dark:hover:text-zinc-200">Privacy Policy</Link>.
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
                {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Create Account"}
              </button>
            </>
          )}
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Already have an account?{" "}
            <Link to="/login" className="underline text-zinc-900 hover:text-zinc-600 dark:text-zinc-200 dark:hover:text-white transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}