// client/src/components/attendance/LocationValidator.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { MapPin, Navigation, AlertTriangle, CheckCircle2, Loader, RefreshCw, X } from "lucide-react";

/**
 * LocationValidator Component
 * Handles GPS location validation for attendance
 * 
 * @param {Object} props
 * @param {Object} props.allowedLocation - { latitude, longitude, radius_meters }
 * @param {Function} props.onLocationValidated - Callback with { latitude, longitude, isValid, distance }
 * @param {Function} props.onCancel - Callback when cancelled
 */
export function LocationValidator({ allowedLocation, onLocationValidated, onCancel }) {
  const [location, setLocation] = useState(null);
  const [status, setStatus] = useState("idle"); // idle, loading, success, error, out_of_range
  const [error, setError] = useState("");
  const [distance, setDistance] = useState(null);
  const [watchId, setWatchId] = useState(null);

  // Calculate distance between two points using Haversine formula
  const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }, []);

  // Get current location
  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const userLocation = { latitude, longitude, accuracy };
        setLocation(userLocation);

        // Check if within allowed range
        if (allowedLocation) {
          const dist = calculateDistance(
            latitude,
            longitude,
            allowedLocation.latitude,
            allowedLocation.longitude
          );
          setDistance(dist);

          const isValid = dist <= (allowedLocation.radius_meters || 100);
          setStatus(isValid ? "success" : "out_of_range");

          // Notify parent
          if (onLocationValidated) {
            onLocationValidated({
              latitude,
              longitude,
              isValid,
              distance: dist,
              accuracy,
            });
          }
        } else {
          // No location restriction, just record location
          setStatus("success");
          if (onLocationValidated) {
            onLocationValidated({
              latitude,
              longitude,
              isValid: true,
              distance: null,
              accuracy,
            });
          }
        }
      },
      (err) => {
        console.error("Geolocation error:", err);
        let errorMessage = "Unable to get your location.";
        
        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMessage = "Location permission denied. Please enable GPS and allow location access.";
            break;
          case err.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable. Please check your GPS.";
            break;
          case err.TIMEOUT:
            errorMessage = "Location request timed out. Please try again.";
            break;
          default:
            errorMessage = "Unable to get your location. Please try again.";
        }
        
        setError(errorMessage);
        setStatus("error");
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }, [allowedLocation, calculateDistance, onLocationValidated]);

  // Watch location for continuous monitoring
  const startWatching = useCallback(() => {
    if (!navigator.geolocation) return;

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setLocation({ latitude, longitude, accuracy });

        if (allowedLocation) {
          const dist = calculateDistance(
            latitude,
            longitude,
            allowedLocation.latitude,
            allowedLocation.longitude
          );
          setDistance(dist);

          const isValid = dist <= (allowedLocation.radius_meters || 100);
          const previousStatus = status;
          setStatus(isValid ? "success" : "out_of_range");
          
          // Notify parent when user moves within range
          if (isValid && previousStatus === "out_of_range" && onLocationValidated) {
            onLocationValidated({
              latitude,
              longitude,
              isValid: true,
              distance: dist,
              accuracy,
            });
          }
        }
      },
      (err) => {
        console.error("Watch position error:", err);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000,
      }
    );

    setWatchId(id);
  }, [allowedLocation, calculateDistance, onLocationValidated, status]);

  // Cleanup on unmount - use ref to always have latest watchId
  const watchIdRef = useRef(watchId);
  useEffect(() => {
    watchIdRef.current = watchId;
  }, [watchId]);
  
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Stop watching function
  const stopWatching = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
  }, [watchId]);

  // Format distance for display
  const formatDistance = (meters) => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
          status === "success"
            ? "bg-emerald-100 dark:bg-emerald-900/30"
            : status === "out_of_range"
            ? "bg-red-100 dark:bg-red-900/30"
            : status === "loading"
            ? "bg-blue-100 dark:bg-blue-900/30"
            : "bg-zinc-100 dark:bg-zinc-800"
        }`}>
          <MapPin className={`w-5 h-5 ${
            status === "success"
              ? "text-emerald-600 dark:text-emerald-400"
              : status === "out_of_range"
              ? "text-red-600 dark:text-red-400"
              : status === "loading"
              ? "text-blue-600 dark:text-blue-400 animate-pulse"
              : "text-zinc-500"
          }`} />
        </div>
        <div>
          <h3 className="font-semibold text-zinc-900 dark:text-white">Location Verification</h3>
          <p className="text-xs text-zinc-500">
            {allowedLocation 
              ? `You must be within ${allowedLocation.radius_meters || 100}m of the classroom`
              : "Recording your current location"
            }
          </p>
        </div>
      </div>

      {/* Location Not Configured Warning */}
      {!allowedLocation && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                Location Not Configured
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                The department location has not been set by the admin. Your current location will be recorded for verification.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Location Status */}
      <div className={`rounded-xl p-4 border ${
        status === "success"
          ? "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800"
          : status === "out_of_range"
          ? "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800"
          : status === "error"
          ? "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800"
          : status === "loading"
          ? "bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800"
          : "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
      }`}>
        {/* Idle State */}
        {status === "idle" && (
          <div className="text-center py-4">
            <Navigation className="w-8 h-8 mx-auto text-zinc-400 mb-2" />
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Tap the button below to get your location
            </p>
          </div>
        )}

        {/* Loading State */}
        {status === "loading" && (
          <div className="text-center py-4">
            <Loader className="w-8 h-8 mx-auto text-blue-500 animate-spin mb-2" />
            <p className="text-sm text-blue-600 dark:text-blue-400">
              Getting your location...
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              Make sure GPS is enabled
            </p>
          </div>
        )}

        {/* Success State */}
        {status === "success" && location && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-semibold">Location Verified</span>
            </div>
            {distance !== null && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Distance from classroom: <span className="font-semibold">{formatDistance(distance)}</span>
                {allowedLocation && (
                  <span className="text-emerald-600 dark:text-emerald-400 ml-2">
                    (within {allowedLocation.radius_meters || 100}m limit)
                  </span>
                )}
              </p>
            )}
            <p className="text-xs text-zinc-500">
              Accuracy: ±{Math.round(location.accuracy)}m
            </p>
          </div>
        )}

        {/* Out of Range State */}
        {status === "out_of_range" && location && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-semibold">Out of Range</span>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              You are <span className="font-semibold text-red-600 dark:text-red-400">{formatDistance(distance)}</span> away
              {allowedLocation && (
                <span>
                  {" "}from the classroom
                  (limit: {allowedLocation.radius_meters || 100}m)
                </span>
              )}
            </p>
            <p className="text-xs text-zinc-500">
              Please move closer to the classroom and try again
            </p>
          </div>
        )}

        {/* Error State */}
        {status === "error" && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-semibold">Location Error</span>
            </div>
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        {status !== "loading" && (
          <button
            onClick={getLocation}
            className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <MapPin className="w-5 h-5" />
            {status === "idle" ? "Get My Location" : "Refresh Location"}
          </button>
        )}

        {status === "out_of_range" && !watchId && (
          <button
            onClick={startWatching}
            className="w-full py-3 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Start Continuous Monitoring
          </button>
        )}

        {watchId !== null && (
          <button
            onClick={stopWatching}
            className="w-full py-3 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 font-semibold rounded-xl hover:bg-red-50 dark:hover:bg-red-900/50 transition-all flex items-center justify-center gap-2"
          >
            <X className="w-4 h-4" />
            Stop Monitoring
          </button>
        )}

        {onCancel && (
          <button
            onClick={onCancel}
            className="w-full py-2 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 text-sm transition-colors"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Info Notice */}
      <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl p-3">
        <p className="text-xs text-blue-600 dark:text-blue-400 flex items-start gap-2">
          <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            For accurate results, please enable High Accuracy mode in your GPS settings and ensure you're connected to the classroom Wi-Fi network.
          </span>
        </p>
      </div>
    </div>
  );
}

export default LocationValidator;
