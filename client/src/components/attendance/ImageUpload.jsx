// client/src/components/attendance/ImageUpload.jsx
import React, { useState, useRef, useCallback, useEffect } from "react";
import { Camera, X, CheckCircle2, AlertTriangle, RefreshCw, Image as ImageIcon } from "lucide-react";

/**
 * ImageUpload Component
 * Handles camera capture for attendance verification (camera-only system)
 * 
 * @param {Object} props
 * @param {Function} props.onImageCaptured - Callback with { file, dataUrl } when image is captured
 * @param {Function} props.onCancel - Callback when cancelled
 * @param {boolean} props.required - Whether image is mandatory (default: true)
 */
export function ImageUpload({ onImageCaptured, onCancel, required = true }) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState("");
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const previewUrlRef = useRef(null); // Track current preview URL for proper cleanup

  // Start camera for capture
  const startCamera = useCallback(async () => {
    setError("");
    setIsCapturing(true);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 }
      });
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(err => {
          console.warn("Video play failed:", err);
        });
      }
    } catch (err) {
      console.error("Camera error:", err);
      setError("Camera access denied. Please enable camera permissions in your browser settings.");
      setIsCapturing(false);
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCapturing(false);
  }, []);

  // Capture photo from video
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    
    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Get image as data URL (JPEG for smaller size)
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    
    // Convert to blob for upload
    canvas.toBlob((blob) => {
      if (blob) {
        // Use crypto API for secure random filename generation
        const array = new Uint8Array(8);
        crypto.getRandomValues(array);
        const uniqueSuffix = Date.now() + '-' + Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
        const file = new File([blob], `attendance-${uniqueSuffix}.jpg`, { type: "image/jpeg" });
        
        setPreviewUrl(dataUrl);
        previewUrlRef.current = dataUrl; // Keep ref in sync for cleanup
        stopCamera();
        
        // Notify parent
        if (onImageCaptured) {
          onImageCaptured({ file, dataUrl });
        }
      } else {
        // Handle case when canvas.toBlob fails
        setError("Failed to capture image. Please try again.");
        setIsCapturing(false);
        stopCamera();
      }
    }, "image/jpeg", 0.8);
  }, [onImageCaptured, stopCamera]);

  // Retake/Reset image
  const handleRetake = useCallback(() => {
    setPreviewUrl(null);
    previewUrlRef.current = null;
    setError("");
  }, []);

  // Cleanup camera stream on unmount
  React.useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Cleanup blob URL on component unmount
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
          <Camera className="w-5 h-5 text-orange-600 dark:text-orange-400" />
        </div>
        <div>
          <h3 className="font-semibold text-zinc-900 dark:text-white">Verify Your Identity</h3>
          <p className="text-xs text-zinc-500">
            {required ? "Photo capture is required to complete attendance" : "Take a photo to verify your identity"}
          </p>
        </div>
      </div>

      {/* Camera / Preview Area */}
      <div className="relative">
        {/* Live Camera View */}
        {isCapturing && (
          <div className="relative rounded-xl overflow-hidden bg-black aspect-[4/3]">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              muted
              playsInline
            />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Face guide overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-48 border-4 border-white/60 rounded-full" />
            </div>
            
            {/* Instructions */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <p className="text-white text-sm text-center">
                Position your face within the circle
              </p>
            </div>
            
            {/* Close button */}
            <button
              onClick={stopCamera}
              className="absolute top-3 right-3 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            {/* Capture button */}
            <button
              onClick={capturePhoto}
              className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all"
            >
              <div className="w-14 h-14 bg-orange-500 rounded-full flex items-center justify-center">
                <div className="w-12 h-12 bg-white rounded-full" />
              </div>
            </button>
          </div>
        )}

        {/* Captured Image Preview */}
        {previewUrl && !isCapturing && (
          <div className="relative rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 aspect-[4/3]">
            <img
              src={previewUrl}
              alt="Captured"
              className="w-full h-full object-cover"
            />
            
            {/* Success overlay */}
            <div className="absolute top-3 left-3 bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Photo Captured
            </div>
          </div>
        )}

        {/* Empty State - Camera Only */}
        {!isCapturing && !previewUrl && (
          <div className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl p-8 text-center bg-zinc-50 dark:bg-zinc-800/50">
            <Camera className="w-12 h-12 mx-auto text-zinc-300 dark:text-zinc-600 mb-3" />
            <p className="text-sm text-zinc-500 mb-4">Camera will open when you tap the button below</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {!previewUrl ? (
        <div className="space-y-3">
          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl p-3">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Capture from Camera */}
          <button
            onClick={startCamera}
            disabled={isCapturing}
            className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 disabled:bg-zinc-300 dark:disabled:bg-zinc-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 relative z-50"
          >
            <Camera className="w-5 h-5" />
            Take Photo with Camera
          </button>

          {/* Cancel Button */}
          {onCancel && (
            <button
              onClick={onCancel}
              className="w-full py-2 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 text-sm transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Retake Button */}
          <button
            onClick={handleRetake}
            className="w-full py-3 border-2 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Retake Photo
          </button>

          {/* Required Notice */}
          {required && (
            <p className="text-xs text-zinc-400 text-center">
              ✓ Photo is required to mark attendance
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default ImageUpload;
