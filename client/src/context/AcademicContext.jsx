// client/src/context/AcademicContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

const AcademicContext = createContext(null);

export function AcademicProvider({ children }) {
  const [departments, setDepartments] = useState([]);
  const [programs, setPrograms] = useState({}); // { [deptId]: [...programs] }
  const [loading, setLoading] = useState(true);

  // Fetch all departments once on app load
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { setLoading(false); return; }

    api.get("/academics/departments")
      .then(r => setDepartments(r.data))
      .catch(err => console.error("AcademicContext: failed to load departments", err))
      .finally(() => setLoading(false));
  }, []);

  // Fetch programs for a specific department (lazy — only when needed)
  // Caches results so it never fetches the same dept twice
  const getProgramsForDept = async (deptId) => {
    if (!deptId) return [];
    if (programs[deptId]) return programs[deptId]; // already cached

    try {
      const res = await api.get(`/academics/departments/${deptId}/programs`);
      setPrograms(prev => ({ ...prev, [deptId]: res.data }));
      return res.data;
    } catch (err) {
      console.error("AcademicContext: failed to load programs", err);
      return [];
    }
  };

  // Fetch subjects for a program, optional semester filter
  // Not cached — subjects are fetched fresh each time (smaller datasets)
  const getSubjectsForProgram = async (programId, semester = null) => {
    if (!programId) return [];
    try {
      const url = semester
        ? `/academics/programs/${programId}/subjects?semester=${semester}`
        : `/academics/programs/${programId}/subjects`;
      const res = await api.get(url);
      return res.data;
    } catch (err) {
      console.error("AcademicContext: failed to load subjects", err);
      return [];
    }
  };

  // Get my subjects (smart filtered by role — teacher/student/admin)
  const getMySubjects = async () => {
    try {
      const res = await api.get("/academics/my-subjects");
      return res.data;
    } catch (err) {
      console.error("AcademicContext: failed to load my subjects", err);
      return [];
    }
  };

  return (
    <AcademicContext.Provider value={{
      departments,          // full list, ready immediately
      loading,              // true while initial dept fetch is in progress
      getProgramsForDept,   // (deptId) => Promise<programs[]>
      getSubjectsForProgram,// (programId, semester?) => Promise<subjects[]>
      getMySubjects,        // () => Promise<subjects[]>  — role-aware
    }}>
      {children}
    </AcademicContext.Provider>
  );
}

// Hook — use anywhere in the app
// Example: const { departments, getProgramsForDept } = useAcademic();
export function useAcademic() {
  const ctx = useContext(AcademicContext);
  if (!ctx) throw new Error("useAcademic must be used inside AcademicProvider");
  return ctx;
}