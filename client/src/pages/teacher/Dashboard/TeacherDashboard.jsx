// client/src/pages/teacher/Dashboard/TeacherDashboard.jsx
import React, { useEffect, useState, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import {
  Users, BookOpen, FileText, CheckCircle2, CalendarDays,
  ArrowUpRight, ArrowDownRight, Minus, Loader2, Timer,
  ClipboardList, Activity, XCircle,
} from "lucide-react";
import api from "../../../services/api";
import { useTheme } from "../../../context/ThemeContext";

// ── Helpers ───────────────────────────────────────────────────────────────────
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

const daysUntil = (d) => {
  const days = Math.floor((new Date(d) - new Date()) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `In ${days}d`;
};

const scoreColor = (p) =>
  p >= 75 ? "#10b981" : p >= 50 ? "#f59e0b" : "#ef4444";

// ── Sub-components ────────────────────────────────────────────────────────────
function Panel({ children, className = "" }) {
  const { isDark } = useTheme();
  return (
    <div className={`rounded-xl border transition-all duration-200 
      ${isDark
        ? "border-white/10 bg-white/[0.02] shadow-sm"
        : "border-zinc-200 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.06),0_1px_3px_rgb(0,0,0,0.02)]"}
      ${className}`}>
      {children}
    </div>
  );
}

function SectionHeading({ children }) {
  const { isDark } = useTheme();
  return (
    <h3 className={`font-bold uppercase text-xs tracking-widest mb-4
      ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
      {children}
    </h3>
  );
}

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

function CustomTooltip({ active, payload, label }) {
  const { isDark } = useTheme();
  if (!active || !payload?.length) return null;
  return (
    <div className={`rounded-lg border px-3 py-2 text-sm shadow-xl
      ${isDark ? "border-white/10 bg-[#0f172a] text-slate-50" : "border-zinc-200 bg-white text-zinc-900"}`}>
      <p className={`font-bold mb-1.5 ${isDark ? "text-slate-300" : "text-zinc-500"}`}>{label}</p>
      {payload.map((e, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: e.color }} />
          <span className={isDark ? "text-slate-400" : "text-zinc-500"}>{e.name}:</span>
          <span className="font-black">{e.value}{e.name === "Avg Score" ? "%" : ""}</span>
        </div>
      ))}
    </div>
  );
}

function StatCard({ label, value, sub, icon: Icon, deltaType }) {
  const { isDark } = useTheme();
  const deltaIcon =
    deltaType === "positive" ? <ArrowUpRight size={13} className="text-emerald-400" /> :
    deltaType === "negative" ? <ArrowDownRight size={13} className="text-red-500" /> :
    <Minus size={13} className="text-slate-400" />;

  return (
    <Panel className="p-6">
      <div className="flex flex-row items-center justify-between pb-2">
        <h3 className="tracking-tight text-sm font-medium text-zinc-400">{label}</h3>
        <Icon className="h-4 w-4 text-zinc-400" />
      </div>
      <div className="pt-0">
        <div className={`text-2xl font-bold tracking-tight ${isDark ? "text-slate-50" : "text-zinc-900"}`}>
          {value}
        </div>
        <div className="text-xs mt-1 flex items-center gap-1">
          {deltaIcon}
          <span className="text-zinc-500">{sub}</span>
        </div>
      </div>
    </Panel>
  );
}

function ExamCard({ exam }) {
  const { isDark } = useTheme();
  return (
    <div className={`flex items-center justify-between p-4 rounded-xl border transition-all
      ${isDark ? "border-white/5 hover:bg-white/5" : "border-zinc-100 bg-zinc-50 hover:bg-white shadow-sm"}`}>
      <div className="flex items-center gap-4 min-w-0">
        <div className={`p-2 rounded-full ${isDark ? "bg-violet-500/20 text-violet-400" : "bg-violet-100 text-violet-600"}`}>
          <Timer size={16} />
        </div>
        <div className="min-w-0">
          <p className={`text-xs font-black truncate ${isDark ? "text-white" : "text-zinc-900"}`}>
            {exam.title}
          </p>
          <p className="text-[10px] text-zinc-500 font-bold uppercase">
            {exam.type} • {exam.duration_minutes}m
          </p>
          <p className="text-[10px] opacity-60 mt-0.5 font-bold">
            {new Date(exam.scheduled_start_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
            {" @ "}
            {new Date(exam.scheduled_start_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0 ml-4">
        <span className="text-[9px] font-black px-3 py-1 rounded-full border shadow-sm border-violet-500/30 bg-violet-500 text-white">
          {daysUntil(exam.scheduled_start_at)}
        </span>
      </div>
    </div>
  );
}

function RecentSubmissionCard({ submission }) {
  const { isDark } = useTheme();
  const passed = submission.score >= 40;
  return (
    <div className={`flex items-center justify-between p-4 rounded-xl border transition-all
      ${isDark ? "border-white/5 hover:bg-white/5" : "border-zinc-100 bg-zinc-50 hover:bg-white shadow-sm"}`}>
      <div className="flex items-center gap-4 min-w-0">
        <div className={`p-2 rounded-full ${passed
          ? isDark ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-100 text-emerald-600"
          : isDark ? "bg-red-500/20 text-red-400" : "bg-red-100 text-red-600"
        }`}>
          {passed ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
        </div>
        <div className="min-w-0">
          <p className={`text-xs font-black truncate ${isDark ? "text-white" : "text-zinc-900"}`}>
            {submission.student_name}
          </p>
          <p className="text-[10px] text-zinc-500 font-bold uppercase truncate">
            {submission.exam_title}
          </p>
        </div>
      </div>
      <div className="shrink-0 ml-4">
        <span className={`text-[9px] font-black px-3 py-1 rounded-full border shadow-sm
          ${passed
            ? "border-emerald-500/30 bg-emerald-500 text-white"
            : "border-red-500/30 bg-red-500 text-white"
          }`}>
          {submission.score ?? "N/A"}%
        </span>
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function TeacherDashboard() {
  const { isDark } = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Session expired. Please login again.");
          setLoading(false);
          return;
        }
        const res = await api.get("/teacher/dashboard/overview", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setData(res.data);
      } catch (err) {
        console.error("Teacher Dashboard Error:", err);
        setError(err.response?.data?.message || "Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const cssVars = useMemo(() => ({
    "--panel-bg": isDark ? "#0f1117" : "#ffffff",
    "--border":   isDark ? "rgb(39,39,42)" : "rgb(228,228,231)",
    "--fg":       isDark ? "#f4f4f5" : "#18181b",
  }), [isDark]);

  const chartTheme = {
    grid: isDark ? "#27272a" : "#e4e4e7",
    axis: isDark ? "#52525b" : "#71717a",
  };

  const teacherName = data?.teacher?.full_name || "Teacher";

  // Bar chart: avg score per subject
  const barData = (data?.subject_stats || []).map(s => ({
    name: s.code || (s.name ? s.name.slice(0, 8) : "N/A"),
    fullName: s.name || "Unknown",
    "Avg Score": s.avg_score || 0,
  }));

  const stats = data?.stats;

  return (
    <div
      className={`p-4 md:p-8 space-y-8 max-w-[1600px] mx-auto min-h-screen transition-all duration-300
        ${isDark ? "bg-[#09090b]" : "bg-[#f8f9fa]"}`}
      style={{ fontFamily: "'DM Sans', sans-serif", ...cssVars }}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div className="space-y-2">
          <h1 className={`text-3xl md:text-4xl font-black tracking-tighter ${isDark ? "text-white" : "text-zinc-900"}`}>
            {getGreeting()},{" "}
            <span className="text-violet-500">{teacherName}</span> 👋
          </h1>
          <div className="text-sm font-medium text-zinc-500 flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${loading ? "bg-amber-500" : "bg-emerald-500 animate-pulse"}`} />
            {loading ? "Syncing dashboard..." : `AcademiQ • Teacher Portal`}
          </div>
        </div>
        <div className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest px-4 py-2 rounded-lg border
          ${isDark ? "bg-white/5 border-white/10 text-zinc-400" : "bg-white border-zinc-200 text-zinc-500 shadow-sm"}`}>
          <CalendarDays size={14} />
          {getFormattedDate()}
        </div>
      </div>

      {/* ── Error Banner ───────────────────────────────────────────────────── */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-500 font-bold flex items-center gap-2">
          <XCircle size={16} /> {error}
        </div>
      )}

      {/* ── Stat Cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading || !data
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : (
            <>
              <StatCard
                label="My Students"
                value={stats?.totalStudents ?? 0}
                icon={Users}
                sub="Across all subjects"
                deltaType="neutral"
              />
              <StatCard
                label="Assigned Subjects"
                value={stats?.assignedSubjects ?? 0}
                icon={BookOpen}
                sub="Active courses"
                deltaType="neutral"
              />
              <StatCard
                label="Total Exams"
                value={stats?.totalExams ?? 0}
                icon={FileText}
                sub="Created by you"
                deltaType={stats?.totalExams > 0 ? "positive" : "neutral"}
              />
              <StatCard
                label="Completed Exams"
                value={stats?.completedExams ?? 0}
                icon={CheckCircle2}
                sub={`${stats?.totalExams ? Math.round((stats.completedExams / stats.totalExams) * 100) : 0}% completion rate`}
                deltaType={stats?.completedExams > 0 ? "positive" : "neutral"}
              />
            </>
          )
        }
      </div>

      {/* ── Charts Row ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Subject-wise Avg Score Bar Chart */}
        <Panel className="p-8">
          <SectionHeading>Subject Performance (Avg Score)</SectionHeading>
          {loading || !data ? (
            <div className="h-[240px] flex items-center justify-center">
              <Loader2 className="animate-spin text-violet-500" />
            </div>
          ) : barData.length === 0 ? (
            <div className="h-[240px] flex flex-col items-center justify-center gap-3 text-zinc-500">
              <Activity className="w-10 h-10 opacity-20" />
              <p className="text-sm font-bold uppercase tracking-widest">No data available</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} vertical={false} />
                <XAxis dataKey="name" tick={{ fill: chartTheme.axis, fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: chartTheme.axis, fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
                <Bar dataKey="Avg Score" radius={[6, 6, 6, 6]} barSize={35}>
                  {barData.map((entry, i) => (
                    <Cell key={i} fill={scoreColor(entry["Avg Score"])} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Panel>

        {/* Quick Stats Panel */}
        <Panel className="p-8">
          <SectionHeading>At a Glance</SectionHeading>
          {loading || !data ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-12 rounded-xl animate-pulse bg-white/5" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  label: "Pending Reviews",
                  value: stats?.pendingReviews ?? 0,
                  icon: ClipboardList,
                  color: isDark ? "bg-amber-500/10 text-amber-400" : "bg-amber-50 text-amber-600",
                },
                {
                  label: "Upcoming Exams",
                  value: stats?.upcomingExams ?? 0,
                  icon: Timer,
                  color: isDark ? "bg-violet-500/10 text-violet-400" : "bg-violet-50 text-violet-600",
                },
                {
                  label: "Avg Score (All)",
                  value: stats?.avgScore != null ? `${stats.avgScore}%` : "N/A",
                  icon: Activity,
                  color: isDark ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-600",
                },
                {
                  label: "Pass Rate",
                  value: stats?.passRate != null ? `${stats.passRate}%` : "N/A",
                  icon: CheckCircle2,
                  color: isDark ? "bg-blue-500/10 text-blue-400" : "bg-blue-50 text-blue-600",
                },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className={`rounded-xl p-4 border flex items-center gap-3
                  ${isDark ? "border-white/5 bg-white/[0.02]" : "border-zinc-100 bg-zinc-50"}`}>
                  <div className={`p-2 rounded-lg ${color}`}>
                    <Icon size={16} />
                  </div>
                  <div>
                    <p className="text-lg font-black text-zinc-900 dark:text-white">{value}</p>
                    <p className="text-[10px] font-bold uppercase text-zinc-500 mt-0.5">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      {/* ── Bottom Row ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-10">
        {/* Upcoming Exams */}
        <Panel className="p-8 flex flex-col">
          <SectionHeading>Upcoming Exams</SectionHeading>
          {loading || !data ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-14 rounded-xl bg-white/[0.03] animate-pulse" />)}
            </div>
          ) : !data?.upcoming_exams?.length ? (
            <div className="flex-1 flex flex-col items-center justify-center py-10 text-zinc-500 gap-3">
              <Timer className="w-12 h-12 opacity-10" />
              <p className="text-sm font-bold uppercase tracking-widest">No Upcoming Exams</p>
            </div>
          ) : (
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[360px] pr-2">
              {data.upcoming_exams.map(exam => (
                <ExamCard key={exam.id} exam={exam} />
              ))}
            </div>
          )}
        </Panel>

        {/* Recent Submissions */}
        <Panel className="p-8 flex flex-col">
          <SectionHeading>Recent Submissions</SectionHeading>
          {loading || !data ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-14 rounded-xl bg-white/[0.03] animate-pulse" />)}
            </div>
          ) : !data?.recent_submissions?.length ? (
            <div className="flex-1 flex flex-col items-center justify-center py-10 text-zinc-500 gap-3">
              <ClipboardList className="w-12 h-12 opacity-10" />
              <p className="text-sm font-bold uppercase tracking-widest">No Submissions Yet</p>
            </div>
          ) : (
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[360px] pr-2">
              {data.recent_submissions.map(sub => (
                <RecentSubmissionCard key={sub.id} submission={sub} />
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}