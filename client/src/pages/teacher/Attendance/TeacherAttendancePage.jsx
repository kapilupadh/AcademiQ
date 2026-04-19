import React, { useState, useEffect, useRef, useCallback } from "react";
import api from "../../../services/api";
import QRCode from "react-qr-code";
import {
  Clock, Users, CheckCircle2, XCircle, RefreshCw, QrCode,
  Hash, Loader, AlertTriangle, Play, Square, RotateCcw,
  BookOpen, CalendarClock, ChevronRight, Timer,
} from "lucide-react";

// ── Utilities ─────────────────────────────────────────────────────────────────
const fmt = (d) => d ? new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—";

// ── Reusable: Label ───────────────────────────────────────────────────────────
function Label({ children, required }) {
  return (
    <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

// ── Reusable: Input ───────────────────────────────────────────────────────────
function Input({ className = "", ...props }) {
  return (
    <input
      {...props}
      className={`w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 outline-none focus:border-zinc-400 dark:focus:border-zinc-600 focus:ring-2 focus:ring-zinc-200 dark:focus:ring-zinc-800 transition-all ${className}`}
    />
  );
}

// ── Reusable: Error Banner ────────────────────────────────────────────────────
function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-lg px-4 py-3 text-red-600 dark:text-red-400 text-xs">
      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
      {message}
    </div>
  );
}

// ── Reusable: Stat Tile ───────────────────────────────────────────────────────
function StatTile({ label, value, colorClass, bgClass }) {
  return (
    <div className={`${bgClass} rounded-lg p-3 text-center border border-transparent`}>
      <p className={`text-2xl font-bold tabular-nums ${colorClass}`}>{value}</p>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{label}</p>
    </div>
  );
}

