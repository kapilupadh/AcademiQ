// client/src/pages/admin/SubjectImport/SubjectImport.jsx
import React, { useState, useEffect, useRef } from "react";
import api from "../../../services/api";
import {
  Upload, FileSpreadsheet, CheckCircle2, XCircle, AlertTriangle,
  Loader, Building2, BookOpen, X, Search, Plus, ArrowRight,
  Eye, Save, RotateCcw, ChevronDown, ChevronRight,
} from "lucide-react";

// ── Step indicator ────────────────────────────────────────────────────────────
const Step = ({ n, label, active, done }) => (
  <div className={`flex items-center gap-2 text-sm font-medium transition-colors ${done ? "text-emerald-500" : active ? "text-zinc-900 dark:text-white" : "text-zinc-400"}`}>
    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${done ? "bg-emerald-500 text-white" : active ? "bg-blue-600 text-white" : "bg-zinc-200 dark:bg-zinc-700 text-zinc-400"}`}>
      {done ? <CheckCircle2 className="w-4 h-4" /> : n}
    </div>
    <span className="hidden sm:block">{label}</span>
  </div>
);

const CATEGORY_COLORS = {
  Core: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  Minor: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  GEC: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  AEC: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
  VAC: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
  SEC: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
};

const catBadge = (cat) => {
  const cls = CATEGORY_COLORS[cat] || "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400";
  return <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${cls}`}>{cat}</span>;
};

