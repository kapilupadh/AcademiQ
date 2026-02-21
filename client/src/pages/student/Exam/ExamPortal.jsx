import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function ExamPortal() {
  const { sessionId: examId } = useParams();
  const navigate = useNavigate();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(null);
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    const fetchExamData = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.post(
          `http://localhost:5000/api/exam/${examId}/start`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        setData(res.data);
        const remainingMs = new Date(res.data.endTime).getTime() - Date.now();
        setTimeLeft(Math.max(0, Math.floor(remainingMs / 1000)));
      } catch (err) {
        console.error(err);
        alert(err.response?.data?.message || "Failed to load exam");
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchExamData();
  }, [examId, navigate]);

  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft <= 0) {
      handleAutoSubmit();
      return;
    }
    const timerId = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timerId);
  }, [timeLeft]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error("Error attempting to enable fullscreen:", err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const handleOptionSelect = async (questionId, option) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:5000/api/exam/answer",
        {
          attemptId: data.attemptId,
          questionId: questionId,
          selectedOption: option,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
    } catch (err) {
      console.error("Failed to save answer", err);
    }
  };

  const submitExam = async () => {
    if (
      !window.confirm(
        "Are you sure you want to submit? You cannot change answers after. (Ensure all answers are saved)",
      )
    )
      return;

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:5000/api/exam/submit",
        {
          attemptId: data.attemptId,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      alert("Exam submitted successfully!");
      navigate("/dashboard");
    } catch (err) {
      console.error("Submit error", err);
      alert("Failed to submit exam");
    }
  };

  const handleAutoSubmit = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:5000/api/exam/submit",
        { attemptId: data?.attemptId },
        { headers: { Authorization: `Bearer ${token}` } },
      );
    } catch (e) {
      console.error(e);
    }
    alert("Time is up! Exam auto-submitted.");
    navigate("/dashboard");
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  if (loading)
    return (
      <div className="h-screen w-full flex items-center justify-center text-zinc-500">
        Loading Exam...
      </div>
    );
  if (!data)
    return (
      <div className="h-screen w-full flex items-center justify-center text-red-500">
        Failed to load exam.
      </div>
    );

  return (
    <div className="h-screen w-full flex flex-col bg-zinc-50 dark:bg-zinc-950">
      {/* Top Bar */}
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 p-4 flex justify-between items-center shadow-sm z-10 sticky top-0">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-4">
          Exam Session
          {!isFullscreen && (
            <button
              onClick={toggleFullscreen}
              className="text-sm px-3 py-1 bg-amber-100 text-amber-700 rounded-lg outline-none font-medium hover:bg-amber-200"
            >
              ⚠️ Enable Fullscreen
            </button>
          )}
        </h1>
        <div className="flex items-center gap-6">
          <div className="text-lg font-mono font-bold text-red-600 dark:text-red-400">
            {formatTime(timeLeft)}
          </div>
          <button
            onClick={submitExam}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors"
          >
            Submit Exam
          </button>
        </div>
      </div>

      {/* Question List */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 max-w-[900px] w-full mx-auto">
        {data.questions.map((q, index) => (
          <div
            key={q.id}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                Q{index + 1}. {q.question_text}
              </h3>
              <span className="text-sm font-semibold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">
                {q.marks} Marks
              </span>
            </div>

            <div className="space-y-3 mt-6">
              {q.options.map((opt, oIndex) => {
                const isSelected = answers[q.id] === opt;
                return (
                  <label
                    key={oIndex}
                    className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer border transition-colors ${
                      isSelected
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-500"
                        : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:border-blue-300 dark:hover:border-blue-800"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`q-${q.id}`}
                      value={opt}
                      checked={isSelected}
                      onChange={() => handleOptionSelect(q.id, opt)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span
                      className={`flex-1 text-zinc-800 dark:text-zinc-200 ${isSelected ? "font-medium" : ""}`}
                    >
                      {opt}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
