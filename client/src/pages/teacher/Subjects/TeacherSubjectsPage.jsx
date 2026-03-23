// client/src/pages/teacher/Subjects/TeacherSubjectsPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import api from "../../../services/api";
import {
  BookOpen, Plus, Trash2, Loader, AlertTriangle,
  CheckCircle2, Search, Filter, GraduationCap,
} from "lucide-react";

export default function TeacherSubjectsPage() {
  const [mySubjects, setMySubjects] = useState([]);
  const [available, setAvailable] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [selectedSem, setSelectedSem] = useState("");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("mine"); // mine | browse
  const [loading, setLoading] = useState(true);
  const [browseLoading, setBrowseLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
      .then(r => setAvailable(r.data))
      .catch(console.error)
      .finally(() => setBrowseLoading(false));
  }, [tab, selectedSem]);

  const handleClaim = async (subjectId, subjectName) => {
    setActionLoading(p => ({ ...p, [subjectId]: true }));
    setError(""); setSuccess("");
    try {
      await api.post("/teacher/my-subjects/claim", { subject_id: subjectId });
      setSuccess(`"${subjectName}" added to your subjects.`);
      await fetchMine();
      // Update available list claim status
      setAvailable(prev => prev.map(s => s.id === subjectId ? { ...s, is_claimed: true } : s));
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to claim subject.");
    } finally { setActionLoading(p => ({ ...p, [subjectId]: false })); }
  };

  const handleUnclaim = async (subjectId, subjectName) => {
    if (!window.confirm(`Remove "${subjectName}" from your subjects?`)) return;
    setActionLoading(p => ({ ...p, [subjectId]: true }));
    setError(""); setSuccess("");
    try {
      await api.delete(`/teacher/my-subjects/${subjectId}`);
      setSuccess(`"${subjectName}" removed.`);
      setMySubjects(prev => prev.filter(s => s.id !== subjectId));
      setAvailable(prev => prev.map(s => s.id === subjectId ? { ...s, is_claimed: false } : s));
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to remove subject.");
    } finally { setActionLoading(p => ({ ...p, [subjectId]: false })); }
  };

  const filteredAvailable = available.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.code || "").toLowerCase().includes(search.toLowerCase())
  );

  const semColors = ["bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  ];
  const semColor = (sem) => semColors[(sem - 1) % semColors.length];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
          <BookOpen className="w-7 h-7 text-teal-500" /> My Subjects
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">
          Add the subjects you teach. These will appear in your attendance sessions.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl p-4 text-red-600 dark:text-red-400 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 text-emerald-600 dark:text-emerald-400 text-sm font-semibold">
          <CheckCircle2 className="w-4 h-4 shrink-0" />{success}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800/50 p-1 rounded-xl w-fit">
        {[
          { v: "mine", label: `My Subjects (${mySubjects.length})`, icon: BookOpen },
          { v: "browse", label: "Browse & Add", icon: Plus },
        ].map(({ v, label, icon: Icon }) => (
          <button key={v} onClick={() => setTab(v)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === v ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"}`}>
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* My Subjects tab */}
      {tab === "mine" && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-zinc-400">
              <Loader className="w-5 h-5 animate-spin" /> Loading…
            </div>
          ) : mySubjects.length === 0 ? (
            <div className="text-center py-16 space-y-3 text-zinc-400">
              <BookOpen className="w-12 h-12 mx-auto opacity-20" />
              <p className="font-medium text-zinc-500">No subjects added yet</p>
              <p className="text-sm">Switch to "Browse & Add" to claim the subjects you teach.</p>
              <button onClick={() => setTab("browse")}
                className="mt-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-sm transition-all">
                Browse Subjects
              </button>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {mySubjects.map(s => (
                <div key={s.id} className="flex items-center justify-between px-5 py-4 gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-zinc-900 dark:text-white text-sm">{s.name}</p>
                      {s.code && <span className="text-xs font-mono text-zinc-400">{s.code}</span>}
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${semColor(s.semester)}`}>
                        Sem {s.semester}
                      </span>
                    </div>
                    {s.program && <p className="text-xs text-zinc-400 mt-0.5">{s.program.name} · {s.category}</p>}
                  </div>
                  <button onClick={() => handleUnclaim(s.id, s.name)} disabled={actionLoading[s.id]}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-all disabled:opacity-50 shrink-0">
                    {actionLoading[s.id] ? <Loader className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Browse tab */}
      {tab === "browse" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search subjects…"
                className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:border-teal-500 text-sm text-zinc-900 dark:text-white" />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-zinc-400" />
              <select value={selectedSem} onChange={e => setSelectedSem(e.target.value)}
                className="px-3 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:border-teal-500 text-sm text-zinc-900 dark:text-white">
                <option value="">All Semesters</option>
                {semesters.map(s => <option key={s} value={s}>Semester {s}</option>)}
              </select>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
            {browseLoading ? (
              <div className="flex items-center justify-center gap-2 py-16 text-zinc-400">
                <Loader className="w-5 h-5 animate-spin" /> Loading subjects…
              </div>
            ) : filteredAvailable.length === 0 ? (
              <div className="text-center py-16 text-zinc-400 text-sm">
                {available.length === 0 ? "No subjects found in your department." : "No subjects match your search."}
              </div>
            ) : (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {filteredAvailable.map(s => (
                  <div key={s.id} className={`flex items-center justify-between px-5 py-4 gap-4 transition-colors ${s.is_claimed ? "bg-teal-50/50 dark:bg-teal-900/5" : ""}`}>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-zinc-900 dark:text-white text-sm">{s.name}</p>
                        {s.code && <span className="text-xs font-mono text-zinc-400">{s.code}</span>}
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${semColor(s.semester)}`}>
                          Sem {s.semester}
                        </span>
                        <span className="text-xs text-zinc-400">{s.category}</span>
                      </div>
                      {s.program && <p className="text-xs text-zinc-400 mt-0.5">{s.program.name}</p>}
                    </div>
                    {s.is_claimed ? (
                      <div className="flex items-center gap-1.5 text-teal-600 dark:text-teal-400 text-xs font-bold shrink-0">
                        <CheckCircle2 className="w-4 h-4" /> Added
                      </div>
                    ) : (
                      <button onClick={() => handleClaim(s.id, s.name)} disabled={actionLoading[s.id]}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg transition-all disabled:opacity-50 shrink-0">
                        {actionLoading[s.id] ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                        Add
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}