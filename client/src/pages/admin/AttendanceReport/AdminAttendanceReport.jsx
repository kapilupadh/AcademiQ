// client/src/pages/admin/AttendanceReport/AdminAttendanceReport.jsx
import React, { useState, useEffect } from "react";
import api from "../../../services/api";
import {
  BarChart2, Filter, Download, CheckCircle2, XCircle,
  Loader, Building2, BookOpen, Users, Search, ChevronDown,
  ChevronRight, Calendar, TrendingUp,
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────
const pctColor = (p) => p >= 75 ? "text-emerald-600 dark:text-emerald-400" : p >= 50 ? "text-amber-600 dark:text-amber-400" : "text-red-500";
const pctBg   = (p) => p >= 75 ? "bg-emerald-500" : p >= 50 ? "bg-amber-500" : "bg-red-500";

function StatCard({ icon: Icon, label, value, color }) {
  const colors = {
    blue:    "bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400",
    emerald: "bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400",
    red:     "bg-red-50 dark:bg-red-900/10 text-red-500",
    teal:    "bg-teal-50 dark:bg-teal-900/10 text-teal-600 dark:text-teal-400",
  };
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex items-center gap-3 shadow-sm">
      <div className={`p-2.5 rounded-xl ${colors[color]}`}><Icon className="w-5 h-5" /></div>
      <div>
        <p className="text-2xl font-black text-zinc-900 dark:text-white">{value}</p>
        <p className="text-xs text-zinc-500">{label}</p>
      </div>
    </div>
  );
}

