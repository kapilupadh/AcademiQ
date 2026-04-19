import React, { useEffect, useState, useCallback } from "react";
import api from "../../../services/api";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Key, Play, Users, Clock, CheckCircle,
  RefreshCcw, Timer, Copy, Check, OctagonX, TrendingUp,
  BookOpen, AlertTriangle,
} from "lucide-react";

// ── Reusable: Status Badge ────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    Draft:     "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
    Scheduled: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
    Live:      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
    Completed: "bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium tracking-wide ${map[status] ?? map.Draft}`}>
      {status === "Live" && (
        <span className="mr-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
      )}
      {status}
    </span>
  );
}

// ── Reusable: Submission Status Badge ────────────────────────────────────────
function SubmissionBadge({ status }) {
  const label = status.replace(/_/g, " ");
  const map = {
    WAITING_ROOM:    "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400",
    IN_PROGRESS:     "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400",
    FORCE_SUBMITTED: "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400",
  };
  const cls = map[status] ?? (
    status.includes("SUBMITTED")
      ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
      : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
  );
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}

// ── Reusable: Stat Card ───────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="flex flex-col gap-1.5 p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
      <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </div>
      <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums">
        {value}
      </p>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function SkeletonPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6 max-w-[1200px] mx-auto space-y-5 animate-pulse">
      <div className="h-4 w-28 rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-5">
        <div className="flex justify-between">
          <div className="space-y-2">
            <div className="h-4 w-20 rounded bg-zinc-100 dark:bg-zinc-800" />
            <div className="h-6 w-64 rounded bg-zinc-100 dark:bg-zinc-800" />
          </div>
          <div className="h-9 w-28 rounded-lg bg-zinc-100 dark:bg-zinc-800" />
        </div>
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-zinc-100 dark:bg-zinc-800" />
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
        <div className="h-5 w-40 rounded bg-zinc-100 dark:bg-zinc-800 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 rounded bg-zinc-100 dark:bg-zinc-800" />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ExamManage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [expiryMinutes, setExpiryMinutes] = useState(5);
  const [otpCountdown, setOtpCountdown] = useState(null);
  const [copied, setCopied] = useState(false);

  const fetchDetails = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const [examRes, subRes] = await Promise.all([
        api.get(`/teacher/exams/${id}`, { headers }),
        api.get(`/teacher/exams/${id}/submissions`, { headers }),
      ]);
      setExam(examRes.data);
      setSubmissions(subRes.data.attempts);
      setStats(subRes.data.stats);
      if (examRes.data.otp && examRes.data.otp_expires_at) {
        const remaining = Math.max(
          0,
          Math.floor((new Date(examRes.data.otp_expires_at).getTime() - Date.now()) / 1000)
        );
        setOtpCountdown(remaining);
      } else {
        setOtpCountdown(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchDetails(); }, [fetchDetails]);

  useEffect(() => {
    if (otpCountdown === null || otpCountdown <= 0) return;
    const interval = setInterval(
      () => setOtpCountdown((prev) => (prev <= 1 ? 0 : prev - 1)),
      1000
    );
    return () => clearInterval(interval);
  }, [otpCountdown]);

  const generateOtp = async () => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await api.post(
        `/teacher/exams/${id}/generate-otp`,
        { expiryMinutes },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setExam((prev) => ({
        ...prev,
        otp: res.data.otp,
        otp_expires_at: res.data.expiresAt,
        status: "Scheduled",
      }));
      setOtpCountdown(expiryMinutes * 60);
    } catch (err) {
      alert(err.response?.data?.message || "Error generating OTP");
    } finally {
      setActionLoading(false);
    }
  };

  const copyOtp = () => {
    if (!exam?.otp) return;
    navigator.clipboard.writeText(exam.otp).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const forceEndExam = async () => {
    const inProgress = submissions.filter((s) =>
      ["IN_PROGRESS", "WAITING_ROOM"].includes(s.status)
    ).length;
    if (!window.confirm(
      `Are you sure you want to FORCE STOP this exam?\n\n${inProgress} student(s) are currently in progress or waiting. Their exams will be auto-submitted immediately with whatever answers they have entered so far.\n\nThis action cannot be undone.`
    )) return;
    setActionLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await api.post(
        `/teacher/exams/${id}/end`, {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(`Exam force-stopped. ${res.data.affectedStudents} student(s) were auto-submitted.`);
      fetchDetails();
    } catch (err) {
      alert(err.response?.data?.message || "Error force-stopping exam");
    } finally {
      setActionLoading(false);
    }
  };

  const startExam = async () => {
    if (!window.confirm(
      "Are you sure you want to start the exam? This will start the timer for all students in the waiting room."
    )) return;
    setActionLoading(true);
    try {
      const token = localStorage.getItem("token");
      await api.post(
        `/teacher/exams/${id}/start`, {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchDetails();
    } catch (err) {
      alert(err.response?.data?.message || "Error starting exam");
    } finally {
      setActionLoading(false);
    }
  };

  const formatCountdown = (secs) => {
    if (!secs && secs !== 0) return "";
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const otpIsExpired = otpCountdown === 0;
  const otpIsActive = exam?.otp && otpCountdown > 0;

  if (loading) return <SkeletonPage />;
  if (!exam) return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
      <div className="text-center space-y-2">
        <BookOpen className="w-8 h-8 text-zinc-300 mx-auto" />
        <p className="text-sm text-zinc-500">Exam not found.</p>
        <button onClick={() => navigate("/teacher/exams")} className="text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 underline underline-offset-2 transition-colors">
          Back to Exams
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-[1200px] mx-auto px-6 py-8 space-y-5">

        {/* Back nav */}
        <button
          onClick={() => navigate("/teacher/exams")}
          className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Exams
        </button>

        {/* ── Exam Header Card ── */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 space-y-5">

          {/* Title row */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-zinc-100 dark:border-zinc-800">
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge status={exam.status} />
                <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                  {exam.type}
                </span>
              </div>
              <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight truncate">
                {exam.title}
              </h1>
              {exam.subject && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{exam.subject}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={fetchDetails}
                title="Refresh"
                className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                <RefreshCcw className="w-4 h-4" />
              </button>

              {exam.status === "Scheduled" && (
                <button
                  disabled={actionLoading}
                  onClick={startExam}
                  className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  <Play className="w-3.5 h-3.5" />
                  Start Exam
                </button>
              )}

              {exam.status === "Live" && (
                <button
                  disabled={actionLoading}
                  onClick={forceEndExam}
                  className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  <OctagonX className="w-3.5 h-3.5" />
                  Force Stop
                </button>
              )}
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard icon={Clock}        label="Duration"     value={`${exam.duration_minutes} min`} />
            <StatCard icon={CheckCircle}  label="Questions"    value={exam.total_questions_to_ask} />
            <StatCard icon={TrendingUp}   label="Pass Mark"    value={`${exam.passing_percentage}%`} />
            <StatCard icon={Users}        label="Participants" value={submissions.length} />
          </div>
        </div>

        {/* ── OTP Panel ── */}
        {(exam.status === "Draft" || exam.status === "Scheduled") && (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 mb-5">
              <Key className="w-4 h-4 text-zinc-400" />
              Waiting Room OTP
            </h2>

            <div className="flex flex-col lg:flex-row gap-6">
              {/* Controls */}
              <div className="flex-1 space-y-3">
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  OTP Valid For
                </label>
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Stepper */}
                  <div className="inline-flex items-center border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden bg-zinc-50 dark:bg-zinc-950">
                    <button
                      type="button"
                      onClick={() => setExpiryMinutes((v) => Math.max(1, v - 1))}
                      className="px-3 py-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-sm font-bold"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={expiryMinutes}
                      onChange={(e) =>
                        setExpiryMinutes(Math.min(60, Math.max(1, parseInt(e.target.value) || 1)))
                      }
                      className="w-12 text-center py-2 bg-transparent text-zinc-900 dark:text-zinc-100 font-semibold text-sm outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setExpiryMinutes((v) => Math.min(60, v + 1))}
                      className="px-3 py-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-sm font-bold"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-xs text-zinc-500">
                    minute{expiryMinutes !== 1 ? "s" : ""}
                  </span>
                  <button
                    disabled={actionLoading}
                    onClick={generateOtp}
                    className="inline-flex items-center gap-1.5 bg-zinc-900 dark:bg-white hover:opacity-90 disabled:opacity-50 text-white dark:text-zinc-900 text-xs font-medium px-4 py-2 rounded-lg transition-opacity"
                  >
                    <Key className="w-3.5 h-3.5" />
                    {exam.otp ? "Regenerate OTP" : "Generate OTP"}
                  </button>
                </div>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 leading-relaxed">
                  Regenerating a new OTP immediately invalidates the previous one.
                </p>
              </div>

              {/* OTP Display */}
              {exam.otp && (
                <div className={`flex-1 rounded-xl border p-4 transition-colors ${
                  otpIsExpired
                    ? "border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/10"
                    : "border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/10"
                }`}>
                  {/* OTP header */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                      otpIsExpired
                        ? "text-red-600 dark:text-red-400"
                        : "text-blue-600 dark:text-blue-400"
                    }`}>
                      <Timer className="w-3.5 h-3.5" />
                      {otpIsExpired ? "Expired" : "Active OTP"}
                    </span>
                    {!otpIsExpired && (
                      <span className="text-xs font-mono font-semibold text-blue-600 dark:text-blue-400 bg-white dark:bg-zinc-900 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded-md">
                        {formatCountdown(otpCountdown)}
                      </span>
                    )}
                  </div>

                  {/* OTP code */}
                  <div className="flex items-center gap-3">
                    <span className={`text-3xl font-black tracking-[0.25em] font-mono select-all ${
                      otpIsExpired
                        ? "text-red-300 dark:text-red-700 line-through"
                        : "text-blue-700 dark:text-blue-300"
                    }`}>
                      {exam.otp}
                    </span>
                    {!otpIsExpired && (
                      <button
                        onClick={copyOtp}
                        title="Copy OTP"
                        className="ml-auto p-1.5 rounded-md text-blue-500 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                      >
                        {copied
                          ? <Check className="w-3.5 h-3.5 text-emerald-500" />
                          : <Copy className="w-3.5 h-3.5" />
                        }
                      </button>
                    )}
                  </div>

                  {/* Progress bar */}
                  {!otpIsExpired && (
                    <div className="mt-3 h-1 bg-blue-100 dark:bg-blue-900/30 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                        style={{ width: `${(otpCountdown / (expiryMinutes * 60)) * 100}%` }}
                      />
                    </div>
                  )}

                  {otpIsExpired && (
                    <p className="text-xs text-red-500 dark:text-red-400 mt-2">
                      OTP expired — regenerate to create a new one.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Submissions Table ── */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
          {/* Table header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-zinc-400" />
              Submissions
              <span className="ml-1 text-xs font-normal text-zinc-400 dark:text-zinc-500">
                ({submissions.length})
              </span>
            </h2>
            {stats && (
              <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                Avg score:
                <span className="font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums">
                  {stats.average_score?.toFixed(1) ?? "—"}
                </span>
              </div>
            )}
          </div>

          {/* Table body */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800">
                  {["Student", "Roll No", "Status", "Violations", "Score"].map((h) => (
                    <th key={h} className="py-2.5 px-5 text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {submissions.length === 0 ? (
                  <tr>
                    <td colSpan="5">
                      <div className="flex flex-col items-center justify-center py-14 text-center">
                        <Users className="w-6 h-6 text-zinc-300 dark:text-zinc-600 mb-2" />
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">No participants yet</p>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                          Students will appear here once they join.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  submissions.map((sub) => (
                    <tr
                      key={sub.id}
                      className="border-b border-zinc-100 dark:border-zinc-800/60 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors"
                    >
                      <td className="py-3 px-5 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {sub.student?.full_name || "Unknown"}
                      </td>
                      <td className="py-3 px-5 text-xs text-zinc-500 dark:text-zinc-400 tabular-nums">
                        {sub.student?.college_roll_number || "—"}
                      </td>
                      <td className="py-3 px-5">
                        <SubmissionBadge status={sub.status} />
                      </td>
                      <td className="py-3 px-5">
                        {sub.violation_count > 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400">
                            <AlertTriangle className="w-3 h-3" />
                            {sub.violation_count}
                          </span>
                        ) : (
                          <span className="text-xs text-zinc-400">0</span>
                        )}
                      </td>
                      <td className="py-3 px-5 text-sm font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums">
                        {sub.status.includes("SUBMITTED") ? sub.score : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}