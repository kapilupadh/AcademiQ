// client/src/pages/student/Attendance/StudentAttendancePage.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import api from "../../../services/api";
import {
  CheckCircle2, XCircle, Clock, MapPin, Hash, QrCode,
  Loader, AlertTriangle, BookOpen, BarChart2,
  ChevronRight, ChevronDown, Camera, RefreshCw,
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────
const pctColor = (p) => p >= 75 ? "text-emerald-600 dark:text-emerald-400" : p >= 50 ? "text-amber-600 dark:text-amber-400" : "text-red-500";
const pctBg   = (p) => p >= 75 ? "bg-emerald-500" : p >= 50 ? "bg-amber-500" : "bg-red-500";
const fmt     = (d) => d ? new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";

function Countdown({ expiresAt }) {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    const calc = () => Math.max(0, Math.floor((new Date(expiresAt) - Date.now()) / 1000));
    setSecs(calc());
    const id = setInterval(() => setSecs(calc()), 1000);
    return () => clearInterval(id);
  }, [expiresAt]);
  const m = Math.floor(secs / 60), s = secs % 60;
  return <span className={`font-mono font-bold ${secs < 60 ? "text-red-500" : "text-emerald-500"}`}>{m}:{String(s).padStart(2, "0")}</span>;
}

// ── QR Scanner ────────────────────────────────────────────────────────────────
function QRScanner({ onScan }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [error, setError] = useState("");
  const animRef = useRef(null);

  useEffect(() => {
    let stream;
    const start = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); scan(); }
      } catch { setError("Camera access denied."); }
    };
    const scan = () => {
      animRef.current = requestAnimationFrame(async () => {
        if (!videoRef.current || videoRef.current.readyState !== 4) { scan(); return; }
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        ctx.drawImage(videoRef.current, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const jsQR = (await import("jsqr")).default;
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code) { onScan(code.data); return; }
        scan();
      });
    };
    start();
    return () => { cancelAnimationFrame(animRef.current); stream?.getTracks().forEach(t => t.stop()); };
  }, []);

  return error ? (
    <div className="text-red-500 text-sm text-center p-4">{error}</div>
  ) : (
    <div className="relative rounded-xl overflow-hidden bg-black aspect-square max-w-xs mx-auto">
      <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
      <canvas ref={canvasRef} className="hidden" />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-48 h-48 border-2 border-white/70 rounded-xl" />
      </div>
    </div>
  );
}

