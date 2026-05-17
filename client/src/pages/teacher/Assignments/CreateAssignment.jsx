// client/src/pages/teacher/Assignments/CreateAssignment.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Save, Loader2, Calendar, FileText, Info, Search, ChevronDown, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import assignmentService from "../../../services/assignmentService";
import api from "../../../services/api"; // For fetching subjects
import Alert from "../../../components/ui/Alert";

export default function CreateAssignment() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [subjects, setSubjects] = useState([]);
  const [subjectMode, setSubjectMode] = useState('select'); // 'select' or 'create'
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    subject_id: "",
    title: "",
    description: "",
    due_date: "",
    max_marks: 100
  });

  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectSemester, setNewSubjectSemester] = useState("1");
  const [addingSubject, setAddingSubject] = useState(false);
  const [deletingSubjectId, setDeletingSubjectId] = useState(null);
  
  // Semester filter state for dropdown
  const [selectedSemesterFilter, setSelectedSemesterFilter] = useState("ALL");

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [subjectSearch, setSubjectSearch] = useState("");



  useEffect(() => {
    fetchSubjects();
    if (isEdit) {
      fetchAssignment();
    }
  }, [id]);

  const fetchSubjects = async () => {
    try {
      const res = await api.get("/academics/my-subjects");
      setSubjects(res.data);
      if (res.data.length > 0 && !isEdit) {
        setFormData(prev => ({ ...prev, subject_id: res.data[0].id }));
      }
    } catch (err) {
      setError("Failed to load subjects");
    }
  };

  const fetchAssignment = async () => {
    try {
      setInitialLoading(true);
      const res = await assignmentService.getAssignmentDetails(id);
      const { assignment } = res.data;
      setFormData({
        subject_id: assignment.subject_id,
        title: assignment.title,
        description: assignment.description || "",
        due_date: new Date(assignment.due_date).toISOString().split('T')[0],
        max_marks: assignment.max_marks
      });
    } catch (err) {
      setError("Failed to load assignment details");
    } finally {
      setInitialLoading(false);
    }
  };

  const handleQuickAddSubject = async () => {
    if (!newSubjectName.trim()) return;
    setAddingSubject(true);
    try {
      const res = await api.post("/academics/subjects", { 
        name: newSubjectName.trim(),
        semester: parseInt(newSubjectSemester)
      });
      const newSub = res.data;
      setSubjects(prev => [...prev, newSub]);
      setFormData(prev => ({ ...prev, subject_id: newSub.id }));
      setNewSubjectName("");
      setNewSubjectSemester("1");
      setShowQuickAdd(false);
    } catch (err) {
      setError("Failed to add subject");
    } finally {
      setAddingSubject(false);
    }
  };

  const handleDeleteSubject = async (e, subjectId) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this subject?")) return;
    setDeletingSubjectId(subjectId);
    try {
      await api.delete(`/academics/subjects/${subjectId}`);
      setSubjects(subjects.filter(s => s.id !== subjectId));
      if (formData.subject_id === subjectId) {
        setFormData(prev => ({ ...prev, subject_id: "" }));
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete subject. It might be linked to existing assignments.");
    } finally {
      setDeletingSubjectId(null);
    }
  };

  const filteredSubjects = selectedSemesterFilter === "ALL" 
    ? subjects 
    : subjects.filter(sub => sub.semester === parseInt(selectedSemesterFilter));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== undefined) {
          data.append(key, formData[key]);
        }
      });

      if (isEdit) {
        await assignmentService.updateAssignment(id, data);
      } else {
        await assignmentService.createAssignment(data);
      }
      navigate("/teacher/assignments");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save assignment");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-teal-600" size={40} />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto pb-40">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate("/teacher/assignments")}
          className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all"
        >
          <ChevronLeft size={24} />
        </button>
        <div>
          <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
            {isEdit ? "Edit Assignment" : "New Assignment"}
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium">
            Fill in the details to {isEdit ? "update" : "publish"} the assignment
          </p>
        </div>
      </div>

      {error && <Alert variant="error" className="mb-6">{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-8 relative">
        <div className="bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-teal-500/30 rounded-3xl shadow-[0_0_50px_rgba(20,184,166,0.1)] p-8 pb-48 space-y-8 overflow-visible relative z-10">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl w-max mb-4">
                <button 
                  type="button" 
                  onClick={() => setSubjectMode('select')} 
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${subjectMode === 'select' ? 'bg-white dark:bg-zinc-700 text-teal-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                >
                  Select Existing
                </button>
                <button 
                  type="button" 
                  onClick={() => setSubjectMode('create')} 
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${subjectMode === 'create' ? 'bg-white dark:bg-zinc-700 text-teal-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                >
                  Create New
                </button>
              </div>

              {subjectMode === 'select' ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                      Subject
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-zinc-500">Filter:</span>
                  <select 
                    value={selectedSemesterFilter}
                    onChange={(e) => {
                      setSelectedSemesterFilter(e.target.value);
                      setFormData(prev => ({ ...prev, subject_id: "" })); // Reset selection on filter change
                    }}
                    className="bg-zinc-100 dark:bg-zinc-800 text-[10px] font-bold rounded-lg px-2 py-1 outline-none text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
                  >
                    <option value="ALL">All Semesters</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                      <option key={s} value={s}>Semester {s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dropdown for selecting existing subjects */}
              <div className="relative group">
                  <div 
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-100 dark:border-zinc-800 rounded-xl flex items-center justify-between cursor-pointer group-hover:border-teal-500/50 transition-all"
                  >
                    <span className={`text-sm font-bold ${formData.subject_id ? "text-zinc-900 dark:text-white" : "text-zinc-400"}`}>
                      {formData.subject_id 
                        ? (() => {
                            const sub = subjects.find(s => s.id === formData.subject_id);
                            return sub ? `${sub.name} (${sub.code}) - Sem ${sub.semester}` : "Select a subject...";
                          })()
                        : "Select a subject..."
                      }
                    </span>
                    <ChevronDown size={18} className={`text-zinc-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
                  </div>

                  <AnimatePresence>
                    {dropdownOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl z-50 overflow-hidden"
                      >
                        <div className="max-h-60 overflow-y-auto p-1 custom-scrollbar">
                          {filteredSubjects.length === 0 && (
                             <div className="p-3 text-center text-sm text-zinc-500">No subjects found for this semester.</div>
                          )}
                          {filteredSubjects.map(sub => (
                            <div
                              key={sub.id}
                              onClick={() => {
                                setFormData({ ...formData, subject_id: sub.id });
                                setDropdownOpen(false);
                              }}
                              className={`p-3 rounded-xl flex items-center justify-between cursor-pointer transition-colors ${
                                formData.subject_id === sub.id 
                                  ? "bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800" 
                                  : "hover:bg-zinc-50 dark:hover:bg-zinc-800"
                              }`}
                            >
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold text-zinc-900 dark:text-white">{sub.name}</span>
                                  <span className="px-1.5 py-0.5 text-[9px] font-black bg-indigo-55 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded border border-indigo-100 dark:border-indigo-900/40">
                                    Sem {sub.semester}
                                  </span>
                                </div>
                                <span className="text-[10px] text-zinc-500 uppercase font-black">{sub.code}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                {formData.subject_id === sub.id && <div className="w-2 h-2 bg-teal-500 rounded-full shadow-[0_0_8px_rgba(20,184,166,0.5)]" />}
                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteSubject(e, sub.id)}
                                  className="text-zinc-400 hover:text-red-500 transition-colors p-1"
                                >
                                  {deletingSubjectId === sub.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              ) : (
                <div className="space-y-4">
                  <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 block">
                    Quick Add Subject
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      placeholder="Subject Name"
                      value={newSubjectName}
                      onChange={(e) => setNewSubjectName(e.target.value)}
                      className="flex-1 px-4 py-2 bg-white dark:bg-zinc-950 border border-teal-500 rounded-xl focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                    />
                    <select 
                      value={newSubjectSemester}
                      onChange={(e) => setNewSubjectSemester(e.target.value)}
                      className="w-full sm:w-32 px-4 py-2 bg-white dark:bg-zinc-950 border border-teal-500 rounded-xl focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                        <option key={s} value={s}>Sem {s}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={addingSubject || !newSubjectName.trim()}
                      onClick={async () => {
                        await handleQuickAddSubject();
                        setSubjectMode('select'); // Switch back to select after adding
                      }}
                      className="px-4 py-2 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 disabled:opacity-50 transition-all shadow-sm"
                    >
                      {addingSubject ? <Loader2 className="animate-spin" size={16} /> : "Add"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                Maximum Marks
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.max_marks}
                onChange={(e) => setFormData({ ...formData, max_marks: e.target.value })}
                className="w-full px-4 py-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-mono"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
              Assignment Title
            </label>
            <div className="relative">
              <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <input
                type="text"
                required
                placeholder="e.g. Database Normalization Exercise"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
              Description / Instructions
            </label>
            <textarea
              rows="5"
              placeholder="Provide clear instructions for your students..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4 p-6 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-100 dark:border-zinc-800 rounded-3xl relative">
              <label className="text-sm font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <Calendar size={14} className="text-teal-500" />
                Submission Deadline
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="w-full px-5 py-4 bg-white dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl flex items-center cursor-pointer hover:border-teal-500/50 transition-all font-black text-zinc-900 dark:text-white shadow-sm outline-none focus:border-teal-500/50"
                />
              </div>
            </div>

            <div className="space-y-4 p-6 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-100 dark:border-zinc-800 rounded-3xl">
              <label className="text-sm font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <FileText size={14} className="text-teal-500" />
                Resource Attachment
              </label>
              <div className="relative group cursor-pointer h-[60px]">
                <input
                  type="file"
                  name="assignment_file"
                  onChange={(e) => setFormData({ ...formData, assignment_file: e.target.files[0] })}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="w-full h-full px-5 bg-white dark:bg-zinc-900 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center justify-center gap-3 transition-all group-hover:border-teal-500/50 group-hover:bg-teal-500/5 shadow-sm">
                  <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg group-hover:bg-teal-500 group-hover:text-white transition-colors">
                    <FileText size={18} className="text-zinc-400 group-hover:text-white" />
                  </div>
                  <span className="text-xs font-bold text-zinc-500 group-hover:text-teal-600 truncate max-w-[150px]">
                    {formData.assignment_file ? formData.assignment_file.name : "Attach Instructions"}
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-zinc-400 font-medium">Supported: PDF, PNG, JPG (Max 5MB)</p>
            </div>
          </div>

          <div className="pt-10 flex flex-col md:flex-row items-center justify-between gap-8 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-4 text-zinc-500">
              <div className="w-12 h-12 flex items-center justify-center bg-teal-500/10 rounded-2xl">
                <Info size={24} className="text-teal-500" />
              </div>
              <div>
                <p className="text-sm font-black text-zinc-900 dark:text-white leading-tight">Instant Notification</p>
                <p className="text-xs text-zinc-500">Students will be notified via email & dashboard.</p>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full md:w-auto min-w-[240px] inline-flex items-center justify-center gap-4 px-10 py-5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-2xl font-black transition-all shadow-[0_20px_40px_rgba(20,184,166,0.25)] hover:scale-105 active:scale-95 group"
            >
              {loading ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} className="group-hover:rotate-12 transition-transform" />}
              <span className="uppercase tracking-[0.2em]">{isEdit ? "Update Changes" : "Publish Now"}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
