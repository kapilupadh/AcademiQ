import React, { useState, useEffect, useRef } from "react";
import api from "../../../services/api";
import { useNavigate, useParams } from "react-router-dom";
import {
  Plus, Trash2, ArrowLeft, Save, Image as ImageIcon,
  X, CheckCircle, Loader, AlertCircle, CalendarClock,
  BookOpen, Settings2,
} from "lucide-react";

// ── Reusable: Field Label ─────────────────────────────────────────────────────
function Label({ children, required, hint }) {
  return (
    <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
      {hint && <span className="ml-1.5 font-normal text-zinc-400">{hint}</span>}
    </label>
  );
}

// ── Reusable: Text Input ──────────────────────────────────────────────────────
function Input({ className = "", ...props }) {
  return (
    <input
      {...props}
      className={`w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-zinc-400 dark:focus:border-zinc-600 focus:ring-2 focus:ring-zinc-200 dark:focus:ring-zinc-800 transition-all ${className}`}
    />
  );
}

// ── Reusable: Select ──────────────────────────────────────────────────────────
function Select({ className = "", children, ...props }) {
  return (
    <select
      {...props}
      className={`w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 outline-none focus:border-zinc-400 dark:focus:border-zinc-600 focus:ring-2 focus:ring-zinc-200 dark:focus:ring-zinc-800 transition-all ${className}`}
    >
      {children}
    </select>
  );
}

// ── Reusable: Textarea ────────────────────────────────────────────────────────
function Textarea({ className = "", ...props }) {
  return (
    <textarea
      {...props}
      className={`w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-zinc-400 dark:focus:border-zinc-600 focus:ring-2 focus:ring-zinc-200 dark:focus:ring-zinc-800 transition-all resize-none ${className}`}
    />
  );
}

