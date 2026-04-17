// client/src/pages/student/Result/Result.jsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../../services/api";
import {
    Trophy,
    ChevronRight,
    CheckCircle2,
    XCircle,
    Clock,
    BookOpen,
    BarChart2,
    Target,
    ArrowLeft,
    FileQuestion,
    MinusCircle,
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
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/60">
            <CheckCircle2 className="w-3 h-3" /> Pass
        </span>
    ) : (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/60">
            <XCircle className="w-3 h-3" /> Fail
        </span>
    );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, tone = "neutral" }) {
    const tones = {
        neutral: "text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800",
        emerald: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40",
        red: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40",
        amber: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40",
        blue: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40",
    };
    return (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 flex items-center gap-3">
            <div className={`p-2 rounded-lg ${tones[tone]}`}>
                <Icon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-wide text-zinc-500 dark:text-zinc-500 font-medium">
                    {label}
                </p>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5 truncate">
                    {value}
                </p>
            </div>
        </div>
    );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ rows = 4 }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: rows }).map((_, i) => (
                <div
                    key={i}
                    className="h-20 bg-zinc-100 dark:bg-zinc-900 rounded-xl animate-pulse border border-zinc-200 dark:border-zinc-800"
                />
            ))}
        </div>
    );
}

// ─── Empty / Error States ─────────────────────────────────────────────────────

function EmptyState({ icon: Icon, title, description }) {
    return (
        <div className="border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl py-16 px-6 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                <Icon className="w-5 h-5 text-zinc-400" />
            </div>
            <p className="font-medium text-zinc-700 dark:text-zinc-200 text-sm">{title}</p>
            {description && (
                <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">{description}</p>
            )}
        </div>
    );
}

