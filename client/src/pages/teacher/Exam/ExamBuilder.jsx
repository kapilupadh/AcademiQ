import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import {
  Plus,
  Trash2,
  ArrowLeft,
  Save,
  Image as ImageIcon,
  X,
  CheckCircle,
  Loader,
  AlertCircle,
} from "lucide-react";

export default function ExamBuilder() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [fetchingExam, setFetchingExam] = useState(isEditMode);
  // uploadStates[qIndex] = 'idle' | 'uploading' | 'success' | 'error'
  const [uploadStates, setUploadStates] = useState({});
  const fileInputRefs = useRef({});

  const [metadata, setMetadata] = useState({
    title: "",
    description: "",
    subject: "",
    type: "Test",
    duration_minutes: 60,
    total_questions_to_ask: 10,
    passing_percentage: 40,
    scheduled_start_at: "",
    scheduled_end_at: "",
  });

  const [questions, setQuestions] = useState([
    {
      question_text: "",
      options: ["", "", "", ""],
      correct_answer: "",
      marks: 1,
      image_url: "",
    },
  ]);

  useEffect(() => {
    if (isEditMode) {
      const fetchExam = async () => {
        setFetchingExam(true);
        try {
          const token = localStorage.getItem("token");
          const res = await axios.get(
            `http://localhost:5000/api/teacher/exams/${id}`,
            { headers: { Authorization: `Bearer ${token}` } },
          );
          const exam = res.data;
          setMetadata({
            title: exam.title,
            description: exam.description || "",
            subject: exam.subject || "",
            type: exam.type,
            duration_minutes: exam.duration_minutes,
            total_questions_to_ask: exam.total_questions_to_ask,
            passing_percentage: exam.passing_percentage,
            // Convert ISO dates to datetime-local format (YYYY-MM-DDTHH:mm)
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
              })),
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

  const setUploadState = (index, state) => {
    setUploadStates((prev) => ({ ...prev, [index]: state }));
  };

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

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question_text: "",
        options: ["", "", "", ""],
        correct_answer: "",
        marks: 1,
        image_url: "",
      },
    ]);
  };

  const handleImageUpload = async (index, file) => {
    if (!file) return;
    setUploadState(index, "uploading");
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("image", file);

      // Do NOT set Content-Type manually — axios auto-sets multipart/form-data with boundary
      const res = await axios.post(
        "http://localhost:5000/api/teacher/upload",
        formData,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      handleQuestionChange(index, "image_url", res.data.imageUrl);
      setUploadState(index, "success");
      // Reset success state after 3s
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
    // Reset file input
    if (fileInputRefs.current[index]) {
      fileInputRefs.current[index].value = "";
    }
  };

  const removeQuestion = (index) => {
    if (questions.length === 1) return;
    const updated = [...questions];
    updated.splice(index, 1);
    setQuestions(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Custom validation: each question needs text OR image
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text.trim() && !q.image_url) {
        alert(`Question ${i + 1} needs either text or an image.`);
        return;
      }
      if (!q.correct_answer) {
        alert(`Question ${i + 1}: Please select a correct answer.`);
        return;
      }
      if (q.options.some((o) => !o.trim())) {
        alert(`Question ${i + 1}: All 4 options must be filled in.`);
        return;
      }
    }

    // Schedule validation (only if one of them is filled)
    const { scheduled_start_at, scheduled_end_at } = metadata;
    if (scheduled_start_at || scheduled_end_at) {
      if (!scheduled_start_at || !scheduled_end_at) {
        alert(
          "Please fill in both Scheduled Start and End time, or leave both empty.",
        );
        return;
      }
      if (new Date(scheduled_start_at) >= new Date(scheduled_end_at)) {
        alert("Scheduled start time must be before end time.");
        return;
      }
      if (new Date(scheduled_start_at) <= new Date()) {
        alert("Scheduled start time must be in the future.");
        return;
      }
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      // 1. Create or Update Exam metadata
      let examId = id;
      if (isEditMode) {
        await axios.put(
          `http://localhost:5000/api/teacher/exams/${id}`,
          metadata,
          { headers },
        );
      } else {
        const examRes = await axios.post(
          "http://localhost:5000/api/teacher/exams",
          metadata,
          { headers },
        );
        examId = examRes.data.exam.id;
      }

      // 2. Save all questions (including image_url)
      await axios.post(
        `http://localhost:5000/api/teacher/exams/${examId}/questions`,
        { questions },
        { headers },
      );

      navigate("/teacher/exams");
    } catch (err) {
      console.error(err);
      alert(
        `Error saving exam: ${err?.response?.data?.message || err.message}`,
      );
    } finally {
      setLoading(false);
    }
  };

  if (fetchingExam) {
    return (
      <div className="p-8 flex items-center justify-center gap-3 text-zinc-500">
        <Loader className="w-5 h-5 animate-spin" />
        Loading exam...
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1000px] mx-auto space-y-8">
      <button
        onClick={() => navigate("/teacher/exams")}
        className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Exams
      </button>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          {isEditMode ? "Edit Exam" : "Create Exam"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8" noValidate>
        {/* Metadata Section */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-4">
            Exam Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                required
                name="title"
                value={metadata.title}
                onChange={handleMetadataChange}
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg outline-none focus:border-blue-500 text-zinc-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Subject
              </label>
              <input
                name="subject"
                value={metadata.subject}
                onChange={handleMetadataChange}
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg outline-none focus:border-blue-500 text-zinc-900 dark:text-white"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={metadata.description}
                onChange={handleMetadataChange}
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg outline-none focus:border-blue-500 text-zinc-900 dark:text-white"
                rows="2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Type
              </label>
              <select
                name="type"
                value={metadata.type}
                onChange={handleMetadataChange}
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg outline-none focus:border-blue-500 text-zinc-900 dark:text-white"
              >
                <option value="Test">Test</option>
                <option value="Sessional 1">Sessional 1</option>
                <option value="Sessional 2">Sessional 2</option>
                <option value="Sessional 3">Sessional 3</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Duration (minutes) <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="number"
                name="duration_minutes"
                value={metadata.duration_minutes}
                onChange={handleMetadataChange}
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg outline-none focus:border-blue-500 text-zinc-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Total Questions to Ask Student{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="number"
                name="total_questions_to_ask"
                value={metadata.total_questions_to_ask}
                onChange={handleMetadataChange}
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg outline-none focus:border-blue-500 text-zinc-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Passing Percentage <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="number"
                name="passing_percentage"
                value={metadata.passing_percentage}
                onChange={handleMetadataChange}
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg outline-none focus:border-blue-500 text-zinc-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Schedule Section */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 space-y-4">
          <div className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
              Schedule{" "}
              <span className="text-sm font-normal text-zinc-400">
                (Optional)
              </span>
            </h2>
            <p className="text-xs text-zinc-500 mt-1">
              Setting a schedule sends an email notification to all enrolled
              students. The exam still requires OTP activation to start.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Scheduled Start Date &amp; Time
              </label>
              <input
                type="datetime-local"
                name="scheduled_start_at"
                value={metadata.scheduled_start_at}
                onChange={handleMetadataChange}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg outline-none focus:border-blue-500 text-zinc-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Scheduled End Date &amp; Time
              </label>
              <input
                type="datetime-local"
                name="scheduled_end_at"
                value={metadata.scheduled_end_at}
                onChange={handleMetadataChange}
                min={
                  metadata.scheduled_start_at ||
                  new Date().toISOString().slice(0, 16)
                }
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg outline-none focus:border-blue-500 text-zinc-900 dark:text-white"
              />
            </div>
          </div>
          {(metadata.scheduled_start_at || metadata.scheduled_end_at) && (
            <div className="flex items-start gap-2 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-3 text-sm text-blue-700 dark:text-blue-400">
              <span className="mt-0.5">📧</span>
              <span>
                Students will receive an email notification when you save{" "}
                {isEditMode && "the updated"} schedule.
              </span>
            </div>
          )}
        </div>

        {/* Questions Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
              Questions ({questions.length})
            </h2>
            <button
              type="button"
              onClick={addQuestion}
              className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              <Plus className="w-4 h-4" /> Add Question
            </button>
          </div>

          {questions.map((q, qIndex) => {
            const uploadState = uploadStates[qIndex] || "idle";
            return (
              <div
                key={qIndex}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 space-y-4 relative"
              >
                {/* Question number header */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                    Question {qIndex + 1}
                  </span>
                  {questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeQuestion(qIndex)}
                      className="flex items-center gap-1 text-xs text-zinc-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" /> Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Question Text + Image Upload */}
                  <div className="md:col-span-3 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                        Question Text
                        {!q.image_url && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                        {q.image_url && (
                          <span className="ml-2 text-xs text-zinc-400 font-normal">
                            (optional when image is attached)
                          </span>
                        )}
                      </label>
                      <textarea
                        value={q.question_text}
                        onChange={(e) =>
                          handleQuestionChange(
                            qIndex,
                            "question_text",
                            e.target.value,
                          )
                        }
                        className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg outline-none focus:border-blue-500 text-zinc-900 dark:text-white"
                        rows="2"
                        placeholder="Enter question text..."
                      />
                    </div>

                    {/* Image Upload Area */}
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                        Question Image{" "}
                        <span className="text-xs text-zinc-400 font-normal">
                          (optional)
                        </span>
                      </label>

                      {q.image_url ? (
                        /* Uploaded state */
                        <div className="flex items-start gap-3">
                          <div className="relative group rounded-xl overflow-hidden border-2 border-emerald-400 dark:border-emerald-600 w-48 flex-shrink-0 shadow-sm">
                            <img
                              src={`http://localhost:5000${q.image_url}`}
                              alt="Question visual"
                              className="w-full h-auto object-cover"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <button
                                type="button"
                                onClick={() => removeImage(qIndex)}
                                className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-3 py-1.5 text-xs font-medium flex items-center gap-1 transition-colors"
                              >
                                <X className="w-3 h-3" /> Remove
                              </button>
                            </div>
                          </div>
                          <div className="flex flex-col gap-1 justify-start pt-1">
                            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                              <CheckCircle className="w-4 h-4" />
                              Image uploaded
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                fileInputRefs.current[qIndex]?.click()
                              }
                              className="text-xs text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 underline text-left"
                            >
                              Replace image
                            </button>
                          </div>
                        </div>
                      ) : uploadState === "uploading" ? (
                        /* Uploading state */
                        <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                          <Loader className="w-5 h-5 animate-spin text-blue-500" />
                          <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
                            Uploading image...
                          </span>
                        </div>
                      ) : uploadState === "error" ? (
                        /* Error state */
                        <div className="flex items-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                          <div>
                            <span className="text-sm font-medium text-red-700 dark:text-red-400">
                              Upload failed
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                fileInputRefs.current[qIndex]?.click()
                              }
                              className="ml-2 text-sm text-red-600 hover:text-red-800 dark:text-red-400 underline"
                            >
                              Try again
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Idle: show upload button */
                        <button
                          type="button"
                          onClick={() => fileInputRefs.current[qIndex]?.click()}
                          className="flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors py-2 px-4 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 w-full justify-center"
                        >
                          <ImageIcon className="w-4 h-4" />
                          Click to upload an image for this question
                        </button>
                      )}

                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={(el) => (fileInputRefs.current[qIndex] = el)}
                        onChange={(e) =>
                          handleImageUpload(qIndex, e.target.files[0])
                        }
                      />
                    </div>
                  </div>

                  {/* Marks */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      Marks <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      type="number"
                      min="1"
                      value={q.marks}
                      onChange={(e) =>
                        handleQuestionChange(qIndex, "marks", e.target.value)
                      }
                      className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg outline-none focus:border-blue-500 text-zinc-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Options */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Options <span className="text-red-500">*</span>
                  </label>
                  {q.options.map((opt, oIndex) => (
                    <div
                      key={oIndex}
                      className="flex gap-2 items-center text-zinc-900 dark:text-white"
                    >
                      <span className="font-semibold w-6 text-center text-zinc-500">
                        {String.fromCharCode(65 + oIndex)}.
                      </span>
                      <input
                        value={opt}
                        onChange={(e) =>
                          handleOptionChange(qIndex, oIndex, e.target.value)
                        }
                        className="flex-1 px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg outline-none focus:border-blue-500"
                        placeholder={`Option ${String.fromCharCode(65 + oIndex)}`}
                      />
                    </div>
                  ))}
                </div>

                {/* Correct Answer */}
                <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4">
                  <label className="block text-sm font-medium mb-1 text-emerald-600 dark:text-emerald-400">
                    Correct Answer <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={q.correct_answer}
                    onChange={(e) =>
                      handleQuestionChange(
                        qIndex,
                        "correct_answer",
                        e.target.value,
                      )
                    }
                    className="w-full md:w-1/2 px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-emerald-200 dark:border-emerald-900/30 rounded-lg outline-none focus:border-emerald-500 text-zinc-900 dark:text-white"
                  >
                    <option value="" disabled>
                      Select the correct option
                    </option>
                    {q.options.map((opt, oIndex) =>
                      opt.trim() !== "" ? (
                        <option key={oIndex} value={opt}>
                          {String.fromCharCode(65 + oIndex)}. {opt}
                        </option>
                      ) : null,
                    )}
                  </select>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-between items-center pt-4">
          <button
            type="button"
            onClick={addQuestion}
            className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 py-2 px-4 border border-blue-200 dark:border-blue-900/30 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Another Question
          </button>

          <button
            disabled={loading}
            type="submit"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />{" "}
                {isEditMode ? "Update Exam" : "Save Exam"}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
