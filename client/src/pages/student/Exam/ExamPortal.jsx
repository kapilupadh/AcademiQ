import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  Clock,
  Send,
  CheckCircle,
  Circle,
} from "lucide-react";

const API = (`${process.env.REACT_APP_API_URL || "http://10.201.249.129:5000"}`);

export default function ExamPortal() {
  const { sessionId: examId } = useParams();
  const navigate = useNavigate();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [imgError, setImgError] = useState({});

  // ── Fullscreen ──────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(console.error);
    } else {
      document.exitFullscreen();
    }
  };

  // ── Load exam data ───────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.post(
          `${API}/api/exam/${examId}/start`,
          {},
          { headers: { Authorization: `Bearer ${token}` } },
        );
        setData(res.data);
        const remaining = Math.max(
          0,
          Math.floor(
            (new Date(res.data.endTime).getTime() - Date.now()) / 1000,
          ),
        );
        setTimeLeft(remaining);
      } catch (err) {
        alert(err.response?.data?.message || "Failed to load exam");
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [examId, navigate]);

  // ── Countdown ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft <= 0) {
      handleAutoSubmit();
      return;
    }
    const id = setInterval(() => setTimeLeft((p) => p - 1), 1000);
    return () => clearInterval(id);
  }, [timeLeft]);

  const formatTime = (s) => {
    if (s === null) return "--:--";
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec < 10 ? "0" : ""}${sec}`;
  };

  // ── Answer handling ──────────────────────────────────────────────────────
  const handleOptionSelect = useCallback(
    async (questionId, option) => {
      setAnswers((prev) => ({ ...prev, [questionId]: option }));
      try {
        const token = localStorage.getItem("token");
        await axios.post(
          `${API}/api/exam/answer`,
          { attemptId: data.attemptId, questionId, selectedOption: option },
          { headers: { Authorization: `Bearer ${token}` } },
        );
      } catch (err) {
        console.error("Failed to save answer", err);
      }
    },
    [data],
  );

  // ── Submit helpers ───────────────────────────────────────────────────────
  const doSubmit = useCallback(async () => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API}/api/exam/submit`,
        { attemptId: data?.attemptId },
        { headers: { Authorization: `Bearer ${token}` } },
      );
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  }, [data]);

  const submitExam = async () => {
    const unanswered = data.questions.filter((q) => !answers[q.id]).length;
    const confirmMsg =
      unanswered > 0
        ? `You have ${unanswered} unanswered question(s). Are you sure you want to submit?`
        : "Are you sure you want to submit your exam?";
    if (!window.confirm(confirmMsg)) return;
    await doSubmit();
    alert("Exam submitted successfully!");
    navigate("/dashboard");
  };

  const handleAutoSubmit = useCallback(async () => {
    await doSubmit();
    alert("Time is up! Your exam has been auto-submitted.");
    navigate("/dashboard");
  }, [doSubmit, navigate]);

  // ── Navigation ───────────────────────────────────────────────────────────
  const go = (dir) => {
    setCurrentIndex((prev) =>
      Math.min(Math.max(prev + dir, 0), data.questions.length - 1),
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  if (loading)
    return (
      <div className="h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-zinc-500">Loading exam…</p>
        </div>
      </div>
    );

  if (!data)
    return (
      <div className="h-screen flex items-center justify-center text-red-500">
        Failed to load exam.
      </div>
    );

  const questions = data.questions;
  const q = questions[currentIndex];
  const totalAnswered = Object.keys(answers).length;
  const isLast = currentIndex === questions.length - 1;
  const isFirst = currentIndex === 0;
  const isWarning = timeLeft !== null && timeLeft < 300; // < 5 min

  return (
    <div className="h-screen w-full flex flex-col bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
      {/* ─── Top Bar ─────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 flex items-center justify-between gap-4 shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-bold text-zinc-900 dark:text-white truncate text-sm md:text-base">
            Exam Session
          </span>
          {!isFullscreen && (
            <button
              onClick={toggleFullscreen}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-lg font-medium hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
            >
              <Maximize className="w-3.5 h-3.5" /> Fullscreen
            </button>
          )}
          {isFullscreen && (
            <button
              onClick={toggleFullscreen}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 rounded-lg font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              <Minimize className="w-3.5 h-3.5" /> Exit Fullscreen
            </button>
          )}
        </div>

        <div className="flex items-center gap-4 shrink-0">
          {/* Answered count */}
          <span className="text-xs text-zinc-500 hidden md:block">
            <span className="font-bold text-zinc-900 dark:text-white">
              {totalAnswered}
            </span>
            /{questions.length} answered
          </span>

          {/* Timer */}
          <div
            className={`flex items-center gap-1.5 font-mono font-bold text-lg px-3 py-1 rounded-xl ${
              isWarning
                ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 animate-pulse"
                : "text-zinc-900 dark:text-white"
            }`}
          >
            <Clock className="w-4 h-4" />
            {formatTime(timeLeft)}
          </div>

          <button
            disabled={submitting}
            onClick={submitExam}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 text-sm"
          >
            <Send className="w-4 h-4" />
            Submit
          </button>
        </div>
      </div>

      {/* ─── Body: Question + Palette ─────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ─── Main Question Area ──────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-[760px] mx-auto space-y-6">
            {/* Question card */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
              {/* Question header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
                <span className="text-sm font-semibold text-zinc-500">
                  Question {currentIndex + 1} of {questions.length}
                </span>
                <span className="text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-3 py-1 rounded-full">
                  {q.marks} {q.marks === 1 ? "Mark" : "Marks"}
                </span>
              </div>

              <div className="p-6 space-y-5">
                {/* Question text */}
                {q.question_text && (
                  <p className="text-zinc-900 dark:text-white text-lg font-medium leading-relaxed">
                    {q.question_text}
                  </p>
                )}

                {/* Question image */}
                {q.image_url && !imgError[q.id] && (
                  <div className="rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950">
                    <img
                      src={`${API}${q.image_url}`}
                      alt="Question visual"
                      className="w-full max-h-72 object-contain"
                      onError={() =>
                        setImgError((prev) => ({ ...prev, [q.id]: true }))
                      }
                    />
                  </div>
                )}

                {/* Options */}
                <div className="space-y-3">
                  {q.options.map((opt, oIdx) => {
                    const isSelected = answers[q.id] === opt;
                    const letter = String.fromCharCode(65 + oIdx);
                    return (
                      <label
                        key={oIdx}
                        className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer border-2 transition-all select-none ${
                          isSelected
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm"
                            : "border-zinc-200 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`q-${q.id}`}
                          value={opt}
                          checked={isSelected}
                          onChange={() => handleOptionSelect(q.id, opt)}
                          className="sr-only"
                        />
                        {/* Letter badge */}
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-colors ${
                            isSelected
                              ? "bg-blue-500 text-white"
                              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                          }`}
                        >
                          {letter}
                        </div>
                        <span
                          className={`flex-1 text-sm md:text-base ${
                            isSelected
                              ? "text-blue-900 dark:text-blue-200 font-medium"
                              : "text-zinc-800 dark:text-zinc-200"
                          }`}
                        >
                          {opt}
                        </span>
                        {isSelected && (
                          <CheckCircle className="w-5 h-5 text-blue-500 shrink-0" />
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ─── Navigation Controls ────────────────────────────── */}
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={() => go(-1)}
                disabled={isFirst}
                className="flex items-center gap-2 px-5 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>

              {/* Quick jump: answered count */}
              <span className="text-xs text-zinc-400 md:hidden">
                {totalAnswered}/{questions.length}
              </span>

              {isLast ? (
                <button
                  disabled={submitting}
                  onClick={submitExam}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
                >
                  <Send className="w-4 h-4" /> Submit Exam
                </button>
              ) : (
                <button
                  onClick={() => go(1)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ─── Question Palette (Right Sidebar) ──────────────────────── */}
        <div className="hidden md:flex flex-col w-64 bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 p-4 gap-4 shrink-0">
          <div>
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">
              Question Palette
            </p>
            <div className="grid grid-cols-5 gap-2">
              {questions.map((question, idx) => {
                const isAnswered = !!answers[question.id];
                const isCurrent = idx === currentIndex;
                return (
                  <button
                    key={question.id}
                    onClick={() => setCurrentIndex(idx)}
                    title={`Question ${idx + 1}${isAnswered ? " (answered)" : ""}`}
                    className={`w-full aspect-square rounded-lg text-xs font-bold transition-all ${
                      isCurrent
                        ? "ring-2 ring-blue-500 ring-offset-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        : isAnswered
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2 text-zinc-500">
              <div className="w-4 h-4 rounded bg-emerald-100 dark:bg-emerald-900/30" />
              Answered
            </div>
            <div className="flex items-center gap-2 text-zinc-500">
              <div className="w-4 h-4 rounded bg-blue-100 dark:bg-blue-900/30 ring-2 ring-blue-400 ring-offset-1" />
              Current
            </div>
            <div className="flex items-center gap-2 text-zinc-500">
              <div className="w-4 h-4 rounded bg-zinc-100 dark:bg-zinc-800" />
              Not Answered
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-auto space-y-2">
            <div className="flex justify-between text-xs text-zinc-500">
              <span>Progress</span>
              <span className="font-bold text-zinc-900 dark:text-white">
                {totalAnswered}/{questions.length}
              </span>
            </div>
            <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{
                  width: `${(totalAnswered / questions.length) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

