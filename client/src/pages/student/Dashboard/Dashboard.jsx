import React, { useEffect, useState } from "react";
import { BookOpen, Calendar, Clock, Award } from "lucide-react";

export default function Dashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Ideally use Context, but for V1 per plan we read from localStorage
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const stats = [
    {
      label: "My Courses",
      value: "4",
      icon: BookOpen,
      color: "bg-blue-500/10 text-blue-500",
    },
    {
      label: "Attendance",
      value: "85%",
      icon: Calendar,
      color: "bg-emerald-500/10 text-emerald-500",
    },
    {
      label: "Assignments",
      value: "2",
      icon: Clock,
      color: "bg-amber-500/10 text-amber-500",
    },
    {
      label: "CGPA",
      value: "8.5",
      icon: Award,
      color: "bg-purple-500/10 text-purple-500",
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Welcome back,{" "}
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {user?.full_name || "Student"}
            </span>
          </p>
        </div>
        <div className="text-sm text-zinc-500 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-4 py-2 rounded-full shadow-sm">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    {stat.label}
                  </p>
                  <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mt-2">
                    {stat.value}
                  </h3>
                </div>
                <div className={`p-2.5 rounded-lg ${stat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity / Content Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">
            Current Classes
          </h3>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors cursor-pointer"
              >
                <div className="h-10 w-10 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center font-bold text-zinc-500">
                  CS
                </div>
                <div>
                  <h4 className="font-semibold text-zinc-900 dark:text-white">
                    Computer Science {100 + i}
                  </h4>
                  <p className="text-xs text-zinc-500">
                    Dr. Smith • Room 30{i}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar / Schedule */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">
            Upcoming Events
          </h3>
          <div className="space-y-4">
            <div className="p-3 rounded-lg border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/10">
              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                Today, 2:00 PM
              </p>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-200">
                Project Submission
              </p>
            </div>
            <div className="p-3 rounded-lg border-l-4 border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10">
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                Tomorrow, 10:00 AM
              </p>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-200">
                Guest Lecture
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
