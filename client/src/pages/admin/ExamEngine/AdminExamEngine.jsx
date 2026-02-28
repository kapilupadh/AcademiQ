import React, { useState, useEffect } from "react";
import {
  Search,
  MonitorPlay,
  Database,
  FileCheck2,
  BarChart3,
  Command,
  ShieldAlert,
} from "lucide-react";
import LiveMonitoring from "./LiveMonitoring";
import AlertsTracker from "./AlertsTracker";
import QuestionBank from "./QuestionBank";
import Evaluation from "./Evaluation";
import Analytics from "./Analytics";

export default function AdminExamEngine() {
  const [activeTab, setActiveTab] = useState("overview");
  const [cmdOpen, setCmdOpen] = useState(false);

  // Command Palette listener
  useEffect(() => {
    const down = (e) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCmdOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const tabs = [
    { id: "overview", label: "Live Overview", icon: MonitorPlay },
    { id: "alerts", label: "Alerts & Issues", icon: ShieldAlert },
    { id: "questions", label: "Question Bank", icon: Database },
    { id: "evaluation", label: "Evaluation & Reports", icon: FileCheck2 },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
  ];

  return (
    <div className="bg-white dark:bg-[#09090b] text-zinc-900 dark:text-zinc-50 font-sans transition-colors rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
      {/* HEADER & TOP NAV */}
      <header className="flex items-center justify-between px-6 h-14 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
        {/* Breadcrumbs */}
        <div className="flex items-center space-x-2 text-sm text-zinc-500 dark:text-zinc-400">
          <span className="hover:text-zinc-900 dark:hover:text-zinc-50 cursor-pointer transition-colors">
            Dashboard
          </span>
          <span>/</span>
          <span className="hover:text-zinc-900 dark:hover:text-zinc-50 cursor-pointer transition-colors">
            Examinations
          </span>
          <span>/</span>
          <span className="font-medium text-zinc-900 dark:text-zinc-50">
            Middle-Terms
          </span>
        </div>

        {/* Global Search trigger (Cmd+K) */}
        <button
          onClick={() => setCmdOpen(true)}
          className="group flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/50 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-md transition-all"
        >
          <Search className="w-4 h-4" />
          <span>Search exams, students...</span>
          <kbd className="ml-4 inline-flex items-center gap-1 rounded border border-zinc-300 dark:border-zinc-700 bg-zinc-200 dark:bg-zinc-900 px-1.5 font-mono text-[10px] font-medium text-zinc-600 dark:text-zinc-400">
            <Command className="w-3 h-3" /> K
          </kbd>
        </button>
      </header>

      {/* TABS NAVIGATION */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#09090b] px-6">
        <nav className="flex space-x-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 text-sm font-medium border-b-2 transition-all ${
                  isActive
                    ? "border-violet-600 text-violet-600 dark:border-violet-500 dark:text-violet-400"
                    : "border-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* CONTENT AREA */}
      <div className="p-6">
        {activeTab === "overview" && <LiveMonitoring />}
        {activeTab === "alerts" && <AlertsTracker />}
        {activeTab === "questions" && <QuestionBank />}
        {activeTab === "evaluation" && <Evaluation />}
        {activeTab === "analytics" && <Analytics />}
      </div>

      {/* COMMAND PALETTE MODAL MOCK */}
      {cmdOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-32 sm:pt-48 animate-in fade-in duration-200">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setCmdOpen(false)}
          />
          <div className="relative w-full max-w-xl scale-100 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center border-b border-zinc-200 dark:border-zinc-800 px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 text-zinc-500 dark:text-zinc-400" />
              <input
                autoFocus
                className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-zinc-500 dark:placeholder:text-zinc-400 text-zinc-900 dark:text-zinc-50"
                placeholder="Type a command or search..."
              />
            </div>
            <div className="max-h-[300px] overflow-y-auto p-2">
              <div className="px-2 py-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                Suggestions
              </div>
              {[
                "Active Exam: Mid-Term Physics",
                "Student: John Doe (Flagged)",
                "Review: Algebra Finals",
                "Deploy Overrides",
              ].map((item, i) => (
                <div
                  key={i}
                  className="relative flex cursor-default select-none items-center rounded-sm px-2 py-2.5 text-sm outline-none hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-50 cursor-pointer"
                  onClick={() => setCmdOpen(false)}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
