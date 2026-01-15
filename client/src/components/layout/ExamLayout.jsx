import React, { useEffect } from "react";

export default function ExamLayout({ children }) {
  // Prevent right click
  useEffect(() => {
    const handleContext = (e) => e.preventDefault();
    document.addEventListener("contextmenu", handleContext);
    return () => document.removeEventListener("contextmenu", handleContext);
  }, []);

  return (
    <div className="min-h-screen w-full bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 font-geist select-none">
      <main className="w-full h-full">{children}</main>
    </div>
  );
}