// ── Reusable: Section Card ────────────────────────────────────────────────────
function SectionCard({ icon: Icon, title, subtitle, children }) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-start gap-3">
        <div className="mt-0.5 p-1.5 rounded-md bg-zinc-100 dark:bg-zinc-800">
          <Icon className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
          {subtitle && <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// ── Skeleton loader ───────────────────────────────────────────────────────────
function SkeletonBuilder() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 px-6 py-8 max-w-[1000px] mx-auto space-y-5 animate-pulse">
      <div className="h-3.5 w-24 rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="h-5 w-40 rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-4">
        <div className="h-4 w-32 rounded bg-zinc-100 dark:bg-zinc-800" />
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-9 rounded-lg bg-zinc-100 dark:bg-zinc-800" />
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-4">
        <div className="h-4 w-28 rounded bg-zinc-100 dark:bg-zinc-800" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-9 rounded-lg bg-zinc-100 dark:bg-zinc-800" />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ExamBuilder() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [fetchingExam, setFetchingExam] = useState(isEditMode);
  const [uploadStates, setUploadStates] = useState({});
  const fileInputRefs = useRef({});
  const [departments, setDepartments] = useState([]);

  const [metadata, setMetadata] = useState({
    title: "",
    description: "",
    subject: "",
    department_id: "",
    semester: "",
    type: "Test",
    duration_minutes: 60,
    total_questions_to_ask: 10,
    passing_percentage: 40,
    scheduled_start_at: "",
    scheduled_end_at: "",
  });

  const [questions, setQuestions] = useState([
    { question_text: "", options: ["", "", "", ""], correct_answer: "", marks: 1, image_url: "" },
  ]);

  useEffect(() => {
    api
      .get("/teacher/departments", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      .then((r) => {
        setDepartments(r.data);
        if (r.data.length === 1 && !isEditMode) {
          setMetadata((prev) => ({ ...prev, department_id: r.data[0].id }));
        }
      })
      .catch((err) => console.error("Failed to fetch departments", err));
  }, [isEditMode]);

  useEffect(() => {
    if (isEditMode) {
      const fetchExam = async () => {
        setFetchingExam(true);
        try {
          const token = localStorage.getItem("token");
          const res = await api.get(`/teacher/exams/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const exam = res.data;
          setMetadata({
            title: exam.title,
            description: exam.description || "",
            subject: exam.subject || "",
            department_id: exam.department_id || "",
            semester: exam.semester || "",
            type: exam.type,
            duration_minutes: exam.duration_minutes,
            total_questions_to_ask: exam.total_questions_to_ask,
            passing_percentage: exam.passing_percentage,
            scheduled_start_at: exam.scheduled_start_at
              ? new Date(exam.scheduled_start_at).toISOString().slice(0, 16)
              : "",
            scheduled_end_at: exam.scheduled_end_at
              ? new Date(exam.scheduled_end_at).toISOString().slice(0, 16)
              : "",
          });
          if (exam.questions && exam.questions.length > 0) {
            setQuestions(
              exam.questions.map((q) => ({
                question_text: q.question_text,
                options: q.options,
                correct_answer: q.correct_answer,
                marks: q.marks,
                image_url: q.image_url || "",
              }))
            );
          }
        } catch (err) {
          console.error("Failed to fetch exam", err);
        } finally {
          setFetchingExam(false);
        }
      };
      fetchExam();
    }
  }, [id, isEditMode]);

  const setUploadState = (index, state) =>
    setUploadStates((prev) => ({ ...prev, [index]: state }));

  const handleMetadataChange = (e) => {
    const { name, value } = e.target;
    setMetadata((prev) => ({ ...prev, [name]: value }));
  };

  const handleQuestionChange = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = value;
    setQuestions(updated);
  };

  const handleOptionChange = (qIndex, oIndex, value) => {
    const updated = [...questions];
    updated[qIndex].options[oIndex] = value;
    setQuestions(updated);
  };

  const addQuestion = () =>
    setQuestions([...questions, { question_text: "", options: ["", "", "", ""], correct_answer: "", marks: 1, image_url: "" }]);

  const removeQuestion = (index) => {
    if (questions.length === 1) return;
    const updated = [...questions];
    updated.splice(index, 1);
    setQuestions(updated);
  };

  const handleImageUpload = async (index, file) => {
    if (!file) return;
    setUploadState(index, "uploading");
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("image", file);
      const res = await api.post(`/teacher/upload`, formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });
      handleQuestionChange(index, "image_url", res.data.imageUrl);
      setUploadState(index, "success");
      setTimeout(() => setUploadState(index, "idle"), 3000);
    } catch (err) {
      console.error("Image upload failed", err?.response?.data || err.message);
      setUploadState(index, "error");
      setTimeout(() => setUploadState(index, "idle"), 4000);
    }
  };

  const removeImage = (index) => {
    handleQuestionChange(index, "image_url", "");
    setUploadState(index, "idle");
    if (fileInputRefs.current[index]) fileInputRefs.current[index].value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!metadata.department_id) { alert("Please select a Department."); return; }
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text.trim() && !q.image_url) { alert(`Question ${i + 1} needs either text or an image.`); return; }
      if (!q.correct_answer) { alert(`Question ${i + 1}: Please select a correct answer.`); return; }
      if (q.options.some((o) => !o.trim())) { alert(`Question ${i + 1}: All 4 options must be filled in.`); return; }
    }
    const { scheduled_start_at, scheduled_end_at } = metadata;
    if (scheduled_start_at || scheduled_end_at) {
      if (!scheduled_start_at || !scheduled_end_at) { alert("Please fill in both Scheduled Start and End time, or leave both empty."); return; }
      if (new Date(scheduled_start_at) >= new Date(scheduled_end_at)) { alert("Scheduled start time must be before end time."); return; }
      if (new Date(scheduled_start_at) <= new Date()) { alert("Scheduled start time must be in the future."); return; }
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      let examId = id;
      if (isEditMode) {
        await api.put(`/teacher/exams/${id}`, metadata, { headers });
      } else {
        const examRes = await api.post(`/teacher/exams`, metadata, { headers });
        examId = examRes.data.exam.id;
      }
      await api.post(`/teacher/exams/${examId}/questions`, { questions }, { headers });
      navigate("/teacher/exams");
    } catch (err) {
      console.error(err);
      alert(`Error saving exam: ${err?.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (fetchingExam) return <SkeletonBuilder />;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-[1000px] mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} noValidate className="space-y-5">

          {/* Top bar */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate("/teacher/exams")}
              className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Exams
            </button>
            <h1 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
              {isEditMode ? "Edit Exam" : "Create Exam"}
            </h1>
            {/* Spacer to center the title */}
            <div className="w-20" />
          </div>

          {/* Thin separator */}
          <div className="h-px bg-zinc-200 dark:bg-zinc-800" />

          {/* ── Exam Details ── */}
          <SectionCard icon={Settings2} title="Exam Details">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label required>Title</Label>
                <Input required name="title" value={metadata.title} onChange={handleMetadataChange} placeholder="e.g. Mid-Term Test" />
              </div>

              <div>
                <Label required>Department</Label>
                <Select name="department_id" value={metadata.department_id} onChange={handleMetadataChange} required>
                  <option value="">Select department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </Select>
              </div>

              <div>
                <Label>Semester</Label>
                <Select name="semester" value={metadata.semester} onChange={handleMetadataChange}>
                  <option value="">Select semester</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <option key={s} value={s}>Semester {s}</option>
                  ))}
                </Select>
              </div>

              <div>
                <Label>Subject</Label>
                <Input name="subject" value={metadata.subject} onChange={handleMetadataChange} placeholder="e.g. Data Structures" />
              </div>

              <div className="md:col-span-2">
                <Label>Description</Label>
                <Textarea name="description" value={metadata.description} onChange={handleMetadataChange} rows={2} placeholder="Brief description of this exam..." />
              </div>

              <div>
                <Label>Type</Label>
                <Select name="type" value={metadata.type} onChange={handleMetadataChange}>
                  <option value="Test">Test</option>
                  <option value="Sessional 1">Sessional 1</option>
                  <option value="Sessional 2">Sessional 2</option>
                  <option value="Sessional 3">Sessional 3</option>
                </Select>
              </div>

              <div>
                <Label required>Duration (minutes)</Label>
                <Input required type="number" name="duration_minutes" value={metadata.duration_minutes} onChange={handleMetadataChange} />
              </div>

              <div>
                <Label required>Questions to Ask Student</Label>
                <Input required type="number" name="total_questions_to_ask" value={metadata.total_questions_to_ask} onChange={handleMetadataChange} />
              </div>

              <div>
                <Label required>Passing Percentage</Label>
                <Input required type="number" name="passing_percentage" value={metadata.passing_percentage} onChange={handleMetadataChange} />
              </div>
            </div>
          </SectionCard>

          {/* ── Schedule ── */}
          <SectionCard
            icon={CalendarClock}
            title="Schedule"
            subtitle="Optional — leave blank to manage manually. Setting a schedule notifies enrolled students."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Start Date &amp; Time</Label>
                <Input
                  type="datetime-local"
                  name="scheduled_start_at"
                  value={metadata.scheduled_start_at}
                  onChange={handleMetadataChange}
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
              <div>
                <Label>End Date &amp; Time</Label>
                <Input
                  type="datetime-local"
                  name="scheduled_end_at"
                  value={metadata.scheduled_end_at}
                  onChange={handleMetadataChange}
                  min={metadata.scheduled_start_at || new Date().toISOString().slice(0, 16)}
                />
              </div>
            </div>

            {(metadata.scheduled_start_at || metadata.scheduled_end_at) && (
              <div className="mt-4 flex items-start gap-2.5 bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-lg px-4 py-3">
                <span className="text-sm mt-px">📧</span>
                <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
                  Students will receive an email notification when you save{isEditMode && " the updated"} schedule.
                </p>
              </div>
            )}
          </SectionCard>

          {/* ── Questions ── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-zinc-400" />
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Questions
                  <span className="ml-1.5 text-xs font-normal text-zinc-400">({questions.length})</span>
                </h2>
              </div>
              <button
                type="button"
                onClick={addQuestion}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Question
              </button>
            </div>

            {questions.map((q, qIndex) => {
              const uploadState = uploadStates[qIndex] || "idle";
              return (
                <div
                  key={qIndex}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden"
                >
                  {/* Question header */}
                  <div className="flex items-center justify-between px-5 py-3 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800">
                    <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      Question {qIndex + 1}
                    </span>
                    {questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeQuestion(qIndex)}
                        className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="p-5 space-y-4">
                    {/* Question text + marks */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="md:col-span-3 space-y-3">
                        <div>
                          <Label required={!q.image_url} hint={q.image_url ? "(optional with image)" : undefined}>
                            Question Text
                          </Label>
                          <Textarea
                            value={q.question_text}
                            onChange={(e) => handleQuestionChange(qIndex, "question_text", e.target.value)}
                            rows={2}
                            placeholder="Enter question text..."
                          />
                        </div>

                        {/* Image upload */}
                        <div>
                          <Label hint="(optional)">Question Image</Label>

                          {q.image_url ? (
                            <div className="flex items-start gap-3">
                              <div className="relative group rounded-lg overflow-hidden border border-emerald-300 dark:border-emerald-700 w-40 shrink-0">
                                <img
                                  src={`${(process.env.REACT_APP_API_URL || "http://localhost:5000/api").replace("/api", "")}${q.image_url}`}
                                  alt="Question visual"
                                  className="w-full h-auto object-cover"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                  <button
                                    type="button"
                                    onClick={() => removeImage(qIndex)}
                                    className="bg-red-600 hover:bg-red-700 text-white rounded-md px-2.5 py-1 text-xs font-medium flex items-center gap-1"
                                  >
                                    <X className="w-3 h-3" /> Remove
                                  </button>
                                </div>
                              </div>
                              <div className="pt-1 space-y-1.5">
                                <div className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  Uploaded
                                </div>
                                <button
                                  type="button"
                                  onClick={() => fileInputRefs.current[qIndex]?.click()}
                                  className="block text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 underline underline-offset-2 transition-colors"
                                >
                                  Replace image
                                </button>
                              </div>
                            </div>
                          ) : uploadState === "uploading" ? (
                            <div className="flex items-center gap-2.5 px-4 py-3 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-lg">
                              <Loader className="w-4 h-4 animate-spin text-blue-500 shrink-0" />
                              <span className="text-xs font-medium text-blue-700 dark:text-blue-400">Uploading...</span>
                            </div>
                          ) : uploadState === "error" ? (
                            <div className="flex items-center gap-2.5 px-4 py-3 bg-red-50/60 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-lg">
                              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                              <span className="text-xs font-medium text-red-600 dark:text-red-400">Upload failed —</span>
                              <button
                                type="button"
                                onClick={() => fileInputRefs.current[qIndex]?.click()}
                                className="text-xs text-red-600 dark:text-red-400 underline underline-offset-2"
                              >
                                Try again
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => fileInputRefs.current[qIndex]?.click()}
                              className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg hover:border-zinc-400 dark:hover:border-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all"
                            >
                              <ImageIcon className="w-3.5 h-3.5" />
                              Attach image
                            </button>
                          )}

                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            ref={(el) => (fileInputRefs.current[qIndex] = el)}
                            onChange={(e) => handleImageUpload(qIndex, e.target.files[0])}
                          />
                        </div>
                      </div>

                      {/* Marks */}
                      <div>
                        <Label required>Marks</Label>
                        <Input
                          required
                          type="number"
                          min="1"
                          value={q.marks}
                          onChange={(e) => handleQuestionChange(qIndex, "marks", e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Options */}
                    <div>
                      <Label required>Options</Label>
                      <div className="space-y-2">
                        {q.options.map((opt, oIndex) => (
                          <div key={oIndex} className="flex items-center gap-2.5">
                            <span className="w-5 text-center text-xs font-semibold text-zinc-400 shrink-0">
                              {String.fromCharCode(65 + oIndex)}
                            </span>
                            <Input
                              value={opt}
                              onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                              placeholder={`Option ${String.fromCharCode(65 + oIndex)}`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Correct answer */}
                    <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
                      <Label required>
                        <span className="text-emerald-600 dark:text-emerald-400">Correct Answer</span>
                      </Label>
                      <Select
                        value={q.correct_answer}
                        onChange={(e) => handleQuestionChange(qIndex, "correct_answer", e.target.value)}
                        className="md:w-1/2 border-emerald-200 dark:border-emerald-900/40 focus:border-emerald-400 dark:focus:border-emerald-700 focus:ring-emerald-100 dark:focus:ring-emerald-950"
                      >
                        <option value="" disabled>Select correct option</option>
                        {q.options.map((opt, oIndex) =>
                          opt.trim() !== "" ? (
                            <option key={oIndex} value={opt}>
                              {String.fromCharCode(65 + oIndex)}. {opt}
                            </option>
                          ) : null
                        )}
                      </Select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Bottom action bar ── */}
          <div className="flex items-center justify-between pt-2 pb-8">
            <button
              type="button"
              onClick={addQuestion}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 px-4 py-2 rounded-lg transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Another Question
            </button>

            <button
              disabled={loading}
              type="submit"
              className="inline-flex items-center gap-2 bg-zinc-900 dark:bg-white hover:opacity-90 disabled:opacity-50 text-white dark:text-zinc-900 text-sm font-medium px-5 py-2.5 rounded-lg transition-opacity shadow-sm"
            >
              {loading ? (
                <><Loader className="w-4 h-4 animate-spin" /> Saving...</>
              ) : (
                <><Save className="w-4 h-4" /> {isEditMode ? "Update Exam" : "Save Exam"}</>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}