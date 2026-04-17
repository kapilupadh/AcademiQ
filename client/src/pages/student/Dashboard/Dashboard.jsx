// client/src/pages/student/Dashboard/Dashboard.jsx
import React, { useEffect, useState, useMemo } from "react";
import {
  RadialBarChart, RadialBar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Cell,
} from "recharts";
import {
  BookOpen, Calendar, CalendarClock, Award, CheckCircle2,
  XCircle, Clock, ArrowUpRight, ArrowDownRight, Minus,
  Loader2, CalendarDays, Activity, Timer
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

const pctColor = (p) =>
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
    <h3 className={`font-bold leading-none tracking-tight mb-4 uppercase text-xs tracking-widest
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
          <span className="font-black">{e.value}{e.name === "Attendance" ? "%" : ""}</span>
        </div>
      ))}
    </div>
  );
}

function StatCard({ label, value, sub, icon: Icon, deltaType }) {
  const { isDark } = useTheme();
  const deltaIcon = deltaType === "positive"
    ? <ArrowUpRight size={13} className="text-emerald-400" />
    : deltaType === "negative"
    ? <ArrowDownRight size={13} className="text-red-500" />
    : <Minus size={13} className="text-slate-400" />;

  return (
    <Panel className="p-6">
      <div className="flex flex-row items-center justify-between pb-2">
        <h3 className="tracking-tight text-sm font-medium text-zinc-400">{label}</h3>
        <Icon className="h-4 w-4 text-zinc-400" />
      </div>
      <div className="pt-0">
        <div className={`text-2xl font-bold tracking-tight ${isDark ? "text-slate-50" : "text-zinc-900"}`}>{value}</div>
        <div className="text-xs mt-1 flex items-center gap-1">
          {deltaIcon}
          <span className="text-zinc-500">{sub}</span>
        </div>
      </div>
    </Panel>
  );
}

function AttendanceGauge({ percentage }) {
  const color = pctColor(percentage);
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative w-36 h-36">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%" cy="50%"
            innerRadius="70%" outerRadius="100%"
            startAngle={90} endAngle={-270}
            data={[{ value: percentage, fill: color }]}
          >
            <RadialBar dataKey="value" cornerRadius={6} background={{ fill: "rgba(0,0,0,0.05)" }} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black" style={{ color }}>{percentage}%</span>
          <span className="text-xs text-zinc-500 mt-0.5 font-bold">Stats</span>
        </div>
      </div>
      <p className={`text-[11px] font-black uppercase tracking-widest mt-3 ${percentage >= 75 ? "text-emerald-500" : percentage >= 50 ? "text-amber-500" : "text-red-500"}`}>
        {percentage >= 75 ? "Good Standing" : percentage >= 50 ? "At Risk" : "Critical Standing"}
      </p>
    </div>
  );
}

// ── ExamCard UI ───────────────────────────────────────────────────────────────
function ExamCard({ exam }) {
  const { isDark } = useTheme();
  return (
    <div className={`flex items-center justify-between p-4 rounded-xl border transition-all
      ${isDark ? "border-white/5 hover:bg-white/5" : "border-zinc-100 bg-zinc-50 hover:bg-white shadow-sm"}`}>
      <div className="flex items-center gap-4 min-w-0">
        <div className={`p-2 rounded-full ${isDark ? "bg-red-500/20 text-red-500" : "bg-red-100 text-red-600"}`}>
          <Timer size={16} />
        </div>
        <div className="min-w-0">
          <p className={`text-xs font-black truncate ${isDark ? "text-white" : "text-zinc-900"}`}>{exam.title}</p>
          <p className="text-[10px] text-zinc-500 font-bold uppercase">{exam.type} • {exam.duration_minutes}m</p>
          <p className="text-[10px] opacity-60 mt-0.5 font-bold">
            {new Date(exam.scheduled_start_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} @ {new Date(exam.scheduled_start_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0 ml-4">
        <span className={`text-[9px] font-black px-3 py-1 rounded-full border shadow-sm border-red-500/30 bg-red-500 text-white`}>
          {daysUntil(exam.scheduled_start_at)}
        </span>
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { isDark } = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Session expired. Please login again.");
      setLoading(false);
      return;
    }

    api.get("/auth/dashboard", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setData(r.data))
      .catch(err => {
        console.error("Dashboard Error:", err);
        setError(err.response?.data?.message || "Failed to sync with server.");
      })
      .finally(() => setLoading(false));
  }, []);

  const cssVars = useMemo(() => ({
    "--panel-bg": isDark ? "#0f1117" : "#ffffff",
    "--border": isDark ? "rgb(39,39,42)" : "rgb(228,228,231)",
    "--fg": isDark ? "#f4f4f5" : "#18181b",
  }), [isDark]);

  const chartTheme = { grid: isDark ? "#27272a" : "#e4e4e7", axis: isDark ? "#52525b" : "#71717a" };

  const studentName = data?.student?.full_name || "Student";

  const barData = (data?.subject_attendance || []).map(s => ({
    name: s.code || (s.name ? s.name.slice(0, 8) : "N/A"),
    fullName: s.name || "Unknown Subject",
    Attendance: s.percentage || 0,
  }));

  return (
    <div className={`p-4 md:p-8 space-y-8 max-w-[1600px] mx-auto min-h-screen transition-all duration-300
      ${isDark ? "bg-[#09090b]" : "bg-[#f8f9fa]"}`}
      style={{ fontFamily: "'DM Sans', sans-serif", ...cssVars }}>

      {/* Header (Cleaned up redundant button) */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div className="space-y-2">
          <h1 className={`text-3xl md:text-4xl font-black tracking-tighter ${isDark ? "text-white" : "text-zinc-900"}`}>
            {getGreeting()}, <span className="text-violet-500">{studentName}</span> 👋
          </h1>
          <div className="text-sm font-medium text-zinc-500 flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${loading ? "bg-amber-500" : "bg-emerald-500 animate-pulse"}`} />
            {loading ? "Syncing infrastructure..." : `Semester ${data?.student?.current_semester || "N/A"} • AcademiQ Student ID`}
          </div>
        </div>
        <div className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest px-4 py-2 rounded-lg border
          ${isDark ? "bg-white/5 border-white/10 text-zinc-400" : "bg-white border-zinc-200 text-zinc-500 shadow-sm"}`}>
          <CalendarDays size={14} />{getFormattedDate()}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-500 font-bold flex items-center gap-2">
          <XCircle size={16} /> {error}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading || !data ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />) : (
          <>
            <StatCard label="Overall Attendance" value={`${data?.stats?.overall_attendance || 0}%`}
              icon={Activity} sub={`${data?.stats?.present_count || 0} / ${data?.stats?.total_classes || 0} classes`}
              deltaType={(data?.stats?.overall_attendance || 0) >= 75 ? "positive" : "negative"} />
            <StatCard label="Total Subjects" value={data?.stats?.subjects_count || 0}
              icon={BookOpen} sub="Active Courses" deltaType="neutral" />
            <StatCard label="Pending Exams" value={data?.stats?.upcoming_exams_count || 0}
              icon={CalendarClock} sub="Scheduled events" deltaType={(data?.stats?.upcoming_exams_count || 0) > 0 ? "positive" : "neutral"} />
            <StatCard label="Academic Term" value={data?.student?.current_semester ? `Sem ${data.student.current_semester}` : "N/A"}
              icon={Award} sub="Primary Enrollment" deltaType="neutral" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Attendance Gauge */}
        <Panel className="p-8 flex flex-col items-center justify-center gap-6">
          <SectionHeading>Performance Gauge</SectionHeading>
          {loading || !data
            ? <div className="h-48 flex items-center justify-center"><Loader2 className="animate-spin text-violet-500" /></div>
            : <AttendanceGauge percentage={data?.stats?.overall_attendance || 0} />
          }
          {!loading && data && (
            <div className="w-full grid grid-cols-3 gap-3">
              {[
                { label: "Pres.", value: data?.stats?.present_count || 0, color: "text-emerald-500" },
                { label: "Abs.", value: (data?.stats?.total_classes || 0) - (data?.stats?.present_count || 0), color: "text-red-500" },
                { label: "Total", value: data?.stats?.total_classes || 0, color: isDark ? "text-white" : "text-zinc-900" },
              ].map(({ label, value, color }) => (
                <div key={label} className={`rounded-xl p-3 text-center border ${isDark ? "bg-white/[0.03] border-white/5" : "bg-zinc-50 border-zinc-100"}`}>
                  <p className={`text-lg font-black ${color}`}>{value}</p>
                  <p className="text-[9px] font-black uppercase text-zinc-500 mt-1">{label}</p>
                </div>
              ))}
            </div>
          )}
        </Panel>

        {/* Bar Chart */}
        <Panel className="lg:col-span-2 p-8">
          <SectionHeading>Subject Split</SectionHeading>
          {loading || !data
            ? <div className="h-[260px] flex items-center justify-center"><Loader2 className="animate-spin text-violet-500" /></div>
            : barData.length === 0
            ? <div className="h-[260px] flex items-center justify-center text-zinc-500 text-sm font-bold">No academic data available.</div>
            : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: chartTheme.axis, fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: chartTheme.axis, fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                  <Bar dataKey="Attendance" radius={[6, 6, 6, 6]} barSize={35}>
                    {barData.map((entry, i) => (
                      <Cell key={i} fill={pctColor(entry.Attendance)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )
          }
        </Panel>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-10">
        {/* Exams List */}
        <Panel className="p-8 flex flex-col">
          <SectionHeading>Exam Roadmap</SectionHeading>
          {loading || !data
            ? <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 rounded-xl bg-white/[0.03] animate-pulse" />)}</div>
            : !data?.upcoming_exams?.length
            ? (
              <div className="flex-1 flex flex-col items-center justify-center py-10 text-zinc-500 gap-3">
                <CalendarClock className="w-12 h-12 opacity-10" />
                <p className="text-sm font-bold uppercase tracking-widest">No Events Found</p>
              </div>
            ) : (
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                {data.upcoming_exams.map(exam => <ExamCard key={exam.id} exam={exam} />)}
              </div>
            )
          }
        </Panel>

        {/* Recent Activity */}
        <Panel className="p-8 flex flex-col">
          <SectionHeading>Live Log</SectionHeading>
          {loading || !data
            ? <div className="space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-14 rounded-xl bg-white/[0.03] animate-pulse" />)}</div>
            : !data?.recent_attendance?.length
            ? (
              <div className="flex-1 flex flex-col items-center justify-center py-10 text-zinc-500 gap-3">
                <Activity className="w-12 h-12 opacity-10" />
                <p className="text-sm font-bold uppercase tracking-widest">Logs Empty</p>
              </div>
            ) : (
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                {data.recent_attendance.map(a => (
                  <div key={a.id} className={`flex items-center justify-between p-4 rounded-xl border transition-all
                    ${isDark ? "border-white/5 hover:bg-white/5" : "border-zinc-100 bg-zinc-50 hover:bg-white shadow-sm"}`}>
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={`p-2 rounded-full ${a.status === "PRESENT" ? "bg-emerald-500/20 text-emerald-500" : "bg-red-500/20 text-red-500"}`}>
                        {a.status === "PRESENT" ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                      </div>
                      <div className="min-w-0">
                        <p className={`text-xs font-black truncate ${isDark ? "text-white" : "text-zinc-900"}`}>{a.subject_name}</p>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase">{new Date(a.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-4">
                      {a.verified && <span className="text-[9px] font-black text-zinc-400 bg-zinc-500/10 px-2 py-0.5 rounded">GPS ✓</span>}
                      <span className={`text-[9px] font-black px-3 py-1 rounded-full border shadow-sm
                        ${a.status === "PRESENT"
                          ? "border-emerald-500/30 bg-emerald-500 text-white"
                          : "border-red-500/30 bg-red-500 text-white"
                        }`}>{a.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )
          }
        </Panel>
      </div>
    </div>
  );
}