// ── Countdown ─────────────────────────────────────────────────────────────────
function Countdown({ expiresAt, onExpire }) {
  const [secs, setSecs] = useState(0);

  useEffect(() => {
    const calc = () => Math.max(0, Math.floor((new Date(expiresAt) - Date.now()) / 1000));
    setSecs(calc());
    const id = setInterval(() => {
      const s = calc();
      setSecs(s);
      if (s === 0) { clearInterval(id); onExpire?.(); }
    }, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const m = Math.floor(secs / 60), s = secs % 60;
  const isUrgent = secs < 60;

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-semibold border ${
      isUrgent
        ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400"
        : "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400"
    }`}>
      <Timer className="w-3 h-3" />
      {m}:{String(s).padStart(2, "0")}
    </div>
  );
}

// ── Step 1: Create Session Form ───────────────────────────────────────────────
function CreateSessionForm({ onCreated }) {
  const [mySubjects, setMySubjects] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [selectedSem, setSelectedSem] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const localNow = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;

  const [form, setForm] = useState({
    subject_id: "",
    class_start_time: localNow,
    class_end_time: "",
    mode: "OTP",
    otp_digits: 6,
    otp_expiry_minutes: 10,
  });

  useEffect(() => {
    setLoading(true);
    api.get("/teacher/available-subjects/semesters")
      .then((r) => setSemesters(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedSem) { setMySubjects([]); setForm((f) => ({ ...f, subject_id: "" })); return; }
    api.get("/teacher/my-subjects")
      .then((r) => {
        setMySubjects(r.data.filter((s) => s.semester === parseInt(selectedSem)));
        setForm((f) => ({ ...f, subject_id: "" }));
      })
      .catch(console.error);
  }, [selectedSem]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject_id) { setError("Please select a subject."); return; }
    if (!form.class_end_time) { setError("Please set class end time."); return; }
    setSubmitting(true); setError("");
    try {
      const res = await api.post("/attendance/sessions", {
        ...form,
        otp_digits: Number(form.otp_digits),
        otp_expiry_minutes: Number(form.otp_expiry_minutes),
      });
      onCreated(res.data.session);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create session.");
    } finally { setSubmitting(false); }
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">

        {/* Card header */}
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-start gap-3">
          <div className="mt-0.5 p-1.5 rounded-md bg-zinc-100 dark:bg-zinc-800">
            <CalendarClock className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Start Attendance Session</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              OTP / QR can only be generated within the class window.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <ErrorBanner message={error} />

          {/* Semester picker */}
          <div>
            <Label required>Semester</Label>
            {loading ? (
              <div className="flex items-center gap-2 text-zinc-400 text-xs py-2">
                <Loader className="w-3.5 h-3.5 animate-spin" /> Loading semesters…
              </div>
            ) : semesters.length === 0 ? (
              <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-lg px-4 py-3 text-xs text-amber-700 dark:text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>No subjects found. Go to <strong>My Subjects</strong> to add subjects first.</span>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {semesters.map((s) => (
                  <button
                    key={s} type="button"
                    onClick={() => setSelectedSem(String(s))}
                    className={`px-3.5 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                      selectedSem === String(s)
                        ? "border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                        : "border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-600"
                    }`}
                  >
                    Sem {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Subject picker */}
          {selectedSem && (
            <div>
              <Label required>Subject</Label>
              {mySubjects.length === 0 ? (
                <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-lg px-4 py-3 text-xs text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>No subjects for Semester {selectedSem}. Add them in <strong>My Subjects</strong>.</span>
                </div>
              ) : (
                <select
                  value={form.subject_id}
                  onChange={(e) => setForm({ ...form, subject_id: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-all"
                >
                  <option value="">Select subject</option>
                  {mySubjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}{s.code ? ` (${s.code})` : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Class window + settings */}
          {form.subject_id && (
            <>
              {/* Time range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Class Start</Label>
                  <Input
                    type="datetime-local"
                    value={form.class_start_time}
                    onChange={(e) => setForm({ ...form, class_start_time: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Class End</Label>
                  <Input
                    type="datetime-local"
                    value={form.class_end_time}
                    min={form.class_start_time}
                    onChange={(e) => setForm({ ...form, class_end_time: e.target.value })}
                  />
                </div>
              </div>

              {/* Mode */}
              <div>
                <Label>Attendance Mode</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { v: "OTP", icon: Hash, label: "OTP Code" },
                    { v: "QR",  icon: QrCode, label: "QR Code" },
                  ].map(({ v, icon: Icon, label }) => (
                    <button
                      key={v} type="button"
                      onClick={() => setForm({ ...form, mode: v })}
                      className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-xs font-semibold transition-all ${
                        form.mode === v
                          ? "border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                          : "border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-600"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" /> {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* OTP/QR settings */}
              <div className="grid grid-cols-2 gap-3">
                {form.mode === "OTP" && (
                  <div>
                    <Label>OTP Digits</Label>
                    <div className="flex gap-2">
                      {[4, 6].map((d) => (
                        <button
                          key={d} type="button"
                          onClick={() => setForm({ ...form, otp_digits: d })}
                          className={`flex-1 py-2 rounded-lg border text-xs font-semibold transition-all ${
                            form.otp_digits === d
                              ? "border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                              : "border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:border-zinc-400"
                          }`}
                        >
                          {d} digits
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className={form.mode === "OTP" ? "" : "col-span-2"}>
                  <Label>Expiry (minutes)</Label>
                  <Input
                    type="number" min={1} max={60}
                    value={form.otp_expiry_minutes}
                    onChange={(e) => setForm({ ...form, otp_expiry_minutes: e.target.value })}
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit" disabled={submitting}
                className="w-full py-2.5 bg-zinc-900 dark:bg-white hover:opacity-90 disabled:opacity-50 text-white dark:text-zinc-900 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-opacity"
              >
                {submitting
                  ? <><Loader className="w-4 h-4 animate-spin" /> Creating…</>
                  : <><Play className="w-3.5 h-3.5" /> Create Session</>
                }
              </button>
            </>
          )}
        </form>

        {/* Footer link */}
        <div className="px-6 py-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-center">
          <a
            href="/teacher/subjects"
            className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            <BookOpen className="w-3 h-3" /> Manage My Subjects <ChevronRight className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}

// ── Step 2: Active Session View ───────────────────────────────────────────────
function ActiveSessionView({ session, onClose }) {
  const [sessionData, setSessionData] = useState(null);
  const [activating, setActivating] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState("");
  const [otpExpired, setOtpExpired] = useState(false);
  const pollRef = useRef(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await api.get(`/attendance/sessions/${session.id}`);
      setSessionData(res.data);
    } catch (err) { console.error("Poll error:", err); }
  }, [session.id]);

  useEffect(() => {
    fetchStatus();
    pollRef.current = setInterval(fetchStatus, 5000);
    return () => clearInterval(pollRef.current);
  }, [fetchStatus]);

  const handleActivate = async () => {
    setActivating(true); setError(""); setOtpExpired(false);
    try { await api.post(`/attendance/sessions/${session.id}/activate`); await fetchStatus(); }
    catch (err) { setError(err.response?.data?.message || "Failed to activate."); }
    finally { setActivating(false); }
  };

  const handleRegenerate = async () => {
    setRegenerating(true); setError(""); setOtpExpired(false);
    try { await api.post(`/attendance/sessions/${session.id}/regenerate`); await fetchStatus(); }
    catch (err) { setError(err.response?.data?.message || "Failed to regenerate."); }
    finally { setRegenerating(false); }
  };

  const handleClose = async () => {
    if (!window.confirm("Close session? Students not yet marked will be auto-marked ABSENT.")) return;
    setClosing(true);
    try { const res = await api.post(`/attendance/sessions/${session.id}/close`); onClose(res.data); }
    catch (err) { setError(err.response?.data?.message || "Failed to close."); setClosing(false); }
  };

  if (!sessionData) return (
    <div className="flex items-center justify-center py-20 gap-2 text-zinc-400 text-sm">
      <Loader className="w-4 h-4 animate-spin" /> Loading session…
    </div>
  );

  const { session: s, summary, records } = sessionData;
  const isOtpActive = s.otp_active && !otpExpired;

  return (
    <div className="max-w-2xl mx-auto space-y-4">

      {/* Session header card */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.is_active ? "bg-emerald-500 animate-pulse" : "bg-zinc-400"}`} />
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{s.subject?.name}</span>
              {s.subject?.code && (
                <span className="text-xs font-mono text-zinc-400 dark:text-zinc-500">{s.subject.code}</span>
              )}
              <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                s.mode === "OTP"
                  ? "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400"
                  : "bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-400"
              }`}>
                {s.mode}
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              {fmt(s.class_start_time)} — {fmt(s.class_end_time)} · {fmtDate(s.class_start_time)}
            </p>
            {!s.within_window && s.is_active && (
              <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5 mt-1">
                <AlertTriangle className="w-3 h-3" /> Outside class window — {s.mode} generation locked
              </p>
            )}
          </div>

          <button
            onClick={fetchStatus}
            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <StatTile label="Present" value={summary.present} colorClass="text-emerald-600 dark:text-emerald-400" bgClass="bg-emerald-50/60 dark:bg-emerald-950/10" />
          <StatTile label="Absent"  value={summary.absent}  colorClass="text-red-600 dark:text-red-400"     bgClass="bg-red-50/60 dark:bg-red-950/10" />
          <StatTile label="Total"   value={summary.total}   colorClass="text-zinc-700 dark:text-zinc-300"   bgClass="bg-zinc-50 dark:bg-zinc-800/50" />
        </div>
      </div>

      <ErrorBanner message={error} />

      {/* OTP / QR panel */}
      {s.is_active && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
            {s.mode === "OTP" ? <Hash className="w-3.5 h-3.5 text-zinc-400" /> : <QrCode className="w-3.5 h-3.5 text-zinc-400" />}
            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{s.mode} Code</span>
          </div>

          <div className="p-6 flex flex-col items-center gap-4">
            {!s.activated ? (
              <>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
                  Click Generate to show students the {s.mode}.
                </p>
                <button
                  onClick={handleActivate}
                  disabled={activating || !s.within_window}
                  className="inline-flex items-center gap-2 bg-zinc-900 dark:bg-white hover:opacity-90 disabled:opacity-50 text-white dark:text-zinc-900 text-sm font-medium px-5 py-2.5 rounded-lg transition-opacity"
                >
                  {activating ? <Loader className="w-4 h-4 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                  Generate {s.mode}
                </button>
                {!s.within_window && (
                  <p className="text-xs text-amber-500 dark:text-amber-400">
                    Only available during: {fmt(s.class_start_time)} — {fmt(s.class_end_time)}
                  </p>
                )}
              </>
            ) : isOtpActive ? (
              <>
                {s.mode === "OTP" ? (
                  <div className="w-full text-center">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">Share this code with students</p>
                    <div className="text-5xl font-black tracking-[0.25em] font-mono text-zinc-900 dark:text-zinc-100 py-5 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 select-all">
                      {s.otp_code}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Students scan this QR code</p>
                    <div className="p-4 bg-white rounded-xl border border-zinc-200 dark:border-zinc-800 inline-block">
                      <QRCode value={s.qr_token} size={180} />
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500">Expires in</span>
                  <Countdown expiresAt={s.expires_at} onExpire={() => setOtpExpired(true)} />
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="w-3.5 h-3.5" /> {s.mode} has expired
                </div>
                <button
                  onClick={handleRegenerate}
                  disabled={regenerating || !s.within_window}
                  className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
                >
                  {regenerating ? <Loader className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                  Regenerate {s.mode}
                </button>
                {!s.within_window && (
                  <p className="text-xs text-red-500 dark:text-red-400">Cannot regenerate outside class hours.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Live attendance table */}
      {records.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              Live Attendance
              <span className="ml-1.5 font-normal text-zinc-400">({records.length})</span>
            </span>
          </div>
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800 max-h-64 overflow-y-auto">
            {records.map((r) => (
              <div key={r.id} className="flex items-center justify-between px-5 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{r.student_name}</p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">
                    {r.roll_number} · {fmt(r.marked_at)}
                    {r.distance_meters !== null && ` · ${r.distance_meters}m`}
                  </p>
                </div>
                {r.status === "PRESENT"
                  ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  : <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                }
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Close session */}
      {s.is_active && (
        <button
          onClick={handleClose}
          disabled={closing}
          className="w-full py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          {closing ? <Loader className="w-4 h-4 animate-spin" /> : <Square className="w-3.5 h-3.5" />}
          Close Session & Mark Absentees
        </button>
      )}
    </div>
  );
}

// ── Step 3: Closed Summary ────────────────────────────────────────────────────
function SessionSummary({ summary, onNew }) {
  return (
    <div className="max-w-sm mx-auto">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-8 text-center space-y-5">
        <div className="mx-auto w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center">
          <CheckCircle2 className="w-6 h-6 text-emerald-500" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Session Closed</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Attendance has been recorded.</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <StatTile label="Present" value={summary.present_count} colorClass="text-emerald-600 dark:text-emerald-400" bgClass="bg-emerald-50/60 dark:bg-emerald-950/10" />
          <StatTile label="Absent"  value={summary.absent_count}  colorClass="text-red-600 dark:text-red-400"     bgClass="bg-red-50/60 dark:bg-red-950/10" />
          <StatTile label="Total"   value={summary.total_eligible} colorClass="text-zinc-700 dark:text-zinc-300"   bgClass="bg-zinc-50 dark:bg-zinc-800/50" />
        </div>

        <button
          onClick={onNew}
          className="w-full py-2.5 bg-zinc-900 dark:bg-white hover:opacity-90 text-white dark:text-zinc-900 text-sm font-medium rounded-lg transition-opacity"
        >
          Start New Session
        </button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function TeacherAttendancePage() {
  const [phase, setPhase] = useState("create");
  const [session, setSession] = useState(null);
  const [closeSummary, setCloseSummary] = useState(null);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-[1200px] mx-auto px-6 py-8 space-y-6">

        {/* Page header */}
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Attendance
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            OTP and QR-based anti-proxy attendance tracking.
          </p>
        </div>

        <div className="h-px bg-zinc-200 dark:bg-zinc-800" />

        {phase === "create" && (
          <CreateSessionForm
            onCreated={(s) => { setSession(s); setPhase("active"); }}
          />
        )}
        {phase === "active" && session && (
          <ActiveSessionView
            session={session}
            onClose={(s) => { setCloseSummary(s); setPhase("done"); }}
          />
        )}
        {phase === "done" && closeSummary && (
          <SessionSummary
            summary={closeSummary}
            onNew={() => { setSession(null); setCloseSummary(null); setPhase("create"); }}
          />
        )}
      </div>
    </div>
  );
}