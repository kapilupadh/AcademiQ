import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function ExamPortal() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    // Request fullscreen on mount (In real app, trigger on user interaction first or warn)
    // For demo, we just show the state
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error("Error attempting to enable fullscreen:", err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center p-8 text-center space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-2xl shadow-xl"
      >
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">
          Exam Portal
        </h2>
        <p className="text-zinc-500 mb-6">
          This is where the questions will appear.
          <br />
          Backend integration required to fetch questions.
        </p>

        {!isFullscreen && (
          <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-800 dark:text-amber-200 text-sm mb-4">
            ⚠️ Please enable fullscreen to continue.
          </div>
        )}

        <button
          onClick={toggleFullscreen}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          {isFullscreen ? "Exit Fullscreen" : "Enable Fullscreen"}
        </button>
      </motion.div>
    </div>
  );
}
