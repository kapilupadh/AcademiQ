import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Key,
  Play,
  Users,
  Clock,
  CheckCircle,
  RefreshCcw,
  Timer,
  Copy,
  Check,
  Square,
  OctagonX,
} from "lucide-react";

export default function ExamManage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // OTP controls
  const [expiryMinutes, setExpiryMinutes] = useState(5);
  const [otpCountdown, setOtpCountdown] = useState(null); // seconds remaining
  const [copied, setCopied] = useState(false);

  const fetchDetails = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const [examRes, subRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/teacher/exams/${id}`, { headers }),
        axios.get(`http://localhost:5000/api/teacher/exams/${id}/submissions`, {
          headers,
        }),
      ]);

      setExam(examRes.data);
      setSubmissions(subRes.data.attempts);
      setStats(subRes.data.stats);

      // Calculate countdown from otp_expires_at
      if (examRes.data.otp && examRes.data.otp_expires_at) {
        const remaining = Math.max(
          0,
          Math.floor(
            (new Date(examRes.data.otp_expires_at).getTime() - Date.now()) /
              1000,
          ),
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

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  // Live countdown timer
  useEffect(() => {
    if (otpCountdown === null || otpCountdown <= 0) return;
    const interval = setInterval(
      () => setOtpCountdown((prev) => (prev <= 1 ? 0 : prev - 1)),
      1000,
    );
    return () => clearInterval(interval);
  }, [otpCountdown]);

  const generateOtp = async () => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `http://localhost:5000/api/teacher/exams/${id}/generate-otp`,
        { expiryMinutes },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      // Update OTP inline without full refresh
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
      ["IN_PROGRESS", "WAITING_ROOM"].includes(s.status),
    ).length;
    if (
      !window.confirm(
        `Are you sure you want to FORCE STOP this exam?\n\n${inProgress} student(s) are currently in progress or waiting. Their exams will be auto-submitted immediately with whatever answers they have entered so far.\n\nThis action cannot be undone.`,
      )
    )
      return;
    setActionLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `http://localhost:5000/api/teacher/exams/${id}/end`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      alert(
        `Exam force-stopped. ${res.data.affectedStudents} student(s) were auto-submitted.`,
      );
      fetchDetails();
    } catch (err) {
      alert(err.response?.data?.message || "Error force-stopping exam");
    } finally {
      setActionLoading(false);
    }
  };

  const startExam = async () => {
    if (
      !window.confirm(
        "Are you sure you want to start the exam? This will start the timer for all students in the waiting room.",
      )
    )
      return;
    setActionLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `http://localhost:5000/api/teacher/exams/${id}/start`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
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

  if (loading)
    return (
      <div className="p-8 text-center text-zinc-500">
        Loading Exam Details...
      </div>
    );
  if (!exam)
    return <div className="p-8 text-center text-red-500">Exam Not Found</div>;

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-6">
      <button
        onClick={() => navigate("/teacher/exams")}
        className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Exams
      </button>

      {/* Exam Header Card */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-6 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span
                className={`px-3 py-1 text-sm font-semibold rounded-full ${
                  exam.status === "Draft"
                    ? "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                    : exam.status === "Scheduled"
                      ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                      : exam.status === "Live"
                        ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 animate-pulse"
                        : "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
                }`}
              >
                {exam.status}
              </span>
              <span className="text-sm font-medium text-zinc-500">
                {exam.type}
              </span>
            </div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
              {exam.title}
            </h1>
            {exam.subject && (
              <p className="text-sm text-zinc-500 mt-1">{exam.subject}</p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={fetchDetails}
              title="Refresh"
              className="p-2 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors"
            >
              <RefreshCcw className="w-5 h-5" />
            </button>
            {exam.status === "Scheduled" && (
              <button
                disabled={actionLoading}
                onClick={startExam}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                <Play className="w-4 h-4" /> Start Exam
              </button>
            )}
            {exam.status === "Live" && (
              <button
                disabled={actionLoading}
                onClick={forceEndExam}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 animate-pulse-once"
              >
                <OctagonX className="w-4 h-4" /> Force Stop
              </button>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-zinc-500">Duration</p>
            <p className="font-semibold text-zinc-900 dark:text-white text-lg flex items-center gap-2">
              <Clock className="w-4 h-4 text-zinc-400" />
              {exam.duration_minutes} mins
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-zinc-500">Questions</p>
            <p className="font-semibold text-zinc-900 dark:text-white text-lg flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-zinc-400" />
              {exam.total_questions_to_ask}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-zinc-500">Passing</p>
            <p className="font-semibold text-zinc-900 dark:text-white text-lg">
              {exam.passing_percentage}%
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-zinc-500">Participants</p>
            <p className="font-semibold text-zinc-900 dark:text-white text-lg flex items-center gap-2">
              <Users className="w-4 h-4 text-zinc-400" />
              {submissions.length}
            </p>
          </div>
        </div>
      </div>

      {/* OTP Panel — only for Draft and Scheduled */}
      {(exam.status === "Draft" || exam.status === "Scheduled") && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-5 flex items-center gap-2">
            <Key className="w-5 h-5 text-blue-500" /> Waiting Room OTP
          </h2>

          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* OTP Generator Controls */}
            <div className="flex flex-col gap-3 flex-1">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                OTP Valid For
              </label>
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden bg-zinc-50 dark:bg-zinc-950">
                  <button
                    type="button"
                    onClick={() => setExpiryMinutes((v) => Math.max(1, v - 1))}
                    className="px-3 py-2.5 text-lg font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={expiryMinutes}
                    onChange={(e) =>
                      setExpiryMinutes(
                        Math.min(
                          60,
                          Math.max(1, parseInt(e.target.value) || 1),
                        ),
                      )
                    }
                    className="w-16 text-center py-2.5 bg-transparent text-zinc-900 dark:text-white font-bold text-lg outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setExpiryMinutes((v) => Math.min(60, v + 1))}
                    className="px-3 py-2.5 text-lg font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    +
                  </button>
                </div>
                <span className="text-zinc-500 text-sm">
                  minute{expiryMinutes !== 1 ? "s" : ""}
                </span>

                <button
                  disabled={actionLoading}
                  onClick={generateOtp}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors disabled:opacity-50 ml-1"
                >
                  <Key className="w-4 h-4" />
                  {exam.otp ? "Regenerate OTP" : "Generate OTP"}
                </button>
              </div>
              <p className="text-xs text-zinc-400">
                You can regenerate a new OTP at any time. The old OTP will be
                immediately invalidated.
              </p>
            </div>

            {/* OTP Display */}
            {exam.otp && (
              <div
                className={`flex-1 rounded-2xl p-5 border-2 transition-all ${
                  otpIsExpired
                    ? "border-red-300 bg-red-50 dark:border-red-800/60 dark:bg-red-900/10"
                    : "border-blue-300 bg-blue-50 dark:border-blue-700/50 dark:bg-blue-900/10"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`text-sm font-semibold flex items-center gap-1.5 ${
                      otpIsExpired
                        ? "text-red-600 dark:text-red-400"
                        : "text-blue-700 dark:text-blue-400"
                    }`}
                  >
                    <Timer className="w-4 h-4" />
                    {otpIsExpired ? "OTP Expired" : "Active OTP"}
                  </span>
                  {!otpIsExpired && (
                    <span className="text-xs bg-white dark:bg-zinc-900 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 font-mono font-bold px-2 py-1 rounded-lg">
                      {formatCountdown(otpCountdown)} left
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`text-4xl font-black tracking-[0.3em] font-mono select-all ${
                      otpIsExpired
                        ? "text-red-400 dark:text-red-500 line-through opacity-50"
                        : "text-blue-700 dark:text-blue-300"
                    }`}
                  >
                    {exam.otp}
                  </span>
                  {!otpIsExpired && (
                    <button
                      onClick={copyOtp}
                      title="Copy OTP"
                      className="ml-auto p-2 text-blue-500 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>

                {!otpIsExpired && (
                  <div className="mt-3">
                    <div className="h-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                        style={{
                          width: `${(otpCountdown / (expiryMinutes * 60)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {otpIsExpired && (
                  <p className="text-xs text-red-500 mt-2">
                    This OTP has expired. Click "Regenerate OTP" to create a new
                    one.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Participants & Submissions */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5" /> Submissions & Participants (
            {submissions.length})
          </h2>
          {stats && (
            <div className="text-sm text-zinc-500">
              Avg Score:{" "}
              <span className="font-bold text-zinc-900 dark:text-white">
                {stats.average_score?.toFixed(1) ?? "-"}
              </span>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <th className="py-3 px-4 text-sm font-medium text-zinc-500">
                  Student Name
                </th>
                <th className="py-3 px-4 text-sm font-medium text-zinc-500">
                  Roll No
                </th>
                <th className="py-3 px-4 text-sm font-medium text-zinc-500">
                  Status
                </th>
                <th className="py-3 px-4 text-sm font-medium text-zinc-500">
                  Violations
                </th>
                <th className="py-3 px-4 text-sm font-medium text-zinc-500">
                  Score
                </th>
              </tr>
            </thead>
            <tbody>
              {submissions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-zinc-500">
                    No participants yet.
                  </td>
                </tr>
              ) : (
                submissions.map((sub) => (
                  <tr
                    key={sub.id}
                    className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/30"
                  >
                    <td className="py-3 px-4 text-zinc-900 dark:text-white font-medium">
                      {sub.student?.full_name || "Unknown"}
                    </td>
                    <td className="py-3 px-4 text-zinc-500">
                      {sub.student?.college_roll_number || "-"}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 text-xs rounded-full font-medium ${
                          sub.status === "WAITING_ROOM"
                            ? "bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400"
                            : sub.status === "IN_PROGRESS"
                              ? "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                              : sub.status === "FORCE_SUBMITTED"
                                ? "bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                                : sub.status.includes("SUBMITTED")
                                  ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
                                  : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                        }`}
                      >
                        {sub.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-zinc-500">
                      {sub.violation_count > 0 ? (
                        <span className="text-red-500 font-bold">
                          {sub.violation_count}
                        </span>
                      ) : (
                        0
                      )}
                    </td>
                    <td className="py-3 px-4 font-bold text-zinc-900 dark:text-white">
                      {sub.status.includes("SUBMITTED") ? sub.score : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

