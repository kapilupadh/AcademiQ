// client/src/pages/admin/Dashboard/AdminDashboard.jsx
import React, { useMemo, useState, useEffect } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar,
  LineChart, Line, ReferenceLine,
} from "recharts";
import {
  Users, GraduationCap, FileText, Building2, AlertTriangle,
  TrendingUp, ArrowUpRight, ArrowDownRight, Minus, CalendarDays,
  Activity, Loader2,
} from "lucide-react";
import { useTheme } from "../../../context/ThemeContext";
import api from "../../../services/api";

// ── Icon map ──────────────────────────────────────────────────────────────────
const ICON_MAP = { Users, GraduationCap, FileText, Building2, AlertTriangle, TrendingUp };

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

function getFormattedDate() {
  return new Date().toLocaleDateString("en-IN", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

function getStatusBadge(status) {
  switch (status) {
    case "Ongoing":
      return "bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded text-[10px] font-medium";
    case "Completed":
      return "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-medium";
    default:
      return "bg-slate-500/10 text-slate-400 border border-slate-500/20 px-2 py-0.5 rounded text-[10px] font-medium";
  }
}

function getRoleTag(role) {
  switch (role) {
    case "Teacher":
      return "bg-violet-500/10 text-violet-400 border border-violet-500/20 px-2 py-0.5 rounded text-[10px] font-medium";
    case "Student":
      return "bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded text-[10px] font-medium";
    default:
      return "bg-slate-500/10 text-slate-400 border border-slate-500/20 px-2 py-0.5 rounded text-[10px] font-medium";
  }
}

// ── Shadcn-UI Inspired Sub-components ─────────────────────────────────────────

function Panel({ children, className = "" }) {
  return (
    <div className={`rounded-xl border border-white/10 bg-white/[0.02] text-slate-50 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function SectionHeading({ children }) {
  return (
    <h3 className="font-semibold leading-none tracking-tight text-slate-50 mb-4">
      {children}
    </h3>
  );
}

function DeltaBadge({ delta, deltaType }) {
  if (deltaType === "positive") return (
    <span className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-400">
      <ArrowUpRight size={14} />{delta}
    </span>
  );
  if (deltaType === "negative") return (
    <span className="inline-flex items-center gap-0.5 text-xs font-medium text-red-400">
      <ArrowDownRight size={14} />{delta}
    </span>
  );
  return (
    <span className="inline-flex items-center gap-0.5 text-xs font-medium text-slate-400">
      <Minus size={14} />{delta}
    </span>
  );
}

// ── Fixed Core Shadcn Card Primitives ─────────────────────────────────────────

// ── Fixed Precise Shadcn KPI Cards ───────────────────────────────────────────
function StatCard({ stat }) {
  const Icon = ICON_MAP[stat.icon] || Activity;
  return (
    <Card>
      {/* Tight header: p-6 pb-2 */}
      <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
        <h3 className="tracking-tight text-sm font-medium text-[var(--muted-foreground)]">
          {stat.label}
        </h3>
        <Icon className="h-4 w-4 text-[var(--muted-foreground)]" />
      </div>
      {/* Content: p-6 pt-0 */}
      <div className="p-6 pt-0">
        {/* Using var(--fg) ensures the number is dark in light mode and light in dark mode */}
        <div className="text-2xl font-bold text-[var(--fg)] tracking-tight">
          {stat.value}
        </div>
        <p className="text-xs mt-1 flex items-center gap-1">
          <DeltaBadge delta={stat.delta} deltaType={stat.deltaType} />
          <span className="text-[var(--muted-foreground)]">
             {stat.key === 'attendance' ? 'vs yesterday' : 'vs last month'}
          </span>
        </p>
      </div>
    </Card>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-[#0f172a] px-3 py-2 text-sm shadow-md text-slate-50">
      <p className="font-medium mb-1.5 text-slate-300">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: entry.color }} />
          <span className="text-slate-400">{entry.name}:</span>
          <span className="font-medium text-slate-50">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}
function DonutLegend({ data }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4">
      {data.map(d => (
        <div key={d.name} className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
          <span className="text-xs text-slate-400 truncate">{d.name}</span>
          <span className="text-xs font-medium text-slate-50 ml-auto shrink-0">{d.studentCount}</span>
        </div>
      ))}
    </div>
  );
}

// ── Skeleton loader ───────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 flex flex-col gap-3 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-3 w-24 rounded bg-white/10" />
        <div className="h-4 w-4 rounded bg-white/10" />
      </div>
      <div className="h-8 w-16 rounded bg-white/10 mt-1" />
      <div className="h-3 w-32 rounded bg-white/5" />
    </div>
  );
}
// ── MAIN DASHBOARD ────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { isDark } = useTheme();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Dashboard data state
  const [stats, setStats] = useState(null);
  const [upcomingExams, setUpcomingExams] = useState([]);
  const [departmentDistribution, setDepartmentDistribution] = useState([]);
  const [topStudents, setTopStudents] = useState([]);
  const [enrollmentTrend, setEnrollmentTrend] = useState([]);
  const [attendanceTrend, setAttendanceTrend] = useState([]);
  const [examPerformance, setExamPerformance] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await api.get("/admin/dashboard/overview", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const d = res.data;
        setStats(d.stats);
        setUpcomingExams(d.upcomingExams || []);
        setDepartmentDistribution(d.departmentDistribution || []);
        setTopStudents(d.topStudents || []);
        setEnrollmentTrend(d.enrollmentTrend || []);
        setAttendanceTrend(d.attendanceTrend || []);
        setExamPerformance(d.examPerformance || []);
        setRecentActivity(d.recentActivity || []);
      } catch (err) {
        console.error("Dashboard overview fetch failed:", err);
        setError(err.response?.data?.message || "Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };
    fetchOverview();
  }, []);

  // ── Build platformStats from real API data ──────────────────────────────────
  const platformStats = stats
    ? [
      { key: "students", label: "Total Students", value: stats.totalStudents, delta: "Live", deltaType: "neutral", icon: "Users", accentColor: "violet" },
      { key: "teachers", label: "Active Teachers", value: stats.activeTeachers, delta: "Live", deltaType: "neutral", icon: "GraduationCap", accentColor: "violet" },
      { key: "exams", label: "Active Exams", value: stats.currentExams, delta: "Live", deltaType: stats.currentExams > 0 ? "positive" : "neutral", icon: "FileText", accentColor: "violet" },
      { key: "avg", label: "Avg Score", value: `${stats.avgSessionalMarks}`, delta: "All Time", deltaType: "neutral", icon: "TrendingUp", accentColor: "violet" },
      { key: "attendance", label: "Today's Attendance", value: `${stats.attendancePercentage}%`, delta: "Today", deltaType: parseFloat(stats.attendancePercentage) >= 75 ? "positive" : "negative", icon: "Building2", accentColor: "violet" },
      { key: "violations", label: "UFM Violations", value: stats.totalViolations, delta: "All Time", deltaType: stats.totalViolations > 0 ? "negative" : "neutral", icon: "AlertTriangle", accentColor: stats.totalViolations > 0 ? "red" : "violet" },
    ]
    : [];

  // ── CSS variable injection ──────────────────────────────────────────────────
  const cssVars = useMemo(() => ({
    "--panel-bg": isDark ? "#0f1117" : "#ffffff",
    "--border": isDark ? "rgb(39,39,42)" : "rgb(228,228,231)",
    "--fg": isDark ? "#f4f4f5" : "#18181b",
    "--muted": isDark ? "#71717a" : "#71717a",
  }), [isDark]);

  const chartTheme = {
    grid: isDark ? "#27272a" : "#f4f4f5",
    axis: isDark ? "#52525b" : "#a1a1aa",
  };

  const adminName = (() => {
    try { return JSON.parse(localStorage.getItem("user"))?.name || "Admin"; }
    catch { return "Admin"; }
  })();

  // ── Scheduled exams count for subtitle ─────────────────────────────────────
  const scheduledCount = stats?.currentExams || 0;

  return (
    <div
      className="p-6 space-y-6 max-w-[1600px] mx-auto min-h-screen transition-colors duration-150"
      style={{ fontFamily: "'DM Sans', sans-serif", ...cssVars }}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-bold tracking-tight text-slate-50">
            {getGreeting()}, <span className="text-slate-50">{adminName}</span> 👋
          </h1>
          <p className="text-sm text-slate-400 flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${loading ? "bg-amber-500" : "bg-emerald-500 animate-pulse"}`} />
            {loading
              ? "Loading dashboard data..."
              : scheduledCount > 0
                ? `AcademiQ is running — ${scheduledCount} exam${scheduledCount > 1 ? "s" : ""} active`
                : "AcademiQ is running — no active exams right now"}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-slate-400 bg-white/[0.02] border border-white/10 px-4 py-2 rounded-md shadow-sm">
          <CalendarDays size={16} className="text-slate-400" />
          {getFormattedDate()}
        </div>
      </div>

      {/* ── Error Banner ───────────────────────────────────────────────────── */}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          ⚠ {error}
        </div>
      )}

      {/* ── Stat Cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : platformStats.map(stat => <StatCard key={stat.key} stat={stat} />)
        }
      </div>

      {/* ── Charts Row 1: Enrollment Trend + Department Donut ──────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Panel className="lg:col-span-2 p-5">
          <SectionHeading>Student Enrollment Trend</SectionHeading>
          {loading ? (
            <div className="h-[240px] flex items-center justify-center text-[var(--muted)]">
              <Loader2 size={24} className="animate-spin" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={enrollmentTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradNew" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} vertical={false} />
                <XAxis dataKey="month" tick={{ fill: chartTheme.axis, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: chartTheme.axis, fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={props => <CustomTooltip {...props} isDark={isDark} />} />
                <Area type="monotone" dataKey="totalActive" name="Total Active" stroke="#8b5cf6" strokeWidth={2} fill="url(#gradTotal)" dot={false} activeDot={{ r: 4 }} />
                <Area type="monotone" dataKey="newEnrollments" name="New Enrollments" stroke="#06b6d4" strokeWidth={2} fill="url(#gradNew)" dot={false} activeDot={{ r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Panel>

        <Panel className="p-5 flex flex-col">
          <SectionHeading>Department Distribution</SectionHeading>
          {loading ? (
            <div className="h-[200px] flex items-center justify-center text-[var(--muted)]">
              <Loader2 size={24} className="animate-spin" />
            </div>
          ) : departmentDistribution.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-[var(--muted)] text-sm">
              No department data yet
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={departmentDistribution} cx="50%" cy="50%" innerRadius={55} outerRadius={80}
                    dataKey="studentCount" strokeWidth={0} paddingAngle={3}>
                    {departmentDistribution.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip content={props => <CustomTooltip {...props} isDark={isDark} />} formatter={v => [v, "Students"]} />
                </PieChart>
              </ResponsiveContainer>
              <DonutLegend data={departmentDistribution} />
            </>
          )}
        </Panel>
      </div>

      {/* ── Charts Row 2: Attendance + Exam Performance ────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel className="p-5">
          <SectionHeading>Attendance Trend (This Week)</SectionHeading>
          {loading ? (
            <div className="h-[230px] flex items-center justify-center text-[var(--muted)]"><Loader2 size={24} className="animate-spin" /></div>
          ) : (
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={attendanceTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }} barGap={3}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} vertical={false} />
                <XAxis dataKey="day" tick={{ fill: chartTheme.axis, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: chartTheme.axis, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                <Tooltip content={props => <CustomTooltip {...props} isDark={isDark} />} />
                <Bar dataKey="studentAttendance" name="Students" fill="#8b5cf6" radius={[3, 3, 0, 0]} maxBarSize={14} />
                <Bar dataKey="overall" name="Overall" fill="#10b981" radius={[3, 3, 0, 0]} maxBarSize={14} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Panel>

        <Panel className="p-5">
          <SectionHeading>Exam Performance Summary</SectionHeading>
          {loading ? (
            <div className="h-[230px] flex items-center justify-center text-[var(--muted)]"><Loader2 size={24} className="animate-spin" /></div>
          ) : examPerformance.length === 0 ? (
            <div className="h-[230px] flex items-center justify-center text-[var(--muted)] text-sm">No exam results yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={230}>
              <LineChart data={examPerformance} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} vertical={false} />
                <XAxis dataKey="examName" tick={{ fill: chartTheme.axis, fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: chartTheme.axis, fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={props => <CustomTooltip {...props} isDark={isDark} />} />
                <ReferenceLine y={40} stroke="#ef4444" strokeDasharray="4 3"
                  label={{ value: "Pass Threshold", position: "insideTopRight", fill: "#ef4444", fontSize: 10 }} />
                <Line type="monotone" dataKey="averageScore" name="Avg Score" stroke="#8b5cf6" strokeWidth={2.5}
                  dot={{ r: 4, fill: "#8b5cf6", strokeWidth: 0 }} activeDot={{ r: 5, fill: "#a78bfa" }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Panel>
      </div>

      {/* ── Bottom Row: Activity + Upcoming Exams + Top Students ───────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Panel className="p-5 flex flex-col">
          <SectionHeading>Recent Activity</SectionHeading>
          {loading ? (
            <div className="flex items-center justify-center h-40 text-[var(--muted)]"><Loader2 size={20} className="animate-spin" /></div>
          ) : recentActivity.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-[var(--muted)] text-sm">No activity logs yet</div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-3 max-h-72 scrollbar-hide pr-1">
              {recentActivity.map(item => (
                <div key={item.id} className="flex items-start gap-3 rounded-lg p-2 hover:bg-violet-500/5 transition-all">
                  <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${item.dotColor}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[var(--fg)] leading-snug line-clamp-2">{item.action}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${getRoleTag(item.role)}`}>{item.role}</span>
                      <span className="text-[10px] text-[var(--muted)]">{item.timestamp}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        {/* Upcoming Exams */}
        <Panel className="p-5 flex flex-col">
          <SectionHeading>Upcoming Exams</SectionHeading>
          {loading ? (
            <div className="flex items-center justify-center h-40 text-[var(--muted)]"><Loader2 size={20} className="animate-spin" /></div>
          ) : upcomingExams.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-[var(--muted)] text-sm">No upcoming exams scheduled</div>
          ) : (
            <div className="flex-1 space-y-3 overflow-y-auto max-h-72 scrollbar-hide pr-1">
              {upcomingExams.map((exam, i) => (
                <div key={i} className="flex items-start justify-between gap-3 p-2 rounded-lg hover:bg-violet-500/5 transition-all">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[var(--fg)] truncate">{exam.name}</p>
                    <p className="text-[10px] text-[var(--muted)] mt-0.5">{exam.subject}</p>
                    <p className="text-[10px] text-[var(--muted)]">{exam.date} · {exam.time}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold shrink-0 ${getStatusBadge(exam.status)}`}>
                    {exam.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Panel>

        {/* Top Students */}
        <Panel className="p-5 flex flex-col">
          <SectionHeading>Top Performing Students</SectionHeading>
          {loading ? (
            <div className="flex items-center justify-center h-40 text-[var(--muted)]"><Loader2 size={20} className="animate-spin" /></div>
          ) : topStudents.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-[var(--muted)] text-sm">No exam results to rank yet</div>
          ) : (
            <div className="flex-1 space-y-4 overflow-y-auto max-h-72 scrollbar-hide pr-1">
              {topStudents.map(student => (
                <div key={student.rank} className="space-y-1.5">
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0
                      ${student.rank === 1 ? "bg-amber-500/20 text-amber-400"
                        : student.rank === 2 ? "bg-zinc-400/15 text-zinc-400"
                          : student.rank === 3 ? "bg-orange-400/15 text-orange-400"
                            : "bg-violet-500/10 text-violet-400"}`}>
                      {student.rank}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[var(--fg)] truncate">{student.name}</p>
                      <p className="text-[10px] text-[var(--muted)]">{student.department}</p>
                    </div>
                    <span className="text-xs font-bold text-violet-400 shrink-0">{student.avgScore}%</span>
                  </div>
                  <div className="h-1 rounded-full bg-[var(--border)] overflow-hidden ml-9">
                    <div className="h-full rounded-full bg-violet-500 transition-all duration-500"
                      style={{ width: `${student.avgScore}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}