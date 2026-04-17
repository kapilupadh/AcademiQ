import React, { useState, useEffect, useCallback } from "react";
import api from "../../../services/api";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  Clock,
  Send,
  CheckCircle,
  FileText,
  LayoutGrid,
  Loader2,
  AlertCircle,
} from "lucide-react";

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
        const res = await api.post(`/exam/${examId}/start`, {});
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
        await api.post(`/exam/answer`, {
          attemptId: data.attemptId,
          questionId,
          selectedOption: option,
        });
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
      await api.post(`/exam/submit`, { attemptId: data?.attemptId });
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
          <Loader2 className="w-8 h-8 text-zinc-400 animate-spin mx-auto" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Loading exam…
          </p>
        </div>
      </div>
    );

  if (!data)
    return (
      <div className="h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="w-4 h-4" />
          Failed to load exam.
        </div>
      </div>
    );

  const questions = data.questions;
  const q = questions[currentIndex];
  const totalAnswered = Object.keys(answers).length;
  const isLast = currentIndex === questions.length - 1;
  const isFirst = currentIndex === 0;
  const isWarning = timeLeft !== null && timeLeft < 300;
  const isCritical = timeLeft !== null && timeLeft < 60;
  const progressPct = (totalAnswered / questions.length) * 100;

  return (
    <div className="h-screen w-full flex flex-col bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
      {/* ─── Top Bar ─────────────────────────────────────────────────── */}
      <header className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 px-4 sm:px-6 py-3 flex items-center justify-between gap-4 shrink-0 z-10">
        <div className="flex items-center gap-3 min-w-0">
          <div className="shrink-0 w-8 h-8 rounded-lg bg-zinc-900 dark:bg-white flex items-center justify-center">
            <FileText className="w-4 h-4 text-white dark:text-zinc-900" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-zinc-900 dark:text-white truncate text-sm leading-tight">
              Exam Session
            </p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-tight hidden sm:block">
              Stay focused. Do not refresh or leave this page.
            </p>
          </div>

          {!isFullscreen ? (
            <button
              onClick={toggleFullscreen}
              className="ml-2 flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60 rounded-md font-medium hover:bg-amber-100 dark:hover:bg-amber-950/60 transition-colors"
            >
              <Maximize className="w-3 h-3" />
              <span className="hidden sm:inline">Fullscreen</span>
            </button>
          ) : (
            <button
              onClick={toggleFullscreen}
              className="ml-2 flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 rounded-md font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              <Minimize className="w-3 h-3" />
              <span className="hidden sm:inline">Exit</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Answered counter */}
          <div className="hidden md:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-zinc-100 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-zinc-500 dark:text-zinc-400">
              <span className="font-semibold text-zinc-900 dark:text-white">
                {totalAnswered}
              </span>
              <span className="mx-0.5">/</span>
              {questions.length}
            </span>
          </div>

          {/* Timer */}
          <div
            className={`flex items-center gap-1.5 font-mono text-sm font-semibold px-3 py-1.5 rounded-md border transition-colors ${
              isCritical
                ? "bg-red-50 text-red-600 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/60 animate-pulse"
                : isWarning
                  ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60"
                  : "bg-zinc-100 text-zinc-900 dark:text-white dark:bg-zinc-800/70 border-zinc-200 dark:border-zinc-700"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            {formatTime(timeLeft)}
          </div>

          {/* Submit */}
          <button
            disabled={submitting}
            onClick={submitExam}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-semibold rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {submitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span>Submit</span>
          </button>
        </div>
      </header>

      {/* Top progress line */}
      <div className="h-0.5 w-full bg-zinc-200/60 dark:bg-zinc-800/60 shrink-0">
        <div
          className="h-full bg-emerald-500 transition-all duration-500"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* ─── Body ─────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ─── Main Question Area ──────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          <div className="w-full h-full px-6 lg:px-10 xl:px-14 py-6 lg:py-8">
            <div className="w-full space-y-6">
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden"
              >
                {/* Question header */}
                <div className="flex items-center justify-between px-6 lg:px-8 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/40">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Question
                    </span>
                    <span className="text-sm font-semibold text-zinc-900 dark:text-white">
                      {currentIndex + 1}
                      <span className="text-zinc-400 dark:text-zinc-500 font-normal">
                        {" "}
                        / {questions.length}
                      </span>
                    </span>
                  </div>
                  <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                    {q.marks} {q.marks === 1 ? "Mark" : "Marks"}
                  </span>
                </div>

                {/* Question body */}
                <div className="p-6 lg:p-8 space-y-6">
                  {q.question_text && (
                    <p className="text-zinc-900 dark:text-white text-lg lg:text-xl font-medium leading-relaxed">
                      {q.question_text}
                    </p>
                  )}

                  {q.image_url && !imgError[q.id] && (
                    <div className="rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
                      <img
                        src={`${(api.defaults.baseURL || "http://localhost:5000/api").replace("/api", "")}${q.image_url}`}
                        alt="Question visual"
                        className="w-full max-h-96 object-contain"
                        onError={() =>
                          setImgError((prev) => ({ ...prev, [q.id]: true }))
                        }
                      />
                    </div>
                  )}

                  {/* Options */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {q.options.map((opt, oIdx) => {
                      const isSelected = answers[q.id] === opt;
                      const letter = String.fromCharCode(65 + oIdx);
                      return (
                        <label
                          key={oIdx}
                          className={`group flex items-center gap-4 p-4 lg:p-5 rounded-xl cursor-pointer border transition-all select-none ${
                            isSelected
                              ? "border-zinc-900 dark:border-white bg-zinc-50 dark:bg-zinc-800/60 ring-2 ring-zinc-900/5 dark:ring-white/10"
                              : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40"
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
                          <div
                            className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-semibold shrink-0 transition-colors border ${
                              isSelected
                                ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white"
                                : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 group-hover:border-zinc-300 dark:group-hover:border-zinc-600"
                            }`}
                          >
                            {letter}
                          </div>
                          <span
                            className={`flex-1 text-[15px] lg:text-base leading-relaxed ${
                              isSelected
                                ? "text-zinc-900 dark:text-white font-medium"
                                : "text-zinc-700 dark:text-zinc-300"
                            }`}
                          >
                            {opt}
                          </span>
                          {isSelected && (
                            <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              </motion.div>

              {/* Navigation */}
              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={() => go(-1)}
                  disabled={isFirst}
                  className="flex items-center gap-1.5 px-5 py-2.5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 rounded-xl text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>

                <span className="text-[11px] text-zinc-400 dark:text-zinc-500 md:hidden font-mono">
                  {totalAnswered}/{questions.length}
                </span>

                {isLast ? (
                  <button
                    disabled={submitting}
                    onClick={submitExam}
                    className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 shadow-sm"
                  >
                    <Send className="w-4 h-4" /> Submit Exam
                  </button>
                ) : (
                  <button
                    onClick={() => go(1)}
                    className="flex items-center gap-1.5 px-5 py-2.5 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-semibold rounded-xl transition-colors shadow-sm"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ─── Question Palette ──────────────────────────────────────── */}
        <aside className="hidden md:flex flex-col w-72 bg-white dark:bg-zinc-900/60 border-l border-zinc-200 dark:border-zinc-800 p-5 gap-5 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <LayoutGrid className="w-3.5 h-3.5 text-zinc-400" />
              <p className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Question Palette
              </p>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {questions.map((question, idx) => {
                const isAnswered = !!answers[question.id];
                const isCurrent = idx === currentIndex;
                return (
                  <button
                    key={question.id}
                    onClick={() => setCurrentIndex(idx)}
                    title={`Question ${idx + 1}${isAnswered ? " (answered)" : ""}`}
                    className={`w-full aspect-square rounded-md text-xs font-semibold border transition-all ${
                      isCurrent
                        ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-sm"
                        : isAnswered
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60 hover:bg-emerald-100 dark:hover:bg-emerald-950/60"
                          : "bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-2 text-[11px] text-zinc-500 dark:text-zinc-400 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded bg-zinc-900 dark:bg-white" />
              <span>Current</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900/60" />
              <span>Answered</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800" />
              <span>Not Answered</span>
            </div>
          </div>

          {/* Progress */}
          <div className="mt-auto space-y-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-500 dark:text-zinc-400">Progress</span>
              <span className="font-mono font-semibold text-zinc-900 dark:text-white">
                {totalAnswered}/{questions.length}
              </span>
            </div>
            <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 text-right font-mono">
              {Math.round(progressPct)}% complete
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
