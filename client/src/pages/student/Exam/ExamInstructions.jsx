import React from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Shield, Clock } from "lucide-react";

export default function ExamInstructions() {
  const navigate = useNavigate();

  const startExam = () => {
    // In a real app, you would fetch the exam ID from a list.
    // For this demo, we assume a static ID or passed via state.
    // We will navigate to the exam portal.
    // Let's assume we are taking "Exam 1"
    navigate("/exam/portal/session-1");
  };

  return (
    <div className="max-w-3xl mx-auto p-8 pt-16">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
          Sessional Examination 1
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mb-8">
          Computer Science & Engineering • Semester 5
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 text-center">
            <Clock className="w-6 h-6 mx-auto mb-2 text-blue-600 dark:text-blue-400" />
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">
              Duration
            </p>
            <p className="text-xl font-bold text-blue-700 dark:text-blue-300">
              60 Mins
            </p>
          </div>
          <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800 text-center">
            <AlertCircle className="w-6 h-6 mx-auto mb-2 text-purple-600 dark:text-purple-400" />
            <p className="text-sm font-semibold text-purple-900 dark:text-purple-200">
              Questions
            </p>
            <p className="text-xl font-bold text-purple-700 dark:text-purple-300">
              20 MCQs
            </p>
          </div>
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800 text-center">
            <Shield className="w-6 h-6 mx-auto mb-2 text-emerald-600 dark:text-emerald-400" />
            <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
              Proctored
            </p>
            <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
              Active
            </p>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
            Instructions
          </h3>
          <ul className="list-disc pl-5 space-y-2 text-zinc-600 dark:text-zinc-400 text-sm">
            <li>Ensure you have a stable internet connection.</li>
            <li>
              Do not switch tabs or minimize the browser window. Violations will
              be recorded.
            </li>
            <li>Fullscreen mode will be enabled automatically.</li>
            <li>Once submitted, you cannot edit your answers.</li>
            <li>The exam will auto-submit when the timer expires.</li>
          </ul>
        </div>

        <button
          onClick={startExam}
          className="w-full py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all transform active:scale-95"
        >
          Start Examination
        </button>
      </div>
    </div>
  );
}