// ── Session Card ──────────────────────────────────────────────────────────────
function SessionCard({ session, onMark }) {
  const isMarked = session.already_marked;
  const canMark = session.is_active && session.otp_active && !isMarked;

  return (
    <div className={`border rounded-2xl p-4 transition-all ${
      isMarked ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/10"
      : canMark ? "border-teal-400 dark:border-teal-600 bg-white dark:bg-zinc-900 shadow-sm"
      : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 opacity-75"
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-semibold text-zinc-900 dark:text-white truncate">{session.subject?.name}</p>
            <span className="text-xs font-mono text-zinc-400 shrink-0">{session.subject?.code}</span>
          </div>
          <p className="text-xs text-zinc-500 flex items-center gap-1 mb-2">
            <Clock className="w-3.5 h-3.5" />{fmt(session.class_start_time)} — {fmt(session.class_end_time)}
            <span className="mx-1">·</span>
            {session.teacher_name}
          </p>

          {isMarked ? (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" /> Attendance marked
            </span>
          ) : !session.activated ? (
            <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> Waiting for teacher to activate
            </span>
          ) : !session.otp_active ? (
            <span className="text-xs text-red-500 flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5" /> OTP expired — ask teacher to regenerate
            </span>
          ) : (
            <span className="text-xs text-teal-600 dark:text-teal-400 flex items-center gap-1">
              Expires in <Countdown expiresAt={session.expires_at} />
            </span>
          )}
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${
            session.mode === "OTP"
              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
              : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
          }`}>
            {session.mode === "OTP" ? <Hash className="w-3 h-3" /> : <QrCode className="w-3 h-3" />}
            {session.mode}
          </span>
          {canMark && (
            <button onClick={() => onMark(session)}
              className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1">
              Mark <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Mark Attendance Modal ─────────────────────────────────────────────────────
function MarkAttendanceModal({ session, onSuccess, onClose }) {
  const [code, setCode] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [error, setError] = useState("");

  const getLocation = () => new Promise((resolve, reject) => {
    if (!navigator.geolocation) { reject(new Error("Geolocation not supported.")); return; }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => reject(new Error("Location access denied. Please enable GPS.")),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });

  const handleSubmit = async () => {
    if (!code.trim()) { setError("Please enter the OTP or scan QR."); return; }
    setSubmitting(true); setError(""); setGettingLocation(true);
    let location;
    try { location = await getLocation(); }
    catch (err) { setError(err.message); setSubmitting(false); setGettingLocation(false); return; }
    setGettingLocation(false);
    try {
      const res = await api.post("/attendance/submit", {
        session_id: session.id, code: code.trim(),
        latitude: location.latitude, longitude: location.longitude,
      });
      onSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Submission failed.");
    } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-md shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h3 className="font-bold text-zinc-900 dark:text-white">{session.subject?.name}</h3>
            <p className="text-xs text-zinc-500">{fmt(session.class_start_time)} — {fmt(session.class_end_time)}</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {session.mode === "OTP" ? (
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 flex items-center gap-1">
                <Hash className="w-4 h-4" /> Enter {session.otp_digits}-digit OTP from teacher
              </label>
              <input
                type="text" inputMode="numeric" maxLength={session.otp_digits}
                value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ""))}
                autoFocus placeholder={"•".repeat(session.otp_digits)}
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:border-teal-500 text-zinc-900 dark:text-white font-mono tracking-[0.5em] text-2xl text-center"
              />
            </div>
          ) : (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                <QrCode className="w-4 h-4" /> Scan QR Code from teacher's screen
              </label>
              {!showScanner ? (
                <button onClick={() => setShowScanner(true)}
                  className="w-full py-3 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-500 hover:border-teal-400 hover:text-teal-600 transition-all flex items-center justify-center gap-2 text-sm font-medium">
                  <Camera className="w-5 h-5" /> Open Camera to Scan
                </button>
              ) : (
                <QRScanner onScan={token => { setCode(token); setShowScanner(false); }} />
              )}
              {code && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> QR scanned successfully
                </p>
              )}
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl p-3">
              <AlertTriangle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}

          <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl p-3 text-xs text-blue-600 dark:text-blue-400 flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 shrink-0" /> GPS will be checked automatically. Make sure location is enabled.
          </div>

          <button onClick={handleSubmit} disabled={submitting || !code.trim()}
            className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {submitting
              ? gettingLocation
                ? <><MapPin className="w-4 h-4 animate-pulse" /> Getting location…</>
                : <><Loader className="w-4 h-4 animate-spin" /> Submitting…</>
              : <><CheckCircle2 className="w-4 h-4" /> Mark My Attendance</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Check-in Panel ────────────────────────────────────────────────────────────
function CheckInPanel() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeModal, setActiveModal] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");

  const fetchSessions = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await api.get("/attendance/active-sessions");
      setSessions(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load sessions.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const id = setInterval(fetchSessions, 30000);
    return () => clearInterval(id);
  }, [fetchSessions]);

  const handleSuccess = (data) => {
    setActiveModal(null);
    setSuccessMsg(data.message);
    fetchSessions(); // Refresh to show marked status
    setTimeout(() => setSuccessMsg(""), 5000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Active Classes</h2>
          <p className="text-sm text-zinc-500">Your current attendance sessions.</p>
        </div>
        <button onClick={fetchSessions} disabled={loading}
          className="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 text-emerald-600 dark:text-emerald-400 text-sm font-semibold">
          <CheckCircle2 className="w-5 h-5 shrink-0" />{successMsg}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl p-3">
          <AlertTriangle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 text-zinc-400 py-12">
          <Loader className="w-5 h-5 animate-spin" /> Looking for active sessions…
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-16 space-y-3 text-zinc-400">
          <Clock className="w-12 h-12 mx-auto opacity-20" />
          <p className="font-medium text-zinc-500">No active sessions right now</p>
          <p className="text-sm">Sessions appear here when your teacher activates attendance during class hours.</p>
          <button onClick={fetchSessions} className="mt-2 text-sm text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 mx-auto">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map(s => (
            <SessionCard key={s.id} session={s} onMark={setActiveModal} />
          ))}
        </div>
      )}

      {activeModal && (
        <MarkAttendanceModal session={activeModal} onSuccess={handleSuccess} onClose={() => setActiveModal(null)} />
      )}
    </div>
  );
}

