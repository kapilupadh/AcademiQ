// client/src/pages/student/Results/Results.jsx
import React, { useState, useEffect } from "react";
import api from "../../../services/api";
import {
    Trophy,
    ChevronRight,
    ChevronLeft,
    CheckCircle2,
    XCircle,
    Clock,
    BookOpen,
    BarChart2,
    Award,
    Target,
    ArrowLeft,
    Loader,
    FileQuestion,
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(dateStr) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

function pct(score, max) {
    if (!max) return 0;
    return Math.round((score / max) * 100);
}

// ─── Pass/Fail Badge ──────────────────────────────────────────────────────────

function PassBadge({ passed }) {
    return passed ? (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            <CheckCircle2 className="w-3 h-3" /> Pass
        </span>
    ) : (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
            <XCircle className="w-3 h-3" /> Fail
        </span>
    );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, color }) {
    const colors = {
        blue: "bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400",
        emerald: "bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400",
        amber: "bg-amber-50 dark:bg-amber-900/10 text-amber-600 dark:text-amber-400",
        purple: "bg-purple-50 dark:bg-purple-900/10 text-purple-600 dark:text-purple-400",
        red: "bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400",
    };
    return (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex items-center gap-3 shadow-sm">
            <div className={`p-2.5 rounded-lg ${colors[color]}`}>
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
                <p className="font-bold text-zinc-900 dark:text-white">{value}</p>
            </div>
        </div>
    );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ rows = 4 }) {
    return (
        <div className="space-y-3 animate-pulse">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="h-20 bg-zinc-100 dark:bg-zinc-800 rounded-xl" />
            ))}
        </div>
    );
}

// ─── Results List ─────────────────────────────────────────────────────────────

