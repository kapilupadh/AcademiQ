import React, { useEffect, useState } from "react";
import api from "../../../services/api";
import { Users, BookOpen, FileText, CheckCircle } from "lucide-react";

// Using existing StatCard if it exists, otherwise inline
const StatCard = ({ title, value, icon: Icon, color }) => (
  <div
    className={`p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center gap-4 bg-white dark:bg-zinc-900`}
  >
    <div className={`p-3 rounded-lg ${color}`}>
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
        {title}
      </p>
      <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">
        {value}
      </h3>
    </div>
  </div>
);

export default function TeacherDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mocking fetch data since this phase is incremental and we just need placeholder stats
    const fetchStats = async () => {
      setTimeout(() => {
        setStats({
          totalStudents: 120,
          assignedSubjects: 4,
          totalExams: 10,
          completedExams: 6,
        });
        setLoading(false);
      }, 500);
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center text-zinc-500">Loading Dashboard...</div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
          Teacher Dashboard
        </h1>
        <div className="text-sm text-zinc-500">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="My Students"
          value={stats?.totalStudents || 0}
          icon={Users}
          color="bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
        />
        <StatCard
          title="Assigned Subjects"
          value={stats?.assignedSubjects || 0}
          icon={BookOpen}
          color="bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400"
        />
        <StatCard
          title="Total Exams"
          value={stats?.totalExams || 0}
          icon={FileText}
          color="bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400"
        />
        <StatCard
          title="Completed Exams"
          value={stats?.completedExams || 0}
          icon={CheckCircle}
          color="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
        />
      </div>

      {/* Placeholder sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">
            Recent Exams
          </h2>
          <p className="text-zinc-500 text-sm">
            You have no active exams right now.
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">
            Quick Actions
          </h2>
          <p className="text-zinc-500 text-sm">Coming soon...</p>
        </div>
      </div>
    </div>
  );
}
