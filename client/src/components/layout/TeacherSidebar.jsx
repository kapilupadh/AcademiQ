import React from "react";
import { Link } from "react-router-dom";

export default function TeacherSidebar() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-[240px] border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 z-40 hidden md:block">
      <div className="font-bold text-lg text-zinc-900 dark:text-white mb-10">
        Teacher Portal
      </div>
      <nav className="space-y-4 flex flex-col">
        <Link
          to="/teacher/dashboard"
          className="font-medium text-zinc-500 hover:text-slate-200 transition duration-300 ease-in-out"
        >
          Dashboard
        </Link>
        <Link
          to="/teacher/exams"
          className="font-medium text-zinc-500 hover:text-slate-200 transition duration-300 ease-in-out"
        >
          Exams
        </Link>
        <Link
          to="/teacher/subjects"
          className="font-medium text-zinc-500 hover:text-slate-200 transition duration-300 ease-in-out"
        >
          Subjects
        </Link>
        <Link
          to="/teacher/students"
          className="font-medium text-zinc-500 hover:text-slate-200 transition duration-300 ease-in-out"
        >
          Students
        </Link>
      </nav>
    </aside>
  );
}
