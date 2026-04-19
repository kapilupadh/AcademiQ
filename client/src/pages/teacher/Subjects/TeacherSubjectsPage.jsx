import React, { useState, useEffect, useCallback } from "react";
import api from "../../../services/api";
import {
  BookOpen, Plus, Trash2, Loader, AlertTriangle,
  CheckCircle2, Search, GraduationCap,
} from "lucide-react";

// ── Reusable: Toast Banner ────────────────────────────────────────────────────
function Banner({ type, message }) {
  if (!message) return null;
  const styles = {
    error:   "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400",
    success: "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400",
  };
  const Icon = type === "error" ? AlertTriangle : CheckCircle2;
  return (
    <div className={`flex items-center gap-2 border rounded-lg px-4 py-3 text-xs ${styles[type]}`}>
      <Icon className="w-3.5 h-3.5 shrink-0" />
      {message}
    </div>
  );
}

// ── Reusable: Empty State ─────────────────────────────────────────────────────
function EmptyState({ icon: Icon, title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="mb-3 p-3 rounded-full bg-zinc-100 dark:bg-zinc-800">
        <Icon className="w-5 h-5 text-zinc-400 dark:text-zinc-500" />
      </div>
      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{title}</p>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-[28ch] mb-4">{subtitle}</p>
      {action}
    </div>
  );
}

// ── Semester color map (neutral, not loud) ────────────────────────────────────
const SEM_COLORS = [
  "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
  "bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400",
  "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
  "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
  "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400",
  "bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400",
  "bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400",
];
const semColor = (sem) => SEM_COLORS[(sem - 1) % SEM_COLORS.length];

