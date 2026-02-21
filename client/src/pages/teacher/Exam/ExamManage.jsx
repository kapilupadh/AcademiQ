import React, { useEffect, useState } from "react";
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
} from "lucide-react";

export default function ExamManage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDetails = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const [examRes, subRes] = await Promise.all([
        axios.get("http://localhost:5000/api/teacher/exams", { headers }),
        axios.get(`http://localhost:5000/api/teacher/exams/${id}/submissions`, {
          headers,
        }),
      ]);

      const currentExam = examRes.data.find((e) => e.id === id);
      setExam(currentExam);
      setSubmissions(subRes.data.attempts);
      setStats(subRes.data.stats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const generateOtp = async () => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `http://localhost:5000/api/teacher/exams/${id}/generate-otp`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      alert(`OTP Generated: ${res.data.otp}`);
      fetchDetails();
    } catch (err) {
      alert("Error generating OTP");
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
      alert("Error starting exam");
    } finally {
      setActionLoading(false);
    }
  };

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

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-6 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span
                className={`px-3 py-1 text-sm font-semibold rounded-full ${
                  exam.status === "Draft"
                    ? "bg-zinc-100 text-zinc-600"
                    : exam.status === "Scheduled"
                      ? "bg-blue-100 text-blue-600"
                      : exam.status === "Live"
                        ? "bg-emerald-100 text-emerald-600 animate-pulse"
                        : "bg-purple-100 text-purple-600"
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
          </div>

          <div className="flex gap-3">
            <button
              onClick={fetchDetails}
              className="p-2 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
            >
              <RefreshCcw className="w-5 h-5" />
            </button>
            {(exam.status === "Draft" || exam.status === "Scheduled") && (
              <button
                disabled={actionLoading}
                onClick={generateOtp}
                className="flex items-center gap-2 bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <Key className="w-4 h-4" /> Generate OTP
              </button>
            )}
            {exam.status === "Scheduled" && (
              <button
                disabled={actionLoading}
                onClick={startExam}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <Play className="w-4 h-4" /> Start Exam
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-1">
            <p className="text-sm text-zinc-500">Duration</p>
            <p className="font-semibold text-zinc-900 dark:text-white text-lg flex items-center gap-2">
              <Clock className="w-4 h-4 text-zinc-400" />{" "}
              {exam.duration_minutes} mins
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-zinc-500">Total Questions</p>
            <p className="font-semibold text-zinc-900 dark:text-white text-lg flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-zinc-400" />{" "}
              {exam.total_questions_to_ask}
            </p>
          </div>
          {exam.otp && (
            <div className="space-y-1 md:col-span-2 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-900/50">
              <p className="text-sm text-yellow-800 dark:text-yellow-400 font-medium">
                Active OTP (Valid for 5 mins):{" "}
                <span className="text-xl font-bold tracking-widest ml-2">
                  {exam.otp}
                </span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Participants & Submissions */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-6 flex items-center gap-2">
          <Users className="w-5 h-5" /> Submissions & Participants (
          {submissions.length})
        </h2>

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
                            ? "bg-orange-100 text-orange-600"
                            : sub.status === "IN_PROGRESS"
                              ? "bg-blue-100 text-blue-600"
                              : sub.status.includes("SUBMITTED")
                                ? "bg-emerald-100 text-emerald-600"
                                : "bg-red-100 text-red-600"
                        }`}
                      >
                        {sub.status.replace("_", " ")}
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
