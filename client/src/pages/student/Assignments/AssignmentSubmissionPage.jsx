// client/src/pages/student/Assignments/AssignmentSubmissionPage.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Loader2, Send, Calendar, FileText, CheckCircle2, MessageSquare, AlertCircle, Image as ImageIcon, X } from "lucide-react";
import assignmentService from "../../../services/assignmentService";
import Alert from "../../../components/ui/Alert";
import { motion } from "framer-motion";

export default function AssignmentSubmissionPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [assignment, setAssignment] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [content, setContent] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await assignmentService.getAssignmentDetails(id);
      setAssignment(res.data.assignment);
      setSubmission(res.data.submission);
      if (res.data.submission) {
        setContent(res.data.submission.submission_content || "");
      }
    } catch (err) {
      setError("Failed to load assignment details");
    } finally {
      setLoading(false);
    }
  };

  const onFileChange = (e) => {
    const file = e.target.files[0];
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    
    if (file && allowedTypes.includes(file.type)) {
      setSelectedFile(file);
      if (file.type.startsWith('image/')) {
        setPreviewUrl(URL.createObjectURL(file));
      } else {
        setPreviewUrl('pdf'); // Signal to show PDF icon
      }
    } else {
      setError("Please select a valid JPG, PNG or PDF file");
      setSelectedFile(null);
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !selectedFile) return;

    try {
      setSubmitting(true);
      setError("");

      const formData = new FormData();
      formData.append('submission_content', content);
      if (selectedFile) {
        formData.append('submission_image', selectedFile);
      }

      const res = await assignmentService.submitAssignment(id, formData);
      setSubmission(res.data.submission);
      setSelectedFile(null);
      setPreviewUrl(null);
      setSuccess("Assignment submitted successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit assignment");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="animate-spin text-indigo-600" size={40} />
    </div>
  );

  const isOverdue = new Date(assignment.due_date) < new Date();
  const isGraded = submission?.status === 'GRADED';

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <button
        onClick={() => navigate("/student/assignments")}
        className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors group"
      >
        <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        Back to Assignments
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-sm space-y-6">
            <div>
              <p className="text-xs font-black text-indigo-500 uppercase tracking-widest">{assignment.subject?.name}</p>
              <h1 className="text-3xl font-black text-zinc-900 dark:text-white mt-1 leading-tight">{assignment.title}</h1>
            </div>

            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 text-zinc-500 text-sm bg-zinc-50 dark:bg-zinc-800/50 px-3 py-1.5 rounded-lg border border-zinc-100 dark:border-zinc-800">
                <Calendar size={16} />
                <span>Due: {new Date(assignment.due_date).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-500 text-sm bg-zinc-50 dark:bg-zinc-800/50 px-3 py-1.5 rounded-lg border border-zinc-100 dark:border-zinc-800">
                <FileText size={16} />
                <span>Max Marks: {assignment.max_marks}</span>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Info className="text-indigo-500" size={18} />
                Instructions
              </h3>
              <div className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed whitespace-pre-wrap bg-indigo-50/30 dark:bg-indigo-900/10 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                {assignment.description || "No specific instructions provided."}
              </div>
            </div>

            {assignment.file_url && (
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800 flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <FileText size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-900 dark:text-white">Assignment Attachment</p>
                    <p className="text-xs text-zinc-500">Resource provided by teacher</p>
                  </div>
                </div>
                <a 
                  href={`http://localhost:5000/public/${assignment.file_url}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all shadow-sm"
                >
                  Download / View
                </a>
              </div>
            )}
          </div>

          {/* Submission Form or Locked View */}
          {!isGraded && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-sm space-y-6">
              {submission ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-6 bg-green-50 dark:bg-green-900/10 border-2 border-green-200 dark:border-green-800 rounded-2xl">
                    <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-green-500/20">
                      <CheckCircle2 size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-green-700 dark:text-green-400">Submission Confirmed</h3>
                      <p className="text-xs text-green-600/70 font-medium">Your assignment has been safely received and locked for grading.</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Your Submitted Response</h4>
                    <div className="p-5 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap italic">
                      "{content}"
                    </div>
                  </div>

                  {submission.file_path && (
                    <div className="space-y-3">
                       <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Attached File</h4>
                       <div className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl">
                          <FileText className="text-red-500" size={18} />
                          <a 
                            href={`http://localhost:5000/public/${submission.file_path}`} 
                            target="_blank" rel="noopener noreferrer"
                            className="text-xs font-bold text-indigo-600 hover:underline"
                          >
                            View Submitted Attachment
                          </a>
                       </div>
                    </div>
                  )}

                  <div className="pt-4 flex items-center gap-2 text-zinc-400 text-[10px] font-bold italic">
                    <AlertCircle size={12} />
                    Submitted on {new Date(submission.submitted_at).toLocaleString()}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && <Alert variant="error">{error}</Alert>}
                  {success && <Alert variant="success">{success}</Alert>}
                  
                  {isOverdue && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-xs border border-red-100 dark:border-red-900/30">
                      <AlertCircle size={14} />
                      This assignment is past its due date. Submissions will be marked as LATE.
                    </div>
                  )}

                  <textarea
                    className="w-full px-4 py-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none min-h-[150px]"
                    placeholder="Type your response or paste a link here..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    disabled={submitting}
                  />

                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg cursor-pointer transition-colors text-sm font-bold border border-zinc-200 dark:border-zinc-700">
                        <ImageIcon size={18} />
                        {selectedFile ? "Change File" : "Attach Image/PDF"}
                        <input type="file" accept="image/*,application/pdf" className="hidden" onChange={onFileChange} disabled={submitting} />
                      </label>
                      {selectedFile && (
                        <span className="text-xs text-zinc-500 truncate max-w-[200px]">
                          {selectedFile.name}
                        </span>
                      )}
                    </div>

                    {previewUrl && (
                      <div className="relative w-full max-w-sm rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 group bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center p-4">
                        {previewUrl === 'pdf' ? (
                          <div className="flex flex-col items-center gap-2 py-8">
                            <FileText size={48} className="text-red-500" />
                            <span className="text-xs font-bold text-zinc-500">{selectedFile.name}</span>
                          </div>
                        ) : (
                          <img src={previewUrl} alt="Preview" className="w-full h-auto" />
                        )}
                        <button 
                          type="button"
                          onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      type="submit"
                      disabled={submitting || !content.trim()}
                      className="inline-flex items-center gap-2 px-10 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/20 hover:scale-[1.02] active:scale-95"
                    >
                      {submitting ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                      Submit Assignment
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Status Column */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-4">Submission Status</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-500">Status</span>
                <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-tighter ${
                  submission?.status === 'GRADED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                  submission ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                  'bg-zinc-100 text-zinc-500 dark:bg-zinc-800'
                }`}>
                  {submission ? submission.status : "Pending"}
                </span>
              </div>

              {submission && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-500">Submitted At</span>
                  <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300">
                    {new Date(submission.submitted_at).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {isGraded && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-green-50 dark:bg-green-950/30 border-2 border-green-200 dark:border-green-900/50 rounded-2xl p-6 space-y-4"
            >
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-black uppercase tracking-widest text-[10px]">
                <CheckCircle2 size={16} />
                Grading Complete
              </div>
              
              <div className="text-center py-4">
                <p className="text-4xl font-black text-green-600 font-mono">
                  {submission.marks_obtained}
                  <span className="text-xl text-green-400 font-medium">/{assignment.max_marks}</span>
                </p>
                <p className="text-xs text-green-600/60 font-bold uppercase mt-1">Final Score</p>
              </div>

              {submission.feedback && (
                <div className="bg-white dark:bg-zinc-900/50 p-4 rounded-xl border border-green-100 dark:border-green-900/30 space-y-2">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                    <MessageSquare size={12} />
                    Teacher Feedback
                  </p>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300 italic leading-relaxed">
                    "{submission.feedback}"
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {isGraded && (
             <div className="bg-zinc-100 dark:bg-zinc-800/50 rounded-xl p-4 space-y-2">
                <h4 className="text-xs font-bold text-zinc-900 dark:text-white">Your Submitted Content</h4>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 whitespace-pre-wrap">
                  {submission.submission_content}
                </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Missing import mock
const Info = ({ className, size }) => <AlertCircle className={className} size={size} />;