export default function SubjectImport() {
  // ── Dept state ───────────────────────────────────────────────────────────
  const [departments, setDepartments] = useState([]);
  const [deptSearch, setDeptSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState(null);
  const [showDeptDropdown, setShowDeptDropdown] = useState(false);
  const [creatingDept, setCreatingDept] = useState(false);
  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptCode, setNewDeptCode] = useState("");
  const [deptSaving, setDeptSaving] = useState(false);

  // ── Program state ────────────────────────────────────────────────────────
  const [existingPrograms, setExistingPrograms] = useState([]);
  const [programMode, setProgramMode] = useState("new");
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [programName, setProgramName] = useState("");
  const [programCode, setProgramCode] = useState("");
  const [durationYears, setDurationYears] = useState(3);
  const [replaceMode, setReplaceMode] = useState(false);

  // ── File + preview state ─────────────────────────────────────────────────
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);
  const [previewing, setPreviewing] = useState(false);
  const [preview, setPreview] = useState(null); // { totalRows, semesters, rowErrors }
  const [expandedSems, setExpandedSems] = useState({});

  // ── Save state ───────────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  // current step: 1=setup, 2=preview, 3=done
  const step = result ? 3 : preview ? 2 : 1;

  useEffect(() => {
    api.get("/admin/departments")
      .then(r => setDepartments(r.data))
      .catch(() => setError("Failed to load departments."));
  }, []);

  useEffect(() => {
    if (!selectedDept) { setExistingPrograms([]); return; }
    api.get(`/admin/departments/${selectedDept.id}/programs`)
      .then(r => {
        setExistingPrograms(r.data);
        setProgramMode(r.data.length > 0 ? "existing" : "new");
        setSelectedProgram(null);
      })
      .catch(() => setExistingPrograms([]));
  }, [selectedDept]);

  const filteredDepts = departments.filter(d =>
    d.name.toLowerCase().includes(deptSearch.toLowerCase()) ||
    (d.code || "").toLowerCase().includes(deptSearch.toLowerCase())
  );
  const noMatch = deptSearch.trim().length > 0 && filteredDepts.length === 0;

  const handleDeptSelect = (dept) => {
    setSelectedDept(dept); setDeptSearch(dept.name);
    setShowDeptDropdown(false); setCreatingDept(false);
    setNewDeptName(""); setNewDeptCode("");
    setPreview(null); setResult(null); setError("");
  };

  const handleCreateDept = async () => {
    if (!newDeptName.trim()) return;
    setDeptSaving(true); setError("");
    try {
      const res = await api.post("/admin/departments", { name: newDeptName.trim(), code: newDeptCode.trim() || undefined });
      const dept = res.data.department;
      setDepartments(prev => [...prev, dept].sort((a, b) => a.name.localeCompare(b.name)));
      handleDeptSelect(dept); setCreatingDept(false);
    } catch (err) {
      if (err.response?.status === 409 && err.response.data?.department) {
        handleDeptSelect(err.response.data.department); setCreatingDept(false);
      } else {
        setError(err.response?.data?.message || "Failed to create department.");
      }
    } finally { setDeptSaving(false); }
  };

  const finalProgramName = programMode === "existing" ? selectedProgram?.name : programName.trim();

  // ── Preview ──────────────────────────────────────────────────────────────
  const handlePreview = async () => {
    if (!file) { setError("Please upload an Excel file."); return; }
    if (!selectedDept) { setError("Please select a department."); return; }
    if (!finalProgramName) { setError("Please enter or select a program."); return; }

    setPreviewing(true); setError(""); setPreview(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post("/admin/subjects/preview", formData, { headers: { "Content-Type": "multipart/form-data" } });
      setPreview(res.data);
      // Expand all semesters by default
      const exp = {};
      Object.keys(res.data.semesters).forEach(s => { exp[s] = true; });
      setExpandedSems(exp);
    } catch (err) {
      setError(err.response?.data?.message || "Preview failed.");
    } finally { setPreviewing(false); }
  };

  // ── Confirm save ─────────────────────────────────────────────────────────
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

      const res = await api.post("/admin/subjects/bulk-import", formData, { headers: { "Content-Type": "multipart/form-data" } });
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

  const toggleSem = (s) => setExpandedSems(prev => ({ ...prev, [s]: !prev[s] }));

  const isSetupReady = selectedDept && finalProgramName && file;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
            <FileSpreadsheet className="w-7 h-7 text-emerald-500" />
            Subject Bulk Importer
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">Upload → Preview → Confirm. Nothing saves until you confirm.</p>
        </div>
        {step > 1 && (
          <button onClick={handleReset} className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors border border-zinc-200 dark:border-zinc-700 px-3 py-2 rounded-lg">
            <RotateCcw className="w-4 h-4" /> Start over
          </button>
        )}
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-3">
        <Step n="1" label="Setup" active={step === 1} done={step > 1} />
        <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-700" />
        <Step n="2" label="Preview" active={step === 2} done={step > 2} />
        <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-700" />
        <Step n="3" label="Saved" active={step === 3} done={step === 3} />
      </div>

      {/* ── STEP 1: Setup ────────────────────────────────────────────────── */}
      {step === 1 && (
        <>
          {/* Format guide */}
          <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-sm">
            <p className="font-semibold text-blue-700 dark:text-blue-400 mb-2">Expected Excel format:</p>
            <table className="w-full text-xs border-collapse text-blue-700 dark:text-blue-300">
              <thead>
                <tr className="bg-blue-100 dark:bg-blue-900/30">
                  {["Year", "Course", "Title of the paper"].map(h => (
                    <th key={h} className="border border-blue-200 dark:border-blue-800 px-3 py-1.5 text-left font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[["1st Semester","C-1","Introduction to Political Theory"],["","Minor-1","Concepts and Debates"],["2nd Semester","GEC","Human Rights"]].map((row, i) => (
                  <tr key={i} className="even:bg-blue-50/50 dark:even:bg-blue-900/10">
                    {row.map((cell, j) => <td key={j} className="border border-blue-200 dark:border-blue-800 px-3 py-1 font-mono">{cell}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Department */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 space-y-4">
            <h2 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-500" /> Department
            </h2>

            {!creatingDept ? (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                  <input
                    value={deptSearch}
                    onChange={e => { setDeptSearch(e.target.value); setShowDeptDropdown(true); if (selectedDept && e.target.value !== selectedDept.name) setSelectedDept(null); }}
                    onFocus={() => setShowDeptDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDeptDropdown(false), 180)}
                    placeholder="Search department…"
                    className="w-full pl-10 pr-10 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:border-blue-500 text-zinc-900 dark:text-white"
                  />
                  {selectedDept && <button onClick={() => { setSelectedDept(null); setDeptSearch(""); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-red-500"><X className="w-4 h-4" /></button>}
                </div>

                {showDeptDropdown && (
                  <div className="relative">
                    <div className="absolute z-20 w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg overflow-hidden">
                      {filteredDepts.length > 0 && (
                        <div className="max-h-48 overflow-y-auto">
                          {filteredDepts.map(d => (
                            <button key={d.id} onMouseDown={() => handleDeptSelect(d)} className="w-full px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center justify-between">
                              <span className="text-zinc-900 dark:text-white font-medium">{d.name}</span>
                              <span className="text-xs text-zinc-400 font-mono bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">{d.code}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      {noMatch && (
                        <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800">
                          <p className="text-sm text-zinc-500 mb-2">No match for "<span className="font-semibold text-zinc-700 dark:text-zinc-300">{deptSearch}</span>"</p>
                          <button onMouseDown={() => { setCreatingDept(true); setNewDeptName(deptSearch); setShowDeptDropdown(false); }} className="flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700">
                            <Plus className="w-4 h-4" /> Create "{deptSearch}" as new department
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedDept && (
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                    <CheckCircle2 className="w-4 h-4" /> {selectedDept.name}
                    {selectedDept.code && <span className="text-xs font-mono text-zinc-400">({selectedDept.code})</span>}
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-3 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-2"><Plus className="w-4 h-4" /> Create New Department</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">Name <span className="text-red-500">*</span></label>
                    <input value={newDeptName} onChange={e => setNewDeptName(e.target.value)} placeholder="e.g. Dept. of Bodo" autoFocus className="w-full px-3 py-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg outline-none focus:border-emerald-500 text-zinc-900 dark:text-white text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">Short Code</label>
                    <input value={newDeptCode} onChange={e => setNewDeptCode(e.target.value.toUpperCase())} placeholder="e.g. BODO" maxLength={10} className="w-full px-3 py-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg outline-none focus:border-emerald-500 text-zinc-900 dark:text-white text-sm font-mono" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleCreateDept} disabled={deptSaving || !newDeptName.trim()} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50">
                    {deptSaving ? <Loader className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                    {deptSaving ? "Creating…" : "Create & Continue"}
                  </button>
                  <button onClick={() => { setCreatingDept(false); setNewDeptName(""); setNewDeptCode(""); }} className="px-4 py-2 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">Cancel</button>
                </div>
              </div>
            )}
          </div>

          {/* Program */}
          {selectedDept && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 space-y-4">
              <h2 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2"><BookOpen className="w-5 h-5 text-purple-500" /> Program</h2>

              {existingPrograms.length > 0 && (
                <div className="flex gap-2">
                  {["existing", "new"].map(mode => (
                    <button key={mode} onClick={() => { setProgramMode(mode); if (mode === "new") setSelectedProgram(null); }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${programMode === mode ? "bg-purple-600 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700"}`}>
                      {mode === "existing" ? "Pick Existing" : "+ New Program"}
                    </button>
                  ))}
                </div>
              )}

              {programMode === "existing" && existingPrograms.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {existingPrograms.map(p => (
                    <button key={p.id} onClick={() => setSelectedProgram(p)}
                      className={`px-4 py-3 rounded-xl border text-left transition-all ${selectedProgram?.id === p.id ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20" : "border-zinc-200 dark:border-zinc-800 hover:border-purple-300"}`}>
                      <p className="font-semibold text-zinc-900 dark:text-white text-sm">{p.name}</p>
                      <p className="text-xs text-zinc-400">{p.code} · {p.duration_years * 2} semesters</p>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Program Name <span className="text-red-500">*</span></label>
                    <input value={programName} onChange={e => setProgramName(e.target.value)} placeholder="e.g. BA Bodo" className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:border-purple-500 text-zinc-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Short Code</label>
                    <input value={programCode} onChange={e => setProgramCode(e.target.value.toUpperCase())} placeholder="e.g. BABODO" className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:border-purple-500 text-zinc-900 dark:text-white font-mono" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Duration</label>
                    <div className="flex gap-2">
                      {[{ v: 3, l: "3 Years" }, { v: 4, l: "4 Years" }].map(o => (
                        <button key={o.v} onClick={() => setDurationYears(o.v)}
                          className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${durationYears === o.v ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300" : "border-zinc-200 dark:border-zinc-800 text-zinc-500"}`}>
                          {o.l}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Replace toggle — only if program already exists */}
              {programMode === "existing" && selectedProgram && (
                <label className="flex items-center gap-3 cursor-pointer select-none p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl">
                  <div className={`relative w-10 h-6 rounded-full transition-all ${replaceMode ? "bg-amber-500" : "bg-zinc-300 dark:bg-zinc-600"}`} onClick={() => setReplaceMode(!replaceMode)}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${replaceMode ? "left-5" : "left-1"}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white">Replace existing subjects</p>
                    <p className="text-xs text-zinc-500">Clears all current subjects for this program before importing</p>
                  </div>
                </label>
              )}
            </div>
          )}

          {/* File upload */}
          {selectedDept && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 space-y-4">
              <h2 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2"><Upload className="w-5 h-5 text-emerald-500" /> Excel File</h2>
              <div
                onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) { setFile(f); setPreview(null); setError(""); }}}
                onDragOver={e => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${file ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/10" : "border-zinc-300 dark:border-zinc-700 hover:border-emerald-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"}`}
              >
                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileSpreadsheet className="w-8 h-8 text-emerald-500 shrink-0" />
                    <div className="text-left min-w-0">
                      <p className="font-semibold text-zinc-900 dark:text-white truncate">{file.name}</p>
                      <p className="text-xs text-zinc-500">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button onClick={e => { e.stopPropagation(); setFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }} className="ml-auto p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 text-zinc-400 hover:text-red-500 shrink-0"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-10 h-10 text-zinc-300 dark:text-zinc-600 mx-auto" />
                    <p className="text-zinc-600 dark:text-zinc-400 font-medium">Drop Excel file here or click to browse</p>
                    <p className="text-xs text-zinc-400">.xlsx or .xls · max 5MB</p>
                  </div>
                )}
              </div>
              <input type="file" accept=".xlsx,.xls" ref={fileInputRef} onChange={e => { const f = e.target.files[0]; if (f) { setFile(f); setPreview(null); setError(""); }}} className="hidden" />
            </div>
          )}

          {error && (
            <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl p-4 text-red-600 dark:text-red-400 text-sm">
              <XCircle className="w-5 h-5 shrink-0" />{error}
            </div>
          )}

          {selectedDept && (
            <button onClick={handlePreview} disabled={previewing || !isSetupReady}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base">
              {previewing ? <><Loader className="w-5 h-5 animate-spin" /> Parsing…</> : <><Eye className="w-5 h-5" /> Preview Import</>}
            </button>
          )}
        </>
      )}

      {/* ── STEP 2: Preview ──────────────────────────────────────────────── */}
      {step === 2 && preview && (
        <>
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 space-y-5">
            {/* Summary */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="font-bold text-zinc-900 dark:text-white text-lg">Preview — {preview.totalRows} subjects found</h2>
                <p className="text-sm text-zinc-500">{selectedDept.name} · {finalProgramName}</p>
              </div>
              <div className="flex gap-2">
                {Object.keys(preview.semesters).map(s => (
                  <span key={s} className="text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2 py-1 rounded-full">
                    Sem {s}: {preview.semesters[s].length}
                  </span>
                ))}
              </div>
            </div>

            {/* Row errors */}
            {preview.rowErrors?.length > 0 && (
              <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-4 space-y-2">
                <p className="text-sm font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> {preview.rowErrors.length} rows were skipped (will NOT be imported):
                </p>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {preview.rowErrors.map((e, i) => (
                    <p key={i} className="text-xs text-amber-700 dark:text-amber-400">Row {e.row}: {e.issue}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Semester-grouped subject list */}
            <div className="space-y-2">
              {Object.entries(preview.semesters).sort(([a], [b]) => Number(a) - Number(b)).map(([sem, subjects]) => (
                <div key={sem} className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                  <button onClick={() => toggleSem(sem)} className="w-full flex items-center justify-between px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                    <span className="font-semibold text-zinc-900 dark:text-white text-sm">Semester {sem}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-400">{subjects.length} subjects</span>
                      {expandedSems[sem] ? <ChevronDown className="w-4 h-4 text-zinc-400" /> : <ChevronRight className="w-4 h-4 text-zinc-400" />}
                    </div>
                  </button>

                  {expandedSems[sem] && (
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {subjects.map((s, i) => (
                        <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                          <span className="text-xs font-mono text-zinc-400 w-16 shrink-0">{s.code || "—"}</span>
                          <span className="text-sm text-zinc-900 dark:text-white flex-1">{s.name}</span>
                          {s.category && catBadge(s.category)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl p-4 text-red-600 dark:text-red-400 text-sm">
              <XCircle className="w-5 h-5 shrink-0" />{error}
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => { setPreview(null); setError(""); }} className="flex-1 py-4 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold rounded-xl transition-all flex items-center justify-center gap-2">
              <X className="w-5 h-5" /> Cancel
            </button>
            <button onClick={handleConfirmSave} disabled={saving}
              className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-base">
              {saving ? <><Loader className="w-5 h-5 animate-spin" /> Saving…</> : <><Save className="w-5 h-5" /> Confirm & Save {preview.totalRows} Subjects</>}
            </button>
          </div>
        </>
      )}

      {/* ── STEP 3: Done ─────────────────────────────────────────────────── */}
      {step === 3 && result && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-8 space-y-6 text-center">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-9 h-9 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Import Successful</h2>
            <p className="text-sm text-zinc-500 mt-1">{result.department} · {result.program} {result.programCreated && <span className="text-purple-500">(new program)</span>}</p>
          </div>
          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
            <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
              <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{result.created}</p>
              <p className="text-sm text-zinc-500 mt-1">Created</p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
              <p className="text-3xl font-black text-amber-600 dark:text-amber-400">{result.skipped}</p>
              <p className="text-sm text-zinc-500 mt-1">Skipped</p>
            </div>
          </div>
          {result.errors?.length > 0 && (
            <div className="text-left space-y-2">
              <p className="text-sm font-semibold text-red-600 dark:text-red-400 flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> {result.errors.length} row issues:</p>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {result.errors.map((e, i) => <p key={i} className="text-xs text-red-600 dark:text-red-400">Row {e.row}: {e.issue}</p>)}
              </div>
            </div>
          )}
          <button onClick={handleReset} className="w-full max-w-sm mx-auto py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all">
            <Plus className="w-4 h-4" /> Import Another Program
          </button>
        </div>
      )}
    </div>
  );
}