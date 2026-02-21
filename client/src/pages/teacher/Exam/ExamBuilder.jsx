import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, ArrowLeft, Save } from "lucide-react";

export default function ExamBuilder() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [metadata, setMetadata] = useState({
    title: "",
    description: "",
    subject: "",
    type: "Test",
    duration_minutes: 60,
    total_questions_to_ask: 10,
    passing_percentage: 40,
  });

  const [questions, setQuestions] = useState([
    {
      question_text: "",
      options: ["", "", "", ""],
      correct_answer: "",
      marks: 1,
    },
  ]);

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
      },
    ]);
  };

  const removeQuestion = (index) => {
    if (questions.length === 1) return;
    const updated = [...questions];
    updated.splice(index, 1);
    setQuestions(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      // 1. Create Exam
      const examRes = await axios.post(
        "http://localhost:5000/api/teacher/exams",
        metadata,
        { headers },
      );
      const examId = examRes.data.exam.id;

      // 2. Add Questions
      await axios.post(
        `http://localhost:5000/api/teacher/exams/${examId}/questions`,
        { questions },
        { headers },
      );

      navigate("/teacher/exams");
    } catch (err) {
      console.error(err);
      alert("Error saving exam.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-[1000px] mx-auto space-y-8">
      <button
        onClick={() => navigate("/teacher/exams")}
        className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Exams
      </button>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Metadata Section */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-4">
            Exam Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Title
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
                Duration (minutes)
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
                Total Questions to Ask Student
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
                Passing Percentage
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

        {/* Questions Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
              Questions (MCQ)
            </h2>
            <button
              type="button"
              onClick={addQuestion}
              className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              <Plus className="w-4 h-4" /> Add Question
            </button>
          </div>

          {questions.map((q, qIndex) => (
            <div
              key={qIndex}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 space-y-4 relative"
            >
              {questions.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeQuestion(qIndex)}
                  className="absolute top-4 right-4 text-zinc-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Question {qIndex + 1}
                  </label>
                  <textarea
                    required
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
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Marks
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

              <div className="space-y-2">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Options
                </label>
                {q.options.map((opt, oIndex) => (
                  <div
                    key={oIndex}
                    className="flex gap-2 items-center text-zinc-900 dark:text-white"
                  >
                    <span className="font-semibold w-6 text-center">
                      {String.fromCharCode(65 + oIndex)}.
                    </span>
                    <input
                      required
                      value={opt}
                      onChange={(e) =>
                        handleOptionChange(qIndex, oIndex, e.target.value)
                      }
                      className="flex-1 px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg outline-none focus:border-blue-500"
                      placeholder={`Option ${oIndex + 1}`}
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1 mt-4 border-t border-zinc-100 dark:border-zinc-800 pt-4 text-emerald-600 dark:text-emerald-400">
                  Correct Answer
                </label>
                <select
                  required
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
                        {opt}
                      </option>
                    ) : null,
                  )}
                </select>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-4">
          <button
            disabled={loading}
            type="submit"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
          >
            {loading ? (
              "Saving..."
            ) : (
              <>
                <Save className="w-5 h-5" /> Save Exam
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
