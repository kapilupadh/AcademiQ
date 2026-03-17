// client/src/pages/student/Attendance/StudentAttendancePage.jsx
import React, { useState, useEffect, useRef } from "react";
import api from "../../../services/api";
import {
  CheckCircle2, XCircle, Clock, MapPin, Hash, QrCode,
  Loader, AlertTriangle, BookOpen, BarChart2, ChevronDown,
  ChevronRight, Camera,
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────
const pctColor = (p) => p >= 75 ? "text-emerald-600 dark:text-emerald-400" : p >= 50 ? "text-amber-600 dark:text-amber-400" : "text-red-500";
const pctBg = (p) => p >= 75 ? "bg-emerald-500" : p >= 50 ? "bg-amber-500" : "bg-red-500";

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

// ── QR Scanner using jsQR ─────────────────────────────────────────────────────
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
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          scan();
        }
      } catch {
        setError("Camera access denied. Please allow camera permission.");
      }
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
        // Dynamically import jsQR
        const jsQR = (await import("jsqr")).default;
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code) { onScan(code.data); return; }
        scan();
      });
    };

    start();
    return () => {
      cancelAnimationFrame(animRef.current);
      stream?.getTracks().forEach(t => t.stop());
    };
  }, []);

  return (
    <div className="space-y-3">
      {error ? (
        <div className="text-red-500 text-sm text-center p-4">{error}</div>
      ) : (
        <div className="relative rounded-xl overflow-hidden bg-black aspect-square max-w-xs mx-auto">
          <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
          <canvas ref={canvasRef} className="hidden" />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-48 h-48 border-2 border-white/70 rounded-xl" />
          </div>
        </div>
      )}
      <p className="text-xs text-zinc-400 text-center">Point camera at the QR code</p>
    </div>
  );
}

