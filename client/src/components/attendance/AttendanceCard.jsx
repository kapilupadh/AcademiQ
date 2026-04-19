import React, { useState, useEffect } from "react";
import {
  CheckCircle2, XCircle, Clock, MapPin, Hash, QrCode,
  AlertTriangle, ChevronRight, Loader, Timer,
} from "lucide-react";

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
    const update = () => {
      const remaining = Math.max(0, Math.floor((new Date(session.expires_at) - Date.now()) / 1000));
      const m = Math.floor(remaining / 60);
      const s = remaining % 60;
      setTimeRemaining(`${m}:${String(s).padStart(2, "0")}`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [session.expires_at]);

  const formatTime = (d) =>
    d ? new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";

  const secsLeft = timeRemaining
    ? parseInt(timeRemaining.split(":")[0]) * 60 + parseInt(timeRemaining.split(":")[1])
    : 999;
  const isUrgent = secsLeft < 60;

  // Status badge
  const StatusBadge = () => {
    if (isMarked) return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 px-2 py-0.5 rounded-md">
        <CheckCircle2 className="w-3 h-3" /> Marked
      </span>
    );
    if (!session.activated) return (
      <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 px-2 py-0.5 rounded-md">
        <AlertTriangle className="w-3 h-3" /> Waiting for teacher
      </span>
    );
    if (!session.otp_active) return (
      <span className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 px-2 py-0.5 rounded-md">
        <XCircle className="w-3 h-3" /> {session.mode} expired
      </span>
    );
    if (session.is_active && timeRemaining) return (
      <span className={`inline-flex items-center gap-1 text-xs font-mono font-semibold px-2 py-0.5 rounded-md border ${
        isUrgent
          ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50"
          : "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50"
      }`}>
        <Timer className="w-3 h-3" /> {timeRemaining}
      </span>
    );
    return null;
  };

  // Card border + bg based on state
  const cardStyle = isMarked
    ? "border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/10"
    : canMark
    ? "border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-zinc-400 dark:hover:border-zinc-600 hover:shadow-sm"
    : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 opacity-60";

  return (
    <div className={`border rounded-xl p-4 transition-all duration-150 ${cardStyle}`}>
      <div className="flex items-start justify-between gap-3">

        {/* Left: subject info */}
        <div className="min-w-0 flex-1 space-y-1.5">
          {/* Subject name + code */}
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
              {session.subject?.name}
            </p>
            {session.subject?.code && (
              <span className="text-xs font-mono text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded shrink-0">
                {session.subject.code}
              </span>
            )}
          </div>

          {/* Time + teacher */}
          <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1 flex-wrap">
            <Clock className="w-3 h-3 shrink-0" />
            {formatTime(session.class_start_time)} — {formatTime(session.class_end_time)}
            {session.teacher_name && (
              <>
                <span className="text-zinc-300 dark:text-zinc-700 mx-0.5">·</span>
                <span className="truncate max-w-[130px]">{session.teacher_name}</span>
              </>
            )}
          </p>

          {/* Location */}
          {session.department_location && (
            <p className="text-xs text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
              <MapPin className="w-3 h-3 shrink-0" />
              {session.department_location}
            </p>
          )}

          {/* Status badge */}
          <StatusBadge />
        </div>

        {/* Right: mode + action */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          {/* Mode badge */}
          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md ${
            session.mode === "OTP"
              ? "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400"
              : "bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-400"
          }`}>
            {session.mode === "OTP"
              ? <Hash className="w-3 h-3" />
              : <QrCode className="w-3 h-3" />
            }
            {session.mode}
          </span>

          {/* Mark button */}
          {canMark && (
            <button
              onClick={() => onMark(session)}
              className="inline-flex items-center gap-1 bg-zinc-900 dark:bg-white hover:opacity-90 active:opacity-80 text-white dark:text-zinc-900 text-xs font-medium px-3.5 py-1.5 rounded-lg transition-opacity shadow-sm"
            >
              Mark <ChevronRight className="w-3 h-3" />
            </button>
          )}

          {/* Waiting spinner */}
          {!session.activated && !isMarked && (
            <Loader className="w-3.5 h-3.5 text-zinc-400 animate-spin" />
          )}

          {/* Already marked checkmark */}
          {isMarked && (
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          )}
        </div>
      </div>
    </div>
  );
}

export default AttendanceCard;