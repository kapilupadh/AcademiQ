import React, { useState } from "react";
import {
  Server,
  Users,
  Activity,
  MoreVertical,
  PauseCircle,
  Clock,
  Volume2,
  ShieldAlert,
  CheckCircle2,
} from "lucide-react";

// Mock Data
const MOCK_EXAMS = [
  {
    id: "EX-01",
    name: "Mid-Term Physics",
    subject: "Quantum Mechanics",
    timeRemaining: "45m 20s",
    active: 142,
    enrolled: 150,
    status: "healthy",
  },
  {
    id: "EX-02",
    name: "Algebra Finals",
    subject: "Mathematics",
    timeRemaining: "1h 15m",
    active: 280,
    enrolled: 300,
    status: "warning",
  },
  {
    id: "EX-03",
    name: "Organic Chemistry Set B",
    subject: "Chemistry",
    timeRemaining: "12m 40s",
    active: 85,
    enrolled: 90,
    status: "healthy",
  },
  {
    id: "EX-04",
    name: "World History Standard",
    subject: "History",
    timeRemaining: "Paused",
    active: 0,
    enrolled: 210,
    status: "error",
  },
];

export default function LiveMonitoring() {
  const [menuOpen, setMenuOpen] = useState(null);

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
              4
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
                507
              </h3>
              <p className="text-xs font-semibold text-zinc-500 mb-1">/ 750</p>
            </div>

            {/* Minimal Progress Bar */}
            <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-900 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-violet-500 rounded-full"
                style={{ width: "67%" }}
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
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              All Systems Operational
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
          {MOCK_EXAMS.map((exam) => (
            <div
              key={exam.id}
              className="relative p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm hover:border-violet-500/40 transition-colors group flex flex-col"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${getStatusColor(exam.status).split(" ")[0]}`}
                  />
                  <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">
                    {exam.id}
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
                    style={{ width: `${(exam.active / exam.enrolled) * 100}%` }}
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
          ))}
        </div>
      </div>
    </div>
  );
}
