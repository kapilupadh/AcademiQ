import React, { useState } from "react";
import {
  Search,
  Filter,
  MoreHorizontal,
  FileCheck,
  XCircle,
  Download,
  FileSpreadsheet,
} from "lucide-react";

// MOCK DATA
const MOCK_COMPLETED = [
  {
    id: "STU-1001",
    name: "Alice Johnson",
    exam: "Mid-Term Physics",
    score: "88/100",
    gradedBy: "AI & Dr. Smith",
    date: "Oct 12, 10:45 AM",
  },
  {
    id: "STU-1002",
    name: "Bob Smith",
    exam: "Mid-Term Physics",
    score: "92/100",
    gradedBy: "AI & Dr. Smith",
    date: "Oct 12, 10:48 AM",
  },
  {
    id: "STU-1003",
    name: "Charlie Davis",
    exam: "Mid-Term Physics",
    score: "74/100",
    gradedBy: "AI & Dr. Smith",
    date: "Oct 12, 10:55 AM",
  },
];

const MOCK_CANCELED = [
  {
    id: "STU-1004",
    name: "Diana Prince",
    exam: "Mid-Term Physics",
    reason: "UFM Flagged (Multiple Faces)",
    date: "Oct 12, 10:30 AM",
  },
  {
    id: "STU-1005",
    name: "Evan Wright",
    exam: "Mid-Term Physics",
    reason: "Connectivity Drop > 15mins",
    date: "Oct 12, 10:15 AM",
  },
];

export default function Evaluation() {
  const [activeTab, setActiveTab] = useState("completed");
  const [selectedRows, setSelectedRows] = useState([]);
  const [showModal, setShowModal] = useState(false);

  // Toggle rows for report generation
  const toggleRow = (id) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id],
    );
  };
  const toggleAll = () => {
    setSelectedRows(
      selectedRows.length === MOCK_COMPLETED.length
        ? []
        : MOCK_COMPLETED.map((s) => s.id),
    );
  };

  const renderGenerationModal = () => {
    if (!showModal) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowModal(false)}
        />

        {/* Modal Content */}
        <div className="relative w-full max-w-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
          <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Generate Report Cards
            </h2>
            <div className="px-2.5 py-1 text-xs font-bold rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
              {selectedRows.length} Selected
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Select Reporting Template
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button className="p-4 rounded-xl border-2 border-violet-500 bg-violet-50 dark:bg-violet-900/10 text-left transition-colors">
                  <FileSpreadsheet className="w-6 h-6 text-violet-600 mb-2" />
                  <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-50">
                    Standard Academic
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Includes letter grades & remarks
                  </p>
                </button>
                <button className="p-4 rounded-xl border-2 border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-left transition-colors grayscale hover:grayscale-0 opacity-60 hover:opacity-100">
                  <FileCheck className="w-6 h-6 text-blue-600 mb-2" />
                  <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-50">
                    Detailed Analytical
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Includes subject percentiles
                  </p>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-sm">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>
                All selected evaluations have been verified by Lead Proctors.
                Ready for generation.
              </span>
            </div>
          </div>

          <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex justify-end gap-3">
            <button
              onClick={() => setShowModal(false)}
              className="px-4 py-2 rounded-lg font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                alert(`Generating ${selectedRows.length} Report Cards...`);
                setShowModal(false);
                setSelectedRows([]);
              }}
              className="px-6 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-semibold transition-colors shadow-sm flex items-center gap-2"
            >
              <Download className="w-4 h-4" /> Generate PDFs
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex p-1 bg-zinc-100 dark:bg-zinc-900 rounded-lg w-full sm:w-auto">
          <button
            onClick={() => setActiveTab("completed")}
            className={`flex-1 sm:flex-none flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === "completed" ? "bg-white dark:bg-zinc-950 text-emerald-700 dark:text-emerald-400 shadow-sm" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"}`}
          >
            <FileCheck className="w-4 h-4" /> Completed Exams
          </button>
          <button
            onClick={() => setActiveTab("canceled")}
            className={`flex-1 sm:flex-none flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === "canceled" ? "bg-white dark:bg-zinc-950 text-rose-700 dark:text-rose-400 shadow-sm" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"}`}
          >
            <XCircle className="w-4 h-4" /> Canceled / Missed
          </button>
        </div>

        {activeTab === "completed" && selectedRows.length > 0 && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 h-10 px-6 rounded-lg bg-violet-600 text-white text-sm font-semibold shadow-md hover:bg-violet-700 hover:shadow-lg hover:-translate-y-0.5 transition-all w-full sm:w-auto justify-center animate-in fade-in zoom-in-95"
          >
            Generate {selectedRows.length} Report(s)
          </button>
        )}
      </div>

      {/* COMPLETED TAB */}
      {activeTab === "completed" && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* Search and Filters */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search student or ID..."
                className="h-10 w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-9 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <button className="flex items-center gap-2 h-10 px-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors">
              <Filter className="w-4 h-4" /> Filter
            </button>
          </div>

          {/* DataTable */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left align-middle">
                <thead className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-medium">
                  <tr>
                    <th className="p-4 w-12 text-center">
                      <input
                        type="checkbox"
                        className="rounded border-zinc-300 dark:border-zinc-700 w-4 h-4 text-violet-600"
                        checked={
                          selectedRows.length === MOCK_COMPLETED.length &&
                          MOCK_COMPLETED.length > 0
                        }
                        onChange={toggleAll}
                      />
                    </th>
                    <th className="p-4">Student Name</th>
                    <th className="p-4">Exam Completed</th>
                    <th className="p-4">Final Score</th>
                    <th className="p-4">Evaluated By</th>
                    <th className="p-4">Completion Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {MOCK_COMPLETED.map((stu) => (
                    <tr
                      key={stu.id}
                      className={`hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors ${selectedRows.includes(stu.id) ? "bg-violet-50/50 dark:bg-violet-500/5" : ""}`}
                    >
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          className="rounded border-zinc-300 dark:border-zinc-700 w-4 h-4 text-violet-600"
                          checked={selectedRows.includes(stu.id)}
                          onChange={() => toggleRow(stu.id)}
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                            {stu.name}
                          </span>
                          <span className="text-xs font-mono text-zinc-500">
                            {stu.id}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-zinc-600 dark:text-zinc-300 font-medium">
                        {stu.exam}
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-500/20">
                          {stu.score}
                        </span>
                      </td>
                      <td className="p-4 text-zinc-500 text-xs">
                        {stu.gradedBy}
                      </td>
                      <td className="p-4 text-zinc-500 text-xs">{stu.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CANCELED TAB */}
      {activeTab === "canceled" && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden shadow-sm">
            <table className="w-full text-sm text-left align-middle">
              <thead className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-medium">
                <tr>
                  <th className="p-4">Student</th>
                  <th className="p-4">Target Exam</th>
                  <th className="p-4">Cancellation Reason</th>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {MOCK_CANCELED.map((stu) => (
                  <tr
                    key={stu.id}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                          {stu.name}
                        </span>
                        <span className="text-xs font-mono text-zinc-500">
                          {stu.id}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 font-medium text-zinc-600 dark:text-zinc-300">
                      {stu.exam}
                    </td>
                    <td className="p-4">
                      <span className="text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-1 rounded">
                        {stu.reason}
                      </span>
                    </td>
                    <td className="p-4 text-zinc-500 text-xs">{stu.date}</td>
                    <td className="p-4 text-center">
                      <button className="px-3 py-1.5 text-xs font-semibold rounded bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 transition-opacity">
                        Schedule Makeup
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Generation Modal Layer */}
      {renderGenerationModal()}
    </div>
  );
}