// ── Attendance History ────────────────────────────────────────────────────────
function AttendanceHistory() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    api.get("/attendance/my")
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center gap-2 text-zinc-400 py-8 justify-center"><Loader className="w-5 h-5 animate-spin" /> Loading…</div>;
  if (!data?.subjects?.length) return (
    <div className="text-center py-12 text-zinc-400 space-y-2">
      <BarChart2 className="w-10 h-10 mx-auto opacity-20" />
      <p className="text-sm">No attendance records yet.</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {/* Overall stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Subjects", value: data.subjects.length, color: "text-blue-600 dark:text-blue-400" },
          { label: "Total Classes", value: data.total_records, color: "text-zinc-700 dark:text-zinc-300" },
          { label: "Avg Attendance", value: `${Math.round(data.subjects.reduce((s, x) => s + x.percentage, 0) / (data.subjects.length || 1))}%`, color: "text-teal-600 dark:text-teal-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-3 text-center">
            <p className={`text-xl font-black ${color}`}>{value}</p>
            <p className="text-xs text-zinc-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Per-subject breakdown */}
      {data.subjects.map(s => (
        <div key={s.subject_id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
          <button onClick={() => setExpanded(prev => ({ ...prev, [s.subject_id]: !prev[s.subject_id] }))}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
            <div className="text-left min-w-0">
              <p className="font-semibold text-zinc-900 dark:text-white text-sm truncate">{s.subject_name}</p>
              <p className="text-xs text-zinc-400">{s.subject_code} · {s.present}/{s.total} present</p>
            </div>
            <div className="flex items-center gap-3 shrink-0 ml-3">
              <div className="text-right">
                <p className={`text-lg font-black ${pctColor(s.percentage)}`}>{s.percentage}%</p>
                <div className="w-16 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden mt-0.5">
                  <div className={`h-full rounded-full transition-all ${pctBg(s.percentage)}`} style={{ width: `${s.percentage}%` }} />
                </div>
              </div>
              {expanded[s.subject_id] ? <ChevronDown className="w-4 h-4 text-zinc-400" /> : <ChevronRight className="w-4 h-4 text-zinc-400" />}
            </div>
          </button>

          {expanded[s.subject_id] && (
            <div className="border-t border-zinc-100 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800 max-h-64 overflow-y-auto">
              {s.records.map((r, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-2.5">
                  <div>
                    <p className="text-sm text-zinc-900 dark:text-white">
                      {new Date(r.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                    {r.class_time && <p className="text-xs text-zinc-400">{r.class_time}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {r.verified && <span className="text-xs text-zinc-400">✓</span>}
                    {r.status === "PRESENT"
                      ? <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="w-4 h-4" /> Present</span>
                      : r.status === "ABSENT"
                      ? <span className="flex items-center gap-1 text-xs font-bold text-red-500"><XCircle className="w-4 h-4" /> Absent</span>
                      : <span className="flex items-center gap-1 text-xs font-bold text-amber-600"><Clock className="w-4 h-4" /> {r.status}</span>
                    }
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────
export default function StudentAttendancePage() {
  const [tab, setTab] = useState("checkin");

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
          <BookOpen className="w-7 h-7 text-teal-500" /> Attendance
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">Mark attendance or view your records.</p>
      </div>

      <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800/50 p-1 rounded-xl w-fit">
        {[
          { v: "checkin", label: "Mark Attendance", icon: CheckCircle2 },
          { v: "history", label: "My Records", icon: BarChart2 },
        ].map(({ v, label, icon: Icon }) => (
          <button key={v} onClick={() => setTab(v)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === v ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"}`}>
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
        {tab === "checkin" ? <CheckInPanel /> : <AttendanceHistory />}
      </div>
    </div>
  );
}