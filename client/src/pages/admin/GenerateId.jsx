// client/src/pages/admin/ExamEngine/GenerateId.jsx
import { useState, useRef, useEffect } from "react";
import api from "../../services/api";
import * as XLSX from "xlsx";
import {
  Upload, File, X, Check, AlertCircle, Download, Loader2, Building2, BookOpen, GraduationCap,
} from "lucide-react";
import Alert from "../../components/ui/Alert";
import { useAcademic } from "../../context/AcademicContext";

export default function GenerateId() {
  const [activeTab, setActiveTab] = useState("single");
  const { departments, getProgramsForDept } = useAcademic();

  // ── Single ID state ──────────────────────────────────────────────────────
  const [formData, setFormData] = useState({ role: "student", name: "", email: "", expiry_days: 7 });
  const [generatedId, setGeneratedId] = useState(null);
  const [errorSingle, setErrorSingle] = useState("");
  const [loadingSingle, setLoadingSingle] = useState(false);

  // ── Bulk academic routing state ──────────────────────────────────────────
  const [batchDeptId, setBatchDeptId] = useState("");
  const [batchProgramId, setBatchProgramId] = useState("");
  const [batchSemester, setBatchSemester] = useState("");
  const [batchPrograms, setBatchPrograms] = useState([]);
  const [loadingPrograms, setLoadingPrograms] = useState(false);

  // ── Bulk file state ──────────────────────────────────────────────────────
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [bulkError, setBulkError] = useState("");
  const [loadingBulk, setLoadingBulk] = useState(false);
  const [bulkResults, setBulkResults] = useState(null);
  const fileInputRef = useRef(null);

  const token = localStorage.getItem("token");

  // When dept changes load its programs
  useEffect(() => {
    setBatchProgramId("");
    setBatchSemester("");
    setBatchPrograms([]);
    if (!batchDeptId) return;
    setLoadingPrograms(true);
    getProgramsForDept(batchDeptId)
      .then(data => setBatchPrograms(data))
      .finally(() => setLoadingPrograms(false));
  }, [batchDeptId]);

  // Semester options based on selected program
  const selectedProgram = batchPrograms.find(p => p.id === batchProgramId);
  const maxSem = selectedProgram ? selectedProgram.duration_years * 2 : 8;
  const semesterOptions = Array.from({ length: maxSem }, (_, i) => i + 1);

  // ── Single ID ────────────────────────────────────────────────────────────
  const handleSingleSubmit = async (e) => {
    e.preventDefault();
    setLoadingSingle(true);
    setErrorSingle("");
    setGeneratedId(null);
    try {
      const res = await api.post(`/admin/generate-id`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setGeneratedId(res.data);
    } catch (err) {
      setErrorSingle(err.response?.data?.message || "Failed to generate ID");
    } finally {
      setLoadingSingle(false);
    }
  };

  // ── File parsing ─────────────────────────────────────────────────────────
  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel", "text/csv",
    ];
    if (!validTypes.includes(uploadedFile.type) && !uploadedFile.name.match(/\.(xlsx|xls|csv)$/i)) {
      setBulkError("Invalid file type. Please upload a .csv, .xlsx, or .xls file.");
      return;
    }
    setFile(uploadedFile);
    setBulkError("");
    setBulkResults(null);
    parseFile(uploadedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files?.length) handleFileUpload({ target: { files: e.dataTransfer.files } });
  };

  const parseFile = (fileToParse) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        if (!rawRows.length) { setBulkError("The uploaded file appears to be empty."); return; }

        const emailSet = new Set();
        const processedRows = rawRows.map((row, index) => {
          const getVal = (...keys) => {
            const rowKeys = Object.keys(row);
            for (const key of keys) {
              for (const col of rowKeys) {
                const cleanCol = col.trim().toLowerCase();
                if (cleanCol === key.toLowerCase() || cleanCol.startsWith(key.toLowerCase()))
                  return String(row[col]).trim();
              }
            }
            if (keys.includes("email")) {
              for (const col of Object.keys(row)) {
                const cc = col.trim().toLowerCase();
                if (cc.includes("email") || cc.includes("mail")) return String(row[col]).trim();
              }
            }
            return "";
          };

          const name = getVal("name", "student name", "student_name", "first name", "full name");
          const email = getVal("email", "student email", "student_email", "email address");
          const rollNo = getVal("roll no", "roll number", "roll_no", "university roll no", "exam roll no", "roll");

          let isValid = true, reason = "";
          if (!name && !email && !rollNo) { isValid = false; reason = "Missing name, email, and roll no"; }
          else if (!name) { isValid = false; reason = "Missing name"; }
          else if (!email && !rollNo) { isValid = false; reason = "Missing email or roll no"; }
          else if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { isValid = false; reason = "Invalid email format"; }
          else if (email && emailSet.has(email.toLowerCase())) { isValid = false; reason = "Duplicate email in file"; }
          else if (email) emailSet.add(email.toLowerCase());

          return { id: index, name, email, rollNo, isValid, reason };
        });

        if (!processedRows.some(r => r.name || r.email || r.rollNo)) {
          setBulkError("Could not detect critical columns. Make sure headers are named 'Name' and 'Email' or 'Roll Number'.");
          setPreviewData([]);
          return;
        }
        setPreviewData(processedRows);
      } catch (err) {
        setBulkError("Error parsing file. Please make sure it's a valid Excel or CSV file.");
      }
    };
    reader.readAsArrayBuffer(fileToParse);
  };

  // ── Bulk submit ──────────────────────────────────────────────────────────
  const handleBulkSubmit = async () => {
    const validStudents = previewData.filter(r => r.isValid).map(r => ({
      name: r.name, email: r.email, rollNo: r.rollNo,
    }));
    if (!validStudents.length) { setBulkError("No valid rows to process."); return; }

    setLoadingBulk(true);
    setBulkError("");
    try {
      const res = await api.post(
        `/admin/students/bulk-generate`,
        {
          students: validStudents,
          department_id: batchDeptId || undefined,
          program_id: batchProgramId || undefined,
          current_semester: batchSemester ? parseInt(batchSemester) : undefined,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setBulkResults(res.data);
    } catch (err) {
      setBulkError(err.response?.data?.message || "Failed to bulk generate IDs");
    } finally {
      setLoadingBulk(false);
    }
  };

  const downloadResultsCSV = () => {
    if (!bulkResults?.data?.length) return;
    const ws = XLSX.utils.json_to_sheet(bulkResults.data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Generated IDs");
    XLSX.writeFile(wb, `Bulk_Student_IDs_${new Date().toISOString().split("T")[0]}.csv`);
  };

  const resetBulk = () => { setFile(null); setPreviewData([]); setBulkResults(null); setBulkError(""); };

  const SELECT_CLS = "w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 outline-none transition-all dark:bg-zinc-950 dark:border-zinc-800 dark:focus:ring-zinc-700 dark:text-white text-sm";

  return (
    <div className="p-8 max-w-5xl mx-auto min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">User Management</h1>
        <p className="text-zinc-500 mt-1 dark:text-zinc-400">Generate standard IDs or strictly bound IDs for system access.</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-8 bg-zinc-100 dark:bg-zinc-800/50 p-1 rounded-lg w-fit">
        {["single", "bulk"].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 text-sm font-semibold rounded-md transition-all ${activeTab === tab ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"}`}>
            {tab === "single" ? "Single ID Generation" : "Bulk Student Generation"}
          </button>
        ))}
      </div>

      {/* ── SINGLE TAB ─────────────────────────────────────────────────────── */}
      {activeTab === "single" && (
        <div className="max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm p-6">
          {errorSingle && <div className="mb-6"><Alert variant="error" title="Error">{errorSingle}</Alert></div>}

          {generatedId && (
            <div className="mb-6 p-5 bg-green-50 border border-green-200 rounded-lg dark:bg-green-900/20 dark:border-green-800/50">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-800/50 flex items-center justify-center">
                  <Check size={18} className="text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-bold text-lg text-green-800 dark:text-green-300">ID Generated Successfully!</h3>
              </div>
              <div className="bg-white dark:bg-zinc-950 px-4 py-3 rounded border border-green-100 dark:border-green-900/50 mb-3">
                <span className="text-2xl font-mono tracking-wider font-bold text-zinc-900 dark:text-white select-all">{generatedId.unique_id}</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-green-600/70 dark:text-green-400/70 text-xs font-bold uppercase tracking-wider mb-1">Role</p>
                  <p className="font-medium text-green-900 dark:text-green-100 capitalize">{generatedId.role}</p>
                </div>
                {generatedId.bound_to?.name && (
                  <div>
                    <p className="text-green-600/70 dark:text-green-400/70 text-xs font-bold uppercase tracking-wider mb-1">Bound To</p>
                    <p className="font-medium text-green-900 dark:text-green-100 truncate">{generatedId.bound_to.name}</p>
                    <p className="text-xs text-green-700 dark:text-green-400 truncate mt-0.5">{generatedId.bound_to.email}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSingleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold mb-1.5 text-zinc-900 dark:text-zinc-100">User Role</label>
              <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} className={SELECT_CLS}>
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {formData.role === "teacher" && (
              <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg dark:bg-amber-900/10 dark:border-amber-900/50">
                <AlertCircle size={18} className="text-amber-600 dark:text-amber-500 mt-0.5" />
                <p className="text-sm text-amber-800 dark:text-amber-400 font-medium leading-relaxed">
                  Teacher IDs must be strictly bound. Provide the teacher's exact Name and Email below.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-zinc-900 dark:text-zinc-100">
                  Full Name {formData.role === "teacher" && <span className="text-red-500">*</span>}
                </label>
                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Jane Doe" className={SELECT_CLS} required={formData.role === "teacher"} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-zinc-900 dark:text-zinc-100">
                  Email Address {formData.role === "teacher" && <span className="text-red-500">*</span>}
                </label>
                <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. jane@example.com" className={SELECT_CLS} required={formData.role === "teacher"} />
              </div>
            </div>

            <div className="pt-4 mt-6 border-t border-zinc-100 dark:border-zinc-800">
              <button type="submit" disabled={loadingSingle}
                className="w-full md:w-auto px-6 py-2.5 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 active:scale-[0.98] transition-all dark:bg-zinc-100 dark:text-zinc-900 font-bold inline-flex items-center justify-center gap-2 disabled:opacity-70 shadow-sm">
                {loadingSingle ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                Generate Single ID
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── BULK TAB ────────────────────────────────────────────────────────── */}
      {activeTab === "bulk" && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden flex flex-col">

          {/* Academic routing section */}
          <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
            <h2 className="text-base font-bold text-zinc-900 dark:text-white mb-1 flex items-center gap-2">
              <GraduationCap size={18} className="text-violet-500" /> Academic Routing
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
              Assign Department, Program, and Semester to all IDs in this batch. Students will have these values pre-set when they register.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Department */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                  <Building2 size={12} /> Department
                </label>
                <select value={batchDeptId} onChange={e => setBatchDeptId(e.target.value)} className={SELECT_CLS}>
                  <option value="">— All / Unassigned —</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>

              {/* Program */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                  <BookOpen size={12} /> Program
                </label>
                {loadingPrograms ? (
                  <div className="flex items-center gap-2 text-xs text-zinc-400 py-2.5"><Loader2 size={14} className="animate-spin" /> Loading…</div>
                ) : (
                  <select value={batchProgramId} onChange={e => { setBatchProgramId(e.target.value); setBatchSemester(""); }}
                    disabled={!batchDeptId} className={`${SELECT_CLS} disabled:opacity-40`}>
                    <option value="">— Select Program —</option>
                    {batchPrograms.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                )}
              </div>

              {/* Semester */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                  <GraduationCap size={12} /> Semester
                </label>
                <select value={batchSemester} onChange={e => setBatchSemester(e.target.value)}
                  disabled={!batchProgramId} className={`${SELECT_CLS} disabled:opacity-40`}>
                  <option value="">— Select Semester —</option>
                  {semesterOptions.map(s => <option key={s} value={s}>Semester {s}</option>)}
                </select>
              </div>
            </div>

            {/* Summary badge */}
            {batchDeptId && (
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium text-violet-700 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 px-2.5 py-1 rounded-full">
                  {departments.find(d => d.id === batchDeptId)?.name}
                  {batchProgramId && ` · ${batchPrograms.find(p => p.id === batchProgramId)?.name}`}
                  {batchSemester && ` · Semester ${batchSemester}`}
                </span>
                <span className="text-xs text-zinc-400">will be assigned to all IDs in this batch</span>
              </div>
            )}
          </div>

          <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Upload Student List</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Upload a <code>.csv</code> or <code>.xlsx</code> with <strong>Name</strong> and <strong>Email</strong> (or <strong>Roll Number</strong>) columns.
            </p>
          </div>

          <div className="p-6 flex-1 flex flex-col">
            {bulkError && <div className="mb-6"><Alert variant="error" title="Upload Error">{bulkError}</Alert></div>}

            {/* Results view */}
            {bulkResults ? (
              <div className="flex-1 flex flex-col">
                <div className="bg-green-50 border border-green-200 rounded-xl p-6 dark:bg-green-900/10 dark:border-green-900/30 mb-6 text-center">
                  <div className="mx-auto w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4 dark:bg-green-800/50 dark:text-green-400">
                    <Check size={24} strokeWidth={3} />
                  </div>
                  <h3 className="text-2xl font-bold text-green-900 dark:text-green-300 mb-1">Generation Complete!</h3>
                  <p className="text-green-700 dark:text-green-400/80 mb-2">
                    Generated <strong>{bulkResults.successCount}</strong> unique IDs.
                    {bulkResults.failedCount > 0 && ` Skipped ${bulkResults.failedCount} rows.`}
                  </p>
                  {bulkResults.current_semester && (
                    <p className="text-xs text-green-600 dark:text-green-500 mb-4">
                      All IDs assigned to Semester {bulkResults.current_semester}
                      {bulkResults.program_id ? " · program linked" : ""}
                    </p>
                  )}
                  <div className="flex items-center justify-center gap-4">
                    <button onClick={downloadResultsCSV} className="px-6 py-2.5 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 shadow flex items-center gap-2 transition-colors">
                      <Download size={18} /> Download Export (.csv)
                    </button>
                    <button onClick={resetBulk} className="px-6 py-2.5 bg-white text-zinc-700 font-bold rounded-lg border border-zinc-200 hover:bg-zinc-50 shadow-sm transition-colors dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-700">
                      Upload Another
                    </button>
                  </div>
                </div>

                {bulkResults.errors?.length > 0 && (
                  <div>
                    <h4 className="font-bold text-zinc-900 dark:text-zinc-100 mb-3 text-sm uppercase tracking-wider">
                      Skipped Rows ({bulkResults.errors.length})
                    </h4>
                    <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden bg-zinc-50 dark:bg-zinc-950">
                      <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
                        {bulkResults.errors.map((err, i) => (
                          <li key={i} className="px-4 py-3 text-sm flex gap-3">
                            <span className="text-red-500 mt-0.5"><AlertCircle size={16} /></span>
                            <div>
                              <p className="text-zinc-900 dark:text-zinc-100 font-medium">{err.email} {err.name ? `(${err.name})` : ""}</p>
                              <p className="text-red-500 dark:text-red-400 mt-0.5">{err.reason}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>

            ) : !file ? (
              // Upload drop zone
              <div
                className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl p-12 text-center bg-zinc-50 hover:bg-zinc-100/50 dark:bg-zinc-950 dark:hover:bg-zinc-900/50 transition-colors cursor-pointer"
                onDragOver={e => e.preventDefault()} onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-16 h-16 bg-white dark:bg-zinc-800 shadow-sm rounded-full flex items-center justify-center border border-zinc-200 dark:border-zinc-700 mb-6 mx-auto">
                  <Upload size={28} className="text-zinc-400 dark:text-zinc-500" />
                </div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-1">Click to upload or drag and drop</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mb-6">CSV, XLS, or XLSX. Headers: Name, Email (or Roll Number).</p>
                <button className="px-5 py-2.5 bg-zinc-900 text-white rounded-lg font-bold dark:bg-zinc-100 dark:text-zinc-900 shadow-sm pointer-events-none">Select File</button>
                <input type="file" ref={fileInputRef} className="hidden"
                  accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                  onChange={handleFileUpload} />
              </div>

            ) : (
              // Preview table
              <div className="flex-1 flex flex-col h-full min-h-[400px]">
                <div className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-800/50 p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl mb-6">
                  <div className="flex items-center gap-3 w-full">
                    <div className="w-10 h-10 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center rounded-lg shadow-sm shrink-0">
                      <File size={20} className="text-violet-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-zinc-900 dark:text-white truncate pr-4">{file.name}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {previewData.length} rows detected · {previewData.filter(r => r.isValid).length} valid
                      </p>
                    </div>
                    <button onClick={() => { setFile(null); setPreviewData([]); }}
                      className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors shrink-0">
                      <X size={18} />
                    </button>
                  </div>
                </div>

                <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden flex-1 flex flex-col shadow-sm">
                  <div className="bg-zinc-50 dark:bg-zinc-950 grid grid-cols-[auto_1fr_1fr_1.5fr] md:grid-cols-[auto_1fr_1fr_1fr_1.5fr] gap-4 p-3 border-b border-zinc-200 dark:border-zinc-800 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    <div className="w-8 text-center">Set</div>
                    <div>Name</div>
                    <div className="hidden md:block">Roll No</div>
                    <div>Email</div>
                    <div>Status</div>
                  </div>
                  <div className="overflow-y-auto flex-1 max-h-[400px]">
                    {previewData.map(row => (
                      <div key={row.id} className={`grid grid-cols-[auto_1fr_1fr_1.5fr] md:grid-cols-[auto_1fr_1fr_1fr_1.5fr] gap-4 p-3 text-sm items-center border-b last:border-0 border-zinc-100 dark:border-zinc-800/50 ${!row.isValid ? "bg-red-50/50 dark:bg-red-900/10" : ""}`}>
                        <div className="w-8 text-center">
                          {row.isValid ? <Check size={16} className="text-green-500 mx-auto" /> : <X size={16} className="text-red-500 mx-auto" />}
                        </div>
                        <div className={`truncate ${!row.name ? "text-zinc-400 italic" : "font-medium text-zinc-900 dark:text-zinc-100"}`}>
                          {row.name || "Missing Name"}
                        </div>
                        <div className={`truncate hidden md:block ${!row.rollNo ? "text-zinc-400 italic" : "text-zinc-600 dark:text-zinc-300"}`}>
                          {row.rollNo || "N/A"}
                        </div>
                        <div className={`truncate ${!row.email ? "text-zinc-400 italic" : "text-zinc-600 dark:text-zinc-300"}`}>
                          {row.email || (row.rollNo ? "N/A" : "Missing Email")}
                        </div>
                        <div>
                          {row.isValid
                            ? <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Ready</span>
                            : <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 truncate max-w-full">{row.reason}</span>
                          }
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <button onClick={() => { setFile(null); setPreviewData([]); }}
                    className="px-5 py-2.5 bg-white text-zinc-700 font-bold rounded-lg border border-zinc-200 hover:bg-zinc-50 transition-colors dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-700">
                    Cancel
                  </button>
                  <button onClick={handleBulkSubmit}
                    disabled={loadingBulk || previewData.filter(r => r.isValid).length === 0}
                    className="px-6 py-2.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 active:scale-[0.98] transition-all font-bold inline-flex items-center gap-2 disabled:opacity-70 disabled:pointer-events-none shadow">
                    {loadingBulk ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                    Generate {previewData.filter(r => r.isValid).length} IDs
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}