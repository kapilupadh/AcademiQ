// client/src/pages/teacher/Assignments/AssignmentSubmissions.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Loader2, CheckCircle2, Clock, MessageSquare, Save, User, Image as ImageIcon, FileText } from "lucide-react";
import assignmentService from "../../../services/assignmentService";
import Alert from "../../../components/ui/Alert";
import { motion, AnimatePresence } from "framer-motion";

export default function AssignmentSubmissions() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gradingId, setGradingId] = useState(null);
  const [gradeData, setGradeData] = useState({ marks_obtained: "", feedback: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [assignmentRes, submissionsRes] = await Promise.all([
        assignmentService.getAssignmentDetails(id),
        assignmentService.getAssignmentSubmissions(id)
      ]);
      setAssignment(assignmentRes.data.assignment);
      setSubmissions(submissionsRes.data);
    } catch (err) {
      setError("Failed to load submissions");
    } finally {
      setLoading(false);
    }
  };

  const handleGradeSubmit = async (submissionId) => {
    if (parseFloat(gradeData.marks_obtained) > assignment.max_marks) {
      alert(`Marks obtained cannot exceed maximum marks (${assignment.max_marks})`);
      return;
    }
    if (parseFloat(gradeData.marks_obtained) < 0) {
      alert("Marks obtained cannot be negative");
      return;
    }

    try {
      setSubmitting(true);
      await assignmentService.gradeSubmission(submissionId, gradeData);
      setSubmissions(submissions.map(s => 
        s.id === submissionId ? { ...s, ...gradeData, status: 'GRADED' } : s
      ));
      setGradingId(null);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save grade");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="animate-spin text-teal-600" size={40} />
    </div>
  );

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <button
        onClick={() => navigate("/teacher/assignments")}
        className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors group"
      >
        <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        Back to Assignments
      </button>

      {/* Assignment Summary Card */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-bold text-teal-600 uppercase tracking-widest">{assignment.subject?.name}</span>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">{assignment.title}</h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-2 text-sm max-w-2xl">{assignment.description}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-zinc-500 font-bold uppercase">Max Marks</p>
            <p className="text-3xl font-black text-teal-600 font-mono">{assignment.max_marks}</p>
          </div>
        </div>
      </div>

      {/* Submissions List */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
          Submissions
          <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-full text-xs">
            {submissions.length}
          </span>
        </h2>

        {error && <Alert variant="error">{error}</Alert>}

        {submissions.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {submissions.map((sub) => (
              <div key={sub.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden transition-all">
                <div className="p-5 flex flex-col md:flex-row gap-6">
                  {/* Student Info */}
                  <div className="md:w-1/4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-teal-600">
                      <User size={20} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-zinc-900 dark:text-white truncate">{sub.student?.full_name}</p>
                        {sub.student?.current_semester && (
                          <span className="px-1.5 py-0.5 bg-teal-500/10 text-teal-600 rounded text-[10px] font-black uppercase tracking-tighter">
                            Sem {sub.student.current_semester}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 truncate">{sub.student?.email}</p>
                      {sub.student?.college_roll_number && (
                        <p className="text-[10px] font-bold text-zinc-400 mt-1 uppercase tracking-wider">Roll: {sub.student.college_roll_number}</p>
                      )}
                    </div>
                  </div>

                  {/* Submission Info */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-4 text-xs">
                      <span className={`px-2 py-1 rounded-md font-bold ${
                        sub.status === 'GRADED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        sub.status === 'LATE' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}>
                        {sub.status}
                      </span>
                      <span className="flex items-center gap-1 text-zinc-500">
                        <Clock size={12} />
                        {new Date(sub.submitted_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-lg text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed border border-zinc-100 dark:border-zinc-800">
                      <p className="italic whitespace-pre-wrap">"{sub.submission_content || "No text content provided."}"</p>
                      
                      {sub.file_path && (
                        <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                            {sub.file_path.endsWith('.pdf') ? <FileText size={12} /> : <ImageIcon size={12} />}
                            Attachment
                          </p>
                          
                          {sub.file_path.endsWith('.pdf') ? (
                            <a 
                              href={`http://localhost:5000/public/${sub.file_path}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg border border-red-100 dark:border-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors text-xs font-bold"
                            >
                              <FileText size={16} />
                              View PDF Submission
                            </a>
                          ) : (
                            <a 
                              href={`http://localhost:5000/public/${sub.file_path}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-block relative rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 hover:opacity-90 transition-opacity max-w-[200px]"
                            >
                              <img 
                                src={`http://localhost:5000/public/${sub.file_path}`} 
                                alt="Attachment" 
                                className="w-full h-auto object-cover"
                              />
                              <div className="absolute inset-x-0 bottom-0 py-1 bg-black/50 text-[10px] text-white text-center font-bold">
                                View Full Size
                              </div>
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Grading Actions */}
                  <div className="md:w-1/4 flex flex-col items-end justify-center gap-3">
                    {sub.status === 'GRADED' ? (
                      <div className="text-right">
                        <p className="text-xs text-zinc-500 font-bold uppercase">Grade</p>
                        <p className="text-xl font-bold text-green-600 font-mono">{sub.marks_obtained} / {assignment.max_marks}</p>
                      </div>
                    ) : gradingId === sub.id ? (
                      <div className="w-full space-y-3 bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg border border-teal-500/30">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase text-zinc-500">Marks</label>
                          <input 
                            type="number" 
                            className="w-full px-3 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-md text-sm outline-none focus:ring-1 focus:ring-teal-500"
                            placeholder="Marks"
                            max={assignment.max_marks}
                            min="0"
                            value={gradeData.marks_obtained}
                            onChange={(e) => setGradeData({...gradeData, marks_obtained: e.target.value})}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase text-zinc-500">Feedback</label>
                          <textarea 
                            className="w-full px-3 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-md text-sm outline-none focus:ring-1 focus:ring-teal-500 resize-none"
                            placeholder="Good job!"
                            rows="2"
                            value={gradeData.feedback}
                            onChange={(e) => setGradeData({...gradeData, feedback: e.target.value})}
                          />
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleGradeSubmit(sub.id)}
                            disabled={submitting}
                            className="flex-1 py-1.5 bg-teal-600 text-white rounded-md text-xs font-bold hover:bg-teal-700 transition-all flex items-center justify-center gap-1"
                          >
                            {submitting ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                            Save
                          </button>
                          <button 
                            onClick={() => setGradingId(null)}
                            className="px-3 py-1.5 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-white rounded-md text-xs font-bold"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setGradingId(sub.id);
                          setGradeData({ marks_obtained: "", feedback: "" });
                        }}
                        className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-bold hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/20"
                      >
                        Grade Now
                      </button>
                    )}
                  </div>
                </div>
                
                {sub.status === 'GRADED' && sub.feedback && gradingId !== sub.id && (
                  <div className="px-5 pb-5 pt-0">
                    <div className="flex gap-2 p-3 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-100 dark:border-green-900/30">
                      <MessageSquare size={14} className="text-green-600 shrink-0 mt-0.5" />
                      <p className="text-xs text-green-800 dark:text-green-300"><span className="font-bold">Feedback:</span> {sub.feedback}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800">
            <User size={48} className="mx-auto text-zinc-300 mb-2" />
            <p className="text-zinc-500 font-medium">No submissions yet for this assignment.</p>
          </div>
        )}
      </div>
    </div>
  );
}
