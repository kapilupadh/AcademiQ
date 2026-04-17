import React, { useState, useEffect, useRef, useCallback } from "react";
import api from "../../../services/api";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CircleAlert,
  Shield,
  Clock,
  Key,
  Loader,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Monitor,
  BookOpen,
  Users,
  Timer,
  ChevronRight,
  RefreshCcw,
  GraduationCap,
  Sparkles,
  ListChecks,
} from "lucide-react";

// ─── Constants ───────────────────────────────────────────────────────────────

const RULES = [
  {
    icon: Monitor,
    title: "Use the assigned computer only",
    desc: "Do not switch computers or seats after starting the exam.",
  },
  {
    icon: RefreshCcw,
    title: "Do not refresh or close the exam page",
    desc: "Leaving the exam page after it starts may result in an automatic submission.",
  },
  {
    icon: Shield,
    title: "Stay on the exam tab",
    desc: "Switching tabs or windows during the exam is a violation and will be recorded.",
  },
  {
    icon: AlertTriangle,
    title: "Leaving midway = Absent",
    desc: "If you close the browser or disconnect after joining the waiting room without the exam starting, your attempt will be marked as Absent.",
  },
  {
    icon: Users,
    title: "One device per student",
    desc: "Only one session is permitted. Joining from another device invalidates the previous session.",
  },
  {
    icon: BookOpen,
    title: "Follow invigilator's instructions",
    desc: "Obey all instructions given by the teacher or invigilator at all times.",
  },
];

