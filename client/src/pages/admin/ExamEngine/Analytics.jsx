import React, { useState } from "react";
import {
  Users,
  Crosshair,
  Award,
  ShieldAlert,
  TrendingUp,
  Download,
  FileSpreadsheet,
  FileText,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";

// Mock Data
const distributionData = [
  { name: "0-10", count: 2 },
  { name: "10-20", count: 5 },
  { name: "20-30", count: 12 },
  { name: "30-40", count: 35 },
  { name: "40-50", count: 68 },
  { name: "50-60", count: 120 },
  { name: "60-70", count: 85 },
  { name: "70-80", count: 42 },
  { name: "80-90", count: 18 },
  { name: "90-100", count: 5 },
];

const topicData = [
  { name: "Q. Mechanics", score: 65 },
  { name: "Thermodynamics", score: 82 },
  { name: "Optics", score: 55 },
  { name: "Relativity", score: 78 },
  { name: "Electromagnetism", score: 45 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3 rounded-lg shadow-xl text-sm">
        <p className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1">{`${label} Marks`}</p>
        <p className="text-violet-600 dark:text-violet-400 font-medium">
          {`${payload[0].value} Students`}
        </p>
      </div>
    );
  }
  return null;
};

export default function Analytics() {
  const [exportOpen, setExportOpen] = useState(false);

  const metrics = [
    {
      title: "Total Attendees",
      value: "842",
      sub: "+12% from last term",
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "Average Score",
      value: "58.4%",
      sub: "Passing threshold: 40%",
      icon: Crosshair,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      title: "Pass Rate",
      value: "82.5%",
      sub: "Top quartile: 18%",
      icon: Award,
      color: "text-violet-500",
      bg: "bg-violet-500/10",
    },
    {
      title: "UFM Flags",
      value: "14",
      sub: "3 Critical, 11 Warnings",
      icon: ShieldAlert,
      color: "text-rose-500",
      bg: "bg-rose-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, i) => {
          const Icon = m.icon;
          return (
            <div
              key={i}
              className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm flex flex-col justify-between hover:border-violet-500/30 transition-colors group"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    {m.title}
                  </h3>
                  <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mt-1 flex items-baseline gap-2">
                    {m.value}
                  </div>
                </div>
                <div className={`p-2 rounded-lg ${m.bg}`}>
                  <Icon className={`w-5 h-5 ${m.color}`} />
                </div>
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                {m.sub}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart: Bell Curve (Grade Distribution) */}
        <div className="lg:col-span-2 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
                Grade Distribution
              </h3>
              <p className="text-xs text-zinc-500 mt-1">
                Number of students achieving specific mark brackets.
              </p>
            </div>

            <div className="relative">
              <button
                onClick={() => setExportOpen(!exportOpen)}
                className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded bg-transparent text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Export Data
              </button>

              {exportOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setExportOpen(false)}
                  ></div>
                  <div className="absolute right-0 top-8 z-20 w-40 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-md p-1 animate-in fade-in zoom-in-95 duration-100">
                    <button
                      className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
                      onClick={() => {
                        alert("Exporting to CSV...");
                        setExportOpen(false);
                      }}
                    >
                      <FileSpreadsheet className="w-4 h-4" /> Export CSV
                    </button>
                    <button
                      className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
                      onClick={() => {
                        alert("Exporting to PDF...");
                        setExportOpen(false);
                      }}
                    >
                      <FileText className="w-4 h-4" /> Export PDF
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={distributionData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="currentColor"
                  className="text-zinc-200 dark:text-zinc-800"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "currentColor" }}
                  className="text-zinc-500 mt-2"
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "currentColor" }}
                  className="text-zinc-500"
                />
                <RechartsTooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorCount)"
                  activeDot={{ r: 6, strokeWidth: 0, fill: "#8b5cf6" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Secondary Chart: Topic Performance */}
        <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm flex flex-col">
          <div className="mb-6">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
              Topic Analysis
            </h3>
            <p className="text-xs text-zinc-500 mt-1">
              Average correct percentage by syllabus topic.
            </p>
          </div>

          <div className="flex-1 min-h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topicData}
                layout="vertical"
                margin={{ top: 0, right: 10, left: -30, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="currentColor"
                  className="text-zinc-200 dark:text-zinc-800"
                />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "currentColor" }}
                  className="text-zinc-600 dark:text-zinc-400 font-medium"
                />
                <RechartsTooltip
                  cursor={{ fill: "transparent" }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-zinc-900 text-white text-xs py-1 px-2 rounded tracking-wide shadow-lg">
                          {payload[0].value}% Correct
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={24}>
                  {topicData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.score < 50
                          ? "#f43f5e"
                          : entry.score < 75
                            ? "#f59e0b"
                            : "#10b981"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
