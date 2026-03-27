// client/src/components/attendance/AttendanceCard.jsx
import React, { useState, useEffect } from "react";
import { CheckCircle2, XCircle, Clock, MapPin, Hash, QrCode, AlertTriangle, ChevronRight, Loader } from "lucide-react";

/**
 * AttendanceCard Component
 * Displays a single attendance session card
 * 
 * @param {Object} props
 * @param {Object} props.session - The attendance session data
 * @param {Function} props.onMark - Callback when user clicks to mark attendance
 */
export function AttendanceCard({ session, onMark }) {
  const [timeRemaining, setTimeRemaining] = useState("");

  const isMarked = session.already_marked;
  const canMark = session.is_active && session.otp_active && !isMarked;

  // Countdown timer
  useEffect(() => {
    if (!session.expires_at) return;

    const updateCountdown = () => {
      const remaining = Math.max(0, Math.floor((new Date(session.expires_at) - Date.now()) / 1000));
      const mins = Math.floor(remaining / 60);
      const secs = remaining % 60;
      setTimeRemaining(`${mins}:${String(secs).padStart(2, "0")}`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [session.expires_at]);

  // Format time
  const formatTime = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Get status badge
  const getStatusBadge = () => {
    if (isMarked) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-full">
          <CheckCircle2 className="w-3.5 h-3.5" /> Attendance Marked
        </span>
      );
    }
    if (!session.activated) {
      return (
        <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
          <AlertTriangle className="w-3.5 h-3.5" /> Waiting for teacher
        </span>
      );
    }
    if (!session.otp_active) {
      return (
        <span className="text-xs text-red-500 flex items-center gap-1">
          <XCircle className="w-3.5 h-3.5" /> OTP expired
        </span>
      );
    }
    if (session.is_active) {
      return (
        <span className={`text-xs font-mono font-bold flex items-center gap-1 ${
          timeRemaining && parseInt(timeRemaining) < 60 
            ? "text-red-500" 
            : "text-teal-600 dark:text-teal-400"
        }`}>
          <Clock className="w-3.5 h-3.5" /> Expires in {timeRemaining}
        </span>
      );
    }
    return null;
  };

  return (
    <div
      className={`border rounded-2xl p-4 transition-all ${
        isMarked
          ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/10"
          : canMark
          ? "border-teal-400 dark:border-teal-600 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md hover:border-teal-500"
          : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 opacity-75"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left Content */}
        <div className="min-w-0 flex-1">
          {/* Subject Info */}
          <div className="flex items-center gap-2 mb-1">
            <p className="font-semibold text-zinc-900 dark:text-white truncate">
              {session.subject?.name}
            </p>
            <span className="text-xs font-mono text-zinc-400 shrink-0 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
              {session.subject?.code}
            </span>
          </div>

          {/* Time & Teacher */}
          <p className="text-xs text-zinc-500 flex items-center gap-1 mb-2">
            <Clock className="w-3.5 h-3.5" />
            {formatTime(session.class_start_time)} — {formatTime(session.class_end_time)}
            <span className="mx-1">·</span>
            <span className="truncate max-w-[120px]">{session.teacher_name}</span>
          </p>

          {/* Status Badge */}
          {getStatusBadge()}

          {/* Location Info */}
          {session.department_location && (
            <p className="text-xs text-zinc-400 flex items-center gap-1 mt-1">
              <MapPin className="w-3 h-3" />
              {session.department_location}
            </p>
          )}
        </div>

        {/* Right Content */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          {/* Mode Badge */}
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${
              session.mode === "OTP"
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
            }`}
          >
            {session.mode === "OTP" ? (
              <Hash className="w-3 h-3" />
            ) : (
              <QrCode className="w-3 h-3" />
            )}
            {session.mode}
          </span>

          {/* Mark Button */}
          {canMark && (
            <button
              onClick={() => onMark(session)}
              className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1 shadow-sm"
            >
              Mark <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Loading State */}
          {!session.activated && !isMarked && (
            <span className="text-xs text-zinc-400 flex items-center gap-1">
              <Loader className="w-3 h-3 animate-spin" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default AttendanceCard;
