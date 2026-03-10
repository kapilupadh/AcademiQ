// client/src/pages/student/Exam/ExamInstructions.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import api from "../../../services/api";
import { useNavigate } from "react-router-dom";
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
      cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      text: "Waiting for teacher to activate OTP…",
      icon: Loader,
      animate: true,
    },
    otp_active: {
      cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      text: "OTP is active — enter it below to join",
      icon: Key,
      animate: false,
    },
    exam_started: {
      cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
      text: "Exam started — you may enter now!",
      icon: CheckCircle,
      animate: false,
    },
    exam_closed: {
      cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      text: "Exam is closed or has ended",
      icon: XCircle,
      animate: false,
    },
    waiting_room: {
      cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      text: "You are in the waiting room — waiting for teacher to start…",
      icon: Loader,
      animate: true,
    },
    blocked: {
      cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      text: "Your access to this exam has been restricted",
      icon: XCircle,
      animate: false,
    },
  };
  const cfg = configs[state] || configs.waiting_for_teacher;
  const Icon = cfg.icon;
  return (
    <div
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold ${cfg.cls}`}
    >
      <Icon className={`w-4 h-4 ${cfg.animate ? "animate-spin" : ""}`} />
      {cfg.text}
    </div>
  );
}

// ─── Exam Details Skeleton ────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-pulse">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-20 bg-zinc-100 dark:bg-zinc-800 rounded-xl" />
      ))}
    </div>
  );
}

// ─── Exam Detail Card ─────────────────────────────────────────────────────────
function ExamDetailCard({ icon: Icon, label, value, color }) {
  const colors = {
    blue: "bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800 text-blue-700 dark:text-blue-300",
    purple:
      "bg-purple-50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-800 text-purple-700 dark:text-purple-300",
    emerald:
      "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300",
    amber:
      "bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-800 text-amber-700 dark:text-amber-400",
  };
  return (
    <div
      className={`p-4 rounded-xl border flex items-center gap-3 ${colors[color]}`}
    >
      <Icon className="w-5 h-5 flex-shrink-0 opacity-70" />
      <div className="min-w-0">
        <p className="text-xs font-semibold opacity-70">{label}</p>
        <p className="font-bold truncate">{value}</p>
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
  // Only polls exam status, never touches the attempt. When exam goes Live,
  // we navigate to portal where POST /exam/:id/start is called exactly once.
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
        // Exam already live when joining — go straight in
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
      <div className="max-w-xl mx-auto p-8 pt-24 text-center space-y-4">
        <XCircle className="w-16 h-16 text-red-500 mx-auto" />
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
          Access Restricted
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400">
          Your exam attempt has been terminated or marked as absent. Please
          contact your teacher for assistance.
        </p>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // WAITING ROOM STATE
  // ─────────────────────────────────────────────────────────────────────────
  if (phase === "waiting_room") {
    return (
      <div className="max-w-xl mx-auto p-8 pt-16 space-y-6">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 text-center space-y-6 shadow-sm">
          <div className="relative mx-auto w-20 h-20">
            <div className="absolute inset-0 rounded-full bg-blue-100 dark:bg-blue-900/30 animate-ping opacity-40" />
            <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/30">
              <Loader className="w-9 h-9 text-blue-500 animate-spin" />
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-1">
              You're in the Waiting Room
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">
              Stay on this page. The exam will begin automatically when your
              teacher starts it.
            </p>
          </div>

          {examDetails && (
            <div className="bg-zinc-50 dark:bg-zinc-950 rounded-xl p-4 text-left border border-zinc-200 dark:border-zinc-800">
              <p className="text-sm font-semibold text-zinc-900 dark:text-white mb-1">
                {examDetails.title}
              </p>
              <p className="text-xs text-zinc-500">
                {examDetails.type} &bull; {examDetails.duration_minutes} mins
                &bull; {examDetails.total_questions_to_ask} questions
              </p>
            </div>
          )}

          <StatusPill state="waiting_room" />

          <p className="text-xs text-red-500 font-medium">
            ⚠️ Do not close or refresh this tab. Doing so will mark you as
            Absent.
          </p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MAIN / IDLE STATE
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto p-6 pt-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-1">
          Join Examination
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm">
          Select your exam, read the instructions carefully, then enter the OTP
          provided by your teacher.
        </p>
      </div>

      {/* ── Exam Selection ── */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
          <ChevronRight className="w-5 h-5 text-blue-500" /> Select Exam
        </h2>

        {loadingExams ? (
          <div className="h-12 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse" />
        ) : (
          <select
            className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:border-blue-500 text-zinc-900 dark:text-white"
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
        )}

        {/* Exam details */}
        {selectedExamId && (
          <div className="space-y-3">
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
                    color="blue"
                  />
                  <ExamDetailCard
                    icon={CircleAlert}
                    label="Questions"
                    value={`${examDetails.total_questions_to_ask} MCQs`}
                    color="purple"
                  />
                  <ExamDetailCard
                    icon={Timer}
                    label="Passing"
                    value={`${examDetails.passing_percentage}%`}
                    color="emerald"
                  />
                  <ExamDetailCard
                    icon={BookOpen}
                    label="Type"
                    value={examDetails.type || "—"}
                    color="amber"
                  />
                </div>
              </>
            ) : null}
          </div>
        )}
      </div>

      {/* ── Instructions ── */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
          <ChevronRight className="w-5 h-5 text-amber-500" /> Exam Rules &
          Instructions
        </h2>
        <div className="space-y-3">
          {RULES.map((rule, i) => {
            const Icon = rule.icon;
            return (
              <div
                key={i}
                className="flex gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800"
              >
                <div className="shrink-0 mt-0.5 w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                    {rule.title}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {rule.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── OTP Entry ── */}
      {selectedExamId && examDetails && uiState !== "exam_closed" && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-5">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <ChevronRight className="w-5 h-5 text-blue-500" /> Enter OTP
          </h2>

          <div>
            <div className="relative">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input
                type="text"
                inputMode="numeric"
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
                className="w-full pl-12 pr-4 py-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:border-blue-500 text-zinc-900 dark:text-white font-mono tracking-[0.4em] text-xl text-center disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              />
            </div>

            {uiState === "waiting_for_teacher" && (
              <p className="mt-2 text-xs text-zinc-400 flex items-center gap-1">
                <Shield className="w-3 h-3" />
                OTP will become available once your teacher activates it.
              </p>
            )}

            {otpError && (
              <div className="mt-2 flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg border border-red-200 dark:border-red-800">
                <XCircle className="w-4 h-4 flex-shrink-0" />
                {otpError}
              </div>
            )}
          </div>

          {/* Agreement Checkbox */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-blue-600 cursor-pointer"
            />
            <span className="text-sm text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200 transition-colors leading-relaxed">
              I have read and understood all the exam rules and instructions
              above. I agree to follow them strictly throughout the exam.
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
            className="w-full py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all transform active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2"
          >
            {joining ? (
              <>
                <Loader className="w-5 h-5 animate-spin" /> Joining…
              </>
            ) : uiState === "exam_started" ? (
              "⚡ Exam Is Live — Enter Now"
            ) : (
              "Enter Waiting Room"
            )}
          </button>

          {uiState === "exam_started" && (
            <p className="text-xs text-center text-emerald-600 dark:text-emerald-400 font-medium">
              The exam has started! Enter immediately.
            </p>
          )}
        </div>
      )}

      {/* Closed state banner */}
      {uiState === "exam_closed" && (
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-2xl p-5 flex items-center gap-3 text-red-700 dark:text-red-400">
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