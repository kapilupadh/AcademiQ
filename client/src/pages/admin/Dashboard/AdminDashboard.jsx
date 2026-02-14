import { useEffect, useState } from "react";
import axios from "axios";
import {
  Users,
  GraduationCap,
  FileText,
  AlertOctagon,
  TrendingUp,
  Calendar,
} from "lucide-react";

import StatCard from "../../../components/dashboard/StatCard";
import SessionalTrendChart from "../../../components/dashboard/Charts/SessionalTrendChart";
import AttendanceHeatmap from "../../../components/dashboard/Charts/AttendanceHeatmap";
import RecentActivityFeed from "../../../components/dashboard/RecentActivityFeed";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState([]);
  const [heatmap, setHeatmap] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        const [statsRes, trendsRes, heatmapRes, activitiesRes] =
          await Promise.all([
            axios.get("http://localhost:5000/api/admin/dashboard/stats", {
              headers,
            }),
            axios.get("http://localhost:5000/api/admin/dashboard/trends", {
              headers,
            }),
            axios.get("http://localhost:5000/api/admin/dashboard/heatmap", {
              headers,
            }),
            axios.get("http://localhost:5000/api/admin/dashboard/activities", {
              headers,
            }),
          ]);

        setStats(statsRes.data);
        setTrends(trendsRes.data);
        setHeatmap(heatmapRes.data);
        setActivities(activitiesRes.data);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center text-zinc-500">Loading Dashboard...</div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
          Dashboard Overview
        </h1>
        <div className="text-sm text-zinc-500">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Students"
          value={stats?.totalStudents || 0}
          icon={Users}
          color="bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
        />
        <StatCard
          title="Active Teachers"
          value={stats?.activeTeachers || 0}
          icon={GraduationCap}
          color="bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400"
        />
        <StatCard
          title="Active Exams"
          value={stats?.currentExams || 0}
          icon={FileText}
          color="bg-pink-50 text-pink-600 dark:bg-pink-900/20 dark:text-pink-400"
        />
        <StatCard
          title="Low Attendance"
          value={stats?.lowAttendanceCount || 0}
          icon={AlertOctagon}
          color="bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
        />
        <StatCard
          title="Avg Sessional"
          value={stats?.avgSessionalMarks || 0}
          icon={TrendingUp}
          color="bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400"
        />
        <StatCard
          title="Today's Attendance"
          value={`${stats?.attendancePercentage || 0}%`}
          icon={Calendar}
          color="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SessionalTrendChart data={trends} />
        </div>
        <div>
          <AttendanceHeatmap data={heatmap} />
        </div>
      </div>

      {/* Bottom Section: Activity Log & Maybe something else */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <RecentActivityFeed activities={activities} />
        </div>
        {/* Placeholder for future widgets like "Risk Student List" or "Teacher Performance" */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 flex items-center justify-center text-zinc-400">
          More analytics widgets coming in Phase 2...
        </div>
      </div>
    </div>
  );
}
