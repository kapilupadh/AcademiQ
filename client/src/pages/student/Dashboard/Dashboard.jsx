import React, { useEffect, useState } from "react";
import { BookOpen, Calendar, Clock, Award, CalendarClock } from "lucide-react";
import axios from "axios";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [upcomingExams, setUpcomingExams] = useState([]);
  const [loadingExams, setLoadingExams] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get((`${process.env.REACT_APP_API_URL || "http://10.201.249.129:5000"}/api/exam`), {
          headers: { Authorization: `Bearer ${token}` },
        });
        // Filter to exams that have a future scheduled start
        const now = new Date();
        const scheduled = res.data
          .filter(
            (e) => e.scheduled_start_at && new Date(e.scheduled_start_at) > now,
          )
          .sort(
            (a, b) =>
              new Date(a.scheduled_start_at) - new Date(b.scheduled_start_at),
          );
        setUpcomingExams(scheduled);
      } catch (err) {
        console.error("Failed to fetch exams", err);
      } finally {
        setLoadingExams(false);
      }
    };
    fetchExams();
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

  const formatScheduledDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });

  const formatScheduledTime = (dateStr) =>
    new Date(dateStr).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });

  // Days until exam
  const daysUntil = (dateStr) => {
    const diff = new Date(dateStr) - new Date();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "Tomorrow";
    return `In ${days} days`;
  };

  const urgencyColor = (dateStr) => {
    const days = Math.floor(
      (new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24),
    );
    if (days <= 1)
      return "border-red-500 bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400";
    if (days <= 3)
      return "border-amber-500 bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400";
    return "border-blue-500 bg-blue-50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-400";
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Welcome */}
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

      {/* Stats */}
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

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Classes */}
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

        {/* ── Upcoming Exams ── */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-blue-500" />
            Upcoming Exams
          </h3>

          {loadingExams ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-20 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : upcomingExams.length === 0 ? (
            <div className="text-center py-8 text-zinc-400 dark:text-zinc-600 text-sm">
              <CalendarClock className="w-10 h-10 mx-auto mb-2 opacity-40" />
              No upcoming exams scheduled
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingExams.map((exam) => (
                <div
                  key={exam.id}
                  className={`p-3 rounded-xl border-l-4 ${urgencyColor(exam.scheduled_start_at)}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate text-zinc-900 dark:text-zinc-100">
                        {exam.title}
                      </p>
                      <p className="text-xs opacity-75 mt-0.5">
                        {exam.subject && `${exam.subject} · `}
                        {exam.type}
                      </p>
                      <p className="text-xs font-medium mt-1">
                        {formatScheduledDate(exam.scheduled_start_at)} •{" "}
                        {formatScheduledTime(exam.scheduled_start_at)}
                      </p>
                      <p className="text-xs opacity-60">
                        {exam.duration_minutes} mins
                      </p>
                    </div>
                    <span className="text-xs font-bold whitespace-nowrap shrink-0 bg-white/60 dark:bg-zinc-900/60 px-2 py-1 rounded-lg">
                      {daysUntil(exam.scheduled_start_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="text-xs text-zinc-400 mt-4">
            ⚠️ Exams require teacher OTP to start — be present before scheduled
            time.
          </p>
        </div>
      </div>
    </div>
  );
}