// ── Check-in Panel ────────────────────────────────────────────────────────────
function CheckInPanel() {
  const [sessionId, setSessionId] = useState("");
  const [sessionInfo, setSessionInfo] = useState(null);
  const [loadingSession, setLoadingSession] = useState(false);
  const [sessionError, setSessionError] = useState("");

  const [code, setCode] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [result, setResult] = useState(null);
  const [submitError, setSubmitError] = useState("");

  const fetchSession = async () => {
    if (!sessionId.trim()) return;
    setLoadingSession(true); setSessionError(""); setSessionInfo(null);
    try {
      const res = await api.get(`/attendance/sessions/${sessionId.trim()}/available`);
      setSessionInfo(res.data);
    } catch (err) {
      setSessionError(err.response?.data?.message || "Session not found.");
    } finally { setLoadingSession(false); }
  };

  const getLocation = () => new Promise((resolve, reject) => {
    if (!navigator.geolocation) { reject(new Error("Geolocation not supported.")); return; }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => reject(new Error("Location access denied. Please enable GPS.")),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });

  const handleSubmit = async () => {
    if (!code.trim()) { setSubmitError("Please enter the OTP or scan QR."); return; }
    setSubmitting(true); setSubmitError(""); setGettingLocation(true);

    let location;
    try {
      location = await getLocation();
    } catch (err) {
      setSubmitError(err.message);
      setSubmitting(false); setGettingLocation(false);
      return;
    }
    setGettingLocation(false);

    try {
      const res = await api.post("/attendance/submit", {
        session_id: sessionInfo.id,
        code: code.trim(),
        latitude: location.latitude,
        longitude: location.longitude,
      });
      setResult({ success: true, message: res.data.message, distance: res.data.distance_meters });
    } catch (err) {
      setSubmitError(err.response?.data?.message || "Submission failed.");
    } finally { setSubmitting(false); }
  };

  const handleQRScan = (token) => {
    setShowScanner(false);
    setCode(token);
  };

  if (result?.success) {
    return (
      <div className="text-center space-y-4 py-8">
        <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
        <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Attendance Marked!</h3>
        <p className="text-zinc-500 text-sm">{result.message}</p>
        {result.distance !== undefined && (
          <p className="text-xs text-zinc-400 flex items-center gap-1 justify-center">
            <MapPin className="w-3.5 h-3.5" /> {Math.round(result.distance)}m from classroom
          </p>
        )}
        <button onClick={() => { setResult(null); setCode(""); setSessionInfo(null); setSessionId(""); }}
          className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition-all">
          Mark Another
        </button>
      </div>
    );
  }

  const INPUT = "w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:border-teal-500 text-zinc-900 dark:text-white text-sm";

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">Mark Attendance</h2>
        <p className="text-sm text-zinc-500">Enter the session ID provided by your teacher, then submit the OTP or scan the QR.</p>
      </div>

      {/* Session ID lookup */}
      <div className="flex gap-2">
        <input value={sessionId} onChange={e => setSessionId(e.target.value)}
          onKeyDown={e => e.key === "Enter" && fetchSession()}
          placeholder="Paste session ID from teacher…" className={`${INPUT} flex-1`} />
        <button onClick={fetchSession} disabled={loadingSession || !sessionId.trim()}
          className="px-4 py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold rounded-xl disabled:opacity-50 transition-all text-sm">
          {loadingSession ? <Loader className="w-4 h-4 animate-spin" /> : "Find"}
        </button>
      </div>

      {sessionError && (
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl p-3">
          <AlertTriangle className="w-4 h-4 shrink-0" />{sessionError}
        </div>
      )}

      {/* Session info */}
      {sessionInfo && (
        <div className={`border rounded-xl p-4 space-y-1 ${sessionInfo.is_active && sessionInfo.within_window ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/10" : "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/10"}`}>
          <p className="font-semibold text-zinc-900 dark:text-white text-sm">{sessionInfo.subject?.name}</p>
          <p className="text-xs text-zinc-500 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {new Date(sessionInfo.class_start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} —
            {new Date(sessionInfo.class_end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
          {sessionInfo.otp_active && sessionInfo.expires_at && (
            <p className="text-xs text-zinc-500 flex items-center gap-1">
              Expires in <Countdown expiresAt={sessionInfo.expires_at} />
            </p>
          )}
          {!sessionInfo.within_window && <p className="text-xs text-red-500 font-semibold">Class window has ended.</p>}
          {!sessionInfo.activated && <p className="text-xs text-amber-500">Teacher hasn't activated attendance yet.</p>}
          {!sessionInfo.otp_active && sessionInfo.activated && sessionInfo.within_window && (
            <p className="text-xs text-amber-500">OTP/QR has expired — ask teacher to regenerate.</p>
          )}
        </div>
      )}

      {/* Code entry */}
      {sessionInfo?.is_active && sessionInfo?.within_window && sessionInfo?.otp_active && (
        <div className="space-y-3">
          {sessionInfo.mode === "OTP" ? (
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1">
                <Hash className="w-4 h-4" /> Enter {sessionInfo.otp_digits}-digit OTP
              </label>
              <input
                type="text" inputMode="numeric" maxLength={sessionInfo.otp_digits}
                value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder={`${"•".repeat(sessionInfo.otp_digits)}`}
                className={`${INPUT} tracking-[0.5em] text-center text-xl font-mono`}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                <QrCode className="w-4 h-4" /> Scan QR Code
              </label>
              {!showScanner ? (
                <button onClick={() => setShowScanner(true)}
                  className="w-full py-3 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-500 hover:border-teal-400 hover:text-teal-600 transition-all flex items-center justify-center gap-2 text-sm font-medium">
                  <Camera className="w-5 h-5" /> Open Camera to Scan
                </button>
              ) : (
                <QRScanner onScan={handleQRScan} />
              )}
              {code && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> QR scanned successfully
                </p>
              )}
            </div>
          )}

          {submitError && (
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl p-3">
              <AlertTriangle className="w-4 h-4 shrink-0" />{submitError}
            </div>
          )}

          <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl p-3 text-xs text-blue-600 dark:text-blue-400 flex items-start gap-2">
            <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            Your GPS location will be verified automatically when you submit. Make sure location is enabled.
          </div>

          <button onClick={handleSubmit} disabled={submitting || !code.trim()}
            className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {submitting ? (
              gettingLocation
                ? <><MapPin className="w-4 h-4 animate-pulse" /> Getting location…</>
                : <><Loader className="w-4 h-4 animate-spin" /> Submitting…</>
            ) : (
              <><CheckCircle2 className="w-4 h-4" /> Mark My Attendance</>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

// ── My Attendance History ─────────────────────────────────────────────────────
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
  if (!data?.subjects?.length) return <div className="text-center py-12 text-zinc-400 text-sm">No attendance records yet.</div>;

  return (
    <div className="space-y-3">
      {data.subjects.map(s => (
        <div key={s.subject_id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
          <button onClick={() => setExpanded(prev => ({ ...prev, [s.subject_id]: !prev[s.subject_id] }))}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
            <div className="text-left min-w-0">
              <p className="font-semibold text-zinc-900 dark:text-white text-sm truncate">{s.subject_name}</p>
              <p className="text-xs text-zinc-400">{s.subject_code} · {s.present}/{s.total} classes</p>
            </div>
            <div className="flex items-center gap-3 shrink-0 ml-3">
              <div className="text-right">
                <p className={`text-lg font-black ${pctColor(s.percentage)}`}>{s.percentage}%</p>
                <div className="w-16 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${pctBg(s.percentage)}`} style={{ width: `${s.percentage}%` }} />
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
                    {r.verified && <span className="text-xs text-zinc-400">✓ verified</span>}
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
        <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">Mark your attendance or view your records.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800/50 p-1 rounded-xl w-fit">
        {[{ v: "checkin", label: "Mark Attendance", icon: CheckCircle2 }, { v: "history", label: "My Records", icon: BarChart2 }].map(({ v, label, icon: Icon }) => (
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