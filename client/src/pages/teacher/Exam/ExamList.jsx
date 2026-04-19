import React, { useEffect, useState } from "react";
import api from "../../../services/api";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Clock, FileText, ArrowRight, Edit3, BookOpen } from "lucide-react";

// ── Reusable Badge ────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const variants = {
    Draft: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
    Scheduled: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
    Live: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
    Completed: "bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium tracking-wide ${variants[status] ?? variants.Draft}`}
    >
      {status}
    </span>
  );
}

// ── Reusable Meta Row ─────────────────────────────────────────────────────────
function MetaItem({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{label}</span>
    </div>
  );
}

// ── Skeleton Card ─────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-3 animate-pulse">
      <div className="flex justify-between">
        <div className="h-5 w-20 rounded-md bg-zinc-100 dark:bg-zinc-800" />
        <div className="h-4 w-16 rounded bg-zinc-100 dark:bg-zinc-800" />
      </div>
      <div className="h-5 w-3/4 rounded bg-zinc-100 dark:bg-zinc-800" />
      <div className="space-y-1.5">
        <div className="h-3.5 w-full rounded bg-zinc-100 dark:bg-zinc-800" />
        <div className="h-3.5 w-5/6 rounded bg-zinc-100 dark:bg-zinc-800" />
      </div>
      <div className="pt-2 space-y-2">
        <div className="h-3.5 w-24 rounded bg-zinc-100 dark:bg-zinc-800" />
        <div className="h-3.5 w-28 rounded bg-zinc-100 dark:bg-zinc-800" />
      </div>
    </div>
  );
}

// ── Exam Card ─────────────────────────────────────────────────────────────────
function ExamCard({ exam, onNavigate }) {
  const canEdit = exam.status === "Draft" || exam.status === "Scheduled";

  return (
    <article
      onClick={() => onNavigate(`/teacher/exams/${exam.id}/manage`)}
      className="group relative flex flex-col rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 cursor-pointer transition-all duration-150 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-sm"
      aria-label={`${exam.title} — ${exam.status}`}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <StatusBadge status={exam.status} />
        <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
          {exam.type}
        </span>
      </div>

      {/* Title + description */}
      <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 leading-snug line-clamp-1 mb-1.5">
        {exam.title}
      </h3>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 min-h-[2.5rem] leading-relaxed">
        {exam.description || "No description provided."}
      </p>

      {/* Meta */}
      <div className="mt-4 flex flex-wrap gap-3">
        <MetaItem icon={Clock} label={`${exam.duration_minutes} min`} />
        <MetaItem icon={FileText} label={`${exam.total_questions_to_ask} questions`} />
      </div>

      {/* Divider + actions */}
      <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-3">
        {canEdit && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigate(`/teacher/exams/edit/${exam.id}`);
            }}
            className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Edit
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(`/teacher/exams/${exam.id}/manage`);
          }}
          className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          Manage
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </article>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-20 px-6 text-center rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
      <div className="mb-4 rounded-full bg-zinc-100 dark:bg-zinc-800 p-4">
        <BookOpen className="w-6 h-6 text-zinc-400 dark:text-zinc-500" />
      </div>
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">No exams yet</h3>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-[28ch] mb-5">
        Create your first exam to get started with assessments.
      </p>
      <Link
        to="/teacher/exams/create"
        className="inline-flex items-center gap-1.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-medium px-3.5 py-2 rounded-lg hover:opacity-90 transition-opacity"
      >
        <Plus className="w-3.5 h-3.5" />
        Create Exam
      </Link>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ExamList() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await api.get(`/teacher/exams`, {
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

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-[1200px] mx-auto px-6 py-8 space-y-6">

        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
              Exams
            </h1>
            {!loading && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                {exams.length} {exams.length === 1 ? "exam" : "exams"} total
              </p>
            )}
          </div>
          <Link
            to="/teacher/exams/create"
            className="inline-flex items-center gap-1.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Create Exam
          </Link>
        </div>

        {/* Separator */}
        <div className="h-px bg-zinc-200 dark:bg-zinc-800" />

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          ) : exams.length === 0 ? (
            <EmptyState />
          ) : (
            exams.map((exam) => (
              <ExamCard key={exam.id} exam={exam} onNavigate={navigate} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}