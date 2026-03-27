// client/src/pages/student/Attendance/StudentAttendancePage.jsx
import React, { useState, useEffect, useCallback } from "react";
import api from "../../../services/api";
import {
  CheckCircle2, XCircle, Clock, MapPin, Hash, QrCode,
  Loader, AlertTriangle, BookOpen, BarChart2,
  ChevronRight, ChevronDown, RefreshCw, ArrowLeft,
} from "lucide-react";

// Import our new attendance components
import { OTPVerification, ImageUpload, LocationValidator, AttendanceCard } from "../../../components/attendance";

// ── Helpers ───────────────────────────────────────────────────────────────────
const pctColor = (p) => p >= 75 ? "text-emerald-600 dark:text-emerald-400" : p >= 50 ? "text-amber-600 dark:text-amber-400" : "text-red-500";
const pctBg   = (p) => p >= 75 ? "bg-emerald-500" : p >= 50 ? "bg-amber-500" : "bg-red-500";
const fmt     = (d) => d ? new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";

// ── Step Indicator ───────────────────────────────────────────────────────────
function StepIndicator({ currentStep, steps }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        const isPending = index > currentStep;

        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isCompleted
                    ? "bg-emerald-500 text-white"
                    : isCurrent
                    ? "bg-teal-600 text-white ring-4 ring-teal-100 dark:ring-teal-900/50"
                    : "bg-zinc-200 dark:bg-zinc-700 text-zinc-400"
                }`}
              >
                {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : index + 1}
              </div>
              <span
                className={`text-xs mt-1 ${
                  isCurrent
                    ? "text-teal-600 dark:text-teal-400 font-semibold"
                    : isPending
                    ? "text-zinc-400"
                    : "text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`w-8 h-0.5 mb-5 ${
                  isCompleted ? "bg-emerald-500" : "bg-zinc-200 dark:bg-zinc-700"
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Mark Attendance Modal (Step-by-Step Flow) ──────────────────────────────
function MarkAttendanceModal({ session, onSuccess, onClose }) {
  // Step management
  // 1: OTP/QR verification
  // 2: Image upload (REQUIRED)
  // 3: Location validation
  // 4: Review & Submit
  const [currentStep, setCurrentStep] = useState(1);
  
  // Data collected from each step
  const [otpCode, setOtpCode] = useState("");
  const [capturedImage, setCapturedImage] = useState(null);
  const [locationData, setLocationData] = useState(null);
  
  // UI states
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const steps = [
    { id: 1, label: "OTP/QR" },
    { id: 2, label: "Photo" },
    { id: 3, label: "Location" },
    { id: 4, label: "Submit" },
  ];

  // Handle OTP verification
  const handleOTPVerified = (code) => {
    setOtpCode(code);
    setError("");
    setCurrentStep(2);
  };

  // Handle image captured
  const handleImageCaptured = (imageData) => {
    setCapturedImage(imageData);
    setError("");
    setCurrentStep(3);
  };

  // Handle location validated
  const handleLocationValidated = (location) => {
    setLocationData(location);
    setError("");
    
    if (location.isValid) {
      setCurrentStep(4);
    } else {
      setError(`You are ${Math.round(location.distance)}m away from the classroom. Please move closer and try again.`);
    }
  };

  // Final submission
  const handleSubmit = async () => {
    if (!otpCode) {
      setError("OTP code is required");
      return;
    }
    if (!capturedImage) {
      setError("Photo is required to complete attendance");
      return;
    }
    if (!locationData?.isValid) {
      setError("Valid location is required to complete attendance");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      // Create form data for file upload
      const formData = new FormData();
      formData.append("session_id", session.id);
      formData.append("code", otpCode);
      formData.append("latitude", locationData.latitude);
      formData.append("longitude", locationData.longitude);
      formData.append("image", capturedImage.file);

      const res = await api.post("/attendance/submit", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setSubmitSuccess(true);
      setTimeout(() => {
        onSuccess(res.data);
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit attendance. Please try again.");
      setSubmitting(false);
    }
  };

  // Go back to previous step
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError("");
    }
  };

  // Reset step to retake (e.g., retake photo)
  const handleResetStep = (step) => {
    setCurrentStep(step);
    setError("");
  };

  // Success State
  if (submitSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-md shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden p-8 text-center">
          <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </div>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
            Attendance Marked!
          </h3>
          <p className="text-zinc-500 mb-4">
            Your attendance for <span className="font-semibold">{session.subject?.name}</span> has been recorded successfully.
          </p>
          <Loader className="w-6 h-6 mx-auto text-teal-500 animate-spin" />
          <p className="text-xs text-zinc-400 mt-2">Closing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-md shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            {currentStep > 1 && !submitSuccess && (
              <button
                onClick={handleBack}
                className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                {session.subject?.name}
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  session.mode === "OTP"
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                    : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                }`}>
                  {session.mode === "OTP" ? <Hash className="w-3 h-3" /> : <QrCode className="w-3 h-3" />}
                  {session.mode}
                </span>
              </h3>
              <p className="text-xs text-zinc-500">{fmt(session.class_start_time)} — {fmt(session.class_end_time)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          {/* Step Indicator */}
          <StepIndicator currentStep={currentStep} steps={steps} />

          {/* Step Content */}
          <div className="min-h-[280px]">
            {/* Step 1: OTP Verification */}
            {currentStep === 1 && (
              <OTPVerification
                mode={session.mode}
                otpDigits={session.otp_digits}
                onVerified={handleOTPVerified}
                onCancel={onClose}
              />
            )}

            {/* Step 2: Image Upload (REQUIRED) */}
            {currentStep === 2 && (
              <ImageUpload
                onImageCaptured={handleImageCaptured}
                onCancel={handleBack}
                required={true}
              />
            )}

            {/* Step 3: Location Validation */}
            {currentStep === 3 && (
              <LocationValidator
                allowedLocation={session.allowed_location}
                onLocationValidated={handleLocationValidated}
                onCancel={handleBack}
              />
            )}

            {/* Step 4: Review & Submit */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-zinc-900 dark:text-white">Review & Submit</h3>
                    <p className="text-xs text-zinc-500">Confirm your details before submitting</p>
                  </div>
                </div>

                {/* Summary */}
                <div className="space-y-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4">
                  {/* OTP Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                      {session.mode === "OTP" ? <Hash className="w-4 h-4" /> : <QrCode className="w-4 h-4" />}
                      {session.mode === "OTP" ? "OTP Code" : "QR Code"}
                    </div>
                    <button
                      onClick={() => handleResetStep(1)}
                      className="text-xs text-teal-600 hover:text-teal-700 dark:text-teal-400"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      Entered
                    </div>
                    <span className="font-mono text-sm">{otpCode}</span>
                  </div>

                  <div className="border-t border-zinc-200 dark:border-zinc-700" />

                  {/* Photo Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                      Photo Verification
                    </div>
                    <button
                      onClick={() => handleResetStep(2)}
                      className="text-xs text-teal-600 hover:text-teal-700 dark:text-teal-400"
                    >
                      Retake
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    {capturedImage && (
                      <img
                        src={capturedImage.dataUrl}
                        alt="Captured"
                        className="w-16 h-16 object-cover rounded-lg border border-zinc-200 dark:border-zinc-700"
                      />
                    )}
                    <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      Photo captured
                    </div>
                  </div>

                  <div className="border-t border-zinc-200 dark:border-zinc-700" />

                  {/* Location Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                      <MapPin className="w-4 h-4" />
                      Location
                    </div>
                    <button
                      onClick={() => handleResetStep(3)}
                      className="text-xs text-teal-600 hover:text-teal-700 dark:text-teal-400"
                    >
                      Refresh
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {locationData?.isValid ? (
                      <>
                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
                          <CheckCircle2 className="w-4 h-4" />
                          Verified
                        </div>
                        {locationData.distance !== null && (
                          <span className="text-zinc-500">
                            ({Math.round(locationData.distance)}m from classroom)
                          </span>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center gap-2 text-red-500">
                        <AlertTriangle className="w-4 h-4" />
                        Not verified
                      </div>
                    )}
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl p-3">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 disabled:bg-zinc-300 dark:disabled:bg-zinc-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Confirm & Submit Attendance
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Check-in Panel ────────────────────────────────────────────────────────────
function CheckInPanel() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeModal, setActiveModal] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/attendance/active-sessions");
      setSessions(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load sessions.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const id = setInterval(fetchSessions, 30000);
    return () => clearInterval(id);
  }, [fetchSessions]);

  const handleSuccess = (data) => {
    setActiveModal(null);
    setSuccessMsg(data.message || "Attendance marked successfully!");
    fetchSessions();
    setTimeout(() => setSuccessMsg(""), 5000);
  };



  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Active Classes</h2>
          <p className="text-sm text-zinc-500">Your current attendance sessions.</p>
        </div>
        <button
          onClick={fetchSessions}
          disabled={loading}
          className="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 text-emerald-600 dark:text-emerald-400 text-sm font-semibold animate-pulse">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          {successMsg}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl p-3">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 text-zinc-400 py-12">
          <Loader className="w-5 h-5 animate-spin" />
          Looking for active sessions…
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-16 space-y-3 text-zinc-400">
          <Clock className="w-12 h-12 mx-auto opacity-20" />
          <p className="font-medium text-zinc-500">No active sessions right now</p>
          <p className="text-sm">Sessions appear here when your teacher activates attendance during class hours.</p>
          <button
            onClick={fetchSessions}
            className="mt-2 text-sm text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 mx-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => (
            <AttendanceCard key={s.id} session={s} onMark={setActiveModal} />
          ))}
        </div>
      )}

      {activeModal && (
        <MarkAttendanceModal
          session={activeModal}
          onSuccess={handleSuccess}
          onClose={() => setActiveModal(null)}
        />
      )}
    </div>
  );
}

// ── Attendance History ────────────────────────────────────────────────────────
function AttendanceHistory() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    api.get("/attendance/my")
      .then((r) => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="flex items-center gap-2 text-zinc-400 py-8 justify-center">
        <Loader className="w-5 h-5 animate-spin" />
        Loading…
      </div>
    );
  if (!data?.subjects?.length)
    return (
      <div className="text-center py-12 text-zinc-400 space-y-2">
        <BarChart2 className="w-10 h-10 mx-auto opacity-20" />
        <p className="text-sm">No attendance records yet.</p>
      </div>
    );

  return (
    <div className="space-y-3">
      {/* Overall stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Subjects", value: data.subjects.length, color: "text-blue-600 dark:text-blue-400" },
          { label: "Total Classes", value: data.total_records, color: "text-zinc-700 dark:text-zinc-300" },
          {
            label: "Avg Attendance",
            value: `${Math.round(data.subjects.reduce((s, x) => s + x.percentage, 0) / (data.subjects.length || 1))}%`,
            color: "text-teal-600 dark:text-teal-400",
          },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-3 text-center">
            <p className={`text-xl font-black ${color}`}>{value}</p>
            <p className="text-xs text-zinc-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Per-subject breakdown */}
      {data.subjects.map((s) => (
        <div
          key={s.subject_id}
          className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden"
        >
          <button
            onClick={() => setExpanded((prev) => ({ ...prev, [s.subject_id]: !prev[s.subject_id] }))}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
          >
            <div className="text-left min-w-0">
              <p className="font-semibold text-zinc-900 dark:text-white text-sm truncate">{s.subject_name}</p>
              <p className="text-xs text-zinc-400">
                {s.subject_code} · {s.present}/{s.total} present
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0 ml-3">
              <div className="text-right">
                <p className={`text-lg font-black ${pctColor(s.percentage)}`}>{s.percentage}%</p>
                <div className="w-16 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden mt-0.5">
                  <div
                    className={`h-full rounded-full transition-all ${pctBg(s.percentage)}`}
                    style={{ width: `${s.percentage}%` }}
                  />
                </div>
              </div>
              {expanded[s.subject_id] ? (
                <ChevronDown className="w-4 h-4 text-zinc-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-zinc-400" />
              )}
            </div>
          </button>

          {expanded[s.subject_id] && (
            <div className="border-t border-zinc-100 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800 max-h-64 overflow-y-auto">
              {s.records.map((r, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-2.5">
                  <div>
                    <p className="text-sm text-zinc-900 dark:text-white">
                      {new Date(r.date).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                    {r.class_time && <p className="text-xs text-zinc-400">{r.class_time}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {r.verified && <span className="text-xs text-zinc-400">✓</span>}
                    {r.status === "PRESENT" ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" /> Present
                      </span>
                    ) : r.status === "ABSENT" ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-red-500">
                        <XCircle className="w-4 h-4" /> Absent
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-bold text-amber-600">
                        <Clock className="w-4 h-4" /> {r.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────
export default function StudentAttendancePage() {
  const [tab, setTab] = useState("checkin");

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
          <BookOpen className="w-7 h-7 text-teal-500" /> Attendance
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">
          Mark attendance or view your records.
        </p>
      </div>

      <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800/50 p-1 rounded-xl w-fit">
        {[
          { v: "checkin", label: "Mark Attendance", icon: CheckCircle2 },
          { v: "history", label: "My Records", icon: BarChart2 },
        ].map(({ v, label, icon: Icon }) => (
          <button
            key={v}
            onClick={() => setTab(v)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === v
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm"
                : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
        {tab === "checkin" ? <CheckInPanel /> : <AttendanceHistory />}
      </div>
    </div>
  );
}

