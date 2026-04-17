// client/src/pages/student/Attendance/StudentAttendancePage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../../services/api";
import {
  CheckCircle2, XCircle, Clock, MapPin, Hash, QrCode,
  Loader, AlertTriangle, BookOpen, BarChart2,
  ChevronRight, ChevronDown, RefreshCw, ArrowLeft, Camera,
} from "lucide-react";

// Import our new attendance components
import { OTPVerification, ImageUpload, LocationValidator, AttendanceCard } from "../../../components/attendance";

// ── Helpers ───────────────────────────────────────────────────────────────────
const pctColor = (p) => p >= 75 ? "text-emerald-600 dark:text-emerald-400" : p >= 50 ? "text-amber-600 dark:text-amber-400" : "text-red-500 dark:text-red-400";
const pctBg   = (p) => p >= 75 ? "bg-emerald-500" : p >= 50 ? "bg-amber-500" : "bg-red-500";
const fmt     = (d) => d ? new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";

// ── Step Indicator ───────────────────────────────────────────────────────────
function StepIndicator({ currentStep, steps }) {
  return (
    <div className="flex items-center justify-center gap-1 mb-6">
      {steps.map((step, index) => {
        const isCompleted = index < currentStep - 1;
        const isCurrent = index === currentStep - 1;

        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center min-w-[56px]">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold transition-all ${
                  isCompleted
                    ? "bg-emerald-500 text-white"
                    : isCurrent
                    ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 ring-4 ring-zinc-100 dark:ring-zinc-800"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600"
                }`}
              >
                {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : index + 1}
              </div>
              <span
                className={`text-[10px] mt-1.5 font-medium tracking-wide ${
                  isCurrent
                    ? "text-zinc-900 dark:text-zinc-100"
                    : isCompleted
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-zinc-400 dark:text-zinc-600"
                }`}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`flex-1 max-w-[24px] h-px mb-5 transition-colors ${
                  isCompleted ? "bg-emerald-500" : "bg-zinc-200 dark:bg-zinc-800"
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
  const [currentStep, setCurrentStep] = useState(1);

  const [otpCode, setOtpCode] = useState("");
  const [capturedImage, setCapturedImage] = useState(null);
  const [locationData, setLocationData] = useState(null);

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const steps = [
    { id: 1, label: "Verify" },
    { id: 2, label: "Photo" },
    { id: 3, label: "Location" },
    { id: 4, label: "Submit" },
  ];

  const handleOTPVerified = (code) => {
    setOtpCode(code);
    setError("");
    setCurrentStep(2);
  };

  const handleImageCaptured = (imageData) => {
    setCapturedImage(imageData);
    setError("");
    setCurrentStep(3);
  };

  const handleLocationValidated = (location) => {
    setLocationData(location);
    setError("");

    if (location.isValid) {
      setCurrentStep(4);
    } else {
      setError(`You are ${Math.round(location.distance)}m away from the classroom. Please move closer and try again.`);
    }
  };

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

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError("");
    }
  };

  const handleResetStep = (step) => {
    setCurrentStep(step);
    setError("");
  };

  if (submitSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-md shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden p-8 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/40 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          </motion.div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-1.5 tracking-tight">
            Attendance Marked
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
            Your attendance for <span className="font-medium text-zinc-700 dark:text-zinc-200">{session.subject?.name}</span> has been recorded.
          </p>
          <Loader className="w-4 h-4 mx-auto text-zinc-400 animate-spin" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-md shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2.5 min-w-0">
            {currentStep > 1 && !submitSuccess && (
              <button
                onClick={handleBack}
                className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div className="min-w-0">
              <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2 truncate">
                <span className="truncate">{session.subject?.name}</span>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md inline-flex items-center gap-1 shrink-0 ${
                  session.mode === "OTP"
                    ? "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/60"
                    : "bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-900/60"
                }`}>
                  {session.mode === "OTP" ? <Hash className="w-2.5 h-2.5" /> : <QrCode className="w-2.5 h-2.5" />}
                  {session.mode}
                </span>
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-500 mt-0.5 tabular-nums">
                {fmt(session.class_start_time)} — {fmt(session.class_end_time)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">
          <StepIndicator currentStep={currentStep} steps={steps} />

          <div className="min-h-[280px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.18 }}
              >
                {currentStep === 1 && (
                  <OTPVerification
                    mode={session.mode}
                    otpDigits={session.otp_digits}
                    onVerified={handleOTPVerified}
                    onCancel={onClose}
                  />
                )}

                {currentStep === 2 && (
                  <ImageUpload
                    onImageCaptured={handleImageCaptured}
                    onCancel={handleBack}
                    required={true}
                  />
                )}

                {currentStep === 3 && (
                  <LocationValidator
                    allowedLocation={session.allowed_location}
                    onLocationValidated={handleLocationValidated}
                    onCancel={handleBack}
                  />
                )}

                {currentStep === 4 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-white dark:text-zinc-900" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 tracking-tight">Review & Submit</h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-500">Confirm your details before submitting</p>
                      </div>
                    </div>

                    <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl divide-y divide-zinc-200 dark:divide-zinc-800 overflow-hidden">
                      <div className="p-3.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                            {session.mode === "OTP" ? (
                              <Hash className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                            ) : (
                              <QrCode className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs text-zinc-500 dark:text-zinc-500">
                              {session.mode === "OTP" ? "OTP Code" : "QR Code"}
                            </p>
                            <p className="font-mono text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                              {otpCode}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleResetStep(1)}
                          className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 px-2 py-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
                        >
                          Edit
                        </button>
                      </div>

                      <div className="p-3.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {capturedImage ? (
                            <img
                              src={capturedImage.dataUrl}
                              alt="Captured"
                              className="w-8 h-8 object-cover rounded-md border border-zinc-200 dark:border-zinc-700 shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                              <Camera className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-xs text-zinc-500 dark:text-zinc-500">Photo Verification</p>
                            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Captured
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleResetStep(2)}
                          className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 px-2 py-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
                        >
                          Retake
                        </button>
                      </div>

                      <div className="p-3.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                            <MapPin className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs text-zinc-500 dark:text-zinc-500">Location</p>
                            {locationData?.isValid ? (
                              <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Verified
                                {locationData.distance !== null && (
                                  <span className="text-zinc-500 dark:text-zinc-500 font-normal ml-1 tabular-nums">
                                    ({Math.round(locationData.distance)}m)
                                  </span>
                                )}
                              </p>
                            ) : (
                              <p className="text-sm font-medium text-red-500 inline-flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5" /> Not verified
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleResetStep(3)}
                          className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 px-2 py-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
                        >
                          Refresh
                        </button>
                      </div>
                    </div>

                    {error && (
                      <div className="flex items-start gap-2 text-red-700 dark:text-red-400 text-xs bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 rounded-lg p-3">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>{error}</span>
                      </div>
                    )}

                    <button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white disabled:bg-zinc-300 dark:disabled:bg-zinc-700 disabled:cursor-not-allowed text-white dark:text-zinc-900 disabled:text-zinc-500 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Confirm & Submit
                        </>
                      )}
                    </button>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
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
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">Active Classes</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-0.5">Your current attendance sessions</p>
        </div>
        <button
          onClick={fetchSessions}
          disabled={loading}
          className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 rounded-lg p-3 text-emerald-700 dark:text-emerald-400 text-sm font-medium"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            {successMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="flex items-start gap-2 text-red-700 dark:text-red-400 text-sm bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 rounded-lg p-3">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[...Array(2)].map((_, i) => (
            <div
              key={i}
              className="h-24 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl py-16 px-6 text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
            <Clock className="w-5 h-5 text-zinc-400" />
          </div>
          <div>
            <p className="font-medium text-sm text-zinc-700 dark:text-zinc-200">No active sessions</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1 max-w-xs mx-auto">
              Sessions appear here when your teacher activates attendance during class hours.
            </p>
          </div>
          <button
            onClick={fetchSessions}
            className="mt-1 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Refresh
          </button>
        </div>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
          className="grid grid-cols-1 md:grid-cols-2 gap-3"
        >
          {sessions.map((s) => (
            <motion.div
              key={s.id}
              variants={{
                hidden: { opacity: 0, y: 6 },
                visible: { opacity: 1, y: 0 },
              }}
            >
              <AttendanceCard session={s} onMark={setActiveModal} />
            </motion.div>
          ))}
        </motion.div>
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
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );

  if (!data?.subjects?.length)
    return (
      <div className="border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl py-16 px-6 text-center space-y-3">
        <div className="w-12 h-12 mx-auto rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
          <BarChart2 className="w-5 h-5 text-zinc-400" />
        </div>
        <div>
          <p className="font-medium text-sm text-zinc-700 dark:text-zinc-200">No attendance records</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">Your records will appear here once you start marking attendance.</p>
        </div>
      </div>
    );

  const avgAttendance = Math.round(data.subjects.reduce((s, x) => s + x.percentage, 0) / (data.subjects.length || 1));
  const totalPresent = data.subjects.reduce((s, x) => s + (x.present || 0), 0);

  return (
    <div className="space-y-5">
      {/* Overall stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Subjects", value: data.subjects.length },
          { label: "Total Classes", value: data.total_records },
          { label: "Present", value: totalPresent, color: "text-emerald-600 dark:text-emerald-400" },
          { label: "Avg Attendance", value: `${avgAttendance}%`, color: pctColor(avgAttendance) },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4"
          >
            <p className={`text-2xl font-semibold tabular-nums ${color || "text-zinc-900 dark:text-zinc-100"}`}>{value}</p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-500 mt-1 uppercase tracking-wide font-medium">{label}</p>
          </div>
        ))}
      </div>

      {/* Per-subject breakdown */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-500 mb-2.5 px-1">
          Subjects
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data.subjects.map((s) => (
            <div
              key={s.subject_id}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden h-fit"
            >
              <button
                onClick={() => setExpanded((prev) => ({ ...prev, [s.subject_id]: !prev[s.subject_id] }))}
                className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
              >
                <div className="text-left min-w-0 flex-1">
                  <p className="font-medium text-zinc-900 dark:text-zinc-100 text-sm truncate">{s.subject_name}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-0.5 tabular-nums">
                    {s.subject_code} · {s.present}/{s.total} present
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-3">
                  <div className="text-right">
                    <p className={`text-base font-semibold tabular-nums ${pctColor(s.percentage)}`}>{s.percentage}%</p>
                    <div className="w-16 h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden mt-1">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${s.percentage}%` }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className={`h-full rounded-full ${pctBg(s.percentage)}`}
                      />
                    </div>
                  </div>
                  <motion.div
                    animate={{ rotate: expanded[s.subject_id] ? 90 : 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <ChevronRight className="w-4 h-4 text-zinc-400" />
                  </motion.div>
                </div>
              </button>

              <AnimatePresence initial={false}>
                {expanded[s.subject_id] && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800/60 max-h-64 overflow-y-auto">
                      {s.records.map((r, i) => (
                        <div key={i} className="flex items-center justify-between px-4 py-2.5">
                          <div>
                            <p className="text-sm text-zinc-900 dark:text-zinc-100">
                              {new Date(r.date).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </p>
                            {r.class_time && <p className="text-[11px] text-zinc-500 dark:text-zinc-500 tabular-nums mt-0.5">{r.class_time}</p>}
                          </div>
                          <div className="flex items-center gap-2">
                            {r.verified && (
                              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                                ✓ Verified
                              </span>
                            )}
                            {r.status === "PRESENT" ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60">
                                <CheckCircle2 className="w-3 h-3" /> Present
                              </span>
                            ) : r.status === "ABSENT" ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-red-700 dark:text-red-400 px-2 py-0.5 rounded-md bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60">
                                <XCircle className="w-3 h-3" /> Absent
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60">
                                <Clock className="w-3 h-3" /> {r.status}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────
export default function StudentAttendancePage() {
  const [tab, setTab] = useState("checkin");

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5 tracking-tight">
            <span className="w-8 h-8 rounded-lg bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white dark:text-zinc-900" />
            </span>
            Attendance
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1.5 text-sm">
            Mark attendance or view your records.
          </p>
        </div>

        {/* Tabs moved to header for better horizontal balance */}
        <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
          {[
            { v: "checkin", label: "Mark Attendance", icon: CheckCircle2 },
            { v: "history", label: "My Records", icon: BarChart2 },
          ].map(({ v, label, icon: Icon }) => (
            <button
              key={v}
              onClick={() => setTab(v)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                tab === v
                  ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-px bg-zinc-200 dark:bg-zinc-800" />

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          {tab === "checkin" ? <CheckInPanel /> : <AttendanceHistory />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
