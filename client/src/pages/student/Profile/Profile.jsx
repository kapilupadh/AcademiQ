// client/src/pages/student/Profile/Profile.jsx
import React, { useState, useEffect } from "react";
import api from "../../../services/api";
import { useAcademic } from "../../../context/AcademicContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Mail, Calendar, Key, Edit2, Save, X,
  Eye, EyeOff, Shield, GraduationCap, BookOpen, Loader2,
  AlertCircle, CheckCircle2, UserCircle2,
} from "lucide-react";

export default function Profile() {
  const { departments, getProgramsForDept } = useAcademic();

  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Academic data for dropdowns
  const [programs, setPrograms] = useState([]);
  const [loadingPrograms, setLoadingPrograms] = useState(false);

  const [formData, setFormData] = useState({
    full_name: "",
    dob: "",
    current_semester: "",
    program_id: "",
    department_id: "",
  });

  const [passwordData, setPasswordData] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => { fetchProfile(); }, []);

  // When dept changes in edit mode, load programs
  useEffect(() => {
    if (!formData.department_id || !isEditing) return;
    setLoadingPrograms(true);
    getProgramsForDept(formData.department_id)
      .then(data => setPrograms(data))
      .finally(() => setLoadingPrograms(false));
  }, [formData.department_id, isEditing]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) { setError("No authentication token. Please login again."); return; }
      const res = await api.get(`/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
      setProfile(res.data);
      setFormData({
        full_name: res.data.full_name || "",
        dob: res.data.dob ? new Date(res.data.dob).toISOString().split("T")[0] : "",
        current_semester: res.data.current_semester || "",
        program_id: res.data.program_id || "",
        department_id: res.data.department_id || "",
      });
    } catch (err) {
      setError("Failed to load profile.");
    } finally {
      setLoading(false);
    }
  };

  // Load programs for the current profile dept on initial load
  useEffect(() => {
    if (profile?.department_id) {
      getProgramsForDept(profile.department_id).then(data => setPrograms(data));
    }
  }, [profile?.department_id]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    try {
      const token = localStorage.getItem("token");
      const res = await api.put(`/auth/me`, {
        full_name: formData.full_name,
        dob: formData.dob,
        current_semester: formData.current_semester ? parseInt(formData.current_semester) : null,
        program_id: formData.program_id || null,
        department_id: formData.department_id || null,
      }, { headers: { Authorization: `Bearer ${token}` } });

      setProfile(res.data.user);
      setIsEditing(false);
      setSuccess("Profile updated successfully!");

      const localUser = JSON.parse(localStorage.getItem("user"));
      if (localUser) { localUser.full_name = formData.full_name; localStorage.setItem("user", JSON.stringify(localUser)); }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (passwordData.newPassword !== passwordData.confirmPassword) { setError("New passwords do not match."); return; }
    try {
      const token = localStorage.getItem("token");
      await api.post(`/auth/change-password`, { currentPassword: passwordData.currentPassword, newPassword: passwordData.newPassword }, { headers: { Authorization: `Bearer ${token}` } });
      setSuccess("Password changed successfully!");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to change password");
    }
  };

  // Helpers for display
  const deptName = departments?.find(d => d.id === profile?.department_id)?.name;
  const programName = programs?.find(p => p.id === profile?.program_id)?.name;
  const selectedProgram = programs?.find(p => p.id === formData.program_id);
  const maxSem = selectedProgram ? selectedProgram.duration_years * 2 : 8;
  const semOptions = Array.from({ length: maxSem }, (_, i) => i + 1);

  // Derive initials for avatar
  const initials = profile?.full_name
    ? profile.full_name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-zinc-100 dark:bg-zinc-900 rounded-md animate-pulse" />
          <div className="h-4 w-80 bg-zinc-100 dark:bg-zinc-900 rounded-md animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl animate-pulse" />
          <div className="h-96 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  // ── UI Component Classes ──────────────────────────────────────────────────
  const INPUT_CLS = "flex h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 transition-colors placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:border-zinc-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus-visible:ring-zinc-300 dark:focus-visible:border-zinc-300";
  const OPTION_CLS = "bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100";
  const LABEL_CLS = "text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5 block";
  const CARD_CLS = "rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden";
  const BTN_PRIMARY_CLS = "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 disabled:pointer-events-none disabled:opacity-50 bg-zinc-900 text-zinc-50 hover:bg-zinc-800 h-10 px-4 py-2 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white";
  const BTN_OUTLINE_CLS = "inline-flex items-center justify-center rounded-lg text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 h-8 px-3 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-300";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="max-w-6xl mx-auto p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5 tracking-tight">
            <span className="w-8 h-8 rounded-lg bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center">
              <UserCircle2 className="w-4 h-4 text-white dark:text-zinc-900" />
            </span>
            Profile Settings
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1.5 text-sm">
            Manage your academic information and security preferences.
          </p>
        </div>
      </div>

      <div className="h-px bg-zinc-200 dark:bg-zinc-800" />

      {/* Alerts */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-start gap-2 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 p-3 rounded-lg border border-red-200 dark:border-red-900/60 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
            </div>
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-start gap-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 p-3 rounded-lg border border-emerald-200 dark:border-emerald-900/60 text-sm">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> {success}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* Personal Details Card */}
        <div className={`lg:col-span-2 ${CARD_CLS}`}>
          {/* Card Header */}
          <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2.5">
              <User className="w-4 h-4 text-zinc-500 dark:text-zinc-500" />
              <div>
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">Personal Information</h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-0.5">Your personal details and academic status</p>
              </div>
            </div>
            <button onClick={() => setIsEditing(!isEditing)} className={BTN_OUTLINE_CLS}>
              {isEditing ? <><X className="w-3.5 h-3.5 mr-1.5" /> Cancel</> : <><Edit2 className="w-3.5 h-3.5 mr-1.5" /> Edit</>}
            </button>
          </div>

          {/* Identity Banner (view mode only) */}
          {!isEditing && profile && (
            <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/40 flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center shrink-0">
                <span className="text-base font-semibold text-white dark:text-zinc-900 tracking-tight">{initials}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">{profile.full_name}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-500 flex items-center gap-1.5 mt-0.5 truncate">
                  <Mail className="w-3 h-3 shrink-0" />
                  <span className="truncate">{profile.email}</span>
                </p>
              </div>
              {profile.current_semester && (
                <span className="hidden sm:inline-flex items-center gap-1 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1 text-[11px] font-medium text-zinc-700 dark:text-zinc-300 shrink-0">
                  <GraduationCap className="w-3 h-3" />
                  Semester {profile.current_semester}
                </span>
              )}
            </div>
          )}

          <div className="p-5">
            <AnimatePresence mode="wait">
              {isEditing ? (
                <motion.form
                  key="edit"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  onSubmit={handleUpdateProfile}
                  className="space-y-5"
                >
                  {/* Section: Personal */}
                  <div>
                    <h3 className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-500 mb-3">
                      Personal Details
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={LABEL_CLS}>Full Name</label>
                        <input
                          type="text"
                          value={formData.full_name}
                          onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                          className={INPUT_CLS}
                          required
                        />
                      </div>
                      <div>
                        <label className={LABEL_CLS}>Date of Birth</label>
                        <input
                          type="date"
                          value={formData.dob}
                          onChange={e => setFormData({ ...formData, dob: e.target.value })}
                          className={INPUT_CLS}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section: Academic */}
                  <div className="border-t border-zinc-200 dark:border-zinc-800 pt-5">
                    <h3 className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-500 mb-3 flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5" /> Academic Routing
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className={LABEL_CLS}>Department</label>
                        <select
                          value={formData.department_id}
                          onChange={e => setFormData({ ...formData, department_id: e.target.value, program_id: "", current_semester: "" })}
                          className={INPUT_CLS}
                        >
                          <option value="" className={OPTION_CLS}>— Select Department —</option>
                          {departments?.map(d => <option key={d.id} value={d.id} className={OPTION_CLS}>{d.name}</option>)}
                        </select>
                      </div>

                      {formData.department_id && (
                        <div>
                          <label className={LABEL_CLS}>Program</label>
                          {loadingPrograms ? (
                            <div className="flex h-10 items-center gap-2 text-xs text-zinc-500 dark:text-zinc-500 px-3 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-950">
                              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Fetching programs...
                            </div>
                          ) : (
                            <select
                              value={formData.program_id}
                              onChange={e => setFormData({ ...formData, program_id: e.target.value, current_semester: "" })}
                              className={INPUT_CLS}
                            >
                              <option value="" className={OPTION_CLS}>— Select Program —</option>
                              {programs?.map(p => <option key={p.id} value={p.id} className={OPTION_CLS}>{p.name} ({p.code})</option>)}
                            </select>
                          )}
                        </div>
                      )}

                      {formData.program_id && (
                        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
                          <label className={LABEL_CLS}>Current Semester</label>
                          <select
                            value={formData.current_semester}
                            onChange={e => setFormData({ ...formData, current_semester: e.target.value })}
                            className={INPUT_CLS}
                          >
                            <option value="" className={OPTION_CLS}>— Select Semester —</option>
                            {semOptions.map(s => <option key={s} value={s} className={OPTION_CLS}>Semester {s}</option>)}
                          </select>
                        </motion.div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className={BTN_OUTLINE_CLS + " h-10 px-4"}
                    >
                      Cancel
                    </button>
                    <button type="submit" className={BTN_PRIMARY_CLS}>
                      <Save className="w-4 h-4 mr-1.5" /> Save Changes
                    </button>
                  </div>
                </motion.form>
              ) : (
                <motion.div
                  key="view"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-6"
                >
                  {/* Personal Details */}
                  <div>
                    <h3 className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-500 mb-3">
                      Personal Details
                    </h3>
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
                      <InfoRow
                        icon={User}
                        label="Full Name"
                        value={profile?.full_name}
                      />
                      <InfoRow
                        icon={Mail}
                        label="Email"
                        value={profile?.email}
                        className="break-all"
                      />
                      <InfoRow
                        icon={Calendar}
                        label="Date of Birth"
                        value={profile?.dob ? new Date(profile.dob).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Not set"}
                      />
                    </dl>
                  </div>

                  {/* Academic Details */}
                  <div className="border-t border-zinc-200 dark:border-zinc-800 pt-5">
                    <h3 className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-500 mb-3 flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5" /> Academic Routing
                    </h3>
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
                      <InfoRow
                        icon={GraduationCap}
                        label="Department"
                        value={deptName || "Not assigned"}
                        muted={!deptName}
                      />
                      <InfoRow
                        icon={BookOpen}
                        label="Program"
                        value={programName || "Not assigned"}
                        muted={!programName}
                      />
                      <div className="space-y-1">
                        <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-500 flex items-center gap-1.5">
                          <Calendar className="w-3 h-3" /> Current Semester
                        </dt>
                        <dd>
                          {profile?.current_semester ? (
                            <span className="inline-flex items-center gap-1 rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                              Semester {profile.current_semester}
                            </span>
                          ) : (
                            <span className="text-sm text-zinc-400 dark:text-zinc-600">Not assigned</span>
                          )}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Security Card */}
        <div className={CARD_CLS}>
          <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2.5">
              <Shield className="w-4 h-4 text-zinc-500 dark:text-zinc-500" />
              <div>
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">Security</h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-0.5">Update your password</p>
              </div>
            </div>
          </div>

          <div className="p-5">
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className={LABEL_CLS}>Current Password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={passwordData.currentPassword}
                  onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className={INPUT_CLS}
                  required
                />
              </div>
              <div>
                <label className={LABEL_CLS}>New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className={INPUT_CLS + " pr-10"}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-zinc-500 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className={LABEL_CLS}>Confirm New Password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={passwordData.confirmPassword}
                  onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className={INPUT_CLS}
                  required
                />
              </div>

              {/* Password hint */}
              <div className="text-[11px] text-zinc-500 dark:text-zinc-500 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 leading-relaxed">
                Use at least 8 characters with a mix of letters, numbers and symbols.
              </div>

              <button type="submit" className={`w-full ${BTN_PRIMARY_CLS}`}>
                <Key className="w-4 h-4 mr-1.5" /> Update Password
              </button>
            </form>
          </div>
        </div>

      </div>
    </motion.div>
  );
}

// ── Info Row (view mode) ────────────────────────────────────────────────────
function InfoRow({ icon: Icon, label, value, muted = false, className = "" }) {
  return (
    <div className="space-y-1">
      <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-500 flex items-center gap-1.5">
        {Icon && <Icon className="w-3 h-3" />} {label}
      </dt>
      <dd className={`text-sm font-medium ${muted ? "text-zinc-400 dark:text-zinc-600" : "text-zinc-900 dark:text-zinc-100"} ${className}`}>
        {value}
      </dd>
    </div>
  );
}
