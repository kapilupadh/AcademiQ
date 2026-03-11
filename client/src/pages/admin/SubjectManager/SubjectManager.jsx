// client/src/pages/admin/SubjectManager/SubjectManager.jsx
import React, { useState, useEffect, useRef } from "react";
import api from "../../../services/api";
import {
  Building2, BookOpen, ChevronRight, ChevronDown,
  Pencil, Trash2, Check, X, Loader, Search,
  AlertTriangle, BookMarked, RefreshCw,
} from "lucide-react";

const CATEGORY_COLORS = {
  Core:     "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  Minor:    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  GEC:      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  AEC:      "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
  VAC:      "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
  SEC:      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  Research: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  DSE:      "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
};

const catBadge = (cat) => {
  if (!cat) return null;
  const cls = CATEGORY_COLORS[cat] || "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400";
  return <span className={`text-xs font-mono px-2 py-0.5 rounded-full shrink-0 ${cls}`}>{cat}</span>;
};

// ── Inline editable subject row ───────────────────────────────────────────────
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

  const handleCancel = () => { setName(subject.name); setCode(subject.code || ""); setEditing(false); setConfirmDelete(false); };

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    try { await onDelete(subject.id); }
    finally { setDeleting(false); }
  };

  if (editing) {
    return (
      <tr className="bg-blue-50/50 dark:bg-blue-900/10">
        <td className="px-3 py-2 w-24">
          <input value={code} onChange={e => setCode(e.target.value)} placeholder="Code"
            className="w-full px-2 py-1 text-xs font-mono bg-white dark:bg-zinc-900 border border-blue-300 dark:border-blue-700 rounded outline-none focus:border-blue-500 text-zinc-900 dark:text-white" />
        </td>
        <td className="px-3 py-2">
          <input ref={nameRef} value={name} onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") handleCancel(); }}
            className="w-full px-2 py-1 text-sm bg-white dark:bg-zinc-900 border border-blue-300 dark:border-blue-700 rounded outline-none focus:border-blue-500 text-zinc-900 dark:text-white" />
        </td>
        <td className="px-3 py-2 w-24">{catBadge(subject.category)}</td>
        <td className="px-3 py-2 w-20">
          <div className="flex gap-1">
            <button onClick={handleSave} disabled={saving || !name.trim()} className="p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded transition-colors disabled:opacity-50">
              {saving ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            </button>
            <button onClick={handleCancel} className="p-1.5 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-600 dark:text-zinc-400 rounded transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
      <td className="px-3 py-2.5 text-xs font-mono text-zinc-400 w-24">{subject.code || "—"}</td>
      <td className="px-3 py-2.5 text-sm text-zinc-900 dark:text-white">{subject.name}</td>
      <td className="px-3 py-2.5 w-24">{catBadge(subject.category)}</td>
      <td className="px-3 py-2.5 w-20">
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={startEdit} className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 rounded transition-colors" title="Edit">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={handleDelete} disabled={deleting}
            className={`p-1.5 rounded transition-colors ${confirmDelete ? "bg-red-500 text-white hover:bg-red-600" : "hover:bg-red-100 dark:hover:bg-red-900/30 text-zinc-400 hover:text-red-600"}`}
            title={confirmDelete ? "Click again to confirm delete" : "Delete"}>
            {deleting ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          </button>
        </div>
        {confirmDelete && !deleting && (
          <p className="text-xs text-red-500 mt-0.5 whitespace-nowrap">Click 🗑 again</p>
        )}
      </td>
    </tr>
  );
}

// ── Program panel ─────────────────────────────────────────────────────────────
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
    setOpen(v => !v);
  };

  const handleSave = async (id, data) => {
    await api.patch(`/admin/subjects/${id}`, data);
    setSubjects(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
    onSubjectChange?.();
  };

  const handleDelete = async (id) => {
    await api.delete(`/admin/subjects/${id}`);
    setSubjects(prev => prev.filter(s => s.id !== id));
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

  // Group by semester
  const bySemester = {};
  for (const s of subjects) {
    if (!bySemester[s.semester]) bySemester[s.semester] = [];
    bySemester[s.semester].push(s);
  }

  const totalSubjects = subjects.length;

  return (
    <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
      {/* Program header */}
      <button onClick={handleToggle} className="w-full flex items-center justify-between px-4 py-3.5 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
        <div className="flex items-center gap-3">
          <BookMarked className="w-4 h-4 text-purple-500 shrink-0" />
          <div className="text-left">
            <p className="font-semibold text-zinc-900 dark:text-white text-sm">{program.name}</p>
            <p className="text-xs text-zinc-400">{program.code} · {program.duration_years * 2} semesters</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {loaded && <span className="text-xs text-zinc-400">{totalSubjects} subjects</span>}
          {loading ? <Loader className="w-4 h-4 text-zinc-400 animate-spin" /> : open ? <ChevronDown className="w-4 h-4 text-zinc-400" /> : <ChevronRight className="w-4 h-4 text-zinc-400" />}
        </div>
      </button>

      {/* Subjects */}
      {open && (
        <div className="border-t border-zinc-200 dark:border-zinc-800">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-zinc-400 text-sm">
              <Loader className="w-4 h-4 animate-spin" /> Loading subjects…
            </div>
          ) : totalSubjects === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-zinc-400 text-sm gap-2">
              <BookOpen className="w-8 h-8 opacity-30" />
              <p>No subjects yet. Use the importer to add subjects.</p>
            </div>
          ) : (
            <>
              {/* Toolbar */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-xs text-zinc-400">{totalSubjects} subjects across {Object.keys(bySemester).length} semesters</span>
                <button onClick={handleClear} disabled={clearing}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${confirmClear ? "bg-red-500 text-white hover:bg-red-600" : "text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-800"}`}>
                  {clearing ? <Loader className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                  {confirmClear ? "Confirm — delete all?" : "Clear all subjects"}
                </button>
              </div>

              {/* Semester groups */}
              {Object.entries(bySemester).sort(([a], [b]) => Number(a) - Number(b)).map(([sem, semSubjects]) => (
                <div key={sem}>
                  <div className="px-4 py-2 bg-gradient-to-r from-zinc-50 to-transparent dark:from-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800/50">
                    <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Semester {sem}</span>
                    <span className="ml-2 text-xs text-zinc-400">({semSubjects.length})</span>
                  </div>
                  <table className="w-full">
                    <tbody>
                      {semSubjects.map(s => (
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

// ── Main SubjectManager ────────────────────────────────────────────────────────
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
      .then(r => setDepartments(r.data))
      .finally(() => setLoadingDepts(false));
  }, []);

  useEffect(() => {
    if (!selectedDept) { setPrograms([]); return; }
    setLoadingPrograms(true);
    api.get(`/admin/departments/${selectedDept.id}/programs`)
      .then(r => setPrograms(r.data))
      .finally(() => setLoadingPrograms(false));
  }, [selectedDept]);

  const filteredDepts = departments.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    (d.code || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden">
      {/* ── Left: Department list ──────────────────────────────────────────── */}
      <div className="w-72 shrink-0 border-r border-zinc-200 dark:border-zinc-800 flex flex-col">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="font-bold text-zinc-900 dark:text-white mb-3 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-500" /> Departments
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search…"
              className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg outline-none focus:border-blue-500 text-sm text-zinc-900 dark:text-white"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingDepts ? (
            <div className="flex items-center justify-center gap-2 py-8 text-zinc-400 text-sm">
              <Loader className="w-4 h-4 animate-spin" /> Loading…
            </div>
          ) : filteredDepts.length === 0 ? (
            <div className="py-8 text-center text-zinc-400 text-sm">No departments found</div>
          ) : (
            filteredDepts.map(d => (
              <button
                key={d.id}
                onClick={() => setSelectedDept(d)}
                className={`w-full flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800/50 text-left transition-colors ${selectedDept?.id === d.id ? "bg-blue-50 dark:bg-blue-900/20 border-l-2 border-l-blue-500" : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"}`}
              >
                <div className="min-w-0">
                  <p className={`text-sm font-medium truncate ${selectedDept?.id === d.id ? "text-blue-700 dark:text-blue-300" : "text-zinc-900 dark:text-white"}`}>{d.name}</p>
                </div>
                <span className="text-xs font-mono text-zinc-400 shrink-0 ml-2 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">{d.code}</span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ── Right: Programs + Subjects ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!selectedDept ? (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 gap-3">
            <Building2 className="w-12 h-12 opacity-20" />
            <p className="text-sm">Select a department to view its programs and subjects</p>
          </div>
        ) : (
          <>
            {/* Dept header */}
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-zinc-900 dark:text-white text-lg">{selectedDept.name}</h2>
                <p className="text-sm text-zinc-500">{programs.length} program{programs.length !== 1 ? "s" : ""}</p>
              </div>
              <button
                onClick={() => { setLoadingPrograms(true); api.get(`/admin/departments/${selectedDept.id}/programs`).then(r => setPrograms(r.data)).finally(() => setLoadingPrograms(false)); }}
                className="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* Programs list */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {loadingPrograms ? (
                <div className="flex items-center justify-center gap-2 py-12 text-zinc-400 text-sm">
                  <Loader className="w-4 h-4 animate-spin" /> Loading programs…
                </div>
              ) : programs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-zinc-400 gap-3">
                  <BookOpen className="w-10 h-10 opacity-20" />
                  <p className="text-sm">No programs yet. Use the Subject Importer to add subjects.</p>
                </div>
              ) : (
                programs.map(p => (
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