import React, { useState, useEffect } from "react";
import api from "../../../services/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Navigation, Check, AlertTriangle, Loader2,
  Building2, Save, Crosshair, CheckCircle2, XCircle,
  Search, ChevronDown, ChevronLeft,
} from "lucide-react";

/* ─── Haversine distance ──────────────────────────────────────────── */
function getDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* ─── Geofence visual preview ─────────────────────────────────────── */
function LocationPreview({ coords, radius }) {
  if (!coords) return null;
  return (
    <div className="relative rounded-xl overflow-hidden h-48 lg:h-56 flex items-center justify-center border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
      {/* Grid */}
      <div
        className="absolute inset-0 opacity-[0.07] dark:opacity-[0.05]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg,#666 0,#666 1px,transparent 1px,transparent 36px),repeating-linear-gradient(90deg,#666 0,#666 1px,transparent 1px,transparent 36px)",
        }}
      />
      {/* Rings */}
      <div className="relative flex items-center justify-center">
        <div className="absolute rounded-full border border-zinc-400/30 bg-zinc-400/5 animate-pulse" style={{ width: 176, height: 176 }} />
        <div className="absolute rounded-full border border-zinc-400/20 bg-zinc-400/5" style={{ width: 116, height: 116 }} />
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-9 h-9 bg-zinc-900 dark:bg-zinc-100 rounded-full flex items-center justify-center shadow-md border-2 border-white dark:border-zinc-950">
            <MapPin className="w-4 h-4 text-white dark:text-zinc-900" />
          </div>
          <div className="w-px h-3 bg-zinc-900 dark:bg-zinc-100 opacity-60" />
          <div className="w-1.5 h-0.5 bg-zinc-900/30 dark:bg-zinc-100/30 rounded-full" />
        </div>
      </div>
      {/* Coords badge */}
      <div className="absolute bottom-3 left-3 right-3 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-sm border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 flex items-center justify-between shadow-sm">
        <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
          {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
        </span>
        <span className="text-[10px] font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
          <Crosshair className="w-3 h-3 text-zinc-500" /> {radius}m
        </span>
      </div>
    </div>
  );
}

/* ─── Dept skeleton ───────────────────────────────────────────────── */
function SkeletonDeptRow() {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 animate-pulse">
      <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 w-32 rounded bg-zinc-100 dark:bg-zinc-800" />
        <div className="h-2.5 w-16 rounded bg-zinc-100 dark:bg-zinc-800" />
      </div>
      <div className="w-2 h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 shrink-0" />
    </div>
  );
}

/* ─── Inline alert ────────────────────────────────────────────────── */
function AlertBanner({ message, icon: Icon = AlertTriangle }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-2.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl px-3.5 py-3 text-xs text-red-600 dark:text-red-400">
      <Icon className="w-3.5 h-3.5 shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  );
}

