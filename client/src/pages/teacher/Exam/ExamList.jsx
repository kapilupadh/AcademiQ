import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Clock, FileText, ArrowRight, Edit3 } from "lucide-react";

export default function ExamList() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get((`${process.env.REACT_APP_API_URL || "http://10.201.249.129:5000"}/api/teacher/exams`), {
          headers: { Authorization: `Bearer ${token}` },
        });
        setExams(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case "Draft":
        return "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400";
      case "Scheduled":
        return "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400";
      case "Live":
        return "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400";
      case "Completed":
        return "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400";
      default:
        return "bg-zinc-100 text-zinc-600";
    }
  };

  if (loading)
    return (
      <div className="p-8 text-center text-zinc-500">Loading Exams...</div>
    );

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
          Exams
        </h1>
        <Link
          to="/teacher/exams/create"
          className="flex items-center gap-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" /> Create Exam
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exams.length === 0 ? (
          <div className="col-span-full p-8 text-center text-zinc-500 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
            No exams found. Create one to get started.
          </div>
        ) : (
          exams.map((exam) => (
            <div
              key={exam.id}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 hover:border-zinc-300 dark:hover:border-zinc-700 transition duration-200 flex flex-col cursor-pointer"
              onClick={() => navigate(`/teacher/exams/${exam.id}/manage`)}
            >
              <div className="flex justify-between items-start mb-4">
                <span
                  className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusColor(exam.status)}`}
                >
                  {exam.status}
                </span>
                <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  {exam.type}
                </span>
              </div>

              <h3 className="font-bold text-lg text-zinc-900 dark:text-white mb-2 line-clamp-1">
                {exam.title}
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4 line-clamp-2 min-h-[40px]">
                {exam.description || "No description provided."}
              </p>

              <div className="mt-auto space-y-2">
                <div className="flex items-center text-sm text-zinc-600 dark:text-zinc-400 gap-2">
                  <Clock className="w-4 h-4" /> {exam.duration_minutes} mins
                </div>
                <div className="flex items-center text-sm text-zinc-600 dark:text-zinc-400 gap-2">
                  <FileText className="w-4 h-4" /> {exam.total_questions_to_ask}{" "}
                  Questions
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-3 z-10 relative">
                {(exam.status === "Draft" || exam.status === "Scheduled") && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/teacher/exams/edit/${exam.id}`);
                    }}
                    className="text-sm font-medium text-zinc-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 transition-colors"
                  >
                    Edit <Edit3 className="w-4 h-4" />
                  </button>
                )}
                <button className="text-sm font-medium text-zinc-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 transition-colors">
                  Manage <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

