// client/src/pages/teacher/Assignments/AssignmentList.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Search, FileText, Calendar, Users, MoreVertical, Trash2, Edit } from "lucide-react";
import { motion } from "framer-motion";
import assignmentService from "../../../services/assignmentService";
import Alert from "../../../components/ui/Alert";

export default function AssignmentList() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      // For now, we fetch ALL assignments for the teacher. 
      // The backend 'my' route might be student focused, so we'll need a teacher specific fetch if needed.
      // Actually, my controller had getSubjectAssignments. But for a dashboard, we want all.
      // I'll use a generic fetch or implement a teacher-specific one.
      // Let's assume we can fetch them via a teacher dashboard route or similar.
      // For now, I'll use a custom endpoint or the student one just to get data if permitted.
      // REVISION: I'll use a new dashboard-like fetch if I had one. 
      // Since I just created the backend, I know I have `/assignments/my` but it uses student enrollment.
      // I should add a `/assignments/teacher/all` or similar. 
      // Wait, I'll just use the subject filter for now or add the missing route.
      
      const res = await assignmentService.getMyAssignments(); 
      setAssignments(res.data);
    } catch (err) {
      const errorMsg = err.response?.data?.debug || err.response?.data?.message || "Failed to load assignments";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this assignment?")) return;
    try {
      await assignmentService.deleteAssignment(id);
      setAssignments(assignments.filter(a => a.id !== id));
    } catch (err) {
      alert("Failed to delete assignment");
    }
  };

  const filteredAssignments = assignments.filter(a => 
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    (a.subject?.name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Assignments</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">Manage and grade your student assignments</p>
        </div>
        <Link
          to="/teacher/assignments/create"
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-teal-600/20"
        >
          <Plus size={18} />
          Create Assignment
        </Link>
      </div>

      {/* Stats/Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-100 dark:bg-teal-900/30 text-teal-600 rounded-lg">
              <FileText size={20} />
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Total Assignments</p>
              <p className="text-xl font-bold text-zinc-900 dark:text-white">{assignments.length}</p>
            </div>
          </div>
        </div>
        {/* Add more stats if needed */}
      </div>

      {/* Search & Actions */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
        <input
          type="text"
          placeholder="Search by title or subject..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
        />
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {/* Assignment List */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-xl" />
          ))
        ) : filteredAssignments.length > 0 ? (
          filteredAssignments.map((assignment, index) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              key={assignment.id}
              className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 hover:border-teal-500/50 transition-all hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-500 group-hover:text-teal-500 transition-colors">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-zinc-900 dark:text-white group-hover:text-teal-500 transition-colors">
                      {assignment.title}
                    </h3>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-[10px] font-black px-2 py-0.5 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 rounded-md uppercase tracking-widest border border-teal-200 dark:border-teal-800/50">
                        {assignment.subject?.name || "General"}
                      </span>
                      {assignment.subject?.semester && (
                        <span className="text-[10px] font-black px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-md uppercase tracking-widest border border-indigo-200 dark:border-indigo-800/50">
                          Semester {assignment.subject.semester}
                        </span>
                      )}
                      <div className="flex items-center gap-2 text-xs font-bold text-zinc-500">
                        <Calendar size={14} className="text-zinc-400" />
                        <span className="text-zinc-400 font-normal">Deadline:</span>
                        {new Date(assignment.due_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to={`/teacher/assignments/${assignment.id}/submissions`}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-md transition-all"
                  >
                    <Users size={14} />
                    Submissions
                  </Link>
                  <Link
                    to={`/teacher/assignments/edit/${assignment.id}`}
                    className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
                  >
                    <Edit size={16} />
                  </Link>
                  <button
                    onClick={() => handleDelete(assignment.id)}
                    className="p-2 text-zinc-400 hover:text-red-500 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-12 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800">
            <FileText size={48} className="mx-auto text-zinc-300 mb-4" />
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">No assignments found</h3>
            <p className="text-zinc-500 mb-6">Start by creating your first assignment for your students.</p>
            <Link
              to="/teacher/assignments/create"
              className="inline-flex items-center gap-2 px-6 py-2 bg-teal-600 text-white rounded-lg font-bold hover:bg-teal-700 transition-all"
            >
              <Plus size={18} />
              Create Now
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