function ResultsList({ onSelect }) {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        api
            .get("/exam/my-results")
            .then((r) => setResults(r.data))
            .catch(() => setError("Failed to load results. Please try again."))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <Skeleton rows={5} />;

    if (error)
        return (
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl p-5 text-sm">
                {error}
            </div>
        );

    if (results.length === 0)
        return (
            <div className="text-center py-16 text-zinc-400 dark:text-zinc-600">
                <FileQuestion className="w-14 h-14 mx-auto mb-3 opacity-40" />
                <p className="font-medium text-zinc-500">No exam results yet</p>
                <p className="text-sm mt-1">Your completed exams will appear here.</p>
            </div>
        );

    return (
        <div className="space-y-3">
            {results.map((r) => {
                const passed = r.passed;

                return (
                    <button
                        key={r.attemptId}
                        // 🔥 FIX: We are now passing r.examId instead of r.attemptId
                        onClick={() => onSelect(r.examId, r)}
                        className="w-full text-left bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-md transition-all group"
                    >
                        <div className="flex items-center justify-between gap-4">
                            {/* Left: Exam info */}
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                    <h3 className="font-semibold text-zinc-900 dark:text-white truncate">
                                        {r.examTitle}
                                    </h3>
                                    <PassBadge passed={passed} />
                                </div>
                                <div className="flex items-center gap-3 text-xs text-zinc-500 flex-wrap">
                                    <span className="flex items-center gap-1">
                                        <BookOpen className="w-3 h-3" /> {r.type}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> {fmt(r.submittedAt)}
                                    </span>
                                </div>
                            </div>

                            {/* Right: Score */}
                            <div className="flex items-center gap-4 shrink-0">
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-zinc-900 dark:text-white leading-none">
                                        {r.score}
                                    </p>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mt-1">
                                        Marks Earned
                                    </p>
                                </div>
                                <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-800 hidden sm:block"></div>
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                                        {r.totalQuestions}
                                    </p>
                                    <p className="text-[10px] uppercase tracking-wider text-zinc-400">
                                        Questions
                                    </p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-zinc-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all ml-2" />
                            </div>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}

// ─── Result Detail ─────────────────────────────────────────────────────────────

function ResultDetail({ examId, summary, onBack }) {
    const [detail, setDetail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [filter, setFilter] = useState("all");

    useEffect(() => {
        api
            // 🔥 FIX: We now inject the examId into the URL
            .get(`/exam/${examId}/result`) 
            .then((r) => setDetail(r.data))
            .catch(() => setError("Failed to load exam detail."))
            .finally(() => setLoading(false));
    }, [examId]);

    if (loading)
        return (
            <div className="space-y-4">
                <button onClick={onBack} className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors mb-4">
                    <ArrowLeft className="w-4 h-4" /> Back to Results
                </button>
                <Skeleton rows={6} />
            </div>
        );

    if (error)
        return (
            <div>
                <button onClick={onBack} className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white mb-4">
                    <ArrowLeft className="w-4 h-4" /> Back to Results
                </button>
                <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl p-5 text-sm">
                    {error}
                </div>
            </div>
        );

    const { exam, score, totalQuestions, passed, submittedAt, answerReview: questions } = detail;
    
    const maxScore = questions.reduce((sum, q) => sum + (q.marks || 1), 0);
    const percentage = pct(score, maxScore);

    const correct = questions.filter((q) => q.isCorrect).length;
    const wrong = questions.filter((q) => !q.isCorrect && q.selectedOption).length;
    const skipped = questions.filter((q) => !q.selectedOption).length;

    const filtered = questions.filter((q) => {
        if (filter === "correct") return q.isCorrect;
        if (filter === "wrong") return !q.isCorrect && q.selectedOption;
        if (filter === "skipped") return !q.selectedOption;
        return true;
    });

    return (
        <div className="space-y-6">
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
                <ArrowLeft className="w-4 h-4" /> Back to Results
            </button>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                    <div className="flex flex-col items-center gap-2 shrink-0">
                        <div className="relative w-28 h-28 flex items-center justify-center">
                            {(() => {
                                const r = 46, circ = 2 * Math.PI * r;
                                const dash = (percentage / 100) * circ;
                                const color = passed ? "#10b981" : "#ef4444";
                                return (
                                    <svg width="112" height="112" viewBox="0 0 100 100" className="-rotate-90 absolute inset-0">
                                        <circle cx="50" cy="50" r={r} fill="none" strokeWidth="8"
                                            className="stroke-zinc-100 dark:stroke-zinc-800" />
                                        <circle cx="50" cy="50" r={r} fill="none" stroke={color}
                                            strokeWidth="8" strokeLinecap="round"
                                            strokeDasharray={`${dash} ${circ}`} />
                                    </svg>
                                );
                            })()}
                            <div className="relative text-center">
                                <p className={`text-2xl font-black ${passed ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
                                    {percentage}%
                                </p>
                            </div>
                        </div>
                        <PassBadge passed={passed} />
                    </div>

                    <div className="flex-1 min-w-0">
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-1 truncate">
                            {exam.title}
                        </h2>
                        <p className="text-sm text-zinc-500 mb-4">
                            {exam.type} &bull; Submitted {fmt(submittedAt)}
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <StatCard icon={Trophy} label="Score" value={`${score} / ${maxScore}`} color="blue" />
                            <StatCard icon={CheckCircle2} label="Correct" value={`${correct} / ${questions.length}`} color="emerald" />
                            <StatCard icon={XCircle} label="Wrong" value={wrong} color="red" />
                            <StatCard icon={Target} label="Pass Mark" value={`${exam.passingPercentage ?? 40}%`} color="purple" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
                {[
                    { key: "all", label: `All (${questions.length})` },
                    { key: "correct", label: `Correct (${correct})` },
                    { key: "wrong", label: `Wrong (${wrong})` },
                    { key: "skipped", label: `Skipped (${skipped})` },
                ].map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setFilter(tab.key)}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${filter === tab.key
                                ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                                : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400"
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="space-y-4">
                {filtered.length === 0 && (
                    <div className="text-center py-10 text-zinc-400 text-sm">
                        No questions in this category.
                    </div>
                )}
                {filtered.map((q, idx) => {
                    const globalIdx = questions.indexOf(q);
                    const isCorrect = q.isCorrect;
                    const isSkipped = !q.selectedOption;

                    return (
                        <div
                            key={q.questionId}
                            className={`bg-white dark:bg-zinc-900 border-2 rounded-2xl overflow-hidden shadow-sm transition-colors ${isSkipped
                                    ? "border-zinc-200 dark:border-zinc-700"
                                    : isCorrect
                                        ? "border-emerald-300 dark:border-emerald-800"
                                        : "border-red-300 dark:border-red-900"
                                }`}
                        >
                            <div className={`px-5 py-3 flex items-center justify-between text-xs font-bold ${isSkipped
                                    ? "bg-zinc-50 dark:bg-zinc-950 text-zinc-500"
                                    : isCorrect
                                        ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
                                        : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
                                }`}>
                                <span>Q{globalIdx + 1}</span>
                                <div className="flex items-center gap-2">
                                    <span>{q.marks} {q.marks === 1 ? "mark" : "marks"}</span>
                                    {isSkipped ? (
                                        <span className="px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                                            Skipped
                                        </span>
                                    ) : isCorrect ? (
                                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40">
                                            <CheckCircle2 className="w-3 h-3" /> Correct
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/40">
                                            <XCircle className="w-3 h-3" /> Wrong
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="p-5 space-y-4">
                                <p className="text-zinc-900 dark:text-white font-medium leading-relaxed">
                                    {q.questionText}
                                </p>

                                <div className="space-y-2">
                                    {q.options.map((opt, oIdx) => {
                                        const letter = String.fromCharCode(65 + oIdx);
                                        const isChosen = opt === q.selectedOption;
                                        const isAnswer = opt === q.correctAnswer;

                                        let cls =
                                            "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300";
                                        if (isAnswer)
                                            cls =
                                                "border-emerald-400 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300";
                                        if (isChosen && !isCorrect)
                                            cls =
                                                "border-red-400 dark:border-red-700 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300";

                                        return (
                                            <div
                                                key={oIdx}
                                                className={`flex items-center gap-3 p-3 rounded-xl border-2 ${cls}`}
                                            >
                                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isAnswer
                                                        ? "bg-emerald-500 text-white"
                                                        : isChosen && !isCorrect
                                                            ? "bg-red-500 text-white"
                                                            : "bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400"
                                                    }`}>
                                                    {letter}
                                                </div>
                                                <span className="flex-1 text-sm">{opt}</span>
                                                <div className="flex items-center gap-1 shrink-0">
                                                    {isAnswer && (
                                                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                                            <CheckCircle2 className="w-3.5 h-3.5" /> Correct
                                                        </span>
                                                    )}
                                                    {isChosen && !isAnswer && (
                                                        <span className="text-xs font-bold text-red-500 flex items-center gap-1">
                                                            <XCircle className="w-3.5 h-3.5" /> Your Answer
                                                        </span>
                                                    )}
                                                    {isChosen && isAnswer && (
                                                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                                            <CheckCircle2 className="w-3.5 h-3.5" /> Your Answer
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {isSkipped && (
                                    <p className="text-xs text-zinc-400 italic flex items-center gap-1">
                                        <FileQuestion className="w-3.5 h-3.5" />
                                        You did not answer this question.
                                        <span className="font-semibold text-zinc-500 not-italic ml-1">
                                            Correct answer: {q.correctAnswer}
                                        </span>
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function Results() {
    const [selectedExamId, setSelectedExamId] = useState(null);
    const [selectedSummary, setSelectedSummary] = useState(null);

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
            {!selectedExamId ? (
                <>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
                                <BarChart2 className="w-8 h-8 text-blue-500" />
                                My Results
                            </h1>
                            <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">
                                View your past exam results and detailed answer breakdown.
                            </p>
                        </div>
                    </div>

                    <ResultsList
                        onSelect={(examId, summary) => {
                            setSelectedExamId(examId);
                            setSelectedSummary(summary);
                        }}
                    />
                </>
            ) : (
                <ResultDetail
                    examId={selectedExamId}
                    summary={selectedSummary}
                    onBack={() => {
                        setSelectedExamId(null);
                        setSelectedSummary(null);
                    }}
                />
            )}
        </div>
    );
}