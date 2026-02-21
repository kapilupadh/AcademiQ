import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { CircleAlert, Shield, Clock, Key, Loader } from "lucide-react";

export default function ExamInstructions() {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [waitingRoomData, setWaitingRoomData] = useState(null);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/exam", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setExams(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Poll for exam start if in waiting room
  useEffect(() => {
    let interval;
    if (waitingRoomData && waitingRoomData.status === "WAITING_ROOM") {
      interval = setInterval(async () => {
        try {
          const token = localStorage.getItem("token");
          // Re-trigger start to see if teacher made it Live
          const res = await axios.post(
            `http://localhost:5000/api/exam/${waitingRoomData.examId}/start`,
            {},
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );
          if (res.data.status === "IN_PROGRESS") {
            clearInterval(interval);
            // Proceed to portal
            navigate(`/exam/portal/${waitingRoomData.examId}`);
          }
        } catch (err) {
          // Ignore polling errors or handle expiration
          if (
            err.response &&
            err.response.data &&
            err.response.data.message.includes("expired")
          ) {
            clearInterval(interval);
            alert("Exam ended before you could start or time expired.");
            window.location.reload();
          }
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [waitingRoomData, navigate]);

  const handleJoin = async () => {
    if (!selectedExam || !otp) return alert("Select an exam and enter OTP");
    setActionLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "http://localhost:5000/api/exam/join",
        {
          examId: selectedExam.id,
          otp,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (res.data.status === "WAITING_ROOM") {
        setWaitingRoomData({
          examId: selectedExam.id,
          status: "WAITING_ROOM",
          attemptId: res.data.attemptId,
        });
      } else if (res.data.status === "IN_PROGRESS") {
        // Re-joining an already live exam
        navigate(`/exam/portal/${selectedExam.id}`);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to join exam");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading)
    return (
      <div className="p-8 text-center text-zinc-500">Loading Exams...</div>
    );

  if (waitingRoomData) {
    return (
      <div className="max-w-xl mx-auto p-8 pt-32 text-center space-y-6">
        <Loader className="w-12 h-12 text-blue-500 animate-spin mx-auto" />
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
          Waiting Room
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400">
          You have successfully joined. Waiting for the teacher to start the
          exam...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-8 pt-16">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
          Join Examination
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mb-8">
          Select your assigned test and enter the 6-digit OTP provided by your
          teacher.
        </p>

        <div className="space-y-6 mb-8">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Select Exam
            </label>
            <select
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:border-blue-500 text-zinc-900 dark:text-white"
              onChange={(e) =>
                setSelectedExam(exams.find((ex) => ex.id === e.target.value))
              }
              value={selectedExam?.id || ""}
            >
              <option value="" disabled>
                -- Choose an Exam --
              </option>
              {exams.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title} ({e.subject || e.type})
                </option>
              ))}
            </select>
          </div>

          {selectedExam && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 flex items-center gap-3">
                <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="text-xs font-semibold text-blue-900 dark:text-blue-200">
                    Duration
                  </p>
                  <p className="font-bold text-blue-700 dark:text-blue-300">
                    {selectedExam.duration_minutes} Mins
                  </p>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800 flex items-center gap-3">
                <CircleAlert className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                <div>
                  <p className="text-xs font-semibold text-purple-900 dark:text-purple-200">
                    Questions
                  </p>
                  <p className="font-bold text-purple-700 dark:text-purple-300">
                    {selectedExam.total_questions_to_ask} MCQs
                  </p>
                </div>
              </div>
            </div>
          )}

          {selectedExam && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Enter OTP
              </label>
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  className="w-full pl-12 pr-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:border-blue-500 text-zinc-900 dark:text-white font-mono tracking-widest text-lg"
                />
              </div>
            </div>
          )}
        </div>

        <button
          disabled={!selectedExam || otp.length !== 6 || actionLoading}
          onClick={handleJoin}
          className="w-full py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
        >
          {actionLoading ? "Joining..." : "Join Waiting Room"}
        </button>
      </div>
    </div>
  );
}
