// client/src/pages/teacher/Assignments/CreateAssignment.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Save, Loader2, Calendar, FileText, Info } from "lucide-react";
import assignmentService from "../../../services/assignmentService";
import api from "../../../services/api"; // For fetching subjects
import Alert from "../../../components/ui/Alert";

export default function CreateAssignment() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [subjects, setSubjects] = useState([]);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isEdit) {
        await assignmentService.updateAssignment(id, formData);
      } else {
        await assignmentService.createAssignment(formData);
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
    <div className="p-6 max-w-4xl mx-auto">
      <button
        onClick={() => navigate("/teacher/assignments")}
        className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors mb-6 group"
      >
        <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        Back to Assignments
      </button>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-8 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            {isEdit ? "Edit Assignment" : "Create New Assignment"}
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Fill in the details below to publish an assignment for your students.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && <Alert variant="error">{error}</Alert>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                Subject
              </label>
              <select
                required
                value={formData.subject_id}
                onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                className="w-full px-4 py-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
              >
                <option value="" disabled>Select a subject</option>
                {subjects.map(sub => (
                  <option key={sub.id} value={sub.id}>{sub.name} ({sub.code})</option>
                ))}
              </select>
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

          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
              Due Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <input
                type="date"
                required
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-zinc-500 text-sm">
              <Info size={16} />
              Students will be notified once published.
            </div>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-8 py-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl font-bold transition-all shadow-lg shadow-teal-600/20"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              {isEdit ? "Update Assignment" : "Publish Assignment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
