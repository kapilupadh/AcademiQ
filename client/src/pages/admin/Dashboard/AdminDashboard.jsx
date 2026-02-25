import React, { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
  LineChart,
  Line,
  ReferenceLine,
} from "recharts";
import {
  Users,
  GraduationCap,
  FileText,
  Building2,
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  CalendarDays,
  Activity,
} from "lucide-react";

import { useTheme } from "../../../context/ThemeContext";

// ── Import all demo data — replace with real API calls later ───────────────────
import {
  platformStats,
  enrollmentTrend,
  departmentDistribution,
  attendanceTrend,
  examPerformance,
  recentActivity,
  upcomingExams,
  topStudents,
} from "../../../demo-data/demo-data-admin";

// ── Icon map (string → Lucide component) ──────────────────────────────────────
const ICON_MAP = {
  Users,
  GraduationCap,
  FileText,
  Building2,
  AlertTriangle,
  TrendingUp,
};

// ── Greeting based on time of day ─────────────────────────────────────────────
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

// ── Format today's full date ───────────────────────────────────────────────────
function getFormattedDate() {
  return new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ── Exam status badge style ────────────────────────────────────────────────────
function getStatusBadge(status) {
  switch (status) {
    case "Ongoing":
      return "bg-amber-500/15 text-amber-400 border border-amber-500/30";
    case "Completed":
      return "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30";
    case "Scheduled":
    default:
      return "bg-violet-500/15 text-violet-400 border border-violet-500/30";
  }
}

// ── Role tag style ─────────────────────────────────────────────────────────────
function getRoleTag(role) {
  switch (role) {
    case "Teacher":
      return "bg-teal-500/15 text-teal-400 border border-teal-500/20";
    case "Student":
      return "bg-sky-500/15 text-sky-400 border border-sky-500/20";
    case "Admin":
    default:
      return "bg-violet-500/15 text-violet-400 border border-violet-500/20";
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

/* ── Section panel wrapper ─────────────────────────────────────────────────── */
function Panel({ children, className = "" }) {
  return (
    <div
      className={`rounded-xl border bg-[var(--panel-bg)] border-[var(--border)] shadow-sm
        transition-all duration-150 hover:shadow-md hover:border-violet-500/20 ${className}`}
    >
      {children}
    </div>
  );
}

/* ── Section heading ──────────────────────────────────────────────────────── */
function SectionHeading({ children }) {
  return (
    <p className="text-xs font-bold uppercase tracking-widest text-[var(--muted)] mb-4">
      {children}
    </p>
  );
}

/* ── Delta badge (positive / negative / neutral) ─────────────────────────── */
function DeltaBadge({ delta, deltaType }) {
  if (deltaType === "positive") {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold bg-emerald-500/10 text-emerald-400">
        <ArrowUpRight size={11} />
        {delta}
      </span>
    );
  }
  if (deltaType === "negative") {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold bg-red-500/10 text-red-400">
        <ArrowDownRight size={11} />
        {delta}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold bg-zinc-500/10 text-zinc-400">
      <Minus size={11} />
      {delta}
    </span>
  );
}

/* ── Stat Card ─────────────────────────────────────────────────────────────── */
function StatCard({ stat }) {
  const Icon = ICON_MAP[stat.icon] || Activity;
  const isRed = stat.accentColor === "red";

  return (
    <div
      className={`relative rounded-xl border border-[var(--border)] bg-[var(--panel-bg)]
        p-5 flex flex-col gap-3 transition-all duration-150
        hover:shadow-md hover:border-violet-500/30 overflow-hidden
        ${isRed ? "border-l-4 border-l-red-500" : "border-l-4 border-l-violet-500"}`}
    >
      {/* Icon */}
      <div
        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0
          ${isRed ? "bg-red-500/10 text-red-400" : "bg-violet-500/10 text-violet-400"}`}
      >
        <Icon size={18} strokeWidth={1.8} />
      </div>

      {/* Label */}
      <p className="text-xs font-medium text-[var(--muted)] leading-tight">
        {stat.label}
      </p>

      {/* Value + Delta */}
      <div className="flex items-end justify-between gap-2">
        <span className="text-2xl font-bold text-[var(--fg)] leading-none">
          {stat.value}
        </span>
        <DeltaBadge delta={stat.delta} deltaType={stat.deltaType} />
      </div>
    </div>
  );
}

/* ── Custom Recharts Tooltip ──────────────────────────────────────────────── */
function CustomTooltip({ active, payload, label, isDark }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div
      className={`rounded-lg border px-3 py-2 text-xs shadow-xl
        ${
          isDark
            ? "bg-zinc-900 border-zinc-700 text-white"
            : "bg-white border-zinc-200 text-zinc-900"
        }`}
    >
      <p className="font-semibold mb-1 text-violet-400">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ background: entry.color }}
          />
          <span className="text-[var(--muted)]">{entry.name}:</span>
          <span className="font-semibold" style={{ color: entry.color }}>
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── Donut Legend ─────────────────────────────────────────────────────────── */
function DonutLegend({ data }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4">
      {data.map((d) => (
        <div key={d.name} className="flex items-center gap-2 min-w-0">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ background: d.color }}
          />
          <span className="text-xs text-[var(--muted)] truncate">{d.name}</span>
          <span className="text-xs font-semibold text-[var(--fg)] ml-auto shrink-0">
            {d.studentCount}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { isDark } = useTheme();

  // ── CSS variable injection for panel colours ────────────────────────────────
  // These map onto the dark/light native tokens already on :root / .dark
  // We just alias them to component-friendly names so every Panel reads them.
  const cssVars = useMemo(
    () => ({
      "--panel-bg": isDark ? "#0f1117" : "#ffffff",
      "--border": isDark ? "rgb(39,39,42)" : "rgb(228,228,231)",
      "--fg": isDark ? "#f4f4f5" : "#18181b",
      "--muted": isDark ? "#71717a" : "#71717a",
    }),
    [isDark],
  );

  // ── Chart theme colours ─────────────────────────────────────────────────────
  const chartTheme = {
    grid: isDark ? "#27272a" : "#f4f4f5",
    axis: isDark ? "#52525b" : "#a1a1aa",
    tooltip: isDark
      ? { bg: "#18181b", border: "#3f3f46", text: "#f4f4f5" }
      : { bg: "#ffffff", border: "#e4e4e7", text: "#18181b" },
  };

  // ── Read admin name from localStorage ──────────────────────────────────────
  const adminName = (() => {
    try {
      const user = JSON.parse(localStorage.getItem("user")) || {};
      return user.name || "Admin";
    } catch {
      return "Admin";
    }
  })();

  return (
    <div
      className="p-6 space-y-6 max-w-[1600px] mx-auto min-h-screen transition-colors duration-150"
      style={{ fontFamily: "'DM Sans', sans-serif", ...cssVars }}
    >
      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 1 — Greeting Header
          Replace: read admin info from auth context / API
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--fg)] leading-tight">
            {getGreeting()},{" "}
            <span className="text-violet-500">{adminName}</span> 👋
          </h1>
          <p className="mt-1.5 text-sm text-[var(--muted)]">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              AcademiQ is running smoothly — 3 exams scheduled this week
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-[var(--muted)] shrink-0">
          <CalendarDays size={15} className="text-violet-400" />
          {getFormattedDate()}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 2 — Stats Cards Row
          Replace: platformStats from GET /api/admin/dashboard/stats
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {platformStats.map((stat) => (
          <StatCard key={stat.key} stat={stat} />
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 3 — Charts Row 1: Enrollment Trend + Department Donut
          Replace: enrollmentTrend, departmentDistribution from API
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Area Chart: Student Enrollment Trend ── */}
        <Panel className="lg:col-span-2 p-5">
          <SectionHeading>Student Enrollment Trend</SectionHeading>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart
              data={enrollmentTrend}
              margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
            >
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
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={chartTheme.grid}
                vertical={false}
              />
              <XAxis
                dataKey="month"
                tick={{ fill: chartTheme.axis, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: chartTheme.axis, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={(props) => (
                  <CustomTooltip {...props} isDark={isDark} />
                )}
              />
              <Area
                type="monotone"
                dataKey="totalActive"
                name="Total Active"
                stroke="#8b5cf6"
                strokeWidth={2}
                fill="url(#gradTotal)"
                dot={false}
                activeDot={{ r: 4, fill: "#8b5cf6" }}
              />
              <Area
                type="monotone"
                dataKey="newEnrollments"
                name="New Enrollments"
                stroke="#06b6d4"
                strokeWidth={2}
                fill="url(#gradNew)"
                dot={false}
                activeDot={{ r: 4, fill: "#06b6d4" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>

        {/* ── Donut Chart: Department Distribution ── */}
        <Panel className="p-5 flex flex-col">
          <SectionHeading>Department Distribution</SectionHeading>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={departmentDistribution}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                dataKey="studentCount"
                strokeWidth={0}
                paddingAngle={3}
              >
                {departmentDistribution.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                content={(props) => (
                  <CustomTooltip {...props} isDark={isDark} />
                )}
                formatter={(value) => [value, "Students"]}
              />
            </PieChart>
          </ResponsiveContainer>
          <DonutLegend data={departmentDistribution} />
        </Panel>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 4 — Charts Row 2: Attendance Bar + Exam Performance Line
          Replace: attendanceTrend, examPerformance from API
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Bar Chart: Attendance by Day ── */}
        <Panel className="p-5">
          <SectionHeading>Attendance Trend (This Week)</SectionHeading>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart
              data={attendanceTrend}
              margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
              barGap={3}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={chartTheme.grid}
                vertical={false}
              />
              <XAxis
                dataKey="day"
                tick={{ fill: chartTheme.axis, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: chartTheme.axis, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                content={(props) => (
                  <CustomTooltip {...props} isDark={isDark} />
                )}
              />
              <Bar
                dataKey="studentAttendance"
                name="Students"
                fill="#8b5cf6"
                radius={[3, 3, 0, 0]}
                maxBarSize={14}
              />
              <Bar
                dataKey="teacherAttendance"
                name="Teachers"
                fill="#06b6d4"
                radius={[3, 3, 0, 0]}
                maxBarSize={14}
              />
              <Bar
                dataKey="overall"
                name="Overall"
                fill="#10b981"
                radius={[3, 3, 0, 0]}
                maxBarSize={14}
              />
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        {/* ── Line Chart: Exam Performance ── */}
        <Panel className="p-5">
          <SectionHeading>Exam Performance Summary</SectionHeading>
          <ResponsiveContainer width="100%" height={230}>
            <LineChart
              data={examPerformance}
              margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={chartTheme.grid}
                vertical={false}
              />
              <XAxis
                dataKey="examName"
                tick={{ fill: chartTheme.axis, fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: chartTheme.axis, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={(props) => (
                  <CustomTooltip {...props} isDark={isDark} />
                )}
              />
              <ReferenceLine
                y={50}
                stroke="#ef4444"
                strokeDasharray="4 3"
                label={{
                  value: "Pass Threshold",
                  position: "insideTopRight",
                  fill: "#ef4444",
                  fontSize: 10,
                }}
              />
              <Line
                type="monotone"
                dataKey="averageScore"
                name="Avg Score"
                stroke="#8b5cf6"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "#8b5cf6", strokeWidth: 0 }}
                activeDot={{ r: 5, fill: "#a78bfa" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 5 — Bottom Three Column Row
          Replace: recentActivity, upcomingExams, topStudents from API
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* ── Column 1: Recent Activity Log ── */}
        <Panel className="p-5 flex flex-col">
          <SectionHeading>Recent Activity</SectionHeading>
          <div className="flex-1 overflow-y-auto space-y-3 max-h-72 scrollbar-hide pr-1">
            {recentActivity.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 transition-all duration-150
                  rounded-lg p-2 hover:bg-violet-500/5"
              >
                <span
                  className={`mt-1 w-2 h-2 rounded-full shrink-0 ${item.dotColor}`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[var(--fg)] leading-snug line-clamp-2">
                    {item.action}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${getRoleTag(item.role)}`}
                    >
                      {item.role}
                    </span>
                    <span className="text-[10px] text-[var(--muted)]">
                      {item.timestamp}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        {/* ── Column 2: Upcoming Exams ── */}
        <Panel className="p-5 flex flex-col">
          <SectionHeading>Upcoming Exams</SectionHeading>
          <div className="flex-1 space-y-3 overflow-y-auto max-h-72 scrollbar-hide pr-1">
            {upcomingExams.map((exam, i) => (
              <div
                key={i}
                className="flex items-start justify-between gap-3 p-2 rounded-lg
                  transition-all duration-150 hover:bg-violet-500/5"
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[var(--fg)] truncate">
                    {exam.name}
                  </p>
                  <p className="text-[10px] text-[var(--muted)] mt-0.5">
                    {exam.subject}
                  </p>
                  <p className="text-[10px] text-[var(--muted)]">
                    {exam.date} · {exam.time}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold shrink-0 ${getStatusBadge(exam.status)}`}
                >
                  {exam.status}
                </span>
              </div>
            ))}
          </div>
        </Panel>

        {/* ── Column 3: Top Performing Students ── */}
        <Panel className="p-5 flex flex-col">
          <SectionHeading>Top Performing Students</SectionHeading>
          <div className="flex-1 space-y-4 overflow-y-auto max-h-72 scrollbar-hide pr-1">
            {topStudents.map((student) => (
              <div key={student.rank} className="space-y-1.5">
                <div className="flex items-center gap-3">
                  {/* Rank badge */}
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0
                      ${
                        student.rank === 1
                          ? "bg-amber-500/20 text-amber-400"
                          : student.rank === 2
                            ? "bg-zinc-400/15 text-zinc-400"
                            : student.rank === 3
                              ? "bg-orange-400/15 text-orange-400"
                              : "bg-violet-500/10 text-violet-400"
                      }`}
                  >
                    {student.rank}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[var(--fg)] truncate">
                      {student.name}
                    </p>
                    <p className="text-[10px] text-[var(--muted)]">
                      {student.department}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-violet-400 shrink-0">
                    {student.avgScore}%
                  </span>
                </div>
                {/* Progress bar */}
                <div className="h-1 rounded-full bg-[var(--border)] overflow-hidden ml-9">
                  <div
                    className="h-full rounded-full bg-violet-500 transition-all duration-500"
                    style={{ width: `${student.avgScore}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
