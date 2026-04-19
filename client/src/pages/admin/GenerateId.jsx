import { useState, useRef, useEffect } from "react";
import api from "../../services/api";
import * as XLSX from "xlsx";
import {
  Upload, File, X, Check, AlertCircle, Download, Loader2,
  Building2, BookOpen, GraduationCap, Users, Sparkles,
} from "lucide-react";
import Alert from "../../components/ui/Alert";
import { useAcademic } from "../../context/AcademicContext";

/* ─── Reusable primitives ────────────────────────────────────────── */

function Label({ children, required }) {
  return (
    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

function Input({ className = "", ...props }) {
  return (
    <input
      className={`w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 dark:focus:ring-zinc-300/20 focus:border-zinc-900 dark:focus:border-zinc-300 transition-all duration-150 ${className}`}
      {...props}
    />
  );
}

function Select({ className = "", children, ...props }) {
  return (
    <select
      className={`w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 dark:focus:ring-zinc-300/20 focus:border-zinc-900 dark:focus:border-zinc-300 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

function Button({ variant = "primary", className = "", children, ...props }) {
  const base = "inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none";
  const variants = {
    primary: "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-sm",
    secondary: "bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 dark:hover:bg-zinc-700 shadow-sm",
    success: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm",
    ghost: "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800",
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

function SectionHeader({ icon: Icon, title, description }) {
  return (
    <div className="flex items-start gap-3 p-5 border-b border-zinc-100 dark:border-zinc-800">
      <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={15} className="text-zinc-600 dark:text-zinc-400" />
      </div>
      <div>
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
        {description && <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">{description}</p>}
      </div>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────────── */

export default function GenerateId() {
  const [activeTab, setActiveTab] = useState("single");
  const { departments, getProgramsForDept } = useAcademic();

  // ── Single ID state ──────────────────────────────────────────────
  const [formData, setFormData] = useState({ role: "student", name: "", email: "", expiry_days: 7 });
  const [generatedId, setGeneratedId] = useState(null);
  const [errorSingle, setErrorSingle] = useState("");
  const [loadingSingle, setLoadingSingle] = useState(false);

  // ── Bulk academic routing state ──────────────────────────────────
  const [batchDeptId, setBatchDeptId] = useState("");
  const [batchProgramId, setBatchProgramId] = useState("");
  const [batchSemester, setBatchSemester] = useState("");
  const [batchPrograms, setBatchPrograms] = useState([]);
  const [loadingPrograms, setLoadingPrograms] = useState(false);

  // ── Bulk file state ──────────────────────────────────────────────
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [bulkError, setBulkError] = useState("");
  const [loadingBulk, setLoadingBulk] = useState(false);
  const [bulkResults, setBulkResults] = useState(null);
  const fileInputRef = useRef(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    setBatchProgramId("");
    setBatchSemester("");
    setBatchPrograms([]);
    if (!batchDeptId) return;
    setLoadingPrograms(true);
    getProgramsForDept(batchDeptId)
      .then((data) => setBatchPrograms(data))
      .finally(() => setLoadingPrograms(false));
  }, [batchDeptId]);

  const selectedProgram = batchPrograms.find((p) => p.id === batchProgramId);
  const maxSem = selectedProgram ? selectedProgram.duration_years * 2 : 8;
  const semesterOptions = Array.from({ length: maxSem }, (_, i) => i + 1);

  // ── Single submit — both name + email always required ────────────
  const canSubmitSingle = formData.name.trim() !== "" && formData.email.trim() !== "";

  const handleSingleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmitSingle) return;
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

  // ── File handling ────────────────────────────────────────────────
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

        if (!processedRows.some((r) => r.name || r.email || r.rollNo)) {
          setBulkError("Could not detect critical columns. Make sure headers are named 'Name' and 'Email' or 'Roll Number'.");
          setPreviewData([]);
          return;
        }
        setPreviewData(processedRows);
      } catch {
        setBulkError("Error parsing file. Please make sure it's a valid Excel or CSV file.");
      }
    };
    reader.readAsArrayBuffer(fileToParse);
  };

  // ── Bulk submit ──────────────────────────────────────────────────
  const handleBulkSubmit = async () => {
    const validStudents = previewData.filter((r) => r.isValid).map((r) => ({
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
  const validCount = previewData.filter((r) => r.isValid).length;

  /* ── Render ─────────────────────────────────────────────────────── */
  return (
    <div className="p-6 h-full flex flex-col space-y-5">

      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
          User Management
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          Generate standard or bulk-bound access IDs for students, teachers, and admins.
        </p>
      </div>

      <div className="h-px bg-zinc-200 dark:bg-zinc-800 shrink-0" />

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-zinc-100 dark:bg-zinc-800/60 rounded-lg w-fit shrink-0">
        {[
          { key: "single", label: "Single ID", icon: Sparkles },
          { key: "bulk", label: "Bulk Students", icon: Users },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all duration-150
              ${activeTab === key
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* ── SINGLE TAB ─────────────────────────────────────────────── */}
      {activeTab === "single" && (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">

          {/* Left — form */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm">
            <SectionHeader
              icon={Sparkles}
              title="Generate Single ID"
              description="Create an individual access ID. Both name and email are required for all roles."
            />
            <div className="p-5 space-y-4">
              {errorSingle && <Alert variant="error" title="Error">{errorSingle}</Alert>}

              <form onSubmit={handleSingleSubmit} className="space-y-4">
                {/* Role */}
                <div>
                  <Label>User Role</Label>
                  <Select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="admin">Admin</option>
                  </Select>
                </div>

                {/* Teacher info banner */}
                {formData.role === "teacher" && (
                  <div className="flex items-start gap-2.5 p-3.5 rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30">
                    <AlertCircle size={14} className="text-amber-600 dark:text-amber-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-amber-800 dark:text-amber-400 leading-relaxed">
                      Teacher IDs are strictly bound. The name and email must exactly match what the teacher uses to register.
                    </p>
                  </div>
                )}

                {/* Name */}
                <div>
                  <Label required>Full Name</Label>
                  <Input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Jane Doe"
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <Label required>Email Address</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. jane@example.com"
                    required
                  />
                </div>

                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
                  <Button
                    type="submit"
                    disabled={loadingSingle || !canSubmitSingle}
                    className="w-full"
                  >
                    {loadingSingle
                      ? <Loader2 size={15} className="animate-spin" />
                      : <Sparkles size={15} />
                    }
                    Generate ID
                  </Button>
                  {!canSubmitSingle && (
                    <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-2 text-center">
                      Both name and email are required to generate an ID.
                    </p>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Right — result / instructions */}
          <div className="space-y-4">
            {generatedId ? (
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm">
                <SectionHeader icon={Check} title="ID Generated" description="Share this ID with the user so they can register." />
                <div className="p-5 space-y-4">
                  <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-5 py-4 text-center">
                    <p className="text-[10px] uppercase tracking-widest text-zinc-400 mb-2">Unique Access ID</p>
                    <span className="text-3xl font-mono tracking-widest font-bold text-zinc-900 dark:text-zinc-100 select-all">
                      {generatedId.unique_id}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-3">
                      <p className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400 mb-1">Role</p>
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 capitalize">{generatedId.role}</p>
                    </div>
                    {generatedId.bound_to?.name && (
                      <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-3">
                        <p className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400 mb-1">Bound To</p>
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{generatedId.bound_to.name}</p>
                        <p className="text-xs text-zinc-500 truncate mt-0.5">{generatedId.bound_to.email}</p>
                      </div>
                    )}
                  </div>

                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => { setGeneratedId(null); setFormData({ role: "student", name: "", email: "", expiry_days: 7 }); }}
                  >
                    Generate Another
                  </Button>
                </div>
              </div>
            ) : (
              /* Placeholder when no result yet */
              <div className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 p-10 flex flex-col items-center justify-center text-center gap-3">
                <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                  <Sparkles size={18} className="text-zinc-400 dark:text-zinc-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Generated ID will appear here</p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">Fill in the form and click Generate ID</p>
                </div>
              </div>
            )}

            {/* Info card */}
            <div className="rounded-xl border border-zinc-100 dark:border-zinc-800/60 bg-zinc-50 dark:bg-zinc-900/50 p-4 space-y-2">
              <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">How it works</p>
              <ul className="space-y-1.5">
                {[
                  "Each ID is single-use and expires after the set period.",
                  "Student IDs are loosely bound — anyone with the ID can register.",
                  "Teacher and Admin IDs are strictly bound to the provided email.",
                ].map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                    <span className="w-4 h-4 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-[9px] font-bold text-zinc-600 dark:text-zinc-300 shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ── BULK TAB ──────────────────────────────────────────────── */}
      {activeTab === "bulk" && (
        <div className="flex-1 flex flex-col space-y-4">

          {/* Academic routing */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm">
            <SectionHeader
              icon={GraduationCap}
              title="Academic Routing"
              description="Assign Department, Program, and Semester to every ID in this batch."
            />
            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label><span className="flex items-center gap-1"><Building2 size={11} /> Department</span></Label>
                  <Select value={batchDeptId} onChange={(e) => setBatchDeptId(e.target.value)}>
                    <option value="">All / Unassigned</option>
                    {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </Select>
                </div>
                <div>
                  <Label><span className="flex items-center gap-1"><BookOpen size={11} /> Program</span></Label>
                  {loadingPrograms ? (
                    <div className="flex items-center gap-2 text-xs text-zinc-400 py-2">
                      <Loader2 size={13} className="animate-spin" /> Loading…
                    </div>
                  ) : (
                    <Select value={batchProgramId} onChange={(e) => { setBatchProgramId(e.target.value); setBatchSemester(""); }} disabled={!batchDeptId}>
                      <option value="">Select Program</option>
                      {batchPrograms.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </Select>
                  )}
                </div>
                <div>
                  <Label><span className="flex items-center gap-1"><GraduationCap size={11} /> Semester</span></Label>
                  <Select value={batchSemester} onChange={(e) => setBatchSemester(e.target.value)} disabled={!batchProgramId}>
                    <option value="">Select Semester</option>
                    {semesterOptions.map((s) => <option key={s} value={s}>Semester {s}</option>)}
                  </Select>
                </div>
              </div>

              {batchDeptId && (
                <div className="flex items-center gap-2 flex-wrap mt-3">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-2.5 py-1 rounded-md">
                    <Check size={11} className="text-emerald-500" />
                    {departments.find((d) => d.id === batchDeptId)?.name}
                    {batchProgramId && ` · ${batchPrograms.find((p) => p.id === batchProgramId)?.name}`}
                    {batchSemester && ` · Sem ${batchSemester}`}
                  </span>
                  <span className="text-xs text-zinc-400">assigned to all IDs in this batch</span>
                </div>
              )}
            </div>
          </div>

          {/* Upload / preview */}
          <div className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm flex flex-col">
            <SectionHeader
              icon={Upload}
              title="Upload Student List"
              description="Upload a .csv or .xlsx file with Name and Email (or Roll Number) columns."
            />

            <div className="p-5 flex-1 flex flex-col">
              {bulkError && <div className="mb-4"><Alert variant="error" title="Upload Error">{bulkError}</Alert></div>}

              {/* Results */}
              {bulkResults ? (
                <div className="flex-1 space-y-4">
                  <div className="text-center rounded-lg border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-950/20 p-8">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center mx-auto mb-3">
                      <Check size={22} className="text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h3 className="text-base font-semibold text-emerald-900 dark:text-emerald-200 mb-1">Generation Complete</h3>
                    <p className="text-sm text-emerald-700 dark:text-emerald-400/80 mb-4">
                      <strong>{bulkResults.successCount}</strong> IDs generated
                      {bulkResults.failedCount > 0 && `, ${bulkResults.failedCount} rows skipped`}.
                    </p>
                    <div className="flex items-center justify-center gap-3">
                      <Button variant="success" onClick={downloadResultsCSV}>
                        <Download size={15} /> Download (.csv)
                      </Button>
                      <Button variant="secondary" onClick={resetBulk}>Upload Another</Button>
                    </div>
                  </div>

                  {bulkResults.errors?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                        Skipped ({bulkResults.errors.length})
                      </p>
                      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800 overflow-hidden">
                        {bulkResults.errors.map((err, i) => (
                          <div key={i} className="flex items-start gap-3 px-4 py-3 text-xs bg-white dark:bg-zinc-950">
                            <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
                            <div>
                              <span className="font-medium text-zinc-900 dark:text-zinc-100">{err.email}{err.name ? ` · ${err.name}` : ""}</span>
                              <p className="text-red-500 dark:text-red-400 mt-0.5">{err.reason}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

              ) : !file ? (
                /* Drop zone */
                <div
                  className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg p-12 text-center cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-all duration-200 min-h-[260px]"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center mb-4">
                    <Upload size={20} className="text-zinc-400 dark:text-zinc-500" />
                  </div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Click to upload or drag and drop</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mb-5">
                    CSV, XLS, or XLSX — headers:{" "}
                    <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-[11px]">Name</code>,{" "}
                    <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-[11px]">Email</code> or{" "}
                    <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-[11px]">Roll Number</code>
                  </p>
                  <Button variant="secondary" className="pointer-events-none">
                    <Upload size={14} /> Select File
                  </Button>
                  <input
                    type="file" ref={fileInputRef} className="hidden"
                    accept=".csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                    onChange={handleFileUpload}
                  />
                </div>

              ) : (
                /* Preview */
                <div className="flex-1 flex flex-col space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40">
                    <div className="w-9 h-9 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shrink-0">
                      <File size={16} className="text-zinc-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{file.name}</p>
                      <p className="text-xs text-zinc-500">
                        {previewData.length} rows ·{" "}
                        <span className="text-emerald-600 dark:text-emerald-400">{validCount} valid</span>
                        {previewData.length - validCount > 0 && (
                          <span className="text-red-500 ml-1">· {previewData.length - validCount} invalid</span>
                        )}
                      </p>
                    </div>
                    <button
                      onClick={() => { setFile(null); setPreviewData([]); }}
                      className="p-1.5 rounded-md text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors shrink-0"
                    >
                      <X size={15} />
                    </button>
                  </div>

                  <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden flex-1 flex flex-col">
                    <div className="grid grid-cols-[28px_1fr_1fr_1fr_100px] gap-3 px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      <div />
                      <div>Name</div>
                      <div className="hidden md:block">Roll No</div>
                      <div>Email</div>
                      <div>Status</div>
                    </div>
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800/70 max-h-[340px] overflow-y-auto">
                      {previewData.map((row) => (
                        <div
                          key={row.id}
                          className={`grid grid-cols-[28px_1fr_1fr_1fr_100px] gap-3 px-4 py-2.5 text-xs items-center
                            ${!row.isValid ? "bg-red-50/60 dark:bg-red-950/10" : "hover:bg-zinc-50 dark:hover:bg-zinc-800/30"}`}
                        >
                          <div className="flex justify-center">
                            {row.isValid ? <Check size={13} className="text-emerald-500" /> : <X size={13} className="text-red-500" />}
                          </div>
                          <div className={`truncate ${!row.name ? "text-zinc-400 italic" : "font-medium text-zinc-900 dark:text-zinc-100"}`}>
                            {row.name || "Missing"}
                          </div>
                          <div className={`truncate hidden md:block ${!row.rollNo ? "text-zinc-400" : "text-zinc-600 dark:text-zinc-300"}`}>
                            {row.rollNo || "—"}
                          </div>
                          <div className={`truncate ${!row.email ? "text-zinc-400 italic" : "text-zinc-600 dark:text-zinc-300"}`}>
                            {row.email || (row.rollNo ? "—" : "Missing")}
                          </div>
                          <div>
                            {row.isValid
                              ? <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">Ready</span>
                              : <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-semibold bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 truncate max-w-full">{row.reason}</span>
                            }
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800 shrink-0">
                    <Button variant="secondary" onClick={() => { setFile(null); setPreviewData([]); }}>Cancel</Button>
                    <Button onClick={handleBulkSubmit} disabled={loadingBulk || validCount === 0}>
                      {loadingBulk ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                      Generate {validCount} ID{validCount !== 1 ? "s" : ""}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}