export default function AdminAttendanceReport() {
  const [departments, setDepartments] = useState([]);
  const [subjects, setSubjects] = useState([]);

  // Filters
  const [filters, setFilters] = useState({
    department_id: "",
    subject_id: "",
    from_date: "",
    to_date: new Date().toISOString().split("T")[0],
  });

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedStudents, setExpandedStudents] = useState({});
  const [studentSearch, setStudentSearch] = useState("");
  const [activeTab, setActiveTab] = useState("summary"); // summary | records

  // Load departments
  useEffect(() => {
    api.get("/admin/departments").then(r => setDepartments(r.data)).catch(console.error);
  }, []);

  // Load subjects when dept changes
  useEffect(() => {
    setFilters(f => ({ ...f, subject_id: "" }));
    setSubjects([]);
    if (!filters.department_id) return;
    api.get(`/admin/departments/${filters.department_id}/programs`)
      .then(async programs => {
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
    } finally { setLoading(false); }
  };

  const handleExportCSV = () => {
    if (!data?.records?.length) return;
    const headers = ["Date", "Student", "Roll No", "Subject", "Semester", "Status", "Verified", "Distance (m)"];
    const rows = data.records.map(r => [
      r.date, r.student_name, r.roll_number, r.subject_name,
      r.semester, r.status, r.verified ? "Yes" : "No", r.distance_meters ?? "N/A"
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `attendance_report_${filters.from_date || "all"}_to_${filters.to_date}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const filteredStudents = data?.student_summaries?.filter(s =>
    s.student_name.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.roll_number.toLowerCase().includes(studentSearch.toLowerCase())
  ) || [];

  const INPUT = "w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:border-blue-500 text-zinc-900 dark:text-white text-sm";

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
            <BarChart2 className="w-7 h-7 text-blue-500" /> Attendance Reports
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">Filter and export attendance data across departments, subjects, and date ranges.</p>
        </div>
        {data && (
          <button onClick={handleExportCSV} disabled={!data?.records?.length}
            className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold rounded-xl text-sm disabled:opacity-50 transition-all hover:bg-zinc-800 dark:hover:bg-zinc-200">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
        <h2 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-blue-500" /> Filters
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Department */}
          <div>
            <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" /> Department
            </label>
            <select value={filters.department_id} onChange={e => setFilters(f => ({ ...f, department_id: e.target.value }))} className={INPUT}>
              <option value="">All Departments</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5 flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" /> Subject
            </label>
            <select value={filters.subject_id} onChange={e => setFilters(f => ({ ...f, subject_id: e.target.value }))} disabled={!filters.department_id} className={`${INPUT} disabled:opacity-40`}>
              <option value="">All Subjects</option>
              {subjects.map(s => <option key={s.id} value={s.id}>Sem {s.semester} — {s.name}</option>)}
            </select>
          </div>

          {/* From date */}
          <div>
            <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> From Date
            </label>
            <input type="date" value={filters.from_date} onChange={e => setFilters(f => ({ ...f, from_date: e.target.value }))} className={INPUT} />
          </div>

          {/* To date */}
          <div>
            <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> To Date
            </label>
            <input type="date" value={filters.to_date} onChange={e => setFilters(f => ({ ...f, to_date: e.target.value }))} className={INPUT} />
          </div>
        </div>

        <button onClick={handleFetch} disabled={loading}
          className="mt-4 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 flex items-center gap-2 text-sm">
          {loading ? <><Loader className="w-4 h-4 animate-spin" /> Loading…</> : <><Search className="w-4 h-4" /> Generate Report</>}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl p-4 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Results */}
      {data && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Users} label="Total Records" value={data.summary.total} color="blue" />
            <StatCard icon={CheckCircle2} label="Present" value={data.summary.present} color="emerald" />
            <StatCard icon={XCircle} label="Absent" value={data.summary.absent} color="red" />
            <StatCard icon={TrendingUp} label="Attendance Rate" value={`${data.summary.attendance_rate}%`} color="teal" />
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800/50 p-1 rounded-xl w-fit">
            {[
              { v: "summary", label: "By Student", icon: Users },
              { v: "records", label: "All Records", icon: BarChart2 },
            ].map(({ v, label, icon: Icon }) => (
              <button key={v} onClick={() => setActiveTab(v)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === v ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"}`}>
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </div>

          {/* Student summary tab */}
          {activeTab === "summary" && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-zinc-100 dark:border-zinc-800">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                  <input value={studentSearch} onChange={e => setStudentSearch(e.target.value)}
                    placeholder="Search student name or roll number…"
                    className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:border-blue-500 text-sm text-zinc-900 dark:text-white" />
                </div>
              </div>

              {filteredStudents.length === 0 ? (
                <div className="text-center py-12 text-zinc-400 text-sm">No students found.</div>
              ) : (
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {filteredStudents.map(s => (
                    <div key={s.student_id} className="px-5 py-4 flex items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-zinc-900 dark:text-white text-sm truncate">{s.student_name}</p>
                        <p className="text-xs text-zinc-400">{s.roll_number} · {s.present}/{s.total} classes</p>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right">
                          <p className={`text-lg font-black ${pctColor(s.percentage)}`}>{s.percentage}%</p>
                          <div className="w-20 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden mt-0.5">
                            <div className={`h-full rounded-full ${pctBg(s.percentage)}`} style={{ width: `${s.percentage}%` }} />
                          </div>
                        </div>
                        <div className={`px-2.5 py-1 rounded-full text-xs font-bold ${s.percentage >= 75 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : s.percentage >= 50 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"}`}>
                          {s.percentage >= 75 ? "Good" : s.percentage >= 50 ? "Low" : "Critical"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* All records tab */}
          {activeTab === "records" && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
                      {["Date", "Student", "Roll No", "Subject", "Sem", "Status", "GPS Verified"].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {data.records.map((r, i) => (
                      <tr key={i} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                        <td className="px-4 py-3 text-zinc-500 whitespace-nowrap">{new Date(r.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</td>
                        <td className="px-4 py-3 font-medium text-zinc-900 dark:text-white whitespace-nowrap">{r.student_name}</td>
                        <td className="px-4 py-3 text-zinc-400 font-mono text-xs">{r.roll_number}</td>
                        <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300 max-w-[180px] truncate">{r.subject_name}</td>
                        <td className="px-4 py-3 text-zinc-400 text-center">{r.semester}</td>
                        <td className="px-4 py-3">
                          {r.status === "PRESENT"
                            ? <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5" /> Present</span>
                            : <span className="flex items-center gap-1 text-xs font-bold text-red-500"><XCircle className="w-3.5 h-3.5" /> Absent</span>
                          }
                        </td>
                        <td className="px-4 py-3 text-center">
                          {r.verified
                            ? <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{r.distance_meters}m ✓</span>
                            : <span className="text-xs text-zinc-400">—</span>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {data.records.length === 0 && (
                  <div className="text-center py-12 text-zinc-400 text-sm">No records found for these filters.</div>
                )}
              </div>
              {data.records.length >= 500 && (
                <div className="px-5 py-3 border-t border-zinc-100 dark:border-zinc-800 text-xs text-zinc-400 text-center">
                  Showing first 500 records. Use filters to narrow down results.
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}