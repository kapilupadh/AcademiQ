// client/src/components/attendance/OTPVerification.jsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import { Hash, QrCode, Camera, CheckCircle2, AlertTriangle } from "lucide-react";

/**
 * OTPVerification Component
 * Handles OTP input and QR code scanning for attendance
 * 
 * @param {Object} props
 * @param {string} props.mode - 'OTP' or 'QR'
 * @param {number} props.otpDigits - Number of OTP digits expected
 * @param {Function} props.onVerified - Callback when OTP/QR is verified
 * @param {Function} props.onCancel - Callback when cancelled
 */
export function OTPVerification({ mode = "OTP", otpDigits = 4, onVerified, onCancel }) {
  const [code, setCode] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [error, setError] = useState("");
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  // Use ref to store callback to avoid re-creating the effect when onVerified changes
  const onVerifiedRef = useRef(onVerified);
  useEffect(() => {
    onVerifiedRef.current = onVerified;
  }, [onVerified]);
  
  // Wrap handleVerified in useCallback with proper dependencies
  const handleVerified = useCallback((data) => {
    onVerifiedRef.current(data);
  }, []); // Empty deps since we use ref pattern

  // Handle OTP input change - only allow digits
  const handleCodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, otpDigits);
    setCode(value);
    setError("");
  };

  // Handle manual verification
  const handleVerify = () => {
    if (code.length !== otpDigits) {
      setError(`Please enter all ${otpDigits} digits`);
      return;
    }
    // OTP validation happens server-side when attendance is submitted
    // Just proceed to next step immediately
    handleVerified(code);
  };

  // Handle keyboard submit
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && code.length === otpDigits) {
      handleVerify();
    }
  };

  // QR Scanner functionality
  useEffect(() => {
    if (mode !== "QR" || !showScanner) return;

    let stream;
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: "environment" } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          scanQRCode();
        }
      } catch (err) {
        setError("Camera access denied. Please enable camera permissions.");
      }
    };

    const scanQRCode = () => {
      animRef.current = requestAnimationFrame(async () => {
        if (!videoRef.current || videoRef.current.readyState !== 4) {
          scanQRCode();
          return;
        }
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        ctx.drawImage(videoRef.current, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        try {
          const jsQR = (await import("jsqr")).default;
          const decoded = jsQR(imageData.data, imageData.width, imageData.height);
          if (decoded) {
            // QR code found
            setCode(decoded.data);
            setShowScanner(false);
            stream?.getTracks().forEach(t => t.stop());
            handleVerified(decoded.data);
            return;
          }
        } catch (err) {
          console.error("QR scanning error:", err);
          setError("QR scanning failed. Please try again or enter the code manually.");
        }
        scanQRCode();
      });
    };

    startCamera();

    return () => {
      cancelAnimationFrame(animRef.current);
      stream?.getTracks().forEach(t => t.stop());
    };
  }, [mode, showScanner]);

  const isComplete = code.length === otpDigits;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        {mode === "OTP" ? (
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <Hash className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <QrCode className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
        )}
        <div>
          <h3 className="font-semibold text-zinc-900 dark:text-white">
            {mode === "OTP" ? "Enter OTP Code" : "Scan QR Code"}
          </h3>
          <p className="text-xs text-zinc-500">
            {mode === "OTP" 
              ? `Enter the ${otpDigits}-digit code from your teacher`
              : "Scan the QR code displayed on teacher's screen"
            }
          </p>
        </div>
      </div>

      {/* Input Area */}
      {mode === "OTP" ? (
        <div className="space-y-2">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={otpDigits}
            value={code}
            onChange={handleCodeChange}
            onKeyDown={handleKeyDown}
            autoFocus
            placeholder={"•".repeat(otpDigits)}
            className="w-full px-4 py-4 bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:border-teal-500 dark:focus:border-teal-500 text-zinc-900 dark:text-white font-mono tracking-[0.5em] text-3xl text-center transition-colors"
          />
          <div className="flex justify-center gap-1">
            {Array.from({ length: otpDigits }).map((_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full transition-all ${
                  i < code.length
                    ? "bg-teal-500"
                    : "bg-zinc-200 dark:bg-zinc-700"
                }`}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {!showScanner ? (
            <button
              onClick={() => setShowScanner(true)}
              className="w-full py-6 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-500 hover:border-teal-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/10 transition-all flex flex-col items-center justify-center gap-2"
            >
              <Camera className="w-10 h-10" />
              <span className="font-medium">Tap to Open Camera</span>
              <span className="text-xs text-zinc-400">Position QR code within the frame</span>
            </button>
          ) : (
            <div className="relative rounded-xl overflow-hidden bg-black">
              <video
                ref={videoRef}
                className="w-full aspect-square object-cover"
                muted
                playsInline
              />
              <canvas ref={canvasRef} className="hidden" />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 border-4 border-white/80 rounded-2xl" />
              </div>
              <button
                onClick={() => setShowScanner(false)}
                className="absolute top-3 right-3 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
              >
                ×
              </button>
              <p className="absolute bottom-3 left-0 right-0 text-center text-white text-xs bg-black/50 py-1">
                Point camera at QR code
              </p>
            </div>
          )}
          {code && (
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>QR code scanned successfully!</span>
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl p-3">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        {onCancel && (
          <button
            onClick={onCancel}
            className="flex-1 py-3 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
        )}
        {mode === "OTP" && (
          <button
            onClick={handleVerify}
            disabled={!isComplete}
            className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 disabled:bg-zinc-300 dark:disabled:bg-zinc-700 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            Verify OTP
          </button>
        )}
      </div>
    </div>
  );
}

export default OTPVerification;