function ErrorState({ message }) {
    return (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-400 rounded-xl p-4 text-sm flex items-start gap-2">
            <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{message}</span>
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
    if (error) return <ErrorState message={error} />;

    if (results.length === 0)
        return (
            <EmptyState
                icon={FileQuestion}
                title="No exam results yet"
                description="Your completed exams will appear here."
            />
        );

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={{
                visible: { transition: { staggerChildren: 0.04 } },
            }}
            className="space-y-2.5"
        >
            {results.map((r) => {
                const passed = r.passed;
                return (
                    <motion.button
                        key={r.attemptId}
                        variants={{
                            hidden: { opacity: 0, y: 8 },
                            visible: { opacity: 1, y: 0 },
                        }}
                        whileHover={{ y: -1 }}
                        transition={{ duration: 0.15 }}
                        // 🔥 FIX: We are now passing r.examId instead of r.attemptId
                        onClick={() => onSelect(r.examId, r)}
                        className="w-full text-left bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-sm transition-all group"
                    >
                        <div className="flex items-center justify-between gap-4">
                            {/* Left: Exam info */}
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 truncate text-[15px]">
                                        {r.examTitle}
                                    </h3>
                                    <PassBadge passed={passed} />
                                </div>
                                <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-500 flex-wrap">
                                    <span className="flex items-center gap-1.5">
                                        <BookOpen className="w-3 h-3" /> {r.type}
                                    </span>
                                    <span className="text-zinc-300 dark:text-zinc-700">•</span>
                                    <span className="flex items-center gap-1.5">
                                        <Clock className="w-3 h-3" /> {fmt(r.submittedAt)}
                                    </span>
                                </div>
                            </div>

                            {/* Right: Score */}
                            <div className="flex items-center gap-4 shrink-0">
                                <div className="text-right">
                                    <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 leading-none tabular-nums">
                                        {r.score}
                                    </p>
                                    <p className="text-[10px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mt-1 font-medium">
                                        Marks
                                    </p>
                                </div>
                                <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-800 hidden sm:block" />
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 tabular-nums">
                                        {r.totalQuestions}
                                    </p>
                                    <p className="text-[10px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mt-1 font-medium">
                                        Questions
                                    </p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 group-hover:translate-x-0.5 transition-all" />
                            </div>
                        </div>
                    </motion.button>
                );
            })}
        </motion.div>
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

    const BackButton = () => (
        <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
            <ArrowLeft className="w-4 h-4" /> Back to Results
        </button>
    );

    if (loading)
        return (
            <div className="space-y-5">
                <BackButton />
                <Skeleton rows={6} />
            </div>
        );

    if (error)
        return (
            <div className="space-y-5">
                <BackButton />
                <ErrorState message={error} />
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
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
        >
            <BackButton />

            {/* Summary Card */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                    {/* Progress ring */}
                    <div className="flex flex-col items-center gap-3 shrink-0">
                        <div className="relative w-28 h-28 flex items-center justify-center">
                            {(() => {
                                const r = 46, circ = 2 * Math.PI * r;
                                const dash = (percentage / 100) * circ;
                                const color = passed ? "#10b981" : "#ef4444";
                                return (
                                    <svg width="112" height="112" viewBox="0 0 100 100" className="-rotate-90 absolute inset-0">
                                        <circle
                                            cx="50" cy="50" r={r}
                                            fill="none" strokeWidth="8"
                                            className="stroke-zinc-100 dark:stroke-zinc-800"
                                        />
                                        <motion.circle
                                            cx="50" cy="50" r={r}
                                            fill="none" stroke={color}
                                            strokeWidth="8" strokeLinecap="round"
                                            initial={{ strokeDasharray: `0 ${circ}` }}
                                            animate={{ strokeDasharray: `${dash} ${circ}` }}
                                            transition={{ duration: 0.8, ease: "easeOut" }}
                                        />
                                    </svg>
                                );
                            })()}
                            <div className="relative text-center">
                                <p className={`text-2xl font-semibold tabular-nums ${passed ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
                                    {percentage}%
                                </p>
                            </div>
                        </div>
                        <PassBadge passed={passed} />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                        <h2 className="text-lg md:text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-1 truncate">
                            {exam.title}
                        </h2>
                        <p className="text-xs text-zinc-500 dark:text-zinc-500 mb-4 flex items-center gap-2 flex-wrap">
                            <span className="inline-flex items-center gap-1">
                                <BookOpen className="w-3 h-3" /> {exam.type}
                            </span>
                            <span className="text-zinc-300 dark:text-zinc-700">•</span>
                            <span className="inline-flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Submitted {fmt(submittedAt)}
                            </span>
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                            <StatCard icon={Trophy} label="Score" value={`${score} / ${maxScore}`} tone="blue" />
                            <StatCard icon={CheckCircle2} label="Correct" value={`${correct} / ${questions.length}`} tone="emerald" />
                            <StatCard icon={XCircle} label="Wrong" value={wrong} tone="red" />
                            <StatCard icon={Target} label="Pass Mark" value={`${exam.passingPercentage ?? 40}%`} tone="amber" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter tabs */}
            <div className="flex items-center gap-1.5 flex-wrap p-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl w-fit">
                {[
                    { key: "all", label: "All", count: questions.length },
                    { key: "correct", label: "Correct", count: correct },
                    { key: "wrong", label: "Wrong", count: wrong },
                    { key: "skipped", label: "Skipped", count: skipped },
                ].map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setFilter(tab.key)}
                        className={`relative px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            filter === tab.key
                                ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm"
                                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                        }`}
                    >
                        {tab.label}
                        <span className={`ml-1.5 tabular-nums ${filter === tab.key ? "text-zinc-500 dark:text-zinc-400" : "text-zinc-400 dark:text-zinc-600"}`}>
                            {tab.count}
                        </span>
                    </button>
                ))}
            </div>

            {/* Question list */}
            <div className="space-y-3">
                {filtered.length === 0 && (
                    <EmptyState
                        icon={FileQuestion}
                        title="Nothing here"
                        description="No questions match this filter."
                    />
                )}

                <AnimatePresence mode="popLayout">
                    {filtered.map((q) => {
                        const globalIdx = questions.indexOf(q);
                        const isCorrect = q.isCorrect;
                        const isSkipped = !q.selectedOption;

                        const borderTone = isSkipped
                            ? "border-zinc-200 dark:border-zinc-800"
                            : isCorrect
                                ? "border-emerald-200 dark:border-emerald-900/60"
                                : "border-red-200 dark:border-red-900/60";

                        const headerTone = isSkipped
                            ? "bg-zinc-50 dark:bg-zinc-900/60 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800"
                            : isCorrect
                                ? "bg-emerald-50/60 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/60"
                                : "bg-red-50/60 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/60";

                        return (
                            <motion.div
                                key={q.questionId}
                                layout
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className={`bg-white dark:bg-zinc-900 border rounded-2xl overflow-hidden ${borderTone}`}
                            >
                                {/* Header */}
                                <div className={`px-5 py-2.5 flex items-center justify-between text-xs font-medium border-b ${headerTone}`}>
                                    <span className="tabular-nums">Question {globalIdx + 1}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="tabular-nums">
                                            {q.marks} {q.marks === 1 ? "mark" : "marks"}
                                        </span>
                                        <span className="opacity-40">•</span>
                                        {isSkipped ? (
                                            <span className="inline-flex items-center gap-1">
                                                <MinusCircle className="w-3 h-3" /> Skipped
                                            </span>
                                        ) : isCorrect ? (
                                            <span className="inline-flex items-center gap-1">
                                                <CheckCircle2 className="w-3 h-3" /> Correct
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1">
                                                <XCircle className="w-3 h-3" /> Wrong
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Body */}
                                <div className="p-5 space-y-4">
                                    <p className="text-zinc-900 dark:text-zinc-100 font-medium leading-relaxed text-[15px]">
                                        {q.questionText}
                                    </p>

                                    <div className="space-y-2">
                                        {q.options.map((opt, oIdx) => {
                                            const letter = String.fromCharCode(65 + oIdx);
                                            const isChosen = opt === q.selectedOption;
                                            const isAnswer = opt === q.correctAnswer;

                                            let cls =
                                                "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/40 text-zinc-700 dark:text-zinc-300";
                                            if (isAnswer)
                                                cls =
                                                    "border-emerald-300 dark:border-emerald-900/70 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200";
                                            if (isChosen && !isCorrect)
                                                cls =
                                                    "border-red-300 dark:border-red-900/70 bg-red-50/60 dark:bg-red-950/30 text-red-800 dark:text-red-200";

                                            return (
                                                <div
                                                    key={oIdx}
                                                    className={`flex items-center gap-3 p-3 rounded-xl border ${cls}`}
                                                >
                                                    <div
                                                        className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-semibold shrink-0 ${
                                                            isAnswer
                                                                ? "bg-emerald-500 text-white"
                                                                : isChosen && !isCorrect
                                                                    ? "bg-red-500 text-white"
                                                                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                                                        }`}
                                                    >
                                                        {letter}
                                                    </div>
                                                    <span className="flex-1 text-sm">{opt}</span>
                                                    <div className="flex items-center gap-1 shrink-0">
                                                        {isAnswer && !isChosen && (
                                                            <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100/60 dark:bg-emerald-950/50">
                                                                <CheckCircle2 className="w-3 h-3" /> Correct
                                                            </span>
                                                        )}
                                                        {isChosen && !isAnswer && (
                                                            <span className="text-[11px] font-medium text-red-600 dark:text-red-400 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-100/60 dark:bg-red-950/50">
                                                                <XCircle className="w-3 h-3" /> Your answer
                                                            </span>
                                                        )}
                                                        {isChosen && isAnswer && (
                                                            <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100/60 dark:bg-emerald-950/50">
                                                                <CheckCircle2 className="w-3 h-3" /> Your answer
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {isSkipped && (
                                        <div className="text-xs text-zinc-500 dark:text-zinc-400 flex items-start gap-1.5 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2">
                                            <FileQuestion className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                                            <span>
                                                You did not answer this question.
                                                <span className="font-medium text-zinc-700 dark:text-zinc-200 ml-1">
                                                    Correct answer: {q.correctAnswer}
                                                </span>
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function Results() {
    const [selectedExamId, setSelectedExamId] = useState(null);
    const [selectedSummary, setSelectedSummary] = useState(null);

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <AnimatePresence mode="wait">
                {!selectedExamId ? (
                    <motion.div
                        key="list"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-6"
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5 tracking-tight">
                                    <span className="w-8 h-8 rounded-lg bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center">
                                        <BarChart2 className="w-4 h-4 text-white dark:text-zinc-900" />
                                    </span>
                                    My Results
                                </h1>
                                <p className="text-zinc-500 dark:text-zinc-400 mt-1.5 text-sm">
                                    View your past exam results and detailed answer breakdown.
                                </p>
                            </div>
                        </div>

                        <div className="h-px bg-zinc-200 dark:bg-zinc-800" />

                        <ResultsList
                            onSelect={(examId, summary) => {
                                setSelectedExamId(examId);
                                setSelectedSummary(summary);
                            }}
                        />
                    </motion.div>
                ) : (
                    <motion.div
                        key="detail"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <ResultDetail
                            examId={selectedExamId}
                            summary={selectedSummary}
                            onBack={() => {
                                setSelectedExamId(null);
                                setSelectedSummary(null);
                            }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
