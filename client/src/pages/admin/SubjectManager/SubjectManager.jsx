import React, { useState, useEffect, useRef } from "react";
import api from "../../../services/api";
import {
  Building2, BookOpen, ChevronRight, ChevronDown,
  Pencil, Trash2, Check, X, Loader, Search,
  BookMarked, RefreshCw, GraduationCap,
} from "lucide-react";

/* ─── Category badges ────────────────────────────────────────────── */
const CATEGORY_COLORS = {
  Core:     "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  Minor:    "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400",
  GEC:      "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
  AEC:      "bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400",
  VAC:      "bg-pink-50 text-pink-700 dark:bg-pink-950/40 dark:text-pink-400",
  SEC:      "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400",
  Research: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400",
  DSE:      "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400",
};

const catBadge = (cat) => {
  if (!cat) return null;
  const cls = CATEGORY_COLORS[cat] || "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400";
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border border-black/5 dark:border-white/5 shrink-0 ${cls}`}>
      {cat}
    </span>
  );
};

/* ─── Skeleton ───────────────────────────────────────────────────── */
function SkeletonSubject() {
  return (
    <div className="flex items-center gap-4 px-4 py-2.5 animate-pulse border-b border-zinc-100 dark:border-zinc-800/60 last:border-0">
      <div className="h-3 w-12 rounded bg-zinc-100 dark:bg-zinc-800" />
      <div className="h-3 flex-1 rounded bg-zinc-100 dark:bg-zinc-800" />
      <div className="h-5 w-12 rounded-md bg-zinc-100 dark:bg-zinc-800" />
      <div className="h-5 w-14 rounded-md bg-zinc-100 dark:bg-zinc-800" />
    </div>
  );
}

/* ─── Inline editable subject row ────────────────────────────────── */
function SubjectRow({ subject, onSave, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(subject.name);
  const [code, setCode] = useState(subject.code || "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const nameRef = useRef(null);

  const startEdit = () => { setEditing(true); setTimeout(() => nameRef.current?.focus(), 50); };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave(subject.id, { name: name.trim(), code: code.trim() || null });
      setEditing(false);
    } finally { setSaving(false); }
  };

  const handleCancel = () => {
    setName(subject.name); setCode(subject.code || "");
    setEditing(false); setConfirmDelete(false);
  };

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    try { await onDelete(subject.id); }
    finally { setDeleting(false); }
  };

  if (editing) {
    return (
      <tr className="bg-zinc-50 dark:bg-zinc-800/40">
        <td className="px-4 py-2 w-28">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Code"
            className="w-full px-2 py-1.5 text-xs font-mono bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-md outline-none focus:border-zinc-900 dark:focus:border-zinc-300 text-zinc-900 dark:text-zinc-100 transition-all"
          />
        </td>
        <td className="px-4 py-2">
          <input
            ref={nameRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") handleCancel(); }}
            className="w-full px-2 py-1.5 text-sm bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-md outline-none focus:border-zinc-900 dark:focus:border-zinc-300 text-zinc-900 dark:text-zinc-100 transition-all"
          />
        </td>
        <td className="px-4 py-2 w-20">{catBadge(subject.category)}</td>
        <td className="px-4 py-2 w-20">
          <div className="flex gap-1">
            <button
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className="p-1.5 rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {saving ? <Loader className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
            </button>
            <button
              onClick={handleCancel}
              className="p-1.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
      <td className="px-4 py-2.5 text-xs font-mono text-zinc-400 dark:text-zinc-500 w-28">
        {subject.code || <span className="text-zinc-300 dark:text-zinc-700">—</span>}
      </td>
      <td className="px-4 py-2.5 text-sm text-zinc-800 dark:text-zinc-200">{subject.name}</td>
      <td className="px-4 py-2.5 w-20">{catBadge(subject.category)}</td>
      <td className="px-4 py-2.5 w-20">
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={startEdit}
            className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
            title="Edit"
          >
            <Pencil className="w-3 h-3" />
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className={`p-1.5 rounded-md transition-all ${
              confirmDelete
                ? "bg-red-500 text-white hover:bg-red-600"
                : "text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
            }`}
            title={confirmDelete ? "Click again to confirm" : "Delete"}
          >
            {deleting ? <Loader className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
          </button>
        </div>
        {confirmDelete && !deleting && (
          <p className="text-[10px] text-red-500 mt-0.5 whitespace-nowrap">Click again</p>
        )}
      </td>
    </tr>
  );
}

/* ─── Semester group header ──────────────────────────────────────── */
function SemesterLabel({ sem, count }) {
  return (
    <div className="flex items-center gap-2.5 px-4 py-2 bg-zinc-50 dark:bg-zinc-800/40 border-y border-zinc-100 dark:border-zinc-800/60">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        Semester {sem}
      </span>
      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 tabular-nums">{count}</span>
    </div>
  );
}

/* ─── Program panel ──────────────────────────────────────────────── */
function ProgramPanel({ program, onSubjectChange }) {
  const [open, setOpen] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/programs/${program.id}/subjects`);
      setSubjects(res.data);
      setLoaded(true);
    } finally { setLoading(false); }
  };

  const handleToggle = () => {
    if (!open && !loaded) load();
    setOpen((v) => !v);
  };

  const handleSave = async (id, data) => {
    await api.patch(`/admin/subjects/${id}`, data);
    setSubjects((prev) => prev.map((s) => s.id === id ? { ...s, ...data } : s));
    onSubjectChange?.();
  };

  const handleDelete = async (id) => {
    await api.delete(`/admin/subjects/${id}`);
    setSubjects((prev) => prev.filter((s) => s.id !== id));
    onSubjectChange?.();
  };

  const handleClear = async () => {
    if (!confirmClear) { setConfirmClear(true); return; }
    setClearing(true);
    try {
      await api.delete(`/admin/programs/${program.id}/subjects`);
      setSubjects([]);
      setConfirmClear(false);
    } finally { setClearing(false); }
  };

  const bySemester = {};
  for (const s of subjects) {
    if (!bySemester[s.semester]) bySemester[s.semester] = [];
    bySemester[s.semester].push(s);
  }

  const totalSubjects = subjects.length;

  return (
    <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
      {/* Program header */}
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between px-4 py-3.5 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
            <BookMarked className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
          </div>
          <div className="text-left min-w-0">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{program.name}</p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
              {program.code} · {program.duration_years * 2} semesters
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 ml-4">
          {loaded && (
            <span className="text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">
              {totalSubjects} subject{totalSubjects !== 1 ? "s" : ""}
            </span>
          )}
          {loading
            ? <Loader className="w-4 h-4 text-zinc-400 animate-spin" />
            : open
              ? <ChevronDown className="w-4 h-4 text-zinc-400" />
              : <ChevronRight className="w-4 h-4 text-zinc-400" />
          }
        </div>
      </button>

      {/* Body */}
      {open && (
        <div className="border-t border-zinc-100 dark:border-zinc-800">
          {loading ? (
            <div>
              {Array.from({ length: 4 }).map((_, i) => <SkeletonSubject key={i} />)}
            </div>
          ) : totalSubjects === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-zinc-400">
              <BookOpen className="w-8 h-8 opacity-30" />
              <p className="text-sm">No subjects yet. Use the importer to add subjects.</p>
            </div>
          ) : (
            <>
              {/* Toolbar */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20">
                <span className="text-xs text-zinc-400 dark:text-zinc-500">
                  {totalSubjects} subject{totalSubjects !== 1 ? "s" : ""} · {Object.keys(bySemester).length} semester{Object.keys(bySemester).length !== 1 ? "s" : ""}
                </span>
                <button
                  onClick={handleClear}
                  disabled={clearing}
                  className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md font-medium transition-all ${
                    confirmClear
                      ? "bg-red-500 text-white hover:bg-red-600"
                      : "text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 border border-red-200 dark:border-red-900/50"
                  }`}
                >
                  {clearing ? <Loader className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                  {confirmClear ? "Confirm delete all?" : "Clear all"}
                </button>
              </div>

              {/* Table column headers */}
              <div className="grid grid-cols-[112px_1fr_80px_80px] px-4 py-2 bg-zinc-50 dark:bg-zinc-800/40 border-b border-zinc-100 dark:border-zinc-800 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                <span>Code</span>
                <span>Subject Name</span>
                <span>Category</span>
                <span />
              </div>

              {/* Semester groups */}
              {Object.entries(bySemester)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([sem, semSubjects]) => (
                  <div key={sem}>
                    <SemesterLabel sem={sem} count={semSubjects.length} />
                    <table className="w-full">
                      <tbody>
                        {semSubjects.map((s) => (
                          <SubjectRow key={s.id} subject={s} onSave={handleSave} onDelete={handleDelete} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Dept skeleton ──────────────────────────────────────────────── */
function SkeletonDept() {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800/50 animate-pulse">
      <div className="h-3.5 w-28 rounded bg-zinc-100 dark:bg-zinc-800" />
      <div className="h-5 w-10 rounded bg-zinc-100 dark:bg-zinc-800" />
    </div>
  );
}

/* ─── Main ───────────────────────────────────────────────────────── */
export default function SubjectManager() {
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState(null);
  const [programs, setPrograms] = useState([]);
  const [loadingDepts, setLoadingDepts] = useState(true);
  const [loadingPrograms, setLoadingPrograms] = useState(false);

  useEffect(() => {
    setLoadingDepts(true);
    api.get("/admin/departments")
      .then((r) => setDepartments(r.data))
      .finally(() => setLoadingDepts(false));
  }, []);

  useEffect(() => {
    if (!selectedDept) { setPrograms([]); return; }
    setLoadingPrograms(true);
    api.get(`/admin/departments/${selectedDept.id}/programs`)
      .then((r) => setPrograms(r.data))
      .finally(() => setLoadingPrograms(false));
  }, [selectedDept]);

  const filteredDepts = departments.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    (d.code || "").toLowerCase().includes(search.toLowerCase())
  );

  const refreshPrograms = () => {
    if (!selectedDept) return;
    setLoadingPrograms(true);
    api.get(`/admin/departments/${selectedDept.id}/programs`)
      .then((r) => setPrograms(r.data))
      .finally(() => setLoadingPrograms(false));
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-zinc-50 dark:bg-zinc-950">

      {/* ── Left panel — Department list ── */}
      <div className="w-64 shrink-0 border-r border-zinc-200 dark:border-zinc-800 flex flex-col bg-white dark:bg-zinc-900">

        {/* Panel header */}
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <Building2 className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
            </div>
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Departments</span>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 dark:focus:ring-zinc-300/20 focus:border-zinc-900 dark:focus:border-zinc-300 transition-all"
            />
          </div>
        </div>

        {/* Dept list */}
        <div className="flex-1 overflow-y-auto">
          {loadingDepts ? (
            Array.from({ length: 6 }).map((_, i) => <SkeletonDept key={i} />)
          ) : filteredDepts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-zinc-400">
              <Building2 className="w-7 h-7 opacity-30" />
              <p className="text-xs">No departments found</p>
            </div>
          ) : (
            filteredDepts.map((d) => {
              const isActive = selectedDept?.id === d.id;
              return (
                <button
                  key={d.id}
                  onClick={() => setSelectedDept(d)}
                  className={`w-full flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800/50 text-left transition-colors group
                    ${isActive
                      ? "bg-zinc-100 dark:bg-zinc-800 border-l-2 border-l-zinc-900 dark:border-l-zinc-100"
                      : "hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                    }`}
                >
                  <p className={`text-xs font-medium truncate ${
                    isActive ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-600 dark:text-zinc-400"
                  }`}>
                    {d.name}
                  </p>
                  <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 shrink-0 ml-2 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                    {d.code}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── Right panel — Programs + Subjects ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!selectedDept ? (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-zinc-400 dark:text-zinc-500" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Select a department</p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">Choose from the list to view programs and subjects</p>
            </div>
          </div>
        ) : (
          <>
            {/* Dept header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
              <div>
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{selectedDept.name}</h2>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                  {loadingPrograms ? "Loading…" : `${programs.length} program${programs.length !== 1 ? "s" : ""}`}
                </p>
              </div>
              <button
                onClick={refreshPrograms}
                className="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* Programs list */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {loadingPrograms ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 flex items-center gap-3 animate-pulse">
                      <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3.5 w-48 rounded bg-zinc-100 dark:bg-zinc-800" />
                        <div className="h-3 w-24 rounded bg-zinc-100 dark:bg-zinc-800" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : programs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-zinc-400">
                  <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                    <GraduationCap className="w-6 h-6 opacity-50" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">No programs yet</p>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">Use the Subject Importer to add programs and subjects.</p>
                  </div>
                </div>
              ) : (
                programs.map((p) => (
                  <ProgramPanel key={p.id} program={p} />
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}