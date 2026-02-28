import React, { useState } from "react";
import {
  AlertCircle,
  FileWarning,
  Hand,
  ShieldAlert,
  CheckCircle2,
} from "lucide-react";

// Mock Data
const ALERTS = {
  pending: [
    {
      id: 1,
      type: "missing_paper",
      exam: "Economics 101",
      msg: "Question Paper Not Uploaded",
      priority: "high",
    },
    {
      id: 2,
      type: "unassigned",
      exam: "Biology Finals",
      msg: "Proctors unassigned for Room 3B",
      priority: "medium",
    },
    {
      id: 3,
      type: "profile",
      exam: "World History",
      msg: "12 Students missing ID verification",
      priority: "medium",
    },
  ],
  running: [
    {
      id: 4,
      type: "connectivity",
      exam: "Mid-Term Physics",
      msg: "Server latency spike across EU-Central",
      priority: "high",
    },
    {
      id: 5,
      type: "ufm",
      exam: "Organic Chemistry",
      msg: "Mass UFM Alert: 14 students flagged in 2 mins",
      priority: "critical",
    },
    {
      id: 6,
      type: "help",
      exam: "Algebra Finals",
      msg: "7 concurrent student help requests",
      priority: "medium",
    },
  ],
  completed: [
    {
      id: 7,
      type: "discrepancy",
      exam: "Philosophy 202",
      msg: "Auto-grading variance detected",
      priority: "high",
    },
    {
      id: 8,
      type: "missing_sub",
      exam: "Computer Science",
      msg: "3 submissions failed to sync",
      priority: "high",
    },
  ],
};

export default function AlertsTracker() {
  const [activeTab, setActiveTab] = useState("running");

  const getPriorityClasses = (priority) => {
    switch (priority) {
      case "critical":
        return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
      case "high":
        return "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20";
      case "medium":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
      default:
        return "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20";
    }
  };

  const getIcon = (type, priority) => {
    if (priority === "critical")
      return <ShieldAlert className="w-4 h-4 text-rose-500" />;
    switch (type) {
      case "missing_paper":
        return <FileWarning className="w-4 h-4 text-orange-500" />;
      case "help":
        return <Hand className="w-4 h-4 text-amber-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-zinc-500" />;
    }
  };

  const renderAlertsList = (list) => {
    if (list.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
          <CheckCircle2 className="w-8 h-8 mb-3 stroke-[1.5] text-emerald-500" />
          <p className="text-sm font-medium">No alerts found</p>
          <p className="text-xs">All systems look good for this phase.</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {list.map((alert) => (
          <div
            key={alert.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm transition-all hover:bg-zinc-50 dark:hover:bg-[#0c0c0e]"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                {getIcon(alert.type, alert.priority)}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {alert.msg}
                </h4>
                <p className="text-xs text-zinc-500 mt-1 flex items-center gap-2">
                  <span className="font-medium">{alert.exam}</span>
                  <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700"></span>
                  <span className="uppercase tracking-wider text-[10px] font-bold">
                    10:45 AM
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${getPriorityClasses(alert.priority)}`}
              >
                {alert.priority}
              </span>
              <button className="px-3 py-1.5 text-xs font-semibold rounded bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 transition-opacity">
                Resolve
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto py-2">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          System Alerts & Issue Tracker
        </h2>
      </div>

      {/* Tabs Menu */}
      <div className="flex p-1 bg-zinc-100 dark:bg-zinc-900 rounded-lg w-full sm:w-auto mb-6">
        <button
          onClick={() => setActiveTab("pending")}
          className={`flex-1 sm:flex-none px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === "pending" ? "bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 shadow-sm" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"}`}
        >
          Pending Exams{" "}
          <span className="ml-2 inline-flex items-center justify-center bg-zinc-200 dark:bg-zinc-800 text-[10px] px-1.5 py-0.5 rounded-full">
            {ALERTS.pending.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("running")}
          className={`flex-1 sm:flex-none px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === "running" ? "bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 shadow-sm" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"}`}
        >
          Running Exams
        </button>
        <button
          onClick={() => setActiveTab("completed")}
          className={`flex-1 sm:flex-none px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === "completed" ? "bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 shadow-sm" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"}`}
        >
          Completed
        </button>
      </div>

      {/* Content */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {activeTab === "pending" && renderAlertsList(ALERTS.pending)}
        {activeTab === "running" && renderAlertsList(ALERTS.running)}
        {activeTab === "completed" && renderAlertsList(ALERTS.completed)}
      </div>
    </div>
  );
}
