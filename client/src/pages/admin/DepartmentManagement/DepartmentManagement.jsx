import React, { useState, useEffect } from "react";
import api from "../../../services/api";
import {
  Building2, Plus, Trash2, Loader, Search, RefreshCw, AlertTriangle, AlertCircle, CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function SkeletonDept() {
  return (
    <div className="flex items-center gap-4 px-4 py-3.5 animate-pulse border-b border-zinc-100 dark:border-zinc-800/60 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-28 rounded bg-zinc-100 dark:bg-zinc-800" />
        <div className="h-2.5 w-16 rounded bg-zinc-100 dark:bg-zinc-800" />
      </div>
      <div className="h-6 w-14 rounded-md bg-zinc-100 dark:bg-zinc-800" />
    </div>
  );
}

export default function DepartmentManagement() {
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState(null);
  const [loadingDepts, setLoadingDepts] = useState(true);
  
  // Creation state
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");

  // Deletion state
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    setLoadingDepts(true);
    try {
      const res = await api.get("/academics/departments");
      setDepartments(res.data);
      if (res.data.length > 0 && !selectedDept) {
        setSelectedDept(res.data[0]);
      }
    } catch (err) {
      console.error("Failed to fetch departments", err);
    } finally {
      setLoadingDepts(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    setCreateError("");
    setCreateSuccess("");
    try {
      const res = await api.post("/academics/departments", {
        name: name.trim(),
        code: code.trim() || null
      });
      const newDept = res.data.department;
      setDepartments((prev) => [...prev, newDept].sort((a, b) => a.name.localeCompare(b.name)));
      setSelectedDept(newDept);
      setName("");
      setCode("");
      setCreateSuccess("Department created successfully!");
      setTimeout(() => setCreateSuccess(""), 4000);
    } catch (err) {
      setCreateError(err.response?.data?.message || "Failed to create department.");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedDept) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleting(true);
    setDeleteError("");
    try {
      await api.delete(`/academics/departments/${selectedDept.id}`);
      const updatedList = departments.filter((d) => d.id !== selectedDept.id);
      setDepartments(updatedList);
      setSelectedDept(updatedList.length > 0 ? updatedList[0] : null);
      setConfirmDelete(false);
    } catch (err) {
      setDeleteError(err.response?.data?.message || "Failed to delete department.");
    } finally {
      setDeleting(false);
    }
  };

  const filteredDepts = departments.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    (d.code || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      
      {/* ── Left panel — Department list ── */}
      <div className="w-80 shrink-0 border-r border-zinc-200 dark:border-zinc-800 flex flex-col bg-white dark:bg-zinc-900">
        
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
              placeholder="Search by name or code..."
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
                  onClick={() => {
                    setSelectedDept(d);
                    setConfirmDelete(false);
                    setDeleteError("");
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3.5 border-b border-zinc-100 dark:border-zinc-800/50 text-left transition-colors group
                    ${isActive
                      ? "bg-zinc-100 dark:bg-zinc-800 border-l-2 border-l-zinc-900 dark:border-l-zinc-100"
                      : "hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                    }`}
                >
                  <div className="min-w-0">
                    <p className={`text-xs font-semibold truncate ${
                      isActive ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-600 dark:text-zinc-400"
                    }`}>
                      {d.name}
                    </p>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5 font-medium uppercase">
                      Code: {d.code || "N/A"}
                    </p>
                  </div>
                  <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0 ml-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 px-1.5 py-0.5 rounded-md">
                    ACTIVE
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── Right panel — Creation & Deletion Panel ── */}
      <div className="flex-1 flex flex-col overflow-hidden bg-zinc-50/50 dark:bg-zinc-950/30">
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-4xl">
          
          {/* Header Description */}
          <div>
            <h2 className="text-xl font-black text-zinc-950 dark:text-white tracking-tight">Academic Department Operations</h2>
            <p className="text-xs text-zinc-400 mt-1">Create new active departments or safely deprecate unused departments from the platform.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Create Department Card */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-900/50 flex items-center justify-center">
                  <Plus className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Create Department</h3>
                  <p className="text-[10px] text-zinc-400">Add a verified department to the database</p>
                </div>
              </div>

              <form onSubmit={handleCreate} className="space-y-3 pt-2">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider ml-1">Department Name *</label>
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Physics"
                    className="w-full mt-1 px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider ml-1">Department Code (Optional)</label>
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. PHYS"
                    className="w-full mt-1 px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-mono"
                  />
                </div>

                {createError && (
                  <div className="flex items-start gap-1.5 p-2.5 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-[10px] text-red-600 dark:text-red-400 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{createError}</span>
                  </div>
                )}

                {createSuccess && (
                  <div className="flex items-start gap-1.5 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium animate-pulse">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{createSuccess}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={creating || !name.trim()}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-zinc-950 hover:bg-zinc-900 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 rounded-lg text-xs font-bold transition-all disabled:opacity-50 shadow-sm"
                >
                  {creating ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Create Department
                </button>
              </form>
            </div>

            {/* Selected Department Operations Card */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/50 flex items-center justify-center">
                  <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Delete Department</h3>
                  <p className="text-[10px] text-zinc-400">Remove selected department from platform</p>
                </div>
              </div>

              {!selectedDept ? (
                <div className="text-center py-8 text-zinc-400 text-xs font-medium">
                  Select a department from the left panel to execute operations.
                </div>
              ) : (
                <div className="space-y-4 pt-2">
                  <div className="bg-zinc-50 dark:bg-zinc-950 rounded-xl p-3.5 border border-zinc-100 dark:border-zinc-800/80 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-400 font-medium">Name:</span>
                      <span className="font-bold text-zinc-800 dark:text-zinc-200">{selectedDept.name}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-400 font-medium">Code:</span>
                      <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200 uppercase">{selectedDept.code || "N/A"}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-400 font-medium">System Status:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">ACTIVE</span>
                    </div>
                  </div>

                  {deleteError && (
                    <div className="flex items-start gap-1.5 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-[10px] text-red-600 dark:text-red-400 font-medium leading-relaxed">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                      <div>
                        <p className="font-bold">Database Safeguard Active</p>
                        <p className="mt-0.5 text-zinc-500 dark:text-zinc-400">{deleteError}</p>
                      </div>
                    </div>
                  )}

                  <div className="pt-2">
                    {confirmDelete ? (
                      <div className="space-y-2">
                        <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" /> Confirm deletion? This action cannot be undone.
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={handleDelete}
                            disabled={deleting}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all"
                          >
                            {deleting ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                            Confirm Delete
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setConfirmDelete(false);
                              setDeleteError("");
                            }}
                            className="px-3 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-medium transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={handleDelete}
                        className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 dark:text-red-400 rounded-lg text-xs font-bold transition-all shadow-sm"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete Department
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Guidelines info banner */}
          <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Database Consistency Safeguards</h4>
              <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">
                AcademiQ uses strict relational mapping. You cannot delete a department that contains active students, teachers, or seeded programs. This prevents cascading errors or orphan records across examinations, classes, and attendance registers. Please reassign or remove linked academic entities before attempting a department deletion.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