// ── Subject Row ───────────────────────────────────────────────────────────────
function SubjectRow({ subject: s, action }) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5 gap-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
            {s.name}
          </span>
          {s.code && (
            <span className="text-xs font-mono text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded shrink-0">
              {s.code}
            </span>
          )}
          <span className={`text-xs font-medium px-2 py-0.5 rounded-md shrink-0 ${semColor(s.semester)}`}>
            Sem {s.semester}
          </span>
          {s.category && (
            <span className="text-xs text-zinc-400 dark:text-zinc-500">{s.category}</span>
          )}
        </div>
        {s.program && (
          <p className="text-xs text-zinc-400 dark:text-zinc-500">{s.program.name}</p>
        )}
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function TeacherSubjectsPage() {
  const [mySubjects, setMySubjects]       = useState([]);
  const [available, setAvailable]         = useState([]);
  const [semesters, setSemesters]         = useState([]);
  const [selectedSem, setSelectedSem]     = useState("");
  const [search, setSearch]               = useState("");
  const [tab, setTab]                     = useState("mine");
  const [loading, setLoading]             = useState(true);
  const [browseLoading, setBrowseLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [error, setError]                 = useState("");
  const [success, setSuccess]             = useState("");

  const fetchMine = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/teacher/my-subjects");
      setMySubjects(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load your subjects.");
    } finally { setLoading(false); }
  }, []);

  const fetchSemesters = useCallback(async () => {
    try {
      const res = await api.get("/teacher/available-subjects/semesters");
      setSemesters(res.data);
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => { fetchMine(); fetchSemesters(); }, []);

  useEffect(() => {
    if (tab !== "browse") return;
    setBrowseLoading(true);
    const params = selectedSem ? `?semester=${selectedSem}` : "";
    api.get(`/teacher/available-subjects${params}`)
      .then((r) => setAvailable(r.data))
      .catch(console.error)
      .finally(() => setBrowseLoading(false));
  }, [tab, selectedSem]);

  const handleClaim = async (subjectId, subjectName) => {
    setActionLoading((p) => ({ ...p, [subjectId]: true }));
    setError(""); setSuccess("");
    try {
      await api.post("/teacher/my-subjects/claim", { subject_id: subjectId });
      setSuccess(`"${subjectName}" added to your subjects.`);
      await fetchMine();
      setAvailable((prev) =>
        prev.map((s) => s.id === subjectId ? { ...s, is_claimed: true } : s)
      );
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to claim subject.");
    } finally { setActionLoading((p) => ({ ...p, [subjectId]: false })); }
  };

  const handleUnclaim = async (subjectId, subjectName) => {
    if (!window.confirm(`Remove "${subjectName}" from your subjects?`)) return;
    setActionLoading((p) => ({ ...p, [subjectId]: true }));
    setError(""); setSuccess("");
    try {
      await api.delete(`/teacher/my-subjects/${subjectId}`);
      setSuccess(`"${subjectName}" removed.`);
      setMySubjects((prev) => prev.filter((s) => s.id !== subjectId));
      setAvailable((prev) =>
        prev.map((s) => s.id === subjectId ? { ...s, is_claimed: false } : s)
      );
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to remove subject.");
    } finally { setActionLoading((p) => ({ ...p, [subjectId]: false })); }
  };

  const filteredAvailable = available.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.code || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        {/* Page header */}
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
            My Subjects
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Add the subjects you teach — they appear in attendance sessions.
          </p>
        </div>

        <div className="h-px bg-zinc-200 dark:bg-zinc-800" />

        {/* Banners */}
        <Banner type="error"   message={error} />
        <Banner type="success" message={success} />

        {/* Tabs */}
        <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800/60 p-1 rounded-lg w-fit">
          {[
            { v: "mine",   label: `My Subjects (${mySubjects.length})`, icon: BookOpen },
            { v: "browse", label: "Browse & Add",                        icon: Plus     },
          ].map(({ v, label, icon: Icon }) => (
            <button
              key={v}
              onClick={() => setTab(v)}
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
                tab === v
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* ── My Subjects Tab ── */}
        {tab === "mine" && (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
            {/* Table header */}
            <div className="px-5 py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
              <GraduationCap className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                Claimed Subjects
                <span className="ml-1.5 font-normal text-zinc-400">({mySubjects.length})</span>
              </span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center gap-2 py-16 text-zinc-400 text-xs">
                <Loader className="w-4 h-4 animate-spin" /> Loading…
              </div>
            ) : mySubjects.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="No subjects added yet"
                subtitle="Browse the subject catalogue and claim the ones you teach."
                action={
                  <button
                    onClick={() => setTab("browse")}
                    className="inline-flex items-center gap-1.5 bg-zinc-900 dark:bg-white hover:opacity-90 text-white dark:text-zinc-900 text-xs font-medium px-4 py-2 rounded-lg transition-opacity"
                  >
                    <Plus className="w-3.5 h-3.5" /> Browse Subjects
                  </button>
                }
              />
            ) : (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {mySubjects.map((s) => (
                  <SubjectRow
                    key={s.id}
                    subject={s}
                    action={
                      <button
                        onClick={() => handleUnclaim(s.id, s.name)}
                        disabled={actionLoading[s.id]}
                        className="p-1.5 rounded-md text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors disabled:opacity-50"
                        title="Remove subject"
                      >
                        {actionLoading[s.id]
                          ? <Loader className="w-3.5 h-3.5 animate-spin" />
                          : <Trash2 className="w-3.5 h-3.5" />
                        }
                      </button>
                    }
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Browse Tab ── */}
        {tab === "browse" && (
          <div className="space-y-4">
            {/* Search + filter row */}
            <div className="flex gap-3 flex-wrap">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or code…"
                  className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg outline-none focus:border-zinc-400 dark:focus:border-zinc-600 focus:ring-2 focus:ring-zinc-100 dark:focus:ring-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 transition-all"
                />
              </div>
              <select
                value={selectedSem}
                onChange={(e) => setSelectedSem(e.target.value)}
                className="px-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg outline-none focus:border-zinc-400 dark:focus:border-zinc-600 text-zinc-900 dark:text-zinc-100 transition-all"
              >
                <option value="">All Semesters</option>
                {semesters.map((s) => (
                  <option key={s} value={s}>Semester {s}</option>
                ))}
              </select>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
              {/* Table header */}
              <div className="px-5 py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  Available Subjects
                  {!browseLoading && (
                    <span className="ml-1.5 font-normal text-zinc-400">
                      ({filteredAvailable.length})
                    </span>
                  )}
                </span>
              </div>

              {browseLoading ? (
                <div className="flex items-center justify-center gap-2 py-16 text-zinc-400 text-xs">
                  <Loader className="w-4 h-4 animate-spin" /> Loading subjects…
                </div>
              ) : filteredAvailable.length === 0 ? (
                <EmptyState
                  icon={Search}
                  title={available.length === 0 ? "No subjects in your department" : "No results"}
                  subtitle={available.length === 0
                    ? "Contact your admin to add subjects to the catalogue."
                    : "Try a different name, code, or semester filter."
                  }
                />
              ) : (
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {filteredAvailable.map((s) => (
                    <SubjectRow
                      key={s.id}
                      subject={s}
                      action={
                        s.is_claimed ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Added
                          </span>
                        ) : (
                          <button
                            onClick={() => handleClaim(s.id, s.name)}
                            disabled={actionLoading[s.id]}
                            className="inline-flex items-center gap-1.5 bg-zinc-900 dark:bg-white hover:opacity-90 disabled:opacity-50 text-white dark:text-zinc-900 text-xs font-medium px-3 py-1.5 rounded-lg transition-opacity"
                          >
                            {actionLoading[s.id]
                              ? <Loader className="w-3 h-3 animate-spin" />
                              : <Plus className="w-3 h-3" />
                            }
                            Add
                          </button>
                        )
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}