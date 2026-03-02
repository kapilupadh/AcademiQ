import React from "react";
import { Navigate } from "react-router-dom";

/**
 * A wrapper component to enforce authentication and role-based access control (RBAC).
 *
 * @param {Array<number>} allowedRoles - The roles allowed to access this route (1: Admin, 2: Teacher, 3: Student)
 * @param {React.ReactNode} children - The protected UI content
 */
export default function ProtectedRoute({ allowedRoles, children }) {
  const token = localStorage.getItem("token");
  const userStr = localStorage.getItem("user");

  // If there's no token or no user, they are not authenticated.
  if (!token || !userStr) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(userStr);

    // If roles are defined and the user's role is NOT in the allowed list:
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      // Redirect them to their appropriate dashboard instead
      if (user.role === 1) return <Navigate to="/admin/dashboard" replace />;
      if (user.role === 2) return <Navigate to="/teacher/dashboard" replace />;
      if (user.role === 3) return <Navigate to="/dashboard" replace />;

      // Fallback if role is completely unknown
      return <Navigate to="/login" replace />;
    }

    // Role checks passed, render the protected content
    return children;
  } catch (error) {
    // If parsing user fails or storage is corrupted, force login
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return <Navigate to="/login" replace />;
  }
}
