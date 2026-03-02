import React, { useState, useEffect } from "react";
import api from "../../../services/api";
import {
  Search,
  Filter,
  Check,
  ChevronsUpDown,
  Plus,
  FileText,
  User,
  Calendar,
  X,
  Download,
} from "lucide-react";

export default function QuestionBank() {
  const [activeTab, setActiveTab] = useState("repository");
  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const [repository, setRepository] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  // New states for filtering and viewing
  const [selectedSubject, setSelectedSubject] = useState("All");
  const [selectedExamForView, setSelectedExamForView] = useState(null);
  const [examQuestions, setExamQuestions] = useState(null);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // Fetch logic based on active tab
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (activeTab === "repository") {
          const res = await api.get(`/admin/questions/repository`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setRepository(res.data);
        } else {
          const res = await api.get(`/admin/questions/requests`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setRequests(res.data);
        }
      } catch (err) {
        console.error("Error fetching Question Bank data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeTab]);

  const handleApprove = async () => {
    try {
      const token = localStorage.getItem("token");
      await api.post(
        `/admin/questions/requests/${selectedRequest.id}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      // Remove from UI request list
      setRequests((prev) => prev.filter((r) => r.id !== selectedRequest.id));
      setSelectedRequest(null);
      alert("Request Approved. Document distributed to student's dashboard.");
    } catch (err) {
      console.error("Failed to approve request:", err);
      alert("Error approving request.");
    }
  };

  // Approval Sidebar Content

  // -- New specific logic for Filtering --
  const subjects = [
    "All",
    ...new Set(repository.map((doc) => doc.subject)),
  ].filter(Boolean);

  const filteredRepository = repository.filter((doc) => {
    const matchesSearch = doc.title
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesSubject =
      selectedSubject === "All" || doc.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  // -- View Modal Logic --
  const openExamView = async (exam) => {
    setSelectedExamForView(exam);
    setLoadingQuestions(true);
    try {
      const token = localStorage.getItem("token");
      const res = await api.get(`/admin/questions/repository/${exam.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setExamQuestions(res.data.questions);
    } catch (err) {
      console.error("Failed to fetch exam questions:", err);
      alert("Error loading questions.");
    } finally {
      setLoadingQuestions(false);
    }
  };

  const closeExamView = () => {
    setSelectedExamForView(null);
    setExamQuestions(null);
  };

  const generatePDF = () => {
    if (!examQuestions || !selectedExamForView) return;

    let printContents = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h1 style="text-align: center; color: #333;">${selectedExamForView.title}</h1>
        <h3 style="text-align: center; color: #666; margin-bottom: 30px;">Subject: ${selectedExamForView.subject} | ID: ${selectedExamForView.id.substring(0, 8).toUpperCase()}</h3>
        <hr style="margin-bottom: 20px;" />
    `;

    examQuestions.forEach((q, index) => {
      printContents += `
        <div style="margin-bottom: 20px; page-break-inside: avoid;">
          <p style="font-size: 14px; font-weight: bold; margin-bottom: 10px;">Q${index + 1}. ${q.question_text}</p>
          <ul style="list-style-type: none; padding-left: 20px; margin-bottom: 10px;">
      `;
      if (q.options && Array.isArray(q.options)) {
        q.options.forEach((opt, oIndex) => {
          const isCorrect =
            String(opt) === String(q.correct_answer) ||
            String(oIndex) === String(q.correct_answer);
          printContents += `
            <li style="margin-bottom: 5px; ${isCorrect ? "font-weight: bold; color: #16a34a;" : ""}">
              ${String.fromCharCode(65 + oIndex)}) ${opt} ${isCorrect ? " (Correct Answer)" : ""}
            </li>
          `;
        });
      }
      printContents += `
          </ul>
        </div>
      `;
    });

    printContents += `</div>`;

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>${selectedExamForView.title} - Question Bank</title>
        </head>
        <body onload="window.print(); window.close();">
          ${printContents}
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const renderApprovalSheet = () => {
    if (!selectedRequest) return null;

    return (
      <div className="fixed inset-0 z-50 flex justify-end">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedRequest(null)}
        />

        {/* Sheet / Drawer */}
        <div className="relative w-full max-w-md bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-300">
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50">
            <h2 className="font-semibold text-lg text-zinc-900 dark:text-zinc-50">
              Review Access Request
            </h2>
            <button
              onClick={() => setSelectedRequest(null)}
              className="p-2 -mr-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Student Info */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Student Details
              </h3>
              <div className="flex items-center gap-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                <div className="w-12 h-12 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 flex items-center justify-center font-bold text-lg">
                  {selectedRequest.studentName.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-zinc-900 dark:text-zinc-50">
                    {selectedRequest.studentName}
                  </p>
                  <p className="text-sm font-mono text-zinc-500">
                    {selectedRequest.studentId}
                  </p>
                </div>
              </div>
            </div>

            {/* Request Details */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Requested Material
              </h3>
              <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 space-y-4">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900 dark:text-blue-100">
                      {selectedRequest.requestedMaterial}
                    </p>
                    <p className="text-xs text-blue-600/80 mt-1">
                      Requested: {selectedRequest.date}
                    </p>
                  </div>
                </div>
                <div className="pt-4 border-t border-blue-500/20">
                  <p className="text-xs font-semibold text-blue-900/70 dark:text-blue-100/50 mb-1">
                    Stated Reason:
                  </p>
                  <p className="text-sm text-blue-900 dark:text-blue-100 italic">
                    "{selectedRequest.reason}"
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex gap-3">
            <button
              onClick={() => setSelectedRequest(null)}
              className="flex-1 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors shadow-sm"
            >
              Deny
            </button>
            <button
              onClick={handleApprove}
              className="flex-1 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-semibold transition-colors shadow-sm"
            >
              Approve & Send
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderViewModal = () => {
    if (!selectedExamForView) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={closeExamView}
        />
        <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
          <div className="p-4 sm:p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50 rounded-t-2xl">
            <div>
              <h2 className="font-bold text-xl text-zinc-900 dark:text-zinc-50">
                {selectedExamForView.title}
              </h2>
              <p className="text-sm font-medium text-violet-600 dark:text-violet-400">
                {selectedExamForView.subject} •{" "}
                {selectedExamForView.id.substring(0, 8).toUpperCase()}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={generatePDF}
                disabled={loadingQuestions || !examQuestions}
                className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </button>
              <button
                onClick={closeExamView}
                className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-zinc-50/50 dark:bg-zinc-950">
            {loadingQuestions ? (
              <div className="flex flex-col items-center justify-center h-40 text-zinc-500">
                <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p>Loading questions...</p>
              </div>
            ) : examQuestions && examQuestions.length > 0 ? (
              <div className="space-y-6">
                {examQuestions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="p-5 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm"
                  >
                    <div className="flex items-start gap-3 mb-4">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 text-sm font-bold shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        {q.question_text}
                      </p>
                    </div>
                    {q.options && Array.isArray(q.options) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-9">
                        {q.options.map((opt, oIdx) => {
                          const isCorrect =
                            String(opt) === String(q.correct_answer) ||
                            String(oIdx) === String(q.correct_answer);
                          return (
                            <div
                              key={oIdx}
                              className={`p-3 rounded-lg border text-sm flex items-center gap-3 ${
                                isCorrect
                                  ? "border-green-500/50 bg-green-50 dark:bg-green-500/10 text-green-800 dark:text-green-300 font-medium"
                                  : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400"
                              }`}
                            >
                              <span className="w-5 h-5 flex items-center justify-center rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-500 shrink-0">
                                {String.fromCharCode(65 + oIdx)}
                              </span>
                              {opt}
                              {isCorrect && (
                                <Check className="w-4 h-4 ml-auto text-green-600 dark:text-green-400" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-zinc-500">
                No questions found for this exam.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex p-1 bg-zinc-100 dark:bg-zinc-900 rounded-lg w-full sm:w-auto">
          <button
            onClick={() => setActiveTab("repository")}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === "repository" ? "bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 shadow-sm" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"}`}
          >
            Master Repository
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === "requests" ? "bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 shadow-sm" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"}`}
          >
            Student Requests{" "}
            <span className="ml-2 inline-flex items-center justify-center bg-violet-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
              {requests.length}
            </span>
          </button>
        </div>

        {activeTab === "repository" && (
          <button className="flex items-center gap-2 h-9 px-4 rounded-md bg-violet-600 text-white text-sm font-medium shadow-sm hover:bg-violet-700 transition-colors w-full sm:w-auto justify-center">
            <Plus className="w-4 h-4" /> Upload Material
          </button>
        )}
      </div>

      {/* REPOSITORY TAB CONTENT */}
      {activeTab === "repository" && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* Search and Filters */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search repository..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-9 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div className="relative">
              <button
                onClick={() => setFilterOpen(!filterOpen)}
                className="flex items-center gap-2 h-10 px-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
              >
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {selectedSubject === "All"
                    ? "Subject Filter"
                    : selectedSubject}
                </span>
                <ChevronsUpDown className="w-3 h-3 text-zinc-400" />
              </button>

              {filterOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setFilterOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-lg overflow-hidden z-50 py-1">
                    {subjects.map((subj) => (
                      <button
                        key={subj}
                        onClick={() => {
                          setSelectedSubject(subj);
                          setFilterOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center justify-between ${
                          selectedSubject === subj
                            ? "bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 font-medium"
                            : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                        }`}
                      >
                        <span className="truncate">{subj}</span>
                        {selectedSubject === subj && (
                          <Check className="w-4 h-4" />
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* DataTable */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left align-middle">
                <thead className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-medium">
                  <tr>
                    <th className="p-4">Document Title</th>
                    <th className="p-4">Subject</th>
                    <th className="p-4">Uploaded By</th>
                    <th className="p-4">Date</th>
                    <th className="p-4 text-center">Resources contained</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-zinc-500">
                        Loading master repository...
                      </td>
                    </tr>
                  ) : filteredRepository.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-zinc-500">
                        No documents found matching your filters.
                      </td>
                    </tr>
                  ) : (
                    filteredRepository.map((doc) => (
                      <tr
                        key={doc.id}
                        onClick={() => openExamView(doc)}
                        className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors group cursor-pointer"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-semibold text-zinc-900 dark:text-zinc-50 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate max-w-[200px]">
                                {doc.title}
                              </p>
                              <p className="text-xs font-mono text-zinc-500 mt-0.5">
                                {doc.id.substring(0, 8).toUpperCase()}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-zinc-600 dark:text-zinc-300">
                          {doc.subject}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
                            <User className="w-3.5 h-3.5 text-zinc-400" />{" "}
                            {doc.teacher}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300 whitespace-nowrap">
                            <Calendar className="w-3.5 h-3.5 text-zinc-400" />{" "}
                            {doc.uploadedAt}
                          </div>
                        </td>
                        <td className="p-4 text-center text-zinc-900 dark:text-zinc-50 font-semibold">
                          {doc.uploads} Items
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* REQUESTS TAB CONTENT */}
      {activeTab === "requests" && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden shadow-sm">
            <table className="w-full text-sm text-left align-middle">
              <thead className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-medium">
                <tr>
                  <th className="p-4">Student</th>
                  <th className="p-4">Requested Material</th>
                  <th className="p-4">Date</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="p-8 text-center text-zinc-500">
                      Loading requests...
                    </td>
                  </tr>
                ) : requests.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="p-8 text-center text-zinc-500">
                      No pending student requests.
                    </td>
                  </tr>
                ) : (
                  requests.map((req) => (
                    <tr
                      key={req.id}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors group cursor-pointer"
                      onClick={() => setSelectedRequest(req)}
                    >
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                            {req.studentName}
                          </span>
                          <span className="text-xs font-mono text-zinc-500">
                            {req.studentId}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 font-medium text-blue-600 dark:text-blue-400 truncate max-w-[200px]">
                        {req.requestedMaterial}
                      </td>
                      <td className="p-4 text-zinc-500 dark:text-zinc-400 text-xs whitespace-nowrap">
                        {req.date}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          className="px-3 py-1.5 text-xs font-semibold rounded bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 hover:bg-violet-200 dark:hover:bg-violet-900/50 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRequest(req);
                          }}
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Draw the Approval Sheet if a request is selected */}
      {renderApprovalSheet()}

      {/* Draw the View Questions Modal */}
      {renderViewModal()}
    </div>
  );
}
