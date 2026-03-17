// client/src/pages/student/Profile/Profile.jsx
import React, { useState, useEffect } from "react";
import api from "../../../services/api";
import { useAcademic } from "../../../context/AcademicContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Mail, Calendar, Key, Edit2, Save, X,
  Eye, EyeOff, Shield, GraduationCap, BookOpen, Loader2,
  AlertCircle, CheckCircle2
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-zinc-500 dark:text-zinc-400">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-zinc-900 dark:text-zinc-100" />
        <p className="text-sm font-medium">Loading profile data...</p>
      </div>
    );
  }

  // UI Component Classes
  const INPUT_CLS = "flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 transition-colors placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300";
  const OPTION_CLS = "bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100"; // Fixed: Explicit colors for native options
  const LABEL_CLS = "text-sm font-medium leading-none text-zinc-900 dark:text-zinc-100 peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-2 block";
  const CARD_CLS = "rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950 overflow-hidden";
  const BTN_PRIMARY_CLS = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 disabled:pointer-events-none disabled:opacity-50 bg-zinc-900 text-zinc-50 hover:bg-zinc-900/90 h-10 px-4 py-2 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-50/90";
  const BTN_OUTLINE_CLS = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 border border-zinc-200 bg-transparent hover:bg-zinc-100 hover:text-zinc-900 h-9 px-4 py-2 dark:border-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 w-full sm:w-auto";

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="max-w-5xl mx-auto space-y-6 sm:space-y-8 p-4 sm:p-6 lg:p-8"
    >
      {/* Header Section */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Profile Settings</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Manage your academic information and security preferences.</p>
      </div>

      {/* Alerts */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="flex items-center gap-3 bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 p-4 rounded-lg border border-red-200 dark:border-red-900/50 text-sm font-medium mb-4">
              <AlertCircle className="w-5 h-5 shrink-0" /> {error}
            </div>
          </motion.div>
        )}
        {success && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 p-4 rounded-lg border border-emerald-200 dark:border-emerald-900/50 text-sm font-medium mb-4">
              <CheckCircle2 className="w-5 h-5 shrink-0" /> {success}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-start">
        
        {/* Personal Details Card */}
        <div className={`lg:col-span-2 ${CARD_CLS}`}>
          {/* Fixed: flex-col on mobile, flex-row on larger screens */}
          <div className="p-4 sm:p-6 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-4 bg-zinc-50/50 dark:bg-zinc-900/50">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
                <User className="w-5 h-5 text-zinc-500 dark:text-zinc-400" /> Personal Information
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Update your personal details and academic status.</p>
            </div>
            <button 
              onClick={() => setIsEditing(!isEditing)} 
              className={BTN_OUTLINE_CLS}
            >
              {isEditing ? <><X className="w-4 h-4 mr-2" /> Cancel</> : <><Edit2 className="w-4 h-4 mr-2" /> Edit</>}
            </button>
          </div>

          <div className="p-4 sm:p-6">
            <AnimatePresence mode="wait">
              {isEditing ? (
                <motion.form 
                  key="edit"
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                  onSubmit={handleUpdateProfile} 
                  className="space-y-5"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className={LABEL_CLS}>Full Name</label>
                      <input type="text" value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} className={INPUT_CLS} required />
                    </div>
                    <div>
                      <label className={LABEL_CLS}>Date of Birth</label>
                      <input type="date" value={formData.dob} onChange={e => setFormData({ ...formData, dob: e.target.value })} className={INPUT_CLS} />
                    </div>
                  </div>

                  <div className="border-t border-zinc-200 dark:border-zinc-800 pt-5 mt-5">
                    <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-zinc-500" /> Academic Routing
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="sm:col-span-2">
                        <label className={LABEL_CLS}>Department</label>
                        <select value={formData.department_id} onChange={e => { setFormData({ ...formData, department_id: e.target.value, program_id: "", current_semester: "" }); }} className={INPUT_CLS}>
                          <option value="" className={OPTION_CLS}>— Select Department —</option>
                          {departments?.map(d => <option key={d.id} value={d.id} className={OPTION_CLS}>{d.name}</option>)}
                        </select>
                      </div>

                      {formData.department_id && (
                        <div>
                          <label className={LABEL_CLS}>Program</label>
                          {loadingPrograms ? (
                            <div className="flex h-10 items-center gap-2 text-sm text-zinc-500"><Loader2 className="w-4 h-4 animate-spin" /> Fetching programs...</div>
                          ) : (
                            <select value={formData.program_id} onChange={e => setFormData({ ...formData, program_id: e.target.value, current_semester: "" })} className={INPUT_CLS}>
                              <option value="" className={OPTION_CLS}>— Select Program —</option>
                              {programs?.map(p => <option key={p.id} value={p.id} className={OPTION_CLS}>{p.name} ({p.code})</option>)}
                            </select>
                          )}
                        </div>
                      )}

                      {formData.program_id && (
                        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}>
                          <label className={LABEL_CLS}>Current Semester</label>
                          <select value={formData.current_semester} onChange={e => setFormData({ ...formData, current_semester: e.target.value })} className={INPUT_CLS}>
                            <option value="" className={OPTION_CLS}>— Select Semester —</option>
                            {semOptions.map(s => <option key={s} value={s} className={OPTION_CLS}>Semester {s}</option>)}
                          </select>
                        </motion.div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button type="submit" className={`w-full sm:w-auto ${BTN_PRIMARY_CLS}`}>
                      <Save className="w-4 h-4 mr-2" /> Save Changes
                    </button>
                  </div>
                </motion.form>
              ) : (
                <motion.div 
                  key="view"
                  initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                  className="space-y-6"
                >
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                    <div className="space-y-1">
                      <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Full Name</dt>
                      <dd className="text-sm text-zinc-900 dark:text-zinc-100 font-medium">{profile?.full_name}</dd>
                    </div>
                    <div className="space-y-1">
                      <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> Email</dt>
                      <dd className="text-sm text-zinc-900 dark:text-zinc-100 font-medium break-all">{profile?.email}</dd>
                    </div>
                    <div className="space-y-1">
                      <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Date of Birth</dt>
                      <dd className="text-sm text-zinc-900 dark:text-zinc-100 font-medium">{profile?.dob ? new Date(profile.dob).toLocaleDateString() : "Not Set"}</dd>
                    </div>
                    <div className="sm:col-span-2 border-t border-zinc-200 dark:border-zinc-800 pt-6 mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                      <div className="space-y-1">
                        <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1"><GraduationCap className="w-3.5 h-3.5" /> Department</dt>
                        <dd className="text-sm text-zinc-900 dark:text-zinc-100 font-medium">{deptName || "Not Assigned"}</dd>
                      </div>
                      <div className="space-y-1">
                        <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> Program</dt>
                        <dd className="text-sm text-zinc-900 dark:text-zinc-100 font-medium">{programName || "Not Assigned"}</dd>
                      </div>
                      <div className="space-y-1">
                        <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Current Semester</dt>
                        <dd className="text-sm text-zinc-900 dark:text-zinc-100 font-medium">
                          {profile?.current_semester ? (
                            <span className="inline-flex items-center rounded-full border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2">
                              Semester {profile.current_semester}
                            </span>
                          ) : "Not Assigned"}
                        </dd>
                      </div>
                    </div>
                  </dl>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Security Card */}
        <div className={`space-y-6 ${CARD_CLS}`}>
          <div className="p-4 sm:p-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
              <Shield className="w-5 h-5 text-zinc-500 dark:text-zinc-400" /> Security
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Update your password to keep your account secure.</p>
          </div>
          
          <div className="p-4 sm:p-6">
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className={LABEL_CLS}>Current Password</label>
                <input type={showPassword ? "text" : "password"} value={passwordData.currentPassword}
                  onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })} className={INPUT_CLS} required />
              </div>
              <div>
                <label className={LABEL_CLS}>New Password</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} value={passwordData.newPassword}
                    onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })} className={INPUT_CLS} required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className={LABEL_CLS}>Confirm New Password</label>
                <input type={showPassword ? "text" : "password"} value={passwordData.confirmPassword}
                  onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} className={INPUT_CLS} required />
              </div>
              <div className="pt-2">
                <button type="submit" className={`w-full ${BTN_PRIMARY_CLS}`}>
                  <Key className="w-4 h-4 mr-2" /> Update Password
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </motion.div>
  );
}