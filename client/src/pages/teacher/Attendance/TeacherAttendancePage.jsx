// client/src/pages/teacher/Attendance/TeacherAttendancePage.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import api from "../../../services/api";
import QRCode from "react-qr-code";
import {
  Clock, Users, CheckCircle2, XCircle, RefreshCw, QrCode,
  Hash, Loader, AlertTriangle, Play, Square, RotateCcw,
  BookOpen, CalendarClock, Building2, ChevronRight,
} from "lucide-react";

const fmt = (d) => d ? new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—";

function Countdown({ expiresAt, onExpire }) {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    const calc = () => Math.max(0, Math.floor((new Date(expiresAt) - Date.now()) / 1000));
    setSecs(calc());
    const id = setInterval(() => {
      const s = calc(); setSecs(s);
      if (s === 0) { clearInterval(id); onExpire?.(); }
    }, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);
  const m = Math.floor(secs / 60), s = secs % 60;
  return (
    <span className={`font-mono font-bold text-lg ${secs < 60 ? "text-red-500 animate-pulse" : "text-emerald-500"}`}>
      {m}:{String(s).padStart(2, "0")}
    </span>
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
  const [deptName, setDeptName] = useState("");

  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const localNow = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;

  const [form, setForm] = useState({
    subject_id: "",
    class_start_time: localNow,
    class_end_time: "",
    mode: "OTP",
    otp_digits: 6,
    otp_expiry_minutes: 10,
  });

  useEffect(() => {
    // Load teacher's dept name + semesters
    setLoading(true);
    Promise.all([
      api.get("/teacher/available-subjects/semesters"),
    ]).then(([semRes]) => {
      setSemesters(semRes.data);
    }).catch(console.error).finally(() => setLoading(false));

    // Get dept name from user in localStorage
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (user.department_name) setDeptName(user.department_name);
    } catch {}
  }, []);

  // Load subjects when semester selected
  useEffect(() => {
    if (!selectedSem) { setMySubjects([]); setForm(f => ({ ...f, subject_id: "" })); return; }
    api.get(`/teacher/my-subjects`)
      .then(r => {
        const filtered = r.data.filter(s => s.semester === parseInt(selectedSem));
        setMySubjects(filtered);
        setForm(f => ({ ...f, subject_id: "" }));
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

  const INPUT = "w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:border-teal-500 text-zinc-900 dark:text-white text-sm";

  return (
    <div className="max-w-xl mx-auto">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-5">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-teal-500" /> Start Attendance Session
          </h2>
          <p className="text-sm text-zinc-500 mt-1">OTP/QR can only be generated within the class window.</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl p-3 text-red-600 dark:text-red-400 text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />{error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Step 1: Semester picker */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Semester <span className="text-red-500">*</span>
            </label>
            {loading ? (
              <div className="flex items-center gap-2 text-zinc-400 text-sm py-2">
                <Loader className="w-4 h-4 animate-spin" /> Loading…
              </div>
            ) : semesters.length === 0 ? (
              <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-3 text-amber-700 dark:text-amber-400 text-sm flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>No subjects found in your department. Go to <strong>My Subjects</strong> to add subjects you teach first.</span>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {semesters.map(s => (
                  <button key={s} type="button" onClick={() => setSelectedSem(String(s))}
                    className={`px-4 py-2 rounded-xl border text-sm font-bold transition-all ${selectedSem === String(s) ? "border-teal-500 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300" : "border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-teal-300"}`}>
                    Sem {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Step 2: Subject picker (only after semester selected) */}
          {selectedSem && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Subject <span className="text-red-500">*</span>
              </label>
              {mySubjects.length === 0 ? (
                <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-3 text-amber-700 dark:text-amber-400 text-sm flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>You have no subjects claimed for Semester {selectedSem}. Go to <strong>My Subjects</strong> to add them.</span>
                </div>
              ) : (
                <select value={form.subject_id} onChange={e => setForm({ ...form, subject_id: e.target.value })} className={INPUT}>
                  <option value="">— Select Subject —</option>
                  {mySubjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name} {s.code ? `(${s.code})` : ""}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Class window */}
          {form.subject_id && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Class Start</label>
                  <input type="datetime-local" value={form.class_start_time}
                    onChange={e => setForm({ ...form, class_start_time: e.target.value })} className={INPUT} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Class End</label>
                  <input type="datetime-local" value={form.class_end_time} min={form.class_start_time}
                    onChange={e => setForm({ ...form, class_end_time: e.target.value })} className={INPUT} />
                </div>
              </div>

              {/* Mode */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Attendance Mode</label>
                <div className="grid grid-cols-2 gap-3">
                  {[{ v: "OTP", icon: Hash, label: "OTP Code" }, { v: "QR", icon: QrCode, label: "QR Code" }].map(({ v, icon: Icon, label }) => (
                    <button key={v} type="button" onClick={() => setForm({ ...form, mode: v })}
                      className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 font-medium text-sm transition-all ${form.mode === v ? "border-teal-500 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300" : "border-zinc-200 dark:border-zinc-800 text-zinc-500"}`}>
                      <Icon className="w-4 h-4" /> {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* OTP settings */}
              {form.mode === "OTP" ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">OTP Digits</label>
                    <div className="flex gap-2">
                      {[4, 6].map(d => (
                        <button key={d} type="button" onClick={() => setForm({ ...form, otp_digits: d })}
                          className={`flex-1 py-2.5 rounded-xl border text-sm font-bold transition-all ${form.otp_digits === d ? "border-teal-500 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300" : "border-zinc-200 dark:border-zinc-800 text-zinc-500"}`}>
                          {d} digits
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Expiry (mins)</label>
                    <input type="number" min={1} max={60} value={form.otp_expiry_minutes}
                      onChange={e => setForm({ ...form, otp_expiry_minutes: e.target.value })} className={INPUT} />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">QR Expiry (mins)</label>
                  <input type="number" min={1} max={60} value={form.otp_expiry_minutes}
                    onChange={e => setForm({ ...form, otp_expiry_minutes: e.target.value })} className={INPUT} />
                </div>
              )}

              <button type="submit" disabled={submitting}
                className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {submitting ? <><Loader className="w-4 h-4 animate-spin" /> Creating…</> : <><Play className="w-4 h-4" /> Create Session</>}
              </button>
            </>
          )}
        </form>

        {/* Quick link to My Subjects */}
        <div className="flex items-center justify-center pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <a href="/teacher/subjects" className="text-sm text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" /> Manage My Subjects <ChevronRight className="w-3.5 h-3.5" />
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

  if (!sessionData) return <div className="flex items-center justify-center py-16 text-zinc-400 gap-2"><Loader className="w-5 h-5 animate-spin" /> Loading…</div>;

  const { session: s, summary, records } = sessionData;
  const isOtpActive = s.otp_active && !otpExpired;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-2 h-2 rounded-full ${s.is_active ? "bg-emerald-500 animate-pulse" : "bg-zinc-400"}`} />
              <h2 className="font-bold text-zinc-900 dark:text-white">{s.subject?.name}</h2>
              <span className="text-xs font-mono text-zinc-400">{s.subject?.code}</span>
            </div>
            <p className="text-sm text-zinc-500 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> {fmt(s.class_start_time)} — {fmt(s.class_end_time)} · {fmtDate(s.class_start_time)}
            </p>
            {!s.within_window && s.is_active && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Outside class window — OTP generation locked
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${s.mode === "OTP" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"}`}>
              {s.mode} mode
            </span>
            <button onClick={fetchStatus} className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-4">
          {[
            { label: "Present", value: summary.present, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/10" },
            { label: "Absent", value: summary.absent, color: "text-red-500", bg: "bg-red-50 dark:bg-red-900/10" },
            { label: "Total", value: summary.total, color: "text-zinc-700 dark:text-zinc-300", bg: "bg-zinc-50 dark:bg-zinc-800" },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className={`${bg} rounded-xl p-3 text-center`}>
              <p className={`text-2xl font-black ${color}`}>{value}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl p-3 text-red-600 dark:text-red-400 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}

      {s.is_active && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm text-center space-y-4">
          {!s.activated ? (
            <>
              <p className="text-zinc-500 text-sm">Click Generate to show students the {s.mode}.</p>
              <button onClick={handleActivate} disabled={activating || !s.within_window}
                className="px-8 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl flex items-center gap-2 mx-auto disabled:opacity-50 transition-all">
                {activating ? <Loader className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Generate {s.mode}
              </button>
              {!s.within_window && <p className="text-xs text-amber-500">Only available during: {fmt(s.class_start_time)} — {fmt(s.class_end_time)}</p>}
            </>
          ) : isOtpActive ? (
            <>
              {s.mode === "OTP" ? (
                <div>
                  <p className="text-sm text-zinc-500 mb-2">Share this code with students</p>
                  <div className="text-6xl font-black tracking-[0.3em] text-zinc-900 dark:text-white py-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 select-all">
                    {s.otp_code}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <p className="text-sm text-zinc-500">Students scan this QR code</p>
                  <div className="p-4 bg-white rounded-2xl border border-zinc-200 inline-block">
                    <QRCode value={s.qr_token} size={200} />
                  </div>
                </div>
              )}
              <div className="flex items-center justify-center gap-2">
                <span className="text-sm text-zinc-500">Expires in</span>
                <Countdown expiresAt={s.expires_at} onExpire={() => setOtpExpired(true)} />
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 justify-center text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-5 h-5" /><span className="font-semibold">{s.mode} has expired</span>
              </div>
              <button onClick={handleRegenerate} disabled={regenerating || !s.within_window}
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl flex items-center gap-2 mx-auto disabled:opacity-50 transition-all">
                {regenerating ? <Loader className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                Regenerate {s.mode}
              </button>
              {!s.within_window && <p className="text-xs text-red-500">Cannot regenerate outside class hours.</p>}
            </div>
          )}
        </div>
      )}

      {records.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
            <Users className="w-4 h-4 text-zinc-400" />
            <span className="font-semibold text-zinc-900 dark:text-white text-sm">Live Attendance</span>
          </div>
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800 max-h-72 overflow-y-auto">
            {records.map(r => (
              <div key={r.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-white">{r.student_name}</p>
                  <p className="text-xs text-zinc-400">{r.roll_number} · {fmt(r.marked_at)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {r.distance_meters !== null && <span className="text-xs text-zinc-400">{r.distance_meters}m</span>}
                  {r.status === "PRESENT" ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <XCircle className="w-5 h-5 text-red-500" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {s.is_active && (
        <button onClick={handleClose} disabled={closing}
          className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50">
          {closing ? <Loader className="w-4 h-4 animate-spin" /> : <Square className="w-4 h-4" />}
          Close Session & Mark Absentees
        </button>
      )}
    </div>
  );
}

// ── Step 3: Closed Summary ────────────────────────────────────────────────────
function SessionSummary({ summary, onNew }) {
  return (
    <div className="max-w-md mx-auto text-center space-y-6">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-sm space-y-5">
        <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto" />
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Session Closed</h2>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-xl p-3">
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{summary.present_count}</p>
            <p className="text-xs text-zinc-500 mt-0.5">Present</p>
          </div>
          <div className="bg-red-50 dark:bg-red-900/10 rounded-xl p-3">
            <p className="text-2xl font-black text-red-500">{summary.absent_count}</p>
            <p className="text-xs text-zinc-500 mt-0.5">Absent</p>
          </div>
          <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-3">
            <p className="text-2xl font-black text-zinc-700 dark:text-zinc-300">{summary.total_eligible}</p>
            <p className="text-xs text-zinc-500 mt-0.5">Total</p>
          </div>
        </div>
        <button onClick={onNew} className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition-all">
          Start New Session
        </button>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function TeacherAttendancePage() {
  const [phase, setPhase] = useState("create");
  const [session, setSession] = useState(null);
  const [closeSummary, setCloseSummary] = useState(null);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
          <BookOpen className="w-7 h-7 text-teal-500" /> Attendance
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">OTP and QR-based anti-proxy attendance.</p>
      </div>

      {phase === "create" && <CreateSessionForm onCreated={s => { setSession(s); setPhase("active"); }} />}
      {phase === "active" && session && <ActiveSessionView session={session} onClose={s => { setCloseSummary(s); setPhase("done"); }} />}
      {phase === "done" && closeSummary && <SessionSummary summary={closeSummary} onNew={() => { setSession(null); setCloseSummary(null); setPhase("create"); }} />}
    </div>
  );
}