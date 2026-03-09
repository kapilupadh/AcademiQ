// client/src/pages/admin/ExamEngine/LiveMonitoring.jsx
import React, { useState, useEffect } from "react";
import api from "../../../services/api";
import {
  Server,
  Users,
  Activity,
  MoreVertical,
  PauseCircle,
  Clock,
  Volume2,
} from "lucide-react";

export default function LiveMonitoring() {
  const [menuOpen, setMenuOpen] = useState(null);
  const [metrics, setMetrics] = useState({
    concurrentExams: 0,
    activeCandidates: 0,
    totalEnrolledCandidates: 0,
    serverHealth: "Loading...",
  });
  const [activeExams, setActiveExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await api.get(`/admin/exams/live-dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMetrics(res.data.metrics);
        setActiveExams(res.data.activeExams);
      } catch (err) {
        console.error(err);
        setMetrics({
          concurrentExams: "ERR",
          activeCandidates: 0,
          totalEnrolledCandidates: 0,
          serverHealth:
            err.response?.data?.message || err.message || "Unknown Error",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case "healthy":
        return "bg-emerald-500 text-emerald-500";
      case "warning":
        return "bg-amber-500 text-amber-500";
      case "error":
        return "bg-rose-500 text-rose-500";
      default:
        return "bg-zinc-500 text-zinc-500";
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Live Metrics Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Concurrent Exams */}
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Concurrent Exams
            </p>
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mt-1">
              {loading ? "..." : metrics.concurrentExams}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-600 dark:text-violet-400">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        {/* Total Active Candidates */}
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Active Candidates
            </p>
            <div className="flex items-end gap-2 mt-1">
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                {loading ? "..." : metrics.activeCandidates}
              </h3>
              <p className="text-xs font-semibold text-zinc-500 mb-1">
                / {loading ? "..." : metrics.totalEnrolledCandidates}
              </p>
            </div>

            {/* Minimal Progress Bar */}
            <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-900 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-violet-500 rounded-full transition-all duration-500"
                style={{
                  width: `${metrics.totalEnrolledCandidates > 0 ? (metrics.activeCandidates / metrics.totalEnrolledCandidates) * 100 : 0}%`,
                }}
              ></div>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 self-start">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Server & Connectivity Health */}
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              System Health
            </p>
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Server className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-auto">
            <span className="relative flex h-2.5 w-2.5">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full ${loading ? "bg-zinc-400" : "bg-emerald-400"} opacity-75`}
              ></span>
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${loading ? "bg-zinc-500" : "bg-emerald-500"}`}
              ></span>
            </span>
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {loading ? "Connecting..." : metrics.serverHealth}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Active Exam Cards Grid */}
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 mb-4">
          Active Examinations
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {loading ? (
            <div className="col-span-full py-12 text-center text-zinc-500">
              Loading Active Exams...
            </div>
          ) : activeExams.length === 0 ? (
            <div className="col-span-full py-12 text-center text-zinc-500 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950">
              No Live or Scheduled exams found.
            </div>
          ) : (
            activeExams.map((exam) => (
              <div
                key={exam.id}
                className="relative p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm hover:border-violet-500/40 transition-colors group flex flex-col"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${getStatusColor(exam.status).split(" ")[0]}`}
                    />
                    <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 truncate max-w-[120px]">
                      {exam.id.substring(0, 8)}
                    </span>
                  </div>

                  {/* Quick Actions Dropdown Menu Trigger */}
                  <div className="relative">
                    <button
                      onClick={() =>
                        setMenuOpen(menuOpen === exam.id ? null : exam.id)
                      }
                      className="p-1 -mr-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 rounded"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {menuOpen === exam.id && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setMenuOpen(null)}
                        ></div>
                        <div className="absolute right-0 top-6 z-20 w-48 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xl py-1 animate-in fade-in zoom-in-95 duration-100">
                          <button className="flex w-full items-center gap-2 px-3 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-50">
                            <PauseCircle className="w-4 h-4" /> Pause Exam
                          </button>
                          <button className="flex w-full items-center gap-2 px-3 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-50">
                            <Clock className="w-4 h-4" /> Extend Time
                          </button>
                          <button className="flex w-full items-center gap-2 px-3 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-50">
                            <Volume2 className="w-4 h-4" /> Broadcast Announce
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 truncate">
                    {exam.name}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {exam.subject}
                  </p>
                </div>

                <div className="mt-5 mb-4 flex-1">
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      Participation
                    </span>
                    <span className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                      {exam.active}
                      <span className="text-xs font-semibold text-zinc-500">
                        /{exam.enrolled}
                      </span>
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-900 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${exam.status === "error" ? "bg-rose-500" : "bg-violet-600 dark:bg-violet-500"}`}
                      style={{
                        width: `${(exam.active / exam.enrolled) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs font-medium">
                  <span className="text-zinc-500">Time Remaining:</span>
                  <span
                    className={`font-mono ${exam.status === "error" ? "text-rose-500" : "text-zinc-900 dark:text-zinc-50"}`}
                  >
                    {exam.timeRemaining}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
