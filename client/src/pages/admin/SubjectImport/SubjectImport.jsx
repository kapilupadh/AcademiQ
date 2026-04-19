import React, { useState, useEffect, useRef } from "react";
import api from "../../../services/api";
import {
  Upload, FileSpreadsheet, CheckCircle2, XCircle, AlertTriangle,
  Loader, Building2, BookOpen, X, Search, Plus, ArrowRight,
  Eye, Save, RotateCcw, ChevronDown, ChevronRight,
} from "lucide-react";

/* ─── Category badges ─────────────────────────────────────────────── */
const CATEGORY_COLORS = {
  Core:     "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  Minor:    "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400",
  GEC:      "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
  AEC:      "bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400",
  VAC:      "bg-pink-50 text-pink-700 dark:bg-pink-950/40 dark:text-pink-400",
  SEC:      "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400",
};

const catBadge = (cat) => {
  const cls = CATEGORY_COLORS[cat] || "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400";
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border border-black/5 dark:border-white/5 shrink-0 ${cls}`}>
      {cat}
    </span>
  );
};

/* ─── Step indicator ──────────────────────────────────────────────── */
function Step({ n, label, active, done }) {
  return (
    <div className={`flex items-center gap-2 text-xs font-medium transition-colors ${done ? "text-zinc-600 dark:text-zinc-400" : active ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-400 dark:text-zinc-600"}`}>
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all shrink-0 ${done || active ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"}`}>
        {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : n}
      </div>
      <span className="hidden sm:block">{label}</span>
    </div>
  );
}

/* ─── Section card ────────────────────────────────────────────────── */
function SectionCard({ children, className = "" }) {
  return (
    <div className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl ${className}`}>
      {children}
    </div>
  );
}

/* ─── Section header ──────────────────────────────────────────────── */
function SectionHeader({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-2.5 px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
      <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
        <Icon className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
      </div>
      <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{label}</span>
    </div>
  );
}

/* ─── Error banner ────────────────────────────────────────────────── */
function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-2.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl px-4 py-3 text-red-600 dark:text-red-400 text-xs">
      <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  );
}

/* ─── Main ────────────────────────────────────────────────────────── */
export default function SubjectImport() {
  // ── Dept state ──────────────────────────────────────────────────────
  const [departments, setDepartments] = useState([]);
  const [deptSearch, setDeptSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState(null);
  const [showDeptDropdown, setShowDeptDropdown] = useState(false);
  const [creatingDept, setCreatingDept] = useState(false);
  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptCode, setNewDeptCode] = useState("");
  const [deptSaving, setDeptSaving] = useState(false);

  // ── Program state ────────────────────────────────────────────────────
  const [existingPrograms, setExistingPrograms] = useState([]);
  const [programMode, setProgramMode] = useState("new");
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [programName, setProgramName] = useState("");
  const [programCode, setProgramCode] = useState("");
  const [durationYears, setDurationYears] = useState(3);
  const [replaceMode, setReplaceMode] = useState(false);

  // ── File + preview state ─────────────────────────────────────────────
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);
  const [previewing, setPreviewing] = useState(false);
  const [preview, setPreview] = useState(null);
  const [expandedSems, setExpandedSems] = useState({});

  // ── Save state ───────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const step = result ? 3 : preview ? 2 : 1;

  // ── Load departments from DB ─────────────────────────────────────────
  useEffect(() => {
    api.get("/admin/departments")
      .then((r) => setDepartments(r.data))
      .catch(() => setError("Failed to load departments."));
  }, []);

  // ── Load programs when dept changes ──────────────────────────────────
  useEffect(() => {
    if (!selectedDept) { setExistingPrograms([]); return; }
    api.get(`/admin/departments/${selectedDept.id}/programs`)
      .then((r) => {
        setExistingPrograms(r.data);
        setProgramMode(r.data.length > 0 ? "existing" : "new");
        setSelectedProgram(null);
      })
      .catch(() => setExistingPrograms([]));
  }, [selectedDept]);

  const filteredDepts = departments.filter((d) =>
    d.name.toLowerCase().includes(deptSearch.toLowerCase()) ||
    (d.code || "").toLowerCase().includes(deptSearch.toLowerCase())
  );
  const noMatch = deptSearch.trim().length > 0 && filteredDepts.length === 0;

  const handleDeptSelect = (dept) => {
    setSelectedDept(dept);
    setDeptSearch(dept.name);
    setShowDeptDropdown(false);
    setCreatingDept(false);
    setNewDeptName("");
    setNewDeptCode("");
    setPreview(null);
    setResult(null);
    setError("");
  };

  const handleCreateDept = async () => {
    if (!newDeptName.trim()) return;
    setDeptSaving(true); setError("");
    try {
      const res = await api.post("/admin/departments", {
        name: newDeptName.trim(),
        code: newDeptCode.trim() || undefined,
      });
      const dept = res.data.department;
      setDepartments((prev) => [...prev, dept].sort((a, b) => a.name.localeCompare(b.name)));
      handleDeptSelect(dept);
      setCreatingDept(false);
    } catch (err) {
      if (err.response?.status === 409 && err.response.data?.department) {
        handleDeptSelect(err.response.data.department);
        setCreatingDept(false);
      } else {
        setError(err.response?.data?.message || "Failed to create department.");
      }
    } finally { setDeptSaving(false); }
  };

  const finalProgramName = programMode === "existing" ? selectedProgram?.name : programName.trim();

  const handlePreview = async () => {
    if (!file) { setError("Please upload an Excel file."); return; }
    if (!selectedDept) { setError("Please select a department."); return; }
    if (!finalProgramName) { setError("Please enter or select a program."); return; }
    setPreviewing(true); setError(""); setPreview(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post("/admin/subjects/preview", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setPreview(res.data);
      const exp = {};
      Object.keys(res.data.semesters).forEach((s) => { exp[s] = true; });
      setExpandedSems(exp);
    } catch (err) {
      setError(err.response?.data?.message || "Preview failed.");
    } finally { setPreviewing(false); }
  };

  const handleConfirmSave = async () => {
    setSaving(true); setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("department_id", selectedDept.id);
      formData.append("program_name", finalProgramName);
      formData.append("program_code", programMode === "existing" ? (selectedProgram?.code || "") : programCode);
      formData.append("duration_years", String(durationYears));
      formData.append("replace", String(replaceMode));
      const res = await api.post("/admin/subjects/bulk-import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(res.data);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setError(err.response?.data?.message || "Save failed.");
    } finally { setSaving(false); }
  };

  const handleReset = () => {
    setSelectedDept(null); setDeptSearch(""); setSelectedProgram(null);
    setProgramName(""); setProgramCode(""); setFile(null);
    setPreview(null); setResult(null); setError(""); setReplaceMode(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const toggleSem = (s) => setExpandedSems((prev) => ({ ...prev, [s]: !prev[s] }));

  const isSetupReady = selectedDept && finalProgramName && file;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-3xl mx-auto px-5 py-8 space-y-5">

        {/* ── Page header ── */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
              Subject Bulk Importer
            </h1>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
              Upload → Preview → Confirm. Nothing saves until you confirm.
            </p>
          </div>
          {step > 1 && (
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 px-3 py-2 rounded-lg transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Start over
            </button>
          )}
        </div>

        {/* ── Step indicator ── */}
        <div className="flex items-center gap-2">
          <Step n="1" label="Setup" active={step === 1} done={step > 1} />
          <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
          <Step n="2" label="Preview" active={step === 2} done={step > 2} />
          <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
          <Step n="3" label="Saved" active={step === 3} done={step === 3} />
        </div>

        {/* ════════════ STEP 1 — Setup ════════════ */}
        {step === 1 && (
          <>
            {/* Format guide — static documentation, not DB data */}
            <SectionCard>
              <div className="flex items-center gap-2 px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
                <FileSpreadsheet className="w-4 h-4 text-zinc-400" />
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Expected Excel Format
                </span>
              </div>
              <div className="p-5 overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-800">
                      {["Year", "Course", "Title of the paper"].map((h) => (
                        <th key={h} className="border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-left font-semibold text-zinc-600 dark:text-zinc-400">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["1st Semester", "C-1", "Introduction to Political Theory"],
                      ["", "Minor-1", "Concepts and Debates"],
                      ["2nd Semester", "GEC", "Human Rights"],
                    ].map((row, i) => (
                      <tr key={i} className="even:bg-zinc-50/50 dark:even:bg-zinc-800/30">
                        {row.map((cell, j) => (
                          <td key={j} className="border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 font-mono text-zinc-500 dark:text-zinc-400">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>

            {/* ── Department ── */}
            <SectionCard>
              <SectionHeader icon={Building2} label="Department" />
              <div className="p-5 space-y-3">
                {!creatingDept ? (
                  <>
                    {/* Search input + dropdown in ONE relative wrapper */}
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none z-10" />
                      <input
                        value={deptSearch}
                        onChange={(e) => {
                          setDeptSearch(e.target.value);
                          setShowDeptDropdown(true);
                          if (selectedDept && e.target.value !== selectedDept.name) setSelectedDept(null);
                        }}
                        onFocus={() => setShowDeptDropdown(true)}
                        onBlur={() => setTimeout(() => setShowDeptDropdown(false), 180)}
                        placeholder="Search department…"
                        className="w-full pl-8 pr-9 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-all"
                      />
                      {selectedDept && (
                        <button
                          onClick={() => { setSelectedDept(null); setDeptSearch(""); }}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 z-10 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Dropdown — anchored inside same relative wrapper, z-50 escapes card */}
                      {showDeptDropdown && (filteredDepts.length > 0 || noMatch) && (
                        <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl overflow-hidden">
                          {filteredDepts.length > 0 && (
                            <div className="max-h-56 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
                              {filteredDepts.map((d) => (
                                <button
                                  key={d.id}
                                  onMouseDown={() => handleDeptSelect(d)}
                                  className="w-full px-4 py-2.5 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center justify-between gap-3 transition-colors"
                                >
                                  <span className="text-sm text-zinc-800 dark:text-zinc-200 font-medium truncate">
                                    {d.name}
                                  </span>
                                  {d.code && (
                                    <span className="text-[10px] font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded shrink-0">
                                      {d.code}
                                    </span>
                                  )}
                                </button>
                              ))}
                            </div>
                          )}
                          {noMatch && (
                            <div className="px-4 py-3">
                              <p className="text-xs text-zinc-500 mb-2.5">
                                No match for "
                                <span className="font-semibold text-zinc-700 dark:text-zinc-300">{deptSearch}</span>"
                              </p>
                              <button
                                onMouseDown={() => {
                                  setCreatingDept(true);
                                  setNewDeptName(deptSearch);
                                  setShowDeptDropdown(false);
                                }}
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                              >
                                <Plus className="w-3.5 h-3.5" /> Create "{deptSearch}" as new department
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Selection confirmed pill */}
                    {selectedDept && (
                      <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                        <CheckCircle2 className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                        <span className="font-medium text-zinc-800 dark:text-zinc-200">{selectedDept.name}</span>
                        {selectedDept.code && (
                          <span className="font-mono text-zinc-400">({selectedDept.code})</span>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  /* Create dept inline form */
                  <div className="space-y-3 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700">
                    <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5" /> New Department
                    </p>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                          Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          value={newDeptName}
                          onChange={(e) => setNewDeptName(e.target.value)}
                          placeholder="e.g. Dept. of Bodo"
                          autoFocus
                          className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-300 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                          Short Code
                        </label>
                        <input
                          value={newDeptCode}
                          onChange={(e) => setNewDeptCode(e.target.value.toUpperCase())}
                          placeholder="e.g. BODO"
                          maxLength={10}
                          className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-300 transition-all"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={handleCreateDept}
                        disabled={deptSaving || !newDeptName.trim()}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition-all"
                      >
                        {deptSaving ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
                        {deptSaving ? "Creating…" : "Create & Continue"}
                      </button>
                      <button
                        onClick={() => { setCreatingDept(false); setNewDeptName(""); setNewDeptCode(""); }}
                        className="px-3.5 py-2 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </SectionCard>

            {/* ── Program — only shown after dept selected ── */}
            {selectedDept && (
              <SectionCard>
                <SectionHeader icon={BookOpen} label="Program" />
                <div className="p-5 space-y-4">
                  {/* Mode toggle — only if existing programs exist */}
                  {existingPrograms.length > 0 && (
                    <div className="inline-flex rounded-lg border border-zinc-200 dark:border-zinc-800 p-0.5 bg-zinc-50 dark:bg-zinc-800/50 gap-0.5">
                      {[{ v: "existing", l: "Pick Existing" }, { v: "new", l: "New Program" }].map((m) => (
                        <button
                          key={m.v}
                          onClick={() => { setProgramMode(m.v); if (m.v === "new") setSelectedProgram(null); }}
                          className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
                            programMode === m.v
                              ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm"
                              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
                          }`}
                        >
                          {m.l}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Existing programs grid — from DB */}
                  {programMode === "existing" && existingPrograms.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {existingPrograms.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => setSelectedProgram(p)}
                          className={`px-4 py-3 rounded-xl border text-left transition-all ${
                            selectedProgram?.id === p.id
                              ? "border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-800"
                              : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                          }`}
                        >
                          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{p.name}</p>
                          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5 font-mono">
                            {p.code} · {p.duration_years * 2} sem
                          </p>
                        </button>
                      ))}
                    </div>
                  ) : (
                    /* New program form */
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                          Program Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          value={programName}
                          onChange={(e) => setProgramName(e.target.value)}
                          placeholder="e.g. BA Bodo"
                          className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                          Short Code
                        </label>
                        <input
                          value={programCode}
                          onChange={(e) => setProgramCode(e.target.value.toUpperCase())}
                          placeholder="e.g. BABODO"
                          className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                          Duration
                        </label>
                        <div className="flex gap-2">
                          {[{ v: 3, l: "3 Years" }, { v: 4, l: "4 Years" }].map((o) => (
                            <button
                              key={o.v}
                              onClick={() => setDurationYears(o.v)}
                              className={`flex-1 py-2 rounded-lg border text-xs font-semibold transition-all ${
                                durationYears === o.v
                                  ? "border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                                  : "border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700"
                              }`}
                            >
                              {o.l}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Replace toggle */}
                  {programMode === "existing" && selectedProgram && (
                    <div
                      className="flex items-center gap-3 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 cursor-pointer select-none"
                      onClick={() => setReplaceMode(!replaceMode)}
                    >
                      <div className={`relative w-9 h-5 rounded-full transition-all shrink-0 ${replaceMode ? "bg-zinc-900 dark:bg-zinc-100" : "bg-zinc-200 dark:bg-zinc-700"}`}>
                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${replaceMode ? "left-[18px] dark:bg-zinc-900" : "left-0.5"}`} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Replace existing subjects</p>
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                          Clears all current subjects for this program before importing
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </SectionCard>
            )}

            {/* ── File upload — only shown after dept selected ── */}
            {selectedDept && (
              <SectionCard>
                <SectionHeader icon={Upload} label="Excel File" />
                <div className="p-5">
                  <div
                    onDrop={(e) => {
                      e.preventDefault();
                      const f = e.dataTransfer.files[0];
                      if (f) { setFile(f); setPreview(null); setError(""); }
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => fileInputRef.current?.click()}
                    className={`rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-all ${
                      file
                        ? "border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/30"
                        : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800/20"
                    }`}
                  >
                    {file ? (
                      <div className="flex items-center gap-3 text-left">
                        <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                          <FileSpreadsheet className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{file.name}</p>
                          <p className="text-xs text-zinc-400 mt-0.5">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setFile(null);
                            if (fileInputRef.current) fileInputRef.current.value = "";
                          }}
                          className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors shrink-0"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto">
                          <Upload className="w-5 h-5 text-zinc-400 dark:text-zinc-500" />
                        </div>
                        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Drop file here or click to browse</p>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500">.xlsx or .xls · max 5MB</p>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    ref={fileInputRef}
                    onChange={(e) => {
                      const f = e.target.files[0];
                      if (f) { setFile(f); setPreview(null); setError(""); }
                    }}
                    className="hidden"
                  />
                </div>
              </SectionCard>
            )}

            <ErrorBanner message={error} />

            {/* Preview CTA */}
            {selectedDept && (
              <button
                onClick={handlePreview}
                disabled={previewing || !isSetupReady}
                className="w-full py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                {previewing
                  ? <><Loader className="w-4 h-4 animate-spin" /> Parsing…</>
                  : <><Eye className="w-4 h-4" /> Preview Import</>
                }
              </button>
            )}
          </>
        )}

        {/* ════════════ STEP 2 — Preview ════════════ */}
        {step === 2 && preview && (
          <>
            <SectionCard>
              {/* Summary */}
              <div className="flex items-center justify-between flex-wrap gap-3 px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
                <div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {preview.totalRows} subjects found
                  </p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                    {selectedDept.name} · {finalProgramName}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {Object.keys(preview.semesters).map((s) => (
                    <span key={s} className="text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-2 py-1 rounded-md tabular-nums">
                      Sem {s}: {preview.semesters[s].length}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-5 space-y-4">
                {/* Row errors */}
                {preview.rowErrors?.length > 0 && (
                  <div className="flex items-start gap-2.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-xl p-4">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div className="space-y-1.5 min-w-0">
                      <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                        {preview.rowErrors.length} rows will be skipped
                      </p>
                      <div className="max-h-28 overflow-y-auto space-y-0.5">
                        {preview.rowErrors.map((e, i) => (
                          <p key={i} className="text-[10px] text-amber-600 dark:text-amber-500 font-mono">
                            Row {e.row}: {e.issue}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Semester accordion — data from preview API response */}
                <div className="space-y-2">
                  {Object.entries(preview.semesters)
                    .sort(([a], [b]) => Number(a) - Number(b))
                    .map(([sem, subjects]) => (
                      <div key={sem} className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                        <button
                          onClick={() => toggleSem(sem)}
                          className="w-full flex items-center justify-between px-4 py-3 bg-zinc-50 dark:bg-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                            Semester {sem}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-zinc-400 tabular-nums">{subjects.length}</span>
                            {expandedSems[sem]
                              ? <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                              : <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                            }
                          </div>
                        </button>
                        {expandedSems[sem] && (
                          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                            {subjects.map((s, i) => (
                              <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                                <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 w-14 shrink-0">
                                  {s.code || "—"}
                                </span>
                                <span className="text-xs text-zinc-800 dark:text-zinc-200 flex-1">{s.name}</span>
                                {s.category && catBadge(s.category)}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </SectionCard>

            <ErrorBanner message={error} />

            <div className="flex gap-3">
              <button
                onClick={() => { setPreview(null); setError(""); }}
                className="flex-1 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5"
              >
                <X className="w-4 h-4" /> Back
              </button>
              <button
                onClick={handleConfirmSave}
                disabled={saving}
                className="flex-1 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-1.5 transition-all shadow-sm"
              >
                {saving
                  ? <><Loader className="w-4 h-4 animate-spin" /> Saving…</>
                  : <><Save className="w-4 h-4" /> Confirm & Save {preview.totalRows} Subjects</>
                }
              </button>
            </div>
          </>
        )}

        {/* ════════════ STEP 3 — Done ════════════ */}
        {step === 3 && result && (
          <SectionCard>
            <div className="p-10 flex flex-col items-center text-center space-y-5">
              <div className="w-14 h-14 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-zinc-700 dark:text-zinc-300" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Import Successful</h2>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                  {result.department} · {result.program}
                  {result.programCreated && <span className="ml-1 text-violet-500">(new program)</span>}
                </p>
              </div>
              {/* Stats from DB response */}
              <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 p-4 text-center">
                  <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tabular-nums">{result.created}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Created</p>
                </div>
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 p-4 text-center">
                  <p className="text-2xl font-black text-zinc-500 dark:text-zinc-400 tabular-nums">{result.skipped}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Skipped</p>
                </div>
              </div>
              {result.errors?.length > 0 && (
                <div className="w-full text-left space-y-2">
                  <p className="text-xs font-semibold text-red-500 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" /> {result.errors.length} row issues
                  </p>
                  <div className="max-h-28 overflow-y-auto space-y-0.5 rounded-lg border border-red-100 dark:border-red-900/30 p-3 bg-red-50 dark:bg-red-950/10">
                    {result.errors.map((e, i) => (
                      <p key={i} className="text-[10px] font-mono text-red-500 dark:text-red-400">
                        Row {e.row}: {e.issue}
                      </p>
                    ))}
                  </div>
                </div>
              )}
              <button
                onClick={handleReset}
                className="w-full max-w-xs py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold rounded-xl hover:opacity-90 flex items-center justify-center gap-1.5 transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Import Another Program
              </button>
            </div>
          </SectionCard>
        )}

      </div>
    </div>
  );
}