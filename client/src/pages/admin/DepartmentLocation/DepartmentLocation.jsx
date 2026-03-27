// client/src/pages/admin/DepartmentLocation/DepartmentLocation.jsx
import React, { useState, useEffect } from "react";
import api from "../../../services/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Navigation, Check, AlertTriangle, Loader2,
  Building2, Save, Crosshair, CheckCircle2, XCircle,
  Search, ChevronDown, ChevronLeft
} from "lucide-react";

// ── Haversine distance ────────────────────────────────────────────────────────
function getDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// ── Visual geofence preview ───────────────────────────────────────────────────
function LocationPreview({ coords, radius }) {
  if (!coords) return null;
  return (
    <div className="relative bg-zinc-100/50 dark:bg-zinc-900/50 rounded-lg overflow-hidden h-48 lg:h-60 flex items-center justify-center border border-zinc-200 dark:border-zinc-800">
      {/* Grid background */}
      <div className="absolute inset-0 opacity-20 dark:opacity-10"
        style={{ backgroundImage: "repeating-linear-gradient(0deg,#888 0,#888 1px,transparent 1px,transparent 40px),repeating-linear-gradient(90deg,#888 0,#888 1px,transparent 1px,transparent 40px)" }} />
      {/* Geofence rings */}
      <div className="relative flex items-center justify-center">
        <div className="absolute rounded-full border border-emerald-500/40 bg-emerald-500/10 animate-pulse" style={{ width: 180, height: 180 }} />
        <div className="absolute rounded-full border border-emerald-500/50 bg-emerald-500/5" style={{ width: 120, height: 120 }} />
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-10 h-10 bg-zinc-900 dark:bg-zinc-100 rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-zinc-950">
            <MapPin className="w-5 h-5 text-white dark:text-zinc-900" />
          </div>
          <div className="w-0.5 h-3 bg-zinc-900 dark:bg-zinc-100" />
          <div className="w-2 h-1 bg-zinc-900/40 dark:bg-zinc-100/40 rounded-full" />
        </div>
      </div>
      {/* Coords badge */}
      <div className="absolute bottom-3 left-3 right-3 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-sm border border-zinc-200 dark:border-zinc-800 rounded-md px-3 py-2 flex items-center justify-between shadow-sm">
        <span className="text-xs font-mono text-zinc-600 dark:text-zinc-400">
          {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
        </span>
        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
          <Crosshair className="w-3 h-3 text-emerald-500" /> {radius}m
        </span>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
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

  // ── Fetch all departments directly ───────────────────────────────────────
  useEffect(() => {
    setLoadingDepts(true);
    api.get("/admin/departments")
      .then(r => setDepartments(r.data))
      .catch(err => console.error("Failed to load departments:", err))
      .finally(() => setLoadingDepts(false));
  }, []);

  // ── Load saved location when dept selected ───────────────────────────────
  useEffect(() => {
    if (!selectedDept) return;
    setLoadingDetail(true);
    setSaveSuccess(false); setSaveError(""); setLocationError("");
    setTestDistance(null); setLocationAccuracy(null);
    api.get(`/admin/departments/${selectedDept.id}/location`)
      .then(r => {
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

  const filteredDepts = departments.filter(d =>
    d.name.toLowerCase().includes(search.trim().toLowerCase()) ||
    (d.code || "").toLowerCase().includes(search.trim().toLowerCase())
  );

  // ── Use current GPS location ──────────────────────────────────────────────
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) { setLocationError("Geolocation not supported by your browser."); return; }
    setGettingLocation(true); setLocationError(""); setSaveSuccess(false);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationAccuracy(Math.round(pos.coords.accuracy));
        setGettingLocation(false);
      },
      () => { setLocationError("Location access denied. Please allow GPS and try again."); setGettingLocation(false); },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  // ── Manual coordinates ────────────────────────────────────────────────────
  const handleManualApply = () => {
    const lat = parseFloat(manualLat), lng = parseFloat(manualLng);
    if (isNaN(lat) || isNaN(lng)) { setManualError("Invalid coordinates."); return; }
    if (lat < -90 || lat > 90) { setManualError("Latitude must be between -90 and 90."); return; }
    if (lng < -180 || lng > 180) { setManualError("Longitude must be between -180 and 180."); return; }
    setCoords({ lat, lng }); setManualError(""); setShowManual(false); setSaveSuccess(false);
  };

  // ── Test geofence ─────────────────────────────────────────────────────────
  const handleTest = () => {
    if (!navigator.geolocation || !coords) return;
    setGettingTest(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setTestDistance(Math.round(getDistanceMeters(pos.coords.latitude, pos.coords.longitude, coords.lat, coords.lng)));
        setGettingTest(false);
      },
      () => setGettingTest(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!selectedDept || !coords) return;
    setSaving(true); setSaveError(""); setSaveSuccess(false);
    
    const payload = {
      latitude: coords.lat, 
      longitude: coords.lng, 
      geofence_radius: radius,
    };
    
    try {
      const response = await api.patch(`/admin/departments/${selectedDept.id}/location`, payload);
      setSaveSuccess(true);
      api.get("/admin/departments").then(r => setDepartments(r.data));
      setTimeout(() => setSaveSuccess(false), 5000);
    } catch (err) {
      // Show the actual error message from backend or a more helpful message
      const errorMsg = err.response?.data?.message || 
                       (err.response?.status === 401 ? "Unauthorized - please login again" :
                        err.response?.status === 403 ? "Forbidden - admin access required" :
                        err.message || "Failed to save location. Check console for details.");
      setSaveError(errorMsg);
    } finally { setSaving(false); }
  };

  // shadcn/ui inspired utility classes
  const INPUT_CLS = "flex h-10 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm transition-colors placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300";
  const LABEL_CLS = "text-sm font-medium leading-none text-zinc-900 dark:text-zinc-100 peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-2 block";
  const CARD_CLS = "rounded-xl border border-zinc-200 bg-white text-zinc-950 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 overflow-hidden flex flex-col";
  const BTN_PRIMARY_CLS = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 disabled:pointer-events-none disabled:opacity-50 bg-zinc-900 text-zinc-50 hover:bg-zinc-900/90 h-10 px-4 py-2 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-50/90";
  const BTN_OUTLINE_CLS = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 border border-zinc-200 bg-transparent hover:bg-zinc-100 hover:text-zinc-900 h-9 px-4 py-2 dark:border-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 w-full";

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="max-w-6xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8 p-4 sm:p-6 lg:p-8"
    >
      {/* Header Section (Hidden on mobile when a dept is selected to save space) */}
      <div className={selectedDept ? "hidden lg:block" : "block"}>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
          Department Locations
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Set GPS coordinates and geofence radii. Students must be within this zone to mark attendance.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 sm:gap-8 items-start">

        {/* ── Left: Department list (Hidden on mobile if a dept is selected) ── */}
        <div className={`lg:col-span-2 h-[calc(100vh-140px)] lg:h-[calc(100vh-12rem)] min-h-[500px] ${selectedDept ? "hidden lg:flex" : "flex"} ${CARD_CLS}`}>
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 shrink-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500 dark:text-zinc-400" />
              <input 
                type="text" 
                value={search} 
                onChange={e => setSearch(e.target.value)}
                placeholder="Search departments…"
                className={`${INPUT_CLS} pl-9 bg-white dark:bg-zinc-950`} 
              />
            </div>
          </div>

          {/* Scrollable list with explicitly hidden scrollbars */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {loadingDepts ? (
              <div className="flex flex-col items-center justify-center h-full text-zinc-500 dark:text-zinc-400">
                <Loader2 className="w-6 h-6 animate-spin mb-2" />
                <span className="text-sm font-medium">Loading departments...</span>
              </div>
            ) : filteredDepts.length === 0 ? (
              <div className="text-center py-10 text-sm text-zinc-500 dark:text-zinc-400">
                {departments.length === 0 ? "No departments found." : "No match for your search."}
              </div>
            ) : (
              filteredDepts.map(d => {
                const hasLocation = d.latitude && d.longitude;
                const isSelected = selectedDept?.id === d.id;
                return (
                  <button 
                    key={d.id} 
                    onClick={() => setSelectedDept(d)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-colors text-sm
                      ${isSelected 
                        ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50" 
                        : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                      }`}
                  >
                    <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${isSelected ? 'bg-white dark:bg-zinc-700 shadow-sm' : 'bg-zinc-100 dark:bg-zinc-800'}`}>
                      <Building2 className={`w-4 h-4 ${hasLocation ? "text-emerald-500" : "text-zinc-400 dark:text-zinc-500"}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{d.name}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">{d.code}</p>
                    </div>
                    {hasLocation ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-700 shrink-0 mr-1" />
                    )}
                  </button>
                );
              })
            )}
          </div>
          
          {/* Summary Footer */}
          {!loadingDepts && departments.length > 0 && (
            <div className="p-3 text-xs text-center border-t border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 bg-zinc-50/50 dark:bg-zinc-900/50 shrink-0">
              {departments.filter(d => d.latitude).length} of {departments.length} configured
            </div>
          )}
        </div>

        {/* ── Right: Location editor (Hidden on mobile if NO dept is selected) ── */}
        <div className={`lg:col-span-3 lg:h-[calc(100vh-12rem)] ${!selectedDept ? "hidden lg:flex" : "flex"} ${CARD_CLS}`}>
          {!selectedDept ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[500px] text-zinc-500 dark:text-zinc-400 p-8 text-center">
              <div className="w-16 h-16 mb-4 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                <MapPin className="w-8 h-8 opacity-50" />
              </div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">No Department Selected</p>
              <p className="text-sm mt-1">Select a department from the list to configure its geofence.</p>
            </div>
          ) : (
            <div className="flex flex-col h-full overflow-hidden">
              
              {/* Dept Header */}
              <div className="p-4 sm:p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50 shrink-0">
                <div className="flex items-center gap-3 sm:gap-4">
                  {/* Mobile Back Button */}
                  <button 
                    onClick={() => setSelectedDept(null)}
                    className="lg:hidden p-2 -ml-2 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white dark:bg-zinc-800 rounded-lg flex items-center justify-center shadow-sm border border-zinc-200 dark:border-zinc-700 shrink-0">
                    <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-zinc-700 dark:text-zinc-300" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-base sm:text-lg text-zinc-900 dark:text-zinc-50 leading-tight">{selectedDept.name}</h2>
                    <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">{selectedDept.code}</p>
                  </div>
                </div>
                {coords && (
                  <span className="hidden sm:flex text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-2.5 py-1 rounded-full items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                  </span>
                )}
              </div>

              {loadingDetail ? (
                <div className="flex flex-col items-center justify-center flex-1 text-zinc-500 dark:text-zinc-400">
                  <Loader2 className="w-8 h-8 animate-spin mb-4 text-zinc-900 dark:text-zinc-100" />
                  <p className="text-sm font-medium">Loading location data...</p>
                </div>
              ) : (
                <>
                  {/* Scrollable editor body */}
                  <div className="p-4 sm:p-6 space-y-6 flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {/* Visual preview */}
                    {coords ? (
                      <LocationPreview coords={coords} radius={radius} />
                    ) : (
                      <div className="h-48 lg:h-60 bg-zinc-50 dark:bg-zinc-900 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg flex flex-col items-center justify-center gap-2 text-zinc-500 dark:text-zinc-400 p-4 text-center">
                        <MapPin className="w-8 h-8 opacity-40 mb-2" />
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Location Not Configured</p>
                        <p className="text-xs max-w-xs">Use your current GPS location or enter coordinates manually to set up the geofence.</p>
                      </div>
                    )}

                    {/* Alerts */}
                    <AnimatePresence>
                      {locationError && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                          <div className="flex items-center gap-3 bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 p-3 rounded-md border border-red-200 dark:border-red-900/50 text-sm font-medium mb-4">
                            <AlertTriangle className="w-4 h-4 shrink-0" /> {locationError}
                          </div>
                        </motion.div>
                      )}
                      {saveError && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                          <div className="flex items-center gap-3 bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 p-3 rounded-md border border-red-200 dark:border-red-900/50 text-sm font-medium mb-4">
                            <AlertTriangle className="w-4 h-4 shrink-0" /> {saveError}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="space-y-4">
                      <button 
                        onClick={handleUseCurrentLocation} 
                        disabled={gettingLocation}
                        className={BTN_OUTLINE_CLS}
                      >
                        {gettingLocation ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Navigation className="w-4 h-4 mr-2" />}
                        {gettingLocation ? "Acquiring GPS Signal..." : "Capture Current Location"}
                      </button>

                      {locationAccuracy && coords && (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 justify-center">
                          <Check className="w-3.5 h-3.5" /> GPS Accuracy: ±{locationAccuracy}m
                        </p>
                      )}

                      {/* Manual entry toggle */}
                      <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
                        <button 
                          onClick={() => { setShowManual(!showManual); setManualError(""); }}
                          className="w-full flex items-center justify-between text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                        >
                          <span className="flex items-center gap-2"><Crosshair className="w-4 h-4" /> Enter Coordinates Manually</span>
                          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showManual ? "rotate-180" : ""}`} />
                        </button>

                        <AnimatePresence>
                          {showManual && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="pt-4 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className={LABEL_CLS}>Latitude</label>
                                    <input type="text" value={manualLat} onChange={e => setManualLat(e.target.value)} placeholder="e.g. 24.8333" className={INPUT_CLS} />
                                  </div>
                                  <div>
                                    <label className={LABEL_CLS}>Longitude</label>
                                    <input type="text" value={manualLng} onChange={e => setManualLng(e.target.value)} placeholder="e.g. 92.7789" className={INPUT_CLS} />
                                  </div>
                                </div>
                                {manualError && <p className="text-xs font-medium text-red-500">{manualError}</p>}
                                <div className="flex justify-end">
                                  <button onClick={handleManualApply} className={BTN_PRIMARY_CLS}>Apply</button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* Geofence radius slider & Test */}
                    {coords && (
                      <div className="space-y-6 pt-2">
                        <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 space-y-4">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Geofence Radius</label>
                            <span className="text-sm font-mono bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5 rounded text-zinc-900 dark:text-zinc-100">{radius}m</span>
                          </div>
                          <input 
                            type="range" min={10} max={200} step={5} value={radius}
                            onChange={e => setRadius(Number(e.target.value))}
                            className="w-full accent-zinc-900 dark:accent-zinc-100" 
                          />
                          <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
                            <span>10m (Strict)</span>
                            <span>200m (Loose)</span>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-lg border border-indigo-100 dark:border-indigo-900/30 bg-indigo-50/50 dark:bg-indigo-950/20">
                          <div>
                            <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-300">Test Geofence</p>
                            <p className="text-xs text-indigo-700 dark:text-indigo-400 mt-0.5">Verify if you are within the boundary.</p>
                          </div>
                          <button 
                            onClick={handleTest} 
                            disabled={gettingTest}
                            className="inline-flex w-full sm:w-auto items-center justify-center rounded-md text-sm font-medium transition-colors bg-indigo-600 text-white hover:bg-indigo-700 h-9 px-4 py-2 disabled:opacity-50 shrink-0"
                          >
                            {gettingTest ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Navigation className="w-4 h-4 mr-2" />}
                            Test Boundary
                          </button>
                        </div>

                        {testDistance !== null && (
                          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className={`flex items-center gap-2 text-sm font-medium p-3 rounded-md border ${testDistance <= radius ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50" : "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/50"}`}>
                            {testDistance <= radius
                              ? <><CheckCircle2 className="w-4 h-4 shrink-0" /> Distance: {testDistance}m — Inside</>
                              : <><XCircle className="w-4 h-4 shrink-0" /> Distance: {testDistance}m — Outside (need ≤{radius}m)</>
                            }
                          </motion.div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Save Footer - Stuck to bottom */}
                  <div className="p-4 sm:p-6 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 shrink-0">
                    <button 
                      onClick={handleSave} 
                      disabled={saving || !coords}
                      className={`w-full flex items-center justify-center rounded-md text-sm font-medium transition-colors h-11 px-8 disabled:opacity-50 ${
                        saveSuccess
                          ? "bg-emerald-600 text-white hover:bg-emerald-700"
                          : "bg-zinc-900 text-zinc-50 hover:bg-zinc-900/90 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-50/90"
                      }`}
                    >
                      {saving 
                        ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving Configuration...</> 
                        : saveSuccess 
                        ? <><CheckCircle2 className="w-4 h-4 mr-2" /> Saved Successfully!</> 
                        : <><Save className="w-4 h-4 mr-2" /> Save Configuration</>
                      }
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}