// client/src/pages/student/Assignments/AssignmentList.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FileText, Calendar, CheckCircle2, Clock, AlertCircle, ChevronRight, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import assignmentService from "../../../services/assignmentService";
import Alert from "../../../components/ui/Alert";

export default function StudentAssignmentList() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const res = await assignmentService.getMyAssignments();
      setAssignments(res.data);
    } catch (err) {
      setError("Failed to load assignments");
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (assignment) => {
    const submission = assignment.AssignmentSubmissions?.[0];
    if (submission?.status === 'GRADED') {
      return { label: 'Graded', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle2 };
    }
    if (submission) {
      return { label: 'Submitted', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: CheckCircle2 };
    }
    const isOverdue = new Date(assignment.due_date) < new Date();
    if (isOverdue) {
      return { label: 'Overdue', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: AlertCircle };
    }
    return { label: 'Not Started', color: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400', icon: Clock };
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="animate-spin text-indigo-600" size={40} />
    </div>
  );

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">Your Assignments</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">Track your progress and submit your coursework.</p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {/* Assignment Grid */}
      <div className="grid grid-cols-1 gap-4">
        {assignments.length > 0 ? (
          assignments.map((assignment, index) => {
            const status = getStatusInfo(assignment);
            const submission = assignment.AssignmentSubmissions?.[0];
            const StatusIcon = status.icon;

            return (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                key={assignment.id}
              >
                <Link
                  to={`/student/assignments/${assignment.id}`}
                  className="group block bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 hover:border-indigo-500/50 transition-all hover:shadow-xl hover:-translate-y-1"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex gap-4">
                      <div className="w-14 h-14 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl flex items-center justify-center text-zinc-400 group-hover:text-indigo-500 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20 transition-all">
                        <FileText size={28} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase font-black tracking-widest text-indigo-500 px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/20 w-fit rounded-md">
                          {assignment.subject?.name}
                        </p>
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {assignment.title}
                        </h3>
                        <div className="flex items-center gap-4 text-xs text-zinc-500">
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            Due: {new Date(assignment.due_date).toLocaleDateString()}
                          </span>
                          {submission?.submitted_at && (
                            <span className="flex items-center gap-1 text-zinc-400">
                              <CheckCircle2 size={14} className="text-green-500" />
                              Submitted: {new Date(submission.submitted_at).toLocaleDateString()}
                            </span>
                          )}
                          {submission?.marks_obtained !== undefined && (
                            <span className="flex items-center gap-1 font-bold text-green-600">
                              Grade: {submission.marks_obtained} / {assignment.max_marks}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-none pt-4 md:pt-0 border-zinc-100 dark:border-zinc-800">
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${status.color}`}>
                        <StatusIcon size={14} />
                        {status.label}
                      </div>
                      <ChevronRight className="text-zinc-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })
        ) : (
          <div className="text-center py-20 bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-800">
            <FileText size={64} className="mx-auto text-zinc-200 mb-4" />
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white">No Assignments Found</h3>
            <p className="text-zinc-500">You don't have any assignments assigned to you yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
