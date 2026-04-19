import React, { useState, useEffect } from "react";
import api from "../../../services/api";
import {
  BarChart2, Filter, Download, CheckCircle2, XCircle,
  Loader, Building2, BookOpen, Users, Search,
  Calendar, TrendingUp, AlertCircle,
} from "lucide-react";

/* ─── Helpers ────────────────────────────────────────────────────── */
const pctColor = (p) =>
  p >= 75 ? "text-emerald-600 dark:text-emerald-400"
  : p >= 50 ? "text-amber-600 dark:text-amber-400"
  : "text-red-500 dark:text-red-400";

const pctBg = (p) =>
  p >= 75 ? "bg-emerald-500" : p >= 50 ? "bg-amber-500" : "bg-red-500";

const pctBadge = (p) =>
  p >= 75
    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
    : p >= 50
    ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
    : "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400";

/* ─── Reusable primitives ────────────────────────────────────────── */
function Label({ children }) {
  return (
    <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
      {children}
    </label>
  );
}

function Select({ className = "", children, ...props }) {
  return (
    <select
      className={`w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 dark:focus:ring-zinc-300/20 focus:border-zinc-900 dark:focus:border-zinc-300 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

function DateInput({ className = "", ...props }) {
  return (
    <input
      type="date"
      className={`w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 dark:focus:ring-zinc-300/20 focus:border-zinc-900 dark:focus:border-zinc-300 transition-all duration-150 ${className}`}
      {...props}
    />
  );
}

/* ─── Stat Card ──────────────────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, subLabel }) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm flex flex-col gap-1">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
        <Icon className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
      </div>
      <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">{value}</p>
      {subLabel && <p className="text-xs text-zinc-400 dark:text-zinc-500">{subLabel}</p>}
    </div>
  );
}

/* ─── Skeleton ───────────────────────────────────────────────────── */
function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-5 py-4 animate-pulse">
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-36 rounded bg-zinc-100 dark:bg-zinc-800" />
        <div className="h-3 w-24 rounded bg-zinc-100 dark:bg-zinc-800" />
      </div>
      <div className="h-3 w-14 rounded bg-zinc-100 dark:bg-zinc-800" />
      <div className="h-5 w-16 rounded-md bg-zinc-100 dark:bg-zinc-800" />
    </div>
  );
}

/* ─── Main ───────────────────────────────────────────────────────── */
export default function AdminAttendanceReport() {
  const [departments, setDepartments] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const [filters, setFilters] = useState({
    department_id: "",
    subject_id: "",
    from_date: "",
    to_date: new Date().toISOString().split("T")[0],
  });

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [activeTab, setActiveTab] = useState("summary");

  useEffect(() => {
    api.get("/admin/departments").then((r) => setDepartments(r.data)).catch(console.error);
  }, []);

  useEffect(() => {
    setFilters((f) => ({ ...f, subject_id: "" }));
    setSubjects([]);
    if (!filters.department_id) return;
    api.get(`/admin/departments/${filters.department_id}/programs`)
      .then(async (programs) => {
        const all = [];
        for (const p of programs.data) {
          const res = await api.get(`/admin/programs/${p.id}/subjects`);
          all.push(...res.data);
        }
        setSubjects(all.sort((a, b) => a.semester - b.semester || a.name.localeCompare(b.name)));
      })
      .catch(console.error);
  }, [filters.department_id]);

  const handleFetch = async () => {
    setLoading(true); setError(""); setData(null);
    try {
      const params = new URLSearchParams();
      if (filters.department_id) params.append("department_id", filters.department_id);
      if (filters.subject_id) params.append("subject_id", filters.subject_id);
      if (filters.from_date) params.append("from_date", filters.from_date);
      if (filters.to_date) params.append("to_date", filters.to_date);
      const res = await api.get(`/attendance/report?${params.toString()}`);
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch report.");
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!data?.records?.length) return;
    const headers = ["Date", "Student", "Roll No", "Subject", "Semester", "Status", "Verified", "Distance (m)"];
    const rows = data.records.map((r) => [
      r.date, r.student_name, r.roll_number, r.subject_name,
      r.semester, r.status, r.verified ? "Yes" : "No", r.distance_meters ?? "N/A",
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance_report_${filters.from_date || "all"}_to_${filters.to_date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredStudents = data?.student_summaries?.filter((s) =>
    s.student_name.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.roll_number.toLowerCase().includes(studentSearch.toLowerCase())
  ) || [];

  /* ── Render ─────────────────────────────────────────────────────── */
  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-5">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Attendance Reports
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Filter and export attendance data across departments, subjects, and date ranges.
          </p>
        </div>
        {data && (
          <button
            onClick={handleExportCSV}
            disabled={!data?.records?.length}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:opacity-90 disabled:opacity-50 transition-all shadow-sm"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        )}
      </div>

      <div className="h-px bg-zinc-200 dark:bg-zinc-800" />

      {/* ── Filters card ── */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm">
        <div className="flex items-center gap-2.5 p-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
            <Filter className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
          </div>
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Filters</span>
        </div>

        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Department */}
          <div>
            <Label><Building2 className="w-3 h-3" /> Department</Label>
            <Select
              value={filters.department_id}
              onChange={(e) => setFilters((f) => ({ ...f, department_id: e.target.value }))}
            >
              <option value="">All Departments</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </Select>
          </div>

          {/* Subject */}
          <div>
            <Label><BookOpen className="w-3 h-3" /> Subject</Label>
            <Select
              value={filters.subject_id}
              onChange={(e) => setFilters((f) => ({ ...f, subject_id: e.target.value }))}
              disabled={!filters.department_id}
            >
              <option value="">All Subjects</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>Sem {s.semester} — {s.name}</option>)}
            </Select>
          </div>

          {/* From date */}
          <div>
            <Label><Calendar className="w-3 h-3" /> From Date</Label>
            <DateInput
              value={filters.from_date}
              onChange={(e) => setFilters((f) => ({ ...f, from_date: e.target.value }))}
            />
          </div>

          {/* To date */}
          <div>
            <Label><Calendar className="w-3 h-3" /> To Date</Label>
            <DateInput
              value={filters.to_date}
              onChange={(e) => setFilters((f) => ({ ...f, to_date: e.target.value }))}
            />
          </div>
        </div>

        <div className="px-4 pb-4">
          <button
            onClick={handleFetch}
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:opacity-90 disabled:opacity-50 transition-all shadow-sm"
          >
            {loading
              ? <><Loader className="w-4 h-4 animate-spin" /> Generating…</>
              : <><Search className="w-4 h-4" /> Generate Report</>
            }
          </button>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {/* ── Loading skeleton ── */}
      {loading && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
          {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
        </div>
      )}

      {/* ── Results ── */}
      {data && !loading && (
        <div className="space-y-5">

          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={Users}
              label="Total Records"
              value={data.summary.total.toLocaleString()}
              subLabel="across selected filters"
            />
            <StatCard
              icon={CheckCircle2}
              label="Present"
              value={data.summary.present.toLocaleString()}
              subLabel={`${Math.round((data.summary.present / data.summary.total) * 100) || 0}% of total`}
            />
            <StatCard
              icon={XCircle}
              label="Absent"
              value={data.summary.absent.toLocaleString()}
              subLabel={`${Math.round((data.summary.absent / data.summary.total) * 100) || 0}% of total`}
            />
            <StatCard
              icon={TrendingUp}
              label="Attendance Rate"
              value={`${data.summary.attendance_rate}%`}
              subLabel={data.summary.attendance_rate >= 75 ? "On track" : data.summary.attendance_rate >= 50 ? "Needs attention" : "Critical"}
            />
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-zinc-100 dark:bg-zinc-800/60 rounded-lg w-fit">
            {[
              { v: "summary", label: "By Student", icon: Users },
              { v: "records", label: "All Records", icon: BarChart2 },
            ].map(({ v, label, icon: Icon }) => (
              <button
                key={v}
                onClick={() => setActiveTab(v)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all duration-150
                  ${activeTab === v
                    ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                  }`}
              >
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </div>

          {/* ── By Student tab ── */}
          {activeTab === "summary" && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
              {/* Search bar */}
              <div className="p-4 border-b border-zinc-100 dark:border-zinc-800">
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
                  <input
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Search by name or roll number…"
                    className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 dark:focus:ring-zinc-300/20 focus:border-zinc-900 dark:focus:border-zinc-300 transition-all"
                  />
                </div>
              </div>

              {/* Column headers */}
              <div className="grid grid-cols-[1fr_auto_auto_80px] gap-4 px-5 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                <div>Student</div>
                <div className="text-right">Attendance</div>
                <div className="w-24 text-right">Rate</div>
                <div className="text-center">Status</div>
              </div>

              {filteredStudents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                    <Users className="w-5 h-5 text-zinc-400" />
                  </div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">No students found</p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {filteredStudents.map((s) => (
                    <div
                      key={s.student_id}
                      className="grid grid-cols-[1fr_auto_auto_80px] gap-4 items-center px-5 py-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors"
                    >
                      {/* Name + roll */}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{s.student_name}</p>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">{s.roll_number}</p>
                      </div>

                      {/* Classes count */}
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums">
                          {s.present}<span className="font-normal text-zinc-400">/{s.total}</span>
                        </p>
                        <p className="text-[10px] text-zinc-400 mt-0.5">classes</p>
                      </div>

                      {/* Progress bar + % */}
                      <div className="w-24 shrink-0">
                        <p className={`text-sm font-bold tabular-nums text-right mb-1 ${pctColor(s.percentage)}`}>
                          {s.percentage}%
                        </p>
                        <div className="h-1.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${pctBg(s.percentage)}`}
                            style={{ width: `${s.percentage}%` }}
                          />
                        </div>
                      </div>

                      {/* Badge */}
                      <div className="flex justify-center shrink-0">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold ${pctBadge(s.percentage)}`}>
                          {s.percentage >= 75 ? "Good" : s.percentage >= 50 ? "Low" : "Critical"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {filteredStudents.length > 0 && (
                <div className="px-5 py-3 border-t border-zinc-100 dark:border-zinc-800 text-xs text-zinc-400">
                  {filteredStudents.length} student{filteredStudents.length !== 1 ? "s" : ""}
                </div>
              )}
            </div>
          )}

          {/* ── All Records tab ── */}
          {activeTab === "records" && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
                      {["Date", "Student", "Roll No", "Subject", "Sem", "Status", "GPS"].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {data.records.map((r, i) => (
                      <tr key={i} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                        <td className="px-4 py-3 text-xs text-zinc-500 dark:text-zinc-400 whitespace-nowrap tabular-nums">
                          {new Date(r.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </td>
                        <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                          {r.student_name}
                        </td>
                        <td className="px-4 py-3 text-xs font-mono text-zinc-400 dark:text-zinc-500">
                          {r.roll_number}
                        </td>
                        <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300 max-w-[180px] truncate text-xs">
                          {r.subject_name}
                        </td>
                        <td className="px-4 py-3 text-xs text-zinc-400 text-center tabular-nums">
                          {r.semester}
                        </td>
                        <td className="px-4 py-3">
                          {r.status === "PRESENT" ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Present
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-500 dark:text-red-400">
                              <XCircle className="w-3.5 h-3.5" /> Absent
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {r.verified ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="w-3 h-3" /> {r.distance_meters}m
                            </span>
                          ) : (
                            <span className="text-zinc-300 dark:text-zinc-600 text-sm">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {data.records.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                      <BarChart2 className="w-5 h-5 text-zinc-400" />
                    </div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">No records found for these filters</p>
                  </div>
                )}
              </div>

              {data.records.length >= 500 && (
                <div className="px-5 py-3 border-t border-zinc-100 dark:border-zinc-800 text-xs text-zinc-400 text-center">
                  Showing first 500 records — use filters to narrow down results.
                </div>
              )}

              {data.records.length > 0 && (
                <div className="px-5 py-3 border-t border-zinc-100 dark:border-zinc-800 text-xs text-zinc-400">
                  {data.records.length.toLocaleString()} record{data.records.length !== 1 ? "s" : ""}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}