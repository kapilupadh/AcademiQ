import React from "react";
export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-[240px] border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 z-40 hidden md:block">
      <div className="font-bold text-lg text-zinc-900 dark:text-white mb-10">
        Student Portal
      </div>
      <nav className="space-y-4 flex flex-col">
        <a
          href="/exam/instructions"
          className="font-medium text-zinc-500 hover:text-slate-200 transition duration-300 ease-in-out"
        >
          Sessional
        </a>
        <a
          href="/assignments"
          className="font-medium text-zinc-500 hover:text-slate-200 transition duration-300 ease-in-out"
        >
          Assignments
        </a>
        <a
          href="/reports"
          className="font-medium text-zinc-500 hover:text-slate-200 transition duration-300 ease-in-out"
        >
          Reports
        </a>
        <a
          href="/notices"
          className="font-medium text-zinc-500 hover:text-slate-200 transition duration-300 ease-in-out"
        >
          Notice
        </a>
        <a
          href="/marks"
          className="font-medium text-zinc-500 hover:text-slate-200 transition duration-300 ease-in-out"
        >
          Marks
        </a>
      </nav>
    </aside>
  );
}