// ─── Status Pill ─────────────────────────────────────────────────────────────
function StatusPill({ state }) {
  const configs = {
    waiting_for_teacher: {
      cls: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60",
      text: "Waiting for teacher to activate OTP…",
      icon: Loader,
      animate: true,
    },
    otp_active: {
      cls: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/60",
      text: "OTP is active — enter it below to join",
      icon: Key,
      animate: false,
    },
    exam_started: {
      cls: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60",
      text: "Exam started — you may enter now!",
      icon: CheckCircle,
      animate: false,
    },
    exam_closed: {
      cls: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/60",
      text: "Exam is closed or has ended",
      icon: XCircle,
      animate: false,
    },
    waiting_room: {
      cls: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/60",
      text: "You are in the waiting room — waiting for teacher to start…",
      icon: Loader,
      animate: true,
    },
    blocked: {
      cls: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/60",
      text: "Your access to this exam has been restricted",
      icon: XCircle,
      animate: false,
    },
  };
  const cfg = configs[state] || configs.waiting_for_teacher;
  const Icon = cfg.icon;
  return (
    <div
      className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full border text-xs font-medium ${cfg.cls}`}
    >
      <Icon className={`w-3.5 h-3.5 ${cfg.animate ? "animate-spin" : ""}`} />
      {cfg.text}
    </div>
  );
}

// ─── Exam Details Skeleton ────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-pulse">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="h-20 bg-zinc-100 dark:bg-zinc-800/60 rounded-xl"
        />
      ))}
    </div>
  );
}

// ─── Exam Detail Card ─────────────────────────────────────────────────────────
function ExamDetailCard({ icon: Icon, label, value }) {
  return (
    <div className="group p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
      <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 mb-2">
        <Icon className="w-3.5 h-3.5" />
        <p className="text-[11px] font-medium uppercase tracking-wider">
          {label}
        </p>
      </div>
      <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate text-sm">
        {value}
      </p>
    </div>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────
function SectionCard({ children, className = "" }) {
  return (
    <div
      className={`bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

function SectionHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-start gap-3">
      <div className="shrink-0 w-9 h-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
        <Icon className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
      </div>
      <div>
        <h2 className="text-base font-semibold text-zinc-900 dark:text-white leading-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ExamInstructions() {
  const navigate = useNavigate();

  // Exam selection
  const [exams, setExams] = useState([]);
  const [loadingExams, setLoadingExams] = useState(true);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [examDetails, setExamDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // OTP & join
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [joining, setJoining] = useState(false);
  const [agreed, setAgreed] = useState(false);

  // Waiting room state
  const [phase, setPhase] = useState("idle"); // idle | waiting_room | blocked
  const [attemptId, setAttemptId] = useState(null);
  const [waitingExamId, setWaitingExamId] = useState(null);
  const pollRef = useRef(null);

  // ── Fetch available exams ──────────────────────────────────────────────────
  useEffect(() => {
    api
      .get(`/exam`)
      .then((r) =>
        setExams(
          r.data.filter(
            (e) => e.status !== "Draft" && e.status !== "Completed",
          ),
        ),
      )
      .catch(console.error)
      .finally(() => setLoadingExams(false));
  }, []);

  // ── Fetch details when exam changes ────────────────────────────────────────
  useEffect(() => {
    if (!selectedExamId) {
      setExamDetails(null);
      return;
    }
    setLoadingDetails(true);
    setOtp("");
    setOtpError("");
    api
      .get(`/exam/${selectedExamId}/details`)
      .then((r) => setExamDetails(r.data))
      .catch(console.error)
      .finally(() => setLoadingDetails(false));
  }, [selectedExamId]);

  // ── Derive UI status ───────────────────────────────────────────────────────
  const examStatus = examDetails?.status;
  const uiState = !examDetails
    ? null
    : examStatus === "Completed"
      ? "exam_closed"
      : examStatus === "Live"
        ? "exam_started"
        : examStatus === "Scheduled"
          ? "otp_active"
          : "waiting_for_teacher";

  // ── Polling via GET /exam/:id/status (safe — does NOT create attempt) ──────
  const startPolling = useCallback(
    (examId) => {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(async () => {
        try {
          const res = await api.get(`/exam/${examId}/status`);
          const { status } = res.data;

          if (status === "Live") {
            clearInterval(pollRef.current);
            navigate(`/exam/portal/${examId}`);
          } else if (status === "Completed" || status === "Cancelled") {
            clearInterval(pollRef.current);
            setPhase("idle");
            alert(
              "Exam has ended before it could start. Please contact your teacher.",
            );
          }
        } catch (err) {
          console.error("Status poll error:", err);
        }
      }, 3000);
    },
    [navigate],
  );

  useEffect(() => () => clearInterval(pollRef.current), []);

  // ── Mark absent on tab close / refresh ────────────────────────────────────
  useEffect(() => {
    if (phase !== "waiting_room" || !attemptId) return;
    const handler = () => {
      navigator.sendBeacon(
        `${process.env.REACT_APP_API_URL || "http://localhost:5000/api"}/exam/mark-absent`,
        new Blob([JSON.stringify({ attemptId })], { type: "application/json" }),
      );
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [phase, attemptId]);

  // ── Join Exam ──────────────────────────────────────────────────────────────
  const handleJoin = async () => {
    if (!selectedExamId || otp.length !== 6 || !agreed) return;
    setOtpError("");
    setJoining(true);
    try {
      const res = await api.post(`/exam/join`, {
        examId: selectedExamId,
        otp,
      });
      const { status, attemptId: aId } = res.data;
      setAttemptId(aId);
      setWaitingExamId(selectedExamId);

      if (status === "WAITING_ROOM") {
        setPhase("waiting_room");
        startPolling(selectedExamId);
      } else if (status === "IN_PROGRESS") {
        navigate(`/exam/portal/${selectedExamId}`);
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to join exam";
      if (msg.includes("TERMINATED") || msg.includes("Absent")) {
        setPhase("blocked");
      } else {
        setOtpError(msg);
      }
    } finally {
      setJoining(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // BLOCKED STATE
  // ─────────────────────────────────────────────────────────────────────────
  if (phase === "blocked") {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="max-w-md w-full bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 text-center space-y-4 shadow-sm"
        >
          <div className="mx-auto w-14 h-14 rounded-full bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-center justify-center">
            <XCircle className="w-7 h-7 text-red-500" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
              Access Restricted
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
              Your exam attempt has been terminated or marked as absent. Please
              contact your teacher for assistance.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // WAITING ROOM STATE
  // ─────────────────────────────────────────────────────────────────────────
  if (phase === "waiting_room") {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="max-w-md w-full bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 text-center space-y-6 shadow-sm"
        >
          <div className="relative mx-auto w-20 h-20">
            <div className="absolute inset-0 rounded-full bg-blue-100 dark:bg-blue-900/30 animate-ping opacity-40" />
            <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60">
              <Loader className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-1.5">
              You're in the Waiting Room
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Stay on this page. The exam will begin automatically when your
              teacher starts it.
            </p>
          </div>

          {examDetails && (
            <div className="bg-zinc-50 dark:bg-zinc-950/60 rounded-xl p-4 text-left border border-zinc-200 dark:border-zinc-800">
              <p className="text-sm font-semibold text-zinc-900 dark:text-white mb-1">
                {examDetails.title}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {examDetails.type} · {examDetails.duration_minutes} mins ·{" "}
                {examDetails.total_questions_to_ask} questions
              </p>
            </div>
          )}

          <div className="flex justify-center">
            <StatusPill state="waiting_room" />
          </div>

          <div className="flex items-start gap-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 rounded-lg px-3 py-2.5 text-left">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="font-medium leading-relaxed">
              Do not close or refresh this tab. Doing so will mark you as
              Absent.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MAIN / IDLE STATE
  // ─────────────────────────────────────────────────────────────────────────
  const showOtpCard =
    selectedExamId && examDetails && uiState !== "exam_closed";

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-start gap-3"
      >
        <div className="shrink-0 w-11 h-11 rounded-xl bg-zinc-900 dark:bg-white flex items-center justify-center">
          <GraduationCap className="w-5 h-5 text-white dark:text-zinc-900" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white tracking-tight">
            Join Examination
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            {selectedExamId
              ? "Enter the OTP provided by your teacher to join."
              : "Select your exam, read the instructions, then enter the OTP provided by your teacher."}
          </p>
        </div>
      </motion.div>

      {/* ── Exam Selection ── */}
      <SectionCard className="p-6 space-y-5">
        <SectionHeader
          icon={Sparkles}
          title="Select Exam"
          subtitle="Choose from available scheduled or live exams"
        />

        {loadingExams ? (
          <div className="h-12 bg-zinc-100 dark:bg-zinc-800/60 rounded-xl animate-pulse" />
        ) : (
          <div className="relative">
            <select
              className="w-full appearance-none px-4 py-3 pr-10 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:border-zinc-400 dark:focus:border-zinc-600 focus:ring-2 focus:ring-zinc-900/5 dark:focus:ring-white/5 text-sm text-zinc-900 dark:text-white transition-colors"
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
            >
              <option value="" disabled>
                — Choose an Exam —
              </option>
              {exams.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title} · {e.type}
                </option>
              ))}
            </select>
            <ChevronRight className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 rotate-90" />
          </div>
        )}

        {/* Exam details */}
        {selectedExamId && (
          <div className="space-y-4">
            {loadingDetails ? (
              <SkeletonCard />
            ) : examDetails ? (
              <>
                {uiState && <StatusPill state={uiState} />}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <ExamDetailCard
                    icon={Clock}
                    label="Duration"
                    value={`${examDetails.duration_minutes} Mins`}
                  />
                  <ExamDetailCard
                    icon={CircleAlert}
                    label="Questions"
                    value={`${examDetails.total_questions_to_ask} MCQs`}
                  />
                  <ExamDetailCard
                    icon={Timer}
                    label="Passing"
                    value={`${examDetails.passing_percentage}%`}
                  />
                  <ExamDetailCard
                    icon={BookOpen}
                    label="Type"
                    value={examDetails.type || "—"}
                  />
                </div>
              </>
            ) : null}
          </div>
        )}
      </SectionCard>

      {/* ── Instructions (only when NO exam selected) ── */}
      {!selectedExamId && (
        <SectionCard className="p-6 space-y-5">
          <SectionHeader
            icon={ListChecks}
            title="Exam Rules & Instructions"
            subtitle="Please read carefully before selecting an exam"
          />

          <div className="grid sm:grid-cols-2 gap-2.5">
            {RULES.map((rule, i) => {
              const Icon = rule.icon;
              return (
                <div
                  key={i}
                  className="flex gap-3 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                >
                  <div className="shrink-0 mt-0.5 w-8 h-8 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-900 dark:text-white">
                      {rule.title}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                      {rule.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      )}

      {/* ── OTP + Agreement + Button (only when exam IS selected) ── */}
      {showOtpCard && (
        <SectionCard className="p-6 space-y-5">
          <SectionHeader
            icon={Key}
            title="Enter OTP"
            subtitle="6-digit code provided by your teacher"
          />

          {/* OTP Input */}
          <div>
            <div className="relative">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none z-10" />
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value.replace(/\D/g, ""));
                  setOtpError("");
                }}
                disabled={
                  uiState === "waiting_for_teacher" ||
                  uiState === "exam_started"
                }
                placeholder={
                  uiState === "waiting_for_teacher"
                    ? "OTP not yet active…"
                    : "Enter 6-digit OTP"
                }
                className="w-full pl-12 pr-4 py-4 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:border-zinc-400 dark:focus:border-zinc-600 focus:ring-2 focus:ring-zinc-900/5 dark:focus:ring-white/5 text-zinc-900 dark:text-white font-mono tracking-[0.4em] text-lg text-center disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              />
            </div>

            {uiState === "waiting_for_teacher" && (
              <p className="mt-2.5 text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                <Shield className="w-3 h-3" />
                OTP will become available once your teacher activates it.
              </p>
            )}

            {otpError && (
              <div className="mt-2.5 flex items-center gap-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg border border-red-200 dark:border-red-900/60">
                <XCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {otpError}
              </div>
            )}
          </div>

          {/* Agreement Checkbox */}
          <label className="flex items-start gap-3 cursor-pointer group p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-zinc-900 dark:accent-white cursor-pointer flex-shrink-0"
            />
            <span className="text-xs text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200 transition-colors leading-relaxed">
              I have read and understood all the exam rules and instructions.
              I agree to follow them strictly throughout the exam.
            </span>
          </label>

          {/* Enter Button */}
          <button
            disabled={
              otp.length !== 6 ||
              !agreed ||
              joining ||
              uiState === "waiting_for_teacher" ||
              uiState === "exam_closed"
            }
            onClick={handleJoin}
            className="w-full py-3.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-semibold rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors transform active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2 shadow-sm"
          >
            {joining ? (
              <>
                <Loader className="w-4 h-4 animate-spin" /> Joining…
              </>
            ) : uiState === "exam_started" ? (
              <>
                <Sparkles className="w-4 h-4" />
                Exam Is Live — Enter Now
              </>
            ) : (
              <>
                Enter Waiting Room
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>

          {uiState === "exam_started" && (
            <p className="text-xs text-center text-emerald-600 dark:text-emerald-400 font-medium">
              The exam has started! Enter immediately.
            </p>
          )}
        </SectionCard>
      )}

      {/* Closed state banner */}
      {selectedExamId && uiState === "exam_closed" && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 rounded-2xl p-4 flex items-center gap-3 text-red-700 dark:text-red-400">
          <XCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">
            This exam has been closed. Please contact your teacher if you
            believe this is an error.
          </p>
        </div>
      )}
    </div>
  );
}