/* ─── Main ────────────────────────────────────────────────────────── */
export default function DepartmentLocation() {
  const [departments, setDepartments] = useState([]);
  const [loadingDepts, setLoadingDepts] = useState(true);
  const [search, setSearch] = useState("");

  const [selectedDept, setSelectedDept] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [coords, setCoords] = useState(null);
  const [radius, setRadius] = useState(50);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [locationAccuracy, setLocationAccuracy] = useState(null);
  const [locationError, setLocationError] = useState("");

  const [showManual, setShowManual] = useState(false);
  const [manualLat, setManualLat] = useState("");
  const [manualLng, setManualLng] = useState("");
  const [manualError, setManualError] = useState("");

  const [testDistance, setTestDistance] = useState(null);
  const [gettingTest, setGettingTest] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");

  // ── Fetch departments from DB ──────────────────────────────────────
  useEffect(() => {
    setLoadingDepts(true);
    api.get("/admin/departments")
      .then((r) => setDepartments(r.data))
      .catch((err) => console.error("Failed to load departments:", err))
      .finally(() => setLoadingDepts(false));
  }, []);

  // ── Load saved location when dept changes ──────────────────────────
  useEffect(() => {
    if (!selectedDept) return;
    setLoadingDetail(true);
    setSaveSuccess(false); setSaveError(""); setLocationError("");
    setTestDistance(null); setLocationAccuracy(null);
    api.get(`/admin/departments/${selectedDept.id}/location`)
      .then((r) => {
        if (r.data.latitude && r.data.longitude) {
          setCoords({ lat: r.data.latitude, lng: r.data.longitude });
          setRadius(r.data.geofence_radius || 50);
        } else {
          setCoords(null);
          setRadius(50);
        }
      })
      .catch(console.error)
      .finally(() => setLoadingDetail(false));
  }, [selectedDept]);

  const filteredDepts = departments.filter((d) =>
    d.name.toLowerCase().includes(search.trim().toLowerCase()) ||
    (d.code || "").toLowerCase().includes(search.trim().toLowerCase())
  );

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) { setLocationError("Geolocation not supported by your browser."); return; }
    setGettingLocation(true); setLocationError(""); setSaveSuccess(false);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationAccuracy(Math.round(pos.coords.accuracy));
        setGettingLocation(false);
      },
      () => { setLocationError("Location access denied. Please allow GPS and try again."); setGettingLocation(false); },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const handleManualApply = () => {
    const lat = parseFloat(manualLat), lng = parseFloat(manualLng);
    if (isNaN(lat) || isNaN(lng)) { setManualError("Invalid coordinates."); return; }
    if (lat < -90 || lat > 90) { setManualError("Latitude must be between -90 and 90."); return; }
    if (lng < -180 || lng > 180) { setManualError("Longitude must be between -180 and 180."); return; }
    setCoords({ lat, lng }); setManualError(""); setShowManual(false); setSaveSuccess(false);
  };

  const handleTest = () => {
    if (!navigator.geolocation || !coords) return;
    setGettingTest(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setTestDistance(Math.round(getDistanceMeters(pos.coords.latitude, pos.coords.longitude, coords.lat, coords.lng)));
        setGettingTest(false);
      },
      () => setGettingTest(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSave = async () => {
    if (!selectedDept || !coords) return;
    setSaving(true); setSaveError(""); setSaveSuccess(false);
    try {
      await api.patch(`/admin/departments/${selectedDept.id}/location`, {
        latitude: coords.lat,
        longitude: coords.lng,
        geofence_radius: radius,
      });
      setSaveSuccess(true);
      api.get("/admin/departments").then((r) => setDepartments(r.data));
      setTimeout(() => setSaveSuccess(false), 5000);
    } catch (err) {
      setSaveError(
        err.response?.data?.message ||
        (err.response?.status === 401 ? "Unauthorized — please log in again." :
          err.response?.status === 403 ? "Forbidden — admin access required." :
            err.message || "Failed to save location.")
      );
    } finally { setSaving(false); }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="min-h-screen bg-zinc-50 dark:bg-zinc-950"
    >
      <div className="max-w-6xl mx-auto p-5 sm:p-6 lg:p-8 space-y-6">

        {/* ── Page header ── */}
        <div className={selectedDept ? "hidden lg:block" : "block"}>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Department Locations
          </h1>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
            Set GPS coordinates and geofence radii. Students must be within this zone to mark attendance.
          </p>
        </div>

        {/* ── Two-panel layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 items-start">

          {/* ══ Left panel — Department list ══ */}
          <div className={`lg:col-span-2 ${selectedDept ? "hidden lg:flex" : "flex"} flex-col h-[calc(100vh-140px)] lg:h-[calc(100vh-11rem)] min-h-[500px] rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden`}>

            {/* Search header */}
            <div className="p-3 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search departments…"
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-all"
                />
              </div>
            </div>

            {/* Dept rows */}
            <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] p-2 space-y-0.5">
              {loadingDepts ? (
                Array.from({ length: 7 }).map((_, i) => <SkeletonDeptRow key={i} />)
              ) : filteredDepts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-zinc-400">
                  <Building2 className="w-7 h-7 opacity-30" />
                  <p className="text-xs">
                    {departments.length === 0 ? "No departments found." : "No match for your search."}
                  </p>
                </div>
              ) : (
                filteredDepts.map((d) => {
                  const hasLocation = d.latitude && d.longitude;
                  const isSelected = selectedDept?.id === d.id;
                  return (
                    <button
                      key={d.id}
                      onClick={() => setSelectedDept(d)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                        isSelected
                          ? "bg-zinc-100 dark:bg-zinc-800"
                          : "hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isSelected ? "bg-white dark:bg-zinc-700 shadow-sm border border-zinc-200 dark:border-zinc-600" : "bg-zinc-100 dark:bg-zinc-800"}`}>
                        <Building2 className={`w-3.5 h-3.5 ${hasLocation ? "text-zinc-700 dark:text-zinc-300" : "text-zinc-400 dark:text-zinc-600"}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-medium truncate ${isSelected ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-700 dark:text-zinc-300"}`}>
                          {d.name}
                        </p>
                        <p className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 mt-0.5">{d.code}</p>
                      </div>
                      {hasLocation ? (
                        <div className="w-1.5 h-1.5 rounded-full bg-zinc-500 dark:bg-zinc-400 shrink-0" />
                      ) : (
                        <div className="w-1.5 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700 shrink-0" />
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {!loadingDepts && departments.length > 0 && (
              <div className="px-4 py-2.5 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/30 shrink-0">
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 text-center tabular-nums">
                  {departments.filter((d) => d.latitude).length} of {departments.length} configured
                </p>
              </div>
            )}
          </div>

          {/* ══ Right panel — Location editor ══ */}
          <div className={`lg:col-span-3 ${!selectedDept ? "hidden lg:flex" : "flex"} flex-col lg:h-[calc(100vh-11rem)] min-h-[500px] rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden`}>

            {/* No dept selected */}
            {!selectedDept ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 p-10 text-center">
                <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-zinc-400 dark:text-zinc-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">No department selected</p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                    Choose a department from the list to configure its geofence.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-full overflow-hidden">

                {/* Dept header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedDept(null)}
                      className="lg:hidden p-1.5 -ml-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div className="w-9 h-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shrink-0">
                      <Building2 className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">
                        {selectedDept.name}
                      </h2>
                      <p className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 mt-0.5">
                        {selectedDept.code}
                      </p>
                    </div>
                  </div>
                  {coords && (
                    <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-semibold text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-2.5 py-1 rounded-full">
                      <CheckCircle2 className="w-3 h-3" /> Configured
                    </span>
                  )}
                </div>

                {/* Loading detail */}
                {loadingDetail ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-3 text-zinc-400">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <p className="text-xs">Loading location data…</p>
                  </div>
                ) : (
                  <>
                    {/* Scrollable editor body */}
                    <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] p-5 space-y-5">

                      {/* Visual preview or placeholder */}
                      {coords ? (
                        <LocationPreview coords={coords} radius={radius} />
                      ) : (
                        <div className="h-48 lg:h-56 rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex flex-col items-center justify-center gap-2 text-center p-6">
                          <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-1">
                            <MapPin className="w-5 h-5 text-zinc-400 dark:text-zinc-600" />
                          </div>
                          <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Location not configured</p>
                          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 max-w-[22ch]">
                            Capture your GPS position or enter coordinates manually below.
                          </p>
                        </div>
                      )}

                      {/* Alerts */}
                      <AnimatePresence>
                        {locationError && (
                          <motion.div key="loc-err" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                            <AlertBanner message={locationError} />
                          </motion.div>
                        )}
                        {saveError && (
                          <motion.div key="save-err" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                            <AlertBanner message={saveError} />
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Capture GPS */}
                      <div className="space-y-3">
                        <button
                          onClick={handleUseCurrentLocation}
                          disabled={gettingLocation}
                          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 disabled:opacity-50 transition-all"
                        >
                          {gettingLocation
                            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Acquiring GPS…</>
                            : <><Navigation className="w-3.5 h-3.5" /> Capture Current Location</>
                          }
                        </button>
                        {locationAccuracy && coords && (
                          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 flex items-center justify-center gap-1">
                            <Check className="w-3 h-3" /> GPS accuracy: ±{locationAccuracy}m
                          </p>
                        )}
                      </div>

                      {/* Manual entry */}
                      <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                        <button
                          onClick={() => { setShowManual(!showManual); setManualError(""); }}
                          className="w-full flex items-center justify-between px-4 py-3 bg-zinc-50 dark:bg-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition-colors"
                        >
                          <span className="flex items-center gap-2">
                            <Crosshair className="w-3.5 h-3.5" /> Enter Coordinates Manually
                          </span>
                          <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${showManual ? "rotate-180" : ""}`} />
                        </button>
                        <AnimatePresence>
                          {showManual && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="p-4 space-y-3 border-t border-zinc-100 dark:border-zinc-800">
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-[10px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">Latitude</label>
                                    <input
                                      type="text"
                                      value={manualLat}
                                      onChange={(e) => setManualLat(e.target.value)}
                                      placeholder="e.g. 24.8333"
                                      className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-all"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">Longitude</label>
                                    <input
                                      type="text"
                                      value={manualLng}
                                      onChange={(e) => setManualLng(e.target.value)}
                                      placeholder="e.g. 92.7789"
                                      className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-all"
                                    />
                                  </div>
                                </div>
                                {manualError && (
                                  <p className="text-[10px] text-red-500 flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" /> {manualError}
                                  </p>
                                )}
                                <div className="flex justify-end">
                                  <button
                                    onClick={handleManualApply}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold rounded-lg hover:opacity-90 transition-all"
                                  >
                                    Apply
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Radius + test — only shown when coords exist */}
                      {coords && (
                        <div className="space-y-4">
                          {/* Radius slider */}
                          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Geofence Radius</span>
                              <span className="text-xs font-mono bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 px-2 py-0.5 rounded-md tabular-nums">
                                {radius}m
                              </span>
                            </div>
                            <input
                              type="range"
                              min={10}
                              max={200}
                              step={5}
                              value={radius}
                              onChange={(e) => setRadius(Number(e.target.value))}
                              className="w-full accent-zinc-900 dark:accent-zinc-100"
                            />
                            <div className="flex justify-between text-[10px] text-zinc-400 dark:text-zinc-500">
                              <span>10m (Strict)</span>
                              <span>200m (Loose)</span>
                            </div>
                          </div>

                          {/* Test geofence */}
                          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div>
                              <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Test Geofence</p>
                              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                                Verify if you are within the configured boundary.
                              </p>
                            </div>
                            <button
                              onClick={handleTest}
                              disabled={gettingTest}
                              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 transition-all"
                            >
                              {gettingTest
                                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Testing…</>
                                : <><Navigation className="w-3.5 h-3.5" /> Test Boundary</>
                              }
                            </button>
                          </div>

                          {/* Test result */}
                          <AnimatePresence>
                            {testDistance !== null && (
                              <motion.div
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className={`flex items-center gap-2 text-xs font-medium px-4 py-3 rounded-xl border ${
                                  testDistance <= radius
                                    ? "bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300"
                                    : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400"
                                }`}
                              >
                                {testDistance <= radius
                                  ? <><CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> {testDistance}m away — Inside boundary</>
                                  : <><XCircle className="w-3.5 h-3.5 shrink-0" /> {testDistance}m away — Outside (need ≤{radius}m)</>
                                }
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </div>

                    {/* ── Save footer ── */}
                    <div className="px-5 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 shrink-0">
                      <button
                        onClick={handleSave}
                        disabled={saving || !coords}
                        className={`w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all shadow-sm disabled:opacity-50 ${
                          saveSuccess
                            ? "bg-zinc-700 dark:bg-zinc-200 text-white dark:text-zinc-900"
                            : "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:opacity-90"
                        }`}
                      >
                        {saving
                          ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>
                          : saveSuccess
                          ? <><CheckCircle2 className="w-3.5 h-3.5" /> Saved Successfully</>
                          : <><Save className="w-3.5 h-3.5" /> Save Configuration</>
                        }
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </motion.div>
  );
}